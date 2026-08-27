<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Gauge, RefreshCw, Users } from "@lucide/vue";
import PageHeader from "../components/PageHeader.vue";
import { loadPlayers } from "../stores/models";
import { toast } from "../stores/ui";

const BUCKET_INTERVALS = [5, 60, 240, 1440, 10080];
const BUCKET_TITLE = [
  "now",
  "Last 60 minutes",
  "Last 4 hours",
  "Today",
  "Last 7 days",
  "> 7 days",
];
const BUCKET_CLASS = [
  "success",
  "primary",
  "info",
  "warning",
  "light-danger",
  "danger",
];
const COUNT_FIELDS = [
  { field: "groupName", name: "Group wise" },
  { field: "currentPlaylist", name: "Playlists playing" },
  { field: "version", name: "Software version" },
  { field: "locationName", name: "Location wise" },
];

const loading = ref(true);
const refreshing = ref(false);
const showAll = ref(false);
const playersStat = ref(Array(6).fill(0));
const playersExpectedToReport = ref([]);
const fieldCounts = ref(
  Object.fromEntries(COUNT_FIELDS.map(({ field }) => [field, []])),
);
let pollTimer;

function minutesAgo(lastReported) {
  return Math.trunc(
    (Date.now() - new Date(lastReported || 0).getTime()) / 60000,
  );
}

function playerName(player) {
  return (
    player.name ||
    player.localName ||
    (player.cpuSerialNumber
      ? `Player ${player.cpuSerialNumber.slice(12)}`
      : "Player")
  );
}

function rebuildStatistics(players) {
  const buckets = Array(6).fill(0);
  const expected = [];
  const counts = Object.fromEntries(
    COUNT_FIELDS.map(({ field }) => [field, new Map()]),
  );

  for (const player of players) {
    const ago = minutesAgo(player.lastReported);
    const bucket = BUCKET_INTERVALS.findIndex((interval) => ago <= interval);
    buckets[bucket === -1 ? 5 : bucket]++;
    if (ago > 5 && ago < 60)
      expected.push({
        name: playerName(player),
        lastReported: player.lastReported,
      });

    const values = {
      groupName: player.group?.name,
      currentPlaylist: player.currentPlaylist,
      version: player.version,
      locationName: player.configLocation || player.location,
    };
    for (const { field } of COUNT_FIELDS) {
      const value = String(values[field] || "NA").trim() || "NA";
      counts[field].set(value, (counts[field].get(value) || 0) + 1);
    }
  }

  playersStat.value = buckets;
  playersExpectedToReport.value = expected.sort(
    (a, b) => b.lastReported - a.lastReported,
  );
  fieldCounts.value = Object.fromEntries(
    COUNT_FIELDS.map(({ field }) => [
      field,
      [...counts[field]]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    ]),
  );
}

async function fetchPlayers(manual = false) {
  if (manual) refreshing.value = true;
  try {
    const players = await loadPlayers();
    rebuildStatistics(players);
  } catch (error) {
    toast(error.message || "Unable to load player reporting status", "error");
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

function playerLink(field, value) {
  return { path: "/dashboard/players", query: { [field]: value } };
}

const visibleCount = computed(() => (showAll.value ? 1000 : 10));

onMounted(() => {
  fetchPlayers();
  pollTimer = window.setInterval(fetchPlayers, 60000);
});

onBeforeUnmount(() => window.clearInterval(pollTimer));
</script>

<template>
  <section class="pi-page">
    <PageHeader title="Dashboard" :icon="Gauge" />
    <section class="pi-card dashboard-card">
      <div class="pi-card-header">
        <h1 class="pi-card-title">
          <Users :size="18" /> Player reporting status
        </h1>
        <button
          class="btn btn-outline-primary btn-sm btn-icon"
          type="button"
          :disabled="refreshing"
          @click="fetchPlayers(true)"
        >
          <RefreshCw :size="16" :class="{ 'spin-icon': refreshing }" />
          Refresh
        </button>
      </div>

      <div v-if="loading" class="pi-card-body text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading player status</span>
        </div>
      </div>

      <template v-else>
        <div class="pi-card-body">
          <div class="row g-3">
            <div
              v-for="(count, index) in playersStat"
              :key="BUCKET_TITLE[index]"
              class="col-sm-4 col-lg-2"
            >
              <RouterLink
                class="stat-card"
                :class="`stat-card-${BUCKET_CLASS[index]}`"
                :to="{ path: '/dashboard/players', query: { bucket: index } }"
              >
                <span class="stat-card-label">{{ BUCKET_TITLE[index] }}</span>
                <strong class="stat-card-count">{{ count }}</strong>
              </RouterLink>
            </div>
          </div>
        </div>

        <div class="dashboard-section">
          <h2 class="dashboard-section-title">
            Players expected to report soon
          </h2>
          <div
            v-if="playersExpectedToReport.length"
            class="expected-list list-group list-group-flush"
          >
            <div
              v-for="player in playersExpectedToReport"
              :key="`${player.name}-${player.lastReported}`"
              class="list-group-item d-flex justify-content-between gap-3"
            >
              <span class="text-truncate">{{ player.name }}</span>
              <span class="text-muted text-nowrap">{{
                timeAgo(player.lastReported)
              }}</span>
            </div>
          </div>
          <p v-else class="text-center text-muted mb-0 py-3">
            All players are reporting as expected
          </p>
        </div>

        <div class="dashboard-section">
          <div class="row g-4">
            <div
              v-for="table in COUNT_FIELDS"
              :key="table.field"
              class="col-md-6"
            >
              <div class="breakdown-table border rounded-3 overflow-hidden">
                <h2 class="breakdown-title">{{ table.name }}</h2>
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <tbody>
                      <tr
                        v-for="row in fieldCounts[table.field].slice(
                          0,
                          visibleCount,
                        )"
                        :key="row.name"
                      >
                        <td class="p-0">
                          <RouterLink
                            class="breakdown-link"
                            :to="playerLink(table.field, row.name)"
                            >{{ row.name }}</RouterLink
                          >
                        </td>
                        <td class="text-end text-muted pe-3">
                          {{ row.count }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <button
            v-if="
              COUNT_FIELDS.some((table) => fieldCounts[table.field].length > 10)
            "
            class="btn btn-outline-primary btn-sm mt-3"
            type="button"
            @click="showAll = !showAll"
          >
            {{ showAll ? "Show less" : "All players" }}
          </button>
        </div>
      </template>
    </section>
  </section>
</template>

<style scoped>
.dashboard-section {
  border-top: 1px solid var(--pi-border);
  padding: 1.25rem;
}
.dashboard-section-title,
.breakdown-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.85rem;
}
.expected-list {
  max-height: 200px;
  overflow-y: auto;
}
.stat-card {
  border-radius: var(--pi-radius-sm);
  display: flex;
  flex-direction: column;
  min-height: 106px;
  padding: 1rem;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--pi-shadow-lg);
}
.stat-card-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.stat-card-count {
  font-size: 2rem;
  line-height: 1;
  margin-top: auto;
}
.stat-card-success {
  background: #f0fdf4;
  color: #15803d;
}
.stat-card-primary {
  background: var(--pi-primary-soft);
  color: var(--pi-primary);
}
.stat-card-info {
  background: #ecfeff;
  color: #0e7490;
}
.stat-card-warning {
  background: #fffbeb;
  color: #b45309;
}
.stat-card-light-danger {
  background: #fff1f2;
  color: #be123c;
}
.stat-card-danger {
  background: #fef2f2;
  color: var(--pi-danger);
}
.breakdown-title {
  background: #f8fafc;
  border-bottom: 1px solid var(--pi-border);
  margin: 0;
  padding: 0.75rem 1rem;
}
.breakdown-link {
  display: block;
  padding: 0.65rem 1rem;
  color: inherit;
}
.breakdown-link:hover {
  color: var(--pi-primary);
}
.spin-icon {
  animation: spin 0.75s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
