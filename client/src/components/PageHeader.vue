<script setup>
defineProps({
  title: { type: String, required: true },
  icon: { type: [Object, Function], default: null },
});
</script>

<template>
  <header class="pi-page-header">
    <h1 class="pi-page-title">
      <component :is="icon" v-if="icon" :size="22" />
      {{ title }}
    </h1>
    <div v-if="$slots.actions" class="pi-page-actions">
      <slot name="actions" />
    </div>
  </header>
</template>
