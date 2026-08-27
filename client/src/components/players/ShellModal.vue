<script setup>
import { onMounted, ref } from "vue";
import PiModal from "../PiModal.vue";
import { api, urls } from "../../api";
import { toast } from "../../stores/ui";
const p = defineProps({ player: Object });
const e = defineEmits(["close"]);
const cmd = ref(""),
  out = ref({}),
  snap = ref(null),
  loading = ref(false),
  history = ref([]),
  hi = ref(-1);
async function execute() {
  if (!cmd.value) return;
  loading.value = true;
  try {
    const r = await api.post(urls.pishell + p.player._id, { cmd: cmd.value });
    out.value = r.data || {};
    history.value.unshift(cmd.value);
    hi.value = -1;
  } catch (x) {
    toast(x.message, "error");
  } finally {
    loading.value = false;
  }
}
async function snapshot() {
  try {
    const r = await api.post(urls.snapshot + p.player._id);
    snap.value = r.data;
  } catch (x) {
    toast(x.message, "error");
  }
}
async function tv(status) {
  try {
    await api.post(urls.pitv + p.player._id, { status });
    p.player.tvStatus = !status;
    toast(`TV turned ${status ? "off" : "on"}`);
  } catch (x) {
    toast(x.message, "error");
  }
}
function key(ev) {
  if (!history.value.length) return;
  if (ev.key === "ArrowUp") {
    ev.preventDefault();
    hi.value = Math.min(hi.value + 1, history.value.length - 1);
    cmd.value = history.value[hi.value];
  }
  if (ev.key === "ArrowDown") {
    ev.preventDefault();
    hi.value = Math.max(hi.value - 1, -1);
    cmd.value = hi.value < 0 ? "" : history.value[hi.value];
  }
}
onMounted(snapshot);
</script>
<template>
  <PiModal
    :title="player.isConnected ? 'Pi shell' : 'Player is OFFLINE'"
    size="lg"
    @close="e('close')"
    ><template #footer
      ><button class="btn btn-outline-secondary" @click="e('close')">
        Dismiss
      </button></template
    >
    <div class="d-flex justify-content-end gap-1 mb-3">
      <button
        class="btn btn-sm"
        :class="player.tvStatus ? 'btn-primary' : 'btn-outline-secondary'"
        @click="tv(false)"
      >
        TV on</button
      ><button
        class="btn btn-sm"
        :class="!player.tvStatus ? 'btn-primary' : 'btn-outline-secondary'"
        @click="tv(true)"
      >
        TV off
      </button>
    </div>
    <form class="input-group mb-3" @submit.prevent="execute">
      <input
        v-model="cmd"
        class="form-control"
        placeholder="Command"
        @keydown="key"
      /><button class="btn btn-primary" :disabled="loading">
        {{ loading ? "Running…" : "Execute" }}
      </button>
    </form>
    <pre v-if="out.err" class="text-danger">{{ out.err }}</pre>
    <pre v-if="out.stdout">stdout: {{ out.stdout }}</pre>
    <pre v-if="out.stderr" class="text-warning">stderr: {{ out.stderr }}</pre>
    <button class="btn btn-outline-secondary mb-2" @click="snapshot">
      Refresh snapshot
    </button>
    <div v-if="snap">
      <img
        class="img-fluid border rounded d-block"
        :src="snap.url + '?t=' + Date.now()"
        alt="Player snapshot"
      /><small>Last taken: {{ snap.lastTaken }}</small>
    </div></PiModal
  >
</template>
