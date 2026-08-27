<script setup>
import { reactive } from "vue";
import PiModal from "../PiModal.vue";
const props = defineProps({ group: Object });
const emit = defineEmits(["close", "save"]);
const value = reactive(JSON.parse(JSON.stringify(props.group)));
value.monitorArrangement ||= { mode: "single", reverse: false };
value.showClock ||= { enable: false, position: "top-right", format: "HH:mm" };
value.sleep ||= { enable: false, ontime: "", offtime: "" };
value.reboot ||= { enable: false, absoluteTime: "" };
value.kioskUi ||= { enable: false, url: "", timeout: 30 };
value.selectedVideoPlayer ||= value.enableMpv ? "mpv" : "default";
function save() {
  value.enableMpv = value.selectedVideoPlayer === "mpv";
  value.reboot.time = value.reboot.absoluteTime;
  emit("save", value);
}
</script>
<template>
  <PiModal title="Group settings" size="xl" @close="emit('close')"
    ><div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Resolution</label
        ><select v-model="value.resolution" class="form-select">
          <option value="1920x1080">1920 × 1080</option>
          <option value="1280x720">1280 × 720</option>
          <option value="3840x2160">3840 × 2160</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Orientation</label
        ><select v-model="value.orientation" class="form-select">
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
          <option value="portrait270">Portrait 270°</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Monitor arrangement</label
        ><select v-model="value.monitorArrangement.mode" class="form-select">
          <option value="single">Single</option>
          <option value="tile">Tile</option></select
        ><label class="form-check mt-1"
          ><input
            v-model="value.monitorArrangement.reverse"
            class="form-check-input"
            type="checkbox"
          />
          Reverse</label
        >
      </div>
      <div class="col-md-6">
        <label class="form-check"
          ><input
            v-model="value.animationEnable"
            class="form-check-input"
            type="checkbox"
          />
          Enable animations</label
        ><input
          v-model="value.animationType"
          class="form-control mt-1"
          placeholder="Animation type"
        />
      </div>
      <div class="col-md-4">
        <label class="form-label">Background color</label
        ><input
          v-model="value.signageBackgroundColor"
          type="color"
          class="form-control form-control-color"
        />
      </div>
      <div class="col-md-4">
        <label class="form-label">Volume</label
        ><input
          v-model.number="value.omxVolume"
          type="number"
          min="0"
          max="100"
          class="form-control"
        />
      </div>
      <div class="col-md-4">
        <label class="form-label">Logo file</label
        ><input v-model="value.logo" class="form-control" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Logo X / Y</label>
        <div class="input-group">
          <input
            v-model.number="value.logox"
            type="number"
            class="form-control"
          /><input
            v-model.number="value.logoy"
            type="number"
            class="form-control"
          />
        </div>
      </div>
      <div class="col-md-6">
        <label class="form-check"
          ><input
            v-model="value.showClock.enable"
            class="form-check-input"
            type="checkbox"
          />
          Show clock</label
        >
        <div v-if="value.showClock.enable" class="input-group mt-1">
          <input
            v-model="value.showClock.position"
            class="form-control"
            placeholder="Position"
          /><input
            v-model="value.showClock.format"
            class="form-control"
            placeholder="Format"
          />
        </div>
      </div>
      <div class="col-12">
        <label
          v-for="x in [
            ['resizeAssets', 'Resize assets'],
            ['imageLetterboxed', 'Letterbox images'],
            ['videoKeepAspect', 'Keep video aspect'],
            ['urlReloadDisable', 'Reload link URLs each time'],
            ['keepWeblinksInMemory', 'Keep webpages in memory'],
          ]"
          :key="x[0]"
          class="form-check form-check-inline"
          ><input
            v-model="value[x[0]]"
            class="form-check-input"
            type="checkbox"
          />
          {{ x[1] }}</label
        >
      </div>
      <div class="col-md-6">
        <label class="form-label">Stop video after seconds</label
        ><input
          v-model.number="value.timeToStopVideo"
          type="number"
          class="form-control"
        />
      </div>
      <div class="col-md-6">
        <label class="form-label">Video player</label
        ><select v-model="value.selectedVideoPlayer" class="form-select">
          <option value="default">Default</option>
          <option value="mpv">MPV</option>
          <option value="cvlc">VLC</option></select
        ><input
          v-if="value.selectedVideoPlayer === 'mpv'"
          v-model="value.mpvAudioDelay"
          class="form-control mt-1"
          placeholder="MPV audio delay seconds"
        />
      </div>
      <div class="col-md-6">
        <label class="form-check"
          ><input
            v-model="value.sleep.enable"
            class="form-check-input"
            type="checkbox"
          />
          Schedule display off</label
        >
        <div v-if="value.sleep.enable" class="input-group mt-1">
          <input
            v-model="value.sleep.ontime"
            type="time"
            class="form-control"
          /><input
            v-model="value.sleep.offtime"
            type="time"
            class="form-control"
          />
        </div>
      </div>
      <div class="col-md-6">
        <label class="form-check"
          ><input
            v-model="value.reboot.enable"
            class="form-check-input"
            type="checkbox"
          />
          Daily reboot</label
        ><input
          v-if="value.reboot.enable"
          v-model="value.reboot.absoluteTime"
          type="time"
          class="form-control mt-1"
        />
      </div>
      <div class="col-12">
        <label class="form-check"
          ><input
            v-model="value.kioskUi.enable"
            class="form-check-input"
            type="checkbox"
          />
          Enable kiosk menu</label
        >
        <div v-if="value.kioskUi.enable" class="row g-2 mt-1">
          <div class="col-md-8">
            <input
              v-model="value.kioskUi.url"
              class="form-control"
              placeholder="Leave blank for default"
            />
          </div>
          <div class="col-md-4">
            <input
              v-model.number="value.kioskUi.timeout"
              type="number"
              class="form-control"
              placeholder="30 secs"
            />
          </div>
        </div>
      </div>
      <div class="col-12">
        <label
          v-for="x in [
            ['disableAp', 'Disable player Wi-Fi AP'],
            ['disableWebUi', 'Disable player webUI'],
            ['disableWarnings', 'Disable power/temperature warnings'],
            ['enablePio', 'Enable GPIO media control (17,18,27)'],
          ]"
          :key="x[0]"
          class="form-check form-check-inline"
          ><input
            v-model="value[x[0]]"
            class="form-check-input"
            type="checkbox"
          />
          {{ x[1] }}</label
        >
      </div>
    </div>
    <template #footer
      ><button class="btn btn-outline-secondary" @click="emit('close')">
        Cancel</button
      ><button class="btn btn-primary" @click="save">
        Save settings
      </button></template
    ></PiModal
  >
</template>
