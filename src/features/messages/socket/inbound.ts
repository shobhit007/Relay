import { SOCKET_EVENTS, socketManager } from '@shared/socket';

import { messageService } from '../services/message.service';

export function registerMessageInboundHandlers(
  getCurrentUserId: () => string | null,
): () => void {
  const unsubscribe = socketManager.on(
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

  return unsubscribe;
}
