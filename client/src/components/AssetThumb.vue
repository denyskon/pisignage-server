<script setup>
import { Music, FileText } from "@lucide/vue";
import { computed } from "vue";
import { fileTypeOf } from "../utils/format";

const props = defineProps({
  fileDetails: { type: Object, required: true },
  size: { type: String, default: "md" }, // sm | md | lg
});

const type = computed(
  () => props.fileDetails?.type || fileTypeOf(props.fileDetails?.name),
);
const letter = computed(() => (type.value || "N").slice(0, 1).toUpperCase());
const isAudio = computed(
  () => type.value === "audio" || type.value === "radio",
);
const dims = { sm: 40, md: 56, lg: 72 };
</script>

<template>
  <div
    class="asset-thumb"
    :class="'size-' + size"
    :style="{ width: dims[size] + 'px', height: dims[size] + 'px' }"
  >
    <img
      v-if="fileDetails?.thumbnail"
      :src="fileDetails.thumbnail"
      alt=""
      loading="lazy"
    />
    <div
      v-else
      class="letterbox d-flex align-items-center justify-content-center"
    >
      <Music v-if="isAudio" :size="dims[size] / 2" />
      <span v-else>{{ letter }}</span>
    </div>
  </div>
</template>

<style scoped>
.asset-thumb {
  border-radius: 8px;
  overflow: hidden;
  flex: none;
  background: #f1f5f9;
}
.asset-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.letterbox {
  width: 100%;
  height: 100%;
  background: #e2e8f0;
  color: #64748b;
  font-weight: 600;
}
</style>
