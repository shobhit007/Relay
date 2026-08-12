/**
 * Schema aggregation for the shared Drizzle client / migrations.
 * Feature tables are owned under features/<name>/db/schema and re-exported here.
 */

export {
  conversationParticipants,
  conversations,
} from '@features/conversations/db/schema';
export { users } from '@features/user/db/schema';
