export {
  MESSAGE_STATUS,
  messages,
  type LocalMessage,
  type MessageStatus,
  type UpsertLocalMessageInput,
} from './db/schema';
export { messageService } from './services/message.service';
export { registerMessageInboundHandlers } from './socket/inbound';
