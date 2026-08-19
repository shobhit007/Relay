const PREVIEW_MAX_LENGTH = 30;

export function buildMessagePreview(content: string): string {
  if (content.length <= PREVIEW_MAX_LENGTH) {
    return content;
  }

  return `${content.slice(0, PREVIEW_MAX_LENGTH)}...`;
}
