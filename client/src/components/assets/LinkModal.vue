<script setup>
import { reactive, computed } from "vue";
import PiModal from "../PiModal.vue";
import { api, urls, linkTypes } from "../../api";
import { toast } from "../../stores/ui";
import { sanitizeName } from "../../utils/format";
const props = defineProps({ type: { type: String, default: ".tv" } });
const emit = defineEmits(["close", "saved"]);
const d = reactive({
  name: "",
  type: props.type,
  link: "",
  zoom: 1,
  duration: null,
  hideTitle: "title",
  tcp: false,
  style: "",
  message: "",
  numberOfItems: null,
  keystrokes: "",
  keydelay: "",
  scroll: false,
  weblinkHeaders: "",
});
const linkRequired = computed(() => d.type !== ".txt");
async function save() {
  d.name = sanitizeName(d.name);
  if (
    !d.name ||
    (linkRequired.value && !d.link) ||
    (d.type === ".txt" && !d.message)
  )
    return toast("Complete the required fields", "error");
  try {
    await api.post(urls.links, { details: { ...d }, categories: [] });
    toast("Asset created");
    emit("saved");
    emit("close");
  } catch (e) {
    toast(e.message, "error");
  }
}
</script>
<template>
  <PiModal
    :title="d.type === '.txt' ? 'Add a Message' : 'Stream From Internet'"
    @close="emit('close')"
    ><div class="row g-3">
      <label class="col-12"
        >File name<input
          v-model="d.name"
          class="form-control"
          required /></label
      ><label class="col-12"
        >File type<select v-model="d.type" class="form-select">
          <option v-for="t in linkTypes" :value="t.ext">{{ t.name }}</option>
        </select></label
      ><label v-if="d.type !== '.txt'" class="col-12"
        >Link address<input v-model="d.link" class="form-control" /></label
      ><label v-if="d.type === '.weblink'" class="col-12"
        >Zoom level<input
          v-model.number="d.zoom"
          class="form-control"
          step=".01"
          type="number"
      /></label>
      <div v-if="d.type === '.stream'" class="col-12">
        <label class="form-check"
          ><input v-model="d.tcp" class="form-check-input" type="checkbox" />
          TCP stream</label
        >
      </div>
      <template v-if="d.type === '.mrss'"
        ><label class="col"
          >Number of items<input
            v-model.number="d.numberOfItems"
            class="form-control"
            type="number" /></label
        ><label class="col"
          >Item duration<input
            v-model.number="d.duration"
            class="form-control"
            type="number" /></label></template
      ><label v-if="d.type === '.txt' || d.type === '.mrss'" class="col-12"
        >Optional CSS<input v-model="d.style" class="form-control" /></label
      ><label v-if="d.type === '.txt'" class="col-12"
        >Message<textarea v-model="d.message" class="form-control" rows="4" />
      </label>
    </div>
    <template #footer
      ><button class="btn btn-outline-secondary" @click="emit('close')">
        Cancel</button
      ><button class="btn btn-primary" @click="save">Save</button></template
    ></PiModal
  >
</template>
