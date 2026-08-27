<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  RefreshCw,
  ArrowDownAZ,
  Clock3,
  Tags,
  X,
  Terminal,
  Settings,
  ArrowUpCircle,
  Monitor,
  HardDrive,
  Thermometer,
  Search,
} from "@lucide/vue";
import EmptyState from "../EmptyState.vue";
import { store, loadPlayers, loadServerConfig } from "../../stores/models";
import { toast } from "../../stores/ui";
import {
  displayName,
  timeAgo,
  uptimeFormatted,
  tempFormat,
  truncate,
} from "../../utils/format";
import PlayerSettingsModal from "./PlayerSettingsModal.vue";
import ShellModal from "./ShellModal.vue";
import SwUpdateModal from "./SwUpdateModal.vue";
import LabelsModal from "./LabelsModal.vue";
const props = defineProps({ dashboardFilters: Object });
const alphabetical = ref(false),
  loading = ref(false),
  modal = ref(""),
  selected = ref(null),
  search = ref("");
let timer;
const players = computed(() => {
  let a = [...store.players];
  const f = props.dashboardFilters || {};
  if (f.bucket !== undefined) {
    const bounds = [5, 60, 240, 1440, 10080, Infinity];
    const index = Number(f.bucket);
    if (bounds[index] !== undefined) {
      a = a.filter((p) => {
        const minutes = (Date.now() - new Date(p.lastReported || 0)) / 60000;
        return index === 0
          ? minutes <= bounds[0]
          : minutes > bounds[index - 1] && minutes <= bounds[index];
      });
    }
  }
  for (const key of ["currentPlaylist", "version"])
    if (f[key]) a = a.filter((p) => p[key] === f[key]);
  if (f.groupName) a = a.filter((p) => p.group?.name === f.groupName);
  if (f.locationName) a = a.filter((p) => p.locationName === f.locationName);
  if (store.selectedPlayerLabel)
    a = a.filter((p) => (p.labels || []).includes(store.selectedPlayerLabel));
  if (search.value) {
    const q = search.value.toLowerCase();
    a = a.filter((p) =>
      [
        p.name,
        p.localName,
        p.cpuSerialNumber,
        p.myIpAddress,
        p.currentPlaylist,
        p.group?.name,
      ].some((v) => (v || "").toLowerCase().includes(q)),
    );
  }
  return a.sort((x, y) =>
    alphabetical.value
      ? displayName(x).localeCompare(displayName(y))
      : (y.lastReported || 0) - (x.lastReported || 0),
  );
});
async function refresh() {
  loading.value = true;
  try {
    await loadPlayers({
      group: store.selectedGroup?._id,
      label: store.selectedPlayerLabel,
    });
  } catch (e) {
    toast(e.message, "error");
  } finally {
    loading.value = false;
  }
}
function open(type, player) {
  selected.value = player;
  modal.value = type;
}
function upgrade(p) {
  const target = p.player2
    ? store.currentVersion.versionP2 || store.currentVersion.version
    : store.currentVersion.version;
  if (!p.version || !target) return false;
  if (p.version !== target) return true;
  return !p.player2 && !!store.currentVersion.beta;
}
function ipOf(p) {
  return (p.myIpAddress || "").trim();
}
function playerUrl(p) {
  const ip = ipOf(p);
  if (!ip) return null;
  const credentials = store.serverConfig?.authCredentials;
  const userinfo =
    credentials?.user !== undefined && credentials?.user !== null
      ? `${encodeURIComponent(credentials.user)}:${encodeURIComponent(credentials.password || "")}@`
      : "";
  return `http://${userinfo}${ip}:8000/`;
}
onMounted(() => {
  if (!store.serverConfig) loadServerConfig().catch(() => {});
  refresh();
  timer = setInterval(refresh, 60000);
});
onBeforeUnmount(() => clearInterval(timer));
</script>
<template>
  <section class="pi-card">
    <header class="pi-card-header">
      <h2 class="pi-card-title me-auto">Reported players</h2>
      <div class="input-group input-group-sm" style="max-width: 220px">
        <span class="input-group-text"><Search :size="16" /></span
        ><input
          v-model="search"
          class="form-control"
          placeholder="Search players"
        />
      </div>
      <div class="d-flex gap-1">
        <button
          class="btn btn-sm btn-outline-secondary"
          :title="alphabetical ? 'Sort by recent' : 'Sort alphabetically'"
          @click="alphabetical = !alphabetical"
        >
          <ArrowDownAZ v-if="!alphabetical" :size="17" /><Clock3
            v-else
            :size="17"
          /></button
        ><button
          class="btn btn-sm btn-outline-secondary"
          @click="modal = 'labels'"
        >
          <Tags :size="16" />
          {{ truncate(store.selectedPlayerLabel, 10) || "Labels" }}</button
        ><button
          v-if="store.selectedPlayerLabel"
          class="btn btn-sm btn-outline-secondary"
          @click="
            store.selectedPlayerLabel = null;
            refresh();
          "
        >
          <X :size="16" /></button
        ><button
          class="btn btn-sm btn-outline-secondary"
          :disabled="loading"
          @click="refresh"
        >
          <span
            v-if="loading"
            class="spinner-border spinner-border-sm"
          /><RefreshCw v-else :size="16" />
        </button>
      </div>
    </header>
    <div v-if="loading && !store.players.length" class="p-4 text-center">
      <span class="spinner-border spinner-border-sm" /> Loading players…
    </div>
    <div v-else-if="players.length" class="list-group list-group-flush">
      <article v-for="p in players" :key="p._id" class="list-group-item">
        <div class="row g-2 align-items-center">
          <div class="col-lg-4">
            <div class="d-flex align-items-center gap-2">
              <span
                class="pi-dot"
                :class="p.statusOf"
                :title="
                  p.isConnected
                    ? p.playlistOn
                      ? 'online & playing'
                      : 'online & not playing'
                    : 'offline'
                "
              /><a
                v-if="playerUrl(p)"
                :href="playerUrl(p)"
                target="_blank"
                rel="noopener"
                class="fw-semibold text-decoration-none"
                :title="'Open player web UI at ' + ipOf(p) + ':8000'"
                >{{ truncate(displayName(p), 35) }}</a
              ><strong v-else>{{ truncate(displayName(p), 35) }}</strong>
              <button
                class="btn btn-sm btn-outline-secondary"
                title="Pi shell"
                @click="open('shell', p)"
              >
                <Terminal :size="16" />
              </button>
            </div>
            <small class="text-muted">{{ ipOf(p) || "IP:NA" }}</small>
          </div>
          <div class="col-lg-3">
            <a href="#" @click.prevent="$router.push('/assets/main')">{{
              p.currentPlaylist || "No playlist"
            }}</a>
            <div class="d-flex align-items-center gap-1">
              <a href="#" @click.prevent="emit('group', p.group?._id)">{{
                truncate(p.group?.name || "No group", 12)
              }}</a>
            </div>
          </div>
          <div class="col-lg-3 small text-muted">
            <div>Serial: {{ p.cpuSerialNumber || "—" }}</div>
            <div>
              <Monitor :size="14" /> {{ uptimeFormatted(p.uptime) || "—" }}
              <Thermometer :size="14" />
              {{ tempFormat(p.piTemperature) || "—" }} <HardDrive :size="14" />
              {{ p.diskSpaceAvailable || "—" }}
            </div>
            <div>
              Last seen:
              {{ p.lastReported ? timeAgo(p.lastReported) : "never" }}
            </div>
            <div v-if="p.isConnected && p.syncInProgress">
              <span class="spinner-border spinner-border-sm" />
              {{ p.wgetBytes }} {{ p.wgetSpeed }}B/sec
            </div>
            <div v-else>
              Last sync: {{ p.lastUpload ? timeAgo(p.lastUpload) : "never" }}
            </div>
          </div>
          <div class="col-lg-2 text-lg-end small">
            <div v-if="p.version">
              ver: {{ p.version
              }}<template v-if="p.platform_version"
                >/{{ p.platform_version }}</template
              >
            </div>
            <div class="d-inline-flex gap-1 mt-1">
              <button
                v-if="upgrade(p)"
                class="btn btn-sm btn-warning"
                @click="open('upgrade', p)"
              >
                <ArrowUpCircle :size="16" /> Upgrade
              </button>
              <button
                class="btn btn-sm btn-outline-secondary btn-icon"
                title="Player settings"
                @click="open('settings', p)"
              >
                <Settings :size="16" />
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
    <EmptyState
      v-else
      :icon="Monitor"
      title="No players"
      message="There are no players matching this view."
      ><button class="btn btn-primary" @click="refresh">
        Refresh players
      </button></EmptyState
    >
  </section>
  <PlayerSettingsModal
    v-if="modal === 'settings'"
    :player="selected"
    @close="modal = ''"
    @updated="refresh"
  /><ShellModal
    v-if="modal === 'shell'"
    :player="selected"
    @close="modal = ''"
  /><SwUpdateModal
    v-if="modal === 'upgrade'"
    :player="selected"
    @close="modal = ''"
  /><LabelsModal
    v-if="modal === 'labels'"
    @close="
      modal = '';
      refresh();
    "
    @selected="
      store.selectedPlayerLabel = $event;
      modal = '';
      refresh();
    "
  />
</template>
