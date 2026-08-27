<script setup>
import { reactive } from "vue";
import PiModal from "../PiModal.vue";
import { api, urls } from "../../api";
import { toast } from "../../stores/ui";
const props = defineProps({ playlist: Object });
const emit = defineEmits(["close"]);
const t = reactive(
  props.playlist.settings.ticker || {
    enable: false,
    behavior: "scroll",
    textSpeed: 3,
    rss: { enable: false, link: null, feedDelay: 10 },
  },
);
props.playlist.settings.ticker = t;
async function save() {
  if (t.rss?.enable && !t.rss.link)
    return toast("Please enter RSS link address", "error");
  t.style = (t.style || "").replaceAll('"', "");
  t.messages = (t.messages || "").replaceAll("'", "`");
  try {
    await api.post(urls.playlists + encodeURIComponent(props.playlist.name), {
      settings: props.playlist.settings,
    });
    toast("Ticker saved");
    emit("close");
  } catch (e) {
    toast(e.message, "error");
  }
}
</script>
<template>
  <PiModal title="Ticker settings" @close="emit('close')"
    ><div class="form-check">
      <input
        id="ticker"
        v-model="t.enable"
        class="form-check-input"
        type="checkbox"
      /><label for="ticker">Show ticker</label>
    </div>
    <div class="form-check">
      <input
        id="banner"
        v-model="t.bannerText"
        class="form-check-input"
        type="checkbox"
      /><label for="banner">Show asset associated text</label>
    </div>
    <label class="form-label mt-3"
      >Behavior<select v-model="t.behavior" class="form-select">
        <option value="slide">Slide</option>
        <option value="scroll">Scroll left</option>
        <option value="scrollRight">Scroll right</option>
        <option value="openvg_left">Hardware left</option>
        <option value="openvg_right">Hardware right</option>
      </select></label
    ><label v-if="!t.behavior.startsWith('openvg')" class="form-label w-100"
      >Optional CSS<input v-model="t.style" class="form-control" /></label
    ><label class="form-label w-100"
      >Ticker messages<textarea
        v-if="!t.rss?.enable"
        v-model="t.messages"
        class="form-control"
        rows="4"
      />
    </label>
    <div class="form-check">
      <input
        id="rss"
        v-model="t.rss.enable"
        class="form-check-input"
        type="checkbox"
      /><label for="rss">Use RSS feed</label>
    </div>
    <label v-if="t.rss.enable" class="form-label w-100"
      >RSS link<input v-model="t.rss.link" class="form-control" /></label
    ><template #footer
      ><button class="btn btn-primary" @click="save">Save</button></template
    ></PiModal
  >
</template>
