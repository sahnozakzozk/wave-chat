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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store`, {
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
const REACTIONS = ["рџ‘Ќ", "вќ¤пёЏ", "рџ‚", "рџ®", "рџ”Ґ", "рџ‘‹"];
const STICKERS = [
  "рџЋ‰", "рџђ±", "рџ‘‹", "рџ’Ї", "рџЌ•", "рџґ", "рџљЂ", "вќ¤пёЏ",
  "рџ”Ґ", "рџЋ‚", "рџҐі", "рџ‚", "рџ‘Џ", "рџ¤ќ", "рџЊџ", "рџЋ®",
  "в•", "рџЋµ", "рџЋ", "рџ¤Ї",
];
const STICKER_ANIMATIONS = ["wave-sticker-pop", "wave-sticker-bounce", "wave-sticker-spin", "wave-sticker-wobble"];
function stickerAnimFor(id) {
  const n = typeof id === "number" ? id : String(id).length;
  return STICKER_ANIMATIONS[Math.abs(n) % STICKER_ANIMATIONS.length];
}

const STRINGS = {
  ru: {
    appName: "Р’РѕР»РЅР°",
    tagline: "РљР°РЅР°Р»С‹ Рё С‡Р°С‚С‹ РґР»СЏ С‚РІРѕРµР№ РєРѕРјР°РЅРґС‹ РёР»Рё С‚СѓСЃРѕРІРєРё",
    usernamePlaceholder: "РРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ",
    passwordPlaceholder: "РџР°СЂРѕР»СЊ",
    confirmPasswordPlaceholder: "РџРѕРІС‚РѕСЂРё РїР°СЂРѕР»СЊ",
    needUsername: "Р’РІРµРґРё РёРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ",
    needPassword: "Р’РІРµРґРё РїР°СЂРѕР»СЊ",
    passwordTooShort: "РџР°СЂРѕР»СЊ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РЅРµ РєРѕСЂРѕС‡Рµ 4 СЃРёРјРІРѕР»РѕРІ",
    passwordsMismatch: "РџР°СЂРѕР»Рё РЅРµ СЃРѕРІРїР°РґР°СЋС‚",
    usernameTaken: "Р­С‚Рѕ РёРјСЏ СѓР¶Рµ Р·Р°РЅСЏС‚Рѕ, РІС‹Р±РµСЂРё РґСЂСѓРіРѕРµ",
    saveFailed: "РќРµ РїРѕР»СѓС‡РёР»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ, РїРѕРїСЂРѕР±СѓР№ РµС‰С‘ СЂР°Р·",
    userNotFound: "РўР°РєРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РЅРµС‚ вЂ” Р·Р°СЂРµРіРёСЃС‚СЂРёСЂСѓР№СЃСЏ",
    wrongPassword: "РќРµРІРµСЂРЅС‹Р№ РїР°СЂРѕР»СЊ",
    genericError: "Р§С‚Рѕ-С‚Рѕ РїРѕС€Р»Рѕ РЅРµ С‚Р°Рє, РїРѕРїСЂРѕР±СѓР№ РµС‰С‘ СЂР°Р·",
    busy: "РЎРµРєСѓРЅРґСѓвЂ¦",
    registerBtn: "Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ",
    loginBtn: "Р’РѕР№С‚Рё",
    toggleToRegister: "РќРµС‚ Р°РєРєР°СѓРЅС‚Р°? Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ",
    toggleToLogin: "РЈР¶Рµ РµСЃС‚СЊ Р°РєРєР°СѓРЅС‚? Р’РѕР№С‚Рё",
    loginHint:
      "Р’С…РѕРґ Р·Р°РїРѕРјРёРЅР°РµС‚СЃСЏ РЅР° СЌС‚РѕРј СѓСЃС‚СЂРѕР№СЃС‚РІРµ. РџР°СЂРѕР»СЊ С…СЂР°РЅРёС‚СЃСЏ РІ РІРёРґРµ С…РµС€Р° РІ РѕР±С‰РµРј С…СЂР°РЅРёР»РёС‰Рµ РїСЂРёР»РѕР¶РµРЅРёСЏ вЂ” СЌС‚Рѕ РґРµРјРѕ-СѓСЂРѕРІРµРЅСЊ Р·Р°С‰РёС‚С‹, РЅРµ РїРѕР»РЅРѕС†РµРЅРЅР°СЏ СЃРµСЂРІРµСЂРЅР°СЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ.",
    loadingSession: "Р—Р°РіСЂСѓР·РєР°вЂ¦",
    chooseLanguage: "Р’С‹Р±РµСЂРё СЏР·С‹Рє",
    chooseLanguageSubtitle: "Р­С‚Рѕ РјРѕР¶РЅРѕ РёР·РјРµРЅРёС‚СЊ РїРѕР·Р¶Рµ РІ РїСЂРёР»РѕР¶РµРЅРёРё",
    continueBtn: "РџСЂРѕРґРѕР»Р¶РёС‚СЊ",
    directMessages: "Р›РёС‡РЅС‹Рµ СЃРѕРѕР±С‰РµРЅРёСЏ",
    noOtherUsers: "РџРѕРєР° РЅРµС‚ РґСЂСѓРіРёС… Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅРЅС‹С… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№.",
    channels: "РљР°РЅР°Р»С‹",
    createServer: "РЎРѕР·РґР°С‚СЊ СЃРµСЂРІРµСЂ",
    demoNoServer: "Р’ РґРµРјРѕ-РІРµСЂСЃРёРё РЅРµР»СЊР·СЏ СЃРѕР·РґР°С‚СЊ РЅРѕРІС‹Р№ СЃРµСЂРІРµСЂ",
    searchServer: "РџРѕРёСЃРє РїРѕ",
    searchMessages: "РџРѕРёСЃРє РїРѕ СЃРѕРѕР±С‰РµРЅРёСЏРј",
    members: "РЈС‡Р°СЃС‚РЅРёРєРё",
    you: "С‚С‹",
    close: "Р—Р°РєСЂС‹С‚СЊ",
    pickDialog: "Р’С‹Р±РµСЂРё, РєРѕРјСѓ РЅР°РїРёСЃР°С‚СЊ",
    loadingMessages: "Р—Р°РіСЂСѓР·РєР° СЃРѕРѕР±С‰РµРЅРёР№вЂ¦",
    nothingFound: "РќРёС‡РµРіРѕ РЅРµ РЅР°Р№РґРµРЅРѕ",
    emptyChannel: "Р—РґРµСЃСЊ РїРѕРєР° С‚РёС…Рѕ. РќР°РїРёС€Рё РїРµСЂРІРѕРµ СЃРѕРѕР±С‰РµРЅРёРµ.",
    saveError: "РќРµ РїРѕР»СѓС‡РёР»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РїРѕСЃР»РµРґРЅРµРµ РґРµР№СЃС‚РІРёРµ. РџРѕРїСЂРѕР±СѓР№ РµС‰С‘ СЂР°Р·.",
    writeTo: "РќР°РїРёСЃР°С‚СЊ",
    sendingPhoto: "РћС‚РїСЂР°РІРєР° С„РѕС‚РѕвЂ¦",
    sendPhoto: "РћС‚РїСЂР°РІРёС‚СЊ С„РѕС‚Рѕ",
    stickers: "РЎС‚РёРєРµСЂС‹",
    send: "РћС‚РїСЂР°РІРёС‚СЊ",
    addReaction: "Р”РѕР±Р°РІРёС‚СЊ СЂРµР°РєС†РёСЋ",
    reply: "РћС‚РІРµС‚РёС‚СЊ",
    cancelReply: "РћС‚РјРµРЅРёС‚СЊ РѕС‚РІРµС‚",
    replyingTo: "РћС‚РІРµС‚",
    photoLabel: "Р¤РѕС‚Рѕ",
    imageAlt: "РР·РѕР±СЂР°Р¶РµРЅРёРµ",
    typingOne: (name) => `${name} РїРµС‡Р°С‚Р°РµС‚вЂ¦`,
    voiceDemoHint:
      "Р“РѕР»РѕСЃРѕРІРѕР№ РєР°РЅР°Р» РёСЃРїРѕР»СЊР·СѓРµС‚ WebRTC РЅР°РїСЂСЏРјСѓСЋ РјРµР¶РґСѓ Р±СЂР°СѓР·РµСЂР°РјРё (Р±РµР· TURN-СЃРµСЂРІРµСЂР°) вЂ” РІ Р±РѕР»СЊС€РёРЅСЃС‚РІРµ СЃРµС‚РµР№ Р·РІСѓРє РїРѕР№РґС‘С‚, РЅРѕ РЅР° РЅРµРєРѕС‚РѕСЂС‹С… РјРѕР±РёР»СЊРЅС‹С…/РєРѕСЂРїРѕСЂР°С‚РёРІРЅС‹С… СЃРµС‚СЏС… СЃ Р¶С‘СЃС‚РєРёРј NAT СЃРѕРµРґРёРЅРµРЅРёРµ РјРѕР¶РµС‚ РЅРµ СѓСЃС‚Р°РЅРѕРІРёС‚СЊСЃСЏ.",
    voiceNoOne: "РџРѕРєР° РЅРёРєРѕРіРѕ РЅРµС‚ РІ РєР°РЅР°Р»Рµ",
    joinVoice: (name) => "Р’РѕР№С‚Рё РІ " + name,
    leaveVoice: (name) => "Р’С‹Р№С‚Рё РёР· " + name,
    mute: "Р’С‹РєР»СЋС‡РёС‚СЊ РјРёРєСЂРѕС„РѕРЅ",
    unmute: "Р’РєР»СЋС‡РёС‚СЊ РјРёРєСЂРѕС„РѕРЅ",
    logout: "Р’С‹Р№С‚Рё",
    chooseImage: "Р’С‹Р±РµСЂРё С„Р°Р№Р» РёР·РѕР±СЂР°Р¶РµРЅРёСЏ",
    switchLanguage: "РЎРјРµРЅРёС‚СЊ СЏР·С‹Рє",
    newMessageIn: (name) => `РќРѕРІРѕРµ РІ ${name}`,
    settingsTitle: "РќР°СЃС‚СЂРѕР№РєРё",
  },
  en: {
    appName: "Wave",
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
    userNotFound: "No such user вЂ” sign up instead",
    wrongPassword: "Wrong password",
    genericError: "Something went wrong, try again",
    busy: "One secвЂ¦",
    registerBtn: "Sign up",
    loginBtn: "Log in",
    toggleToRegister: "No account? Sign up",
    toggleToLogin: "Already have an account? Log in",
    loginHint:
      "Your session is remembered on this device. The password is stored as a hash in the app's shared storage вЂ” this is demo-level protection, not real server auth.",
    loadingSession: "LoadingвЂ¦",
    chooseLanguage: "Choose a language",
    chooseLanguageSubtitle: "You can change this later in the app",
    continueBtn: "Continue",
    directMessages: "Direct messages",
    noOtherUsers: "No other registered users yet.",
    channels: "Channels",
    createServer: "Create server",
    demoNoServer: "You can't create a new server in the demo",
    searchServer: "Search",
    searchMessages: "Search messages",
    members: "Members",
    you: "you",
    close: "Close",
    pickDialog: "Pick who to message",
    loadingMessages: "Loading messagesвЂ¦",
    nothingFound: "Nothing found",
    emptyChannel: "It's quiet here. Send the first message.",
    saveError: "Couldn't save your last action. Try again.",
    writeTo: "Message",
    sendingPhoto: "Sending photoвЂ¦",
    sendPhoto: "Send a photo",
    stickers: "Stickers",
    send: "Send",
    addReaction: "Add reaction",
    reply: "Reply",
    cancelReply: "Cancel reply",
    replyingTo: "Replying to",
    photoLabel: "Photo",
    imageAlt: "Image",
    typingOne: (name) => `${name} is typingвЂ¦`,
    voiceDemoHint:
      "This voice channel uses WebRTC directly between browsers (no TURN server) вЂ” audio works on most networks, but strict NATs (some mobile/corporate networks) may fail to connect.",
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
    name: "РљР»СѓР± СЂР°Р·СЂР°Р±РѕС‚РєРё",
    tag: "DEV",
    members: ["РђРЅСЏ", "РњР°РєСЃРёРј", "РЎРІРµС‚Р°"],
    channels: [
      { id: "dev-general", name: "РѕР±С‰РёР№", type: "text" },
      { id: "dev-help", name: "РїРѕРјРѕС‰СЊ", type: "text" },
      { id: "dev-showcase", name: "РїРѕРєР°Р·Р°С‚СЊ-РїСЂРѕРµРєС‚", type: "text" },
      { id: "dev-voice", name: "РІРѕР№СЃ-РєРѕРјРЅР°С‚Р°", type: "voice" },
    ],
  },
  {
    id: "games",
    name: "РРіСЂРѕРІР°СЏ С‚СѓСЃРѕРІРєР°",
    tag: "GG",
    members: ["РРіРѕСЂСЊ", "РќР°СЃС‚СЏ", "РџС‘С‚СЂ", "Р›РµРЅР°"],
    channels: [
      { id: "games-general", name: "РѕР±С‰РёР№", type: "text" },
      { id: "games-lfg", name: "РёС‰Сѓ-РїР°С‚Рё", type: "text" },
      { id: "games-memes", name: "РјРµРјС‹", type: "text" },
      { id: "games-voice", name: "РІРѕР№СЃ", type: "voice" },
    ],
  },
];

const INITIAL_MESSAGES = {
  "dev-general": [
    { id: 1, author: "РђРЅСЏ", text: "РџСЂРёРІРµС‚! РљС‚Рѕ-РЅРёР±СѓРґСЊ СЂР°Р·Р±РёСЂР°Р»СЃСЏ СЃ РІРµР±СЃРѕРєРµС‚Р°РјРё РЅР° СЌС‚РѕР№ РЅРµРґРµР»Рµ?", time: "10:12", type: "text" },
    { id: 2, author: "РњР°РєСЃРёРј", text: "Р”Р°, РјРѕРіСѓ РїРѕРјРѕС‡СЊ, С‡С‚Рѕ РЅРµ СЂР°Р±РѕС‚Р°РµС‚?", time: "10:14", type: "text" },
  ],
  "dev-help": [{ id: 1, author: "РЎРІРµС‚Р°", text: "РќРµ СЃРѕР±РёСЂР°РµС‚СЃСЏ Р±РёР»Рґ, СЂСѓРіР°РµС‚СЃСЏ РЅР° РёРјРїРѕСЂС‚", time: "09:40", type: "text" }],
  "dev-showcase": [{ id: 1, author: "РњР°РєСЃРёРј", text: "Р—Р°РїСѓСЃС‚РёР» СЃРІРѕР№ РїРµСЂРІС‹Р№ Р±РѕС‚, Р·Р°С†РµРЅРёС‚Рµ", time: "18:02", type: "text" }],
  "games-general": [
    { id: 1, author: "РРіРѕСЂСЊ", text: "Р“Рѕ СЃРµРіРѕРґРЅСЏ РІРµС‡РµСЂРѕРј?", time: "20:05", type: "text" },
    { id: 2, author: "РќР°СЃС‚СЏ", text: "РЇ Р·Р°", time: "20:06", type: "text" },
  ],
  "games-lfg": [{ id: 1, author: "РџС‘С‚СЂ", text: "РќСѓР¶РµРЅ РµС‰С‘ РѕРґРёРЅ РІ РєРѕРјР°РЅРґСѓ, СЂР°РЅРі РЅРµРІР°Р¶РµРЅ", time: "19:30", type: "text" }],
  "games-memes": [{ id: 1, author: "Р›РµРЅР°", text: "РќР°С€Р»Р° РєР°СЂС‚РёРЅРєСѓ РїСЂСЏРјРѕ РїСЂРѕ РЅР°СЃ", time: "12:00", type: "text" }],
};

async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function loadUsers() {
  try {
    const result = await storage.get("users", true);
    return result ? JSON.parse(result.value) : {};
  } catch (err) {
    return {};
  }
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
// on some mobile/corporate networks) a direct connection can still fail вЂ”
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
    // best-effort вЂ” the next poll tick will retry
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
    <div style={styles.loginWrap}>
      <div style={styles.loginCard}>
        <div style={styles.loginDot} />
        <h1 style={styles.loginTitle}>Р’РѕР»РЅР° / Wave</h1>
        <p style={styles.loginSubtitle}>Р’С‹Р±РµСЂРё СЏР·С‹Рє / Choose a language</p>
        <button onClick={() => onSelect("ru")} style={styles.loginButton} className="wave-btn">
          Р СѓСЃСЃРєРёР№
        </button>
        <button
          onClick={() => onSelect("en")}
          style={{ ...styles.loginButton, ...styles.langSecondaryButton }}
          className="wave-btn"
        >
          English
        </button>
        <p style={styles.loginHint}>Р­С‚Рѕ РјРѕР¶РЅРѕ РёР·РјРµРЅРёС‚СЊ РїРѕР·Р¶Рµ РІ РїСЂРёР»РѕР¶РµРЅРёРё / You can change this later in the app</p>
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

  async function handleSubmit(e) {
    e.preventDefault();
    const name = username.trim();
    if (!name) {
      setError(t.needUsername);
      return;
    }
    if (!password) {
      setError(t.needPassword);
      return;
    }
    if (mode === "register" && password.length < 4) {
      setError(t.passwordTooShort);
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError(t.passwordsMismatch);
      return;
    }
    setError("");
    setBusy(true);
    try {
      const users = await loadUsers();
      const hashed = await hashPassword(password);
      if (mode === "register") {
        if (users[name]) {
          setError(t.usernameTaken);
          setBusy(false);
          return;
        }
        users[name] = hashed;
        const result = await storage.set("users", JSON.stringify(users), true);
        if (!result) {
          setError(t.saveFailed);
          setBusy(false);
          return;
        }
        await persistSession(name);
        onLogin(name);
      } else {
        if (!users[name]) {
          setError(t.userNotFound);
          setBusy(false);
          return;
        }
        if (users[name] !== hashed) {
          setError(t.wrongPassword);
          setBusy(false);
          return;
        }
        await persistSession(name);
        onLogin(name);
      }
    } catch (err) {
      setError(t.genericError);
      setBusy(false);
    }
  }

  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginCard}>
        <button onClick={onToggleLang} style={styles.langToggle} className="wave-btn" aria-label={t.switchLanguage}>
          <Globe size={13} /> {lang === "ru" ? "EN" : "RU"}
        </button>
        <div style={styles.loginDot} />
        <h1 style={styles.loginTitle}>{t.appName}</h1>
        <p style={styles.loginSubtitle}>{t.tagline}</p>
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <input
            autoFocus
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            placeholder={t.usernamePlaceholder}
            style={styles.loginInput}
            maxLength={20}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder={t.passwordPlaceholder}
            style={styles.loginInput}
            maxLength={64}
          />
          {mode === "register" && (
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              placeholder={t.confirmPasswordPlaceholder}
              style={styles.loginInput}
              maxLength={64}
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

function VoiceChannelView({ channelId, channelName, participants, username, joined, onJoin, onLeave, t }) {
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
          // transient signaling hiccup вЂ” retried on the next tick
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
                {initials(p)}
              </div>
              <span style={{ fontSize: 14 }}>
                {p}
                {isMe && muted ? " (mute)" : ""}
              </span>
              {status === "connecting" && (
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>вЂ¦</span>
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
  const [toasts, setToasts] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastSeenRef = useRef({});
  const currentChannelIdRef = useRef(null);
  const lastTypingWriteRef = useRef(0);

  const t = STRINGS[lang || "ru"];

  const activeServer = DEMO_SERVERS.find((s) => s.id === activeServerId);
  const activeStaticChannel = activeSection === "server" ? activeServer.channels.find((c) => c.id === activeChannelId) : null;
  const currentChannelId = activeSection === "dm" ? (activeDmPartner ? dmChannelId(username || "", activeDmPartner) : null) : activeChannelId;
  const currentChannelName = activeSection === "dm" ? activeDmPartner || "" : activeStaticChannel ? activeStaticChannel.name : "";
  const currentChannelType = activeSection === "dm" ? "dm" : activeStaticChannel ? activeStaticChannel.type : "text";
  const channelMessages = currentChannelId ? messages[currentChannelId] || [] : [];
  const filteredMessages = searchQuery.trim()
    ? channelMessages.filter((m) => m.type !== "image" && m.text && m.text.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : channelMessages;

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
    const interval = setInterval(async () => {
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
            setTimeout(() => {
              setToasts((prev) => prev.filter((x) => x.id !== toastId));
            }, 4000);
          }
        }
      }
    }, 4500);
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
    if (!username || activeSection !== "dm") return;
    loadUsers().then((users) => {
      setDmDirectory(Object.keys(users).filter((u) => u !== username));
    });
  }, [activeSection, username]);

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
      <div style={styles.loginWrap}>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Р—Р°РіСЂСѓР·РєР°вЂ¦ / LoadingвЂ¦</p>
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
  }

  function selectDmSection() {
    setActiveSection("dm");
    setMobilePanel("list");
    setShowMembers(false);
    setShowSearch(false);
    setSearchQuery("");
    setReplyingTo(null);
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

  async function persistMessages(channelId, updated) {
    setMessages((prev) => ({ ...prev, [channelId]: updated }));
    try {
      const result = await storage.set(messagesKey(channelId), JSON.stringify(updated), true);
      if (!result) setStorageError(true);
    } catch (err) {
      setStorageError(true);
    }
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
    const newMsg = { id: Date.now(), author: username, text: draft.trim(), time, type: "text", ...(replyTo ? { replyTo } : {}) };
    await persistMessages(currentChannelId, [...channelMessages, newMsg]);
    setDraft("");
    setReplyingTo(null);
    clearTypingState();
  }

  async function sendSticker(emoji) {
    if (!currentChannelId) return;
    const now = new Date();
    const time = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
    const replyTo = buildReplySnapshot();
    const newMsg = { id: Date.now(), author: username, text: emoji, time, type: "sticker", ...(replyTo ? { replyTo } : {}) };
    await persistMessages(currentChannelId, [...channelMessages, newMsg]);
    setShowStickers(false);
    setReplyingTo(null);
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
      const newMsg = { id: Date.now(), author: username, text: dataUrl, time, type: "image" };
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
  const showSearchButton = currentChannelType === "text" || currentChannelType === "dm";

  return (
    <div style={styles.app}>
      <div style={styles.rail}>
        {DEMO_SERVERS.map((s) => (
          <button
            key={s.id}
            onClick={() => selectServer(s.id)}
            style={{
              ...styles.railIcon,
              ...(activeSection === "server" && s.id === activeServerId ? styles.railIconActive : {}),
            }}
            className="wave-btn"
            aria-label={s.name}
          >
            {s.tag}
            {s.channels.some((c) => (unreadCounts[c.id] || 0) > 0) && <span style={styles.railUnreadDot} />}
          </button>
        ))}
        <div style={styles.railDivider} />
        <button
          onClick={selectDmSection}
          style={{ ...styles.railIcon, ...(activeSection === "dm" ? styles.railIconActive : {}) }}
          className="wave-btn"
          aria-label={t.directMessages}
        >
          <MessageCircle size={18} />
          {dmDirectory.some((u) => (unreadCounts[dmChannelId(username, u)] || 0) > 0) && (
            <span style={styles.railUnreadDot} />
          )}
        </button>
        <button
          onClick={() => alert(t.demoNoServer)}
          style={{ ...styles.railIcon, color: "var(--muted)" }}
          className="wave-btn"
          aria-label={t.createServer}
        >
          <Plus size={18} />
        </button>
      </div>

      <div
        style={{ ...styles.channelPanel, display: mobilePanel === "list" ? "flex" : "none" }}
        className="wave-channel-panel"
      >
        {activeSection === "server" ? (
          <>
            <div style={styles.channelPanelHeader}>
              <span style={{ fontWeight: 800 }}>{activeServer.name}</span>
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
            </div>
            <div style={styles.channelList}>
              <div style={styles.channelGroupLabel}>{t.channels}</div>
              {activeServer.channels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectChannel(c.id)}
                  style={{ ...styles.channelItem, ...(c.id === activeChannelId ? styles.channelItemActive : {}) }}
                  className="wave-btn"
                >
                  {c.type === "voice" ? (
                    <Volume2 size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
                  ) : (
                    <Hash size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
                  )}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {c.name}
                  </span>
                  {(unreadCounts[c.id] || 0) > 0 && c.id !== activeChannelId && (
                    <span style={styles.unreadBadge}>{unreadCounts[c.id]}</span>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={styles.channelPanelHeader}>
              <span style={{ fontWeight: 800 }}>{t.directMessages}</span>
            </div>
            <div style={styles.channelList}>
              {dmDirectory.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--muted)", padding: "8px" }}>{t.noOtherUsers}</p>
              )}
              {dmDirectory.map((u) => (
                <button
                  key={u}
                  onClick={() => selectDmPartner(u)}
                  style={{ ...styles.channelItem, ...(u === activeDmPartner ? styles.channelItemActive : {}) }}
                  className="wave-btn"
                >
                  <div style={{ ...styles.avatar, background: colorForName(u), width: 26, height: 26, fontSize: 11 }}>
                    {initials(u)}
                  </div>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{u}</span>
                  {(unreadCounts[dmChannelId(username, u)] || 0) > 0 && u !== activeDmPartner && (
                    <span style={styles.unreadBadge}>{unreadCounts[dmChannelId(username, u)]}</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
        <div style={styles.userFooter}>
          <button onClick={handleToggleLang} style={styles.footerLangBtn} className="wave-btn" aria-label={t.switchLanguage}>
            <Globe size={14} />
          </button>
          <div style={styles.avatarWrap}>
            <div style={{ ...styles.avatar, background: colorForName(username) }}>{initials(username)}</div>
            <span style={styles.onlineDot} />
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
        />
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

        {showSearch && currentChannelId && (currentChannelType === "text" || currentChannelType === "dm") && (
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
              {filteredMessages.map((m) => (
                <div key={m.id} style={styles.messageRow}>
                  <div style={{ ...styles.avatar, background: colorForName(m.author), width: 36, height: 36, fontSize: 13 }}>
                    {initials(m.author)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{m.author}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{m.time}</span>
                    </div>
                    {m.replyTo && (
                      <div style={styles.replyQuote}>
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
                      <p style={{ margin: "2px 0 0", fontSize: 14, lineHeight: 1.5, wordBreak: "break-word" }}>{m.text}</p>
                    )}
                    <div style={styles.reactionsRow}>
                      {m.reactions &&
                        Object.entries(m.reactions).map(([emoji, people]) => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(m, emoji)}
                            style={{
                              ...styles.reactionPill,
                              ...(people.includes(username) ? styles.reactionPillActive : {}),
                            }}
                            className="wave-btn"
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
              ))}
            </div>

            {typingUser && (
              <p style={styles.typingIndicator}>
                <span className="wave-typing-dots">в—Џв—Џв—Џ</span> {t.typingOne(typingUser)}
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
              <button type="submit" style={styles.sendButton} className="wave-btn" aria-label={t.send}>
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>

      <div style={styles.toastStack}>
        {toasts.map((toast) => (
          <button key={toast.id} onClick={() => openToastTarget(toast)} style={styles.toastItem} className="wave-btn">
            <div style={{ ...styles.avatar, background: colorForName(toast.author), width: 26, height: 26, fontSize: 10, flexShrink: 0 }}>
              {initials(toast.author)}
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
                {t.members} вЂ” {onlineMembers.length}
              </span>
              <button onClick={() => setShowMembers(false)} style={styles.logoutButton} className="wave-btn" aria-label={t.close}>
                <X size={18} />
              </button>
            </div>
            {onlineMembers.map((m) => (
              <div key={m} style={styles.memberRow}>
                <div style={styles.avatarWrap}>
                  <div style={{ ...styles.avatar, background: colorForName(m), width: 32, height: 32, fontSize: 12 }}>
                    {initials(m)}
                  </div>
                  <span style={styles.onlineDot} />
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
                {t.searchServer} {activeServer.name}
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
              {globalLoading && <p style={{ color: "var(--muted)", fontSize: 13, padding: "10px 2px" }}>вЂ¦</p>}
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
    settings: "РќР°СЃС‚СЂРѕР№РєРё",
    editProfile: "Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РїСЂРѕС„РёР»СЊ",
    editProfileSub: "РРјСЏ, С„РѕС‚Рѕ, СЃС‚Р°С‚СѓСЃ",
    account: "РђРєРєР°СѓРЅС‚ Рё РїСЂРёРІСЏР·РєР°",
    accountSub: "РџРѕС‡С‚Р°, С‚РµР»РµС„РѕРЅ, РїР°СЂРѕР»СЊ",
    notifications: "РЈРІРµРґРѕРјР»РµРЅРёСЏ",
    notificationsSub: "Р—РІСѓРєРё Рё РїСЂРµРІСЊСЋ СЃРѕРѕР±С‰РµРЅРёР№",
    appearance: "РћС„РѕСЂРјР»РµРЅРёРµ",
    appearanceSub: "Р¦РІРµС‚ С‚РµРјС‹ РїСЂРёР»РѕР¶РµРЅРёСЏ",
    language: "РЇР·С‹Рє",
    privacy: "РџСЂРёРІР°С‚РЅРѕСЃС‚СЊ",
    privacySub: "РљС‚Рѕ РІРёРґРёС‚ С‚РІРѕР№ РїСЂРѕС„РёР»СЊ",
    logout: "Р’С‹Р№С‚Рё РёР· Р°РєРєР°СѓРЅС‚Р°",
    logoutConfirm: "РўРѕС‡РЅРѕ РІС‹Р№С‚Рё РёР· Р°РєРєР°СѓРЅС‚Р° РЅР° СЌС‚РѕРј СѓСЃС‚СЂРѕР№СЃС‚РІРµ?",
    logoutConfirmYes: "Р”Р°, РІС‹Р№С‚Рё",
    logoutConfirmNo: "РћС‚РјРµРЅР°",
    bio: "Рћ СЃРµР±Рµ",
    bioPlaceholder: "Р Р°СЃСЃРєР°Р¶Рё Рѕ СЃРµР±Рµ РїР°СЂСѓ СЃР»РѕРІвЂ¦",
    name: "РРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ",
    save: "РЎРѕС…СЂР°РЅРёС‚СЊ",
    saved: "РЎРѕС…СЂР°РЅРµРЅРѕ",
    bindEmail: "РџСЂРёРІСЏР·Р°С‚СЊ РїРѕС‡С‚Сѓ",
    bindPhone: "РџСЂРёРІСЏР·Р°С‚СЊ С‚РµР»РµС„РѕРЅ",
    emailPlaceholder: "you@example.com",
    phonePlaceholder: "+7 900 000-00-00",
    notBound: "РЅРµ РїСЂРёРІСЏР·Р°РЅРѕ",
    sound: "Р—РІСѓРє СѓРІРµРґРѕРјР»РµРЅРёР№",
    preview: "РџРѕРєР°Р·С‹РІР°С‚СЊ С‚РµРєСЃС‚ СЃРѕРѕР±С‰РµРЅРёСЏ",
    theme: "Р¦РІРµС‚ Р°РєС†РµРЅС‚Р°",
    online: "РІ СЃРµС‚Рё",
    version: "Р’РѕР»РЅР° В· РґРµРјРѕ-РІРµСЂСЃРёСЏ 1.0",
    changePhoto: "РЎРјРµРЅРёС‚СЊ С†РІРµС‚ С„РѕС‚Рѕ",
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
    bioPlaceholder: "Tell people a bit about yourselfвЂ¦",
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
    version: "Wave В· demo build 1.0",
    changePhoto: "Change photo color",
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

function SettingsPanel({ username, lang, t, storage, onToggleLang, onClose, onLogout }) {
  const s = SETTINGS_STRINGS[lang] || SETTINGS_STRINGS.ru;
  const [page, setPage] = useState("main");
  const [anim, setAnim] = useState("wave-settings-in");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accent, setAccent] = useState("#F2A93B");
  const [soundOn, setSoundOn] = useState(true);
  const [previewOn, setPreviewOn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

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
          setAccent(data.accent || "#F2A93B");
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
      const result = await storage.set(`account:${username}`, JSON.stringify(next), true);
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
                  <div style={{ ...settingsStyles.bigAvatar, background: accent }}>{initialsText}</div>
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
                <SettingsRow icon={<Bell size={16} />} iconBg="#F2A93B" title={s.notifications} subtitle={s.notificationsSub} onClick={() => goTo("notifications")} />
                <SettingsRow icon={<Palette size={16} />} iconBg="#E8608F" title={s.appearance} subtitle={s.appearanceSub} onClick={() => goTo("appearance")} />
                <SettingsRow
                  icon={<Globe size={16} />}
                  iconBg="#8B94A3"
                  title={s.language}
                  subtitle={lang === "ru" ? "Р СѓСЃСЃРєРёР№" : "English"}
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
                  <div style={{ ...settingsStyles.bigAvatar, background: accent }}>{initialsText}</div>
                  <button
                    className="wave-btn"
                    style={settingsStyles.cameraBtn}
                    aria-label={s.changePhoto}
                    onClick={() => {
                      const i = ACCENT_OPTIONS.indexOf(accent);
                      const next = ACCENT_OPTIONS[(i + 1) % ACCENT_OPTIONS.length];
                      setAccent(next);
                      persistAccount({ bio, email, phone, accent: next });
                    }}
                  >
                    <Camera size={14} />
                  </button>
                </div>
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
                {saving ? "вЂ¦" : justSaved ? <Check size={16} /> : s.save}
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
                {saving ? "вЂ¦" : justSaved ? <Check size={16} /> : s.save}
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
                  iconBg="#F2A93B"
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
};

const GLOBAL_STYLES = `
@keyframes wave-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
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
  .wave-back-button { display: none !important; }
}
`;

const styles = {
  app: {
    "--bg": "#0E1116",
    "--panel": "#161B22",
    "--elevated": "#1C232B",
    "--accent": "#F2A93B",
    "--text": "#E8EAED",
    "--muted": "#8B94A3",
    "--online": "#3DD68C",
    fontFamily: "system-ui, sans-serif",
    color: "var(--text)",
    background: "var(--bg)",
    display: "flex",
    height: "600px",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #23293280",
    position: "relative",
  },
  rail: {
    width: 56,
    background: "var(--bg)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "12px 0",
    flexShrink: 0,
    borderRight: "1px solid #23293280",
    overflowY: "auto",
  },
  railDivider: {
    width: 28,
    height: 1,
    background: "#23293280",
    margin: "2px 0",
  },
  railIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    background: "var(--panel)",
    color: "var(--text)",
    border: "none",
    fontSize: 11,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    position: "relative",
  },
  railUnreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#E5534B",
    border: "2px solid var(--bg)",
  },
  unreadBadge: {
    background: "var(--accent)",
    color: "#3A2405",
    fontSize: 10,
    fontWeight: 800,
    borderRadius: 20,
    padding: "1px 6px",
    flexShrink: 0,
  },
  railIconActive: {
    background: "var(--accent)",
    color: "#3A2405",
  },
  channelPanel: {
    width: "100%",
    flexDirection: "column",
    background: "var(--panel)",
    flexShrink: 0,
    minWidth: 0,
    animation: "wave-panel-slide 0.22s ease",
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
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    display: "flex",
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
    gap: 8,
    width: "100%",
    padding: "8px 8px",
    borderRadius: 8,
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
  },
  channelItemActive: {
    background: "var(--elevated)",
    color: "var(--text)",
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
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: 4,
    display: "flex",
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
    alignItems: "flex-start",
    animation: "wave-message-in 0.25s ease",
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
    background: "transparent",
    border: "1px solid #2A313C",
    borderRadius: 8,
    color: "var(--muted)",
    cursor: "pointer",
    padding: 6,
    display: "flex",
    flexShrink: 0,
  },
  messageImage: {
    maxWidth: 220,
    maxHeight: 220,
    borderRadius: 10,
    display: "block",
    marginTop: 4,
    border: "1px solid #23293280",
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
    padding: "12px 14px",
    borderTop: "1px solid #23293280",
    flexShrink: 0,
  },
  composerInput: {
    flex: 1,
    background: "var(--elevated)",
    border: "1px solid #2A313C",
    borderRadius: 10,
    padding: "10px 12px",
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
  },
  sendButton: {
    background: "var(--accent)",
    border: "none",
    borderRadius: 10,
    width: 40,
    height: 40,
    color: "#3A2405",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
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
    background: "var(--accent)",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    color: "#3A2405",
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
    background: "#0E1116",
    color: "#E8EAED",
    height: "600px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 20,
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
    color: "#8B94A3",
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 8px",
    cursor: "pointer",
  },
  langSecondaryButton: {
    background: "transparent",
    border: "1px solid #2A313C",
    color: "#E8EAED",
    marginTop: 8,
  },
  loginDot: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "#F2A93B",
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
    color: "#8B94A3",
    margin: "6px 0 22px",
  },
  loginInput: {
    width: "100%",
    boxSizing: "border-box",
    background: "#1C232B",
    border: "1px solid #2A313C",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#E8EAED",
    fontSize: 15,
    outline: "none",
    marginBottom: 10,
  },
  loginButton: {
    width: "100%",
    background: "#F2A93B",
    border: "none",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#3A2405",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
  },
  loginHint: {
    fontSize: 12,
    color: "#8B94A3",
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
    color: "#F2A93B",
    fontSize: 13,
    cursor: "pointer",
    marginTop: 14,
    padding: 0,
  },
};
