import { ConversationManager } from '../src/services/ConversationManager';

describe('ConversationManager', () => {
  const mgr = new ConversationManager('test-key');

  it('starts with no active conversation', () => {
    expect(mgr.currentConversation).toBeNull();
  });

  it('startNewConversation creates a conversation', () => {
    mgr.startNewConversation();
    expect(mgr.currentConversation).not.toBeNull();
  });

  it('addMessage appends to current conversation', () => {
    mgr.startNewConversation();
    mgr.addMessage('user', 'hello');
    expect(mgr.currentConversation!.messages.length).toBe(1);
    expect(mgr.currentConversation!.messages[0].content).toBe('hello');
  });

  it('addMessage throws when no active conversation', () => {
    // Create fresh manager to ensure no active conversation
    const fresh = new ConversationManager('key');
    expect(() => fresh.addMessage('user', 'test')).toThrow('No active conversation');
  });

  it('endConversation clears current conversation', () => {
    mgr.startNewConversation();
    mgr.endConversation();
    expect(mgr.currentConversation).toBeNull();
  });

  it('getConversationHistory returns ended conversations', () => {
    mgr.startNewConversation();
    mgr.addMessage('user', 'test msg');
    mgr.endConversation();
    const history = mgr.getConversationHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[history.length - 1].messages[0].content).toBe('test msg');
  });
});
