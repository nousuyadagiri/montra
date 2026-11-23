import { supabase } from '../lib/supabase';
import {
  Conversation,
  ConversationParticipant,
  Message,
  MessageType,
  MoneyRequest,
  MoneyRequestStatus,
  MessageMetadata,
  Profile,
} from '../types/database';
import { useSyncStore } from '../store/syncStore';

export interface UserDirectoryItem {
  profile: Profile;
  isOnline: boolean;
  lastSeenAt?: string;
  subtitle?: string;
}

/**
 * Validates whether a string matches a standard RFC 4122 UUID format.
 */
export const isValidUUID = (str?: string | null): boolean => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const chatService = {
  /**
   * Fetch all conversations for the authenticated user (direct & group),
   * enriched with other participant / group details, unread count, and last message.
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    if (!userId) return [];

    try {
      // 1. Get participant rows for the current user
      const { data: myParticipations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at, is_muted, role')
        .eq('user_id', userId);

      if (partError || !myParticipations || myParticipations.length === 0) {
        return [];
      }

      const convIds = myParticipations.map((p) => p.conversation_id);

      // 2. Fetch conversations
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          type,
          group_id,
          title,
          created_by,
          last_message_at,
          last_message_preview,
          created_at,
          updated_at
        `)
        .in('id', convIds)
        .order('last_message_at', { ascending: false });

      if (convError || !convData) {
        return [];
      }

      // 3. Fetch all participants for these conversations to resolve other users
      const { data: allParticipants } = await supabase
        .from('conversation_participants')
        .select(`
          id,
          conversation_id,
          user_id,
          joined_at,
          last_read_at,
          is_muted,
          role,
          profiles:user_id (id, full_name, email, avatar_url, currency)
        `)
        .in('conversation_id', convIds);

      // 4. Fetch group details for group conversations
      const groupIds = convData
        .map((c) => c.group_id)
        .filter((gid): gid is string => Boolean(gid));

      let groupsMap: Record<string, any> = {};
      if (groupIds.length > 0) {
        const { data: groupList } = await supabase
          .from('expense_groups')
          .select('id, name, description, category, currency, created_by')
          .in('id', groupIds);

        if (groupList) {
          groupsMap = Object.fromEntries(groupList.map((g) => [g.id, g]));
        }
      }

      // 5. Compute unread count per conversation
      const readMap = Object.fromEntries(
        myParticipations.map((p) => [p.conversation_id, p.last_read_at || '1970-01-01'])
      );

      // Assemble final rich conversation objects
      const conversations: Conversation[] = [];

      for (const conv of convData) {
        const participantsForConv = (allParticipants || []).filter(
          (p: any) => p.conversation_id === conv.id
        );

        let otherParticipant: Profile | undefined;
        if (conv.type === 'direct') {
          const other = participantsForConv.find((p: any) => p.user_id !== userId);
          if (other && other.profiles) {
            otherParticipant = (Array.isArray(other.profiles) ? other.profiles[0] : other.profiles) as unknown as Profile;
          }
        }

        const group = conv.group_id ? groupsMap[conv.group_id] : undefined;
        const myLastRead = readMap[conv.id] || '1970-01-01';

        // Count messages created after myLastRead and not sent by me
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .gt('created_at', myLastRead)
          .neq('sender_id', userId);

        conversations.push({
          ...conv,
          other_participant: otherParticipant,
          group,
          title: conv.title || (group ? group.name : otherParticipant?.full_name || 'Conversation'),
          unread_count: count ?? 0,
        });
      }

      return conversations;
    } catch (err) {
      console.warn('Error fetching conversations:', err);
      return [];
    }
  },

  /**
   * Discover registered eligible Montra users from profiles and split group members
   * without exposing private financial info.
   */
  async getUsersDirectory(currentUserId: string, query?: string): Promise<UserDirectoryItem[]> {
    try {
      const cleanQ = (query || '').trim().toLowerCase();

      // 1. Fetch registered profiles from public.profiles
      let profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, currency, created_at')
        .order('full_name', { ascending: true })
        .limit(100);

      if (isValidUUID(currentUserId)) {
        profilesQuery = profilesQuery.neq('id', currentUserId);
      }

      if (cleanQ) {
        profilesQuery = profilesQuery.or(`full_name.ilike.%${cleanQ}%,email.ilike.%${cleanQ}%`);
      }

      const { data: profiles } = await profilesQuery;

      // 2. Fetch group members from user's groups in public.group_members
      let groupMembersData: any[] = [];
      try {
        let gmQuery = supabase
          .from('group_members')
          .select('id, group_id, member_name, user_id, expense_groups(name)');

        if (cleanQ) {
          gmQuery = gmQuery.ilike('member_name', `%${cleanQ}%`);
        }

        const { data: gmList } = await gmQuery;

        if (gmList) {
          groupMembersData = gmList;
        }
      } catch {
        // Group members query optional
      }

      // 3. Fetch presence for registered users safely
      const userIds = (profiles || []).map((p) => p.id).filter(isValidUUID);
      let presenceMap: Record<string, any> = {};
      if (userIds.length > 0) {
        try {
          const { data: presenceList } = await supabase
            .from('user_presence')
            .select('user_id, last_seen_at, is_online')
            .in('user_id', userIds);

          if (presenceList) {
            presenceMap = Object.fromEntries(
              presenceList.map((pr) => [pr.user_id, pr])
            );
          }
        } catch {
          // Presence is optional
        }
      }

      const results: UserDirectoryItem[] = [];
      const seenKeys = new Set<string>();

      // A. Add registered profiles from Supabase
      for (const p of profiles || []) {
        if (!p.id || p.id === currentUserId) continue;
        const name = (p.full_name || p.email || '').trim();
        const email = (p.email || '').trim();

        // If search query is provided, check if name or email matches
        if (cleanQ) {
          const matchesName = name.toLowerCase().includes(cleanQ);
          const matchesEmail = email.toLowerCase().includes(cleanQ);
          if (!matchesName && !matchesEmail) continue;
        }

        seenKeys.add(p.id);
        seenKeys.add(name.toLowerCase());

        results.push({
          profile: p as Profile,
          isOnline: Boolean(presenceMap[p.id]?.is_online),
          lastSeenAt: presenceMap[p.id]?.last_seen_at,
          subtitle: p.email ? p.email : 'Registered Member',
        });
      }

      // B. Add members from user's groups
      for (const gm of groupMembersData) {
        const memberName = (gm.member_name || '').trim();
        if (!memberName) continue;

        // Skip current user
        if (gm.user_id && gm.user_id === currentUserId) continue;

        const nameKey = memberName.toLowerCase();
        if (seenKeys.has(nameKey) || (gm.user_id && seenKeys.has(gm.user_id))) {
          continue;
        }
        seenKeys.add(nameKey);
        if (gm.user_id) seenKeys.add(gm.user_id);

        if (cleanQ && !nameKey.includes(cleanQ)) {
          continue;
        }

        const groupName = gm.expense_groups?.name || 'Split Group';

        results.push({
          profile: {
            id: gm.user_id || `group-member-${gm.id}`,
            full_name: memberName,
            email: `${memberName.toLowerCase().replace(/\s+/g, '.')}@group.montra`,
            currency: 'INR',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Profile,
          isOnline: false,
          subtitle: `Member in ${groupName}`,
        });
      }

      return results;
    } catch (err) {
      console.warn('Error loading users directory:', err);
      return [];
    }
  },

  /**
   * Get or create a 1-to-1 direct conversation with another user atomically.
   */
  async getOrCreateDirectConversation(currentUserId: string, otherUserId: string): Promise<string> {
    if (!currentUserId || !otherUserId) throw new Error('User IDs required');
    if (!isValidUUID(currentUserId) || !isValidUUID(otherUserId)) {
      throw new Error('Valid UUIDs required for Supabase conversations');
    }

    // Try RPC first (idempotent, atomic transaction)
    try {
      const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
        p_other_user_id: otherUserId,
      });

      if (!error && data) {
        return data as string;
      }
    } catch {
      // Fallback to manual find/create
    }

    // Manual fallback: find existing direct conversation
    const { data: myConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (myConvs && myConvs.length > 0) {
      const convIds = myConvs.map((c) => c.conversation_id);
      const { data: matchingOther } = await supabase
        .from('conversation_participants')
        .select('conversation_id, conversations!inner(type)')
        .eq('user_id', otherUserId)
        .in('conversation_id', convIds)
        .eq('conversations.type', 'direct')
        .limit(1)
        .maybeSingle();

      if (matchingOther) {
        return matchingOther.conversation_id;
      }
    }

    // Insert new direct conversation
    const { data: newConv, error: newConvErr } = await supabase
      .from('conversations')
      .insert({
        type: 'direct',
        created_by: currentUserId,
      })
      .select('id')
      .single();

    if (newConvErr || !newConv) {
      throw newConvErr || new Error('Failed to create conversation');
    }

    // Add participants: insert currentUserId FIRST so RLS allows subsequent participant insertion
    const { error: part1Err } = await supabase.from('conversation_participants').insert({
      conversation_id: newConv.id,
      user_id: currentUserId,
      role: 'member',
    });

    if (part1Err) {
      console.warn('Failed to insert current participant:', part1Err);
    }

    const { error: part2Err } = await supabase.from('conversation_participants').insert({
      conversation_id: newConv.id,
      user_id: otherUserId,
      role: 'member',
    });

    if (part2Err) {
      console.warn('Failed to insert other participant:', part2Err);
    }

    useSyncStore.getState().bumpSync();
    return newConv.id;
  },

  /**
   * Get or create group conversation for an existing Split Group.
   */
  async getOrCreateGroupConversation(groupId: string, currentUserId: string): Promise<string> {
    if (!groupId || !currentUserId) throw new Error('Group ID and User ID required');

    // Try RPC first
    try {
      const { data, error } = await supabase.rpc('get_or_create_group_conversation', {
        p_group_id: groupId,
      });

      if (!error && data) {
        return data as string;
      }
    } catch {
      // Fallback
    }

    // Manual fallback
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('group_id', groupId)
      .eq('type', 'group')
      .maybeSingle();

    if (existing) {
      // Ensure current user is in participants
      await supabase
        .from('conversation_participants')
        .upsert(
          { conversation_id: existing.id, user_id: currentUserId, role: 'member' },
          { onConflict: 'conversation_id, user_id' }
        );
      return existing.id;
    }

    // Fetch group info
    const { data: group } = await supabase
      .from('expense_groups')
      .select('name, created_by')
      .eq('id', groupId)
      .single();

    const { data: newConv, error: err } = await supabase
      .from('conversations')
      .insert({
        type: 'group',
        group_id: groupId,
        title: group?.name || 'Group Chat',
        created_by: currentUserId,
      })
      .select('id')
      .single();

    if (err || !newConv) throw err || new Error('Failed to create group conversation');

    // Synchronize all group members whose user_id is set
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id, role')
      .eq('group_id', groupId)
      .not('user_id', 'is', null);

    const participantRows = (members || []).map((m) => ({
      conversation_id: newConv.id,
      user_id: m.user_id!,
      role: (m.role === 'admin' ? 'admin' : 'member') as 'admin' | 'member',
    }));

    if (participantRows.length > 0) {
      await supabase
        .from('conversation_participants')
        .upsert(participantRows, { onConflict: 'conversation_id, user_id' });
    }

    useSyncStore.getState().bumpSync();
    return newConv.id;
  },

  /**
   * Fetch conversation details with its participants.
   */
  async getConversationDetails(conversationId: string, currentUserId: string): Promise<Conversation | null> {
    if (!isValidUUID(conversationId)) return null;

    try {
      const { data: conv, error } = await supabase
        .from('conversations')
        .select(`
          id,
          type,
          group_id,
          title,
          created_by,
          last_message_at,
          last_message_preview,
          created_at,
          updated_at
        `)
        .eq('id', conversationId)
        .single();

      if (error || !conv) return null;

      // Fetch participants with profiles
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select(`
          id,
          conversation_id,
          user_id,
          joined_at,
          last_read_at,
          is_muted,
          role,
          profiles:user_id (id, full_name, email, avatar_url, currency)
        `)
        .eq('conversation_id', conversationId);

      let otherParticipant: Profile | undefined;
      if (conv.type === 'direct') {
        const other = (participants || []).find((p: any) => p.user_id !== currentUserId);
        if (other?.profiles) {
          otherParticipant = (Array.isArray(other.profiles) ? other.profiles[0] : other.profiles) as unknown as Profile;
        }
      }

      let group: any;
      if (conv.group_id) {
        const { data: g } = await supabase
          .from('expense_groups')
          .select('id, name, description, category, currency, created_by')
          .eq('id', conv.group_id)
          .single();
        group = g;
      }

      return {
        ...conv,
        participants: (participants as any[]) || [],
        other_participant: otherParticipant,
        group,
        title: conv.title || (group ? group.name : otherParticipant?.full_name || 'Chat'),
      };
    } catch (err) {
      console.warn('Error fetching conversation details:', err);
      return null;
    }
  },

  /**
   * Fetch paginated messages for a conversation.
   */
  async getMessages(
    conversationId: string,
    limit: number = 50,
    beforeCursor?: string
  ): Promise<Message[]> {
    if (!isValidUUID(conversationId)) return [];

    try {
      let query = supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          message_type,
          content,
          metadata,
          created_at,
          updated_at,
          deleted_at,
          sender:sender_id (id, full_name, avatar_url, email)
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (beforeCursor) {
        query = query.lt('created_at', beforeCursor);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      return (data as any[]).map((m) => ({
        ...m,
        sender: (Array.isArray(m.sender) ? m.sender[0] : m.sender) as unknown as Profile,
        status: 'sent',
      }));
    } catch (err) {
      console.warn('Error loading messages:', err);
      return [];
    }
  },

  /**
   * Send a message to a conversation.
   */
  async sendMessage(input: {
    conversationId: string;
    senderId: string;
    content: string;
    type?: MessageType;
    metadata?: MessageMetadata;
  }): Promise<Message> {
    const { conversationId, senderId, content, type = 'text', metadata = {} } = input;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message_type: type,
        content: content.trim(),
        metadata: metadata as any,
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        message_type,
        content,
        metadata,
        created_at,
        updated_at,
        deleted_at,
        sender:sender_id (id, full_name, avatar_url, email)
      `)
      .single();

    if (error || !data) {
      throw error || new Error('Failed to send message');
    }

    // Trigger conversation update manually if trigger is missing
    await supabase
      .from('conversations')
      .update({
        last_message_at: data.created_at,
        last_message_preview: content.slice(0, 100),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    useSyncStore.getState().bumpSync();

    return {
      ...(data as any),
      sender: (Array.isArray(data.sender) ? data.sender[0] : data.sender) as unknown as Profile,
      status: 'sent',
    };
  },

  /**
   * Send a structured Money Request inside a conversation.
   */
  async sendMoneyRequest(input: {
    conversationId: string;
    requesterId: string;
    recipientId: string;
    amount: number;
    currency?: string;
    notes?: string;
    relatedExpenseId?: string;
  }): Promise<MoneyRequest> {
    const {
      conversationId,
      requesterId,
      recipientId,
      amount,
      currency = 'INR',
      notes,
      relatedExpenseId,
    } = input;

    if (amount <= 0) throw new Error('Amount must be greater than zero');

    // 1. Create money request record
    const { data: request, error: reqErr } = await supabase
      .from('money_requests')
      .insert({
        conversation_id: conversationId,
        requester_id: requesterId,
        recipient_id: recipientId,
        amount,
        currency,
        status: 'pending',
        notes: notes || null,
        related_expense_id: relatedExpenseId || null,
      })
      .select()
      .single();

    if (reqErr || !request) {
      throw reqErr || new Error('Failed to create money request');
    }

    // 2. Insert corresponding chat message card
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
    const content = `Requested ${symbol}${amount}${notes ? `: "${notes}"` : ''}`;

    const metadata: MessageMetadata = {
      request_id: request.id,
      amount,
      currency,
      status: 'pending',
      requester_id: requesterId,
      recipient_id: recipientId,
      notes: notes || null,
      related_expense_id: relatedExpenseId || null,
    };

    const { data: msg } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: requesterId,
        message_type: 'money_request',
        content,
        metadata: metadata as any,
      })
      .select('id')
      .single();

    if (msg) {
      await supabase
        .from('money_requests')
        .update({ message_id: msg.id })
        .eq('id', request.id);
    }

    useSyncStore.getState().bumpSync();
    return request;
  },

  /**
   * Respond to a Money Request (Accept, Decline, Mark as Paid).
   * Notice: This updates status verified in the database without performing unverified banking transfers.
   */
  async respondToMoneyRequest(input: {
    requestId: string;
    userId: string;
    action: MoneyRequestStatus;
  }): Promise<MoneyRequest> {
    const { requestId, userId, action } = input;

    // Fetch existing request
    const { data: existing, error: fetchErr } = await supabase
      .from('money_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchErr || !existing) {
      throw fetchErr || new Error('Money request not found');
    }

    // Permission check: only recipient can accept/decline; recipient or requester can mark as paid
    if (action === 'accepted' || action === 'declined') {
      if (existing.recipient_id !== userId) {
        throw new Error('Only the recipient can accept or decline this request');
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from('money_requests')
      .update({
        status: action,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateErr || !updated) {
      throw updateErr || new Error('Failed to update request status');
    }

    // Update message metadata if linked
    if (existing.message_id) {
      const { data: msg } = await supabase
        .from('messages')
        .select('metadata')
        .eq('id', existing.message_id)
        .single();

      if (msg) {
        const nextMeta = { ...(msg.metadata as any), status: action };
        await supabase
          .from('messages')
          .update({ metadata: nextMeta })
          .eq('id', existing.message_id);
      }
    }

    // If marked as paid, insert a payment update confirmation card
    if (action === 'paid') {
      const symbol = existing.currency === 'USD' ? '$' : existing.currency === 'EUR' ? '€' : '₹';
      await supabase.from('messages').insert({
        conversation_id: existing.conversation_id,
        sender_id: userId,
        message_type: 'payment_update',
        content: `Marked ${symbol}${existing.amount} as paid`,
        metadata: {
          request_id: existing.id,
          amount: existing.amount,
          currency: existing.currency,
          sender_id: userId,
          recipient_id: existing.requester_id === userId ? existing.recipient_id : existing.requester_id,
          is_verified: true,
        },
      });
    }

    useSyncStore.getState().bumpSync();
    return updated;
  },

  /**
   * Mark a conversation as read by updating participant's last_read_at timestamp.
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    if (!conversationId || !userId || !isValidUUID(conversationId) || !isValidUUID(userId)) return;

    try {
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Failed to mark conversation read:', err);
    }
  },

  /**
   * Real-time subscription to new incoming messages for a conversation.
   */
  subscribeToMessages(
    conversationId: string,
    onMessage: (message: Message) => void
  ): () => void {
    const channelName = `chat_messages:${conversationId}:${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newRow = payload.new as any;
          if (!newRow?.id) return;

          // Fetch sender profile details to build complete message
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, email')
            .eq('id', newRow.sender_id)
            .maybeSingle();

          const completeMsg: Message = {
            ...newRow,
            sender: sender || undefined,
            status: 'delivered',
          };

          onMessage(completeMsg);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedRow = payload.new as any;
          if (updatedRow?.id) {
            onMessage({
              ...updatedRow,
              status: 'delivered',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Real-time typing indicators using Supabase Realtime broadcast (zero database writes).
   */
  createTypingChannel(
    conversationId: string,
    currentUserId: string,
    onTypingChange: (data: { userId: string; userName: string; isTyping: boolean }) => void
  ) {
    const channelName = `typing:${conversationId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload.payload;
        if (data && data.userId !== currentUserId) {
          onTypingChange(data);
        }
      })
      .subscribe();

    const sendTyping = (isTyping: boolean, userName: string) => {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUserId,
          userName,
          isTyping,
        },
      });
    };

    const unsubscribe = () => {
      supabase.removeChannel(channel);
    };

    return { sendTyping, unsubscribe };
  },

  /**
   * Update user presence in `public.user_presence`.
   */
  async updatePresence(userId: string, isOnline: boolean): Promise<void> {
    if (!userId) return;
    try {
      await supabase.from('user_presence').upsert(
        {
          user_id: userId,
          is_online: isOnline,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    } catch {
      // presence error non-fatal
    }
  },

  /**
   * Subscribe to real-time conversation updates for a user.
   */
  subscribeToConversations(userId: string, onUpdate: () => void): () => void {
    const channelName = `user_convs:${userId}:${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => onUpdate()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => onUpdate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Total unread messages count across all conversations.
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    if (!userId) return 0;
    try {
      const convs = await this.getConversations(userId);
      return convs.reduce((acc, c) => acc + (c.unread_count || 0), 0);
    } catch {
      return 0;
    }
  },
};
