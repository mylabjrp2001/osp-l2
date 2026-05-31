import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ZONES, ALL_ZONE_TEAMS, PRIORITY_ORDER } from "./theme.js";
import { inRange } from "./utils.js";

const FilterCtx = createContext(null);

const DEFAULT_START = "2026-03-01";
const DEFAULT_END = "2026-03-31";
const STORAGE_KEY = "dmp.filters.v1";

function loadPersisted() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    // Basic validation
    if (!obj || typeof obj !== "object") return null;
    return {
      start: typeof obj.start === "string" ? obj.start : null,
      end: typeof obj.end === "string" ? obj.end : null,
      zones: Array.isArray(obj.zones) ? obj.zones.filter((z) => ZONES.includes(z)) : null,
      teams: Array.isArray(obj.teams) ? obj.teams.filter((t) => ALL_ZONE_TEAMS.includes(t)) : null,
      priorities: Array.isArray(obj.priorities)
        ? obj.priorities.filter((p) => PRIORITY_ORDER.includes(p))
        : null,
    };
  } catch {
    return null;
  }
}

function clearPersisted() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function FilterProvider({ children, dateMin, dateMax }) {
  // Initial state: read from localStorage if present; else defaults.
  const persisted = loadPersisted();
  const [start, setStart] = useState(persisted?.start || DEFAULT_START);
  const [end, setEnd] = useState(persisted?.end || DEFAULT_END);
  const [zones, setZones] = useState(persisted?.zones?.length ? persisted.zones : ZONES);
  const [teams, setTeams] = useState(persisted?.teams?.length ? persisted.teams : ALL_ZONE_TEAMS);
  const [priorities, setPriorities] = useState(
    persisted?.priorities?.length ? persisted.priorities : PRIORITY_ORDER
  );

  // Persist whenever any filter changes.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ start, end, zones, teams, priorities })
      );
    } catch {
      /* ignore quota errors */
    }
  }, [start, end, zones, teams, priorities]);

  const value = useMemo(
    () => ({
      start,
      end,
      zones,
      teams,
      priorities,
      dateMin,
      dateMax,
      setStart,
      setEnd,
      setZones,
      setTeams,
      setPriorities,
      reset: () => {
        clearPersisted();
        setStart(DEFAULT_START);
        setEnd(DEFAULT_END);
        setZones(ZONES);
        setTeams(ALL_ZONE_TEAMS);
        setPriorities(PRIORITY_ORDER);
      },
    }),
    [start, end, zones, teams, priorities, dateMin, dateMax]
  );

  return <FilterCtx.Provider value={value}>{children}</FilterCtx.Provider>;
}

export function useFilters() {
  const v = useContext(FilterCtx);
  if (!v) throw new Error("useFilters must be inside <FilterProvider />");
  return v;
}

// Apply all filters except those listed in `skip` (e.g., skip "date" or "zone")
export function applyFilters(records, f, skip = []) {
  const skipSet = new Set(skip);
  const out = [];
  for (const r of records) {
    if (!skipSet.has("date") && !inRange(r.d, f.start, f.end)) continue;
    if (!skipSet.has("zone") && !f.zones.includes(r.z)) continue;
    if (!skipSet.has("team")) {
      if (r.t && !f.teams.includes(r.t)) continue;
    }
    if (!skipSet.has("priority")) {
      if (r.p && !f.priorities.includes(r.p)) continue;
    }
    out.push(r);
  }
  return out;
}
