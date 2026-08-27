<script setup>
import { computed, ref } from "vue";
import { Plus, Trash2, Tags } from "@lucide/vue";
import PiModal from "../PiModal.vue";
import EmptyState from "../EmptyState.vue";
import { api, urls } from "../../api";
import { store, loadLabels } from "../../stores/models";
import { toast, confirmDialog } from "../../stores/ui";
const e = defineEmits(["close", "selected"]);
const edit = ref(false),
  name = ref("");
const labels = computed(() =>
  store.labels
    .filter((x) => x.mode === "players")
    .sort((a, b) => a.name.localeCompare(b.name)),
);
async function add() {
  if (!name.value) return;
  if (labels.value.some((x) => x.name === name.value)) {
    name.value = "Label exists";
    return;
  }
  try {
    await api.post(urls.labels, { name: name.value, mode: "players" });
    name.value = "";
    await loadLabels();
    toast("Label created");
  } catch (x) {
    toast(x.message, "error");
  }
}
async function remove(l) {
  if (
    !(await confirmDialog({
      title: "Delete label?",
      message: `Do you want to delete the Label ${l.name}?`,
    }))
  )
    return;
  try {
    await api.del(urls.labels + l._id);
    await loadLabels();
    toast("Label deleted");
  } catch (x) {
    toast(x.message, "error");
  }
}
function select(l) {
  if (!edit.value)
    e("selected", store.selectedPlayerLabel === l.name ? null : l.name);
}
</script>
<template>
  <PiModal title="Player labels" @close="e('close')"
    ><div class="d-flex justify-content-end">
      <button class="btn btn-sm btn-outline-secondary" @click="edit = !edit">
        {{ edit ? "Done" : "Edit" }}
      </button>
    </div>
    <form class="input-group my-3" @submit.prevent="add">
      <input
        v-model="name"
        class="form-control"
        placeholder="Add a new label"
      /><button class="btn btn-primary"><Plus :size="16" /></button>
    </form>
    <div v-if="labels.length" class="list-group">
      <button
        v-for="l in labels"
        :key="l._id"
        class="list-group-item list-group-item-action d-flex"
        :class="{ active: store.selectedPlayerLabel === l.name }"
        @click="select(l)"
      >
        {{ l.name
        }}<span class="ms-auto"
          >{{ edit ? "" : store.labelsCount[l.name] || 0
          }}<Trash2
            v-if="edit"
            :size="16"
            class="text-danger"
            @click.stop="remove(l)"
        /></span>
      </button>
    </div>
    <EmptyState
      v-else
      :icon="Tags"
      title="No player labels"
      message="Create a label to organize players."
  /></PiModal>
</template>
