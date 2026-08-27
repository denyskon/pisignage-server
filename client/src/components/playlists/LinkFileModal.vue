<script setup>
import { computed, ref } from "vue";
import PiModal from "../PiModal.vue";
import { store } from "../../stores/models";
import { fileTypeOf } from "../../utils/format";
const props = defineProps({ item: Object, zone: String });
const emit = defineEmits(["close", "selected"]);
const tab = ref("assets"),
  search = ref("");
const assets = computed(() =>
  store.files.filter(
    (n) =>
      !["audio", "radio", "tv", "weblink"].includes(fileTypeOf(n)) &&
      n.toLowerCase().includes(search.value.toLowerCase()),
  ),
);
function pick(n) {
  emit("selected", n);
  emit("close");
}
</script>
<template>
  <PiModal :title="'File for ' + zone + ' zone'" @close="emit('close')"
    ><div class="btn-group mb-3">
      <button
        class="btn btn-sm"
        :class="tab === 'assets' ? 'btn-primary' : 'btn-outline-secondary'"
        @click="tab = 'assets'"
      >
        Assets</button
      ><button
        class="btn btn-sm"
        :class="tab === 'playlists' ? 'btn-primary' : 'btn-outline-secondary'"
        @click="tab = 'playlists'"
      >
        Playlists
      </button>
    </div>
    <input
      v-model="search"
      class="form-control mb-2"
      placeholder="Filter by name"
    />
    <div v-if="tab === 'assets'" class="list-group">
      <button
        v-for="n in assets"
        class="list-group-item list-group-item-action"
        :class="{ active: item[zone] === n }"
        @click="pick(n)"
      >
        {{ n }}
      </button>
    </div>
    <div v-else class="list-group">
      <button
        v-for="p in store.playlists"
        class="list-group-item list-group-item-action"
        @click="pick('__' + p.name + '.json')"
      >
        {{ p.name }}
      </button>
    </div>
    <template #footer
      ><button class="btn btn-primary" @click="emit('close')">
        Done
      </button></template
    ></PiModal
  >
</template>
