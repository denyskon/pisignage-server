<script setup>
import { X } from "@lucide/vue";

defineProps({
  title: { type: String, required: true },
  size: { type: String, default: "lg" }, // sm | lg | xl
  hideFooter: { type: Boolean, default: false },
});
const emit = defineEmits(["close"]);
</script>

<template>
  <div
    class="modal d-block"
    tabindex="-1"
    style="background: rgba(15, 23, 42, 0.45)"
    @click.self="emit('close')"
  >
    <div
      class="modal-dialog modal-dialog-centered modal-dialog-scrollable"
      :class="'modal-' + size"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ title }}</h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="emit('close')"
          ></button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <div v-if="!hideFooter" class="modal-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </div>
</template>
