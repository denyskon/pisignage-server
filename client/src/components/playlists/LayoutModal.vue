<script setup>
import { ref } from 'vue'; import PiModal from '../PiModal.vue'; import { layouts,layoutOtherZones,api,urls } from '../../api'; import { store } from '../../stores/models'; import { toast } from '../../stores/ui';const props=defineProps({playlist:Object});const emit=defineEmits(['close']);const tab=ref('layouts');async function save(){try{await api.post(urls.playlists+encodeURIComponent(props.playlist.name),{layout:props.playlist.layout,templateName:props.playlist.templateName,videoWindow:props.playlist.videoWindow,zoneVideoWindow:props.playlist.zoneVideoWindow});toast('Layout saved')}catch(e){toast(e.message,'error')}}function choose(k){if(k.startsWith('custom')&&!store.files.some(f=>/^custom_layout.*html$/i.test(f)))return toast('Upload a custom layout template first','error');props.playlist.layout=k;save()};function windowDefault(){return {length:'',width:'',xoffset:'',yoffset:'',mainzoneOnly:false}}
</script>
<template>
  <PiModal title="Select display layout" size="xl" @close="emit('close')"
    ><ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: tab === 'layouts' }"
          @click="tab = 'layouts'"
        >
          Layouts
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: tab === 'window' }"
          @click="tab = 'window'"
        >
          Main Video Window
        </button>
      </li>
    </ul>
    <div v-if="tab === 'layouts'" class="row g-2">
      <button
        v-for="(v, k) in layouts"
        :key="k"
        class="col-6 col-md-4 btn text-start"
        :class="playlist.layout === k ? 'btn-primary' : 'btn-outline-secondary'"
        @click="choose(k)"
      >
        <img
          :src="'/img/' + k + '.png'"
          height="40"
          class="me-2"
          @error="$event.target.style.display = 'none'"
        /><strong>{{ k }}</strong
        ><br /><small>{{ v.title }}</small>
      </button>
    </div>
    <div v-else>
      <div class="form-check">
        <input
          id="mainzone"
          v-model="
            (playlist.videoWindow || (playlist.videoWindow = windowDefault()))
              .mainzoneOnly
          "
          class="form-check-input"
          type="checkbox"
        /><label for="mainzone">Use main zone only</label>
      </div>
      <div class="row g-2 mt-1">
        <label
          v-for="key in ['length', 'width', 'xoffset', 'yoffset']"
          :key="key"
          class="col"
          >{{ key
          }}<input v-model="playlist.videoWindow[key]" class="form-control"
        /></label>
      </div>
      <button class="btn btn-primary mt-3" @click="save">
        Save video window
      </button>
    </div>
    <template #footer
      ><button class="btn btn-primary" @click="emit('close')">
        Done
      </button></template
    ></PiModal
  >
</template>
