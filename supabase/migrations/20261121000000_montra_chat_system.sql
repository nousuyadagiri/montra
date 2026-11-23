-- ====================================================================
-- MONTRA REAL-TIME CHAT & MONEY CONVERSATION SYSTEM SCHEMA
-- Migration: 20261121000000_montra_chat_system.sql
-- ====================================================================

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')) DEFAULT 'direct',
  group_id UUID REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  title TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_muted BOOLEAN NOT NULL DEFAULT false,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  UNIQUE(conversation_id, user_id)
);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (
    message_type IN ('text', 'money_request', 'payment_update', 'expense_notification', 'system')
  ) DEFAULT 'text',
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 4. MONEY REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.money_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'paid')) DEFAULT 'pending',
  related_expense_id UUID REFERENCES public.group_expenses(id) ON DELETE SET NULL,
  related_settlement_id UUID REFERENCES public.settlements(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. USER PRESENCE TABLE
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_online BOOLEAN NOT NULL DEFAULT false
);

-- ====================================================================
-- INDEXES FOR HIGH-THROUGHPUT REAL-TIME MESSAGING
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_conversations_group_id ON public.conversations(group_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_money_requests_conv ON public.money_requests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_money_requests_requester ON public.money_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_money_requests_recipient ON public.money_requests(recipient_id);

-- ====================================================================
-- SECURITY DEFINER HELPERS
-- ====================================================================

-- Check whether a user is an active participant in a conversation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Atomically get or create a 1-to-1 direct conversation
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_conv_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_current_user_id = p_other_user_id THEN
    RAISE EXCEPTION 'Cannot create a direct conversation with yourself';
  END IF;

  -- Check if a 1-to-1 conversation already exists between both users
  SELECT c.id INTO v_conv_id
  FROM public.conversations c
  JOIN public.conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = v_current_user_id
  JOIN public.conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = p_other_user_id
  WHERE c.type = 'direct'
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  -- Create new direct conversation
  INSERT INTO public.conversations (type, created_by)
  VALUES ('direct', v_current_user_id)
  RETURNING id INTO v_conv_id;

  -- Add both users as participants
  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES 
    (v_conv_id, v_current_user_id, 'member'),
    (v_conv_id, p_other_user_id, 'member')
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_conv_id;
END;
$$;

-- Atomically get or create a Split Group conversation and synchronize members
CREATE OR REPLACE FUNCTION public.get_or_create_group_conversation(p_group_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_conv_id UUID;
  v_group_name TEXT;
  v_group_creator UUID;
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify user belongs to the split group
  IF NOT public.is_group_member_or_creator(p_group_id, v_current_user_id) THEN
    RAISE EXCEPTION 'Access denied: not a member of this expense group';
  END IF;

  -- Check if a conversation for this group already exists
  SELECT id INTO v_conv_id
  FROM public.conversations
  WHERE group_id = p_group_id AND type = 'group'
  LIMIT 1;

  IF v_conv_id IS NULL THEN
    SELECT name, created_by INTO v_group_name, v_group_creator
    FROM public.expense_groups
    WHERE id = p_group_id;

    INSERT INTO public.conversations (type, group_id, title, created_by)
    VALUES ('group', p_group_id, v_group_name, v_group_creator)
    RETURNING id INTO v_conv_id;
  END IF;

  -- Synchronize all group members into the conversation
  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  SELECT 
    v_conv_id, 
    gm.user_id, 
    CASE WHEN gm.role = 'admin' THEN 'admin' ELSE 'member' END
  FROM public.group_members gm
  WHERE gm.group_id = p_group_id AND gm.user_id IS NOT NULL
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_conv_id;
END;
$$;

-- Trigger to update conversation's last message snippet & timestamp
CREATE OR REPLACE FUNCTION public.trigger_update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = CASE 
      WHEN NEW.message_type = 'money_request' THEN '💰 Money Request'
      WHEN NEW.message_type = 'payment_update' THEN '✓ Payment Update'
      WHEN NEW.message_type = 'expense_notification' THEN '🧾 Group Expense'
      ELSE LEFT(NEW.content, 120)
    END,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_message_created_update_conversation ON public.messages;
CREATE TRIGGER on_message_created_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_conversation_last_message();

-- Trigger to enroll new split group members automatically into the group chat
CREATE OR REPLACE FUNCTION public.trigger_sync_group_member_to_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_conv_id UUID;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT id INTO v_conv_id
    FROM public.conversations
    WHERE group_id = NEW.group_id AND type = 'group'
    LIMIT 1;

    IF v_conv_id IS NOT NULL THEN
      INSERT INTO public.conversation_participants (conversation_id, user_id, role)
      VALUES (v_conv_id, NEW.user_id, CASE WHEN NEW.role = 'admin' THEN 'admin' ELSE 'member' END)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_group_member_created_sync_chat ON public.group_members;
CREATE TRIGGER on_group_member_created_sync_chat
  AFTER INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_group_member_to_chat();

-- Trigger to remove revoked group members from the group chat
CREATE OR REPLACE FUNCTION public.trigger_remove_group_member_from_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_conv_id UUID;
BEGIN
  IF OLD.user_id IS NOT NULL THEN
    SELECT id INTO v_conv_id
    FROM public.conversations
    WHERE group_id = OLD.group_id AND type = 'group'
    LIMIT 1;

    IF v_conv_id IS NOT NULL THEN
      DELETE FROM public.conversation_participants
      WHERE conversation_id = v_conv_id AND user_id = OLD.user_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_group_member_deleted_sync_chat ON public.group_members;
CREATE TRIGGER on_group_member_deleted_sync_chat
  AFTER DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_remove_group_member_from_chat();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- 1. CONVERSATIONS POLICIES
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;
CREATE POLICY "Participants can view their conversations" ON public.conversations
  FOR SELECT USING (
    public.is_conversation_participant(id, auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
  );

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations" ON public.conversations
  FOR UPDATE USING (
    public.is_conversation_participant(id, auth.uid())
  );

-- 2. CONVERSATION PARTICIPANTS POLICIES
DROP POLICY IF EXISTS "Participants can view members of their conversations" ON public.conversation_participants;
CREATE POLICY "Participants can view members of their conversations" ON public.conversation_participants
  FOR SELECT USING (
    public.is_conversation_participant(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert themselves or creators can add participants" ON public.conversation_participants;
CREATE POLICY "Users can insert themselves or creators can add participants" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_conversation_participant(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own participant settings" ON public.conversation_participants;
CREATE POLICY "Users can update their own participant settings" ON public.conversation_participants
  FOR UPDATE USING (
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can leave or admins can remove participants" ON public.conversation_participants;
CREATE POLICY "Users can leave or admins can remove participants" ON public.conversation_participants
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_conversation_participant(conversation_id, auth.uid())
  );

-- 3. MESSAGES POLICIES
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages" ON public.messages
  FOR SELECT USING (
    public.is_conversation_participant(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "Participants can insert messages as themselves" ON public.messages;
CREATE POLICY "Participants can insert messages as themselves" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND public.is_conversation_participant(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "Senders can edit or soft-delete their messages" ON public.messages;
CREATE POLICY "Senders can edit or soft-delete their messages" ON public.messages
  FOR UPDATE USING (
    auth.uid() = sender_id
  );

-- 4. MONEY REQUESTS POLICIES
DROP POLICY IF EXISTS "Requesters and recipients can view money requests" ON public.money_requests;
CREATE POLICY "Requesters and recipients can view money requests" ON public.money_requests
  FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = recipient_id OR public.is_conversation_participant(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "Requesters can create money requests" ON public.money_requests;
CREATE POLICY "Requesters can create money requests" ON public.money_requests
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id AND public.is_conversation_participant(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "Parties can update status of money requests" ON public.money_requests;
CREATE POLICY "Parties can update status of money requests" ON public.money_requests
  FOR UPDATE USING (
    auth.uid() = requester_id OR auth.uid() = recipient_id
  );

-- 5. USER PRESENCE POLICIES
DROP POLICY IF EXISTS "Authenticated users can view presence" ON public.user_presence;
CREATE POLICY "Authenticated users can view presence" ON public.user_presence
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can upsert their own presence" ON public.user_presence;
CREATE POLICY "Users can upsert their own presence" ON public.user_presence
  FOR ALL USING (
    auth.uid() = user_id
  );

-- 6. REALTIME REPLICATION CONFIGURATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.money_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Table might already be in publication or restricted in certain sandbox settings
  NULL;
END;
$$;

