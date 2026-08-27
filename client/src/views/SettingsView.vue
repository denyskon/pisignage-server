<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import {
  KeyRound,
  LoaderCircle,
  Save,
  Settings,
  Trash2,
  Upload,
} from "@lucide/vue";
import { api, urls } from "../api";
import EmptyState from "../components/EmptyState.vue";
import PageHeader from "../components/PageHeader.vue";
import { confirmDialog, toast } from "../stores/ui";

const defaultSettings = () => ({
  installation: "local",
  sshPassword: "",
  defaultDuration: 10,
  enableYoutubeDl: true,
  forceTvOn: false,
  disableCECPowerCheck: false,
  systemMessagesHide: false,
  hideWelcomeNotice: false,
  reportIntervalMinutes: 5,
  enableLog: false,
  authCredentials: { user: "pi", password: "pi" },
});

const settings = reactive(defaultSettings());
const originalSettings = ref("");
const licenses = ref([]);
const selectedLicense = ref("");
const licenseSearch = ref("");
const loading = ref(true);
const uploading = ref(false);
const uploadProgress = ref(0);
const saving = ref(false);
const uploadInput = ref(null);

const filteredLicenses = computed(() => {
  const query = licenseSearch.value.trim().toLowerCase();
  return query
    ? licenses.value.filter((file) => file.toLowerCase().includes(query))
    : licenses.value;
});

function settingsSnapshot() {
  return JSON.stringify(settings);
}

function hasChanges(fields) {
  if (!originalSettings.value) return false;
  const original = JSON.parse(originalSettings.value);
  return fields.some(
    (field) =>
      field.split(".").reduce((value, key) => value?.[key], settings) !==
      field.split(".").reduce((value, key) => value?.[key], original),
  );
}

async function loadPage() {
  loading.value = true;
  try {
    const [licenseResponse, settingsResponse] = await Promise.all([
      api.get(urls.licenses),
      api.get(urls.settings),
    ]);
    licenses.value = licenseResponse.data || [];
    Object.assign(settings, defaultSettings(), settingsResponse.data || {});
    settings.authCredentials = {
      user: "pi",
      password: "pi",
      ...(settingsResponse.data?.authCredentials || {}),
    };
    originalSettings.value = settingsSnapshot();
  } catch (error) {
    toast(error.message || "Unable to load settings", "error");
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  if (saving.value) return;
  saving.value = true;
  try {
    await api.post(urls.settings, settings);
    originalSettings.value = settingsSnapshot();
    toast("Saved — server is restarting");
    window.setTimeout(() => window.location.reload(), 2000);
  } catch (error) {
    toast(error.message || "Unable to save settings", "error");
  } finally {
    saving.value = false;
  }
}

function chooseFiles() {
  uploadInput.value?.click();
}

async function uploadLicenses(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = "";
  if (!files.length) return;
  uploading.value = true;
  uploadProgress.value = 0;
  try {
    await api.upload(
      urls.licenses.replace(/\/$/, ""),
      files,
      "assets",
      (progress) => {
        uploadProgress.value = progress;
      },
    );
    toast("Upload Complete");
    await loadPage();
  } catch (error) {
    toast(error.message || "Upload failed", "error");
  } finally {
    uploading.value = false;
  }
}

async function deleteLicense() {
  const filename = selectedLicense.value;
  if (!filename) return;
  const confirmed = await confirmDialog({
    title: "Delete license?",
    message: `Delete license file ${filename}?`,
    confirmLabel: "Delete",
    danger: true,
  });
  if (!confirmed) return;
  try {
    const response = await api.del(
      urls.licenses + encodeURIComponent(filename),
    );
    licenses.value = response.data || [];
    selectedLicense.value = "";
    toast("License deleted");
  } catch (error) {
    toast(error.message || "Unable to delete license", "error");
  }
}

onMounted(loadPage);
</script>

<template>
  <section class="pi-page">
    <PageHeader title="Settings" :icon="Settings" />
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading settings</span>
      </div>
    </div>

    <template v-else>
      <article class="pi-card">
        <div class="pi-card-header">
          <h2 class="pi-card-title">
            <KeyRound :size="18" /> Available Licenses in the server
          </h2>
          <div>
            <input
              ref="uploadInput"
              class="d-none"
              type="file"
              multiple
              accept=".txt,text/plain"
              @change="uploadLicenses"
            />
            <button
              class="btn btn-primary btn-sm btn-icon"
              type="button"
              :disabled="uploading"
              @click="chooseFiles"
            >
              <Upload :size="16" /> Upload
            </button>
          </div>
        </div>
        <div class="pi-card-body">
          <div v-if="uploading" class="mb-3">
            <div class="d-flex justify-content-between small mb-1">
              <span>Uploading licenses</span><span>{{ uploadProgress }}%</span>
            </div>
            <div
              class="progress"
              role="progressbar"
              :aria-valuenow="uploadProgress"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="progress-bar"
                :style="{ width: `${uploadProgress}%` }"
              />
            </div>
          </div>
          <EmptyState
            v-if="!licenses.length"
            :icon="KeyRound"
            title="No license files uploaded"
          >
            <p>
              Please register the player ID at pisignage.com to generate the
              license files. Then either save the license file from the email or
              download it at pisignage.com/subscriptions.
            </p>
            <p class="mb-0">
              By uploading license files to your local server, they are
              downloaded to players automatically.
            </p>
          </EmptyState>
          <div v-else class="row g-2 align-items-end">
            <div class="col-md-5">
              <label class="form-label" for="license-search">Search</label
              ><input
                id="license-search"
                v-model="licenseSearch"
                class="form-control"
                placeholder="Search licenses"
              />
            </div>
            <div class="col-md-5">
              <label class="form-label" for="license-select">License</label
              ><select
                id="license-select"
                v-model="selectedLicense"
                class="form-select"
              >
                <option disabled value="">Select a license</option>
                <option
                  v-for="file in filteredLicenses"
                  :key="file"
                  :value="file"
                >
                  {{ file }}
                </option>
              </select>
            </div>
            <div class="col-md-2">
              <button
                class="btn btn-outline-danger w-100 btn-icon"
                type="button"
                :disabled="!selectedLicense"
                @click="deleteLicense"
              >
                <Trash2 :size="16" /> Delete
              </button>
            </div>
          </div>
        </div>
      </article>

      <article class="pi-card">
        <div class="pi-card-header">
          <h2 class="pi-card-title">
            <Settings :size="18" /> Installation Settings
          </h2>
        </div>
        <div class="pi-card-body settings-grid">
          <div class="setting-card">
            <label class="form-label" for="installation"
              >username at pisignage.com</label
            >
            <div class="input-group">
              <input
                id="installation"
                v-model="settings.installation"
                class="form-control"
                required
              /><button
                class="btn btn-primary btn-icon"
                type="button"
                :disabled="saving || !hasChanges(['installation'])"
                @click="saveSettings"
              >
                <Save :size="16" /> Save
              </button>
            </div>
          </div>
          <div class="setting-card">
            <label class="form-label" for="ssh-password">SSH Password</label>
            <div class="input-group">
              <input
                id="ssh-password"
                v-model="settings.sshPassword"
                class="form-control"
                type="password"
              /><button
                class="btn btn-primary btn-icon"
                type="button"
                :disabled="saving || !hasChanges(['sshPassword'])"
                @click="saveSettings"
              >
                <Save :size="16" /> Save
              </button>
            </div>
          </div>
          <div class="setting-card">
            <label class="form-label" for="duration"
              >Default Duration for Slides</label
            >
            <div class="input-group">
              <input
                id="duration"
                v-model.number="settings.defaultDuration"
                class="form-control"
                type="number"
                min="0"
              /><button
                class="btn btn-primary btn-icon"
                type="button"
                :disabled="saving || !hasChanges(['defaultDuration'])"
                @click="saveSettings"
              >
                <Save :size="16" /> Save
              </button>
            </div>
          </div>
          <div class="setting-card">
            <label class="form-label" for="report-interval"
              >Player reporting interval in minutes</label
            >
            <div class="input-group">
              <input
                id="report-interval"
                v-model.number="settings.reportIntervalMinutes"
                class="form-control"
                type="number"
                min="1"
                placeholder="default 5 minutes"
              /><button
                class="btn btn-primary btn-icon"
                type="button"
                :disabled="saving || !hasChanges(['reportIntervalMinutes'])"
                @click="saveSettings"
              >
                <Save :size="16" /> Save
              </button>
            </div>
          </div>
          <div
            v-for="option in [
              [
                'enableYoutubeDl',
                'Use youtube-dl program for livestreaming instead of livestreamer',
                false,
              ],
              [
                'forceTvOn',
                'Keep TV on by sending CEC tv-on/off message every 3 minutes',
                false,
              ],
              [
                'disableCECPowerCheck',
                'Disable CEC power check of TV every 3 minutes',
                false,
              ],
              [
                'systemMessagesHide',
                'Hide system messages on TV Screen (e.g. Download in Progress)',
                false,
              ],
              [
                'hideWelcomeNotice',
                'Do not show startup welcome screen & skip network diagnostics',
                false,
              ],
              [
                'enableLog',
                'Enable log for file play count/details (network intensive, do not enable unless you need it!)',
                true,
              ],
            ]"
            :key="option[0]"
            class="setting-card checkbox-setting"
          >
            <div class="form-check">
              <input
                :id="option[0]"
                v-model="settings[option[0]]"
                class="form-check-input"
                type="checkbox"
                @change="saveSettings"
              /><label
                class="form-check-label"
                :class="{ 'text-warning-emphasis': option[2] }"
                :for="option[0]"
                >{{ option[1] }}</label
              >
            </div>
          </div>
        </div>
      </article>

      <article class="pi-card">
        <div class="pi-card-header">
          <h2 class="pi-card-title"><KeyRound :size="18" /> Download Access</h2>
        </div>
        <div class="pi-card-body download-access">
          <div>
            <label class="form-label" for="download-user">Username</label
            ><input
              id="download-user"
              v-model="settings.authCredentials.user"
              class="form-control"
              required
            />
          </div>
          <div>
            <label class="form-label" for="download-password">Password</label
            ><input
              id="download-password"
              v-model="settings.authCredentials.password"
              class="form-control"
              type="password"
              required
            />
          </div>
          <div class="d-flex align-items-end">
            <button
              class="btn btn-primary btn-icon"
              type="button"
              :disabled="
                saving ||
                !settings.authCredentials.user ||
                !settings.authCredentials.password ||
                !hasChanges([
                  'authCredentials.user',
                  'authCredentials.password',
                ])
              "
              @click="saveSettings"
            >
              <LoaderCircle v-if="saving" :size="16" class="spin" /><Save
                v-else
                :size="16"
              />
              Save
            </button>
          </div>
        </div>
      </article>
    </template>
  </section>
</template>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.setting-card {
  background: #f8fafc;
  border: 1px solid var(--pi-border);
  border-radius: var(--pi-radius-sm);
  padding: 1rem;
}
.checkbox-setting {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}
.form-check-label {
  cursor: pointer;
}
.download-access {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
}
.spin {
  animation: spin 0.75s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 767.98px) {
  .settings-grid,
  .download-access {
    grid-template-columns: 1fr;
  }
  .checkbox-setting {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
