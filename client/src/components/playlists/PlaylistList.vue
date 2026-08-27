<script setup>
import { ref } from "vue";
import { Images, Plus } from "@lucide/vue";
import { store } from "../../stores/models";
import { api, urls } from "../../api";
import { toast } from "../../stores/ui";
import { sanitizeName } from "../../utils/format";

const emit = defineEmits(["select", "changed"]);
const name = ref("");

function select(playlist) {
  store.selectedPlaylist = playlist;
  emit("select", playlist);
}

async function create() {
  const playlistName = sanitizeName(name.value).trim();
  if (!playlistName) return;
  if (store.playlists.some((playlist) => playlist.name === playlistName)) {
    name.value = "Playlist exists";
    return;
  }
  try {
    const response = await api.post(urls.playlists, { file: playlistName });
    store.playlists.unshift(response.data);
    name.value = "";
    select(response.data);
    toast("Playlist created");
    emit("changed");
  } catch (error) {
    toast(error.message, "error");
  }
}
</script>

<template>
  <section class="pi-card">
    <header class="pi-card-header">
      <h2 class="pi-card-title">Playlists</h2>
    </header>
    <div class="list-group list-group-flush">
      <button
        class="list-group-item list-group-item-action d-flex align-items-center gap-2"
        :class="{ active: !store.selectedPlaylist }"
        @click="select(null)"
      >
        <Images :size="16" />
        All Assets
      </button>
      <button
        v-for="playlist in store.playlists"
        :key="playlist"
        class="list-group-item list-group-item-action text-start"
        :class="{ active: store.selectedPlaylist === playlist }"
        @click="select(playlist)"
      >
        {{ playlist.name }}
      </button>
      <div
        v-if="!store.playlists.length"
        class="list-group-item small text-muted"
      >
        No playlists yet — create one below.
      </div>
    </div>
    <form class="p-3 input-group border-top" @submit.prevent="create">
      <input
        v-model="name"
        class="form-control form-control-sm"
        placeholder="Create a playlist"
      />
      <button class="btn btn-primary btn-sm" title="Create playlist">
        <Plus :size="16" />
      </button>
    </form>
  </section>
</template>
