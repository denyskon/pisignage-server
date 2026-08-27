<script setup>
import { computed, ref } from "vue";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  FolderOpen,
  Tag,
} from "@lucide/vue";
import AssetThumb from "../AssetThumb.vue";
import EmptyState from "../EmptyState.vue";
import UploadModal from "./UploadModal.vue";
import LinkModal from "./LinkModal.vue";
import LabelsModal from "./LabelsModal.vue";
import ValidityModal from "./ValidityModal.vue";
import { store, assemblePlaylistAssets, loadFiles } from "../../stores/models";
import { api, urls } from "../../api";
import { toast, confirmDialog } from "../../stores/ui";
import { formatDate, sanitizeName } from "../../utils/format";
const props = defineProps({
  allAssets: { type: Boolean, default: false },
  playlist: { type: Object, default: null },
  dragSource: { type: Boolean, default: false },
});
const emit = defineEmits(["changed", "drop-asset"]);
const search = ref(""),
  label = ref(null),
  manage = ref(false),
  selected = ref([]),
  modal = ref(""),
  linkType = ref(".tv"),
  validAsset = ref(null),
  rename = ref({});
const rows = computed(() => {
  let a = props.allAssets
    ? store.files.map((n) => ({
        fileDetails: store.filesDetails[n] || { name: n },
        playlistDetails: {
          filename: n,
          duration:
            parseInt(store.filesDetails[n]?.duration) ||
            store.serverConfig?.defaultDuration ||
            10,
          option: { main: false },
        },
      }))
    : assemblePlaylistAssets()[props.playlist?.name]?.assets || [];
  return a.filter(
    (r) =>
      (!search.value ||
        r.fileDetails.name
          .toLowerCase()
          .includes(search.value.toLowerCase())) &&
      (!label.value || (r.fileDetails.labels || []).includes(label.value)),
  );
});
function drag(e, row) {
  if (props.dragSource)
    e.dataTransfer.setData("text/plain", row.fileDetails.name);
}
async function remove(row) {
  if (
    !(await confirmDialog({
      title: "Delete asset?",
      message: row.fileDetails.name,
    }))
  )
    return;
  try {
    await api.del(urls.files + encodeURIComponent(row.fileDetails.name));
    await loadFiles();
    toast("Asset deleted");
    emit("changed");
  } catch (e) {
    toast(e.message, "error");
  }
}
async function saveRename(row) {
  const n = sanitizeName(rename.value[row.fileDetails.name]);
  if (!n) return;
  try {
    await api.post(urls.files + encodeURIComponent(row.fileDetails.name), {
      newname: n,
    });
    await loadFiles();
    toast("Asset renamed");
    emit("changed");
  } catch (e) {
    toast(e.message, "error");
  }
}
async function labels(v) {
  for (const row of selected.value) {
    try {
      row.fileDetails.labels = v;
      await api.post(urls.files + encodeURIComponent(row.fileDetails.name), {
        dbdata: row.fileDetails,
      });
    } catch (e) {
      toast(e.message, "error");
    }
  }
  selected.value = [];
  modal.value = "";
  emit("changed");
}
function addType(t) {
  linkType.value = t;
  modal.value = "link";
}
</script>
<template>
  <section class="pi-card">
    <header class="pi-card-header d-flex gap-2 align-items-center flex-wrap">
      <h2 class="pi-card-title me-auto">
        {{ rows.length }} assets
        <small class="text-muted fw-normal">{{
          playlist ? "in " + playlist.name : "in your library"
        }}</small>
      </h2>
      <div class="input-group input-group-sm" style="max-width: 220px">
        <span class="input-group-text"><Search :size="16" /></span
        ><input
          v-model="search"
          class="form-control"
          placeholder="Search assets"
        />
      </div>
      <div class="dropdown">
        <button
          class="btn btn-success btn-sm dropdown-toggle"
          data-bs-toggle="dropdown"
        >
          <Plus :size="16" /> Add asset
        </button>
        <ul class="dropdown-menu">
          <li>
            <button class="dropdown-item" @click="modal = 'upload'">
              Upload
            </button>
          </li>
          <li>
            <button class="dropdown-item" @click="addType('.tv')">
              Add a Link
            </button>
          </li>
          <li>
            <button class="dropdown-item" @click="addType('.txt')">
              Add a Message
            </button>
          </li>
          <li>
            <button class="dropdown-item" @click="addType('.local')">
              Add local folder
            </button>
          </li>
        </ul>
      </div>
      <button
        class="btn btn-outline-secondary btn-sm"
        @click="manage = !manage"
      >
        <Pencil :size="16" /> {{ manage ? "Done" : "Manage" }}
      </button>
    </header>
    <div class="p-3 border-bottom d-flex gap-2 align-items-center">
      <button
        class="btn btn-outline-secondary btn-sm"
        @click="modal = 'labels'"
      >
        <Tag :size="16" /> {{ label || "Labels" }}</button
      ><button v-if="label" class="btn btn-link btn-sm" @click="label = null">
        Clear filter</button
      ><button
        v-if="selected.length && playlist"
        class="btn btn-primary btn-sm"
        @click="
          emit(
            'drop-asset',
            selected.map((x) => x.fileDetails.name),
          );
          selected = [];
        "
      >
        Assign to playlist
      </button>
    </div>
    <div v-if="rows.length" class="list-group list-group-flush">
      <div
        v-for="row in rows"
        :key="row.fileDetails.name"
        class="list-group-item d-flex gap-3 align-items-center"
        :class="{ 'list-group-item-danger': row.deleted }"
        draggable="true"
        @dragstart="drag($event, row)"
      >
        <input
          v-if="!manage"
          v-model="selected"
          :value="row"
          class="form-check-input"
          type="checkbox"
        /><AssetThumb :file-details="row.fileDetails" size="sm" />
        <div class="flex-grow-1 min-w-0">
          <template v-if="manage"
            ><div class="input-group input-group-sm">
              <input
                v-model="rename[row.fileDetails.name]"
                class="form-control"
                :placeholder="row.fileDetails.name"
              /><button class="btn btn-primary" @click="saveRename(row)">
                Save
              </button>
            </div></template
          ><router-link
            v-else
            :to="'/assets/detail/' + encodeURIComponent(row.fileDetails.name)"
            class="text-decoration-none fw-semibold"
            >{{ row.fileDetails.name }}</router-link
          >
          <div class="small text-muted">
            {{ row.fileDetails.type || "other" }} ·
            {{ row.fileDetails.size || "" }} ·
            {{ formatDate(row.fileDetails.createdAt) }}
          </div>
          <div class="small text-muted">
            {{ (row.fileDetails.labels || []).join(", ") }}
          </div>
        </div>
        <button
          v-if="!manage"
          class="btn btn-outline-secondary btn-sm"
          @click="validAsset = row.fileDetails"
        >
          <Calendar :size="16" /></button
        ><button
          v-else
          class="btn btn-outline-danger btn-sm align-self-start"
          @click="remove(row)"
        >
          <Trash2 :size="16" />
        </button>
      </div>
    </div>
    <EmptyState
      v-else
      :icon="FolderOpen"
      title="No assets yet"
      message="Add an upload, link, or message to start building your signage library."
      ><button class="btn btn-primary" @click="modal = 'upload'">
        Upload your first asset
      </button></EmptyState
    ><UploadModal
      v-if="modal === 'upload'"
      @close="modal = ''"
      @saved="emit('changed')"
    /><LinkModal
      v-if="modal === 'link'"
      :type="linkType"
      @close="modal = ''"
      @saved="emit('changed')"
    /><LabelsModal
      v-if="modal === 'labels'"
      :model-value="label ? [label] : []"
      @update:model-value="(v) => (label = v[0] || null)"
      @close="modal = ''"
    /><ValidityModal
      v-if="validAsset"
      :asset="validAsset"
      @close="validAsset = null"
    />
  </section>
</template>
