// src/GaugePage.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./GaugePage.css";

/**
 * Standard Steel gauge thickness table (mm)
 * (You can tweak this anytime if your market uses slightly different mapping.)
 */
const STEEL_GAUGE_MM = {
  1: 7.145,
  2: 6.746,
  3: 6.073,
  4: 5.695,
  5: 5.314,
  6: 4.935,
  7: 4.554,
  8: 4.176,
  9: 3.797,
  10: 3.416,
  11: 3.038,
  12: 2.657,
  13: 2.278,
  14: 1.897,
  15: 1.709,
  16: 1.519,
  17: 1.367,
  18: 1.214,
  19: 1.062,
  20: 0.912,
  21: 0.836,
  22: 0.759,
  23: 0.683,
  24: 0.607,
  25: 0.531,
  26: 0.455,
  27: 0.417,
  28: 0.378,
  29: 0.343,
  30: 0.305,
  31: 0.267,
  32: 0.246,
  33: 0.229,
  34: 0.208,
  35: 0.191,
};

// Your market rule examples:
// 100 reading => 20 Gauge
// 120 reading => 18 Gauge
// 300 reading => 3 mm (not gauge)
// This page assumes your "reading" is like: 100 => 1.00mm, 120 => 1.20mm, 300 => 3.00mm

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const toCleanNumber = (raw) => {
  if (raw === null || raw === undefined) return NaN;
  let s = String(raw).trim();
  if (!s) return NaN;

  // allow "1,2" as 1.2 (if user types comma decimal)
  if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");

  // remove "mm" if user writes it
  s = s.replace(/mm/gi, "").trim();

  // remove spaces
  s = s.replace(/\s+/g, "");

  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

/**
 * Convert input into thickness in mm.
 * - If user types decimals like "1.2" => treat as mm directly
 * - If user types whole number like "120" => treat as reading => 120 => 1.20mm
 */
const inputToThicknessMM = (rawInput) => {
  const s = String(rawInput ?? "").trim();
  if (!s) return NaN;

  const hasDecimal = s.includes(".");
  const n = toCleanNumber(s);
  if (!Number.isFinite(n)) return NaN;

  if (hasDecimal) return n; // already mm
  return n / 100; // reading => mm
};

const buildCalibratedTable = () => {
  // We calibrate slightly so that:
  // 20g becomes exactly 1.00mm (because you said 100 => 20g)
  // 18g becomes exactly 1.20mm (because you said 120 => 18g)
  const s20 = 1.0 / STEEL_GAUGE_MM[20];
  const s18 = 1.2 / STEEL_GAUGE_MM[18];

  const gauges = Object.keys(STEEL_GAUGE_MM)
    .map((k) => Number(k))
    .sort((a, b) => a - b);

  const rows = gauges.map((g) => {
    let scale = s18;

    if (g >= 20) scale = s20;
    else if (g <= 18) scale = s18;
    else {
      // g = 19 => interpolate between 20 and 18
      const t = (20 - g) / (20 - 18); // 19 => 0.5
      scale = s20 + (s18 - s20) * clamp(t, 0, 1);
    }

    const mm = STEEL_GAUGE_MM[g] * scale;
    return { gauge: g, mm };
  });

  return rows;
};

export default function GaugePage() {
  const gaugeTable = useMemo(() => buildCalibratedTable(), []);
  const [reading, setReading] = useState("");
  const [preferMMOver3, setPreferMMOver3] = useState(true);
  const [result, setResult] = useState({ text: "—", sub: "" });
  const [error, setError] = useState("");

  const compute = (val) => {
    const thicknessMM = inputToThicknessMM(val);

    if (!Number.isFinite(thicknessMM)) {
      setError("Enter a valid reading (example: 100, 120, 150) or mm (example: 1.2).");
      setResult({ text: "—", sub: "" });
      return;
    }

    setError("");

    // Your rule: 300 => 3mm, 400 => 4mm (i.e., >= 3.00mm show mm)
    if (preferMMOver3 && thicknessMM >= 3) {
      const nice = (Math.round(thicknessMM * 100) / 100).toString();
      setResult({ text: `${nice} mm`, sub: "Rule: 3mm+ shows mm (not gauge)." });
      return;
    }

    // Find nearest gauge by thickness
    let best = gaugeTable[0];
    let bestDiff = Math.abs(thicknessMM - best.mm);

    for (const row of gaugeTable) {
      const diff = Math.abs(thicknessMM - row.mm);
      if (diff < bestDiff) {
        best = row;
        bestDiff = diff;
      }
    }

    // Display gauge only (your requirement)
    const approx = Math.round(best.mm * 100) / 100;
    setResult({
      text: `${best.gauge} Gauge`,
      sub: `≈ ${approx} mm (Reading ≈ ${(approx * 100).toFixed(0)})`,
    });
  };

  // live compute while typing
  useEffect(() => {
    if (!reading.trim()) {
      setError("");
      setResult({ text: "—", sub: "" });
      return;
    }
    compute(reading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading, preferMMOver3]);

  return (
    <div className="gpage">
      <div className="gpageTop">
        <div className="gpageTitle">
          <div className="gpageBadge">Ayan Steel</div>
          <h1>Gauge Calculator</h1>
          <p>Type a reading like <b>100</b> or <b>120</b> and get Gauge instantly.</p>
        </div>

        <div className="gpageActions">
          <Link className="gbtn ghost" to="/ledger">
            ← Back to Ledger
          </Link>
        </div>
      </div>

      <div className="ggrid">
        <div className="gcard">
          <div className="gcardHead">
            <h2>Enter Reading</h2>
            <span className="ghint">Examples: 100 → 20G, 120 → 18G, 300 → 3mm</span>
          </div>

          <label className="glabel">Reading</label>
          <div className="ginputRow">
            <input
              className="ginput"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              placeholder="Example: 100"
              inputMode="decimal"
            />
            <button
              className="gbtn"
              onClick={() => compute(reading)}
              type="button"
              title="Calculate"
            >
              Calculate
            </button>
          </div>

          <div className="gchecks">
            <label className="gcheck">
              <input
                type="checkbox"
                checked={preferMMOver3}
                onChange={(e) => setPreferMMOver3(e.target.checked)}
              />
              <span>For 300+ show mm (3mm, 4mm...) instead of Gauge</span>
            </label>
          </div>

          {error ? <div className="gerror">{error}</div> : null}

          <div className="gmini">
            <div className="gchip" onClick={() => setReading("100")}>100</div>
            <div className="gchip" onClick={() => setReading("120")}>120</div>
            <div className="gchip" onClick={() => setReading("150")}>150</div>
            <div className="gchip" onClick={() => setReading("180")}>180</div>
            <div className="gchip" onClick={() => setReading("200")}>200</div>
            <div className="gchip" onClick={() => setReading("300")}>300</div>
            <div className="gchip" onClick={() => setReading("400")}>400</div>
          </div>
        </div>

        <div className="gcard result">
          <div className="gcardHead">
            <h2>Result</h2>
            <span className="ghint">Shows Gauge (or mm if 3mm+ rule is ON)</span>
          </div>

          <div className="gresultBox">
            <div className="gresultMain">{result.text}</div>
            {result.sub ? <div className="gresultSub">{result.sub}</div> : <div className="gresultSub">—</div>}
          </div>

          <div className="gnote">
            <b>Note:</b> If your market mapping is slightly different, tell me 2–3 more examples
            (like “90 = ? gauge”, “150 = ? gauge”) and I will tune the table perfectly.
          </div>
        </div>
      </div>
    </div>
  );
}
