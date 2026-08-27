// REST client for the piSignage server API.
// All endpoints return { success, stat_message, data }.

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(method, url, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    throw new ApiError(
      data?.stat_message || res.statusText || "Request failed",
      res.status,
      data,
    );
  }
  if (data && data.success === false) {
    throw new ApiError(data.stat_message || "Request failed", res.status, data);
  }
  return data;
}

export const api = {
  get: (url) => request("GET", url),
  post: (url, body) => request("POST", url, body),
  del: (url) => request("DELETE", url),
  /**
   * Multipart upload with progress callback.
   * @param {string} url
   * @param {File[]} files
   * @param {string} fieldName
   * @param {(pct:number)=>void} [onProgress]
   */
  upload(url, files, fieldName = "assets", onProgress) {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      for (const f of files) fd.append(fieldName, f, f.name);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress)
          onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        let data = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          /* ignore */
        }
        if (
          xhr.status >= 200 &&
          xhr.status < 300 &&
          (!data || data.success !== false)
        )
          resolve(data);
        else
          reject(
            new ApiError(
              data?.stat_message || "Upload failed",
              xhr.status,
              data,
            ),
          );
      };
      xhr.onerror = () => reject(new ApiError("Upload failed", 0, null));
      xhr.send(fd);
    });
  },
};

export const urls = {
  files: "/api/files/",
  filespostupload: "/api/postupload",
  playlistfiles: "/api/playlistfiles",
  links: "/api/links/",
  licenses: "/api/licensefiles/",
  settings: "/api/settings/",
  serverConfig: "/api/serverconfig/",
  playlists: "/api/playlists/",
  groups: "/api/groups/",
  players: "/api/players/",
  labels: "/api/labels/",
  pishell: "/api/pishell/",
  snapshot: "/api/snapshot/",
  pitv: "/api/pitv/",
  swupdate: "/api/swupdate/",
};

export const constants = {
  videoRegex: /(mp4|mov|m4v|avi|webm|wmv|flv|mkv|mpg|mpeg|3gp)$/i,
  audioRegex: /(mp3|m4a|mp4a|aac)$/i,
  imageRegex: /(jpg|jpeg|png|gif|bmp)$/i,
  noticeRegex: /\.html$/i,
  zipfileRegex: /(.zip|.gz|.bz2)$/i,
  repofileRegex: /\.repo$/i,
  liveStreamRegex: /\.tv$/i,
  omxStreamRegex: /\.stream$/i,
  linkURL: /\.link$/i,
  CORSLink: /\.weblink$/i,
  mediaRss: /\.mrss$/i,
  nestedPlaylist: /^__/i,
  groupNameRegEx: /[&/\\#,+()$~%'":*?<>{}\^]/g,
  pdffileRegex: /\.pdf$/i,
  txtFileRegex: /\.txt$/i,
  radioFileRegex: /\.radio$/i,
};

export const layoutOtherZones = {
  1: [],
  "2a": ["side"],
  "2b": ["side"],
  "2c": ["side"],
  "2d": ["side"],
  "3a": ["side", "bottom"],
  "3b": ["side", "bottom"],
  "3c": ["side", "bottom"],
  "3d": ["side", "bottom"],
  "4a": ["side", "bottom"],
  "4b": ["side", "bottom"],
  "4c": ["side", "bottom"],
  "4d": ["side", "bottom"],
  "2ap": [],
  "2bp": ["bottom"],
  "2ap270": [],
  "2bp270": ["bottom"],
  custom: ["side", "bottom", "zone4", "zone5", "zone6"],
  customp: ["side", "bottom", "zone4", "zone5", "zone6"],
  customp270: ["side", "bottom", "zone4", "zone5", "zone6"],
};

export const layouts = {
  1: { title: "Full Screen Landscape", count: 1 },
  "2a": { title: "Main + Side (Landscape)", count: 2 },
  "2b": { title: "Main + Side (Landscape)", count: 2 },
  "2c": { title: "Main + Side (Landscape)", count: 2 },
  "2d": { title: "Main + Side (Landscape)", count: 2 },
  "3a": { title: "Main + Side + Bottom", count: 3 },
  "3b": { title: "Main + Side + Bottom", count: 3 },
  "3c": { title: "Main + Side + Bottom", count: 3 },
  "3d": { title: "Main + Side + Bottom", count: 3 },
  "4a": { title: "Main + 2 Sides + Bottom", count: 4 },
  "4b": { title: "Main + 2 Sides + Bottom", count: 4 },
  "4c": { title: "Main + 2 Sides + Bottom", count: 4 },
  "4d": { title: "Main + 2 Sides + Bottom", count: 4 },
  "2ap": { title: "Full Screen Portrait", count: 1 },
  "2bp": { title: "Main + Bottom (Portrait)", count: 2 },
  "2ap270": { title: "Full Screen Portrait (270)", count: 1 },
  "2bp270": { title: "Main + Bottom (Portrait 270)", count: 2 },
  custom: { title: "Custom Layout", count: 6 },
  customp: { title: "Custom Layout (Portrait)", count: 6 },
  customp270: { title: "Custom Layout (Portrait 270)", count: 6 },
};

export const linkTypes = [
  { name: "Streaming", ext: ".tv" },
  { name: "Streaming (omx)", ext: ".stream" },
  { name: "Audio Streaming", ext: ".radio" },
  { name: "Web link (shown in iframe)", ext: ".link" },
  { name: "Web page (supports cross origin links)", ext: ".weblink" },
  { name: "Media RSS", ext: ".mrss" },
  { name: "Message", ext: ".txt" },
  { name: "Local Folder/File", ext: ".local" },
];

export const weeks = [
  "All Days",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const daysOfMonth = [
  "All Dates",
  ...Array.from({ length: 31 }, (_, i) => String(i + 1)),
];
export const weeksObject = [
  { id: 1, label: "Sunday" },
  { id: 2, label: "Monday" },
  { id: 3, label: "Tuesday" },
  { id: 4, label: "Wednesday" },
  { id: 5, label: "Thursday" },
  { id: 6, label: "Friday" },
  { id: 7, label: "Saturday" },
];
export const daysObject = Array.from({ length: 31 }, (_, i) => ({
  id: i + 1,
  label: String(i + 1),
}));

export function timeZoneNames() {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "Europe/Berlin", "America/New_York"];
  }
}
