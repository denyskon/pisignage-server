<script setup>
import { reactive, watch } from "vue";
import PiModal from "../PiModal.vue";
import { api, urls } from "../../api";
import { toast } from "../../stores/ui";
const props = defineProps({ asset: { type: Object, required: true } });
const emit = defineEmits(["close", "saved"]);
const validity = reactive({ enable: false, ...(props.asset.validity || {}) });
watch(
  () => validity.startdate,
  (v) => {
    if (v) {
      validity.starthour = 0;
      if (!validity.enddate || validity.enddate < v) {
        validity.enddate = v;
        validity.endhour = 24;
      }
    }
  },
);
async function save() {
  try {
    props.asset.validity = { ...validity };
    await api.post(urls.files + encodeURIComponent(props.asset.name), {
      dbdata: props.asset,
    });
    toast("Validity saved");
    emit("saved", props.asset);
    emit("close");
  } catch (e) {
    toast(e.message, "error");
  }
}
</script>
<template>
  <PiModal title="Asset validity" @close="emit('close')"
    ><div class="form-check mb-3">
      <input
        id="valid"
        v-model="validity.enable"
        class="form-check-input"
        type="checkbox"
      /><label for="valid" class="form-check-label"
        >Enable validity period</label
      >
    </div>
    <template v-if="validity.enable"
      ><div class="row g-2">
        <label class="col"
          >Start date<input
            v-model="validity.startdate"
            class="form-control"
            type="date" /></label
        ><label class="col"
          >End date<input
            v-model="validity.enddate"
            class="form-control"
            type="date"
        /></label>
      </div>
      <div class="row g-2 mt-2">
        <label class="col"
          >Start hour<input
            v-model.number="validity.starthour"
            min="0"
            max="23"
            class="form-control"
            type="number" /></label
        ><label class="col"
          >End hour<input
            v-model.number="validity.endhour"
            min="1"
            max="24"
            class="form-control"
            type="number"
        /></label></div></template
    ><template #footer
      ><button class="btn btn-outline-secondary" @click="emit('close')">
        Cancel</button
      ><button class="btn btn-primary" @click="save">Save</button></template
    ></PiModal
  >
</template>
