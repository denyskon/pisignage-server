<script setup>
import { onMounted, ref } from "vue";
import { Image } from "@lucide/vue";
import PageHeader from "../components/PageHeader.vue";
import PlaylistList from "../components/playlists/PlaylistList.vue";
import PlaylistWorkspace from "../components/playlists/PlaylistWorkspace.vue";
import AssetGrid from "../components/assets/AssetGrid.vue";
import { store, loadFiles, loadLabels, loadPlaylists } from "../stores/models";
import { toast } from "../stores/ui";

const loading = ref(true);

async function reload() {
  try {
    await Promise.all([loadFiles(), loadLabels(), loadPlaylists()]);
  } catch (e) {
    toast(e.message, "error");
  } finally {
    loading.value = false;
  }
}

onMounted(reload);

function select(playlist) {
  store.selectedPlaylist = playlist;
}
</script>

<template>
  <section class="pi-page">
    <PageHeader title="Assets" :icon="Image" />
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" />
    </div>
    <div v-else class="row g-3">
      <aside class="col-lg-3">
        <PlaylistList @select="select" @changed="reload" />
      </aside>
      <main class="col-lg-9">
        <template v-if="store.selectedPlaylist">
          <PlaylistWorkspace
            :playlist="store.selectedPlaylist"
            @close="select(null)"
            @changed="reload"
          />
        </template>
        <AssetGrid v-else all-assets @changed="reload" />
      </main>
    </div>
  </section>
</template>
