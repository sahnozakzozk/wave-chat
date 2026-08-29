import { useState, useEffect, useRef } from "react";
import {
  Hash,
  Send,
  Users,
  LogOut,
  ChevronLeft,
  Plus,
  X,
  Search,
  Smile,
  Mic,
  Volume2,
  MessageCircle,
  Image as ImageIcon,
  CornerUpLeft,
  Globe,
  Settings,
  ChevronRight,
  Bell,
  BellOff,
  Mail,
  Phone,
  Pencil,
  Check,
  Palette,
  Shield,
  Camera,
  UserPlus,
  UserCheck,
  UserX,
  Inbox,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  FolderPlus,
  MoreVertical,
  Trash2,
  Archive,
  ArchiveRestore,
  Rss,
  Pin,
  PinOff,
} from "lucide-react";

// --- Supabase-backed storage (drop-in replacement for the Claude-artifact
// `window.storage` API), so this app runs as a normal standalone site.
// shared === false -> stays on this device only (localStorage)
// shared === true  -> stored in Supabase, visible to everyone using the app
const SUPABASE_URL = "https://qzxzjhqeqozowvlgpofu.supabase.co";
const SUPABASE_KEY = "sb_publishable_OnHeHZ0fog5-p--HEsGFyQ_uVrOez_R";
const SUPABASE_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

const storage = {
  async get(key, shared) {
    if (!shared) {
      const v = localStorage.getItem("wave:" + key);
      return v === null ? null : { key, value: v, shared: false };
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store?key=eq.${encodeURIComponent(key)}&select=value`, {
      headers: SUPABASE_HEADERS,
    });
    if (!res.ok) throw new Error("storage get failed");
    const rows = await res.json();
    if (!rows.length) return null;
    return { key, value: rows[0].value, shared: true };
  },
  async set(key, value, shared) {
    if (!shared) {
      localStorage.setItem("wave:" + key, value);
      return { key, value, shared: false };
    }
    // on_conflict=key is required for "resolution=merge-duplicates" to
    // actually update the existing row for this key instead of silently
    // inserting a new duplicate row. Without it, repeated writes to the same
    // key (e.g. saving your profile photo more than once) could pile up as
    // separate rows, and reads (which just take the first match) could then
    // intermittently return an older value instead of the latest one.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store?on_conflict=key`, {
      method: "POST",
      headers: { ...SUPABASE_HEADERS, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) return null;
    return { key, value, shared: true };
  },
  async delete(key, shared) {
    if (!shared) {
      localStorage.removeItem("wave:" + key);
      return { key, deleted: true, shared: false };
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store?key=eq.${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: SUPABASE_HEADERS,
    });
    if (!res.ok) return null;
    return { key, deleted: true, shared: true };
  },
};

const AVATAR_COLORS = ["#F2A93B", "#2DD4BF", "#FB7159", "#5B8DEF", "#E8608F", "#34D399"];
const REACTIONS = ["👍", "❤️", "😂", "😮", "🔥", "👋"];
const STICKERS = [
  "🎉", "🐱", "👋", "💯", "🍕", "😴", "🚀", "❤️",
  "🔥", "🎂", "🥳", "😂", "👏", "🤝", "🌟", "🎮",
  "☕", "🎵", "😎", "🤯",
];
const STICKER_ANIMATIONS = ["wave-sticker-pop", "wave-sticker-bounce", "wave-sticker-spin", "wave-sticker-wobble"];
function stickerAnimFor(id) {
  const n = typeof id === "number" ? id : String(id).length;
  return STICKER_ANIMATIONS[Math.abs(n) % STICKER_ANIMATIONS.length];
}

const STRINGS = {
  ru: {
    appName: "Zapp",
    tagline: "Каналы и чаты для твоей команды или тусовки",
    usernamePlaceholder: "Имя пользователя",
    passwordPlaceholder: "Пароль",
    confirmPasswordPlaceholder: "Повтори пароль",
    needUsername: "Введи имя пользователя",
    needPassword: "Введи пароль",
    passwordTooShort: "Пароль должен быть не короче 4 символов",
    passwordsMismatch: "Пароли не совпадают",
    usernameTaken: "Это имя уже занято, выбери другое",
    saveFailed: "Не получилось сохранить, попробуй ещё раз",
    userNotFound: "Такого пользователя нет — зарегистрируйся",
    wrongPassword: "Неверный пароль",
    genericError: "Что-то пошло не так, попробуй ещё раз",
    busy: "Секунду…",
    registerBtn: "Зарегистрироваться",
    loginBtn: "Войти",
    toggleToRegister: "Нет аккаунта? Зарегистрироваться",
    toggleToLogin: "Уже есть аккаунт? Войти",
    loginHint:
      "Вход запоминается на этом устройстве. Пароль хранится в виде хеша в общем хранилище приложения — это демо-уровень защиты, не полноценная серверная авторизация.",
    loadingSession: "Загрузка…",
    chooseLanguage: "Выбери язык",
    chooseLanguageSubtitle: "Это можно изменить позже в приложении",
    continueBtn: "Продолжить",
    directMessages: "Личные сообщения",
    noOtherUsers: "Пока нет других зарегистрированных пользователей.",
    channels: "Каналы",
    createServer: "Создать сервер",
    demoNoServer: "В демо-версии нельзя создать новый сервер",
    searchServer: "Поиск по",
    listSearchPlaceholder: "Поиск",
    noResults: "Ничего не найдено",
    searchMessages: "Поиск по сообщениям",
    members: "Участники",
    you: "ты",
    close: "Закрыть",
    pickDialog: "Выбери, кому написать",
    loadingMessages: "Загрузка сообщений…",
    nothingFound: "Ничего не найдено",
    emptyChannel: "Здесь пока тихо. Напиши первое сообщение.",
    saveError: "Не получилось сохранить последнее действие. Попробуй ещё раз.",
    writeTo: "Написать",
    sendingPhoto: "Отправка фото…",
    sendPhoto: "Отправить фото",
    stickers: "Стикеры",
    send: "Отправить",
    addReaction: "Добавить реакцию",
    reply: "Ответить",
    cancelReply: "Отменить ответ",
    replyingTo: "Ответ",
    photoLabel: "Фото",
    imageAlt: "Изображение",
    typingOne: (name) => `${name} печатает…`,
    voiceDemoHint:
      "Голосовой канал использует WebRTC напрямую между браузерами (без TURN-сервера) — в большинстве сетей звук пойдёт, но на некоторых мобильных/корпоративных сетях с жёстким NAT соединение может не установиться.",
    voiceNoOne: "Пока никого нет в канале",
    joinVoice: (name) => "Войти в " + name,
    leaveVoice: (name) => "Выйти из " + name,
    mute: "Выключить микрофон",
    unmute: "Включить микрофон",
    logout: "Выйти",
    chooseImage: "Выбери файл изображения",
    switchLanguage: "Сменить язык",
    newMessageIn: (name) => `Новое в ${name}`,
    settingsTitle: "Настройки",
  },
  en: {
    appName: "Zapp",
    tagline: "Channels and chats for your team or crew",
    usernamePlaceholder: "Username",
    passwordPlaceholder: "Password",
    confirmPasswordPlaceholder: "Confirm password",
    needUsername: "Enter a username",
    needPassword: "Enter a password",
    passwordTooShort: "Password must be at least 4 characters",
    passwordsMismatch: "Passwords don't match",
    usernameTaken: "That name is taken, pick another",
    saveFailed: "Couldn't save, try again",
    userNotFound: "No such user — sign up instead",
    wrongPassword: "Wrong password",
    genericError: "Something went wrong, try again",
    busy: "One sec…",
    registerBtn: "Sign up",
    loginBtn: "Log in",
    toggleToRegister: "No account? Sign up",
    toggleToLogin: "Already have an account? Log in",
    loginHint:
      "Your session is remembered on this device. The password is stored as a hash in the app's shared storage — this is demo-level protection, not real server auth.",
    loadingSession: "Loading…",
    chooseLanguage: "Choose a language",
    chooseLanguageSubtitle: "You can change this later in the app",
    continueBtn: "Continue",
    directMessages: "Direct messages",
    noOtherUsers: "No other registered users yet.",
    channels: "Channels",
    createServer: "Create server",
    demoNoServer: "You can't create a new server in the demo",
    searchServer: "Search",
    listSearchPlaceholder: "Search",
    noResults: "No results",
    searchMessages: "Search messages",
    members: "Members",
    you: "you",
    close: "Close",
    pickDialog: "Pick who to message",
    loadingMessages: "Loading messages…",
    nothingFound: "Nothing found",
    emptyChannel: "It's quiet here. Send the first message.",
    saveError: "Couldn't save your last action. Try again.",
    writeTo: "Message",
    sendingPhoto: "Sending photo…",
    sendPhoto: "Send a photo",
    stickers: "Stickers",
    send: "Send",
    addReaction: "Add reaction",
    reply: "Reply",
    cancelReply: "Cancel reply",
    replyingTo: "Replying to",
    photoLabel: "Photo",
    imageAlt: "Image",
    typingOne: (name) => `${name} is typing…`,
    voiceDemoHint:
      "This voice channel uses WebRTC directly between browsers (no TURN server) — audio works on most networks, but strict NATs (some mobile/corporate networks) may fail to connect.",
    voiceNoOne: "No one here yet",
    joinVoice: (name) => "Join " + name,
    leaveVoice: (name) => "Leave " + name,
    mute: "Mute",
    unmute: "Unmute",
    logout: "Log out",
    chooseImage: "Pick an image file",
    switchLanguage: "Switch language",
    newMessageIn: (name) => `New message in ${name}`,
    settingsTitle: "Settings",
  },
};

// --- Lightweight synthesized notification sounds (no audio assets needed) --
// Respects the per-device "notif-prefs" sound toggle from Settings.
let _waveAudioCtx = null;
function getAudioCtx() {
  try {
    if (!_waveAudioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      _waveAudioCtx = new Ctx();
    }
    if (_waveAudioCtx.state === "suspended") _waveAudioCtx.resume();
    return _waveAudioCtx;
  } catch (err) {
    return null;
  }
}
function isSoundEnabled(username) {
  try {
    const raw = localStorage.getItem(`wave:notif-prefs:${username}`);
    if (!raw) return true;
    const data = JSON.parse(raw);
    return data.soundOn !== false;
  } catch (err) {
    return true;
  }
}
function playTone(freqs, { duration = 0.11, gain = 0.05, type = "sine" } = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = now + i * duration;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  });
}
// Soft ascending "pop" — plays when a message you send lands, like the
// Telegram send whoosh but a little rounder/friendlier.
function playSendSound(username) {
  if (!isSoundEnabled(username)) return;
  playTone([760, 1080], { duration: 0.075, gain: 0.045, type: "sine" });
}
// Two-note gentle "ding" — plays when a new incoming message toast appears.
function playIncomingSound(username) {
  if (!isSoundEnabled(username)) return;
  playTone([880, 660], { duration: 0.09, gain: 0.05, type: "triangle" });
}

function colorForName(name) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initials(name) {
  return name.trim().slice(0, 2).toUpperCase();
}

function dmChannelId(a, b) {
  return "dm:" + [a, b].sort().join("__");
}

const DEMO_SERVERS = [
  {
    id: "dev",
    name: "Клуб разработки",
    nameEn: "Dev Club",
    tag: "DEV",
    members: ["Аня", "Максим", "Света"],
    channels: [
      { id: "dev-general", name: "общий", nameEn: "general", type: "text" },
      { id: "dev-help", name: "помощь", nameEn: "help", type: "text" },
      { id: "dev-showcase", name: "показать-проект", nameEn: "showcase", type: "text" },
      { id: "dev-voice", name: "войс-комната", nameEn: "voice room", type: "voice" },
    ],
  },
  {
    id: "games",
    name: "Игровая тусовка",
    nameEn: "Gaming Crew",
    tag: "GG",
    members: ["Игорь", "Настя", "Пётр", "Лена"],
    channels: [
      { id: "games-general", name: "общий", nameEn: "general", type: "text" },
      { id: "games-lfg", name: "ищу-пати", nameEn: "looking-for-group", type: "text" },
      { id: "games-memes", name: "мемы", nameEn: "memes", type: "text" },
      { id: "games-voice", name: "войс", nameEn: "voice", type: "voice" },
    ],
  },
];

// Picks the localized display name for a demo server/channel object,
// falling back to the Russian name if no English variant is defined
// (e.g. for user-created channels, which only ever have one name).
function localizedName(obj, lang) {
  if (!obj) return "";
  return lang === "en" && obj.nameEn ? obj.nameEn : obj.name;
}

const INITIAL_MESSAGES = {
  "dev-general": [
    { id: 1, author: "Аня", text: "Привет! Кто-нибудь разбирался с вебсокетами на этой неделе?", time: "10:12", type: "text" },
    { id: 2, author: "Максим", text: "Да, могу помочь, что не работает?", time: "10:14", type: "text" },
  ],
  "dev-help": [{ id: 1, author: "Света", text: "Не собирается билд, ругается на импорт", time: "09:40", type: "text" }],
  "dev-showcase": [{ id: 1, author: "Максим", text: "Запустил свой первый бот, зацените", time: "18:02", type: "text" }],
  "games-general": [
    { id: 1, author: "Игорь", text: "Го сегодня вечером?", time: "20:05", type: "text" },
    { id: 2, author: "Настя", text: "Я за", time: "20:06", type: "text" },
  ],
  "games-lfg": [{ id: 1, author: "Пётр", text: "Нужен ещё один в команду, ранг неважен", time: "19:30", type: "text" }],
  "games-memes": [{ id: 1, author: "Лена", text: "Нашла картинку прямо про нас", time: "12:00", type: "text" }],
};

// --- Auth now happens on the server (Supabase Edge Function), not here.
// The browser never sees password hashes and never decides whether a
// password is correct — it just sends {action, username, password} to the
// function and gets back {ok:true} or {ok:false, error}. See
// supabase/functions/auth/index.ts and supabase/migrations/*.sql.
const AUTH_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/auth`;

async function callAuth(action, username, password) {
  try {
    const res = await fetch(AUTH_FUNCTION_URL, {
      method: "POST",
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({ action, username, password }),
    });
    const data = await res.json().catch(() => null);
    if (!data) return { ok: false, error: "network" };
    return data;
  } catch (err) {
    return { ok: false, error: "network" };
  }
}

function authErrorMessage(error, lockedSeconds, t, lang) {
  switch (error) {
    case "username_taken":
      return t.usernameTaken;
    case "user_not_found":
      return t.userNotFound;
    case "wrong_password":
      return t.wrongPassword;
    case "password_too_short":
      return t.passwordTooShort;
    case "too_many_attempts": {
      const secs = lockedSeconds || 0;
      return lang === "ru"
        ? `Слишком много попыток. Попробуй через ${secs} сек.`
        : `Too many attempts. Try again in ${secs}s.`;
    }
    case "missing_fields":
      return t.needPassword;
    default:
      return t.genericError;
  }
}

// Password-free list of registered usernames, kept for the DM directory UI.
// Maintained by the auth function on successful registration — the client
// never reads or writes the real user records (hashes/salts) anymore.
async function loadUsernames() {
  try {
    const result = await storage.get("usernames", true);
    return result ? JSON.parse(result.value) : [];
  } catch (err) {
    return [];
  }
}

// Look up a single user's saved profile photo from the shared account
// record. Used to populate avatars for people other than yourself (message
// authors, DM list, member list, etc.) — returns null if they have no
// account record yet or never set a photo.
async function loadUserPhoto(user) {
  try {
    const acc = await storage.get(`account:${user}`, true);
    if (acc && acc.value) {
      const data = JSON.parse(acc.value);
      return data.photo || null;
    }
  } catch (err) {
    // no saved account yet, or the fetch failed — treat as "no photo"
  }
  return null;
}

// Defensive client-side fallback: make sure a freshly registered name is
// always present in the shared directory, even if the auth function's own
// bookkeeping ever misses it (this is what caused "registered on a 3rd
// device, but nobody can find me" — the name just never made it into the
// list that "find friends" searches).
async function ensureUsernameListed(name) {
  try {
    const list = await loadUsernames();
    if (!list.includes(name)) {
      await storage.set("usernames", JSON.stringify([...list, name]), true);
    }
  } catch (err) {
    // best-effort — worst case the next successful call fixes it
  }
}

// --- Friends & friend requests --------------------------------------------
// A DM only opens for real once two people are friends. Until then, the
// initiator can send a request; the other side sees it in their
// notifications and can accept or decline it.
const friendsKey = (user) => `friends:${user}`;
const friendRequestsKey = (user) => `friend-requests:${user}`;
const customChannelsKey = (serverId) => `custom-channels:${serverId}`;

async function loadFriends(user) {
  try {
    const r = await storage.get(friendsKey(user), true);
    return r ? JSON.parse(r.value) : [];
  } catch (err) {
    return [];
  }
}

async function loadFriendRequests(user) {
  try {
    const r = await storage.get(friendRequestsKey(user), true);
    return r ? JSON.parse(r.value) : [];
  } catch (err) {
    return [];
  }
}

async function sendFriendRequest(fromUser, toUser) {
  try {
    const existing = await loadFriendRequests(toUser);
    if (existing.some((r) => r.from === fromUser)) return true;
    const next = [...existing, { from: fromUser, ts: Date.now() }];
    const result = await storage.set(friendRequestsKey(toUser), JSON.stringify(next), true);
    return !!result;
  } catch (err) {
    return false;
  }
}

async function respondToFriendRequest(user, fromUser, accept) {
  try {
    const requests = await loadFriendRequests(user);
    const next = requests.filter((r) => r.from !== fromUser);
    await storage.set(friendRequestsKey(user), JSON.stringify(next), true);
    if (accept) {
      const [mine, theirs] = await Promise.all([loadFriends(user), loadFriends(fromUser)]);
      if (!mine.includes(fromUser)) await storage.set(friendsKey(user), JSON.stringify([...mine, fromUser]), true);
      if (!theirs.includes(user)) await storage.set(friendsKey(fromUser), JSON.stringify([...theirs, user]), true);
    }
    return true;
  } catch (err) {
    return false;
  }
}

// --- Custom channels (created by users on top of the demo servers) --------
async function loadCustomChannels(serverId) {
  try {
    const r = await storage.get(customChannelsKey(serverId), true);
    return r ? JSON.parse(r.value) : [];
  } catch (err) {
    return [];
  }
}

async function createCustomChannel(serverId, name, type, ownerId) {
  try {
    const existing = await loadCustomChannels(serverId);
    const id = `${serverId}-custom-${Date.now()}`;
    const entry = { id, name, type: type || "text", ownerId };
    if (type === "channel") entry.subscribers = [ownerId];
    const next = [...existing, entry];
    const result = await storage.set(customChannelsKey(serverId), JSON.stringify(next), true);
    return result ? next : null;
  } catch (err) {
    return null;
  }
}

async function renameCustomChannel(serverId, channelId, newName) {
  try {
    const existing = await loadCustomChannels(serverId);
    const next = existing.map((c) => (c.id === channelId ? { ...c, name: newName } : c));
    const result = await storage.set(customChannelsKey(serverId), JSON.stringify(next), true);
    return result ? next : null;
  } catch (err) {
    return null;
  }
}

async function deleteCustomChannel(serverId, channelId) {
  try {
    const existing = await loadCustomChannels(serverId);
    const next = existing.filter((c) => c.id !== channelId);
    const result = await storage.set(customChannelsKey(serverId), JSON.stringify(next), true);
    return result ? next : null;
  } catch (err) {
    return null;
  }
}

async function setChannelSubscription(serverId, channelId, user, subscribe) {
  try {
    const existing = await loadCustomChannels(serverId);
    const next = existing.map((c) => {
      if (c.id !== channelId) return c;
      const subs = c.subscribers || [];
      const nextSubs = subscribe ? (subs.includes(user) ? subs : [...subs, user]) : subs.filter((u) => u !== user);
      return { ...c, subscribers: nextSubs };
    });
    const result = await storage.set(customChannelsKey(serverId), JSON.stringify(next), true);
    return result ? next : null;
  } catch (err) {
    return null;
  }
}

const archivedKey = (user) => `archived:${user}`;

async function loadArchived(user) {
  try {
    const r = await storage.get(archivedKey(user), false);
    return r ? JSON.parse(r.value) : [];
  } catch (err) {
    return [];
  }
}

async function setArchived(user, ids) {
  try {
    await storage.set(archivedKey(user), JSON.stringify(ids), false);
  } catch (err) {
    // best-effort, local-only preference
  }
}

const pinnedKey = (user) => `pinned:${user}`;

async function loadPinned(user) {
  try {
    const r = await storage.get(pinnedKey(user), false);
    return r ? JSON.parse(r.value) : [];
  } catch (err) {
    return [];
  }
}

async function setPinned(user, ids) {
  try {
    await storage.set(pinnedKey(user), JSON.stringify(ids), false);
  } catch (err) {
    // best-effort, local-only preference
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

const messagesKey = (channelId) => `messages:${channelId}`;
const voiceKey = (channelId) => `voice:${channelId}`;
const typingKey = (channelId) => `typing:${channelId}`;

async function loadLang() {
  try {
    const result = await storage.get("lang", false);
    return result ? result.value : null;
  } catch (err) {
    return null;
  }
}

async function persistLang(lang) {
  try {
    await storage.set("lang", lang, false);
  } catch (err) {
    // best-effort
  }
}

async function loadChannelMessages(channelId) {
  try {
    const result = await storage.get(messagesKey(channelId), true);
    return result ? JSON.parse(result.value) : INITIAL_MESSAGES[channelId] || [];
  } catch (err) {
    return INITIAL_MESSAGES[channelId] || [];
  }
}

async function loadVoiceParticipants(channelId) {
  try {
    const result = await storage.get(voiceKey(channelId), true);
    return result ? JSON.parse(result.value) : [];
  } catch (err) {
    return [];
  }
}

// --- Real voice (WebRTC) ---
// Two public STUN servers, no TURN. This lets browsers discover their public
// address so two peers can connect directly. On strict/symmetric NATs (common
// on some mobile/corporate networks) a direct connection can still fail —
// that needs a paid TURN relay, which isn't included here.
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

function pairKeyFor(a, b) {
  return [a, b].sort().join("__");
}
function voiceSignalKey(channelId, pairKey) {
  return `voice-signal:${channelId}:${pairKey}`;
}
async function readSignal(channelId, pairKey) {
  try {
    const result = await storage.get(voiceSignalKey(channelId, pairKey), true);
    return result ? JSON.parse(result.value) : {};
  } catch (err) {
    return {};
  }
}
async function writeSignal(channelId, pairKey, updater) {
  try {
    const current = await readSignal(channelId, pairKey);
    const next = updater(current);
    await storage.set(voiceSignalKey(channelId, pairKey), JSON.stringify(next), true);
  } catch (err) {
    // best-effort — the next poll tick will retry
  }
}
async function clearSignal(channelId, pairKey) {
  try {
    await storage.delete(voiceSignalKey(channelId, pairKey), true);
  } catch (err) {
    // fine if it was never created
  }
}

function resizeImageFile(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else if (height >= width && height > maxDim) {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("image load failed"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

async function persistSession(name) {
  try {
    await storage.set("session", name, false);
  } catch (err) {
    // session persistence is best-effort
  }
}

function LanguageScreen({ onSelect }) {
  return (
    <div style={styles.loginWrap} className="wave-app-fullscreen">
      <div style={styles.loginCard}>
        <div style={styles.loginDot} />
        <h1 style={styles.loginTitle}>Zapp</h1>
        <p style={styles.loginSubtitle}>Выбери язык / Choose a language</p>
        <button onClick={() => onSelect("ru")} style={styles.loginButton} className="wave-btn">
          Русский
        </button>
        <button
          onClick={() => onSelect("en")}
          style={{ ...styles.loginButton, ...styles.langSecondaryButton }}
          className="wave-btn"
        >
          English
        </button>
        <p style={styles.loginHint}>Это можно изменить позже в приложении / You can change this later in the app</p>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, t, lang, onToggleLang }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    // Read straight from the DOM instead of trusting React state here:
    // when a browser/password manager autofills a saved login, it can set
    // the input's value without firing a normal onChange, so the visible
    // field and the React state fall out of sync. Reading .value directly
    // guarantees we submit exactly what's shown on screen.
    const name = (usernameRef.current ? usernameRef.current.value : username).trim();
    const pwd = passwordRef.current ? passwordRef.current.value : password;
    const confirmPwd = confirmPasswordRef.current ? confirmPasswordRef.current.value : confirmPassword;
    if (!name) {
      setError(t.needUsername);
      return;
    }
    if (!pwd) {
      setError(t.needPassword);
      return;
    }
    if (mode === "register" && pwd.length < 4) {
      setError(t.passwordTooShort);
      return;
    }
    if (mode === "register" && pwd !== confirmPwd) {
      setError(t.passwordsMismatch);
      return;
    }

    setError("");
    setBusy(true);
    try {
      // The browser only sends the credentials and relays the server's
      // verdict — it never loads user records, hashes anything, or decides
      // pass/fail itself.
      const result = await callAuth(mode, name, pwd);
      if (!result.ok) {
        setError(authErrorMessage(result.error, result.lockedSeconds, t, lang));
        setBusy(false);
        return;
      }
      await persistSession(name);
      ensureUsernameListed(name);
      onLogin(name);
    } catch (err) {
      setError(t.genericError);
      setBusy(false);
    }
  }

  return (
    <div style={styles.loginWrap} className="wave-app-fullscreen">
      <div style={styles.loginCard} className={error ? "wave-shake" : ""}>
        <button onClick={onToggleLang} style={styles.langToggle} className="wave-btn" aria-label={t.switchLanguage}>
          <Globe size={13} /> {lang === "ru" ? "EN" : "RU"}
        </button>
        <div style={styles.loginDot} />
        <h1 style={styles.loginTitle}>{t.appName}</h1>
        <p style={styles.loginSubtitle}>{t.tagline}</p>
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <input
            autoFocus
            ref={usernameRef}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            placeholder={t.usernamePlaceholder}
            style={styles.loginInput}
            maxLength={20}
            autoComplete="username"
          />
          <input
            type="password"
            ref={passwordRef}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder={t.passwordPlaceholder}
            style={styles.loginInput}
            maxLength={64}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
          {mode === "register" && (
            <input
              type="password"
              ref={confirmPasswordRef}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              placeholder={t.confirmPasswordPlaceholder}
              style={styles.loginInput}
              maxLength={64}
              autoComplete="new-password"
            />
          )}
          {error && <p style={styles.loginError}>{error}</p>}
          <button type="submit" style={styles.loginButton} className="wave-btn">
            {busy ? t.busy : mode === "register" ? t.registerBtn : t.loginBtn}
          </button>
        </form>
        <button
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setConfirmPassword("");
          }}
          style={styles.modeToggle}
          className="wave-btn"
        >
          {mode === "login" ? t.toggleToRegister : t.toggleToLogin}
        </button>
        <p style={styles.loginHint}>{t.loginHint}</p>
      </div>
    </div>
  );
}

function VoiceChannelView({ channelId, channelName, participants, username, joined, onJoin, onLeave, t, userPhotos }) {
  const [remoteStreams, setRemoteStreams] = useState({});
  const [peerStatus, setPeerStatus] = useState({}); // other -> "connecting" | "connected" | "failed"
  const [muted, setMuted] = useState(false);
  const [micError, setMicError] = useState(null);

  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const appliedCandidatesRef = useRef({});
  const joinedRef = useRef(joined);
  const onLeaveRef = useRef(onLeave);
  joinedRef.current = joined;
  onLeaveRef.current = onLeave;

  const others = participants.filter((p) => p !== username);
  const othersKey = others.slice().sort().join(",");

  function cleanupPeer(other) {
    const pc = peersRef.current[other];
    if (pc) {
      try {
        pc.close();
      } catch (err) {}
      delete peersRef.current[other];
    }
    delete appliedCandidatesRef.current[other];
    setRemoteStreams((prev) => {
      if (!(other in prev)) return prev;
      const next = { ...prev };
      delete next[other];
      return next;
    });
    setPeerStatus((prev) => {
      if (!(other in prev)) return prev;
      const next = { ...prev };
      delete next[other];
      return next;
    });
    if (channelId) clearSignal(channelId, pairKeyFor(username, other));
  }

  function cleanupAll() {
    Object.keys(peersRef.current).forEach(cleanupPeer);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((tr) => tr.stop());
      localStreamRef.current = null;
    }
  }

  function ensurePeer(other) {
    if (peersRef.current[other]) return peersRef.current[other];
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((tr) => pc.addTrack(tr, localStreamRef.current));
    }
    pc.ontrack = (e) => {
      setRemoteStreams((prev) => ({ ...prev, [other]: e.streams[0] }));
    };
    pc.onconnectionstatechange = () => {
      setPeerStatus((prev) => ({
        ...prev,
        [other]: pc.connectionState === "connected" ? "connected" : pc.connectionState === "failed" ? "failed" : "connecting",
      }));
    };
    pc.onicecandidate = (e) => {
      if (e.candidate && channelId) {
        writeSignal(channelId, pairKeyFor(username, other), (cur) => {
          const mine = (cur.candidates && cur.candidates[username]) || [];
          return {
            ...cur,
            candidates: { ...(cur.candidates || {}), [username]: [...mine, e.candidate.toJSON()] },
          };
        });
      }
    };
    peersRef.current[other] = pc;
    appliedCandidatesRef.current[other] = 0;
    setPeerStatus((prev) => ({ ...prev, [other]: "connecting" }));
    return pc;
  }

  // Grab the microphone as soon as we join; release it when we leave.
  useEffect(() => {
    if (!joined) {
      cleanupAll();
      return;
    }
    let cancelled = false;
    setMicError(null);
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        localStreamRef.current = stream;
      })
      .catch((err) => {
        if (!cancelled) setMicError(err && err.message ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, channelId]);

  // If we navigate away while still connected, leave the call cleanly
  // instead of silently going deaf while still showing as "in" the channel.
  useEffect(() => {
    return () => {
      cleanupAll();
      if (joinedRef.current && onLeaveRef.current) onLeaveRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  // Signaling loop: exchange SDP offers/answers and ICE candidates through
  // shared storage (polling, since there's no realtime push channel here).
  useEffect(() => {
    if (!joined) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      if (cancelled || !localStreamRef.current || !channelId) return;
      for (const other of others) {
        const pc = ensurePeer(other);
        const pairKey = pairKeyFor(username, other);
        const data = await readSignal(channelId, pairKey);
        if (cancelled) return;
        const iAmOfferer = username < other;
        try {
          if (iAmOfferer) {
            if (pc.signalingState === "stable" && !pc.currentLocalDescription && !pc.currentRemoteDescription) {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await writeSignal(channelId, pairKey, (cur) => ({ ...cur, offer: { sdp: pc.localDescription, from: username } }));
            } else if (data.answer && data.answer.from === other && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(data.answer.sdp);
            }
          } else if (data.offer && data.offer.from === other && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(data.offer.sdp);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await writeSignal(channelId, pairKey, (cur) => ({ ...cur, answer: { sdp: pc.localDescription, from: username } }));
          }
          const remoteList = (data.candidates && data.candidates[other]) || [];
          const applied = appliedCandidatesRef.current[other] || 0;
          for (let i = applied; i < remoteList.length; i++) {
            try {
              await pc.addIceCandidate(remoteList[i]);
            } catch (err) {
              // a candidate can fail to apply before the remote description
              // is set yet; the next tick's earlier candidates are skipped
              // via the applied-count so we don't reprocess them forever
            }
          }
          appliedCandidatesRef.current[other] = remoteList.length;
        } catch (err) {
          // transient signaling hiccup — retried on the next tick
        }
      }
      Object.keys(peersRef.current).forEach((other) => {
        if (!others.includes(other)) cleanupPeer(other);
      });
    }, 1200);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, othersKey, channelId, username]);

  function toggleMute() {
    if (!localStreamRef.current) return;
    const next = !muted;
    localStreamRef.current.getAudioTracks().forEach((tr) => (tr.enabled = !next));
    setMuted(next);
  }

  return (
    <div style={styles.voiceWrap}>
      {Object.entries(remoteStreams).map(([name, stream]) => (
        <audio
          key={name}
          autoPlay
          playsInline
          ref={(el) => {
            if (el && el.srcObject !== stream) {
              el.srcObject = stream;
              el.play().catch(() => {});
            }
          }}
        />
      ))}
      <Volume2 size={28} style={{ opacity: 0.5 }} />
      <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", margin: "10px 0 18px" }}>
        {t.voiceDemoHint}
      </p>
      {micError && (
        <p style={{ fontSize: 13, color: "#F09595", textAlign: "center", margin: "0 0 12px" }}>{micError}</p>
      )}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {participants.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>{t.voiceNoOne}</p>
        )}
        {participants.map((p) => {
          const isMe = p === username;
          const status = isMe ? (joined ? "connected" : null) : peerStatus[p];
          return (
            <div key={p} style={styles.voiceParticipant}>
              <div style={{ ...styles.avatar, background: colorForName(p), width: 30, height: 30, fontSize: 11 }}>
                <AvatarPhoto src={userPhotos && userPhotos[p]} fallback={initials(p)} />
              </div>
              <span style={{ fontSize: 14 }}>
                {p}
                {isMe && muted ? " (mute)" : ""}
              </span>
              {status === "connecting" && (
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>…</span>
              )}
              <Mic
                size={14}
                style={{
                  marginLeft: status === "connecting" ? 6 : "auto",
                  color: status === "failed" ? "#F09595" : status ? "var(--online)" : "var(--muted)",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {joined && (
          <button onClick={toggleMute} style={styles.voiceLeaveButton} className="wave-btn">
            <Mic size={16} />
            {muted ? t.unmute : t.mute}
          </button>
        )}
        <button onClick={joined ? onLeave : onJoin} style={joined ? styles.voiceLeaveButton : styles.voiceJoinButton} className="wave-btn">
          <Mic size={16} />
          {joined ? t.leaveVoice(channelName) : t.joinVoice(channelName)}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [username, setUsername] = useState(null);
  const [lang, setLang] = useState(null);
  const [activeSection, setActiveSection] = useState("server");
  const [activeServerId, setActiveServerId] = useState(DEMO_SERVERS[0].id);
  const [activeChannelId, setActiveChannelId] = useState(DEMO_SERVERS[0].channels[0].id);
  const [activeDmPartner, setActiveDmPartner] = useState(null);
  const [dmDirectory, setDmDirectory] = useState([]);
  const [messages, setMessages] = useState({});
  const [voiceParticipants, setVoiceParticipants] = useState([]);
  const [draft, setDraft] = useState("");
  const [mobilePanel, setMobilePanel] = useState("list");
  const [showMembers, setShowMembers] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [reactionPickerFor, setReactionPickerFor] = useState(null);
  const [showStickers, setShowStickers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalResults, setGlobalResults] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [channelPreviews, setChannelPreviews] = useState({});
  const [listFilter, setListFilter] = useState("");
  const [archivedIds, setArchivedIds] = useState([]);
  const [pinnedIds, setPinnedIds] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  // "Edit" mode on the chat list: lets you multi-select several channels/DMs
  // at once and pin, archive, or delete them together.
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [renamingChannel, setRenamingChannel] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [profilePhoto, setProfilePhoto] = useState(null);
  // Cache of every user's profile photo (username -> photo dataURL | null),
  // so an avatar someone sets actually renders for everyone else too,
  // instead of only ever showing up on the device that set it.
  const [userPhotos, setUserPhotos] = useState({});
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFindFriends, setShowFindFriends] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [customChannels, setCustomChannels] = useState({});
  const [dmRequestPending, setDmRequestPending] = useState(false);
  const [lastSentId, setLastSentId] = useState(null);
  const [sendPulse, setSendPulse] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastSeenRef = useRef({});
  const currentChannelIdRef = useRef(null);
  const lastTypingWriteRef = useRef(0);

  const t = STRINGS[lang || "ru"];
  const s = SETTINGS_STRINGS[lang || "ru"] || SETTINGS_STRINGS.ru;

  // Mobile browsers (especially in-app browsers like the one used from Notes)
  // often lie about 100vh/100dvh once their address bar/toolbar is visible,
  // cutting off the bottom of the app. Measuring the real visible height in
  // JS and pushing it into a CSS var is the reliable fix.
  useEffect(() => {
    function setRealHeight() {
      const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty("--app-real-height", `${h}px`);
    }
    setRealHeight();
    window.addEventListener("resize", setRealHeight);
    window.addEventListener("orientationchange", setRealHeight);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", setRealHeight);
    return () => {
      window.removeEventListener("resize", setRealHeight);
      window.removeEventListener("orientationchange", setRealHeight);
      if (window.visualViewport) window.visualViewport.removeEventListener("resize", setRealHeight);
    };
  }, []);

  const activeServer = DEMO_SERVERS.find((s) => s.id === activeServerId);
  const activeStaticChannel =
    activeSection === "server"
      ? activeServer.channels.find((c) => c.id === activeChannelId) ||
        (customChannels[activeServerId] || []).find((c) => c.id === activeChannelId)
      : null;
  const currentChannelId = activeSection === "dm" ? (activeDmPartner ? dmChannelId(username || "", activeDmPartner) : null) : activeChannelId;
  const currentChannelName =
    activeSection === "dm" ? activeDmPartner || "" : activeStaticChannel ? localizedName(activeStaticChannel, lang) : "";
  const currentChannelType = activeSection === "dm" ? "dm" : activeStaticChannel ? activeStaticChannel.type : "text";
  const isBroadcastChannel = activeSection === "server" && activeStaticChannel && activeStaticChannel.type === "channel";
  const isChannelOwner = isBroadcastChannel && activeStaticChannel.ownerId === username;
  const isChannelSubscribed = isBroadcastChannel && (activeStaticChannel.subscribers || []).includes(username);
  const channelMessages = currentChannelId ? messages[currentChannelId] || [] : [];
  const filteredMessages = searchQuery.trim()
    ? channelMessages.filter((m) => m.type !== "image" && m.text && m.text.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : channelMessages;

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    loadArchived(username).then((ids) => {
      if (!cancelled) setArchivedIds(ids);
    });
    loadPinned(username).then((ids) => {
      if (!cancelled) setPinnedIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sessionResult, savedLang] = await Promise.all([
          storage.get("session", false).catch(() => null),
          loadLang(),
        ]);
        if (!cancelled) {
          if (sessionResult && sessionResult.value) setUsername(sessionResult.value);
          if (savedLang) setLang(savedLang);
        }
      } catch (err) {
        // no saved session yet
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the account's saved theme/photo once we know who's logged in, and
  // keep friends + incoming friend requests fresh with a light poll.
  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      try {
        const acc = await storage.get(`account:${username}`, true).catch(() => null);
        if (!cancelled && acc && acc.value) {
          const data = JSON.parse(acc.value);
          if (data.theme) setTheme(data.theme);
          if (data.photo) setProfilePhoto(data.photo);
          setUserPhotos((prev) => ({ ...prev, [username]: data.photo || null }));
        }
      } catch (err) {
        // no saved account data yet, defaults are fine
      }
    })();
    const refresh = async () => {
      const [f, r] = await Promise.all([loadFriends(username), loadFriendRequests(username)]);
      if (!cancelled) {
        setFriends(f);
        setIncomingRequests(r);
        // Keep photos for yourself and your friends fresh so newly-set
        // avatars propagate here without needing a full page reload.
        ensureUserPhotos([username, ...f]);
      }
    };
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [username]);

  // Custom (user-created) channels live alongside the demo channels for the
  // currently open server.
  useEffect(() => {
    if (activeSection !== "server" || !activeServerId) return;
    let cancelled = false;
    loadCustomChannels(activeServerId).then((list) => {
      if (!cancelled) setCustomChannels((prev) => ({ ...prev, [activeServerId]: list }));
    });
    return () => {
      cancelled = true;
    };
  }, [activeSection, activeServerId]);

  // A DM only unlocks the composer once both sides are friends. If a request
  // is already pending, keep showing "request sent" instead of "send request".
  useEffect(() => {
    if (activeSection !== "dm" || !activeDmPartner || !username) {
      setDmRequestPending(false);
      return;
    }
    if (friends.includes(activeDmPartner)) {
      setDmRequestPending(false);
      return;
    }
    let cancelled = false;
    loadFriendRequests(activeDmPartner).then((list) => {
      if (!cancelled) setDmRequestPending(list.some((r) => r.from === username));
    });
    return () => {
      cancelled = true;
    };
  }, [activeSection, activeDmPartner, username, friends]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [channelMessages.length, currentChannelId]);

  useEffect(() => {
    currentChannelIdRef.current = currentChannelId;
    setTypingUser(null);
  }, [currentChannelId]);

  useEffect(() => {
    if (!currentChannelId || (currentChannelType !== "text" && currentChannelType !== "dm")) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const result = await storage.get(typingKey(currentChannelId), true);
        if (cancelled || !result || !result.value) {
          if (!cancelled) setTypingUser(null);
          return;
        }
        const data = JSON.parse(result.value);
        if (data.user && data.user !== username && Date.now() - data.ts < 4000) {
          setTypingUser(data.user);
        } else {
          setTypingUser(null);
        }
      } catch (err) {
        if (!cancelled) setTypingUser(null);
      }
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentChannelId, currentChannelType, username]);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    const pollTargets = async () => {
      const targets = [];
      DEMO_SERVERS.forEach((s) =>
        s.channels
          .filter((c) => c.type === "text")
          .forEach((c) => targets.push({ id: c.id, name: c.name, serverId: s.id, kind: "channel" }))
      );
      dmDirectory.forEach((u) => targets.push({ id: dmChannelId(username, u), name: u, serverId: null, kind: "dm" }));

      for (const target of targets) {
        if (cancelled) return;
        const msgs = await loadChannelMessages(target.id);
        const last = msgs[msgs.length - 1];
        if (!last) continue;
        const previewText = last.type === "sticker" ? last.text : last.type === "image" ? t.photoLabel : last.text;
        setChannelPreviews((prev) => ({ ...prev, [target.id]: { text: previewText, time: last.time, author: last.author } }));
        const prevId = lastSeenRef.current[target.id];
        if (prevId === undefined) {
          lastSeenRef.current[target.id] = last.id;
          continue;
        }
        if (last.id !== prevId) {
          lastSeenRef.current[target.id] = last.id;
          if (last.author !== username && target.id !== currentChannelIdRef.current) {
            setUnreadCounts((prev) => ({ ...prev, [target.id]: (prev[target.id] || 0) + 1 }));
            const toastId = Date.now() + Math.random();
            const preview =
              last.type === "sticker" ? last.text : last.type === "image" ? t.photoLabel : last.text;
            setToasts((prev) => [...prev, { id: toastId, author: last.author, text: preview, target }]);
            playIncomingSound(username);
            setTimeout(() => {
              setToasts((prev) => prev.filter((x) => x.id !== toastId));
            }, 4000);
          }
        }
      }
    };
    pollTargets();
    const interval = setInterval(pollTargets, 4500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [username, dmDirectory, t]);

  useEffect(() => {
    if (!username || !currentChannelId || currentChannelType === "voice") return;
    let cancelled = false;
    setLoading(true);
    loadChannelMessages(currentChannelId).then((msgs) => {
      if (cancelled) return;
      setMessages((prev) => ({ ...prev, [currentChannelId]: msgs }));
      setLoading(false);
      ensureUserPhotos(msgs.map((m) => m.author));
    });
    return () => {
      cancelled = true;
    };
  }, [currentChannelId, currentChannelType, username]);

  useEffect(() => {
    if (!username || !currentChannelId || currentChannelType === "voice") return;
    const interval = setInterval(() => {
      loadChannelMessages(currentChannelId).then((msgs) => {
        setMessages((prev) => ({ ...prev, [currentChannelId]: msgs }));
        ensureUserPhotos(msgs.map((m) => m.author));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [currentChannelId, currentChannelType, username]);

  useEffect(() => {
    if (!username || !currentChannelId || currentChannelType !== "voice") return;
    let cancelled = false;
    loadVoiceParticipants(currentChannelId).then((p) => {
      if (!cancelled) setVoiceParticipants(p);
    });
    const interval = setInterval(() => {
      loadVoiceParticipants(currentChannelId).then((p) => {
        if (!cancelled) setVoiceParticipants(p);
      });
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentChannelId, currentChannelType, username]);

  useEffect(() => {
    // Refresh the directory whenever the DM list OR the "find friends"
    // search is open — previously this only fired for the DM tab, so a
    // freshly-registered user opened straight into "find friends" (e.g.
    // from settings) would see a stale/empty list and not find themselves
    // or newly-registered people.
    if (!username || (activeSection !== "dm" && !showFindFriends)) return;
    let cancelled = false;
    loadUsernames().then((list) => {
      if (cancelled) return;
      const others = list.filter((u) => u !== username);
      setDmDirectory(others);
      ensureUserPhotos(others);
    });
    return () => {
      cancelled = true;
    };
  }, [activeSection, username, showFindFriends]);

  useEffect(() => {
    if (!showGlobalSearch) return;
    if (!globalQuery.trim()) {
      setGlobalResults([]);
      setGlobalLoading(false);
      return;
    }
    setGlobalLoading(true);
    const handle = setTimeout(async () => {
      const textChannels = activeServer.channels.filter((c) => c.type === "text");
      const results = await Promise.all(
        textChannels.map(async (c) => {
          const msgs = await loadChannelMessages(c.id);
          return msgs
            .filter((m) => m.type !== "image" && m.text && m.text.toLowerCase().includes(globalQuery.trim().toLowerCase()))
            .map((m) => ({ ...m, channelId: c.id, channelName: c.name }));
        })
      );
      setGlobalResults(results.flat());
      setGlobalLoading(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [globalQuery, showGlobalSearch, activeServer]);

  async function handleToggleLang() {
    const next = lang === "en" ? "ru" : lang === "ru" ? "en" : "ru";
    setLang(next);
    await persistLang(next);
  }

  if (!sessionChecked) {
    return (
      <div style={styles.loginWrap} className="wave-app-fullscreen">
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Загрузка… / Loading…</p>
      </div>
    );
  }

  if (!lang) {
    return (
      <LanguageScreen
        onSelect={async (chosen) => {
          setLang(chosen);
          await persistLang(chosen);
        }}
      />
    );
  }

  if (!username) return <LoginScreen onLogin={setUsername} t={t} lang={lang} onToggleLang={handleToggleLang} />;

  function selectServer(id) {
    setActiveSection("server");
    setActiveServerId(id);
    const firstChannelId = DEMO_SERVERS.find((s) => s.id === id).channels[0].id;
    setActiveChannelId(firstChannelId);
    setMobilePanel("list");
    setShowMembers(false);
    setShowSearch(false);
    setSearchQuery("");
    setReplyingTo(null);
    setUnreadCounts((prev) => ({ ...prev, [firstChannelId]: 0 }));
    setListFilter("");
    setEditMode(false);
    setSelectedIds([]);
  }

  function selectDmSection() {
    setActiveSection("dm");
    setMobilePanel("list");
    setShowMembers(false);
    setShowSearch(false);
    setSearchQuery("");
    setReplyingTo(null);
    setListFilter("");
    setEditMode(false);
    setSelectedIds([]);
  }

  function selectChannel(id) {
    setActiveChannelId(id);
    setMobilePanel("chat");
    setShowSearch(false);
    setSearchQuery("");
    setReplyingTo(null);
    setUnreadCounts((prev) => ({ ...prev, [id]: 0 }));
  }

  function selectDmPartner(partner) {
    setActiveDmPartner(partner);
    setMobilePanel("chat");
    setShowSearch(false);
    setSearchQuery("");
    setReplyingTo(null);
    setUnreadCounts((prev) => ({ ...prev, [dmChannelId(username || "", partner)]: 0 }));
  }

  function openToastTarget(toast) {
    setToasts((prev) => prev.filter((x) => x.id !== toast.id));
    setUnreadCounts((prev) => ({ ...prev, [toast.target.id]: 0 }));
    if (toast.target.kind === "channel") {
      setActiveSection("server");
      setActiveServerId(toast.target.serverId);
      setActiveChannelId(toast.target.id);
    } else {
      setActiveSection("dm");
      setActiveDmPartner(toast.target.name);
    }
    setMobilePanel("chat");
  }

  async function handleLogout() {
    try {
      await storage.delete("session", false);
    } catch (err) {
      // nothing saved, that's fine
    }
    setUsername(null);
  }

  async function handleAcceptRequest(fromUser) {
    const ok = await respondToFriendRequest(username, fromUser, true);
    if (ok) {
      setIncomingRequests((prev) => prev.filter((r) => r.from !== fromUser));
      setFriends((prev) => (prev.includes(fromUser) ? prev : [...prev, fromUser]));
    }
  }

  async function handleDeclineRequest(fromUser) {
    const ok = await respondToFriendRequest(username, fromUser, false);
    if (ok) setIncomingRequests((prev) => prev.filter((r) => r.from !== fromUser));
  }

  async function handleSendFriendRequest(toUser) {
    const ok = await sendFriendRequest(username, toUser);
    if (ok) setDmRequestPending(true);
    return ok;
  }

  async function handleCreateChannel(name, type) {
    const next = await createCustomChannel(activeServerId, name, type, username);
    if (next) {
      setCustomChannels((prev) => ({ ...prev, [activeServerId]: next }));
      setShowCreateChannel(false);
    }
  }

  async function handleRenameChannel(channelId, newName) {
    const next = await renameCustomChannel(activeServerId, channelId, newName);
    if (next) setCustomChannels((prev) => ({ ...prev, [activeServerId]: next }));
    setRenamingChannel(null);
  }

  async function handleDeleteChannel(channelId) {
    if (!window.confirm(s.deleteChannelConfirm)) return;
    const next = await deleteCustomChannel(activeServerId, channelId);
    if (next) setCustomChannels((prev) => ({ ...prev, [activeServerId]: next }));
    if (activeChannelId === channelId) {
      const firstId = activeServer.channels[0].id;
      setActiveChannelId(firstId);
    }
    setMenuOpenFor(null);
  }

  // Deleting a DM clears the shared message history for that conversation
  // (both sides), since there's no per-device "conversation list" separate
  // from the shared directory of users.
  async function handleDeleteDm(dmId) {
    if (!window.confirm(s.deleteDmConfirm)) return;
    await persistMessages(dmId, []);
    const nextArchived = archivedIds.filter((x) => x !== dmId);
    const nextPinned = pinnedIds.filter((x) => x !== dmId);
    setArchivedIds(nextArchived);
    setPinnedIds(nextPinned);
    await Promise.all([setArchived(username, nextArchived), setPinned(username, nextPinned)]);
    setMenuOpenFor(null);
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleEditMode() {
    setEditMode((v) => !v);
    setSelectedIds([]);
    setMenuOpenFor(null);
  }

  async function handleBulkPin() {
    if (selectedIds.length === 0) return;
    const merged = Array.from(new Set([...selectedIds, ...pinnedIds]));
    setPinnedIds(merged);
    await setPinned(username, merged);
    setEditMode(false);
    setSelectedIds([]);
  }

  async function handleBulkArchive() {
    if (selectedIds.length === 0) return;
    const merged = Array.from(new Set([...selectedIds, ...archivedIds]));
    setArchivedIds(merged);
    await setArchived(username, merged);
    setEditMode(false);
    setSelectedIds([]);
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!window.confirm(s.bulkDeleteConfirm)) return;
    const dmIds = activeSection === "dm" ? selectedIds : [];
    const channelIds = activeSection === "server" ? selectedIds : [];
    // Clear message history for every selected DM.
    await Promise.all(dmIds.map((id) => persistMessages(id, [])));
    // Only actually delete channels the current user owns; others just get
    // dropped from this device's pinned/archived bookkeeping below.
    const ownedChannelIds = channelIds.filter((id) => {
      const c = (customChannels[activeServerId] || []).find((ch) => ch.id === id);
      return c && c.ownerId === username;
    });
    for (const id of ownedChannelIds) {
      const next = await deleteCustomChannel(activeServerId, id);
      if (next) setCustomChannels((prev) => ({ ...prev, [activeServerId]: next }));
    }
    const nextArchived = archivedIds.filter((x) => !selectedIds.includes(x));
    const nextPinned = pinnedIds.filter((x) => !selectedIds.includes(x));
    setArchivedIds(nextArchived);
    setPinnedIds(nextPinned);
    await Promise.all([setArchived(username, nextArchived), setPinned(username, nextPinned)]);
    if (channelIds.includes(activeChannelId)) {
      setActiveChannelId(activeServer.channels[0].id);
    }
    setEditMode(false);
    setSelectedIds([]);
  }

  async function handleToggleSubscribe(channelId, subscribe) {
    const next = await setChannelSubscription(activeServerId, channelId, username, subscribe);
    if (next) setCustomChannels((prev) => ({ ...prev, [activeServerId]: next }));
  }

  async function handleToggleArchive(id) {
    const next = archivedIds.includes(id) ? archivedIds.filter((x) => x !== id) : [...archivedIds, id];
    setArchivedIds(next);
    await setArchived(username, next);
    setMenuOpenFor(null);
  }

  async function handleTogglePin(id) {
    const next = pinnedIds.includes(id) ? pinnedIds.filter((x) => x !== id) : [id, ...pinnedIds];
    setPinnedIds(next);
    await setPinned(username, next);
    setMenuOpenFor(null);
  }

  async function persistMessages(channelId, updated) {
    setMessages((prev) => ({ ...prev, [channelId]: updated }));
    try {
      const result = await storage.set(messagesKey(channelId), JSON.stringify(updated), true);
      if (!result) setStorageError(true);
    } catch (err) {
      setStorageError(true);
    }
  }

  // Fetches (or refreshes) the saved profile photo for each given username
  // and merges the results into the shared userPhotos cache, so avatars
  // other people set actually show up for everyone, not just themselves.
  async function ensureUserPhotos(users) {
    const unique = Array.from(new Set(users.filter(Boolean)));
    if (unique.length === 0) return;
    const entries = await Promise.all(unique.map(async (u) => [u, await loadUserPhoto(u)]));
    setUserPhotos((prev) => {
      const next = { ...prev };
      entries.forEach(([u, photo]) => {
        next[u] = photo;
      });
      return next;
    });
  }

  function buildReplySnapshot() {
    if (!replyingTo) return null;
    const preview =
      replyingTo.type === "sticker" ? replyingTo.text : replyingTo.type === "image" ? t.photoLabel : replyingTo.text;
    return { id: replyingTo.id, author: replyingTo.author, text: preview, type: replyingTo.type };
  }

  async function clearTypingState() {
    if (!currentChannelId) return;
    try {
      await storage.delete(typingKey(currentChannelId), true);
    } catch (err) {
      // best-effort
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() || !currentChannelId) return;
    const now = new Date();
    const time = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
    const replyTo = buildReplySnapshot();
    const newMsg = { id: Date.now() + Math.random(), author: username, text: draft.trim(), time, type: "text", ...(replyTo ? { replyTo } : {}) };
    await persistMessages(currentChannelId, [...channelMessages, newMsg]);
    setDraft("");
    setReplyingTo(null);
    clearTypingState();
    playSendSound(username);
    setLastSentId(newMsg.id);
    setSendPulse(true);
    setTimeout(() => setSendPulse(false), 420);
  }

  async function sendSticker(emoji) {
    if (!currentChannelId) return;
    const now = new Date();
    const time = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
    const replyTo = buildReplySnapshot();
    const newMsg = { id: Date.now() + Math.random(), author: username, text: emoji, time, type: "sticker", ...(replyTo ? { replyTo } : {}) };
    await persistMessages(currentChannelId, [...channelMessages, newMsg]);
    setShowStickers(false);
    setReplyingTo(null);
    playSendSound(username);
    setLastSentId(newMsg.id);
  }

  function handleDraftChange(value) {
    setDraft(value);
    if (!currentChannelId || (currentChannelType !== "text" && currentChannelType !== "dm")) return;
    const now = Date.now();
    if (value.trim() && now - lastTypingWriteRef.current > 1500) {
      lastTypingWriteRef.current = now;
      storage.set(typingKey(currentChannelId), JSON.stringify({ user: username, ts: now }), true).catch(() => {});
    } else if (!value.trim()) {
      clearTypingState();
    }
  }

  async function handlePickImage(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || !currentChannelId) return;
    if (!file.type.startsWith("image/")) {
      alert(t.chooseImage);
      return;
    }
    setImageBusy(true);
    try {
      const dataUrl = await resizeImageFile(file, 480, 0.6);
      const now = new Date();
      const time = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
      const newMsg = { id: Date.now() + Math.random(), author: username, text: dataUrl, time, type: "image" };
      await persistMessages(currentChannelId, [...channelMessages, newMsg]);
    } catch (err) {
      setStorageError(true);
    }
    setImageBusy(false);
  }

  async function toggleReaction(message, emoji) {
    if (!currentChannelId) return;
    const updated = channelMessages.map((m) => {
      if (m.id !== message.id) return m;
      const reactions = { ...(m.reactions || {}) };
      const people = reactions[emoji] ? [...reactions[emoji]] : [];
      const idx = people.indexOf(username);
      if (idx === -1) people.push(username);
      else people.splice(idx, 1);
      if (people.length === 0) delete reactions[emoji];
      else reactions[emoji] = people;
      return { ...m, reactions };
    });
    setReactionPickerFor(null);
    await persistMessages(currentChannelId, updated);
  }

  async function joinVoice() {
    if (!currentChannelId) return;
    const next = voiceParticipants.includes(username) ? voiceParticipants : [...voiceParticipants, username];
    setVoiceParticipants(next);
    try {
      await storage.set(voiceKey(currentChannelId), JSON.stringify(next), true);
    } catch (err) {
      setStorageError(true);
    }
  }

  async function leaveVoice() {
    if (!currentChannelId) return;
    const next = voiceParticipants.filter((p) => p !== username);
    setVoiceParticipants(next);
    try {
      await storage.set(voiceKey(currentChannelId), JSON.stringify(next), true);
    } catch (err) {
      setStorageError(true);
    }
  }

  function openGlobalResult(result) {
    setShowGlobalSearch(false);
    setActiveSection("server");
    selectChannel(result.channelId);
    setSearchQuery(globalQuery);
    setShowSearch(true);
  }

  const onlineMembers = activeSection === "server" ? [username, ...activeServer.members] : [];
  const showMembersButton = activeSection === "server" && currentChannelType === "text";
  const showSearchButton = currentChannelType === "text" || currentChannelType === "dm" || currentChannelType === "channel";

  return (
    <div style={{ ...styles.app, ...(theme === "light" ? LIGHT_THEME_VARS : {}) }} className="wave-app-fullscreen">
      <div
        style={{ ...styles.channelPanel, display: mobilePanel === "list" ? "flex" : "none" }}
        className="wave-channel-panel"
      >
        <div style={styles.folderTabsBar}>
          {DEMO_SERVERS.map((srv) => (
            <button
              key={srv.id}
              onClick={() => selectServer(srv.id)}
              style={{
                ...styles.folderTab,
                ...(activeSection === "server" && srv.id === activeServerId ? styles.folderTabActive : {}),
              }}
              className="wave-btn"
              aria-label={localizedName(srv, lang) || srv.name}
            >
              {srv.tag}
              {srv.channels.some((c) => (unreadCounts[c.id] || 0) > 0) && <span style={styles.folderTabDot} />}
            </button>
          ))}
          <button
            onClick={selectDmSection}
            style={{ ...styles.folderTab, ...(activeSection === "dm" ? styles.folderTabActive : {}) }}
            className="wave-btn"
            aria-label={t.directMessages}
          >
            <MessageCircle size={16} />
            {dmDirectory.some((u) => (unreadCounts[dmChannelId(username, u)] || 0) > 0) && (
              <span style={styles.folderTabDot} />
            )}
          </button>
          <button
            onClick={() => alert(t.demoNoServer)}
            style={styles.folderTab}
            className="wave-btn"
            aria-label={t.createServer}
          >
            <Plus size={14} />
          </button>
        </div>
        {activeSection === "server" ? (
          <>
            <div style={styles.channelPanelHeader}>
              <span style={{ fontWeight: 800 }}>
                {editMode && selectedIds.length > 0
                  ? s.selectedCount(selectedIds.length)
                  : showArchived
                  ? s.archivedSection
                  : localizedName(activeServer, lang)}
              </span>
              <button
                onClick={toggleEditMode}
                style={{ ...styles.headerSearchBtn, marginLeft: "auto", color: editMode ? "var(--accent)" : "var(--muted)" }}
                className="wave-btn"
                aria-label={editMode ? s.doneEditing : s.editList}
              >
                {editMode ? <Check size={16} /> : <Pencil size={16} />}
              </button>
              <button
                onClick={() => {
                  setShowArchived((v) => !v);
                  setMenuOpenFor(null);
                  setEditMode(false);
                  setSelectedIds([]);
                }}
                style={{ ...styles.headerSearchBtn, color: showArchived ? "var(--accent)" : "var(--muted)" }}
                className="wave-btn"
                aria-label={s.archivedSection}
              >
                <Archive size={16} />
              </button>
              <button
                onClick={() => setShowCreateChannel(true)}
                style={styles.headerSearchBtn}
                className="wave-btn"
                aria-label={s.newChannel}
              >
                <FolderPlus size={16} />
              </button>
              <button
                onClick={() => {
                  setShowGlobalSearch(true);
                  setGlobalQuery("");
                  setGlobalResults([]);
                }}
                style={styles.headerSearchBtn}
                className="wave-btn"
                aria-label={t.searchServer + " " + activeServer.name}
              >
                <Search size={16} />
              </button>
              <button
                onClick={() => setShowFindFriends(true)}
                style={styles.headerSearchBtn}
                className="wave-btn"
                aria-label={s.findFriends}
              >
                <UserPlus size={16} />
              </button>
              <button
                onClick={() => setShowNotifications(true)}
                style={{ ...styles.headerSearchBtn, position: "relative" }}
                className="wave-btn"
                aria-label={s.notifications}
              >
                <Inbox size={16} />
                {incomingRequests.length > 0 && <span style={styles.headerBtnDot} />}
              </button>
            </div>
            <div style={styles.listSearchWrap}>
              <div style={styles.listSearchBar}>
                <Search size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                <input
                  value={listFilter}
                  onChange={(e) => setListFilter(e.target.value)}
                  placeholder={t.listSearchPlaceholder}
                  style={styles.listSearchInput}
                />
                {listFilter && (
                  <button onClick={() => setListFilter("")} style={styles.stickerToggle} className="wave-btn" aria-label={t.close}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div style={styles.channelList}>
              {!showArchived && <div style={styles.channelGroupLabel}>{t.channels}</div>}
              {[...activeServer.channels, ...(customChannels[activeServerId] || [])]
                .filter((c) => c.name.toLowerCase().includes(listFilter.trim().toLowerCase()))
                .filter((c) => (showArchived ? archivedIds.includes(c.id) : !archivedIds.includes(c.id)))
                .sort((a, b) => (pinnedIds.includes(b.id) ? 1 : 0) - (pinnedIds.includes(a.id) ? 1 : 0))
                .map((c) => {
                  const preview = channelPreviews[c.id];
                  const isCustom = !!c.ownerId;
                  const isOwner = isCustom && c.ownerId === username;
                  const isBroadcast = c.type === "channel";
                  const isSubscribed = isBroadcast && (c.subscribers || []).includes(username);
                  const isArchived = archivedIds.includes(c.id);
                  const isPinned = pinnedIds.includes(c.id);
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <div key={c.id} style={{ position: "relative" }}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => (editMode ? toggleSelected(c.id) : selectChannel(c.id))}
                        onKeyDown={(e) => e.key === "Enter" && (editMode ? toggleSelected(c.id) : selectChannel(c.id))}
                        style={{ ...styles.channelItem, ...(c.id === activeChannelId && !editMode ? styles.channelItemActive : {}) }}
                        className="wave-btn"
                      >
                        {editMode && (
                          <span style={{ ...styles.selectCheckbox, ...(isSelected ? styles.selectCheckboxOn : {}) }}>
                            {isSelected && <Check size={12} color="#0B1220" />}
                          </span>
                        )}
                        <div style={{ ...styles.channelItemAvatar, background: colorForName(c.name) }}>
                          {initials(c.name)}
                          {c.type === "voice" && (
                            <span style={styles.channelItemVoiceBadge}>
                              <Volume2 size={10} />
                            </span>
                          )}
                          {isBroadcast && (
                            <span style={styles.channelItemVoiceBadge}>
                              <Rss size={10} />
                            </span>
                          )}
                        </div>
                        <div style={styles.channelItemBody}>
                          <div style={styles.channelItemTitleRow}>
                            {isPinned && <Pin size={11} style={styles.pinnedIcon} className="wave-pin-pop" />}
                            <span style={styles.channelItemName}>{localizedName(c, lang)}</span>
                            {preview && <span style={styles.channelItemTime}>{preview.time}</span>}
                          </div>
                          <div style={styles.channelItemPreviewRow}>
                            <span style={styles.channelItemPreview}>
                              {preview ? `${preview.author}: ${preview.text}` : "\u00A0"}
                            </span>
                            {(unreadCounts[c.id] || 0) > 0 && c.id !== activeChannelId && (
                              <span key={unreadCounts[c.id]} style={styles.unreadBadge} className="wave-badge-pop">{unreadCounts[c.id]}</span>
                            )}
                          </div>
                        </div>
                        {!editMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenFor(menuOpenFor === c.id ? null : c.id);
                            }}
                            style={styles.channelItemMenuBtn}
                            className="wave-btn wave-ripple-btn"
                            aria-label={s.more}
                          >
                            <MoreVertical size={16} />
                          </button>
                        )}
                      </div>
                      {menuOpenFor === c.id && (
                        <ChatItemMenu
                          s={s}
                          showRename={isOwner}
                          showDelete={isOwner}
                          showSubscribe={isBroadcast && !isOwner}
                          isSubscribed={isSubscribed}
                          isArchived={isArchived}
                          isPinned={isPinned}
                          onArchive={() => handleToggleArchive(c.id)}
                          onPin={() => handleTogglePin(c.id)}
                          onRename={() => setRenamingChannel(c)}
                          onDelete={() => handleDeleteChannel(c.id)}
                          onSubscribeToggle={() => handleToggleSubscribe(c.id, !isSubscribed)}
                          onClose={() => setMenuOpenFor(null)}
                        />
                      )}
                    </div>
                  );
                })}
              {showArchived &&
                [...activeServer.channels, ...(customChannels[activeServerId] || [])].filter((c) => archivedIds.includes(c.id)).length === 0 && (
                  <p style={{ fontSize: 13, color: "var(--muted)", padding: "8px" }}>{s.noArchived}</p>
                )}
            </div>
          </>
        ) : (
          <>
            <div style={styles.channelPanelHeader}>
              <span style={{ fontWeight: 800 }}>
                {editMode && selectedIds.length > 0
                  ? s.selectedCount(selectedIds.length)
                  : showArchived
                  ? s.archivedSection
                  : t.directMessages}
              </span>
              <button
                onClick={toggleEditMode}
                style={{ ...styles.headerSearchBtn, marginLeft: "auto", color: editMode ? "var(--accent)" : "var(--muted)" }}
                className="wave-btn"
                aria-label={editMode ? s.doneEditing : s.editList}
              >
                {editMode ? <Check size={16} /> : <Pencil size={16} />}
              </button>
              <button
                onClick={() => {
                  setShowArchived((v) => !v);
                  setMenuOpenFor(null);
                  setEditMode(false);
                  setSelectedIds([]);
                }}
                style={{ ...styles.headerSearchBtn, color: showArchived ? "var(--accent)" : "var(--muted)" }}
                className="wave-btn"
                aria-label={s.archivedSection}
              >
                <Archive size={16} />
              </button>
              <button
                onClick={() => setShowFindFriends(true)}
                style={styles.headerSearchBtn}
                className="wave-btn"
                aria-label={s.findFriends}
              >
                <UserPlus size={16} />
              </button>
              <button
                onClick={() => setShowNotifications(true)}
                style={{ ...styles.headerSearchBtn, position: "relative" }}
                className="wave-btn"
                aria-label={s.notifications}
              >
                <Inbox size={16} />
                {incomingRequests.length > 0 && <span style={styles.headerBtnDot} />}
              </button>
            </div>
            <div style={styles.listSearchWrap}>
              <div style={styles.listSearchBar}>
                <Search size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                <input
                  value={listFilter}
                  onChange={(e) => setListFilter(e.target.value)}
                  placeholder={t.listSearchPlaceholder}
                  style={styles.listSearchInput}
                />
                {listFilter && (
                  <button onClick={() => setListFilter("")} style={styles.stickerToggle} className="wave-btn" aria-label={t.close}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div style={styles.channelList}>
              {dmDirectory.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--muted)", padding: "8px" }}>{t.noOtherUsers}</p>
              )}
              {dmDirectory.length > 0 &&
                dmDirectory
                  .filter((u) => u.toLowerCase().includes(listFilter.trim().toLowerCase()))
                  .filter((u) => (showArchived ? archivedIds.includes(dmChannelId(username, u)) : !archivedIds.includes(dmChannelId(username, u))))
                  .length === 0 && (
                  <p style={{ fontSize: 13, color: "var(--muted)", padding: "8px" }}>{showArchived ? s.noArchived : t.noResults}</p>
                )}
              {dmDirectory
                .filter((u) => u.toLowerCase().includes(listFilter.trim().toLowerCase()))
                .filter((u) => (showArchived ? archivedIds.includes(dmChannelId(username, u)) : !archivedIds.includes(dmChannelId(username, u))))
                .sort(
                  (a, b) =>
                    (pinnedIds.includes(dmChannelId(username, b)) ? 1 : 0) -
                    (pinnedIds.includes(dmChannelId(username, a)) ? 1 : 0)
                )
                .map((u) => {
                  const preview = channelPreviews[dmChannelId(username, u)];
                  const dmId = dmChannelId(username, u);
                  const isArchived = archivedIds.includes(dmId);
                  const isPinned = pinnedIds.includes(dmId);
                  const isSelected = selectedIds.includes(dmId);
                  return (
                    <div key={u} style={{ position: "relative" }}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => (editMode ? toggleSelected(dmId) : selectDmPartner(u))}
                        onKeyDown={(e) => e.key === "Enter" && (editMode ? toggleSelected(dmId) : selectDmPartner(u))}
                        style={{ ...styles.channelItem, ...(u === activeDmPartner && !editMode ? styles.channelItemActive : {}) }}
                        className="wave-btn"
                      >
                        {editMode && (
                          <span style={{ ...styles.selectCheckbox, ...(isSelected ? styles.selectCheckboxOn : {}) }}>
                            {isSelected && <Check size={12} color="#0B1220" />}
                          </span>
                        )}
                        <div style={{ ...styles.channelItemAvatar, background: colorForName(u) }}>
                          <AvatarPhoto src={userPhotos[u]} fallback={initials(u)} />
                        </div>
                        <div style={styles.channelItemBody}>
                          <div style={styles.channelItemTitleRow}>
                            {isPinned && <Pin size={11} style={styles.pinnedIcon} className="wave-pin-pop" />}
                            <span style={styles.channelItemName}>{u}</span>
                            {preview && <span style={styles.channelItemTime}>{preview.time}</span>}
                          </div>
                          <div style={styles.channelItemPreviewRow}>
                            <span style={styles.channelItemPreview}>{preview ? preview.text : "\u00A0"}</span>
                            {(unreadCounts[dmId] || 0) > 0 && u !== activeDmPartner && (
                              <span key={unreadCounts[dmId]} style={styles.unreadBadge} className="wave-badge-pop">{unreadCounts[dmId]}</span>
                            )}
                          </div>
                        </div>
                        {!editMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenFor(menuOpenFor === dmId ? null : dmId);
                            }}
                            style={styles.channelItemMenuBtn}
                            className="wave-btn wave-ripple-btn"
                            aria-label={s.more}
                          >
                            <MoreVertical size={16} />
                          </button>
                        )}
                      </div>
                      {menuOpenFor === dmId && (
                        <ChatItemMenu
                          s={s}
                          showRename={false}
                          showDelete={true}
                          showSubscribe={false}
                          isArchived={isArchived}
                          isPinned={isPinned}
                          onArchive={() => handleToggleArchive(dmId)}
                          onPin={() => handleTogglePin(dmId)}
                          onDelete={() => handleDeleteDm(dmId)}
                          onClose={() => setMenuOpenFor(null)}
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          </>
        )}
        {editMode && selectedIds.length > 0 && (
          <div style={styles.bulkActionBar}>
            <button onClick={handleBulkPin} className="wave-btn" style={styles.bulkActionBtn}>
              <Pin size={16} />
              {s.bulkPin}
            </button>
            <button onClick={handleBulkArchive} className="wave-btn" style={styles.bulkActionBtn}>
              <Archive size={16} />
              {s.bulkArchive}
            </button>
            <button onClick={handleBulkDelete} className="wave-btn" style={{ ...styles.bulkActionBtn, ...styles.bulkActionBtnDanger }}>
              <Trash2 size={16} />
              {s.bulkDelete}
            </button>
          </div>
        )}
        <div style={styles.userFooter}>
          <button onClick={handleToggleLang} style={styles.footerLangBtn} className="wave-btn" aria-label={t.switchLanguage}>
            <Globe size={14} />
          </button>
          <div style={styles.avatarWrap}>
            <div style={{ ...styles.avatar, background: colorForName(username) }}>
              <AvatarPhoto src={profilePhoto} fallback={initials(username)} />
            </div>
            <span style={styles.onlineDot} className="wave-online-pulse" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {username}
          </span>
          <button onClick={() => setShowSettings(true)} style={styles.logoutButton} className="wave-btn" aria-label={t.settingsTitle}>
            <Settings size={16} />
          </button>
          <button onClick={handleLogout} style={styles.logoutButton} className="wave-btn" aria-label={t.logout}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {showSettings && (
        <SettingsPanel
          username={username}
          lang={lang || "ru"}
          t={t}
          storage={storage}
          onToggleLang={handleToggleLang}
          onClose={() => setShowSettings(false)}
          onLogout={handleLogout}
          theme={theme}
          onThemeChange={setTheme}
          photo={profilePhoto}
          onPhotoChange={(dataUrl) => {
            setProfilePhoto(dataUrl);
            setUserPhotos((prev) => ({ ...prev, [username]: dataUrl }));
          }}
        />
      )}

      {showNotifications && (
        <NotificationsPanel
          s={s}
          requests={incomingRequests}
          onAccept={handleAcceptRequest}
          onDecline={handleDeclineRequest}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showFindFriends && (
        <FindFriendsModal
          s={s}
          username={username}
          directory={dmDirectory}
          friends={friends}
          onWrite={(name) => {
            selectDmPartner(name);
            setActiveSection("dm");
            setShowFindFriends(false);
          }}
          onSendRequest={handleSendFriendRequest}
          onClose={() => setShowFindFriends(false)}
          userPhotos={userPhotos}
        />
      )}

      {showCreateChannel && (
        <CreateChannelModal s={s} onCancel={() => setShowCreateChannel(false)} onCreate={handleCreateChannel} />
      )}

      {renamingChannel && (
        <RenameChannelModal s={s} channel={renamingChannel} onCancel={() => setRenamingChannel(null)} onSave={handleRenameChannel} />
      )}

      <div style={{ ...styles.chatPanel, display: mobilePanel === "chat" ? "flex" : "none" }} className="wave-chat-panel">
        <div style={styles.chatHeader}>
          <button onClick={() => setMobilePanel("list")} style={styles.backButton} className="wave-back-button wave-btn" aria-label="Back">
            <ChevronLeft size={20} />
          </button>
          {currentChannelType === "voice" ? (
            <Volume2 size={18} style={{ opacity: 0.6 }} />
          ) : currentChannelType === "dm" ? (
            <MessageCircle size={18} style={{ opacity: 0.6 }} />
          ) : currentChannelType === "channel" ? (
            <Rss size={18} style={{ opacity: 0.6 }} />
          ) : (
            <Hash size={18} style={{ opacity: 0.6 }} />
          )}
          <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {currentChannelName || t.pickDialog}
          </span>
          {showSearchButton && currentChannelId && (
            <button
              onClick={() => {
                setShowSearch((v) => !v);
                setSearchQuery("");
              }}
              style={styles.membersToggle}
              className="wave-btn"
              aria-label={t.searchMessages}
            >
              <Search size={18} />
            </button>
          )}
          {showMembersButton && (
            <button
              onClick={() => setShowMembers((v) => !v)}
              style={{ ...styles.membersToggle, marginLeft: showSearchButton ? 4 : "auto" }}
              className="wave-btn"
              aria-label={t.members}
            >
              <Users size={18} />
            </button>
          )}
        </div>

        {showSearch && currentChannelId && (currentChannelType === "text" || currentChannelType === "dm" || currentChannelType === "channel") && (
          <div style={styles.searchBar}>
            <Search size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchMessages}
              style={styles.searchInput}
            />
          </div>
        )}

        {currentChannelType === "voice" && currentChannelId ? (
          <VoiceChannelView
            channelId={currentChannelId}
            channelName={currentChannelName}
            participants={voiceParticipants}
            username={username}
            joined={voiceParticipants.includes(username)}
            onJoin={joinVoice}
            onLeave={leaveVoice}
            t={t}
            userPhotos={userPhotos}
          />
        ) : !currentChannelId ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>{t.pickDialog}</p>
          </div>
        ) : (
          <>
            <div ref={scrollRef} style={styles.messages}>
              {storageError && <p style={{ color: "#F09595", fontSize: 13 }}>{t.saveError}</p>}
              {loading && <p style={{ color: "var(--muted)", fontSize: 14 }}>{t.loadingMessages}</p>}
              {!loading && filteredMessages.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 14 }}>
                  {searchQuery ? t.nothingFound : t.emptyChannel}
                </p>
              )}
              {filteredMessages.map((m, idx) => {
                const isOwn = m.author === username;
                const prev = filteredMessages[idx - 1];
                const grouped = prev && prev.author === m.author && prev.type !== "sticker" && m.type !== "sticker";
                return (
                  <div
                    key={m.id}
                    style={{
                      ...styles.messageRow,
                      flexDirection: isOwn ? "row-reverse" : "row",
                      marginTop: grouped ? 2 : 12,
                    }}
                  >
                    <div style={{ width: 36, flexShrink: 0 }}>
                      {!grouped && (
                        <div style={{ ...styles.avatar, background: colorForName(m.author), width: 36, height: 36, fontSize: 13 }}>
                          <AvatarPhoto src={userPhotos[m.author]} fallback={initials(m.author)} />
                        </div>
                      )}
                    </div>
                    <div style={{ minWidth: 0, maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start" }}>
                      {!grouped && (
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexDirection: isOwn ? "row-reverse" : "row", padding: "0 4px" }}>
                          <span style={{ fontWeight: 700, fontSize: 13.5 }}>{m.author}</span>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>{m.time}</span>
                        </div>
                      )}
                      {m.replyTo && (
                        <div style={{ ...styles.replyQuote, alignSelf: isOwn ? "flex-end" : "flex-start", borderLeft: isOwn ? "none" : styles.replyQuote.borderLeft, borderRight: isOwn ? "2px solid #E0A34D" : "none", paddingLeft: isOwn ? 0 : 6, paddingRight: isOwn ? 6 : 0 }}>
                          <CornerUpLeft size={11} style={{ opacity: 0.6, flexShrink: 0 }} />
                          <span style={{ fontWeight: 700 }}>{m.replyTo.author}</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {m.replyTo.type === "sticker" ? m.replyTo.text : m.replyTo.text}
                          </span>
                        </div>
                      )}
                      {m.type === "sticker" ? (
                        <p style={{ ...styles.stickerMessage, animation: `${stickerAnimFor(m.id)} 0.5s ease` }}>{m.text}</p>
                      ) : m.type === "image" ? (
                        <img src={m.text} alt={t.imageAlt} style={styles.messageImage} />
                      ) : (
                        <div
                          style={{
                            ...styles.bubble,
                            ...(isOwn ? styles.bubbleOwn : styles.bubbleOther),
                            borderTopLeftRadius: !isOwn && !grouped ? 4 : styles.bubble.borderRadius,
                            borderTopRightRadius: isOwn && !grouped ? 4 : styles.bubble.borderRadius,
                          }}
                          className={isOwn && m.id === lastSentId ? "wave-message-sent" : ""}
                        >
                          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.48, wordBreak: "break-word" }}>{m.text}</p>
                        </div>
                      )}
                      <div style={{ ...styles.reactionsRow, justifyContent: isOwn ? "flex-end" : "flex-start" }}>
                        {m.reactions &&
                          Object.entries(m.reactions).map(([emoji, people]) => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(m, emoji)}
                              style={{
                                ...styles.reactionPill,
                                ...(people.includes(username) ? styles.reactionPillActive : {}),
                              }}
                              className="wave-btn wave-reaction-burst"
                            >
                              {emoji} {people.length}
                            </button>
                          ))}
                        <button
                          onClick={() => setReactionPickerFor(reactionPickerFor === m.id ? null : m.id)}
                          style={styles.addReactionBtn}
                          className="wave-btn"
                          aria-label={t.addReaction}
                        >
                          <Smile size={13} />
                        </button>
                        <button
                          onClick={() => setReplyingTo(m)}
                          style={styles.addReactionBtn}
                          className="wave-btn"
                          aria-label={t.reply}
                        >
                          <CornerUpLeft size={13} />
                        </button>
                      </div>
                      {reactionPickerFor === m.id && (
                        <div style={styles.reactionPickerRow}>
                          {REACTIONS.map((emoji) => (
                            <button key={emoji} onClick={() => toggleReaction(m, emoji)} style={styles.reactionPickerEmoji} className="wave-btn">
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {typingUser && (
              <p style={styles.typingIndicator}>
                <span className="wave-typing-dots">●●●</span> {t.typingOne(typingUser)}
              </p>
            )}

            {replyingTo && (
              <div style={styles.replyBar}>
                <CornerUpLeft size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>{t.replyingTo}</span>
                <span style={{ fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{replyingTo.author}:</span>
                <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {replyingTo.type === "sticker" ? replyingTo.text : replyingTo.type === "image" ? t.photoLabel : replyingTo.text}
                </span>
                <button onClick={() => setReplyingTo(null)} style={styles.stickerToggle} className="wave-btn" aria-label={t.cancelReply}>
                  <X size={14} />
                </button>
              </div>
            )}

            {showStickers && (
              <div style={styles.stickerRow}>
                {STICKERS.map((emoji, idx) => (
                  <button key={emoji + idx} onClick={() => sendSticker(emoji)} style={styles.stickerButton} className="wave-btn">
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {activeSection === "dm" && activeDmPartner && !friends.includes(activeDmPartner) ? (
              <div style={styles.composer}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{s.dmLockedTitle}</span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    {dmRequestPending ? s.requestPendingHint : s.dmLockedHint(activeDmPartner)}
                  </span>
                  {!dmRequestPending && (
                    <button
                      onClick={() => handleSendFriendRequest(activeDmPartner)}
                      className="wave-btn"
                      style={{ ...settingsStyles.saveBtn, marginTop: 4 }}
                    >
                      <UserPlus size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
                      {s.sendRequestBtn}
                    </button>
                  )}
                </div>
              </div>
            ) : isBroadcastChannel && !isChannelOwner ? (
              <div style={styles.composer}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    {isChannelSubscribed ? s.readOnlyChannelHint : s.notSubscribedHint}
                  </span>
                  <button
                    onClick={() => handleToggleSubscribe(activeChannelId, !isChannelSubscribed)}
                    className="wave-btn"
                    style={{ ...settingsStyles.saveBtn, marginTop: 4 }}
                  >
                    <Rss size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
                    {isChannelSubscribed ? s.unsubscribe : s.subscribe}
                  </button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSend} style={styles.composer}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePickImage}
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={styles.stickerToggle}
                className="wave-btn"
                aria-label={t.sendPhoto}
                disabled={imageBusy}
              >
                <ImageIcon size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowStickers((v) => !v)}
                style={styles.stickerToggle}
                className="wave-btn"
                aria-label={t.stickers}
              >
                <Smile size={18} />
              </button>
              <input
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                placeholder={
                  imageBusy
                    ? t.sendingPhoto
                    : `${t.writeTo}${currentChannelType === "dm" ? " " + currentChannelName : " #" + currentChannelName}`
                }
                style={styles.composerInput}
              />
              <button
                type="submit"
                style={styles.sendButton}
                className={`wave-btn wave-send-btn wave-ripple-btn${sendPulse ? " wave-send-btn-pressed" : ""}`}
                aria-label={t.send}
              >
                <Send size={16} />
              </button>
            </form>
            )}
          </>
        )}
      </div>

      <div style={styles.toastStack}>
        {toasts.map((toast) => (
          <button key={toast.id} onClick={() => openToastTarget(toast)} style={styles.toastItem} className="wave-btn wave-toast-item">
            <div style={{ ...styles.avatar, background: colorForName(toast.author), width: 26, height: 26, fontSize: 10, flexShrink: 0 }}>
              <AvatarPhoto src={userPhotos[toast.author]} fallback={initials(toast.author)} />
            </div>
            <div style={{ minWidth: 0, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{t.newMessageIn(toast.target.name)}</div>
              <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <strong>{toast.author}:</strong> {toast.text}
              </div>
            </div>
          </button>
        ))}
      </div>

      {showMembers && (
        <>
          <div style={styles.memberOverlay} onClick={() => setShowMembers(false)} />
          <div style={styles.memberDrawer}>
            <div style={styles.memberDrawerHeader}>
              <span style={{ fontWeight: 800 }}>
                {t.members} — {onlineMembers.length}
              </span>
              <button onClick={() => setShowMembers(false)} style={styles.logoutButton} className="wave-btn" aria-label={t.close}>
                <X size={18} />
              </button>
            </div>
            {onlineMembers.map((m) => (
              <div key={m} style={styles.memberRow}>
                <div style={styles.avatarWrap}>
                  <div style={{ ...styles.avatar, background: colorForName(m), width: 32, height: 32, fontSize: 12 }}>
                    <AvatarPhoto src={userPhotos[m]} fallback={initials(m)} />
                  </div>
                  <span style={styles.onlineDot} className="wave-online-pulse" />
                </div>
                <span style={{ fontSize: 14 }}>
                  {m}
                  {m === username ? ` (${t.you})` : ""}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {showGlobalSearch && (
        <>
          <div style={styles.memberOverlay} onClick={() => setShowGlobalSearch(false)} />
          <div style={styles.globalSearchModal}>
            <div style={styles.memberDrawerHeader}>
              <span style={{ fontWeight: 800 }}>
                {t.searchServer} {localizedName(activeServer, lang)}
              </span>
              <button onClick={() => setShowGlobalSearch(false)} style={styles.logoutButton} className="wave-btn" aria-label={t.close}>
                <X size={18} />
              </button>
            </div>
            <div style={{ ...styles.searchBar, borderBottom: "1px solid #23293280", padding: "8px 0" }}>
              <Search size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
              <input
                autoFocus
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder={t.searchMessages}
                style={styles.searchInput}
              />
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {globalLoading && <p style={{ color: "var(--muted)", fontSize: 13, padding: "10px 2px" }}>…</p>}
              {!globalLoading && globalQuery.trim() && globalResults.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 13, padding: "10px 2px" }}>{t.nothingFound}</p>
              )}
              {!globalLoading &&
                globalResults.map((r) => (
                  <button key={r.channelId + "-" + r.id} onClick={() => openGlobalResult(r)} style={styles.globalResultRow} className="wave-btn">
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <Hash size={12} style={{ opacity: 0.6 }} />
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.channelName}</span>
                      <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>{r.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, textAlign: "left" }}>
                      <strong>{r.author}:</strong> {r.text}
                    </p>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}

      <style>{GLOBAL_STYLES}</style>
    </div>
  );
}

// --- Telegram-style full-screen settings panel -----------------------------
const SETTINGS_STRINGS = {
  ru: {
    settings: "Настройки",
    editProfile: "Редактировать профиль",
    editProfileSub: "Имя, фото, статус",
    account: "Аккаунт и привязка",
    accountSub: "Почта, телефон, пароль",
    notifications: "Уведомления",
    notificationsSub: "Звуки и превью сообщений",
    appearance: "Оформление",
    appearanceSub: "Цвет темы приложения",
    language: "Язык",
    privacy: "Приватность",
    privacySub: "Кто видит твой профиль",
    logout: "Выйти из аккаунта",
    logoutConfirm: "Точно выйти из аккаунта на этом устройстве?",
    logoutConfirmYes: "Да, выйти",
    logoutConfirmNo: "Отмена",
    bio: "О себе",
    bioPlaceholder: "Расскажи о себе пару слов…",
    name: "Имя пользователя",
    save: "Сохранить",
    saved: "Сохранено",
    bindEmail: "Привязать почту",
    bindPhone: "Привязать телефон",
    emailPlaceholder: "you@example.com",
    phonePlaceholder: "+7 900 000-00-00",
    notBound: "не привязано",
    sound: "Звук уведомлений",
    preview: "Показывать текст сообщения",
    theme: "Цвет акцента",
    online: "в сети",
    version: "Zapp · демо-версия 1.0",
    changePhoto: "Сменить фото",
    changePhotoHint: "Загрузить фото",
    editPhoto: "Новое фото профиля",
    zoom: "Масштаб",
    dragHint: "Перетащи, чтобы подвинуть",
    themeMode: "Тема оформления",
    themeDark: "Тёмная",
    themeLight: "Светлая",
    findFriends: "Найти друзей",
    findFriendsPlaceholder: "Введи имя пользователя…",
    noMatches: "Никого не нашли",
    startTyping: "Начни вводить имя, чтобы найти людей",
    write: "Написать",
    requestSent: "Заявка отправлена",
    alreadyFriends: "Уже в друзьях",
    notifRequestsTitle: "Заявки в друзья",
    noRequests: "Пока нет новых заявок",
    accept: "Принять",
    decline: "Отклонить",
    dmLockedTitle: "Прежде чем начать переписку",
    dmLockedHint: (name) => `Отправь заявку в друзья, чтобы написать ${name}`,
    sendRequestBtn: "Отправить заявку",
    requestPendingHint: "Заявка отправлена, жди подтверждения",
    newChannel: "Новый канал",
    channelName: "Название канала",
    channelTypeText: "Текстовый",
    channelTypeVoice: "Голосовой",
    channelTypeChannel: "Канал (только чтение)",
    channelTypeGroup: "Группа",
    create: "Создать",
    cancel: "Отмена",
    more: "Ещё",
    archive: "Архивировать",
    unarchive: "Восстановить из архива",
    pin: "Закрепить",
    unpin: "Открепить",
    rename: "Переименовать",
    delete: "Удалить",
    subscribe: "Подписаться",
    unsubscribe: "Отписаться",
    subscribersCount: (n) => `Подписчиков: ${n}`,
    deleteChannelConfirm: "Удалить этот канал? Это действие нельзя отменить.",
    readOnlyChannelHint: "Писать в этот канал может только его автор. Ты подписан(а) и видишь все сообщения.",
    notSubscribedHint: "Это канал только для чтения. Подпишись, чтобы получать новые сообщения в списке.",
    saveRename: "Сохранить",
    renameTitle: "Переименовать канал",
    archivedSection: "Архив",
    noArchived: "В архиве пока пусто",
    editList: "Изменить",
    doneEditing: "Готово",
    deleteDmConfirm: "Удалить переписку? Сообщения удалятся у обоих собеседников. Это действие нельзя отменить.",
    selectedCount: (n) => `Выбрано: ${n}`,
    bulkPin: "Закрепить",
    bulkArchive: "В архив",
    bulkDelete: "Удалить",
    bulkDeleteConfirm: "Удалить выбранное? Это действие нельзя отменить.",
  },
  en: {
    settings: "Settings",
    editProfile: "Edit Profile",
    editProfileSub: "Name, photo, bio",
    account: "Account & Binding",
    accountSub: "Email, phone, password",
    notifications: "Notifications",
    notificationsSub: "Sounds and message previews",
    appearance: "Appearance",
    appearanceSub: "App accent color",
    language: "Language",
    privacy: "Privacy",
    privacySub: "Who can see your profile",
    logout: "Log Out",
    logoutConfirm: "Log out of this account on this device?",
    logoutConfirmYes: "Yes, log out",
    logoutConfirmNo: "Cancel",
    bio: "Bio",
    bioPlaceholder: "Tell people a bit about yourself…",
    name: "Username",
    save: "Save",
    saved: "Saved",
    bindEmail: "Bind email",
    bindPhone: "Bind phone",
    emailPlaceholder: "you@example.com",
    phonePlaceholder: "+1 555 000-0000",
    notBound: "not linked",
    sound: "Notification sound",
    preview: "Show message text",
    theme: "Accent color",
    online: "online",
    version: "Zapp · demo build 1.0",
    changePhoto: "Change photo",
    changePhotoHint: "Upload a photo",
    editPhoto: "New profile photo",
    zoom: "Zoom",
    dragHint: "Drag to reposition",
    themeMode: "Theme",
    themeDark: "Dark",
    themeLight: "Light",
    findFriends: "Find friends",
    findFriendsPlaceholder: "Type a username…",
    noMatches: "No one found",
    startTyping: "Start typing a name to find people",
    write: "Message",
    requestSent: "Request sent",
    alreadyFriends: "Already friends",
    notifRequestsTitle: "Friend requests",
    noRequests: "No new requests yet",
    accept: "Accept",
    decline: "Decline",
    dmLockedTitle: "Before you start chatting",
    dmLockedHint: (name) => `Send a friend request to message ${name}`,
    sendRequestBtn: "Send request",
    requestPendingHint: "Request sent, waiting for a response",
    newChannel: "New channel",
    channelName: "Channel name",
    channelTypeText: "Text",
    channelTypeVoice: "Voice",
    channelTypeChannel: "Channel (read-only)",
    channelTypeGroup: "Group",
    create: "Create",
    cancel: "Cancel",
    more: "More",
    archive: "Archive",
    unarchive: "Unarchive",
    pin: "Pin",
    unpin: "Unpin",
    rename: "Rename",
    delete: "Delete",
    subscribe: "Subscribe",
    unsubscribe: "Unsubscribe",
    subscribersCount: (n) => `${n} subscribers`,
    deleteChannelConfirm: "Delete this channel? This can't be undone.",
    readOnlyChannelHint: "Only the channel's creator can post here. You're subscribed and see every message.",
    notSubscribedHint: "This is a read-only channel. Subscribe to get new messages in your list.",
    saveRename: "Save",
    renameTitle: "Rename channel",
    archivedSection: "Archived",
    noArchived: "Nothing archived yet",
    editList: "Edit",
    doneEditing: "Done",
    deleteDmConfirm: "Delete this conversation? Messages will be removed for both sides. This can't be undone.",
    selectedCount: (n) => `${n} selected`,
    bulkPin: "Pin",
    bulkArchive: "Archive",
    bulkDelete: "Delete",
    bulkDeleteConfirm: "Delete the selected chats? This can't be undone.",
  },
};

const ACCENT_OPTIONS = ["#F2A93B", "#2DD4BF", "#FB7159", "#5B8DEF", "#E8608F", "#34D399", "#A78BFA", "#F472B6"];

function SettingsRow({ icon, iconBg, title, subtitle, onClick, danger, right }) {
  return (
    <button onClick={onClick} className="wave-btn wave-settings-row" style={settingsStyles.row}>
      <span style={{ ...settingsStyles.rowIcon, background: iconBg || "var(--accent)" }}>{icon}</span>
      <span style={settingsStyles.rowText}>
        <span style={{ color: danger ? "#E5534B" : "var(--text)", fontSize: 15, fontWeight: 500 }}>{title}</span>
        {subtitle && <span style={settingsStyles.rowSub}>{subtitle}</span>}
      </span>
      {right !== undefined ? right : !danger && <ChevronRight size={17} style={{ opacity: 0.35, flexShrink: 0 }} />}
    </button>
  );
}

function SettingsToggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="wave-btn"
      style={{ ...settingsStyles.toggle, background: checked ? "var(--accent)" : "#3A4150" }}
      aria-pressed={checked}
    >
      <span style={{ ...settingsStyles.toggleDot, transform: checked ? "translateX(16px)" : "translateX(0)" }} />
    </button>
  );
}

function SettingsHeader({ title, onBack }) {
  return (
    <div style={settingsStyles.header}>
      <button onClick={onBack} className="wave-btn" style={settingsStyles.headerBack} aria-label="Back">
        <ChevronLeft size={22} />
      </button>
      <span style={settingsStyles.headerTitle}>{title}</span>
    </div>
  );
}

// Renders a photo avatar as a real <img>, falling back to whatever is passed
// as `fallback` (usually initials on a colored circle) if the image URL is
// missing, corrupted, or fails to decode. This replaces the old CSS
// background-image approach, which silently showed a black circle instead of
// falling back when a stored photo failed to load.
function AvatarPhoto({ src, fallback }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [src]);
  if (!src || broken) return fallback;
  return (
    <img
      src={src}
      alt=""
      onError={() => setBroken(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit", display: "block" }}
    />
  );
}

function SettingsPanel({ username, lang, t, storage, onToggleLang, onClose, onLogout, theme, onThemeChange, photo, onPhotoChange }) {
  const s = SETTINGS_STRINGS[lang] || SETTINGS_STRINGS.ru;
  const [page, setPage] = useState("main");
  const [anim, setAnim] = useState("wave-settings-in");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accent, setAccent] = useState("#3EA6FF");
  const [soundOn, setSoundOn] = useState(true);
  const [previewOn, setPreviewOn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [editingPhotoSrc, setEditingPhotoSrc] = useState(null);
  const [localPhoto, setLocalPhoto] = useState(photo || null);
  const [localTheme, setLocalTheme] = useState(theme || "dark");
  const photoInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const acc = await storage.get(`account:${username}`, true).catch(() => null);
        if (!cancelled && acc && acc.value) {
          const data = JSON.parse(acc.value);
          setBio(data.bio || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setAccent(data.accent || "#3EA6FF");
          if (data.photo) setLocalPhoto(data.photo);
          if (data.theme) setLocalTheme(data.theme);
        }
        const prefs = await storage.get(`notif-prefs:${username}`, false).catch(() => null);
        if (!cancelled && prefs && prefs.value) {
          const data = JSON.parse(prefs.value);
          setSoundOn(data.soundOn !== false);
          setPreviewOn(data.previewOn !== false);
        }
      } catch (err) {
        // no saved settings yet, defaults are fine
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username, storage]);

  function goTo(next) {
    setAnim("wave-settings-forward");
    setPage(next);
  }
  function goBack() {
    if (page === "main") {
      onClose();
      return;
    }
    setAnim("wave-settings-back");
    setPage("main");
  }

  async function persistAccount(next) {
    setSaving(true);
    try {
      const full = { bio, email, phone, accent, photo: localPhoto, theme: localTheme, ...next };
      const result = await storage.set(`account:${username}`, JSON.stringify(full), true);
      if (result) {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1600);
      }
    } catch (err) {
      // ignore, keep local state so the field doesn't visually revert
    } finally {
      setSaving(false);
    }
  }

  async function persistPrefs(next) {
    try {
      await storage.set(`notif-prefs:${username}`, JSON.stringify(next), false);
    } catch (err) {
      // per-device preference, safe to ignore failures silently
    }
  }

  const initialsText = initials(username);

  return (
    <div style={settingsStyles.overlay} className="wave-settings-overlay">
      <div key={page} style={settingsStyles.page} className={`wave-settings-page ${anim}`}>
        {page === "main" && (
          <>
            <SettingsHeader title={s.settings} onBack={goBack} />
            <div style={settingsStyles.scroll}>
              <div style={settingsStyles.profileCard}>
                <div style={settingsStyles.bigAvatarWrap}>
                  <div style={{ ...settingsStyles.bigAvatar, background: accent }}>
                    <AvatarPhoto src={localPhoto} fallback={initialsText} />
                  </div>
                  <span style={settingsStyles.bigAvatarDot} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{username}</div>
                <div style={{ fontSize: 13, color: "var(--online)" }}>{s.online}</div>
              </div>

              <div style={settingsStyles.group}>
                <SettingsRow icon={<Pencil size={16} />} iconBg="#5B8DEF" title={s.editProfile} subtitle={s.editProfileSub} onClick={() => goTo("profile")} />
                <SettingsRow icon={<Shield size={16} />} iconBg="#34D399" title={s.account} subtitle={s.accountSub} onClick={() => goTo("account")} />
              </div>

              <div style={settingsStyles.group}>
                <SettingsRow icon={<Bell size={16} />} iconBg="#3EA6FF" title={s.notifications} subtitle={s.notificationsSub} onClick={() => goTo("notifications")} />
                <SettingsRow icon={<Palette size={16} />} iconBg="#E8608F" title={s.appearance} subtitle={s.appearanceSub} onClick={() => goTo("appearance")} />
                <SettingsRow
                  icon={<Globe size={16} />}
                  iconBg="#8B94A3"
                  title={s.language}
                  subtitle={lang === "ru" ? "Русский" : "English"}
                  onClick={onToggleLang}
                />
              </div>

              <div style={settingsStyles.group}>
                {!confirmingLogout ? (
                  <SettingsRow icon={<LogOut size={16} />} iconBg="#E5534B" title={s.logout} danger onClick={() => setConfirmingLogout(true)} />
                ) : (
                  <div style={settingsStyles.confirmBox}>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>{s.logoutConfirm}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={onLogout} className="wave-btn" style={settingsStyles.dangerBtn}>{s.logoutConfirmYes}</button>
                      <button onClick={() => setConfirmingLogout(false)} className="wave-btn" style={settingsStyles.cancelBtn}>{s.logoutConfirmNo}</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={settingsStyles.version}>{s.version}</div>
            </div>
          </>
        )}

        {page === "profile" && (
          <>
            <SettingsHeader title={s.editProfile} onBack={goBack} />
            <div style={settingsStyles.scroll}>
              <div style={settingsStyles.profileCard}>
                <div style={settingsStyles.bigAvatarWrap}>
                  <div style={{ ...settingsStyles.bigAvatar, background: accent }}>
                    <AvatarPhoto src={localPhoto} fallback={initialsText} />
                  </div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files && e.target.files[0];
                      e.target.value = "";
                      if (!file) return;
                      try {
                        const dataUrl = await readFileAsDataUrl(file);
                        setEditingPhotoSrc(dataUrl);
                      } catch (err) {
                        // couldn't read the file, nothing to do
                      }
                    }}
                  />
                  <button
                    className="wave-btn"
                    style={settingsStyles.cameraBtn}
                    aria-label={s.changePhoto}
                    onClick={() => photoInputRef.current && photoInputRef.current.click()}
                  >
                    <Camera size={14} />
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.changePhotoHint}</div>
              </div>
              <div style={settingsStyles.field}>
                <label style={settingsStyles.label}>{s.name}</label>
                <input value={username} disabled style={{ ...settingsStyles.input, opacity: 0.6 }} />
              </div>
              <div style={settingsStyles.field}>
                <label style={settingsStyles.label}>{s.bio}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={s.bioPlaceholder}
                  rows={3}
                  style={{ ...settingsStyles.input, resize: "none", fontFamily: "inherit" }}
                />
              </div>
              <button
                className="wave-btn"
                style={settingsStyles.saveBtn}
                onClick={() => persistAccount({ bio, email, phone, accent })}
              >
                {saving ? "…" : justSaved ? <Check size={16} /> : s.save}
              </button>
            </div>
          </>
        )}

        {page === "account" && (
          <>
            <SettingsHeader title={s.account} onBack={goBack} />
            <div style={settingsStyles.scroll}>
              <div style={settingsStyles.field}>
                <label style={settingsStyles.label}>
                  <Mail size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
                  {s.bindEmail}
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={s.emailPlaceholder}
                  style={settingsStyles.input}
                />
              </div>
              <div style={settingsStyles.field}>
                <label style={settingsStyles.label}>
                  <Phone size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
                  {s.bindPhone}
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={s.phonePlaceholder}
                  style={settingsStyles.input}
                />
              </div>
              <button
                className="wave-btn"
                style={settingsStyles.saveBtn}
                onClick={() => persistAccount({ bio, email, phone, accent })}
              >
                {saving ? "…" : justSaved ? <Check size={16} /> : s.save}
              </button>
            </div>
          </>
        )}

        {page === "notifications" && (
          <>
            <SettingsHeader title={s.notifications} onBack={goBack} />
            <div style={settingsStyles.scroll}>
              <div style={settingsStyles.group}>
                <SettingsRow
                  icon={soundOn ? <Bell size={16} /> : <BellOff size={16} />}
                  iconBg="#3EA6FF"
                  title={s.sound}
                  onClick={() => {}}
                  right={
                    <SettingsToggle
                      checked={soundOn}
                      onChange={(v) => {
                        setSoundOn(v);
                        persistPrefs({ soundOn: v, previewOn });
                      }}
                    />
                  }
                />
                <SettingsRow
                  icon={<MessageCircle size={16} />}
                  iconBg="#5B8DEF"
                  title={s.preview}
                  onClick={() => {}}
                  right={
                    <SettingsToggle
                      checked={previewOn}
                      onChange={(v) => {
                        setPreviewOn(v);
                        persistPrefs({ soundOn, previewOn: v });
                      }}
                    />
                  }
                />
              </div>
            </div>
          </>
        )}

        {page === "appearance" && (
          <>
            <SettingsHeader title={s.appearance} onBack={goBack} />
            <div style={settingsStyles.scroll}>
              <div style={{ fontSize: 13, color: "var(--muted)", padding: "4px 4px 12px" }}>{s.themeMode}</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
                <button
                  className="wave-btn"
                  onClick={() => {
                    setLocalTheme("dark");
                    onThemeChange && onThemeChange("dark");
                    persistAccount({ bio, email, phone, accent, theme: "dark" });
                  }}
                  style={{ ...settingsStyles.themeBtn, ...(localTheme === "dark" ? settingsStyles.themeBtnActive : {}) }}
                >
                  <Moon size={16} /> {s.themeDark}
                </button>
                <button
                  className="wave-btn"
                  onClick={() => {
                    setLocalTheme("light");
                    onThemeChange && onThemeChange("light");
                    persistAccount({ bio, email, phone, accent, theme: "light" });
                  }}
                  style={{ ...settingsStyles.themeBtn, ...(localTheme === "light" ? settingsStyles.themeBtnActive : {}) }}
                >
                  <Sun size={16} /> {s.themeLight}
                </button>
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", padding: "4px 4px 12px" }}>{s.theme}</div>
              <div style={settingsStyles.swatchGrid}>
                {ACCENT_OPTIONS.map((c) => (
                  <button
                    key={c}
                    className="wave-btn"
                    onClick={() => {
                      setAccent(c);
                      persistAccount({ bio, email, phone, accent: c });
                    }}
                    style={{ ...settingsStyles.swatch, background: c }}
                    aria-label={c}
                  >
                    {accent === c && <Check size={18} color="#1A1A1A" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {editingPhotoSrc && (
        <PhotoEditorModal
          imageSrc={editingPhotoSrc}
          lang={lang}
          onCancel={() => setEditingPhotoSrc(null)}
          onSave={(dataUrl) => {
            setLocalPhoto(dataUrl);
            onPhotoChange && onPhotoChange(dataUrl);
            persistAccount({ bio, email, phone, accent, photo: dataUrl });
            setEditingPhotoSrc(null);
          }}
        />
      )}
    </div>
  );
}

const settingsStyles = {
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 50,
    background: "var(--bg)",
    display: "flex",
    overflow: "hidden",
  },
  page: { width: "100%", height: "100%", display: "flex", flexDirection: "column" },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "12px 8px",
    borderBottom: "1px solid #23293280",
    flexShrink: 0,
  },
  headerBack: { background: "transparent", border: "none", color: "var(--text)", cursor: "pointer", display: "flex", padding: 6 },
  headerTitle: { fontSize: 16, fontWeight: 700 },
  scroll: { flex: 1, overflowY: "auto", padding: "12px 16px 24px" },
  profileCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "16px 0 22px" },
  bigAvatarWrap: { position: "relative" },
  bigAvatar: {
    width: 76,
    height: 76,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    fontWeight: 800,
    color: "#1A1A1A",
    overflow: "hidden",
  },
  bigAvatarDot: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "var(--online)",
    border: "3px solid var(--bg)",
  },
  cameraBtn: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "var(--accent)",
    color: "#1A1A1A",
    border: "3px solid var(--bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  group: {
    background: "var(--panel)",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  row: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #23293280",
    cursor: "pointer",
    textAlign: "left",
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1A1A1A",
    overflow: "hidden",
  },
  rowText: { display: "flex", flexDirection: "column", flex: 1, minWidth: 0, gap: 1 },
  rowSub: { fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  toggle: {
    width: 38,
    height: 22,
    borderRadius: 20,
    border: "none",
    padding: 2,
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.18s ease",
  },
  toggleDot: {
    display: "block",
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#fff",
    transition: "transform 0.18s ease",
  },
  confirmBox: { padding: 14 },
  dangerBtn: { flex: 1, background: "#E5534B", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 700, cursor: "pointer" },
  cancelBtn: { flex: 1, background: "var(--elevated)", color: "var(--text)", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 600, cursor: "pointer" },
  version: { textAlign: "center", fontSize: 12, color: "var(--muted)", padding: "8px 0 4px" },
  field: { marginBottom: 16 },
  label: { display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 },
  input: {
    width: "100%",
    background: "var(--panel)",
    border: "1px solid #23293280",
    borderRadius: 10,
    padding: "10px 12px",
    color: "var(--text)",
    fontSize: 14,
    boxSizing: "border-box",
  },
  saveBtn: {
    width: "100%",
    background: "var(--accent)",
    color: "#1A1A1A",
    border: "none",
    borderRadius: 10,
    padding: "11px 0",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  swatch: {
    aspectRatio: "1",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  themeBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 0",
    borderRadius: 12,
    border: "1px solid #23293280",
    background: "var(--panel)",
    color: "var(--muted)",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  themeBtnActive: {
    background: "var(--accent)",
    color: "#1A1A1A",
    borderColor: "var(--accent)",
  },
};

// --- Full-screen circular photo editor (drag to pan, slider to zoom) -------
function PhotoEditorModal({ imageSrc, lang, onCancel, onSave }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const SIZE = 260;

  const L =
    lang === "ru"
      ? { title: "Новое фото профиля", cancel: "Отмена", save: "Сохранить", hint: "Перетащи, чтобы подвинуть" }
      : { title: "New profile photo", cancel: "Cancel", save: "Save", hint: "Drag to reposition" };

  function draw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    canvas.width = SIZE;
    canvas.height = SIZE;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    const scale = Math.max(SIZE / img.width, SIZE / img.height) * zoom;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (SIZE - w) / 2 + offset.x;
    const y = (SIZE - h) / 2 + offset.y;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      draw();
    };
    img.src = imageSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, offset]);

  function pointFrom(e) {
    return e.touches && e.touches[0] ? e.touches[0] : e;
  }
  function startDrag(e) {
    const p = pointFrom(e);
    dragRef.current = { x: p.clientX, y: p.clientY, ox: offset.x, oy: offset.y };
  }
  function onDrag(e) {
    if (!dragRef.current) return;
    const p = pointFrom(e);
    const dx = p.clientX - dragRef.current.x;
    const dy = p.clientY - dragRef.current.y;
    setOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
  }
  function endDrag() {
    dragRef.current = null;
  }

  return (
    <div style={photoEditorStyles.overlay}>
      <div style={photoEditorStyles.header}>
        <button onClick={onCancel} className="wave-btn" style={photoEditorStyles.headerBtn}>
          {L.cancel}
        </button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{L.title}</span>
        <button
          onClick={() => onSave(canvasRef.current.toDataURL("image/jpeg", 0.9))}
          className="wave-btn"
          style={{ ...photoEditorStyles.headerBtn, color: "var(--accent)", fontWeight: 700 }}
        >
          {L.save}
        </button>
      </div>
      <div style={photoEditorStyles.canvasWrap}>
        <canvas
          ref={canvasRef}
          style={photoEditorStyles.canvas}
          onMouseDown={startDrag}
          onMouseMove={onDrag}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={startDrag}
          onTouchMove={onDrag}
          onTouchEnd={endDrag}
        />
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 14 }}>{L.hint}</p>
      </div>
      <div style={photoEditorStyles.zoomRow}>
        <ZoomOut size={16} style={{ opacity: 0.6, flexShrink: 0 }} />
        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <ZoomIn size={16} style={{ opacity: 0.6, flexShrink: 0 }} />
      </div>
    </div>
  );
}

const photoEditorStyles = {
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 80,
    background: "var(--bg)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderBottom: "1px solid #23293280",
    flexShrink: 0,
  },
  headerBtn: { background: "transparent", border: "none", color: "var(--text)", cursor: "pointer", fontSize: 14 },
  canvasWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  canvas: {
    borderRadius: "50%",
    background: "var(--panel)",
    touchAction: "none",
    cursor: "grab",
    boxShadow: "0 0 0 3px var(--accent)",
  },
  zoomRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 24px 28px",
    flexShrink: 0,
  },
};

// --- Notifications: incoming friend requests --------------------------------
function NotificationsPanel({ s, requests, onAccept, onDecline, onClose }) {
  return (
    <div style={settingsStyles.overlay} className="wave-settings-overlay">
      <div style={settingsStyles.page}>
        <SettingsHeader title={s.notifRequestsTitle} onBack={onClose} />
        <div style={settingsStyles.scroll}>
          {requests.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--muted)", padding: "12px 4px" }}>{s.noRequests}</p>
          )}
          {requests.length > 0 && (
            <div style={settingsStyles.group}>
              {requests.map((r) => (
                <div key={r.from} style={{ ...settingsStyles.row, cursor: "default" }}>
                  <div style={{ ...settingsStyles.rowIcon, background: colorForName(r.from) }}>{initials(r.from)}</div>
                  <span style={settingsStyles.rowText}>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{r.from}</span>
                  </span>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => onAccept(r.from)} className="wave-btn" style={iconOkBtn} aria-label={s.accept}>
                      <UserCheck size={16} />
                    </button>
                    <button onClick={() => onDecline(r.from)} className="wave-btn" style={iconNoBtn} aria-label={s.decline}>
                      <UserX size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const iconOkBtn = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: "none",
  background: "#34D399",
  color: "#0B2B1E",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
const iconNoBtn = { ...iconOkBtn, background: "#E5534B", color: "#fff" };

// --- Find friends: instant search, write directly ---------------------------
function FindFriendsModal({ s, username, directory, friends, onWrite, onSendRequest, onClose, userPhotos }) {
  const [query, setQuery] = useState("");
  const [sentTo, setSentTo] = useState([]);

  const results = query.trim()
    ? directory.filter((u) => u.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  async function handleAction(name) {
    if (friends.includes(name)) {
      onWrite(name);
      return;
    }
    const ok = await onSendRequest(name);
    if (ok) setSentTo((prev) => [...prev, name]);
    onWrite(name);
  }

  return (
    <div style={settingsStyles.overlay} className="wave-settings-overlay">
      <div style={settingsStyles.page}>
        <SettingsHeader title={s.findFriends} onBack={onClose} />
        <div style={{ padding: "10px 16px" }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={s.findFriendsPlaceholder}
            style={settingsStyles.input}
          />
        </div>
        <div style={settingsStyles.scroll}>
          {!query.trim() && <p style={{ fontSize: 13, color: "var(--muted)", padding: "4px" }}>{s.startTyping}</p>}
          {query.trim() && results.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--muted)", padding: "4px" }}>{s.noMatches}</p>
          )}
          {results.length > 0 && (
            <div style={settingsStyles.group}>
              {results.map((u) => {
                const isFriend = friends.includes(u);
                const pending = sentTo.includes(u);
                return (
                  <div key={u} style={{ ...settingsStyles.row, cursor: "default" }}>
                    <div style={{ ...settingsStyles.rowIcon, background: colorForName(u) }}>
                      <AvatarPhoto src={userPhotos && userPhotos[u]} fallback={initials(u)} />
                    </div>
                    <span style={settingsStyles.rowText}>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>{u}</span>
                      {isFriend && <span style={settingsStyles.rowSub}>{s.alreadyFriends}</span>}
                      {!isFriend && pending && <span style={settingsStyles.rowSub}>{s.requestSent}</span>}
                    </span>
                    <button
                      onClick={() => handleAction(u)}
                      className="wave-btn"
                      style={{
                        ...settingsStyles.themeBtn,
                        flex: "none",
                        padding: "6px 12px",
                        fontSize: 12,
                        ...(isFriend ? settingsStyles.themeBtnActive : {}),
                      }}
                    >
                      {isFriend ? <MessageCircle size={14} /> : <UserPlus size={14} />}
                      {isFriend ? s.write : pending ? s.requestSent : s.write}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Create a new channel inside the current server -------------------------
function ChatItemMenu({
  s,
  showRename,
  showDelete,
  showSubscribe,
  isSubscribed,
  isArchived,
  isPinned,
  onArchive,
  onPin,
  onRename,
  onDelete,
  onSubscribeToggle,
  onClose,
}) {
  return (
    <div style={styles.chatItemMenu} className="wave-chat-item-menu" onClick={(e) => e.stopPropagation()}>
      {showSubscribe && (
        <button
          onClick={() => {
            onSubscribeToggle();
            onClose();
          }}
          className="wave-btn"
          style={styles.chatItemMenuBtn}
        >
          <Rss size={14} /> {isSubscribed ? s.unsubscribe : s.subscribe}
        </button>
      )}
      <button onClick={onPin} className="wave-btn" style={styles.chatItemMenuBtn}>
        {isPinned ? <PinOff size={14} /> : <Pin size={14} />} {isPinned ? s.unpin : s.pin}
      </button>
      {showRename && (
        <button
          onClick={() => {
            onRename();
            onClose();
          }}
          className="wave-btn"
          style={styles.chatItemMenuBtn}
        >
          <Pencil size={14} /> {s.rename}
        </button>
      )}
      <button onClick={onArchive} className="wave-btn" style={styles.chatItemMenuBtn}>
        {isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />} {isArchived ? s.unarchive : s.archive}
      </button>
      {showDelete && (
        <button onClick={onDelete} className="wave-btn" style={{ ...styles.chatItemMenuBtn, color: "#F09595" }}>
          <Trash2 size={14} /> {s.delete}
        </button>
      )}
    </div>
  );
}

function CreateChannelModal({ s, onCancel, onCreate }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");

  return (
    <div style={settingsStyles.overlay} className="wave-settings-overlay">
      <div style={settingsStyles.page}>
        <SettingsHeader title={s.newChannel} onBack={onCancel} />
        <div style={settingsStyles.scroll}>
          <div style={settingsStyles.field}>
            <label style={settingsStyles.label}>{s.channelName}</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={s.channelName}
              style={settingsStyles.input}
            />
          </div>
          <div style={{ display: "flex", gap: 8, margin: "4px 0 8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setType("text")}
              className="wave-btn"
              style={{ ...settingsStyles.themeBtn, ...(type === "text" ? settingsStyles.themeBtnActive : {}) }}
            >
              <Hash size={14} /> {s.channelTypeGroup}
            </button>
            <button
              onClick={() => setType("voice")}
              className="wave-btn"
              style={{ ...settingsStyles.themeBtn, ...(type === "voice" ? settingsStyles.themeBtnActive : {}) }}
            >
              <Volume2 size={14} /> {s.channelTypeVoice}
            </button>
            <button
              onClick={() => setType("channel")}
              className="wave-btn"
              style={{ ...settingsStyles.themeBtn, ...(type === "channel" ? settingsStyles.themeBtnActive : {}) }}
            >
              <Rss size={14} /> {s.channelTypeChannel}
            </button>
          </div>
          {type === "channel" && <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>{s.readOnlyChannelHint}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: type === "channel" ? 0 : 16 }}>
            <button onClick={onCancel} className="wave-btn" style={settingsStyles.cancelBtn}>
              {s.cancel}
            </button>
            <button
              onClick={() => name.trim() && onCreate(name.trim(), type)}
              className="wave-btn"
              style={settingsStyles.saveBtn}
            >
              {s.create}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RenameChannelModal({ s, channel, onCancel, onSave }) {
  const [name, setName] = useState(channel.name);
  return (
    <div style={settingsStyles.overlay} className="wave-settings-overlay">
      <div style={settingsStyles.page}>
        <SettingsHeader title={s.renameTitle} onBack={onCancel} />
        <div style={settingsStyles.scroll}>
          <div style={settingsStyles.field}>
            <label style={settingsStyles.label}>{s.channelName}</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={s.channelName}
              style={settingsStyles.input}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCancel} className="wave-btn" style={settingsStyles.cancelBtn}>
              {s.cancel}
            </button>
            <button
              onClick={() => name.trim() && onSave(channel.id, name.trim())}
              className="wave-btn"
              style={settingsStyles.saveBtn}
            >
              {s.saveRename}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const LIGHT_THEME_VARS = {
  "--bg": "#EEF3FB",
  "--panel": "#FFFFFF",
  "--elevated": "#E7EEF9",
  "--text": "#101A2E",
  "--muted": "#64748B",
  "--accent": "#2E96EF",
  "--accent2": "#6C5CE7",
};

const GLOBAL_STYLES = `
html, body, #root {
  margin: 0 !important;
  padding: 0 !important;
  height: 100% !important;
  width: 100% !important;
  overflow: hidden !important;
  overscroll-behavior: none !important;
}
body {
  position: fixed !important;
  inset: 0 !important;
}
.wave-app-fullscreen {
  height: 100vh !important;
  height: 100dvh !important;
  height: var(--app-real-height, 100dvh) !important;
  width: 100vw !important;
  width: 100dvw !important;
}
@keyframes wave-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes wave-bubble-in {
  0% { opacity: 0; transform: translateY(10px) scale(0.94); }
  60% { opacity: 1; transform: translateY(-1px) scale(1.01); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.wave-btn:active { transform: scale(0.92); }
.wave-send-btn:active { transform: scale(0.88) rotate(-6deg); }
@keyframes wave-message-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

@keyframes wave-sticker-pop { 0% { transform: scale(0.3) rotate(-8deg); opacity: 0; } 60% { transform: scale(1.18) rotate(4deg); opacity: 1; } 100% { transform: scale(1) rotate(0); } }
@keyframes wave-sticker-bounce { 0% { transform: scale(0.4) translateY(14px); opacity: 0; } 55% { transform: scale(1.15) translateY(-8px); opacity: 1; } 75% { transform: scale(0.95) translateY(3px); } 100% { transform: scale(1) translateY(0); } }
@keyframes wave-sticker-spin { 0% { transform: scale(0.3) rotate(0deg); opacity: 0; } 60% { transform: scale(1.15) rotate(300deg); opacity: 1; } 100% { transform: scale(1) rotate(360deg); } }
@keyframes wave-sticker-wobble { 0% { transform: scale(0.5) rotate(0deg); opacity: 0; } 30% { transform: scale(1.05) rotate(-14deg); opacity: 1; } 55% { transform: rotate(11deg); } 75% { transform: rotate(-6deg); } 100% { transform: scale(1) rotate(0); } }
@keyframes wave-panel-slide { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
@keyframes wave-modal-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes wave-typing-blink { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } }
@keyframes wave-toast-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@keyframes wave-settings-slide-in { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
@keyframes wave-settings-slide-forward { from { opacity: 0; transform: translateX(36px); } to { opacity: 1; transform: none; } }
@keyframes wave-settings-slide-back { from { opacity: 0; transform: translateX(-36px); } to { opacity: 1; transform: none; } }

/* --- New animation set --------------------------------------------------- */
@keyframes wave-send-fly {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  35% { opacity: 1; transform: translateY(-10px) scale(1.04) rotate(2deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
}
@keyframes wave-send-btn-pop {
  0% { transform: scale(1); }
  40% { transform: scale(0.82) rotate(-10deg); }
  70% { transform: scale(1.12) rotate(4deg); }
  100% { transform: scale(1) rotate(0); }
}
@keyframes wave-toast-bounce-in {
  0% { opacity: 0; transform: translateY(-24px) scale(0.9); }
  60% { opacity: 1; transform: translateY(4px) scale(1.02); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes wave-badge-pop {
  0% { transform: scale(0.4); opacity: 0; }
  55% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); }
}
@keyframes wave-reaction-burst {
  0% { transform: scale(0.2); opacity: 0; }
  50% { transform: scale(1.35); opacity: 1; }
  75% { transform: scale(0.9); }
  100% { transform: scale(1); }
}
@keyframes wave-pin-pop {
  0% { transform: scale(0) rotate(-25deg); opacity: 0; }
  60% { transform: scale(1.25) rotate(8deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); }
}
@keyframes wave-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(3px); }
}
@keyframes wave-checkmark-in {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  70% { transform: scale(1.2) rotate(6deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); }
}
@keyframes wave-ripple {
  0% { transform: scale(0); opacity: 0.35; }
  100% { transform: scale(2.4); opacity: 0; }
}
@keyframes wave-online-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.55); }
  50% { box-shadow: 0 0 0 5px rgba(52, 211, 153, 0); }
}
@keyframes wave-fade-scale-in {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
.wave-message-sent { animation: wave-send-fly 0.32s cubic-bezier(0.22, 1, 0.36, 1); }
.wave-send-btn-pressed { animation: wave-send-btn-pop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1); }
.wave-toast-item { animation: wave-toast-bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.wave-badge-pop { animation: wave-badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.wave-reaction-burst { display: inline-flex; animation: wave-reaction-burst 0.32s cubic-bezier(0.34, 1.56, 0.64, 1); }
.wave-pin-pop { animation: wave-pin-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.wave-shake { animation: wave-shake 0.4s ease; }
.wave-checkmark-in { animation: wave-checkmark-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.wave-online-pulse { animation: wave-online-pulse 2s ease infinite; }
.wave-fade-scale-in { animation: wave-fade-scale-in 0.18s ease; }
.wave-ripple-btn { position: relative; overflow: hidden; }
.wave-ripple-btn::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  transform: scale(0);
}
.wave-ripple-btn:active::after { animation: wave-ripple 0.5s ease-out; }
.wave-btn { transition: transform 0.12s ease; }
.wave-btn:active { transform: scale(0.93); }
.wave-typing-dots { display: inline-block; letter-spacing: 2px; animation: wave-typing-blink 1.2s ease infinite; }
.wave-settings-overlay { animation: wave-settings-slide-in 0.24s cubic-bezier(0.22, 1, 0.36, 1); }
.wave-settings-page { animation-duration: 0.22s; animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }
.wave-settings-forward { animation-name: wave-settings-slide-forward; }
.wave-settings-back { animation-name: wave-settings-slide-back; }
.wave-settings-row:hover { background: var(--elevated); }
.wave-settings-row:last-child { border-bottom: none !important; }
@media (min-width: 768px) {
  .wave-channel-panel, .wave-chat-panel { display: flex !important; }
  .wave-channel-panel { width: 360px !important; border-right: 1px solid #23293280; }
  .wave-chat-panel { flex: 1 !important; }
  .wave-back-button { display: none !important; }
}
`;

const styles = {
  app: {
    "--bg": "#0A101E",
    "--panel": "#111A2E",
    "--elevated": "#182238",
    "--accent": "#3EA6FF",
    "--accent2": "#7C6FF2",
    "--text": "#EAF1FF",
    "--muted": "#8496B8",
    "--online": "#34D399",
    fontFamily: "system-ui, sans-serif",
    color: "var(--text)",
    background: "var(--bg)",
    display: "flex",
    height: "100vh",
    width: "100vw",
    borderRadius: 0,
    overflow: "hidden",
    border: "none",
    position: "fixed",
    inset: 0,
    margin: 0,
  },
  folderTabsBar: {
    display: "flex",
    gap: 6,
    padding: "12px 12px 8px",
    overflowX: "auto",
    flexShrink: 0,
    borderBottom: "1px solid #23293280",
  },
  folderTab: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: "7px 13px",
    borderRadius: 20,
    background: "var(--elevated)",
    color: "var(--muted)",
    border: "none",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
    position: "relative",
    whiteSpace: "nowrap",
  },
  folderTabActive: {
    background: "linear-gradient(135deg, var(--accent), var(--accent2))",
    color: "#0B1220",
  },
  folderTabDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#FF5C72",
    border: "2px solid var(--panel)",
  },
  headerBtnDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#FF5C72",
    border: "2px solid var(--panel)",
  },
  unreadBadge: {
    background: "linear-gradient(135deg, var(--accent), var(--accent2))",
    color: "#0B1220",
    fontSize: 10,
    fontWeight: 800,
    borderRadius: 20,
    padding: "1px 6px",
    flexShrink: 0,
  },
  channelPanel: {
    width: "100%",
    flexDirection: "column",
    background: "var(--panel)",
    flexShrink: 0,
    minWidth: 0,
    animation: "wave-panel-slide 0.22s ease",
    position: "relative",
  },
  channelPanelHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "16px 16px",
    borderBottom: "1px solid #23293280",
    fontSize: 15,
  },
  headerSearchBtn: {
    marginLeft: "auto",
    background: "var(--elevated)",
    border: "1px solid #2A313C",
    borderRadius: 12,
    width: 34,
    height: 34,
    color: "var(--muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "transform 0.12s ease, color 0.12s ease",
  },
  channelList: {
    flex: 1,
    overflowY: "auto",
    padding: "10px 8px",
  },
  channelGroupLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    padding: "6px 8px",
  },
  channelItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "9px 10px",
    borderRadius: 12,
    background: "transparent",
    border: "1px solid transparent",
    color: "var(--muted)",
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
    marginBottom: 2,
    transition: "transform 0.12s ease, border-color 0.12s ease, background 0.12s ease",
  },
  channelItemActive: {
    background: "rgba(62,166,255,0.14)",
    border: "1px solid transparent",
    borderLeft: "3px solid var(--accent)",
    paddingLeft: 7,
    color: "var(--text)",
  },
  channelItemAvatar: {
    width: 46,
    height: 46,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 800,
    color: "#1A1A1A",
    flexShrink: 0,
    position: "relative",
    overflow: "hidden",
  },
  channelItemVoiceBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 17,
    height: 17,
    borderRadius: "50%",
    background: "var(--panel)",
    border: "2px solid var(--panel)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--accent)",
  },
  channelItemBody: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  channelItemTitleRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
  },
  channelItemName: {
    fontWeight: 700,
    fontSize: 14.5,
    color: "var(--text)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    minWidth: 0,
  },
  channelItemTime: {
    fontSize: 11,
    color: "var(--muted)",
    flexShrink: 0,
  },
  pinnedIcon: {
    color: "var(--accent)",
    flexShrink: 0,
  },
  channelItemPreviewRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  channelItemPreview: {
    fontSize: 13,
    color: "var(--muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    minWidth: 0,
  },
  listSearchWrap: {
    padding: "8px 12px 4px",
    flexShrink: 0,
  },
  listSearchBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--elevated)",
    border: "1px solid #2A313C",
    borderRadius: 999,
    padding: "10px 16px",
  },
  listSearchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "var(--text)",
    fontSize: 13.5,
    outline: "none",
  },
  channelItemMenuBtn: {
    background: "transparent",
    border: "none",
    borderRadius: "50%",
    color: "var(--muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    flexShrink: 0,
    marginLeft: 2,
    transition: "background 0.12s ease, color 0.12s ease",
  },
  selectCheckbox: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "2px solid #2A313C",
    background: "var(--elevated)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginRight: 4,
    transition: "background 0.12s ease, border-color 0.12s ease",
  },
  selectCheckboxOn: {
    background: "var(--accent)",
    borderColor: "var(--accent)",
  },
  bulkActionBar: {
    display: "flex",
    gap: 8,
    padding: "10px 12px",
    background: "var(--panel)",
    borderTop: "1px solid #2A313C",
    animation: "wave-panel-slide 0.18s ease",
    flexShrink: 0,
  },
  bulkActionBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    background: "var(--elevated)",
    border: "1px solid #2A313C",
    borderRadius: 10,
    padding: "8px 4px",
    color: "var(--text)",
    fontSize: 11,
    cursor: "pointer",
  },
  bulkActionBtnDanger: {
    color: "#F09595",
    borderColor: "#5A2E2E",
  },
  chatItemMenu: {
    position: "absolute",
    top: 8,
    right: 10,
    zIndex: 5,
    background: "var(--elevated)",
    border: "1px solid #2A313C",
    borderRadius: 10,
    padding: 6,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 168,
    boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
    animation: "wave-modal-in 0.12s ease",
  },
  chatItemMenuBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "transparent",
    border: "none",
    color: "var(--text)",
    fontSize: 13,
    padding: "7px 8px",
    borderRadius: 6,
    cursor: "pointer",
    textAlign: "left",
  },
  userFooter: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderTop: "1px solid #23293280",
    background: "var(--elevated)",
  },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
    color: "#1A1A1A",
    flexShrink: 0,
    overflow: "hidden",
  },
  onlineDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: "var(--online)",
    border: "2px solid var(--elevated)",
  },
  logoutButton: {
    marginLeft: "auto",
    background: "var(--panel)",
    border: "1px solid #2A313C",
    borderRadius: "50%",
    color: "var(--muted)",
    cursor: "pointer",
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "transform 0.12s ease, color 0.12s ease",
  },
  chatPanel: {
    flex: 1,
    flexDirection: "column",
    minWidth: 0,
    animation: "wave-panel-slide 0.22s ease",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 14px",
    borderBottom: "1px solid #23293280",
    flexShrink: 0,
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "var(--text)",
    cursor: "pointer",
    display: "flex",
    padding: 2,
    marginRight: 2,
  },
  membersToggle: {
    marginLeft: "auto",
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    display: "flex",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    borderBottom: "1px solid #23293280",
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  messageRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
    animation: "wave-bubble-in 0.32s cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
  bubble: {
    borderRadius: 18,
    padding: "8px 12px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
  },
  bubbleOwn: {
    background: "linear-gradient(135deg, var(--accent), var(--accent2))",
    color: "#0B1220",
  },
  bubbleOther: {
    background: "var(--elevated)",
    color: "var(--text)",
    border: "1px solid #2A313C",
  },
  stickerMessage: {
    margin: "2px 0 0",
    fontSize: 44,
    lineHeight: 1,
    display: "inline-block",
  },
  replyQuote: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    color: "var(--muted)",
    margin: "3px 0 0",
    borderLeft: "2px solid #2A313C",
    paddingLeft: 6,
    maxWidth: 260,
  },
  replyBar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderTop: "1px solid #23293280",
    background: "var(--elevated)",
    flexShrink: 0,
  },
  typingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    margin: 0,
    padding: "2px 14px",
    fontSize: 12,
    color: "var(--muted)",
    flexShrink: 0,
  },
  toastStack: {
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    zIndex: 50,
    maxWidth: 220,
  },
  toastItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--elevated)",
    border: "1px solid #2A313C",
    borderRadius: 10,
    padding: "8px 10px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
    cursor: "pointer",
    textAlign: "left",
    animation: "wave-toast-in 0.2s ease",
  },
  footerLangBtn: {
    background: "var(--panel)",
    border: "1px solid #2A313C",
    borderRadius: "50%",
    color: "var(--muted)",
    cursor: "pointer",
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "transform 0.12s ease, color 0.12s ease",
  },
  messageImage: {
    maxWidth: 240,
    maxHeight: 240,
    borderRadius: 16,
    display: "block",
    border: "1px solid #23293280",
    boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
  },
  reactionsRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    flexWrap: "wrap",
  },
  reactionPill: {
    fontSize: 12,
    background: "var(--elevated)",
    border: "1px solid #2A313C",
    borderRadius: 20,
    padding: "1px 7px",
    color: "var(--text)",
    cursor: "pointer",
  },
  reactionPillActive: {
    borderColor: "var(--accent)",
    background: "#3A2C11",
  },
  addReactionBtn: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    display: "flex",
    padding: 2,
  },
  reactionPickerRow: {
    display: "flex",
    gap: 4,
    marginTop: 4,
    background: "var(--elevated)",
    border: "1px solid #2A313C",
    borderRadius: 10,
    padding: 6,
    width: "fit-content",
    animation: "wave-modal-in 0.15s ease",
  },
  reactionPickerEmoji: {
    background: "transparent",
    border: "none",
    fontSize: 17,
    cursor: "pointer",
    padding: 2,
  },
  stickerRow: {
    display: "flex",
    gap: 6,
    padding: "8px 14px",
    borderTop: "1px solid #23293280",
    flexWrap: "wrap",
    flexShrink: 0,
    animation: "wave-panel-slide 0.18s ease",
  },
  stickerButton: {
    background: "var(--elevated)",
    border: "1px solid #2A313C",
    borderRadius: 10,
    fontSize: 24,
    padding: "4px 8px",
    cursor: "pointer",
  },
  stickerToggle: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    display: "flex",
    flexShrink: 0,
  },
  composer: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    padding: "10px 14px",
    borderTop: "1px solid #23293280",
    flexShrink: 0,
  },
  composerInput: {
    flex: 1,
    background: "var(--elevated)",
    border: "1px solid #2A313C",
    borderRadius: 22,
    padding: "11px 16px",
    color: "var(--text)",
    fontSize: 14.5,
    outline: "none",
  },
  sendButton: {
    background: "linear-gradient(135deg, var(--accent), var(--accent2))",
    border: "none",
    borderRadius: "50%",
    width: 42,
    height: 42,
    color: "#0B1220",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(62,166,255,0.35)",
    transition: "transform 0.15s ease",
  },
  voiceWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 20px",
    overflowY: "auto",
  },
  voiceParticipant: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--elevated)",
    border: "1px solid #2A313C",
    borderRadius: 10,
    padding: "6px 10px",
  },
  voiceJoinButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(135deg, var(--accent), var(--accent2))",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    color: "#0B1220",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  voiceLeaveButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "transparent",
    border: "1px solid #E5534B",
    borderRadius: 10,
    padding: "10px 18px",
    color: "#F09595",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  memberOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
  },
  memberDrawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 220,
    background: "var(--panel)",
    borderLeft: "1px solid #23293280",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
    animation: "wave-modal-in 0.18s ease",
  },
  memberDrawerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 13,
  },
  memberRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  globalSearchModal: {
    position: "absolute",
    top: "8%",
    left: "6%",
    right: "6%",
    bottom: "8%",
    background: "var(--panel)",
    border: "1px solid #2A313C",
    borderRadius: 12,
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    animation: "wave-modal-in 0.18s ease",
  },
  globalResultRow: {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #23293250",
    padding: "8px 2px",
    cursor: "pointer",
    color: "var(--text)",
    textAlign: "left",
  },
  loginWrap: {
    fontFamily: "system-ui, sans-serif",
    background: "#0A101E",
    color: "#EAF1FF",
    height: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    padding: 20,
    boxSizing: "border-box",
    position: "fixed",
    inset: 0,
    margin: 0,
  },
  loginCard: {
    width: "100%",
    maxWidth: 320,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 4,
    animation: "wave-modal-in 0.25s ease",
    position: "relative",
  },
  langToggle: {
    position: "absolute",
    top: -8,
    right: 0,
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "transparent",
    border: "1px solid #2A313C",
    borderRadius: 8,
    color: "#8496B8",
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 8px",
    cursor: "pointer",
  },
  langSecondaryButton: {
    background: "transparent",
    border: "1px solid #2A313C",
    color: "#EAF1FF",
    marginTop: 8,
  },
  loginDot: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3EA6FF, #7C6FF2)",
    marginBottom: 14,
  },
  loginTitle: {
    fontSize: 26,
    fontWeight: 800,
    margin: 0,
    letterSpacing: -0.5,
  },
  loginSubtitle: {
    fontSize: 14,
    color: "#8496B8",
    margin: "6px 0 22px",
  },
  loginInput: {
    width: "100%",
    boxSizing: "border-box",
    background: "#182238",
    border: "1px solid #2A313C",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#EAF1FF",
    fontSize: 15,
    outline: "none",
    marginBottom: 10,
  },
  loginButton: {
    width: "100%",
    background: "linear-gradient(135deg, #3EA6FF, #7C6FF2)",
    border: "none",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#0B1220",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
  },
  loginHint: {
    fontSize: 12,
    color: "#8496B8",
    marginTop: 18,
  },
  loginError: {
    color: "#F09595",
    fontSize: 13,
    margin: "-2px 0 10px",
    textAlign: "left",
  },
  modeToggle: {
    background: "transparent",
    border: "none",
    color: "#3EA6FF",
    fontSize: 13,
    cursor: "pointer",
    marginTop: 14,
    padding: 0,
  },
};
