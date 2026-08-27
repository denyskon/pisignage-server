<script setup>
import { reactive } from "vue";
import PiModal from "../PiModal.vue";
import { weeksObject, daysObject } from "../../api";
const props = defineProps({ playlist: { type: Object, required: true } });
const emit = defineEmits(["close", "save"]);
const s = reactive((props.playlist.settings ||= {}));
if (!Array.isArray(s.weekdays))
  s.weekdays = s.weekday ? [s.weekday] : [...weeksObject.map((x) => x.id)];
if (!Array.isArray(s.monthdays))
  s.monthdays = s.monthday ? [s.monthday] : [...daysObject.map((x) => x.id)];
function save() {
  s.startdate = s.startdate || "";
  s.enddate = s.enddate || "";
  s.starttime = s.starttime || "";
  s.endtime = s.endtime || "";
  if (s.weekdays.length >= 7) delete s.weekday;
  else s.weekday = s.weekdays[0] || 0;
  if (s.monthdays.length >= 31) delete s.monthday;
  else s.monthday = s.monthdays[0] || 0;
  emit("save");
}
</script>
<template>
  <PiModal
    :title="`Schedule: ${playlist.name}`"
    size="lg"
    @close="emit('close')"
    ><div class="row g-3">
      <div class="col-12">
        <label class="form-check"
          ><input
            v-model="s.durationEnable"
            class="form-check-input"
            type="checkbox"
          />
          Schedule between dates</label
        >
      </div>
      <template v-if="s.durationEnable"
        ><div class="col-md-6">
          <label class="form-label">Start date</label
          ><input v-model="s.startdate" type="date" class="form-control" />
        </div>
        <div class="col-md-6">
          <label class="form-label">End date</label
          ><input
            v-model="s.enddate"
            type="date"
            class="form-control"
            :min="s.startdate"
          /></div
      ></template>
      <div class="col-md-6">
        <label class="form-label">Weekdays</label
        ><select v-model="s.weekdays" class="form-select" multiple size="7">
          <option v-for="d in weeksObject" :key="d.id" :value="d.id">
            {{ d.label }}
          </option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Days of month</label
        ><select v-model="s.monthdays" class="form-select" multiple size="7">
          <option v-for="d in daysObject" :key="d.id" :value="d.id">
            {{ d.label }}
          </option>
        </select>
      </div>
      <div class="col-12">
        <label class="form-check"
          ><input
            v-model="s.timeEnable"
            class="form-check-input"
            type="checkbox"
          />
          Schedule at specific times</label
        >
      </div>
      <template v-if="s.timeEnable"
        ><div class="col-md-6">
          <label class="form-label">Start time</label
          ><input v-model="s.starttime" type="time" class="form-control" />
        </div>
        <div class="col-md-6">
          <label class="form-label">End time</label
          ><input v-model="s.endtime" type="time" class="form-control" /></div
      ></template>
    </div>
    <template #footer
      ><button class="btn btn-outline-secondary" @click="emit('close')">
        Cancel</button
      ><button class="btn btn-primary" @click="save">
        Save schedules
      </button></template
    ></PiModal
  >
</template>
