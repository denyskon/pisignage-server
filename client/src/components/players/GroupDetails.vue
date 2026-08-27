<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import Sortable from "sortablejs";
import {
  AlertTriangle,
  CalendarDays,
  GripVertical,
  Pencil,
  Plus,
  Radio,
  Send,
  Settings,
  Trash2,
} from "@lucide/vue";
import { api, urls } from "../../api";
import {
  store,
  normalPlaylistNames,
  playlistNames,
  listFiles,
  deployGroup,
} from "../../stores/models";
import { toast, confirmDialog } from "../../stores/ui";
import { formatDate, sanitizeName } from "../../utils/format";
import ScheduleCalendarModal from "./ScheduleCalendarModal.vue";
import EmergencyMessageModal from "./EmergencyMessageModal.vue";
import TickerModal from "./TickerModal.vue";
import DisplaySetModal from "./DisplaySetModal.vue";
const props = defineProps({ group: Object });
const emit = defineEmits(["close", "changed"]);
const schedule = ref(null),
  modal = ref(""),
  needDeploy = ref(false),
  maxError = ref(false),
  list = ref(null);
let sortable;
const group = computed(() => props.group);
const renaming = ref(false);
const nameValue = ref("");

function beginRename() {
  nameValue.value = group.value.name;
  renaming.value = true;
}

async function renameGroup() {
  const name = sanitizeName(nameValue.value).trim();
  if (!name || name === group.value.name) {
    renaming.value = false;
    return;
  }
  if (store.groups.some((item) => item !== group.value && item.name === name)) {
    toast("Group exists", "error");
    return;
  }
  const previousName = group.value.name;
  try {
    group.value.name = name;
    const response = await api.post(urls.groups + group.value._id, group.value);
    Object.assign(group.value, response.data);
    renaming.value = false;
    toast("Group renamed");
    emit("changed");
  } catch (error) {
    group.value.name = previousName;
    toast(error.message, "error");
  }
}

async function deleteGroup() {
  if (
    !(await confirmDialog({
      title: "Delete group?",
      message: `Delete ${group.value.name}?`,
    }))
  )
    return;
  try {
    await api.del(urls.groups + group.value._id);
    store.groups.splice(store.groups.indexOf(group.value), 1);
    store.selectedGroup = null;
    toast("Group deleted");
    emit("close");
  } catch (error) {
    toast(error.message, "error");
  }
}
function ensure() {
  if (!group.value) return;
  if (!group.value.playlists?.length)
    group.value.playlists = [{ name: "", settings: {} }];
  group.value.playlists.forEach((p) => (p.settings ||= {}));
}
watch(() => props.group, ensure, { immediate: true });
async function save() {
  ensure();
  try {
    listFiles(group.value, store.playlists, playlistNames.value);
    const r = await api.post(urls.groups + group.value._id, group.value);
    Object.assign(group.value, r.data);
    ensure();
    needDeploy.value = true;
    emit("changed");
  } catch (e) {
    toast(e.message, "error");
  }
}
async function deploy() {
  try {
    const r = await deployGroup(group.value);
    Object.assign(group.value, r.data);
    needDeploy.value = false;
    toast(`Deploy started for ${group.value.name}`);
  } catch (e) {
    toast(e.message, "error");
  }
}
function add() {
  ensure();
  if (group.value.playlists.length >= 100) {
    maxError.value = true;
    setTimeout(() => (maxError.value = false), 5000);
    return;
  }
  group.value.playlists.push({
    name: group.value.playlists[0].name || "",
    settings: { durationEnable: false, timeEnable: false },
  });
  save();
}
async function remove(i) {
  if (
    await confirmDialog({
      title: "Delete playlist schedule?",
      message: "Do you want to delete the Playlist schedule?",
    })
  ) {
    group.value.playlists.splice(i, 1);
    save();
  }
}
function dates(p) {
  const s = p.settings || {},
    parts = [];
  if (s.durationEnable)
    parts.push(
      `${formatDate(s.startdate, "MMM D")} – ${formatDate(s.enddate, "MMM D")}`,
    );
  if (s.timeEnable) parts.push(`${s.starttime || ""} – ${s.endtime || ""}`);
  if (s.weekdays && s.weekdays.length < 7)
    parts.push("week days: " + s.weekdays.join(", "));
  if (s.monthdays && s.monthdays.length < 31)
    parts.push("dates: " + s.monthdays.join(","));
  return parts.join(" · ") || "Click the icon to schedule";
}
function apply(type, value) {
  if (type === "settings") Object.assign(group.value, value);
  else group.value[type] = value;
  modal.value = "";
  save();
}
function reorder(evt) {
  if (evt.oldIndex === evt.newIndex) return;
  const [moved] = group.value.playlists.splice(evt.oldIndex + 1, 1);
  group.value.playlists.splice(evt.newIndex + 1, 0, moved);
  save();
}
onMounted(() => {
  sortable = Sortable.create(list.value, {
    handle: ".drag-handle",
    animation: 150,
    onEnd: reorder,
  });
});
onBeforeUnmount(() => sortable?.destroy());
</script>
<template>
  <section v-if="group" class="pi-card mb-3">
    <header class="pi-card-header flex-wrap gap-2">
      <form
        v-if="renaming"
        class="input-group input-group-sm pi-detail-title-editor"
        @submit.prevent="renameGroup"
      >
        <input v-model="nameValue" class="form-control" autofocus />
        <button class="btn btn-primary" type="submit">Save</button>
        <button
          class="btn btn-outline-secondary"
          type="button"
          @click="renaming = false"
        >
          Cancel
        </button>
      </form>
      <h2 v-else class="pi-card-title">
        {{ group.name }}
        <button
          class="btn btn-link btn-sm p-0 ms-1"
          title="Rename group"
          @click="beginRename"
        >
          <Pencil :size="16" />
        </button>
      </h2>
      <div class="d-flex flex-wrap gap-2">
        <button
          class="btn btn-sm btn-outline-secondary"
          title="Emergency message"
          @click="modal = 'emergency'"
        >
          <AlertTriangle :size="16" /> Emergency</button
        ><button
          class="btn btn-sm btn-outline-secondary"
          title="Group ticker"
          @click="modal = 'ticker'"
        >
          <Radio :size="16" /> Ticker</button
        ><button
          class="btn btn-sm btn-outline-secondary"
          title="Group settings"
          @click="modal = 'settings'"
        >
          <Settings :size="16" /> Settings</button
        ><button
          class="btn btn-sm btn-outline-danger"
          title="Delete group"
          @click="deleteGroup"
        >
          <Trash2 :size="16" /></button
        ><button
          class="btn btn-sm btn-primary"
          :disabled="!group.playlists?.some((p) => p.name)"
          @click="deploy"
        >
          <Send :size="16" /> Deploy to {{ group.name }}
        </button>
      </div>
    </header>
    <div class="pi-card-body">
      <div v-if="needDeploy" class="alert alert-info py-2">
        Changes are saved but not deployed. Deploy when you are ready to update
        this group’s players.
      </div>
      <label class="form-check text-muted mb-3">
        <input
          v-model="group.loadPlaylistOnCompletion"
          class="form-check-input"
          type="checkbox"
          @change="save"
        />
        Change deployed playlist at the end of the current cycle, instead of
        immediately
      </label>
      <div class="row align-items-center g-2 mb-3">
        <label class="col-md-3 col-form-label">Default playlist</label>
        <div class="col-md-5">
          <select
            v-model="group.playlists[0].name"
            class="form-select"
            @change="save"
          >
            <option value="">--</option>
            <option v-for="n in normalPlaylistNames" :key="n">{{ n }}</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-check"
            ><input
              v-model="group.combineDefaultPlaylist"
              class="form-check-input"
              type="checkbox"
              @change="save"
            />
            Play together with scheduled playlist</label
          >
        </div>
      </div>
      <div
        v-if="group.playlists[0].name"
        class="d-flex justify-content-between align-items-start mb-2"
      >
        <div>
          <strong>Additional scheduled playlists</strong
          ><span v-if="maxError" class="text-danger small ms-2"
            >Maximum allowed Playlist Schedules (30)</span
          >
        </div>
        <button class="btn btn-sm btn-outline-secondary" @click="add">
          <Plus :size="16" /> Add
        </button>
      </div>
      <div v-if="group.playlists[0].name" class="row mb-3">
        <div class="col-auto">
          <label class="form-check"
            ><input
              v-model="group.playAllEligiblePlaylists"
              class="form-check-input"
              type="checkbox"
              @change="save"
            />
            Combine eligible playlists</label
          >
        </div>
        <div class="col-auto">
          <label class="form-check"
            ><input
              v-model="group.shuffleContent"
              class="form-check-input"
              type="checkbox"
              @change="save"
            />
            Shuffle content</label
          >
        </div>
        <div v-if="group.playAllEligiblePlaylists" class="col-auto">
          <label class="form-check"
            ><input
              v-model="group.alternateContent"
              class="form-check-input"
              type="checkbox"
              @change="save"
            />
            Alternate content</label
          >
        </div>
      </div>
      <div ref="list">
        <div
          v-for="(pl, i) in group.playlists.slice(1)"
          :key="pl"
          class="d-flex align-items-center gap-2 border-top py-2"
        >
          <div class="drag-handle text-muted">
            <GripVertical :size="18" /> {{ i + 1 }}.
          </div>
          <select
            v-model="pl.name"
            class="form-select form-select-sm"
            style="max-width: 220px"
            @change="save"
          >
            <option value="">--</option>
            <option v-for="n in playlistNames" :key="n">{{ n }}</option>
          </select>
          <span
            class="badge"
            :class="
              pl.plType === 'regular' ? 'text-bg-info' : 'text-bg-warning'
            "
            >{{ pl.plType || "regular" }}</span
          >
          <button
            class="btn btn-sm btn-link p-0"
            :disabled="!pl.name"
            @click="schedule = pl"
          >
            <CalendarDays :size="18" /></button
          ><small class="flex-grow-1">{{ dates(pl) }}</small>
          <button
            v-if="pl.name"
            class="btn btn-sm btn-link text-danger"
            @click="remove(i + 1)"
          >
            <Trash2 :size="17" />
          </button>
        </div>
      </div>
    </div>
  </section>
  <ScheduleCalendarModal
    v-if="schedule"
    :playlist="schedule"
    @close="schedule = null"
    @save="
      schedule = null;
      save();
    "
  /><EmergencyMessageModal
    v-if="modal === 'emergency'"
    :group="group"
    @close="modal = ''"
    @save="apply('emergencyMessage', $event)"
  /><TickerModal
    v-if="modal === 'ticker'"
    :group="group"
    @close="modal = ''"
    @save="apply('ticker', $event)"
  /><DisplaySetModal
    v-if="modal === 'settings'"
    :group="group"
    @close="modal = ''"
    @save="apply('settings', $event)"
  />
</template>
