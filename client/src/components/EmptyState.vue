<script setup>
defineProps({
  icon: { type: [Object, Function], default: null },
  title: { type: String, required: true },
  message: { type: String, default: "" },
});
</script>

<template>
  <div class="pi-empty">
    <div class="pi-empty-icon">
      <slot name="icon">
        <component :is="icon" v-if="icon" :size="28" />
      </slot>
    </div>
    <h4>{{ title }}</h4>
    <p v-if="message">{{ message }}</p>
    <slot />
  </div>
</template>
