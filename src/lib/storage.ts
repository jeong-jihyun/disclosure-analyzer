"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { CompanyInfo } from "./types";

export const FAV_KEY = "dr:favorites";
export const RECENT_KEY = "dr:recent";

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function readRaw(key: string): string {
  try {
    return localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]"; // 사생활 보호 모드 등에서 저장소가 막힌 경우
  }
}

function write(key: string, list: CompanyInfo[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* 저장 실패는 조용히 무시 */
  }
  listeners.forEach((l) => l());
}

export function useStoredList(key: string): CompanyInfo[] {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => "[]",
  );
  return useMemo(() => {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? (v as CompanyInfo[]) : [];
    } catch {
      return [];
    }
  }, [raw]);
}

const slim = (c: CompanyInfo): CompanyInfo => ({ code: c.code, name: c.name, stockCode: c.stockCode, market: c.market });

export function toggleFavorite(c: CompanyInfo) {
  const list = JSON.parse(readRaw(FAV_KEY)) as CompanyInfo[];
  const exists = list.some((x) => x.code === c.code);
  write(FAV_KEY, exists ? list.filter((x) => x.code !== c.code) : [slim(c), ...list]);
}

export function pushRecent(c: CompanyInfo) {
  const list = JSON.parse(readRaw(RECENT_KEY)) as CompanyInfo[];
  write(RECENT_KEY, [slim(c), ...list.filter((x) => x.code !== c.code)].slice(0, 10));
}

export function clearRecent() {
  write(RECENT_KEY, []);
}
