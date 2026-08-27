<script setup>
import { ref } from "vue";
import PiModal from "../PiModal.vue";
import { api, urls } from "../../api";
import { store, loadLabels } from "../../stores/models";
import { toast } from "../../stores/ui";
const props = defineProps({ modelValue: { type: Array, default: () => [] } });
const emit = defineEmits(["update:modelValue", "close"]);
const selected = ref([...props.modelValue]);
const name = ref("");
function toggle(n) {
  selected.value = selected.value.includes(n)
    ? selected.value.filter((x) => x !== n)
    : [...selected.value, n];
}
async function add() {
  try {
    await api.post(urls.labels, { name: name.value });
    name.value = "";
    await loadLabels();
  } catch (e) {
    toast(e.message, "error");
  }
}
function done() {
  emit("update:modelValue", selected.value);
  emit("close");
}
</script>
<template>
  <PiModal title="Labels" @close="emit('close')"
    ><div class="input-group mb-3">
      <input
        v-model="name"
        class="form-control"
        placeholder="New label"
        @keyup.enter="add"
      /><button class="btn btn-primary" @click="add">Add</button>
    </div>
    <div v-if="store.labels.length" class="d-flex flex-wrap gap-2">
      <button
        v-for="label in store.labels"
        :key="label.name"
        class="btn btn-sm"
        :class="
          selected.includes(label.name)
            ? 'btn-primary'
            : 'btn-outline-secondary'
        "
        @click="toggle(label.name)"
      >
        {{ label.name }}
      </button>
    </div>
    <p v-else class="text-muted">No labels yet.</p>
    <template #footer
      ><button class="btn btn-primary" @click="done">Done</button></template
    ></PiModal
  >
</template>
