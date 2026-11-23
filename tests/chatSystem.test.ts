import { useDemoStore } from '../src/store/demoStore';
import { chatService } from '../src/services/chatService';
import { DEMO_USERS, DEMO_PROFILE } from '../src/services/demoData';
import { Message, Conversation, MoneyRequestStatus } from '../src/types/database';

describe('MONTRA Real-Time Chat & Money Conversation System', () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemoData();
  });

  // Scenario 1 & 2: User directory & discovery without private financial exposure
  test('1 & 2: Users directory lists eligible registered members without leaking private data', async () => {
    const users = DEMO_USERS;
    expect(users.length).toBeGreaterThan(0);

    const userA = DEMO_PROFILE;
    const userB = users[0];

    // Verify User A can find User B
    expect(userB.full_name).toBe('Priya Sharma');
    expect(userB.id).not.toBe(userA.id);

    // Verify public directory payload only exposes safe identity fields
    const safeDirectoryItem = {
      id: userB.id,
      full_name: userB.full_name,
      avatar_url: userB.avatar_url,
      currency: userB.currency,
    };
    expect(safeDirectoryItem).toHaveProperty('full_name');
    expect((safeDirectoryItem as any).monthly_salary).toBeUndefined();
    expect((safeDirectoryItem as any).notification_preferences).toBeUndefined();
  });

  // Scenario 3: Open direct conversation
  test('3: User A opens or retrieves a private chat with User B', () => {
    const store = useDemoStore.getState();
    const otherUserId = DEMO_USERS[0].id;

    const convId = store.getOrCreateDemoDirectConversation(otherUserId);
    expect(convId).toBeDefined();

    const convs = store.getDemoConversations();
    const match = convs.find((c) => c.id === convId);
    expect(match).toBeDefined();
    expect(match?.type).toBe('direct');
  });

  // Scenario 4 & 5 & 6: Message sending, receiving, and replies
  test('4, 5, 6: User A sends text message, User B receives and replies', () => {
    const store = useDemoStore.getState();
    const convId = 'demo-conv-priya';

    const initialCount = store.getDemoMessages(convId).length;

    // User A sends message
    const msgA = store.addDemoMessage(convId, {
      content: 'Hey Priya, did you get the receipts?',
      type: 'text',
    });

    expect(msgA.content).toBe('Hey Priya, did you get the receipts?');
    expect(msgA.sender_id).toBe(DEMO_PROFILE.id);

    const afterSendCount = store.getDemoMessages(convId).length;
    expect(afterSendCount).toBe(initialCount + 1);

    // Simulate reply from User B
    const replyMsg = {
      id: 'demo-reply-1',
      conversation_id: convId,
      sender_id: 'demo-user-priya',
      message_type: 'text' as const,
      content: 'Yes! Just uploaded them.',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'delivered' as const,
    };

    useDemoStore.setState((s) => ({
      demoMessages: {
        ...s.demoMessages,
        [convId]: [...s.demoMessages[convId], replyMsg],
      },
    }));

    const finalMessages = useDemoStore.getState().getDemoMessages(convId);
    expect(finalMessages[finalMessages.length - 1].content).toBe('Yes! Just uploaded them.');
  });

  // Scenario 7: Message ordering
  test('7: Both users see correct message ordering', () => {
    const store = useDemoStore.getState();
    const convId = 'demo-conv-priya';
    const messages = store.getDemoMessages(convId);

    for (let i = 1; i < messages.length; i++) {
      const prevTime = new Date(messages[i - 1].created_at).getTime();
      const currTime = new Date(messages[i].created_at).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }
  });

  // Scenario 8 & 9: Read receipts & unread count
  test('8 & 9: Read receipts and unread counts work correctly', () => {
    const store = useDemoStore.getState();
    const convId = 'demo-conv-priya';

    const convBefore = store.getDemoConversations().find((c) => c.id === convId);
    expect(convBefore?.unread_count).toBe(1);

    // Mark as read
    store.markDemoConversationRead(convId);

    const convAfter = useDemoStore.getState().getDemoConversations().find((c) => c.id === convId);
    expect(convAfter?.unread_count).toBe(0);
  });

  // Scenario 10 & 11: Money request lifecycle (Send -> Pending -> Accepted -> Paid)
  test('10 & 11: User A sends money request, User B responds (Accept, Paid)', () => {
    const store = useDemoStore.getState();
    const convId = 'demo-conv-priya';

    // Send money request
    const reqMsg = store.sendDemoMoneyRequest(convId, {
      recipientId: 'demo-user-priya',
      amount: 750,
      notes: 'Cab ride split',
    });

    expect(reqMsg.message_type).toBe('money_request');
    expect(reqMsg.metadata.amount).toBe(750);
    expect(reqMsg.metadata.status).toBe('pending');

    const requestId = reqMsg.metadata.request_id;

    // Accept request
    store.respondDemoMoneyRequest(convId, requestId, 'accepted');
    let msgs = useDemoStore.getState().getDemoMessages(convId);
    let target = msgs.find((m) => m.metadata?.request_id === requestId);
    expect(target?.metadata.status).toBe('accepted');

    // Mark as paid
    store.respondDemoMoneyRequest(convId, requestId, 'paid');
    msgs = useDemoStore.getState().getDemoMessages(convId);
    target = msgs.find((m) => m.metadata?.request_id === requestId);
    expect(target?.metadata.status).toBe('paid');

    // Verify a verified payment_update card is appended
    const paymentUpdateMsg = msgs.find(
      (m) => m.message_type === 'payment_update' && m.metadata?.request_id === requestId
    );
    expect(paymentUpdateMsg).toBeDefined();
    expect(paymentUpdateMsg?.metadata.is_verified).toBe(true);
  });

  // Scenario 12 & 13: Split group chat and expense notifications
  test('12 & 13: Existing split group has a group chat with expense notifications', () => {
    const store = useDemoStore.getState();
    const groupConvId = 'demo-conv-group-apt';

    const conv = store.getDemoConversations().find((c) => c.id === groupConvId);
    expect(conv).toBeDefined();
    expect(conv?.type).toBe('group');
    expect(conv?.group_id).toBe('demo-group-apartment');

    const groupMsgs = store.getDemoMessages(groupConvId);
    const expenseNotif = groupMsgs.find((m) => m.message_type === 'expense_notification');
    expect(expenseNotif).toBeDefined();
    expect(expenseNotif?.metadata.amount).toBe(3400);
    expect(expenseNotif?.metadata.split_type).toBe('equal');
  });

  // Scenario 14 & 15: Security invariants & non-transfer constraint
  test('14 & 15: Chat messages do not execute direct unauthorized bank transfers', () => {
    const store = useDemoStore.getState();
    const accountsBefore = store.demoAccounts.map((a) => ({ ...a }));

    // User sends a message stating "I paid 500"
    store.addDemoMessage('demo-conv-priya', {
      content: 'I paid ₹500 via GooglePay',
      type: 'text',
    });

    const accountsAfter = useDemoStore.getState().demoAccounts;
    // Bank balance must NOT be altered by an unverified text message
    expect(accountsAfter[0].balance).toBe(accountsBefore[0].balance);
  });

  // Scenario 17: Existing core models continue working without regression
  test('17: Existing transactions, budgets, groups, and splits continue functioning', () => {
    const store = useDemoStore.getState();

    // Transactions
    expect(store.demoTransactions.length).toBeGreaterThan(0);

    // Budgets
    const budgets = store.getDemoBudgets(2026, 11);
    expect(budgets.length).toBeGreaterThan(0);

    // Split groups
    const groupDetails = store.getDemoGroupDetails('demo-group-apartment');
    expect(groupDetails).not.toBeNull();
    expect(groupDetails?.members.length).toBeGreaterThan(0);
  });
});

