import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function timeAgo(value) {
  if (!value) return "";
  return dayjs(value).fromNow();
}

export function formatDate(value, fmt = "MMM D, YYYY") {
  if (!value) return "";
  return dayjs(value).format(fmt);
}

export function truncate(text, length = 60) {
  if (!text) return text;
  return text.length > length ? text.slice(0, length - 3) + "..." : text;
}

export function readable(str) {
  if (!str) return str;
  return str.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

export function uptimeFormatted(uptime) {
  const seconds = parseInt(uptime);
  if (!seconds || isNaN(seconds)) return "";
  if (seconds > 172800) return (seconds / 86400).toFixed(1) + " days";
  if (seconds > 10800) return (seconds / 3600).toFixed(1) + " hours";
  if (seconds > 300) return parseInt(seconds / 60) + " minutes";
  return seconds + " seconds";
}

export function tempFormat(piTemperature) {
  if (!piTemperature) return "";
  const c = parseFloat(piTemperature);
  if (isNaN(c)) return piTemperature;
  return `${Math.round(c)}/${Math.round((c * 9) / 5 + 32)}°C`;
}

/** status bucket: 'online' | 'idle' | 'offline' */
export function statusOf(player) {
  if (!player.isConnected) return "offline";
  if (!player.playlistOn) return "idle";
  return "online";
}

export function displayName(player) {
  return (
    player.name ||
    player.localName ||
    (player.cpuSerialNumber
      ? "Player " + player.cpuSerialNumber.slice(12)
      : "Player")
  );
}

export function sanitizeName(name) {
  return (name || "").replace(/[&/\\#,+()$~%'":*?<>{}^]/g, "");
}

export function fileTypeOf(name) {
  const n = name || "";
  if (/\.tv$/i.test(n)) return "tv";
  if (/\.stream$/i.test(n)) return "stream";
  if (/\.radio$/i.test(n)) return "radio";
  if (/\.link$/i.test(n)) return "link";
  if (/\.weblink$/i.test(n)) return "weblink";
  if (/\.mrss$/i.test(n)) return "mrss";
  if (/\.txt$/i.test(n)) return "txt";
  if (/\.local$/i.test(n)) return "local";
  if (/\.(mp4|mov|m4v|avi|webm|wmv|flv|mkv|mpg|mpeg|3gp)$/i.test(n))
    return "video";
  if (/\.(mp3|m4a|mp4a|aac)$/i.test(n)) return "audio";
  if (/\.(jpg|jpeg|png|gif|bmp)$/i.test(n)) return "image";
  if (/\.html$/i.test(n)) return "html";
  if (/\.pdf$/i.test(n)) return "pdf";
  if (/(.zip|.gz|.bz2)$/i.test(n)) return "zip";
  if (/\.repo$/i.test(n)) return "repo";
  return "other";
}

export const isLinkType = (name) =>
  /\.(tv|stream|radio|link|weblink|mrss|txt|local)$/i.test(name || "");

export const muteButtonEnable = (name) =>
  /\.(mp4|mov|m4v|avi|webm|wmv|flv|mkv|mpg|mpeg|3gp)$/i.test(name || "") ||
  /\.stream$/i.test(name || "") ||
  /\.tv$/i.test(name || "");

export function zeroPad(n) {
  return (n < 10 ? "0" : "") + n;
}
