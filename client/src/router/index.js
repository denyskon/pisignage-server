import { createRouter, createWebHashHistory } from "vue-router";

import DashboardView from "../views/DashboardView.vue";
import PlayersView from "../views/PlayersView.vue";
import AssetsView from "../views/AssetsView.vue";
import AssetDetailView from "../views/AssetDetailView.vue";
import PlaylistAddView from "../views/PlaylistAddView.vue";
import SettingsView from "../views/SettingsView.vue";

// URLs mirror the legacy ui-router states so existing bookmarks keep working.
const routes = [
  { path: "/", redirect: "/players/players" },
  { path: "/playlists", redirect: "/assets/main" },
  { path: "/dashboard", name: "dashboard", component: DashboardView },
  {
    path: "/dashboard/players",
    name: "dashboard-players",
    component: PlayersView,
  },
  { path: "/players/players", name: "players", component: PlayersView },
  { path: "/assets/main", name: "assets", component: AssetsView },
  {
    path: "/assets/detail/:file",
    name: "asset-detail",
    component: AssetDetailView,
  },
  {
    path: "/playlists/add/:playlist",
    name: "playlist-add",
    component: PlaylistAddView,
  },
  { path: "/settings", name: "settings", component: SettingsView },
  { path: "/:pathMatch(.*)*", redirect: "/players/players" },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
