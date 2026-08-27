<script setup>
import { reactive } from "vue";
import PiModal from "../PiModal.vue";
const p = defineProps({ group: Object });
const e = defineEmits(["close", "save"]);
const value = reactive(
  JSON.parse(
    JSON.stringify(
      p.group.emergencyMessage || { enable: false, vPos: "middle", msg: "" },
    ),
  ),
);
</script>
<template>
  <PiModal title="Emergency message" @close="e('close')"
    ><label class="form-check mb-3"
      ><input v-model="value.enable" class="form-check-input" type="checkbox" />
      Enable message</label
    ><template v-if="value.enable"
      ><label class="form-label">Vertical position</label>
      <div class="mb-3">
        <label
          v-for="x in ['top', 'middle', 'bottom']"
          :key="x"
          class="form-check form-check-inline"
          ><input
            v-model="value.vPos"
            class="form-check-input"
            type="radio"
            :value="x"
          />
          {{ x }}</label
        >
      </div>
      <label class="form-label">Message</label
      ><input
        v-model="value.msg"
        class="form-control"
        placeholder="Enter the message to be displayed" /></template
    ><template #footer
      ><button class="btn btn-outline-secondary" @click="e('close')">
        Cancel</button
      ><button class="btn btn-primary" @click="e('save', value)">
        Save
      </button></template
    ></PiModal
  >
</template>
