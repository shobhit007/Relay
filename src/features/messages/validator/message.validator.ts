const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type IncomingMessagePayload = {
  id: string;
  clientId: string;
  conversationId: string;
  senderId: string;
  content: string;
  contentType: string;
  createdAt: string;
};

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function requireUuid(value: unknown, field: string): string {
  const uuid = requireString(value, field);
  if (!UUID_REGEX.test(uuid)) {
    throw new Error(`${field} must be a valid UUID`);
  }
  return uuid;
}

function toIsoString(value: unknown, field: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`${field} must be a valid date`);
    }
    return date.toISOString();
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  throw new Error(`${field} is required`);
}

export function validateIncomingMessagePayload(
  payload: unknown,
): IncomingMessagePayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Message payload is required');
  }

  const data = payload as Record<string, unknown>;

  return {
    id: requireUuid(data.id, 'id'),
    clientId: requireUuid(data.clientId, 'clientId'),
    conversationId: requireUuid(data.conversationId, 'conversationId'),
    senderId: requireUuid(data.senderId, 'senderId'),
    content: requireString(data.content, 'content'),
    contentType: requireString(data.contentType, 'contentType'),
    createdAt: toIsoString(data.createdAt, 'createdAt'),
  };
}
