<script setup>
import { computed, ref } from "vue";
import PiModal from "../PiModal.vue";
import { api, urls } from "../../api";
import { store } from "../../stores/models";
import { toast } from "../../stores/ui";
const p = defineProps({ player: Object });
const e = defineEmits(["close"]);
const busy = ref(false);
const target = computed(() =>
  p.player.player2
    ? store.currentVersion.versionP2 || store.currentVersion.version
    : store.currentVersion.version,
);
async function update(version = target.value) {
  if (!p.player.isConnected) {
    toast("Player is offline", "error");
    return;
  }
  busy.value = true;
  try {
    await api.post(urls.swupdate + p.player._id, { version });
    toast("Software update started");
    e("close");
  } catch (x) {
    toast(x.message, "error");
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <PiModal title="Software update" @close="e('close')"
    ><p v-if="!target">
      Latest version information is unavailable. The server could not reach the
      piSignage release feed.
    </p>
    <p v-else-if="player.version === target">Your player is up to date.</p>
    <p v-else>
      Update software from {{ player.version || "unknown" }} to {{ target }}?
    </p>
    <template #footer
      ><button
        v-if="store.currentVersion.beta && !player.player2"
        class="btn btn-outline-danger me-auto"
        @click="update('piimage-beta.zip')"
      >
        Update to beta {{ store.currentVersion.beta }}</button
      ><button class="btn btn-outline-secondary" @click="e('close')">
        Cancel</button
      ><button
        class="btn btn-danger"
        :disabled="busy || !target"
        @click="update"
      >
        Update
      </button></template
    ></PiModal
  >
</template>
