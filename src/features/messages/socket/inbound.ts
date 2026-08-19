import { SOCKET_EVENTS, socketManager } from '@shared/socket';

import { messageService } from '../services/message.service';

export function registerMessageInboundHandlers(
  getCurrentUserId: () => string | null,
): () => void {
  const unsubscribeNew = socketManager.on(
    SOCKET_EVENTS.MESSAGE_NEW,
    (payload: unknown) => {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        return;
      }

      void messageService.handleIncomingMessage(payload, currentUserId).catch(
        (error) => {
          console.error('[messages] Failed to handle inbound message', error);
        },
      );
    },
  );

  const unsubscribeAck = socketManager.on(
    SOCKET_EVENTS.MESSAGE_ACK,
    (payload: unknown) => {
      void messageService.handleMessageAck(payload).catch((error) => {
        console.error('[messages] Failed to handle message ack', error);
      });
    },
  );

  const unsubscribeError = socketManager.on(
    SOCKET_EVENTS.MESSAGE_ERROR,
    (payload: unknown) => {
      void messageService.handleMessageError(payload).catch((error) => {
        console.error('[messages] Failed to handle message error', error);
      });
    },
  );

  return () => {
    unsubscribeNew();
    unsubscribeAck();
    unsubscribeError();
  };
}
