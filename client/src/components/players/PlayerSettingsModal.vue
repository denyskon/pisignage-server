<script setup>
// Single settings entry point per player: identity, group, timezone,
// labels and deregistration.
import { computed, ref } from "vue";
import PiModal from "../PiModal.vue";
import { api, urls, timeZoneNames } from "../../api";
import { store, loadPlayers } from "../../stores/models";
import { toast, confirmDialog } from "../../stores/ui";

const p = defineProps({ player: Object });
const e = defineEmits(["close", "updated"]);
const name = ref(p.player.name || "");
const tz = ref(p.player.TZ || "");
const groupName = ref(p.player.group?.name || "");
const labels = ref([...(p.player.labels || [])]);
const saving = ref(false);
const zones = timeZoneNames();
const playerLabels = computed(() =>
  store.labels.filter((x) => x.mode === "players"),
);

async function save() {
  saving.value = true;
  try {
    if (name.value && name.value !== (p.player.name || "")) {
      const r = await api.post(urls.players + p.player._id, {
        name: name.value,
      });
      Object.assign(p.player, r.data);
    }
    if ((tz.value || "") !== (p.player.TZ || "")) {
      const r = await api.post(urls.players + p.player._id, { TZ: tz.value });
      Object.assign(p.player, r.data);
    }
    toast("Player settings saved");
    e("updated");
    e("close");
  } catch (x) {
    toast(x.message, "error");
  } finally {
    saving.value = false;
  }
}

async function group() {
  if (
    !(await confirmDialog({
      title: "Change group?",
      message: `Do you want to Change the Group of the Player to ${groupName.value || "__player__"}`,
      confirmLabel: "Change",
      danger: false,
    }))
  )
    return;
  const name = groupName.value || "__player__";
  try {
    const r = await api.post(urls.players + p.player._id, {
      group: store.groups.find((x) => x.name === name) || { name },
    });
    Object.assign(p.player, r.data);
    e("updated");
    e("close");
  } catch (x) {
    toast(x.message, "error");
  }
}

async function labelsChanged() {
  try {
    const r = await api.post(urls.players + p.player._id, {
      labels: labels.value,
    });
    Object.assign(p.player, r.data);
  } catch (x) {
    toast(x.message, "error");
  }
}

async function deregister() {
  if (
    !(await confirmDialog({
      title: "Deregister player?",
      message: "Do you want to deregister the player",
    }))
  )
    return;
  try {
    await api.del(urls.players + p.player._id);
    await loadPlayers();
    toast("Player deregistered");
    e("close");
  } catch (x) {
    toast(x.message, "error");
  }
}
</script>

<template>
  <PiModal
    :title="`Player settings: ${player.displayName || player.name || player.localName}`"
    @close="e('close')"
  >
    <form @submit.prevent="save">
      <div class="mb-3">
        <label class="form-label" for="player-name">Name</label
        ><input
          id="player-name"
          v-model="name"
          class="form-control"
          :placeholder="player.localName || 'Player name'"
        />
      </div>
      <div class="mb-3">
        <label class="form-label" for="player-tz">Timezone</label
        ><select id="player-tz" v-model="tz" class="form-select">
          <option value="">-- No timezone (use server default) --</option>
          <option v-for="z in zones" :key="z">{{ z }}</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label" for="player-group">Group</label
        ><select
          id="player-group"
          v-model="groupName"
          class="form-select"
          @change="group"
        >
          <option value="">-- none --</option>
          <option v-for="g in store.groups" :key="g._id">{{ g.name }}</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label" for="player-labels">Player labels</label
        ><select
          id="player-labels"
          v-model="labels"
          multiple
          class="form-select"
          size="5"
          @change="labelsChanged"
        >
          <option v-for="l in playerLabels" :key="l._id" :value="l.name">
            {{ l.name }}
          </option>
        </select>
        <div v-if="!playerLabels.length" class="small text-muted mt-1">
          No player labels defined yet — create them via the Labels button in
          the player list.
        </div>
      </div>
      <button class="d-none" type="submit" />
    </form>
    <template #footer
      ><button
        class="btn btn-danger me-auto"
        :disabled="saving"
        @click="deregister"
      >
        Deregister</button
      ><button class="btn btn-outline-secondary" @click="e('close')">
        Cancel</button
      ><button class="btn btn-primary" :disabled="saving" @click="save">
        Save
      </button></template
    >
  </PiModal>
</template>
