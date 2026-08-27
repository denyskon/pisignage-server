<script setup>
import { ref } from "vue";
import { Menu, MonitorPlay, Image, Gauge, Settings, X } from "@lucide/vue";
import ToastStack from "./components/ToastStack.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";

const menuOpen = ref(false);
const navItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: Gauge,
    match: (r) => r.path.startsWith("/dashboard"),
  },
  {
    label: "Assets",
    to: "/assets/main",
    icon: Image,
    match: (r) => r.path.startsWith("/assets"),
  },
  {
    label: "Players",
    to: "/players/players",
    icon: MonitorPlay,
    match: (r) => r.path.startsWith("/players"),
  },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
    match: (r) => r.path.startsWith("/settings"),
  },
];
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <header class="pi-topbar">
      <nav class="container-xxl pi-navbar py-2">
        <RouterLink
          to="/players/players"
          class="d-flex align-items-center me-2"
          @click="menuOpen = false"
        >
          <img src="/img/pisignage-logo.svg" alt="piSignage" class="p-2" />
        </RouterLink>
        <button
          class="btn btn-outline-secondary pi-menu-toggle"
          type="button"
          :aria-expanded="menuOpen"
          aria-controls="primary-navigation"
          @click="menuOpen = !menuOpen"
        >
          <Menu v-if="!menuOpen" :size="20" />
          <X v-else :size="20" />
          <span class="visually-hidden">Toggle navigation</span>
        </button>
        <ul
          id="primary-navigation"
          class="nav pi-nav-links gap-1"
          :class="{ open: menuOpen }"
        >
          <li v-for="item in navItems" :key="item.to" class="nav-item">
            <RouterLink
              class="nav-link"
              :class="{ active: item.match($route) }"
              :to="item.to"
              @click="menuOpen = false"
            >
              <component :is="item.icon" :size="17" stroke-width="2" />
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </header>

    <main class="pi-content flex-grow-1">
      <RouterView />
    </main>

    <ToastStack />
    <ConfirmDialog />
  </div>
</template>
