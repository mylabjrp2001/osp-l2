import React from "react";
import { useFilters } from "../filters.jsx";
import { ZONES, ALL_ZONE_TEAMS, TEAMS, PRIORITY_ORDER, COLORS, MONTHS_TH } from "../theme.js";

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function monthPreset(year, monthIdx) {
  const start = new Date(year, monthIdx, 1);
  const end = new Date(year, monthIdx + 1, 0);
  return {
    label: `${MONTHS_TH[monthIdx]} ${String(year + 543).slice(-2)}`,
    start: iso(start),
    end: iso(end),
  };
}

function buildPresets(dateMin, dateMax) {
  if (!dateMax) return [];
  const [y, m] = dateMax.slice(0, 7).split("-").map(Number);
  const latest = new Date(y, m - 1, 1);
  // 4 most recent months: this month + 3 prior
  const months = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date(latest.getFullYear(), latest.getMonth() - i, 1);
    months.push(monthPreset(d.getFullYear(), d.getMonth()));
  }
  // Quarter of the latest month
  const qStartMonth = Math.floor(latest.getMonth() / 3) * 3;
  const qStart = new Date(latest.getFullYear(), qStartMonth, 1);
  const qEnd = new Date(latest.getFullYear(), qStartMonth + 3, 0);
  const qLabel = `Q${Math.floor(qStartMonth / 3) + 1} ${String(latest.getFullYear() + 543).slice(-2)}`;
  // Last 6 months ending at latest
  const sixStart = new Date(latest.getFullYear(), latest.getMonth() - 5, 1);
  const sixEnd = new Date(latest.getFullYear(), latest.getMonth() + 1, 0);
  return [
    ...months,
    { label: qLabel, start: iso(qStart), end: iso(qEnd) },
    { label: "6 เดือนล่าสุด", start: iso(sixStart), end: iso(sixEnd) },
    { label: "ทั้งหมด", start: dateMin, end: dateMax },
  ];
}

function Chip({ active, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 16,
        border: active ? "none" : "1px solid #d4d4dc",
        background: active
          ? color || "linear-gradient(135deg, #A8D75A, #6fb720)"
          : "#ffffff",
        color: active ? "#1f3a05" : "#555",
        fontWeight: active ? 700 : 500,
        fontSize: 12,
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: active ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function toggle(arr, x) {
  return arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x];
}

export default function FilterBar() {
  const f = useFilters();
  const visibleTeams = f.zones.flatMap((z) => TEAMS[z] || []);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e6e6ea",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Date range */}
        <div>
          <div style={labelStyle}>ช่วงวันที่</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="date"
              value={f.start}
              min={f.dateMin}
              max={f.end}
              onChange={(e) => f.setStart(e.target.value)}
              style={inputStyle}
            />
            <span style={{ color: "#8b8b96" }}>—</span>
            <input
              type="date"
              value={f.end}
              min={f.start}
              max={f.dateMax}
              onChange={(e) => f.setEnd(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#8b8b96",
              marginTop: 4,
            }}
          >
            ข้อมูลพร้อม: {f.dateMin} → {f.dateMax}
          </div>
        </div>

        {/* Quick presets */}
        <div>
          <div style={labelStyle}>เลือกเร็ว</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {buildPresets(f.dateMin, f.dateMax).map(({ label, start, end }) => (
              <Chip
                key={label}
                active={f.start === start && f.end === end}
                onClick={() => {
                  f.setStart(start);
                  f.setEnd(end);
                }}
              >
                {label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Zone */}
        <div>
          <div style={labelStyle}>โซน</div>
          <div style={{ display: "flex", gap: 6 }}>
            {ZONES.map((z) => (
              <Chip
                key={z}
                active={f.zones.includes(z)}
                onClick={() => f.setZones(toggle(f.zones, z))}
              >
                {z}
              </Chip>
            ))}
          </div>
        </div>

        {/* Team */}
        <div>
          <div style={labelStyle}>ทีม</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {visibleTeams.map((t) => (
              <Chip
                key={t}
                active={f.teams.includes(t)}
                onClick={() => f.setTeams(toggle(f.teams, t))}
              >
                {t}
              </Chip>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <div style={labelStyle}>Priority</div>
          <div style={{ display: "flex", gap: 6 }}>
            {PRIORITY_ORDER.map((p) => (
              <Chip
                key={p}
                color={COLORS.priority[p]}
                active={f.priorities.includes(p)}
                onClick={() => f.setPriorities(toggle(f.priorities, p))}
              >
                {p}
              </Chip>
            ))}
          </div>
        </div>

        {/* Reset */}
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={f.reset}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #d4d4dc",
              background: "#ffffff",
              color: "#555",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            รีเซ็ต
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 11,
  color: "#8b8b96",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 6,
};

const inputStyle = {
  background: "#ffffff",
  border: "1px solid #d4d4dc",
  borderRadius: 6,
  padding: "6px 10px",
  color: "#1f1f2c",
  fontSize: 13,
};
