<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { Trash2, ExternalLink, FileText } from "@lucide/vue";
import PageHeader from "../components/PageHeader.vue";
import { api, urls } from "../api";
import { isLinkType, fileTypeOf } from "../utils/format";
import { toast, confirmDialog } from "../stores/ui";
import LabelsModal from "../components/assets/LabelsModal.vue";
const route = useRoute(),
  loading = ref(true),
  asset = ref(null),
  link = reactive({}),
  labels = ref([]),
  showLabels = ref(false);
const file = computed(() => decodeURIComponent(route.params.file));
const type = computed(() => fileTypeOf(file.value));
const media = computed(() => "/media/" + encodeURIComponent(file.value));
async function load() {
  loading.value = true;
  try {
    if (isLinkType(file.value)) {
      const r = await api.get(urls.links + encodeURIComponent(file.value));
      Object.assign(link, JSON.parse(r.data?.data || "{}"));
      asset.value = r.data?.dbdata || { name: file.value, labels: [] };
    } else {
      const r = await api.get(urls.files + encodeURIComponent(file.value));
      asset.value = {
        ...(r.data?.dbdata || {}),
        name: r.data?.name || file.value,
        path: r.data?.path,
      };
    }
    labels.value = [...(asset.value?.labels || [])];
  } catch (e) {
    toast(e.message, "error");
  } finally {
    loading.value = false;
  }
}
onMounted(load);
async function save() {
  try {
    if (isLinkType(file.value)) await api.post(urls.links, { details: link });
    if (asset.value?._id) {
      asset.value.labels = labels.value;
      await api.post(urls.files + encodeURIComponent(file.value), {
        dbdata: asset.value,
      });
    }
    toast("Asset saved");
  } catch (e) {
    toast(e.message, "error");
  }
}
async function remove() {
  if (!(await confirmDialog({ title: "Delete asset?", message: file.value })))
    return;
  try {
    await api.del(urls.files + encodeURIComponent(file.value));
    toast("Asset deleted");
    window.location.hash = "#/assets/main";
  } catch (e) {
    toast(e.message, "error");
  }
}
</script>
<template>
  <section class="pi-page">
    <PageHeader title="Asset details" :icon="FileText" />
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" />
    </div>
    <section v-else-if="asset" class="pi-card">
      <header class="pi-card-header d-flex">
        <h2 class="pi-card-title me-auto">
          {{ asset.name || link.name + link.type }}
        </h2>
        <button class="btn btn-outline-danger btn-sm" @click="remove">
          <Trash2 :size="16" />
        </button>
      </header>
      <div class="p-3">
        <div class="mb-4 text-center">
          <img
            v-if="type === 'image'"
            :src="media"
            class="img-fluid"
            style="max-height: 360px"
          /><video
            v-else-if="type === 'video'"
            :src="media"
            controls
            class="mw-100"
            style="max-height: 360px"
          /><audio
            v-else-if="['audio', 'radio'].includes(type)"
            :src="media"
            controls
          /><iframe
            v-else-if="['html', 'pdf'].includes(type)"
            :src="media"
            class="w-100 border"
            style="height: 360px"
          />
        </div>
        <form v-if="isLinkType(file)" class="row g-3" @submit.prevent="save">
          <label v-if="link.type !== '.txt'" class="col-12"
            >Address
            <div class="input-group">
              <input v-model="link.link" class="form-control" /><a
                class="btn btn-outline-secondary"
                :href="link.link"
                target="_blank"
                ><ExternalLink :size="16"
              /></a></div
          ></label>
          <p class="col-12">Type: {{ link.type }}</p>
          <div v-if="link.type === '.stream'" class="col-12">
            <label class="form-check"
              ><input
                v-model="link.tcp"
                class="form-check-input"
                type="checkbox"
              />
              TCP stream</label
            >
          </div>
          <label v-if="link.type === '.weblink'" class="col-12"
            >Zoom<input
              v-model.number="link.zoom"
              class="form-control"
              type="number"
              step=".01" /></label
          ><template v-if="link.type === '.mrss'"
            ><label class="col"
              >Number of items<input
                v-model.number="link.numberOfItems"
                class="form-control"
                type="number" /></label
            ><label class="col"
              >Duration<input
                v-model.number="link.duration"
                class="form-control"
                type="number" /></label></template
          ><label v-if="['.txt', '.mrss'].includes(link.type)" class="col-12"
            >Optional CSS<input
              v-model="link.style"
              class="form-control" /></label
          ><label v-if="link.type === '.txt'" class="col-12"
            >Message<textarea
              v-model="link.message"
              class="form-control"
              rows="4"
            /></label
          ><label v-if="link.type === '.weblink'" class="col-12"
            >Keystrokes<input
              v-model="link.keystrokes"
              class="form-control" /></label
          ><button class="btn btn-primary col-auto ms-2">Update link</button>
        </form>
        <hr />
        <div class="d-flex gap-2 align-items-center">
          <strong>Labels:</strong><span>{{ labels.join(", ") || "None" }}</span
          ><button
            class="btn btn-outline-secondary btn-sm"
            @click="showLabels = true"
          >
            Edit labels</button
          ><button class="btn btn-primary btn-sm" @click="save">Save</button>
        </div>
      </div>
      <LabelsModal
        v-if="showLabels"
        v-model="labels"
        @close="showLabels = false"
      />
    </section>
  </section>
</template>
