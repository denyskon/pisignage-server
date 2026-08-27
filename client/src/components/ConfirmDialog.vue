<script setup>
import { confirmState, resolveConfirm } from "../stores/ui";
</script>

<template>
  <div
    v-if="confirmState.open"
    class="modal d-block"
    tabindex="-1"
    style="background: rgba(15, 23, 42, 0.45)"
    @click.self="resolveConfirm(false)"
  >
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ confirmState.title }}</h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Cancel"
            @click="resolveConfirm(false)"
          ></button>
        </div>
        <div class="modal-body">{{ confirmState.message }}</div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-outline-secondary"
            @click="resolveConfirm(false)"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn"
            :class="confirmState.danger ? 'btn-danger' : 'btn-primary'"
            @click="resolveConfirm(true)"
          >
            {{ confirmState.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
