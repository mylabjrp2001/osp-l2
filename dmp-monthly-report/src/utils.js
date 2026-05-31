import { useEffect, useState } from "react";
import { MONTHS_EN, MONTHS_TH } from "./theme.js";

export function formatSeconds(s) {
  if (s == null || isNaN(s)) return "—";
  const sign = s < 0 ? "-" : "";
  const abs = Math.abs(Math.round(s));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const sec = abs % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function parseISODate(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function inRange(dStr, start, end) {
  return dStr >= start && dStr <= end;
}

export function monthLabelEN(year, monthIndex) {
  return `${MONTHS_EN[monthIndex]} ${year}`;
}

export function monthLabelTH(year, monthIndex) {
  return `${MONTHS_TH[monthIndex]} ${String(year + 543).slice(-2)}`;
}

export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function monthKey(dStr) {
  // returns "YYYY-MM"
  return dStr.slice(0, 7);
}

export function monthKeyToLabel(mk) {
  const [y, m] = mk.split("-").map(Number);
  return MONTHS_EN[m - 1];
}

export function monthKeyToYearLabel(mk) {
  const [y, m] = mk.split("-").map(Number);
  return `${MONTHS_EN[m - 1]} ${y}`;
}

export function pct(num, den) {
  if (!den) return 0;
  return (num / den) * 100;
}

export function fmtPct(v, digits = 2) {
  if (v == null || isNaN(v)) return "—";
  return `${v.toFixed(digits)}%`;
}

export function uniq(arr) {
  return Array.from(new Set(arr));
}

export function groupBy(arr, fn) {
  const out = new Map();
  for (const x of arr) {
    const k = fn(x);
    if (!out.has(k)) out.set(k, []);
    out.get(k).push(x);
  }
  return out;
}

export function sum(arr) {
  let s = 0;
  for (const x of arr) s += x || 0;
  return s;
}

export function mean(arr) {
  const vals = arr.filter((v) => v != null && !isNaN(v));
  if (!vals.length) return null;
  return sum(vals) / vals.length;
}

export function dayOfMonth(dStr) {
  return parseInt(dStr.slice(8, 10), 10);
}

// useState-like hook that mirrors its value to localStorage so it survives reloads.
export function usePersistedState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota or disabled */
    }
  }, [key, value]);
  return [value, setValue];
}
