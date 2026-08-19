export const SOCKET_EVENTS = {
  MESSAGE_SEND: 'message:send',
  MESSAGE_ACK: 'message:ack',
  MESSAGE_NEW: 'message:new',
  MESSAGE_ERROR: 'message:error',
} as const;

export type SocketEventName =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export type MessagePayload = {
  id: string;
  clientId: string;
  conversationId: string;
  senderId: string;
  content: string;
  contentType: string;
  createdAt: string;
};

export type MessageAckPayload = {
  message: MessagePayload;
};

export type MessageErrorPayload = {
  code: string;
  message: string;
  clientId?: string;
};

export type MessageSendPayload = {
  clientId: string;
  content: string;
  contentType: string;
  conversationId?: string;
  userId?: string;
};

export type ServerToClientEvents = {
  [SOCKET_EVENTS.MESSAGE_ACK]: (payload: MessageAckPayload) => void;
  [SOCKET_EVENTS.MESSAGE_NEW]: (payload: MessagePayload) => void;
  [SOCKET_EVENTS.MESSAGE_ERROR]: (payload: MessageErrorPayload) => void;
};

export type ClientToServerEvents = {
  [SOCKET_EVENTS.MESSAGE_SEND]: (payload: MessageSendPayload) => void;
};
