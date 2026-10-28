// پیام‌های کوتاه (toast) و پنجره تایید، جایگزین alert و confirm مرورگر

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  id: number;
  resolve: (value: boolean) => void;
}

interface FeedbackState {
  toasts: Toast[];
  confirm: ConfirmRequest | null;
}

const TOAST_DURATION = 3500;

let state: FeedbackState = { toasts: [], confirm: null };
let nextId = 1;
const listeners = new Set<() => void>();

const setState = (next: FeedbackState) => {
  state = next;
  listeners.forEach((l) => l());
};

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getFeedbackState = () => state;

export const dismissToast = (id: number) => {
  setState({ ...state, toasts: state.toasts.filter((t) => t.id !== id) });
};

const push = (type: ToastType, message: string) => {
  const id = nextId++;
  setState({ ...state, toasts: [...state.toasts, { id, type, message }] });
  setTimeout(() => dismissToast(id), TOAST_DURATION);
};

export const notify = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  info: (message: string) => push('info', message),
};

/** Opens the confirm dialog; resolves true when the user confirms */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    state.confirm?.resolve(false);
    setState({ ...state, confirm: { ...options, id: nextId++, resolve } });
  });
}

export function resolveConfirm(value: boolean) {
  const current = state.confirm;
  if (!current) return;
  setState({ ...state, confirm: null });
  current.resolve(value);
}
