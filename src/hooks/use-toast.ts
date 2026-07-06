import * as React from "react";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners: Listener[] = [];

function emit() {
  listeners.forEach((l) => l(toasts));
}

export function toast(input: Omit<Toast, "id">) {
  const id = crypto.randomUUID();
  toasts = [...toasts, { ...input, id }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 5000);
}

export function useToast() {
  const [state, setState] = React.useState<Toast[]>(toasts);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  return {
    toasts: state,
    dismiss: (id: string) => {
      toasts = toasts.filter((t) => t.id !== id);
      emit();
    },
  };
}
