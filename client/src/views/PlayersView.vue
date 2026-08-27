<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { MonitorPlay } from "@lucide/vue";
import { useRoute, useRouter } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
import GroupsSidebar from "../components/players/GroupsSidebar.vue";
import GroupDetails from "../components/players/GroupDetails.vue";
import PlayerList from "../components/players/PlayerList.vue";
import { store, loadAll, loadPlayers } from "../stores/models";
import { toast } from "../stores/ui";
const route = useRoute(),
  router = useRouter(),
  loading = ref(false);
const dashboard = computed(() => route.path === "/dashboard/players");
const filters = computed(() => (dashboard.value ? route.query : {}));
async function choose(group) {
  store.selectedGroup = group;
  await router.replace({
    path: route.path,
    query: group
      ? { ...route.query, group: group._id }
      : { ...route.query, group: undefined },
  });
  try {
    await loadPlayers({ group: group?._id, label: store.selectedPlayerLabel });
  } catch (e) {
    toast(e.message, "error");
  }
}
function sync() {
  const id = route.query.group;
  store.selectedGroup = id
    ? store.groups.find((g) => g._id === id) || null
    : null;
}
watch(() => route.query.group, sync);
onMounted(async () => {
  loading.value = true;
  try {
    await loadAll();
    sync();
    if (store.selectedGroup)
      await loadPlayers({ group: store.selectedGroup._id });
  } catch (e) {
    toast(e.message, "error");
  } finally {
    loading.value = false;
  }
});
</script>
<template>
  <section class="pi-page">
    <PageHeader title="Players" :icon="MonitorPlay" />
    <div v-if="loading && !store.loaded" class="text-center py-5">
      <span class="spinner-border" /> Loading players and groups…
    </div>
    <div v-else class="row g-3">
      <aside v-if="!dashboard" class="col-lg-3">
        <GroupsSidebar @select="choose" />
      </aside>
      <main :class="dashboard ? 'col-12' : 'col-lg-9'">
        <GroupDetails
          v-if="!dashboard && store.selectedGroup"
          class="mb-3"
          :group="store.selectedGroup"
          @close="choose(null)"
          @changed="loadPlayers({ group: store.selectedGroup?._id })"
        />
        <PlayerList
          :dashboard-filters="filters"
          @group="
            (id) => choose(store.groups.find((g) => g._id === id) || null)
          "
        />
      </main>
    </div>
  </section>
</template>
