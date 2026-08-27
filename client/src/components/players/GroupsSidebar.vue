<script setup>
import { ref } from "vue";
import { Plus, Send, Users } from "@lucide/vue";
import EmptyState from "../EmptyState.vue";
import { api, urls } from "../../api";
import { store, deployAllGroups } from "../../stores/models";
import { toast, confirmDialog } from "../../stores/ui";
import { sanitizeName } from "../../utils/format";

const emit = defineEmits(["select"]);
const newName = ref("");
const busy = ref(false);

function select(group) {
  emit("select", group);
}

async function add() {
  const name = sanitizeName(newName.value).trim();
  if (!name) return;
  if (store.groups.some((group) => group.name === name)) {
    newName.value = "Group exists";
    return;
  }
  try {
    const response = await api.post(urls.groups, { name });
    store.groups.unshift(response.data);
    newName.value = "";
    toast("Group created");
  } catch (error) {
    toast(error.message, "error");
  }
}

async function deployAll() {
  if (
    !(await confirmDialog({
      title: "Deploy all groups?",
      message:
        "Deploy the latest content and settings to every group? This may interrupt players while they download updates.",
      confirmLabel: "Deploy",
      danger: false,
    }))
  )
    return;
  busy.value = true;
  try {
    const results = await deployAllGroups();
    toast(
      results.join(" · "),
      results.some((result) => result.startsWith("***")) ? "error" : "success",
      9000,
    );
  } catch (error) {
    toast(error.message, "error");
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="pi-card">
    <header class="pi-card-header">
      <h2 class="pi-card-title">Groups</h2>
      <button
        class="btn btn-sm btn-primary btn-icon"
        :disabled="busy"
        @click="deployAll"
      >
        <span v-if="busy" class="spinner-border spinner-border-sm" />
        <Send v-else :size="16" />
        Deploy all
      </button>
    </header>
    <div class="list-group list-group-flush">
      <button
        class="list-group-item list-group-item-action d-flex align-items-center gap-2"
        :class="{ active: !store.selectedGroup }"
        @click="select(null)"
      >
        <Users :size="16" />
        All groups
      </button>
      <button
        v-for="group in store.groups"
        :key="group._id"
        class="list-group-item list-group-item-action text-start"
        :class="{ active: store.selectedGroup === group }"
        @click="select(group)"
      >
        {{ group.name }}
      </button>
      <EmptyState
        v-if="!store.groups.length"
        :icon="Users"
        title="No groups"
        message="Create a group to organize players."
      />
    </div>
    <form class="p-3 border-top d-flex gap-2" @submit.prevent="add">
      <input
        v-model="newName"
        class="form-control form-control-sm"
        required
        placeholder="Create a group"
      />
      <button class="btn btn-primary btn-sm" title="Create group">
        <Plus :size="16" />
      </button>
    </form>
  </section>
</template>
