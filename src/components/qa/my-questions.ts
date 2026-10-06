import { useSyncExternalStore } from "react";
import { MY_QUESTIONS_STORAGE_KEY, TOKEN_PATTERN } from "@/lib/qa";

// "Sorduklarım": bu tarayıcıdan gönderilen soruların takip anahtarları.
// Yalnız bu cihazda durur; sunucuya hiçbir zaman liste olarak yazılmaz.
// Depolama kapalıysa (gizli pencere, dolu alan) liste sessizce boş kalır.

export type MyQuestion = { token: string; question: string; createdAt: string };

export const MY_QUESTIONS_MAX = 20;
const SYNC_EVENT = "hedefim:sorularim-updated";
const EMPTY: MyQuestion[] = [];

let cachedRaw: string | null = null;
let cachedList: MyQuestion[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(MY_QUESTIONS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string): MyQuestion[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return EMPTY;
    const seen = new Set<string>();
    const list: MyQuestion[] = [];
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const { token, question, createdAt } = item as Record<string, unknown>;
      if (typeof token !== "string" || !TOKEN_PATTERN.test(token) || seen.has(token)) continue;
      seen.add(token);
      list.push({
        token,
        question: typeof question === "string" ? question.slice(0, 400) : "",
        createdAt: typeof createdAt === "string" ? createdAt : "",
      });
    }
    return list.slice(0, MY_QUESTIONS_MAX);
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): MyQuestion[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = raw ? parse(raw) : EMPTY;
  }
  return cachedList;
}

const getServerSnapshot = () => EMPTY;

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === MY_QUESTIONS_STORAGE_KEY) onChange();
  };
  window.addEventListener(SYNC_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SYNC_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Listeyi yazar; yazılamadıysa false döner. */
function write(list: MyQuestion[]): boolean {
  try {
    window.localStorage.setItem(MY_QUESTIONS_STORAGE_KEY, JSON.stringify(list.slice(0, MY_QUESTIONS_MAX)));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(SYNC_EVENT));
  return true;
}

/** En yenisi başta; aynı anahtar ikinci kez eklenmez. Kaydedildiyse true. */
export function rememberQuestion(entry: MyQuestion): boolean {
  if (!TOKEN_PATTERN.test(entry.token)) return false;
  const rest = getSnapshot().filter((item) => item.token !== entry.token);
  return write([entry, ...rest]);
}

export function forgetQuestion(token: string): boolean {
  return write(getSnapshot().filter((item) => item.token !== token));
}

export function useMyQuestions(): MyQuestion[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
