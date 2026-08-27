// Central data store: players, groups, playlists, assets, labels, settings.
// Mirrors the legacy assetLoader/playerLoader singletons.

import { reactive, computed } from "vue";
import { api, urls, layoutOtherZones, constants } from "../api";
import { statusOf, displayName } from "../utils/format";

export const store = reactive({
  loaded: false,
  groups: [],
  playlists: [],
  players: [],
  labels: [],
  files: [],
  filesDetails: {},
  systemAssets: [],
  currentVersion: {},
  serverConfig: null,
  selectedGroup: null,
  selectedPlaylist: null,
  selectedLabel: null,
  selectedPlayerLabel: null,
  labelsCount: {},
});

function computeLabelsCount(mode) {
  const counts = {};
  for (const label of store.labels) {
    if (mode === "players" ? label.mode === "players" : !label.mode)
      counts[label.name] = 0;
  }
  const source = mode === "players" ? store.players : null;
  if (mode === "players") {
    for (const p of source)
      for (const l of p.labels || []) if (l in counts) counts[l]++;
  } else {
    for (const name of Object.keys(store.filesDetails)) {
      for (const l of store.filesDetails[name].labels || [])
        if (l in counts) counts[l]++;
    }
  }
  store.labelsCount = counts;
}

export async function loadLabels() {
  const res = await api.get(urls.labels);
  store.labels = res.data || [];
  computeLabelsCount(store.selectedPlayerLabel ? "players" : "assets");
}

export async function loadFiles() {
  const res = await api.get(urls.files);
  store.files = res.data.files || [];
  store.systemAssets = res.data.systemAssets || [];
  const map = {};
  for (const doc of res.data.dbdata || []) map[doc.name] = doc;
  store.filesDetails = map;
}

export async function loadPlaylists() {
  const res = await api.get(urls.playlists);
  const fresh = res.data || [];
  const byName = new Map(
    store.playlists.map((playlist) => [playlist.name, playlist]),
  );
  const merged = fresh.map((data) => {
    const existing = byName.get(data.name);
    if (existing) {
      Object.assign(existing, data);
      return existing;
    }
    return data;
  });
  store.playlists.splice(0, store.playlists.length, ...merged);
  if (
    store.selectedPlaylist &&
    !store.playlists.includes(store.selectedPlaylist)
  )
    store.selectedPlaylist = null;
}

export async function loadGroups() {
  const res = await api.get(urls.groups + "?all=all");
  const fresh = res.data || [];
  const byId = new Map(store.groups.map((group) => [group._id, group]));
  const merged = fresh.map((data) => {
    const existing = byId.get(data._id);
    if (existing) {
      Object.assign(existing, data);
      return existing;
    }
    return data;
  });
  store.groups.splice(0, store.groups.length, ...merged);
  if (store.selectedGroup && !store.groups.includes(store.selectedGroup))
    store.selectedGroup = null;
}

export async function loadPlayers(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  const res = await api.get(
    urls.players + (qs.toString() ? "?" + qs.toString() : ""),
  );
  const players = res.data.objects || [];
  for (const p of players) {
    p.statusOf = statusOf(p);
    p.displayName = displayName(p);
    p.lastReported = p.lastReported || 0;
    p.player2 = (p.cpuSerialNumber || "").charAt(0) === "4";
  }
  store.players = players;
  store.currentVersion = res.data.currentVersion || {};
  computeLabelsCount(store.selectedPlayerLabel ? "players" : "assets");
  return players;
}

export async function loadServerConfig() {
  const res = await api.get(urls.serverConfig);
  store.serverConfig = res.data || { installation: "local" };
  if (!store.serverConfig.installation)
    store.serverConfig.installation = "local";
  return store.serverConfig;
}

export async function loadAll() {
  await Promise.all([loadGroups(), loadPlaylists(), loadFiles(), loadLabels()]);
  await loadPlayers();
  store.loaded = true;
  return store;
}

// ---- derived helpers ----

/** playlist names without special (ad/domination/event/keyPress/audio) settings */
export const normalPlaylistNames = computed(() =>
  store.playlists
    .filter((p) => {
      const s = p.settings || {};
      return !(
        s.ads?.adPlaylist ||
        s.domination?.enable ||
        s.event?.enable ||
        s.keyPress?.enable ||
        s.audio?.enable
      );
    })
    .map((p) => p.name),
);

export const playlistNames = computed(() => store.playlists.map((p) => p.name));

/**
 * Port of GroupFunctions.listFiles: computes the asset file list for a group
 * deploy and annotates group playlist entries with plType/settings.
 */
export function listFiles(group, playlistsObj, playlists) {
  const files = [];
  let errMessage = false;
  let noPlaylistsAssociated = true;
  for (let gpl = group.playlists.length - 1; gpl >= 0; gpl--) {
    const groupPlList = group.playlists[gpl];
    const itemIndex = playlists.indexOf(groupPlList.name);
    if (itemIndex !== -1) {
      playlistsObj[itemIndex].assets.forEach((asset) => {
        if (
          files.indexOf(asset.filename) === -1 &&
          asset.filename.indexOf("_system") !== 0
        )
          files.push(asset.filename);
        (layoutOtherZones[playlistsObj[itemIndex].layout] || []).forEach(
          (zone) => {
            if (asset[zone] && asset[zone].indexOf("_system") !== 0) {
              if (files.indexOf(asset[zone]) === -1) files.push(asset[zone]);
              if (asset[zone].indexOf("__") === 0) {
                const playlistName = asset[zone].slice(
                  2,
                  asset[zone].indexOf(".json"),
                );
                const nestedPlaylistIndex = playlists.indexOf(playlistName);
                if (
                  nestedPlaylistIndex !== -1 &&
                  Array.isArray(playlistsObj[nestedPlaylistIndex].assets)
                ) {
                  playlistsObj[nestedPlaylistIndex].assets.forEach((plfile) => {
                    if (
                      files.indexOf(plfile.filename) === -1 &&
                      plfile.filename.indexOf("_system") !== 0
                    )
                      files.push(plfile.filename);
                  });
                }
              }
            }
          },
        );
      });
      if (files.indexOf("__" + groupPlList.name + ".json") === -1)
        files.push("__" + groupPlList.name + ".json");
      if (
        playlistsObj[itemIndex].templateName &&
        files.indexOf(playlistsObj[itemIndex].templateName) === -1
      )
        files.push(playlistsObj[itemIndex].templateName);
      groupPlList.settings = groupPlList.settings || {};
      groupPlList.settings.ads = playlistsObj[itemIndex].settings.ads;
      groupPlList.settings.domination =
        playlistsObj[itemIndex].settings.domination;
      groupPlList.settings.event = playlistsObj[itemIndex].settings.event;
      groupPlList.settings.keyPress = playlistsObj[itemIndex].settings.keyPress;
      groupPlList.settings.onlineOnly =
        playlistsObj[itemIndex].settings.onlineOnly;
      groupPlList.settings.audio = playlistsObj[itemIndex].settings.audio;
      if (playlistsObj[itemIndex].name !== "TV_OFF") {
        if (playlistsObj[itemIndex].assets.length === 0) {
          errMessage = "EMPTY_PLAYLIST";
          groupPlList.skipForSchedule = true;
          groupPlList.plType = "no assets";
        } else {
          groupPlList.skipForSchedule = false;
          const s = playlistsObj[itemIndex].settings;
          if (s.ads && s.ads.adPlaylist) groupPlList.plType = "advt";
          else if (s.domination && s.domination.enable)
            groupPlList.plType = "domination";
          else if (s.event && s.event.enable) groupPlList.plType = "event";
          else if (s.keyPress && s.keyPress.enable)
            groupPlList.plType = "keyPress";
          else if (s.audio && s.audio.enable) groupPlList.plType = "audio";
          else {
            noPlaylistsAssociated = false;
            groupPlList.plType = "regular";
          }
        }
      } else {
        groupPlList.plType = "special";
      }
    } else if (!(groupPlList && groupPlList.name)) {
      group.playlists.splice(gpl, 1);
    }
  }
  if (group.logo && files.indexOf(group.logo) === -1) files.push(group.logo);
  group.assets = files;
  if (noPlaylistsAssociated) errMessage = "NOPLAYLISTS";
  return errMessage;
}

/** Deploy a single group: computes assets and posts the group with deploy:true */
export async function deployGroup(group) {
  group.playlists = (group.playlists || []).filter((pl) => pl.name);
  if (!group.playlists.length)
    throw new Error("No playlists assigned to this group");
  listFiles(group, store.playlists, playlistNames.value);
  group.deploy = true;
  const res = await api.post(urls.groups + group._id, group);
  return res;
}

/** Deploy all groups sequentially; returns per-group result strings */
export async function deployAllGroups() {
  await loadPlaylists();
  await loadGroups();
  const results = [];
  for (const group of store.groups) {
    if (group.name && group.name.indexOf("__player__") === 0) continue;
    try {
      group.playlists = group.playlists || [];
      listFiles(group, store.playlists, playlistNames.value);
      group.deploy = true;
      await api.post(urls.groups + group._id, group);
      results.push("Deploy done for " + group.name);
    } catch (e) {
      results.push(
        "*** Deploy failed for " +
          group.name +
          ", reason: " +
          (e.message || "http post error"),
      );
    }
  }
  return results;
}

/** Build per-playlist asset row objects (port of assemblePlaylistAssets) */
export function assemblePlaylistAssets() {
  const result = {};
  for (const pl of store.playlists) {
    const assets = (pl.assets || []).map((pd) => {
      const fd = store.filesDetails[pd.filename] || { name: pd.filename };
      const deleted =
        !(pd.filename in store.filesDetails) &&
        !(
          pd.filename in
          Object.fromEntries(store.systemAssets.map((s) => [s, 1]))
        ) &&
        pd.filename.indexOf("_system") !== 0;
      return { fileDetails: fd, playlistDetails: pd, deleted };
    });
    result[pl.name] = { playlist: pl, assets };
  }
  return result;
}

export { constants };
