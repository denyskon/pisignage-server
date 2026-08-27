<script setup>
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "@lucide/vue";
import { toasts, dismissToast } from "../stores/ui";

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};
</script>

<template>
  <div class="pi-toasts">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="pi-toast"
      :class="t.type"
      role="alert"
    >
      <component
        :is="icons[t.type] || Info"
        :size="18"
        class="flex-shrink-0 mt-0.5"
        :style="{
          color:
            t.type === 'success'
              ? 'var(--pi-success)'
              : t.type === 'error'
                ? 'var(--pi-danger)'
                : t.type === 'warning'
                  ? 'var(--pi-warning)'
                  : 'var(--pi-primary)',
        }"
      />
      <div class="flex-grow-1">{{ t.message }}</div>
      <button
        class="btn btn-sm btn-link text-muted p-0"
        @click="dismissToast(t.id)"
        aria-label="Dismiss"
      >
        <X :size="15" />
      </button>
    </div>
  </div>
</template>
