<script setup>
import { reactive } from "vue";
import PiModal from "../PiModal.vue";
const p = defineProps({ group: Object });
const e = defineEmits(["close", "save"]);
const value = reactive(
  JSON.parse(
    JSON.stringify(
      p.group.ticker || {
        enable: false,
        behavior: "scroll",
        textSpeed: 3,
        style: "",
        messages: "",
        rss: { enable: false, link: "", feedDelay: 60 },
      },
    ),
  ),
);
value.rss ||= { enable: false, link: "", feedDelay: 60 };
</script>
<template>
  <PiModal title="Group ticker" @close="e('close')"
    ><label class="form-check mb-3"
      ><input v-model="value.enable" class="form-check-input" type="checkbox" />
      Enable ticker</label
    >
    <div v-if="value.enable" class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Behavior</label
        ><select v-model="value.behavior" class="form-select">
          <option value="scroll">Scroll</option>
          <option value="slide">Slide</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Text speed</label
        ><input
          v-model.number="value.textSpeed"
          type="number"
          class="form-control"
        />
      </div>
      <div class="col-12">
        <label class="form-label">Style</label
        ><input v-model="value.style" class="form-control" />
      </div>
      <div class="col-12">
        <label class="form-label">Messages</label
        ><textarea
          v-model="value.messages"
          class="form-control"
          rows="4"
        ></textarea>
      </div>
      <div class="col-12">
        <label class="form-check"
          ><input
            v-model="value.rss.enable"
            class="form-check-input"
            type="checkbox"
          />
          Use RSS feed</label
        >
      </div>
      <template v-if="value.rss.enable"
        ><div class="col-md-8">
          <label class="form-label">RSS link</label
          ><input v-model="value.rss.link" class="form-control" />
        </div>
        <div class="col-md-4">
          <label class="form-label">Refresh delay</label
          ><input
            v-model.number="value.rss.feedDelay"
            type="number"
            class="form-control"
          /></div
      ></template>
    </div>
    <template #footer
      ><button class="btn btn-outline-secondary" @click="e('close')">
        Cancel</button
      ><button class="btn btn-primary" @click="e('save', value)">
        Save
      </button></template
    ></PiModal
  >
</template>
