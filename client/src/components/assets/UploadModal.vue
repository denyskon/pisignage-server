<script setup>
import { ref } from "vue";
import PiModal from "../PiModal.vue";
import { api, urls } from "../../api";
import { store, loadLabels, loadFiles } from "../../stores/models";
import { toast } from "../../stores/ui";
const emit = defineEmits(["close", "saved"]);
const files = ref([]),
  progress = ref(0),
  stage = ref("pick"),
  selected = ref([]),
  busy = ref(false);
function choose(e) {
  files.value = [...e.target.files];
}
function toggle(n) {
  selected.value = selected.value.includes(n)
    ? selected.value.filter((x) => x !== n)
    : [...selected.value, n];
}
async function upload() {
  if (!files.value.length) return toast("Select at least one file", "error");
  busy.value = true;
  try {
    await api.upload(
      urls.files,
      files.value,
      "assets",
      (p) => (progress.value = p),
    );
    stage.value = "labels";
    await loadLabels();
  } catch (e) {
    toast(e.message, "error");
  } finally {
    busy.value = false;
  }
}
async function process() {
  busy.value = true;
  try {
    await api.post(urls.filespostupload, {
      files: files.value.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
      categories: selected.value,
    });
    toast("Assets queued for processing");
    await loadFiles();
    emit("saved");
    emit("close");
  } catch (e) {
    toast(e.message, "error");
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <PiModal title="Upload assets" @close="emit('close')"
    ><template v-if="stage === 'pick'"
      ><input class="form-control" type="file" multiple @change="choose" />
      <p v-if="busy" class="mt-3 mb-0">Uploading {{ progress }}%</p></template
    ><template v-else
      ><p>Select labels for the uploaded files.</p>
      <div class="d-flex flex-wrap gap-2">
        <button
          v-for="l in store.labels"
          :key="l.name"
          class="btn btn-sm"
          :class="
            selected.includes(l.name) ? 'btn-primary' : 'btn-outline-secondary'
          "
          @click="toggle(l.name)"
        >
          {{ l.name }}
        </button>
      </div></template
    ><template #footer
      ><button
        class="btn btn-outline-secondary"
        :disabled="busy"
        @click="emit('close')"
      >
        Cancel</button
      ><button
        class="btn btn-primary"
        :disabled="busy"
        @click="stage === 'pick' ? upload() : process()"
      >
        {{ stage === "pick" ? "Upload" : "Queue processing" }}
      </button></template
    ></PiModal
  >
</template>
