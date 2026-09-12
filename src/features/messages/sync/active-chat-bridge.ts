type ActiveChat = {
  localConversationId: string;
  currentUserId: string;
};

let activeChat: ActiveChat | null = null;

export function setActiveChat(chat: ActiveChat | null): void {
  activeChat = chat;
}

export function getActiveChat(): ActiveChat | null {
  return activeChat;
}
