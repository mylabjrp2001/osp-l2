import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, ResponsiveContainer, LabelList } from "recharts";

const ZONE_DATA = {
  all: [
    { zone: "Latkrabang", count: 767 },
    { zone: "Pathumthani", count: 819 },
  ],
  January: [
    { zone: "Latkrabang", count: 177 },
    { zone: "Pathumthani", count: 203 },
  ],
  February: [
    { zone: "Latkrabang", count: 161 },
    { zone: "Pathumthani", count: 182 },
  ],
  Mar: [
    { zone: "Latkrabang", count: 178 },
    { zone: "Pathumthani", count: 170 },
  ],
  April: [
    { zone: "Latkrabang", count: 159 },
    { zone: "Pathumthani", count: 160 },
  ],
  May: [
    { zone: "Latkrabang", count: 92 },
    { zone: "Pathumthani", count: 104 },
  ],
};

const MONTHS = ["all", "January", "February", "Mar", "April", "May"];
const MONTH_LABELS = {
  all: "ทั้งหมด",
  January: "มกราคม",
  February: "กุมภาพันธ์",
  Mar: "มีนาคม",
  April: "เมษายน",
  May: "พฤษภาคม",
};

const TARGET_MAP = {
  all: 1300,
  January: 260,
  February: 260,
  Mar: 260,
  April: 260,
  May: 260,
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{
        background: "#1a1a2e",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "10px 16px",
        color: "#fff",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.zone}</div>
        <div>จำนวนงาน: <span style={{ fontWeight: 700, color: d.count >= (TARGET_MAP["all"] / 2) ? "#00e676" : "#ff5252" }}>{d.count}</span></div>
      </div>
    );
  }
  return null;
};

export default function JobTotalByZone() {
  const [selectedMonth, setSelectedMonth] = useState("all");
  const data = ZONE_DATA[selectedMonth];
  const target = TARGET_MAP[selectedMonth];
  const maxVal = Math.max(target, ...data.map(d => d.count));
  const yMax = Math.ceil(maxVal * 1.2 / 50) * 50;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)",
      fontFamily: "'DM Sans', sans-serif",
      padding: "32px 24px",
      color: "#e0e0e0",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ maxWidth: 800, margin: "0 auto 24px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
        }}>
          <div style={{
            width: 4,
            height: 32,
            borderRadius: 2,
            background: "linear-gradient(180deg, #00e676, #00bfa5)",
          }} />
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            color: "#fff",
            letterSpacing: "-0.02em",
          }}>
            JOB TOTAL IN ZONE
          </h1>
        </div>
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.45)",
          margin: "0 0 0 16px",
        }}>
          Data Job Done 2026 • นับจำนวนงานแยกตามโซน (ASSIGN_TO → Zone)
        </p>
      </div>

      {/* Month Filter */}
      <div style={{
        maxWidth: 800,
        margin: "0 auto 28px",
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
      }}>
        {MONTHS.map(m => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              border: selectedMonth === m ? "none" : "1px solid rgba(255,255,255,0.15)",
              background: selectedMonth === m
                ? "linear-gradient(135deg, #00e676, #00bfa5)"
                : "rgba(255,255,255,0.05)",
              color: selectedMonth === m ? "#0f0c29" : "rgba(255,255,255,0.7)",
              fontWeight: selectedMonth === m ? 700 : 400,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
            }}
          >
            {MONTH_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{
        maxWidth: 800,
        margin: "0 auto",
        background: "rgba(255,255,255,0.03)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 24px 16px",
      }}>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={data} margin={{ top: 40, right: 30, left: 10, bottom: 20 }} barCategoryGap="35%">
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(255,255,255,0.07)"
              vertical={false}
            />
            <XAxis
              dataKey="zone"
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 500 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              dy={8}
            />
            <YAxis
              domain={[0, yMax]}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Count of JB_ID",
                angle: -90,
                position: "insideLeft",
                offset: 0,
                style: { fill: "rgba(255,255,255,0.35)", fontSize: 12 },
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <ReferenceLine
              y={target}
              stroke="#42a5f5"
              strokeDasharray="10 6"
              strokeWidth={2.5}
              label={{
                value: `Job Target ${target} Per Area`,
                position: "insideTopLeft",
                fill: "#42a5f5",
                fontSize: 13,
                fontWeight: 500,
                dy: -10,
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={140}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.count >= target
                    ? "url(#greenGrad)"
                    : "url(#redGrad)"}
                />
              ))}
              <LabelList
                dataKey="count"
                position="top"
                style={{
                  fill: "#fff",
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                }}
                offset={12}
              />
            </Bar>
            <defs>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e676" />
                <stop offset="100%" stopColor="#00c853" />
              </linearGradient>
              <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff5252" />
                <stop offset="100%" stopColor="#d32f2f" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 28,
          marginTop: 8,
          fontSize: 13,
          color: "rgba(255,255,255,0.5)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: "linear-gradient(180deg, #00e676, #00c853)" }} />
            <span>ถึงเป้าหมาย</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: "linear-gradient(180deg, #ff5252, #d32f2f)" }} />
            <span>ยังไม่ถึงเป้าหมาย</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 0, borderTop: "2.5px dashed #42a5f5" }} />
            <span>Target</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        maxWidth: 800,
        margin: "24px auto 0",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}>
        {[
          { label: "Latkrabang", value: data[0].count, color: data[0].count >= target ? "#00e676" : "#ff5252" },
          { label: "Pathumthani", value: data[1].count, color: data[1].count >= target ? "#00e676" : "#ff5252" },
          { label: "รวมทั้งหมด", value: data[0].count + data[1].count, color: "#42a5f5" },
        ].map((card, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: "20px 16px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {card.label}
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: card.color }}>
              {card.value}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
              jobs
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
