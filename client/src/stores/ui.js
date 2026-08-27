// Tiny global toast store + confirm dialog state.

import { reactive } from "vue";

let nextId = 1;

export const toasts = reactive([]);

export function toast(message, type = "success", timeout = 4000) {
  const id = nextId++;
  toasts.push({ id, message, type });
  if (timeout) setTimeout(() => dismissToast(id), timeout);
  return id;
}

export function dismissToast(id) {
  const i = toasts.findIndex((t) => t.id === id);
  if (i >= 0) toasts.splice(i, 1);
}

export const confirmState = reactive({
  open: false,
  title: "",
  message: "",
  confirmLabel: "Delete",
  danger: true,
  resolve: null,
});

export function confirmDialog({
  title = "Are you sure?",
  message = "",
  confirmLabel = "Delete",
  danger = true,
}) {
  return new Promise((resolve) => {
    confirmState.title = title;
    confirmState.message = message;
    confirmState.confirmLabel = confirmLabel;
    confirmState.danger = danger;
    confirmState.open = true;
    confirmState.resolve = resolve;
  });
}

export function resolveConfirm(answer) {
  confirmState.open = false;
  if (confirmState.resolve) confirmState.resolve(answer);
  confirmState.resolve = null;
}
