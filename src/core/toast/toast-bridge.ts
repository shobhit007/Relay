type ToastListener = (message: string) => void;

let listener: ToastListener | null = null;

export function bindToastListener(next: ToastListener | null) {
  listener = next;
}

export function showToast(message: string) {
  listener?.(message);
}
