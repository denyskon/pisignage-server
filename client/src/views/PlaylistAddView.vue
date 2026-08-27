<script setup>
// Legacy /playlists/add/:playlist route — now renders the same workspace as
// selecting a playlist on the Assets page.
import { ref, watch } from "vue";
import { ListVideo } from "@lucide/vue";
import { useRoute, useRouter } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
import PlaylistWorkspace from "../components/playlists/PlaylistWorkspace.vue";
import { store } from "../stores/models";

const route = useRoute(),
  router = useRouter();

// Resolve the playlist once by its route-param name. Once found we keep the
// object reference — renaming it in place must not make this lookup "miss"
// and flash a "not found" state.
const playlist = ref(
  store.playlists.find((p) => p.name === route.params.playlist) || null,
);
watch(
  () => store.playlists.length,
  () => {
    if (!playlist.value)
      playlist.value =
        store.playlists.find((p) => p.name === route.params.playlist) || null;
  },
);
</script>

<template>
  <section class="pi-page">
    <PageHeader title="Playlist editor" :icon="ListVideo" />
    <PlaylistWorkspace
      v-if="playlist"
      :playlist="playlist"
      @close="router.push('/assets/main')"
    />
    <p v-else class="alert alert-danger">Playlist not found.</p>
  </section>
</template>
