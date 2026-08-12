type CurrentUserIdSetter = (userId: string | null) => void;

let setCurrentUserId: CurrentUserIdSetter | null = null;

export function bindCurrentUserIdSetter(setter: CurrentUserIdSetter | null) {
  setCurrentUserId = setter;
}

export function notifyCurrentUserId(userId: string | null) {
  setCurrentUserId?.(userId);
}
