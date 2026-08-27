<script setup>
import { computed, ref, watch } from "vue";
import { Copy, Trash2, Paperclip, X } from "@lucide/vue";
import AssetThumb from "../AssetThumb.vue";
import EmptyState from "../EmptyState.vue";
import LinkFileModal from "./LinkFileModal.vue";
import { api, urls, layoutOtherZones } from "../../api";
import { store } from "../../stores/models";
import { muteButtonEnable, fileTypeOf } from "../../utils/format";
import { toast } from "../../stores/ui";
const props = defineProps({ playlist: Object }),
  emit = defineEmits(["saved"]),
  link = ref(null),
  dragIndex = ref(null),
  zones = computed(() => layoutOtherZones[props.playlist.layout] || []);
const items = computed(() => {
  const assets = props.playlist?.assets || [];
  for (const asset of assets) asset.option ||= { main: false };
  return assets;
});
watch(
  () => props.playlist,
  (pl) => pl && normalise(),
  { immediate: true },
);
function normalise() {
  for (const a of props.playlist.assets || []) {
    a.duration = Math.max(2, Number(a.duration) || 2);
    a.option ||= { main: false };
    if (!zones.value.length) a.fullscreen = true;
  }
}
normalise();
async function save() {
  normalise();
  try {
    await api.post(urls.playlists + encodeURIComponent(props.playlist.name), {
      assets: props.playlist.assets,
    });
    const files = [];
    for (const a of props.playlist.assets) {
      if (!a.filename.startsWith("_system")) files.push(a.filename);
      for (const z of zones.value)
        if (a[z] && !a[z].startsWith("_system")) files.push(a[z]);
    }
    await api.post(urls.playlistfiles, {
      playlist: props.playlist.name,
      assets: [...new Set(files)],
    });
    emit("saved");
  } catch (e) {
    toast(e.message, "error");
  }
}
function drop(e, target) {
  const name = e.dataTransfer.getData("text/plain");
  if (name) {
    if (props.playlist.assets.some((a) => a.filename === name)) return;
    const d = store.filesDetails[name] || {};
    props.playlist.assets.splice(target ?? props.playlist.assets.length, 0, {
      filename: name,
      duration:
        parseInt(d.duration) || store.serverConfig?.defaultDuration || 10,
      option: { main: false },
    });
    return save();
  }
  if (
    dragIndex.value !== null &&
    target !== undefined &&
    dragIndex.value !== target
  ) {
    const [a] = props.playlist.assets.splice(dragIndex.value, 1);
    props.playlist.assets.splice(target, 0, a);
    save();
  }
  dragIndex.value = null;
}
function remove(i) {
  props.playlist.assets.splice(i, 1);
  save();
}
function duplicate(i) {
  props.playlist.assets.splice(i, 0, structuredClone(props.playlist.assets[i]));
  save();
}
function choose(n) {
  link.value.item[link.value.zone] = n;
  link.value = null;
  save();
}
function option(item) {
  return item.option || (item.option = { main: false });
}
</script>
<template>
  <section class="pi-card h-100" @dragover.prevent @drop="drop($event)">
    <header class="pi-card-header">
      <h2 class="pi-card-title">
        {{ playlist.assets?.length || 0 }} items in {{ playlist.name }}
      </h2>
      <small>Drag assets here to add or reorder</small>
    </header>
    <div v-if="playlist.assets?.length" class="list-group list-group-flush">
      <div
        v-for="(item, i) in items"
        :key="i"
        class="list-group-item"
        draggable="true"
        @dragstart="dragIndex = i"
        @dragover.prevent
        @drop.stop="drop($event, i)"
      >
        <div class="d-flex gap-2 align-items-center">
          <AssetThumb
            :file-details="
              store.filesDetails[item.filename] || { name: item.filename }
            "
            size="sm"
          />
          <div class="flex-grow-1">
            <strong>{{ item.filename }}</strong>
            <div
              v-if="
                !store.files.includes(item.filename) &&
                !item.filename.startsWith('_system')
              "
              class="small text-danger"
            >
              Missing from disk
            </div>
          </div>
          <input
            v-model.number="item.duration"
            class="form-control form-control-sm"
            style="width: 76px"
            min="2"
            type="number"
            @change="save"
          /><button
            class="btn btn-outline-secondary btn-sm"
            @click="duplicate(i)"
          >
            <Copy :size="16" /></button
          ><button class="btn btn-outline-danger btn-sm" @click="remove(i)">
            <Trash2 :size="16" />
          </button>
        </div>
        <div v-if="zones.length" class="mt-2">
          <label class="form-check form-check-inline"
            ><input
              v-model="item.fullscreen"
              class="form-check-input"
              type="checkbox"
              @change="save"
            />
            fullscreen</label
          ><span v-for="z in zones" :key="z" class="btn-group btn-group-sm me-1"
            ><button
              class="btn btn-outline-secondary"
              @click="link = { item, zone: z }"
            >
              <Paperclip :size="14" /> {{ z }}: {{ item[z] || "none" }}</button
            ><button
              v-if="item[z]"
              class="btn btn-outline-danger"
              @click="
                item[z] = null;
                save();
              "
            >
              <X :size="14" /></button
          ></span>
        </div>
        <div class="mt-2 small">
          <label
            v-if="muteButtonEnable(item.filename)"
            class="form-check form-check-inline"
            ><input
              v-model="option(item).main"
              class="form-check-input"
              type="checkbox"
              @change="save"
            />
            mute audio</label
          ><label
            v-if="['audio', 'radio'].includes(fileTypeOf(item.filename))"
            class="form-check form-check-inline"
            ><input
              :checked="!option(item).main"
              class="form-check-input"
              type="checkbox"
              @change="
                option(item).main = !$event.target.checked;
                save();
              "
            />
            play in background</label
          ><label
            v-if="['image', 'video'].includes(fileTypeOf(item.filename))"
            class="ms-3"
            >Banner text
            <input
              v-model="option(item).bannerText"
              class="form-control form-control-sm d-inline-block"
              @change="save" /></label
          ><label
            v-if="fileTypeOf(item.filename) === 'pdf'"
            class="form-check form-check-inline"
            ><input
              v-model="option(item).main"
              class="form-check-input"
              type="checkbox"
              @change="save" />
            presentation mode
            <input
              v-if="option(item).main"
              v-model.number="option(item).subduration"
              type="number"
              @change="save"
          /></label>
        </div>
      </div>
    </div>
    <EmptyState
      v-else
      title="Nothing to show"
      message="Drag assets to this box."
    /><LinkFileModal
      v-if="link"
      :item="link.item"
      :zone="link.zone"
      @close="link = null"
      @selected="choose"
    />
  </section>
</template>
