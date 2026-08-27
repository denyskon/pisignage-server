<script setup>
// Single place to manage a playlist: identity, assets, layout and playback.
import { onMounted, ref } from "vue";
import {
  Check,
  LayoutGrid,
  MessageSquareText,
  Pencil,
  Settings2,
  Trash2,
} from "@lucide/vue";
import AssetGrid from "../assets/AssetGrid.vue";
import PlaylistEditor from "./PlaylistEditor.vue";
import LayoutModal from "./LayoutModal.vue";
import TickerModal from "./TickerModal.vue";
import PlaylistSettingsModal from "./PlaylistSettingsModal.vue";
import { api, urls } from "../../api";
import { store, loadFiles, loadPlaylists } from "../../stores/models";
import { confirmDialog, toast } from "../../stores/ui";
import { sanitizeName } from "../../utils/format";

const props = defineProps({ playlist: { type: Object, required: true } });
const emit = defineEmits(["close", "changed"]);
const loading = ref(true);
const modal = ref("");
const renaming = ref(false);
const nameValue = ref("");

onMounted(async () => {
  try {
    await Promise.all([loadFiles(), loadPlaylists()]);
  } catch (error) {
    toast(error.message, "error");
  } finally {
    loading.value = false;
  }
});

function beginRename() {
  nameValue.value = props.playlist.name;
  renaming.value = true;
}

async function renamePlaylist() {
  const name = sanitizeName(nameValue.value).trim();
  const originalName = props.playlist.name;
  if (!name || name === originalName) {
    renaming.value = false;
    return;
  }
  if (
    store.playlists.some(
      (playlist) => playlist !== props.playlist && playlist.name === name,
    )
  ) {
    toast("Playlist exists", "error");
    return;
  }
  try {
    await api.post(urls.files + encodeURIComponent(`__${originalName}.json`), {
      newname: `__${name}.json`,
    });
    props.playlist.name = name;
    renaming.value = false;
    toast("Playlist renamed");
  } catch (error) {
    toast(error.message, "error");
  }
}

async function deletePlaylist() {
  const name = props.playlist.name;
  if (
    !(await confirmDialog({
      title: "Delete playlist?",
      message: `Delete ${name}?`,
    }))
  )
    return;
  try {
    await api.del(urls.files + encodeURIComponent(`__${name}.json`));
    await api.post(urls.playlistfiles, { playlist: name, assets: [] });
    store.selectedPlaylist = null;
    await loadPlaylists();
    toast("Playlist deleted");
    emit("close");
  } catch (error) {
    toast(error.message, "error");
  }
}

function add(names) {
  for (const name of names)
    if (!props.playlist.assets.some((asset) => asset.filename === name))
      props.playlist.assets.push({
        filename: name,
        duration: parseInt(store.filesDetails[name]?.duration) || 10,
        option: { main: false },
      });
}
</script>

<template>
  <div v-if="loading" class="text-center py-5">
    <div class="spinner-border" />
  </div>
  <div v-else class="d-flex flex-column gap-3">
    <section class="pi-card">
      <header class="pi-card-header flex-wrap gap-2">
        <form
          v-if="renaming"
          class="input-group input-group-sm pi-detail-title-editor"
          @submit.prevent="renamePlaylist"
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
        <h2 v-else class="pi-card-title me-auto">
          {{ playlist.name }}
          <button
            class="btn btn-link btn-sm p-0 ms-1"
            title="Rename playlist"
            @click="beginRename"
          >
            <Pencil :size="16" />
          </button>
        </h2>
        <div class="d-flex gap-2 flex-wrap">
          <button
            class="btn btn-sm btn-outline-secondary btn-icon"
            @click="modal = 'layout'"
          >
            <LayoutGrid :size="16" /> Layout
          </button>
          <button
            class="btn btn-sm btn-outline-secondary btn-icon"
            @click="modal = 'ticker'"
          >
            <MessageSquareText :size="16" /> Ticker
          </button>
          <button
            class="btn btn-sm btn-outline-secondary btn-icon"
            @click="modal = 'settings'"
          >
            <Settings2 :size="16" /> Settings
          </button>
          <button
            class="btn btn-sm btn-outline-danger"
            title="Delete playlist"
            @click="deletePlaylist"
          >
            <Trash2 :size="16" />
          </button>
          <button
            class="btn btn-sm btn-primary btn-icon"
            @click="emit('close')"
          >
            <Check :size="16" /> Done
          </button>
        </div>
      </header>
    </section>
    <div class="row g-3">
      <div class="col-lg-6">
        <AssetGrid
          all-assets
          drag-source
          :playlist="playlist"
          @drop-asset="add"
        />
      </div>
      <div class="col-lg-6">
        <PlaylistEditor :playlist="playlist" />
      </div>
    </div>
    <LayoutModal
      v-if="modal === 'layout'"
      :playlist="playlist"
      @close="modal = ''"
    />
    <TickerModal
      v-if="modal === 'ticker'"
      :playlist="playlist"
      @close="modal = ''"
    />
    <PlaylistSettingsModal
      v-if="modal === 'settings'"
      :playlist="playlist"
      @close="modal = ''"
    />
  </div>
</template>
