<script setup>
import PiModal from "../PiModal.vue";
import { api, urls } from "../../api";
import { toast } from "../../stores/ui";
const props = defineProps({ playlist: Object });
const emit = defineEmits(["close"]);
const s = props.playlist.settings || (props.playlist.settings = {});
s.ads ||= { adPlaylist: false, adCount: 1, adInterval: 60 };
s.domination ||= { enable: false, timeInterval: 0 };
s.audio ||= { enable: false, random: false, volume: 50 };
s.event ||= { enable: false, duration: 0 };
s.keyPress ||= { enable: false, key: 0, playOnceParameter: false };
async function save() {
  try {
    await api.post(urls.playlists + encodeURIComponent(props.playlist.name), {
      settings: s,
    });
    toast("Playlist settings saved");
    emit("close");
  } catch (e) {
    toast(e.message, "error");
  }
}
</script>
<template>
  <PiModal title="Playlist settings" @close="emit('close')"
    ><div class="vstack gap-3">
      <fieldset>
        <legend class="fs-6">Advertising</legend>
        <label class="form-check"
          ><input
            v-model="s.ads.adPlaylist"
            class="form-check-input"
            type="checkbox"
          />
          Make this an advertising playlist</label
        >
        <div v-if="s.ads.adPlaylist" class="row">
          <label class="col"
            >Assets<input
              v-model.number="s.ads.adCount"
              class="form-control"
              type="number" /></label
          ><label class="col"
            >Interval seconds<input
              v-model.number="s.ads.adInterval"
              class="form-control"
              type="number"
          /></label>
        </div>
      </fieldset>
      <fieldset>
        <legend class="fs-6">Domination</legend>
        <label class="form-check"
          ><input
            v-model="s.domination.enable"
            class="form-check-input"
            type="checkbox"
          />
          Enable</label
        ><input
          v-if="s.domination.enable"
          v-model.number="s.domination.timeInterval"
          class="form-control"
          type="number"
        />
      </fieldset>
      <fieldset>
        <legend class="fs-6">Audio</legend>
        <label class="form-check"
          ><input
            v-model="s.audio.enable"
            class="form-check-input"
            type="checkbox"
          />
          Enable audio playlist</label
        >
        <div v-if="s.audio.enable">
          <label class="form-check"
            ><input
              v-model="s.audio.random"
              class="form-check-input"
              type="checkbox"
            />
            Random order</label
          ><input
            v-model.number="s.audio.volume"
            class="form-control"
            type="number"
            min="0"
            max="100"
          />
        </div>
      </fieldset>
      <fieldset>
        <legend class="fs-6">Event</legend>
        <label class="form-check"
          ><input
            v-model="s.event.enable"
            class="form-check-input"
            type="checkbox"
          />
          Enable</label
        ><input
          v-if="s.event.enable"
          v-model="s.event.duration"
          class="form-control"
        />
      </fieldset>
      <fieldset>
        <legend class="fs-6">Key press</legend>
        <label class="form-check"
          ><input
            v-model="s.keyPress.enable"
            class="form-check-input"
            type="checkbox"
          />
          Enable</label
        ><input
          v-if="s.keyPress.enable"
          v-model.number="s.keyPress.key"
          class="form-control"
          type="number"
        />
      </fieldset>
      <label class="form-check"
        ><input
          v-model="s.onlineOnly"
          class="form-check-input"
          type="checkbox"
        />
        Play only when online</label
      >
    </div>
    <template #footer
      ><button class="btn btn-primary" @click="save">Save</button></template
    ></PiModal
  >
</template>
