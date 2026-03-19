// src/Ledger.js ✅ AYAN STEEL — INDUSTRIAL COMMAND CENTER (REFINED TOPBAR + MODERN CLIENT CARDS)
// ✅ No App.js change, No new Sidebar component
// ✅ Core logic (API + calculations) unchanged
// ✅ Features kept: Client Phone (localStorage), Pin/Star clients, Filters (All/Pinned/Warning/Alert)
// ✅ Dark theme toggle (saved in localStorage)
// ✅ Qty Sold Trend chart (Daily / Weekly / Monthly)
// ✅ Doughnut-style Payment chart
// ✅ NEW: Download Dashboard Summary PDF (Clients + Receive/Received/Advance + Risk + Table)
// ✅ FIXED: PDF spacing improved + Balance column fully visible (table fits A4)
// ✅ NEW (your request): Payment Credit Trend (Daily / Weekly / Monthly)

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "./api";
import Swal from "sweetalert2";

// ✅ PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Charts
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

/* -----------------------------
   THEME (Steel/Industrial)
------------------------------ */
const THEME_KEY = "ayan_theme_v1";

const buildTheme = (dark = false) => {
  if (!dark) {
    return {
      mode: "light",

      // backdrops
      bgA: "#F6F8FB",
      bgB: "#FFFFFF",
      bgC: "#EEF2F7",

      // inks
      ink: "#0B1220",
      ink2: "#0F172A",
      muted: "#52607A",
      muted2: "#8A96AD",

      // strokes
      stroke: "rgba(15,23,42,0.12)",
      stroke2: "rgba(15,23,42,0.08)",

      // accents (industrial)
      primary: "#06B6D4",
      primary2: "#0891B2",
      primarySoft: "rgba(6,182,212,0.14)",

      steel: "#64748B",
      steel2: "#334155",
      steelSoft: "rgba(100,116,139,0.12)",

      success: "#16A34A",
      warning: "#D97706",
      danger: "#DC2626",
      purple: "#7C3AED",
      cyan: "#06B6D4",

      glass: "rgba(255,255,255,0.72)",
      glass2: "rgba(255,255,255,0.88)",

      card: "rgba(255,255,255,0.92)",
      card2: "rgba(255,255,255,0.78)",

      shadow: "0 18px 55px rgba(15,23,42,0.10)",
      shadowSoft: "0 14px 34px rgba(15,23,42,0.08)",
    };
  }

  return {
    mode: "dark",

    bgA: "#070B12",
    bgB: "#0B1220",
    bgC: "#0A1426",

    ink: "#E5E7EB",
    ink2: "#F3F4F6",
    muted: "#A7B0C0",
    muted2: "#7C869B",

    stroke: "rgba(148,163,184,0.18)",
    stroke2: "rgba(148,163,184,0.12)",

    primary: "#22D3EE",
    primary2: "#06B6D4",
    primarySoft: "rgba(34,211,238,0.16)",

    steel: "#94A3B8",
    steel2: "#CBD5E1",
    steelSoft: "rgba(148,163,184,0.14)",

    success: "#34D399",
    warning: "#FBBF24",
    danger: "#FB7185",
    purple: "#A78BFA",
    cyan: "#22D3EE",

    glass: "rgba(17, 24, 39, 0.56)",
    glass2: "rgba(17, 24, 39, 0.72)",

    card: "rgba(17,24,39,0.70)",
    card2: "rgba(17,24,39,0.54)",

    shadow: "0 20px 65px rgba(0,0,0,0.46)",
    shadowSoft: "0 14px 34px rgba(0,0,0,0.38)",
  };
};

/* -----------------------------
   Icons (inline SVG)
------------------------------ */
const Icon = ({ name, size = 18 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "menu":
      return (
        <svg {...common}>
          <path {...stroke} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...common}>
          <path {...stroke} d="M20 12a8 8 0 10-2.34 5.66" />
          <path {...stroke} d="M20 12v-6h-6" />
        </svg>
      );

    case "download":
      return (
        <svg {...common}>
          <path {...stroke} d="M12 3v10" />
          <path {...stroke} d="M8 11l4 4 4-4" />
          <path {...stroke} d="M4 17v3h16v-3" />
        </svg>
      );

    case "ruler":
      return (
        <svg {...common}>
          <path {...stroke} d="M4 7h16M4 17h16" />
          <path {...stroke} d="M6 7v4M10 7v2M14 7v4M18 7v2" />
          <path {...stroke} d="M6 17v-4M10 17v-2M14 17v-4M18 17v-2" />
        </svg>
      );

    case "bell":
      return (
        <svg {...common}>
          <path
            {...stroke}
            d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"
          />
          <path {...stroke} d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path
            {...stroke}
            d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"
          />
          <path
            {...stroke}
            d="M19.4 15a1.7 1.7 0 00.34 1.87l.05.05a2 2 0 01-1.41 3.41 2 2 0 01-1.41-.59l-.05-.05A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 .31 1.7 1.7 0 00-.69.86 1.7 1.7 0 00-.06 1.13A2 2 0 0110 22a2 2 0 01-.93-2.72 1.7 1.7 0 00.06-1.13 1.7 1.7 0 00-.69-.86 1.7 1.7 0 00-1-.31 1.7 1.7 0 00-1.87.34l-.05.05A2 2 0 013 18.99a2 2 0 01.59-1.41l.05-.05A1.7 1.7 0 004.6 15a1.7 1.7 0 00-.31-1 1.7 1.7 0 00-.86-.69 1.7 1.7 0 00-1.13-.06A2 2 0 012 12a2 2 0 012.72-.93 1.7 1.7 0 001.13.06 1.7 1.7 0 00.86-.69 1.7 1.7 0 00.31-1 1.7 1.7 0 00-.34-1.87l-.05-.05A2 2 0 015.01 3a2 2 0 011.41.59l.05.05A1.7 1.7 0 009 4.6a1.7 1.7 0 001-.31 1.7 1.7 0 00.69-.86 1.7 1.7 0 00.06-1.13A2 2 0 0112 2a2 2 0 01.93 2.72 1.7 1.7 0 00-.06 1.13 1.7 1.7 0 00.69.86 1.7 1.7 0 001 .31 1.7 1.7 0 001.87-.34l.05-.05A2 2 0 0120.99 5a2 2 0 01-.59 1.41l-.05.05A1.7 1.7 0 0019.4 9c.22.33.31.71.31 1s-.09.67-.31 1z"
          />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path {...stroke} d="M3 11l9-8 9 8" />
          <path {...stroke} d="M5 10v10h14V10" />
        </svg>
      );
    case "cash":
      return (
        <svg {...common}>
          <path {...stroke} d="M3 7h18v10H3V7z" />
          <path {...stroke} d="M7 12h.01M17 12h.01" />
          <path {...stroke} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path {...stroke} d="M4 19V5" />
          <path {...stroke} d="M4 19h16" />
          <path {...stroke} d="M8 15l3-3 3 2 5-6" />
        </svg>
      );
    case "box":
      return (
        <svg {...common}>
          <path {...stroke} d="M21 8l-9-5-9 5 9 5 9-5z" />
          <path {...stroke} d="M12 13v8" />
          <path {...stroke} d="M21 8v8l-9 5-9-5V8" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path
            {...stroke}
            d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z"
          />
          <path {...stroke} d="M9 12l2 2 4-4" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path
            {...stroke}
            d="M12 2l3.1 6.3 7 1-5.05 4.9 1.2 7-6.25-3.3L5.75 21.2l1.2-7L1.9 9.3l7-1L12 2z"
          />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path
            {...stroke}
            d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.08 4.18 2 2 0 014.06 2h3a2 2 0 012 1.72c.12.9.32 1.77.6 2.6a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.48-1.12a2 2 0 012.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0122 16.92z"
          />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path
            {...stroke}
            d="M21 12.6A8.5 8.5 0 1111.4 3a6.5 6.5 0 009.6 9.6z"
          />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <path {...stroke} d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
          <path
            {...stroke}
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </svg>
      );
    default:
      return null;
  }
};

/* -----------------------------
   Helpers (same logic)
------------------------------ */
const safeNum = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/,/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const getSaleValue = (e) => {
  const v = safeNum(
    e?.debit ??
      e?.amount ??
      e?.total ??
      e?.grandTotal ??
      e?.totalAmount ??
      e?.saleAmount ??
      e?.salesAmount ??
      e?.priceTotal ??
      0
  );
  return v;
};

const getQty = (e) => {
  const direct = safeNum(
    e?.quantity ??
      e?.qty ??
      e?.soldQty ??
      e?.soldQuantity ??
      e?.saleQty ??
      e?.totalQty ??
      0
  );
  if (direct > 0) return direct;

  const items =
    (Array.isArray(e?.items) && e.items) ||
    (Array.isArray(e?.products) && e.products) ||
    (Array.isArray(e?.lineItems) && e.lineItems) ||
    (Array.isArray(e?.details) && e.details) ||
    null;

  if (!items) return 0;

  return items.reduce(
    (sum, it) =>
      sum +
      safeNum(
        it?.qty ??
          it?.quantity ??
          it?.soldQty ??
          it?.soldQuantity ??
          it?.saleQty ??
          0
      ),
    0
  );
};

function toDayKey(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}
function toMonthKey(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  } catch {
    return null;
  }
}
function lastNDaysKeys(n = 14) {
  const arr = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr;
}
function lastNMonthsKeys(n = 6) {
  const arr = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    arr.push(`${y}-${m}`);
  }
  return arr;
}
function prettyMonthLabel(key) {
  const [y, m] = key.split("-");
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

/* Weekly helpers (Qty chart) */
function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}
function toWeekKey(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    const { year, week } = getISOWeekNumber(dt);
    return `${year}-W${String(week).padStart(2, "0")}`;
  } catch {
    return null;
  }
}
function lastNWeeksKeys(n = 8) {
  const arr = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const { year, week } = getISOWeekNumber(d);
    arr.push(`${year}-W${String(week).padStart(2, "0")}`);
  }
  return Array.from(new Set(arr));
}
function prettyWeekLabel(key) {
  const [y, w] = key.split("-W");
  return `W${w} '${String(y).slice(2)}`;
}

const isSaleEntry = (e) => {
  const cat = (e?.category || "").toString().trim().toUpperCase();
  if (cat) return cat === "SALE" || cat === "SALES";

  const raw = (e?.ledgerType ?? e?.type ?? e?.entryType ?? "")
    .toString()
    .trim()
    .toUpperCase();

  if (!raw) return false;

  const compact = raw.replace(/[\s_-]/g, "");

  if (compact.includes("PURCHASE")) return false;
  if (compact.includes("EXPENSE")) return false;
  if (compact.includes("ADJUST")) return false;
  if (compact.includes("RETURN") || compact.includes("REFUND")) return false;

  return compact.startsWith("SALES") || compact.startsWith("SALE");
};

function getDaysSinceLastEntry(lastDate) {
  if (!lastDate) return null;
  const now = new Date();
  const last = new Date(lastDate);
  const diffTime = now - last;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getClientStatus(closingBalance, lastDate) {
  const balance = safeNum(closingBalance);
  if (balance === 0) return "normal";

  const daysSince = getDaysSinceLastEntry(lastDate);
  if (daysSince === null) return "normal";

  if (daysSince >= 15) return "danger";
  if (daysSince >= 10) return "warning";
  return "normal";
}

/* -----------------------------
   LocalStorage helpers (kept)
------------------------------ */
const PHONES_KEY = "ayan_client_phones_v1";
const PINS_KEY = "ayan_client_pins_v1";

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value ?? null));
  } catch {
    // ignore
  }
};

/* -----------------------------
   ✅ PDF Logo (same style as ClientLedgerPage)
------------------------------ */
const drawAyanLogo = (doc, x, y) => {
  const w = 62;
  const h = 40;
  const r = 10;

  // subtle shadow
  doc.setFillColor(8, 18, 34);
  doc.roundedRect(x + 2, y + 2, w, h, r, r, "F");

  // outer plate
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(210, 221, 238);
  doc.setLineWidth(1);
  doc.roundedRect(x, y, w, h, r, r, "FD");

  // inner face (navy)
  doc.setFillColor(12, 32, 62);
  doc.setDrawColor(12, 46, 92);
  doc.roundedRect(x + 3, y + 3, w - 6, h - 6, r - 3, r - 3, "FD");

  // cyan corner accents
  doc.setFillColor(0, 196, 204);
  doc.setDrawColor(0, 196, 204);
  doc.triangle(x + w - 18, y + 3, x + w - 3, y + 3, x + w - 3, y + 18, "F");
  doc.triangle(x + 3, y + h - 18, x + 18, y + h - 3, x + 3, y + h - 3, "F");

  // Stylish AS typography
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.text("A", x + 18.8, y + 28.4);
  doc.setFontSize(22);
  doc.text("S", x + 34.8, y + 28.4);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("A", x + 18, y + 27.6);

  doc.setTextColor(0, 196, 204);
  doc.setFontSize(22);
  doc.text("S", x + 34, y + 27.6);
  doc.setTextColor(255, 255, 255);
  doc.text("S", x + 33.2, y + 27.6);

  doc.setLineWidth(1);
};

/* -----------------------------
   Styles (REFINED TOPBAR + CLIENT CARDS)
------------------------------ */
const getStyles = (t) => {
  const pageBg =
    t.mode === "light"
      ? `
        radial-gradient(1100px 620px at 12% 12%, rgba(6,182,212,0.18) 0%, transparent 60%),
        radial-gradient(1000px 560px at 88% 18%, rgba(100,116,139,0.14) 0%, transparent 62%),
        radial-gradient(900px 560px at 40% 92%, rgba(124,58,237,0.10) 0%, transparent 60%),
        linear-gradient(180deg, ${t.bgA} 0%, ${t.bgC} 55%, ${t.bgB} 100%)
      `
      : `
        radial-gradient(1100px 620px at 12% 12%, rgba(34,211,238,0.20) 0%, transparent 60%),
        radial-gradient(1000px 560px at 88% 18%, rgba(148,163,184,0.14) 0%, transparent 62%),
        radial-gradient(900px 560px at 40% 92%, rgba(167,139,250,0.12) 0%, transparent 60%),
        linear-gradient(180deg, ${t.bgA} 0%, ${t.bgC} 60%, ${t.bgB} 100%)
      `;

  return {
    page: {
      minHeight: "100vh",
      background: pageBg,
      color: t.ink,
      padding: 14,
    },

    // ✅ full width shell
    shell: {
      width: "100%",
      maxWidth: "100%",
      margin: "0 auto",
      display: "grid",
      gridTemplateRows: "auto 1fr",
      gap: 14,
    },

    topbar: {
      position: "sticky",
      top: 10,
      zIndex: 50,
      borderRadius: 18,
      border: `1px solid ${t.stroke}`,
      background:
        t.mode === "light"
          ? "rgba(255,255,255,0.70)"
          : "rgba(17,24,39,0.62)",
      backdropFilter: "blur(14px)",
      boxShadow: t.shadow,
      overflow: "hidden",
    },

    topRow: {
      padding: 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },

    navRow: {
      padding: "10px 12px",
      borderTop: `1px solid ${t.stroke2}`,
      background:
        t.mode === "light"
          ? "rgba(255,255,255,0.50)"
          : "rgba(17,24,39,0.44)",
    },

    brand: { display: "flex", alignItems: "center", gap: 12, minWidth: 260 },
    mark: {
      width: 44,
      height: 44,
      borderRadius: 16,
      display: "grid",
      placeItems: "center",
      color: "#fff",
      fontWeight: 1100,
      letterSpacing: 0.6,
      background:
        t.mode === "light"
          ? `linear-gradient(135deg, ${t.steel2} 0%, ${t.primary} 65%)`
          : `linear-gradient(135deg, rgba(203,213,225,0.18) 0%, ${t.primary} 75%)`,
      boxShadow:
        t.mode === "light"
          ? "0 14px 28px rgba(15,23,42,0.12)"
          : "0 14px 28px rgba(0,0,0,0.45)",
      flexShrink: 0,
    },
    brandText: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
    brandTitle: {
      margin: 0,
      fontSize: 16,
      fontWeight: 1100,
      color: t.ink2,
      letterSpacing: 0.2,
      lineHeight: 1.1,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: 520,
    },
    brandSub: {
      margin: 0,
      fontSize: 11,
      fontWeight: 900,
      color: t.muted,
      lineHeight: 1.15,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: 720,
    },

    navTabs: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      justifyContent: "center",
      flexWrap: "nowrap",
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
      paddingBottom: 2,
    },

    tabBtn: (active) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      borderRadius: 999,
      border: `1px solid ${
        active
          ? t.mode === "light"
            ? "rgba(6,182,212,0.38)"
            : "rgba(34,211,238,0.40)"
          : t.stroke
      }`,
      background: active
        ? t.primarySoft
        : t.mode === "light"
        ? "rgba(255,255,255,0.70)"
        : "rgba(17,24,39,0.54)",
      color: active ? t.primary : t.ink2,
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 1000,
      letterSpacing: 0.15,
      userSelect: "none",
      transition: "transform .15s ease, background .15s ease, border .15s ease",
      whiteSpace: "nowrap",
      flexShrink: 0,
    }),

    actions: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      justifyContent: "flex-end",
      flexWrap: "wrap",
    },

    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 16,
      border: `1px solid ${t.stroke}`,
      background:
        t.mode === "light" ? "rgba(255,255,255,0.72)" : "rgba(17,24,39,0.54)",
      color: t.ink2,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      transition: "transform .15s ease, filter .15s ease",
    },

    btnPrimary: {
      padding: "10px 14px",
      borderRadius: 16,
      border: "none",
      cursor: "pointer",
      color: "#fff",
      fontWeight: 1000,
      fontSize: 12,
      letterSpacing: 0.2,
      background: `linear-gradient(135deg, ${t.primary} 0%, ${t.primary2} 100%)`,
      boxShadow:
        t.mode === "light"
          ? "0 12px 26px rgba(6,182,212,0.22)"
          : "0 12px 26px rgba(0,0,0,0.42)",
      transition: "transform .15s ease, filter .15s ease",
      whiteSpace: "nowrap",
    },

    btnGhost: {
      padding: "10px 14px",
      borderRadius: 16,
      border: `1px solid ${t.stroke}`,
      cursor: "pointer",
      color: t.ink2,
      fontWeight: 1000,
      fontSize: 12,
      letterSpacing: 0.2,
      background:
        t.mode === "light" ? "rgba(255,255,255,0.70)" : "rgba(17,24,39,0.54)",
      transition: "transform .15s ease, background .15s ease",
      whiteSpace: "nowrap",
    },

    tinyPill: {
      fontSize: 11,
      fontWeight: 1000,
      padding: "7px 10px",
      borderRadius: 999,
      border: `1px solid ${t.stroke}`,
      background:
        t.mode === "light" ? "rgba(255,255,255,0.76)" : "rgba(17,24,39,0.56)",
      color: t.ink2,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      whiteSpace: "nowrap",
    },

    userPill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 12px",
      borderRadius: 999,
      border: `1px solid ${t.stroke}`,
      background:
        t.mode === "light" ? "rgba(255,255,255,0.70)" : "rgba(17,24,39,0.54)",
      color: t.ink2,
      fontWeight: 1000,
      fontSize: 12,
      whiteSpace: "nowrap",
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 12,
      background: `linear-gradient(135deg, ${t.steel2} 0%, ${t.primary} 100%)`,
      display: "grid",
      placeItems: "center",
      color: "white",
      fontWeight: 1100,
      fontSize: 12,
    },

    bodyGrid: {
      display: "grid",
      gridTemplateColumns: "1.55fr 0.75fr",
      gap: 14,
      alignItems: "start",
    },

    // cards
    card: {
      borderRadius: 22,
      border: `1px solid ${t.stroke}`,
      background: `linear-gradient(180deg, ${t.card} 0%, ${t.card2} 100%)`,
      boxShadow: t.shadowSoft,
      overflow: "hidden",
    },
    cardPad: { padding: 14 },

    cardHeadRow: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    cardTitle: { margin: 0, fontSize: 13, fontWeight: 1100, color: t.ink2 },
    cardSub: { margin: 0, marginTop: 6, fontSize: 12, fontWeight: 900, color: t.muted },

    // Overview strip
    overviewGrid: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 },

    kpi: (accent) => ({
      gridColumn: "span 3",
      borderRadius: 20,
      border: `1px solid ${t.stroke}`,
      background:
        t.mode === "light"
          ? `linear-gradient(135deg, ${accent}14 0%, rgba(255,255,255,0.92) 58%, ${t.steelSoft} 100%)`
          : `linear-gradient(135deg, ${accent}18 0%, rgba(17,24,39,0.82) 58%, rgba(148,163,184,0.10) 100%)`,
      padding: 14,
      position: "relative",
      overflow: "hidden",
    }),

    kpiLabel: {
      fontSize: 11,
      fontWeight: 1100,
      letterSpacing: 0.85,
      color: t.muted,
      textTransform: "uppercase",
    },
    kpiValue: {
      marginTop: 8,
      fontSize: 20,
      fontWeight: 1200,
      color: t.ink2,
      letterSpacing: "-0.2px",
    },
    kpiHint: { marginTop: 6, fontSize: 12, fontWeight: 900, color: t.muted },

    kpiChip: (accent) => ({
      position: "absolute",
      top: 12,
      right: 12,
      fontSize: 11,
      fontWeight: 1100,
      padding: "6px 10px",
      borderRadius: 999,
      border: `1px solid ${accent}33`,
      background: `${accent}12`,
      color: accent,
      whiteSpace: "nowrap",
    }),

    // section headers
    sectionRow: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "wrap",
      marginTop: 12,
      marginBottom: 10,
    },
    sectionTitle: { margin: 0, fontSize: 14, fontWeight: 1200, color: t.ink2, letterSpacing: 0.1 },

    // Charts grid (inside main column)
    chartsGrid: { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 },
    chartsStack: { display: "grid", gap: 12 },

    segRow: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
    segBtn: (active) => ({
      fontSize: 11,
      fontWeight: 1100,
      padding: "8px 10px",
      borderRadius: 999,
      border: `1px solid ${active ? `${t.primary}44` : t.stroke}`,
      background: active
        ? t.primarySoft
        : t.mode === "light"
        ? "rgba(255,255,255,0.76)"
        : "rgba(17,24,39,0.54)",
      color: active ? t.primary : t.ink2,
      cursor: "pointer",
      userSelect: "none",
    }),

    // side panel widgets
    sideGrid: { display: "grid", gap: 12 },

    badgeRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 },
    badge: (accent) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 10px",
      borderRadius: 999,
      border: `1px solid ${accent}33`,
      background: `${accent}12`,
      color: accent,
      fontSize: 12,
      fontWeight: 1100,
      whiteSpace: "nowrap",
    }),
    dot: (c) => ({ width: 8, height: 8, borderRadius: 999, background: c, boxShadow: `0 0 0 4px ${c}22` }),

    // clients toolbar
    toolbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      padding: 12,
      borderBottom: `1px solid ${t.stroke2}`,
      background: t.mode === "light" ? "rgba(255,255,255,0.55)" : "rgba(17,24,39,0.42)",
    },
    toolbarLeft: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
    toolbarRight: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

    searchWrap: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      borderRadius: 16,
      border: `1px solid ${t.stroke}`,
      background: t.mode === "light" ? "rgba(255,255,255,0.82)" : "rgba(17,24,39,0.54)",
      padding: "10px 12px",
      minWidth: 280,
      maxWidth: 520,
    },
    searchInput: {
      width: "100%",
      border: "none",
      outline: "none",
      background: "transparent",
      color: t.ink2,
      fontSize: 13,
      fontWeight: 950,
    },
    countPill: {
      fontSize: 11,
      fontWeight: 1100,
      padding: "6px 10px",
      borderRadius: 999,
      background: t.primarySoft,
      border: `1px solid ${
        t.mode === "light" ? "rgba(6,182,212,0.25)" : "rgba(34,211,238,0.28)"
      }`,
      color: t.primary,
      whiteSpace: "nowrap",
    },

    filterPill: (active) => ({
      fontSize: 11,
      fontWeight: 1100,
      padding: "8px 10px",
      borderRadius: 999,
      border: `1px solid ${active ? `${t.primary}44` : t.stroke}`,
      background: active
        ? t.primarySoft
        : t.mode === "light"
        ? "rgba(255,255,255,0.82)"
        : "rgba(17,24,39,0.54)",
      color: active ? t.primary : t.ink2,
      cursor: "pointer",
      userSelect: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      whiteSpace: "nowrap",
    }),

    // ✅ Modern client cards list
    clientsList: {
      padding: 12,
      display: "grid",
      gap: 10,
    },

    clientCard: {
      borderRadius: 18,
      border: `1px solid ${t.stroke2}`,
      background:
        t.mode === "light" ? "rgba(255,255,255,0.72)" : "rgba(17,24,39,0.50)",
      backdropFilter: "blur(10px)",
      padding: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },

    leftCluster: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minWidth: 280, flex: "1 1 520px" },
    rightCluster: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end", flex: "1 1 420px" },

    starBtn: (active) => ({
      width: 40,
      height: 40,
      borderRadius: 16,
      border: `1px solid ${active ? "rgba(217,119,6,0.35)" : t.stroke}`,
      background: active
        ? "rgba(217,119,6,0.12)"
        : t.mode === "light"
        ? "rgba(255,255,255,0.86)"
        : "rgba(17,24,39,0.52)",
      color: active ? t.warning : t.muted,
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
    }),

    clientMain: { display: "flex", flexDirection: "column", gap: 6, minWidth: 260 },

    clientLink: { color: t.primary, fontWeight: 1200, textDecoration: "none", fontSize: 13 },

    metaRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },

    miniChip: (accent, filled = false) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 10px",
      borderRadius: 999,
      border: `1px solid ${accent}33`,
      background: filled ? `${accent}14` : (t.mode === "light" ? "rgba(255,255,255,0.70)" : "rgba(17,24,39,0.52)"),
      color: accent,
      fontSize: 11,
      fontWeight: 1100,
      whiteSpace: "nowrap",
    }),

    phoneLine: {
      fontSize: 12,
      fontWeight: 900,
      color: t.muted,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
    },

    btnRow: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

    btnSmall: {
      padding: "9px 12px",
      borderRadius: 14,
      border: "none",
      cursor: "pointer",
      background: `linear-gradient(135deg, ${t.primary} 0%, ${t.primary2} 100%)`,
      color: "#fff",
      fontWeight: 1100,
      fontSize: 12,
      whiteSpace: "nowrap",
    },

    btnSmallGhost: {
      padding: "9px 12px",
      borderRadius: 14,
      border: `1px solid ${t.stroke}`,
      cursor: "pointer",
      background: t.mode === "light" ? "rgba(255,255,255,0.86)" : "rgba(17,24,39,0.52)",
      color: t.ink2,
      fontWeight: 1100,
      fontSize: 12,
      whiteSpace: "nowrap",
    },

    empty: {
      padding: 14,
      fontSize: 13,
      fontWeight: 900,
      color: t.muted,
      textAlign: "center",
    },

    // mobile drawer
    drawerOverlay: {
      position: "fixed",
      inset: 0,
      background: t.mode === "light" ? "rgba(15,23,42,0.40)" : "rgba(0,0,0,0.55)",
      backdropFilter: "blur(6px)",
      zIndex: 999,
      display: "flex",
      justifyContent: "flex-start",
      alignItems: "stretch",
    },
    drawer: {
      width: "86%",
      maxWidth: 380,
      height: "100%",
      padding: 14,
    },
    drawerCard: {
      height: "100%",
      borderRadius: 22,
      border: `1px solid ${t.stroke}`,
      background: t.mode === "light" ? "rgba(255,255,255,0.80)" : "rgba(17,24,39,0.70)",
      backdropFilter: "blur(16px)",
      boxShadow: t.shadow,
      overflow: "hidden",
    },
    drawerHead: {
      padding: 14,
      borderBottom: `1px solid ${t.stroke2}`,
      background:
        t.mode === "light"
          ? "linear-gradient(135deg, rgba(100,116,139,0.14) 0%, rgba(6,182,212,0.14) 100%)"
          : "linear-gradient(135deg, rgba(148,163,184,0.10) 0%, rgba(34,211,238,0.14) 100%)",
    },
    drawerBody: { padding: 12, display: "grid", gap: 10 },

    navItem: (active) => ({
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      padding: 12,
      borderRadius: 16,
      border: `1px solid ${active ? `${t.primary}44` : "transparent"}`,
      background: active ? t.primarySoft : "transparent",
      cursor: "pointer",
      color: t.ink2,
      fontWeight: 1100,
      fontSize: 13,
    }),

    navLeft: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
    navIcon: (accent) => ({
      width: 38,
      height: 38,
      borderRadius: 16,
      display: "grid",
      placeItems: "center",
      background: `${accent}14`,
      border: `1px solid ${accent}2A`,
      color: accent,
      flexShrink: 0,
    }),
  };
};

function Ledger() {
  const [summary, setSummary] = useState(null);
  const [clients, setClients] = useState([]);
  const [entriesAll, setEntriesAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Search in clients toolbar (kept)
  const [search, setSearch] = useState("");

  // UI only: mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ Phones + pins (no backend)
  const [phoneMap, setPhoneMap] = useState(() => readJSON(PHONES_KEY, {}));
  const [pinnedMap, setPinnedMap] = useState(() => readJSON(PINS_KEY, {}));
  const [filter, setFilter] = useState("ALL"); // ALL | PINNED | WARNING | DANGER

  // ✅ Dark theme toggle
  const [dark, setDark] = useState(() => {
    const saved = readJSON(THEME_KEY, { dark: false });
    return !!saved?.dark;
  });

  const theme = useMemo(() => buildTheme(dark), [dark]);
  const styles = useMemo(() => getStyles(theme), [theme]);

  useEffect(() => writeJSON(PHONES_KEY, phoneMap), [phoneMap]);
  useEffect(() => writeJSON(PINS_KEY, pinnedMap), [pinnedMap]);
  useEffect(() => writeJSON(THEME_KEY, { dark }), [dark]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/ledger");
      const entries = res.data || [];
      setEntriesAll(entries);

      const byClient = {};
      let totalCredit = 0;

      entries.forEach((e) => {
        const name = e.accountName || "Unknown";

        if (!byClient[name]) {
          byClient[name] = {
            accountName: name,
            lastDate: null,
            closingBalance: 0,
            _balance: 0,
          };
        }

        const client = byClient[name];

        const d = e.date ? new Date(e.date) : null;
        if (d && !Number.isNaN(d.getTime()) && (!client.lastDate || d > client.lastDate)) {
          client.lastDate = d;
        }

        const debit = safeNum(e.debit);
        const credit = safeNum(e.credit);

        totalCredit += credit;

        client._balance += credit - debit;
        client.closingBalance = client._balance;
      });

      const clientArray = Object.values(byClient).sort((a, b) =>
        a.accountName.localeCompare(b.accountName)
      );

      const totalDebitFromClosing = clientArray.reduce((sum, c) => {
        const bal = safeNum(c.closingBalance);
        return sum + Math.abs(bal);
      }, 0);

      setSummary({
        totalClients: clientArray.length,
        totalEntries: entries.length,
        totalDebit: totalDebitFromClosing,
        totalCredit,
      });

      setClients(clientArray);
    } catch (err) {
      console.error(err);
      setError("Error loading ledger dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditName = async (oldName) => {
    const { value } = await Swal.fire({
      title: "Edit Account Name",
      input: "text",
      inputValue: oldName,
      inputPlaceholder: "Enter new account name",
      showCancelButton: true,
      confirmButtonText: "Update",
    });

    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed || trimmed === oldName) return;

    try {
      setLoading(true);

      const res = await api.get("/api/ledger", { params: { accountName: oldName } });
      const entries = res.data || [];

      await Promise.all(
        entries.map((e) =>
          api.put(`/api/ledger/${e._id || e.id}`, {
            accountName: trimmed,
          })
        )
      );

      // ✅ keep phone + pin when name changes
      setPhoneMap((prev) => {
        const next = { ...(prev || {}) };
        if (next[oldName]) {
          next[trimmed] = next[oldName];
          delete next[oldName];
        }
        return next;
      });
      setPinnedMap((prev) => {
        const next = { ...(prev || {}) };
        if (next[oldName]) {
          next[trimmed] = true;
          delete next[oldName];
        }
        return next;
      });

      await fetchAll();

      Swal.fire({
        icon: "success",
        title: "Name updated",
        timer: 900,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Error updating account name." });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Phone editor (localStorage)
  const editClientPhoneSafe = async (accountName) => {
    const current = (phoneMap?.[accountName] || "").toString();

    const res = await Swal.fire({
      title: "Client Phone (Optional)",
      input: "text",
      inputValue: current,
      inputPlaceholder: "e.g. 03xx-xxxxxxx",
      showCancelButton: true,
      confirmButtonText: "Save",
      showDenyButton: true,
      denyButtonText: "Remove",
      preConfirm: (val) => (val ?? "").toString().trim(),
    });

    if (res.isDenied) {
      setPhoneMap((prev) => {
        const next = { ...(prev || {}) };
        delete next[accountName];
        return next;
      });
      Swal.fire({ icon: "success", title: "Removed", timer: 800, showConfirmButton: false });
      return;
    }

    if (!res.isConfirmed) return;

    const cleaned = (res.value || "").trim();
    if (!cleaned) {
      setPhoneMap((prev) => {
        const next = { ...(prev || {}) };
        delete next[accountName];
        return next;
      });
      Swal.fire({ icon: "success", title: "Removed", timer: 800, showConfirmButton: false });
      return;
    }

    setPhoneMap((prev) => ({ ...(prev || {}), [accountName]: cleaned }));
    Swal.fire({ icon: "success", title: "Saved", timer: 800, showConfirmButton: false });
  };

  // ✅ Pin toggle
  const togglePin = (accountName) => {
    setPinnedMap((prev) => {
      const next = { ...(prev || {}) };
      if (next[accountName]) delete next[accountName];
      else next[accountName] = true;
      return next;
    });
  };

  const pinnedCount = useMemo(() => Object.keys(pinnedMap || {}).length, [pinnedMap]);

  const filteredClientsBase = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    const base = !q
      ? clients
      : clients.filter((c) => (c.accountName || "").toLowerCase().includes(q));

    const afterFilter = base.filter((c) => {
      if (filter === "ALL") return true;
      if (filter === "PINNED") return !!pinnedMap?.[c.accountName];
      const st = getClientStatus(c.closingBalance, c.lastDate);
      if (filter === "WARNING") return st === "warning";
      if (filter === "DANGER") return st === "danger";
      return true;
    });

    // pinned first then A-Z
    const sorted = [...afterFilter].sort((a, b) => {
      const ap = pinnedMap?.[a.accountName] ? 1 : 0;
      const bp = pinnedMap?.[b.accountName] ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return (a.accountName || "").localeCompare(b.accountName || "");
    });

    return sorted;
  }, [clients, search, filter, pinnedMap]);

  const salesEntries = useMemo(() => entriesAll.filter(isSaleEntry), [entriesAll]);

  const totalSalesValue = useMemo(
    () => salesEntries.reduce((s, e) => s + getSaleValue(e), 0),
    [salesEntries]
  );

  const totalSalesQty = useMemo(
    () => salesEntries.reduce((s, e) => s + getQty(e), 0),
    [salesEntries]
  );

  const dailyKeys = useMemo(() => lastNDaysKeys(14), []);
  const weeklyKeys = useMemo(() => lastNWeeksKeys(8), []);
  const monthlyKeys = useMemo(() => lastNMonthsKeys(6), []);

  // Sales value maps (kept)
  const dailySalesMap = useMemo(() => {
    const map = {};
    salesEntries.forEach((e) => {
      const key = toDayKey(e.date || e.createdAt || e.updatedAt);
      if (!key) return;
      map[key] = (map[key] || 0) + getSaleValue(e);
    });
    return map;
  }, [salesEntries]);

  const monthlySalesMap = useMemo(() => {
    const map = {};
    salesEntries.forEach((e) => {
      const key = toMonthKey(e.date || e.createdAt || e.updatedAt);
      if (!key) return;
      map[key] = (map[key] || 0) + getSaleValue(e);
    });
    return map;
  }, [salesEntries]);

  // ✅ Qty maps
  const dailyQtyMap = useMemo(() => {
    const map = {};
    salesEntries.forEach((e) => {
      const key = toDayKey(e.date || e.createdAt || e.updatedAt);
      if (!key) return;
      map[key] = (map[key] || 0) + getQty(e);
    });
    return map;
  }, [salesEntries]);

  const weeklyQtyMap = useMemo(() => {
    const map = {};
    salesEntries.forEach((e) => {
      const key = toWeekKey(e.date || e.createdAt || e.updatedAt);
      if (!key) return;
      map[key] = (map[key] || 0) + getQty(e);
    });
    return map;
  }, [salesEntries]);

  const monthlyQtyMap = useMemo(() => {
    const map = {};
    salesEntries.forEach((e) => {
      const key = toMonthKey(e.date || e.createdAt || e.updatedAt);
      if (!key) return;
      map[key] = (map[key] || 0) + getQty(e);
    });
    return map;
  }, [salesEntries]);

  // ✅ NEW: Credit (Payments Received) maps (Daily/Weekly/Monthly) — based on ledger credit
  const dailyCreditMap = useMemo(() => {
    const map = {};
    entriesAll.forEach((e) => {
      const credit = safeNum(e?.credit);
      if (credit <= 0) return;
      const key = toDayKey(e.date || e.createdAt || e.updatedAt);
      if (!key) return;
      map[key] = (map[key] || 0) + credit;
    });
    return map;
  }, [entriesAll]);

  const weeklyCreditMap = useMemo(() => {
    const map = {};
    entriesAll.forEach((e) => {
      const credit = safeNum(e?.credit);
      if (credit <= 0) return;
      const key = toWeekKey(e.date || e.createdAt || e.updatedAt);
      if (!key) return;
      map[key] = (map[key] || 0) + credit;
    });
    return map;
  }, [entriesAll]);

  const monthlyCreditMap = useMemo(() => {
    const map = {};
    entriesAll.forEach((e) => {
      const credit = safeNum(e?.credit);
      if (credit <= 0) return;
      const key = toMonthKey(e.date || e.createdAt || e.updatedAt);
      if (!key) return;
      map[key] = (map[key] || 0) + credit;
    });
    return map;
  }, [entriesAll]);

  const paymentSplit = useMemo(() => {
    const map = {};
    salesEntries.forEach((e) => {
      const p = (e.paymentType || e.paymentMethod || e.mode || "CASH")
        .toString()
        .toUpperCase();
      map[p] = (map[p] || 0) + getSaleValue(e);
    });
    return map;
  }, [salesEntries]);

  const kpiExtras = useMemo(() => {
    const now = new Date();
    let receivable = 0;
    let payable = 0;
    let warningCount = 0;
    let dangerCount = 0;
    let activeCount = 0;

    let topReceivableName = "-";
    let topReceivableValue = 0;

    clients.forEach((c) => {
      const bal = safeNum(c.closingBalance);
      const status = getClientStatus(bal, c.lastDate);

      if (status === "warning") warningCount += 1;
      if (status === "danger") dangerCount += 1;

      const days = c.lastDate
        ? Math.floor((now - new Date(c.lastDate)) / (1000 * 60 * 60 * 24))
        : null;
      if (days !== null && days < 10) activeCount += 1;

      if (bal < 0) {
        const v = Math.abs(bal);
        receivable += v;
        if (v > topReceivableValue) {
          topReceivableValue = v;
          topReceivableName = c.accountName || "-";
        }
      } else if (bal > 0) {
        payable += bal;
      }
    });

    const avgSaleValue = salesEntries.length ? totalSalesValue / salesEntries.length : 0;
    const avgSaleQty = salesEntries.length ? totalSalesQty / salesEntries.length : 0;

    return {
      receivable,
      payable,
      warningCount,
      dangerCount,
      activeCount,
      topReceivableName,
      topReceivableValue,
      avgSaleValue,
      avgSaleQty,
    };
  }, [clients, salesEntries.length, totalSalesValue, totalSalesQty]);

  /* -----------------------------
     Charts (same data)
  ------------------------------ */
  const chartText = theme.ink2;
  const chartMuted = theme.muted;
  const gridColor = theme.mode === "light" ? "rgba(15,23,42,0.08)" : "rgba(148,163,184,0.14)";

  const dailyLineData = useMemo(() => {
    const values = dailyKeys.map((k) => safeNum(dailySalesMap[k]));
    return {
      labels: dailyKeys.map((k) => {
        try {
          const d = new Date(k);
          return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
        } catch {
          return k;
        }
      }),
      datasets: [
        {
          label: "Sales (₨)",
          data: values,
          fill: true,
          tension: 0.42,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 6,
          backgroundColor:
            theme.mode === "light" ? "rgba(6,182,212,0.14)" : "rgba(34,211,238,0.14)",
          borderColor: theme.primary,
        },
      ],
    };
  }, [dailyKeys, dailySalesMap, theme.mode, theme.primary]);

  const monthlyBarData = useMemo(() => {
    const labels = monthlyKeys.map(prettyMonthLabel);
    const values = monthlyKeys.map((k) => safeNum(monthlySalesMap[k]));
    return {
      labels,
      datasets: [
        {
          label: "Sales (₨)",
          data: values,
          borderWidth: 0,
          borderRadius: 14,
          backgroundColor:
            theme.mode === "light" ? "rgba(100,116,139,0.78)" : "rgba(148,163,184,0.64)",
          hoverBackgroundColor:
            theme.mode === "light" ? "rgba(51,65,85,0.86)" : "rgba(203,213,225,0.70)",
        },
      ],
    };
  }, [monthlyKeys, monthlySalesMap, theme.mode]);

  const paymentDoughnutData = useMemo(() => {
    const keys = Object.keys(paymentSplit);
    const values = keys.map((k) => safeNum(paymentSplit[k]));
    const has = keys.length > 0;

    const palette =
      theme.mode === "light"
        ? [
            "rgba(6,182,212,0.86)",
            "rgba(100,116,139,0.86)",
            "rgba(22,163,74,0.86)",
            "rgba(217,119,6,0.86)",
            "rgba(124,58,237,0.86)",
            "rgba(220,38,38,0.86)",
          ]
        : [
            "rgba(34,211,238,0.86)",
            "rgba(148,163,184,0.76)",
            "rgba(52,211,153,0.86)",
            "rgba(251,191,36,0.86)",
            "rgba(167,139,250,0.86)",
            "rgba(251,113,133,0.86)",
          ];

    return {
      labels: has ? keys : ["No Data"],
      datasets: [
        {
          label: "Sales by Payment Type",
          data: has ? values : [1],
          backgroundColor: palette,
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    };
  }, [paymentSplit, theme.mode]);

  // ✅ Qty chart (Daily/Weekly/Monthly)
  const [qtyMode, setQtyMode] = useState("DAILY"); // DAILY | WEEKLY | MONTHLY

  const qtyChartData = useMemo(() => {
    if (qtyMode === "WEEKLY") {
      const labels = weeklyKeys.map(prettyWeekLabel);
      const values = weeklyKeys.map((k) => safeNum(weeklyQtyMap[k]));
      return {
        labels,
        datasets: [
          {
            label: "Qty Sold",
            data: values,
            borderWidth: 0,
            borderRadius: 14,
            backgroundColor:
              theme.mode === "light" ? "rgba(6,182,212,0.70)" : "rgba(34,211,238,0.68)",
            hoverBackgroundColor:
              theme.mode === "light" ? "rgba(6,182,212,0.86)" : "rgba(34,211,238,0.86)",
          },
        ],
      };
    }

    if (qtyMode === "MONTHLY") {
      const labels = monthlyKeys.map(prettyMonthLabel);
      const values = monthlyKeys.map((k) => safeNum(monthlyQtyMap[k]));
      return {
        labels,
        datasets: [
          {
            label: "Qty Sold",
            data: values,
            borderWidth: 0,
            borderRadius: 14,
            backgroundColor:
              theme.mode === "light" ? "rgba(124,58,237,0.72)" : "rgba(167,139,250,0.70)",
            hoverBackgroundColor:
              theme.mode === "light" ? "rgba(124,58,237,0.86)" : "rgba(167,139,250,0.86)",
          },
        ],
      };
    }

    const labels = dailyKeys.map((k) => {
      try {
        const d = new Date(k);
        return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
      } catch {
        return k;
      }
    });
    const values = dailyKeys.map((k) => safeNum(dailyQtyMap[k]));
    return {
      labels,
      datasets: [
        {
          label: "Qty Sold",
          data: values,
          fill: true,
          tension: 0.42,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 6,
          backgroundColor:
            theme.mode === "light" ? "rgba(6,182,212,0.12)" : "rgba(34,211,238,0.12)",
          borderColor: theme.primary,
        },
      ],
    };
  }, [
    qtyMode,
    dailyKeys,
    weeklyKeys,
    monthlyKeys,
    dailyQtyMap,
    weeklyQtyMap,
    monthlyQtyMap,
    theme.mode,
    theme.primary,
  ]);

  // ✅ NEW: Payment Credit Trend (Daily/Weekly/Monthly)
  const [creditMode, setCreditMode] = useState("WEEKLY"); // DAILY | WEEKLY | MONTHLY

  const creditChartData = useMemo(() => {
    if (creditMode === "WEEKLY") {
      const labels = weeklyKeys.map(prettyWeekLabel);
      const values = weeklyKeys.map((k) => safeNum(weeklyCreditMap[k]));
      return {
        labels,
        datasets: [
          {
            label: "Credit (₨)",
            data: values,
            borderWidth: 0,
            borderRadius: 14,
            backgroundColor:
              theme.mode === "light" ? "rgba(22,163,74,0.70)" : "rgba(52,211,153,0.70)",
            hoverBackgroundColor:
              theme.mode === "light" ? "rgba(22,163,74,0.86)" : "rgba(52,211,153,0.86)",
          },
        ],
      };
    }

    if (creditMode === "MONTHLY") {
      const labels = monthlyKeys.map(prettyMonthLabel);
      const values = monthlyKeys.map((k) => safeNum(monthlyCreditMap[k]));
      return {
        labels,
        datasets: [
          {
            label: "Credit (₨)",
            data: values,
            borderWidth: 0,
            borderRadius: 14,
            backgroundColor:
              theme.mode === "light" ? "rgba(6,182,212,0.60)" : "rgba(34,211,238,0.60)",
            hoverBackgroundColor:
              theme.mode === "light" ? "rgba(6,182,212,0.86)" : "rgba(34,211,238,0.86)",
          },
        ],
      };
    }

    const labels = dailyKeys.map((k) => {
      try {
        const d = new Date(k);
        return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
      } catch {
        return k;
      }
    });
    const values = dailyKeys.map((k) => safeNum(dailyCreditMap[k]));
    return {
      labels,
      datasets: [
        {
          label: "Credit (₨)",
          data: values,
          fill: true,
          tension: 0.42,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 6,
          backgroundColor:
            theme.mode === "light" ? "rgba(22,163,74,0.12)" : "rgba(52,211,153,0.12)",
          borderColor: theme.mode === "light" ? "rgba(22,163,74,0.95)" : "rgba(52,211,153,0.95)",
        },
      ],
    };
  }, [
    creditMode,
    dailyKeys,
    weeklyKeys,
    monthlyKeys,
    dailyCreditMap,
    weeklyCreditMap,
    monthlyCreditMap,
    theme.mode,
  ]);

  const commonPlugins = useMemo(
    () => ({
      legend: {
        labels: {
          color: chartText,
          font: { weight: "800" },
          boxWidth: 12,
          boxHeight: 12,
        },
      },
      tooltip: {
        backgroundColor:
          theme.mode === "light" ? "rgba(255,255,255,0.96)" : "rgba(17,24,39,0.92)",
        titleColor: chartText,
        bodyColor: theme.ink,
        borderColor: theme.mode === "light" ? "rgba(15,23,42,0.14)" : "rgba(148,163,184,0.18)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
      },
    }),
    [chartText, theme.mode, theme.ink]
  );

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, position: "top", ...commonPlugins.legend },
        tooltip: { ...commonPlugins.tooltip },
      },
      interaction: { mode: "nearest", axis: "x", intersect: false },
      scales: {
        x: { ticks: { color: chartMuted, maxRotation: 0, autoSkip: true }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: chartMuted }, grid: { color: gridColor } },
      },
    }),
    [commonPlugins, chartMuted, gridColor]
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, position: "top", ...commonPlugins.legend },
        tooltip: { ...commonPlugins.tooltip },
      },
      scales: {
        x: { ticks: { color: chartMuted }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: chartMuted }, grid: { color: gridColor } },
      },
    }),
    [commonPlugins, chartMuted, gridColor]
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      cutout: "70%",
      rotation: -90,
      plugins: {
        legend: { position: "bottom", ...commonPlugins.legend },
        tooltip: { ...commonPlugins.tooltip },
      },
    }),
    [commonPlugins]
  );

  const statusColor = (status) => {
    if (status === "danger") return theme.danger;
    if (status === "warning") return theme.warning;
    return theme.success;
  };

  const isActivePath = (path) => location.pathname === path;

  const go = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  const navItems = [
    {
      label: "Gauge Calculator",
      icon: "ruler",
      accent: theme.primary,
      path: "/gauge",
      onClick: () => go("/gauge"),
    },
    { label: "Dashboard", icon: "home", accent: theme.primary, path: "/ledger", onClick: () => go("/ledger") },
    { label: "New Sale", icon: "cash", accent: theme.success, path: "/sales", onClick: () => go("/sales") },
    { label: "Stock Dashboard", icon: "chart", accent: theme.cyan, path: "/stock", onClick: () => go("/stock") },
    { label: "Available Stock", icon: "box", accent: theme.purple, path: "/available-stock", onClick: () => go("/available-stock") },
    { label: "Company Balance", icon: "shield", accent: theme.warning, path: "/company-balance", onClick: () => go("/company-balance") },
  ];

  const avatarText = "AS";

  const todayText = useMemo(() => {
    try {
      return new Date().toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  }, []);

  const overviewCards = useMemo(() => {
    const s = summary || { totalClients: 0, totalEntries: 0, totalDebit: 0, totalCredit: 0 };
    return [
      { label: "Clients", value: s.totalClients, hint: "Unique account names", chip: "LIVE", accent: theme.primary },
      { label: "Entries", value: s.totalEntries, hint: "All ledger records", chip: "ALL", accent: theme.steel },
      { label: "Receivable (Remaining)", value: `₨ ${safeNum(s.totalDebit).toLocaleString()}`, hint: "Sum of abs closing balances", chip: "BAL", accent: theme.warning },
      { label: "Received (Credit)", value: `₨ ${safeNum(s.totalCredit).toLocaleString()}`, hint: "Payments recorded", chip: "CREDIT", accent: theme.success },
    ];
  }, [summary, theme.primary, theme.steel, theme.warning, theme.success]);

  const statusBadges = useMemo(() => {
    return [
      { label: `Active: ${kpiExtras.activeCount}`, accent: theme.success },
      { label: `Warning (10+ days): ${kpiExtras.warningCount}`, accent: theme.warning },
      { label: `Alert (15+ days): ${kpiExtras.dangerCount}`, accent: theme.danger },
    ];
  }, [kpiExtras.activeCount, kpiExtras.warningCount, kpiExtras.dangerCount, theme.success, theme.warning, theme.danger]);

  /* -----------------------------
     ✅ DASHBOARD SUMMARY PDF
  ------------------------------ */
  const fmtDate = (d) => {
    try {
      if (!d) return "-";
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "-";
      return dt.toLocaleDateString();
    } catch {
      return "-";
    }
  };

  const computePdfKpis = (list) => {
    const now = new Date();
    let receivable = 0;
    let advance = 0;
    let warning = 0;
    let alert = 0;
    let active = 0;

    let topName = "-";
    let topVal = 0;

    list.forEach((c) => {
      const bal = safeNum(c.closingBalance);
      const st = getClientStatus(bal, c.lastDate);

      if (st === "warning") warning += 1;
      if (st === "danger") alert += 1;

      const days = c.lastDate ? Math.floor((now - new Date(c.lastDate)) / (1000 * 60 * 60 * 24)) : null;
      if (days !== null && days < 10) active += 1;

      if (bal < 0) {
        const v = Math.abs(bal);
        receivable += v;
        if (v > topVal) {
          topVal = v;
          topName = c.accountName || "-";
        }
      } else if (bal > 0) {
        advance += bal;
      }
    });

    return { receivable, advance, warning, alert, active, topName, topVal };
  };

  const makeDashboardPdf = ({ list, scopeLabel }) => {
    const doc = new jsPDF("p", "pt", "a4");
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const NAVY = [12, 32, 62];
    const NAVY2 = [12, 46, 92];
    const CYAN = [0, 196, 204];
    const BG = [247, 250, 255];
    const SOFT = [235, 242, 255];
    const BORDER = [220, 228, 242];
    const MUTED = [95, 105, 120];

    // ✅ FIX: slightly smaller margins => more room for Balance column
    const marginX = 14;

    // background
    doc.setFillColor(...BG);
    doc.rect(0, 0, pageW, pageH, "F");

    // top bar
    const barH = 90;
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW, barH, "F");
    doc.setFillColor(...CYAN);
    doc.rect(0, barH, pageW, 4, "F");

    // logo
    drawAyanLogo(doc, 16, 22);

    // brand text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("AYAN STEEL", 92, 44);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("Industrial Ledger • Dashboard Summary", 92, 62);

    const genOn = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    doc.setFontSize(9);
    doc.text(`Generated on: ${genOn}`, 92, 78);

    // right badge
    const badgeText = scopeLabel || "CURRENT VIEW";
    const badgeW = Math.min(210, 9.0 * badgeText.length + 34);
    const badgeH = 22;
    const badgeX = pageW - marginX - badgeW;
    const badgeY = (barH - badgeH) / 2 + 2;

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 10, 10, "FD");

    doc.setTextColor(...NAVY2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(badgeText, badgeX + badgeW / 2, badgeY + 15, { align: "center" });

    // title
    doc.setTextColor(...NAVY2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("DASHBOARD SUMMARY REPORT", pageW / 2, barH + 44, { align: "center" });

    // info pill
    const pillText = `Clients Included: ${list.length}`;
    doc.setFillColor(...SOFT);
    doc.setDrawColor(210, 224, 255);
    doc.roundedRect(pageW / 2 - 150, barH + 56, 300, 26, 10, 10, "FD");
    doc.setTextColor(...NAVY2);
    doc.setFontSize(11);
    doc.text(pillText, pageW / 2, barH + 74, { align: "center" });

    const pdfK = computePdfKpis(list);
    const totalCredit = safeNum(summary?.totalCredit);
    const soldValue = safeNum(totalSalesValue);
    const soldQty = safeNum(totalSalesQty);
    const pinnedInList = list.reduce((s, c) => s + (pinnedMap?.[c.accountName] ? 1 : 0), 0);

    // ✅ KPI cards (more breathing space)
    const kTop = barH + 96;
    const gap = 12;
    const cols = 4;
    const cardW = (pageW - marginX * 2 - gap * (cols - 1)) / cols;
    const cardH = 64;

    const kpiCard = (x, y, label, value, accentRgb) => {
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(1);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, cardW, cardH, 12, 12, "FD");

      // accent chip
      doc.setFillColor(...accentRgb);
      doc.roundedRect(x + 10, y + 12, 10, 10, 4, 4, "F");

      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(label, x + 26, y + 20);

      doc.setTextColor(...NAVY2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(String(value), x + 12, y + 44);
    };

    const row1 = [
      { label: "Total Clients", value: list.length, c: CYAN },
      { label: "Receivable (Need Receive)", value: `₨ ${Math.round(pdfK.receivable).toLocaleString()}`, c: [6, 182, 212] },
      { label: "Received (Credit)", value: `₨ ${Math.round(totalCredit).toLocaleString()}`, c: [22, 163, 74] },
      { label: "Advance Received", value: `₨ ${Math.round(pdfK.advance).toLocaleString()}`, c: [124, 58, 237] },
    ];
    const row2 = [
      { label: "All-Time Sold Value", value: `₨ ${Math.round(soldValue).toLocaleString()}`, c: [100, 116, 139] },
      { label: "Total Qty Sold", value: `${Math.round(soldQty).toLocaleString()}`, c: [217, 119, 6] },
      { label: "Pinned Clients", value: `${pinnedInList}`, c: [217, 119, 6] },
      { label: "Risk (Warn / Alert)", value: `${pdfK.warning} / ${pdfK.alert}`, c: [220, 38, 38] },
    ];

    row1.forEach((k, i) => kpiCard(marginX + i * (cardW + gap), kTop, k.label, k.value, k.c));
    row2.forEach((k, i) => kpiCard(marginX + i * (cardW + gap), kTop + cardH + gap, k.label, k.value, k.c));

    // Top receivable strip
    const stripY = kTop + (cardH + gap) * 2 + 12;
    doc.setDrawColor(210, 224, 255);
    doc.setFillColor(...SOFT);
    doc.roundedRect(marginX, stripY, pageW - marginX * 2, 40, 12, 12, "FD");
    doc.setTextColor(...NAVY2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Top Receivable:", marginX + 12, stripY + 25);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(45, 55, 70);
    doc.text(`${pdfK.topName}  —  ₨ ${Math.round(pdfK.topVal).toLocaleString()}`, marginX + 120, stripY + 25);

    // ✅ Table
    const head = [["#", "Client", "Phone", "Last Date", "Inactive", "Status", "Balance (₨)"]];
    const body = list.map((c, idx) => {
      const phone = (phoneMap?.[c.accountName] || "").toString().trim() || "-";
      const st = getClientStatus(c.closingBalance, c.lastDate);
      const stLabel = st === "danger" ? "ALERT" : st === "warning" ? "WARNING" : "ACTIVE";
      const days = getDaysSinceLastEntry(c.lastDate);
      const bal = safeNum(c.closingBalance);

      return [
        String(idx + 1),
        c.accountName || "-",
        phone,
        fmtDate(c.lastDate),
        days === null ? "-" : String(days),
        stLabel,
        bal.toLocaleString(),
      ];
    });

    // ✅ FIX: widths now fit A4 exactly (Balance column fully visible)
    // A4 width ~595pt, with marginX=14 => usable width ~567pt
    // These widths sum ≈ 567
    const COL = {
      idx: 22,
      client: 155,
      phone: 78,
      last: 72,
      inactive: 66,
      status: 64,
      bal: 110,
    };

    autoTable(doc, {
      startY: stripY + 56,
      margin: { left: marginX, right: marginX, bottom: 52 },
      tableWidth: pageW - marginX * 2,
      head,
      body,
      theme: "grid",
      styles: {
        fontSize: 8.7,
        cellPadding: 5,
        overflow: "ellipsize",
        lineColor: BORDER,
        lineWidth: 0.6,
        textColor: [20, 24, 32],
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: NAVY2,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 6,
        halign: "center",
        valign: "middle",
      },
      alternateRowStyles: { fillColor: [248, 250, 255] },
      columnStyles: {
        0: { cellWidth: COL.idx },
        1: { cellWidth: COL.client, halign: "left", overflow: "linebreak" },
        2: { cellWidth: COL.phone, overflow: "ellipsize" },
        3: { cellWidth: COL.last },
        4: { cellWidth: COL.inactive },
        5: { cellWidth: COL.status },
        6: { cellWidth: COL.bal, halign: "right", fontStyle: "bold" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 5) {
          const v = String(data.cell.raw || "");
          if (v === "ALERT") data.cell.styles.textColor = [220, 38, 38];
          if (v === "WARNING") data.cell.styles.textColor = [217, 119, 6];
          if (v === "ACTIVE") data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = "bold";
        }
      },
      didDrawPage: () => {
        // footer line
        doc.setDrawColor(210, 220, 235);
        doc.setLineWidth(0.8);
        doc.line(marginX, pageH - 30, pageW - marginX, pageH - 30);

        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

        doc.setFontSize(8);
        doc.setTextColor(110, 120, 135);
        doc.setFont("helvetica", "normal");
        doc.text("AYAN STEEL - Confidential Document", marginX, pageH - 14);
        doc.text(`Page ${currentPage} of ${pageCount}`, pageW - marginX, pageH - 14, { align: "right" });
      },
    });

    const fileName = `AYAN_STEEL_Dashboard_Summary_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  };

  const handleDashboardPdf = async () => {
    const res = await Swal.fire({
      title: "Download Dashboard PDF",
      input: "select",
      inputOptions: {
        FILTERED: "Current view (search + filter)",
        ALL: "All clients",
        PINNED: "Pinned only",
      },
      inputValue: "FILTERED",
      showCancelButton: true,
      confirmButtonText: "Download",
      cancelButtonText: "Cancel",
    });

    if (!res.isConfirmed) return;

    let list = [];
    let scopeLabel = "CURRENT VIEW";

    if (res.value === "ALL") {
      list = [...clients];
      scopeLabel = "ALL CLIENTS";
    } else if (res.value === "PINNED") {
      list = clients.filter((c) => !!pinnedMap?.[c.accountName]);
      scopeLabel = "PINNED CLIENTS";
    } else {
      list = [...filteredClientsBase];
      scopeLabel = `VIEW: ${filter || "ALL"}`;
      if ((search || "").trim()) scopeLabel = "VIEW: SEARCH";
    }

    // keep pinned first then A-Z (same behavior)
    list.sort((a, b) => {
      const ap = pinnedMap?.[a.accountName] ? 1 : 0;
      const bp = pinnedMap?.[b.accountName] ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return (a.accountName || "").localeCompare(b.accountName || "");
    });

    if (!list.length) {
      Swal.fire({ icon: "warning", title: "No clients", text: "Nothing to export for this selection." });
      return;
    }

    makeDashboardPdf({ list, scopeLabel });
  };

  return (
    <div style={styles.page}>
      <style>{`
        /* Responsive reflow */
        @media (max-width: 1180px){
          .ayanBodyGrid{ grid-template-columns: 1fr !important; }
          .ayanChartsGrid{ grid-template-columns: 1fr !important; }
          .kpiColSpan{ grid-column: span 6 !important; }
          .hideCenterTabs{ display: none !important; }
          .showMenuBtn{ display: inline-grid !important; }
        }
        @media (max-width: 680px){
          .kpiColSpan{ grid-column: span 12 !important; }
          .searchWide{ min-width: 220px !important; }
        }
        .showMenuBtn{ display: none; }

        /* micro interactions */
        .hoverLift:hover{ transform: translateY(-1px); filter: brightness(1.02); }
        .tabHover:hover{ transform: translateY(-1px); }

        /* client card hover */
        .clientHover{
          transition: transform .16s ease, box-shadow .16s ease, filter .16s ease;
        }
        .clientHover:hover{
          transform: translateY(-2px);
          box-shadow: ${theme.mode === "light" ? "0 18px 40px rgba(15,23,42,0.10)" : "0 18px 45px rgba(0,0,0,0.42)"};
          filter: brightness(1.01);
        }

        /* scrollbars */
        .softScroll::-webkit-scrollbar { height: 10px; }
        .softScroll::-webkit-scrollbar-thumb { background: ${theme.mode === "light" ? "rgba(15,23,42,0.18)" : "rgba(148,163,184,0.22)"}; border-radius: 10px; }
        .softScroll::-webkit-scrollbar-track { background: ${theme.mode === "light" ? "rgba(15,23,42,0.06)" : "rgba(148,163,184,0.10)"}; border-radius: 10px; }
      `}</style>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div style={styles.drawerOverlay} onClick={() => setMobileOpen(false)}>
          <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerCard}>
              <div style={styles.drawerHead}>
                <div style={styles.brand}>
                  <div style={styles.mark}>{avatarText}</div>
                  <div style={styles.brandText}>
                    <h2 style={{ ...styles.brandTitle, fontSize: 16 }}>AYAN STEEL</h2>
                    <p style={styles.brandSub}>Industrial Ledger • Sales • Stock</p>
                  </div>
                  <div style={{ marginLeft: "auto", ...styles.tinyPill }}>{todayText}</div>
                </div>
              </div>

              <div style={styles.drawerBody}>
                {navItems.map((it) => {
                  const active = isActivePath(it.path) || (it.path === "/ledger" && location.pathname === "/");
                  return (
                    <button key={it.path} style={styles.navItem(active)} onClick={it.onClick}>
                      <div style={styles.navLeft}>
                        <span style={styles.navIcon(it.accent)}>
                          <Icon name={it.icon} />
                        </span>
                        <span>{it.label}</span>
                      </div>
                      <span style={{ color: theme.muted, fontWeight: 1100 }}>›</span>
                    </button>
                  );
                })}

                <div style={{ height: 6 }} />

                <div style={{ ...styles.card, borderRadius: 18 }}>
                  <div style={styles.cardPad}>
                    <div style={styles.cardHeadRow}>
                      <p style={styles.cardTitle}>Top Receivable</p>
                      <span style={styles.tinyPill}>PRIORITY</span>
                    </div>
                    <p style={{ ...styles.cardSub, marginTop: 8 }}>
                      <span style={{ color: theme.ink2, fontWeight: 1100 }}>{kpiExtras.topReceivableName}</span>
                      <br />
                      <span style={{ color: theme.primary, fontWeight: 1200 }}>
                        ₨ {safeNum(kpiExtras.topReceivableValue).toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>

                <div style={{ ...styles.card, borderRadius: 18 }}>
                  <div style={styles.cardPad}>
                    <div style={styles.cardHeadRow}>
                      <p style={styles.cardTitle}>Risk Monitor</p>
                      <span style={styles.tinyPill}>LIVE</span>
                    </div>
                    <div style={styles.badgeRow}>
                      {statusBadges.map((b, i) => (
                        <span key={i} style={styles.badge(b.accent)}>
                          <span style={styles.dot(b.accent)} />
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  className="hoverLift"
                  style={{ ...styles.btnGhost, width: "100%", justifyContent: "center" }}
                  onClick={handleDashboardPdf}
                  title="Download Dashboard Summary PDF"
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                    <Icon name="download" /> Download PDF
                  </span>
                </button>

                <button
                  className="hoverLift"
                  style={{ ...styles.btnPrimary, width: "100%", justifyContent: "center" }}
                  onClick={() => go("/sales")}
                >
                  + New Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.shell}>
        {/* TOP BAR (REFINED) */}
        <div style={styles.topbar}>
          <div style={styles.topRow}>
            <div style={styles.brand}>
              <button
                className="showMenuBtn"
                style={{ ...styles.iconBtn }}
                onClick={() => setMobileOpen(true)}
                title="Open menu"
              >
                <Icon name="menu" />
              </button>

              <div style={styles.mark}>{avatarText}</div>
              <div style={styles.brandText}>
                <h1 style={styles.brandTitle}>AYAN STEEL — Industrial Command Center</h1>
                <p style={styles.brandSub}>Receivables • Payments • Client Activity • Sales & Qty Trends</p>
              </div>
            </div>

            <div style={styles.actions}>
              <span style={styles.tinyPill}>{todayText}</span>

              <button className="hoverLift" style={styles.btnGhost} onClick={() => fetchAll()} title="Refresh">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="refresh" />
                  Refresh
                </span>
              </button>

              {/* ✅ Dashboard PDF Button */}
              <button className="hoverLift" style={styles.btnGhost} onClick={handleDashboardPdf} title="Download Dashboard Summary PDF">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="download" />
                  Download PDF
                </span>
              </button>

              <button className="hoverLift" style={styles.btnPrimary} onClick={() => navigate("/sales")}>
                + New Sale
              </button>

              <button
                className="hoverLift"
                style={styles.iconBtn}
                onClick={() => setDark((p) => !p)}
                title={dark ? "Switch to Light" : "Switch to Dark"}
              >
                {dark ? <Icon name="sun" /> : <Icon name="moon" />}
              </button>

              <button
                className="hoverLift"
                style={styles.btnGhost}
                onClick={() => navigate("/gauge")}
                title="Gauge Calculator"
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="ruler" />
                  Gauge
                </span>
              </button>

              <button
                className="hoverLift"
                style={styles.iconBtn}
                onClick={() => Swal.fire({ icon: "info", title: "Notifications", text: "No new notifications right now." })}
                title="Notifications"
              >
                <Icon name="bell" />
              </button>

              <button
                className="hoverLift"
                style={styles.iconBtn}
                onClick={() => Swal.fire({ icon: "info", title: "Settings", text: "Settings panel can be added later." })}
                title="Settings"
              >
                <Icon name="settings" />
              </button>

              <div style={styles.userPill} title="User">
                <div style={styles.avatar}>{avatarText}</div>
                Admin
              </div>
            </div>
          </div>

          {/* ✅ Nav moved to its own row (cleaner + full width) */}
          <div style={styles.navRow} className="hideCenterTabs">
            <div style={styles.navTabs} className="softScroll">
              {navItems.map((it) => {
                const active = isActivePath(it.path) || (it.path === "/ledger" && location.pathname === "/");
                return (
                  <button
                    key={it.path}
                    className="tabHover"
                    style={styles.tabBtn(active)}
                    onClick={it.onClick}
                    title={it.label}
                  >
                    <Icon name={it.icon} size={16} /> {it.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* BODY GRID */}
        <div style={styles.bodyGrid} className="ayanBodyGrid">
          {/* MAIN COLUMN */}
          <div style={{ display: "grid", gap: 12 }}>
            {loading && (
              <div style={{ ...styles.card, padding: 14 }}>
                <div style={styles.empty}>Loading dashboard...</div>
              </div>
            )}
            {error && (
              <div style={{ ...styles.card, padding: 14 }}>
                <div style={{ ...styles.empty, color: theme.danger }}>{error}</div>
              </div>
            )}

            {/* OVERVIEW */}
            <div style={styles.card}>
              <div style={styles.cardPad}>
                <div style={styles.cardHeadRow}>
                  <div>
                    <p style={styles.cardTitle}>Overview</p>
                    <p style={styles.cardSub}>Key financial + operational signals (live from ledger)</p>
                  </div>
                  <span style={styles.tinyPill}>
                    <span style={styles.dot(theme.primary)} /> STEEL • CYAN
                  </span>
                </div>

                <div style={{ height: 12 }} />

                <div style={styles.overviewGrid}>
                  {overviewCards.map((k, i) => (
                    <div key={i} style={styles.kpi(k.accent)} className="kpiColSpan">
                      <span style={styles.kpiChip(k.accent)}>{k.chip}</span>
                      <div style={styles.kpiLabel}>{k.label}</div>
                      <div style={styles.kpiValue}>{k.value}</div>
                      <div style={styles.kpiHint}>{k.hint}</div>
                    </div>
                  ))}
                </div>

                <div style={{ height: 10 }} />

                <div style={styles.overviewGrid}>
                  {[
                    {
                      label: "Receivable (Need to Receive)",
                      value: `₨ ${safeNum(kpiExtras.receivable).toLocaleString()}`,
                      hint: "Clients owing (negative balances)",
                      chip: "RECEIVE",
                      accent: theme.primary,
                    },
                    {
                      label: "Advance Payment Received",
                      value: `₨ ${safeNum(kpiExtras.payable).toLocaleString()}`,
                      hint: "Positive balances (advance)",
                      chip: "ADV",
                      accent: theme.purple,
                    },
                    {
                      label: "Avg Sale Value",
                      value: `₨ ${safeNum(kpiExtras.avgSaleValue).toLocaleString()}`,
                      hint: "Average SALE debit",
                      chip: "AVG",
                      accent: theme.steel,
                    },
                    {
                      label: "Total Qty Sold",
                      value: safeNum(totalSalesQty).toLocaleString(),
                      hint: "Quantity summed from sales",
                      chip: "QTY",
                      accent: theme.warning,
                    },
                  ].map((k, i) => (
                    <div key={i} style={{ ...styles.kpi(k.accent), gridColumn: "span 3" }} className="kpiColSpan">
                      <span style={styles.kpiChip(k.accent)}>{k.chip}</span>
                      <div style={styles.kpiLabel}>{k.label}</div>
                      <div style={styles.kpiValue}>{k.value}</div>
                      <div style={styles.kpiHint}>{k.hint}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ANALYTICS */}
            <div style={styles.sectionRow}>
              <h3 style={styles.sectionTitle}>Analytics</h3>
              <span style={styles.tinyPill}>
                <span style={styles.dot(theme.primary)} /> Sales & Qty Trends
              </span>
            </div>

            <div style={styles.chartsGrid} className="ayanChartsGrid">
              <div style={styles.card}>
                <div style={styles.cardPad}>
                  <div style={styles.cardHeadRow}>
                    <div>
                      <p style={styles.cardTitle}>Daily Sales Trend</p>
                      <p style={styles.cardSub}>Last 14 days (Sales only)</p>
                    </div>
                    <span style={styles.tinyPill}>LINE • ₨</span>
                  </div>
                  <Line data={dailyLineData} options={lineOptions} />
                </div>
              </div>

              <div style={styles.chartsStack}>
                <div style={styles.card}>
                  <div style={styles.cardPad}>
                    <div style={{ ...styles.cardHeadRow, alignItems: "center" }}>
                      <div>
                        <p style={styles.cardTitle}>Qty Sold Trend</p>
                        <p style={styles.cardSub}>Daily / Weekly / Monthly</p>
                      </div>

                      <div style={styles.segRow}>
                        <span style={styles.segBtn(qtyMode === "DAILY")} onClick={() => setQtyMode("DAILY")}>
                          Daily
                        </span>
                        <span style={styles.segBtn(qtyMode === "WEEKLY")} onClick={() => setQtyMode("WEEKLY")}>
                          Weekly
                        </span>
                        <span style={styles.segBtn(qtyMode === "MONTHLY")} onClick={() => setQtyMode("MONTHLY")}>
                          Monthly
                        </span>
                      </div>
                    </div>

                    {qtyMode === "DAILY" ? (
                      <Line data={qtyChartData} options={lineOptions} />
                    ) : (
                      <Bar data={qtyChartData} options={barOptions} />
                    )}
                  </div>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardPad}>
                    <div style={styles.cardHeadRow}>
                      <div>
                        <p style={styles.cardTitle}>Monthly Sales Summary</p>
                        <p style={styles.cardSub}>Last 6 months</p>
                      </div>
                      <span style={styles.tinyPill}>BAR • ₨</span>
                    </div>
                    <Bar data={monthlyBarData} options={barOptions} />
                  </div>
                </div>

                {/* ✅ NEW: Payment Credit Trend (Daily/Weekly/Monthly) */}
                <div style={styles.card}>
                  <div style={styles.cardPad}>
                    <div style={{ ...styles.cardHeadRow, alignItems: "center" }}>
                      <div>
                        <p style={styles.cardTitle}>Payment Credit Trend</p>
                        <p style={styles.cardSub}>Received credit (from ledger)</p>
                      </div>

                      <div style={styles.segRow}>
                        <span style={styles.segBtn(creditMode === "DAILY")} onClick={() => setCreditMode("DAILY")}>
                          Daily
                        </span>
                        <span style={styles.segBtn(creditMode === "WEEKLY")} onClick={() => setCreditMode("WEEKLY")}>
                          Weekly
                        </span>
                        <span style={styles.segBtn(creditMode === "MONTHLY")} onClick={() => setCreditMode("MONTHLY")}>
                          Monthly
                        </span>
                      </div>
                    </div>

                    {creditMode === "DAILY" ? (
                      <Line data={creditChartData} options={lineOptions} />
                    ) : (
                      <Bar data={creditChartData} options={barOptions} />
                    )}
                  </div>
                </div>
                {/* ✅ END NEW CHART */}
              </div>
            </div>

            {/* CLIENTS (MODERN CARDS) */}
            <div style={styles.sectionRow}>
              <h3 style={styles.sectionTitle}>Clients</h3>
              <span style={styles.tinyPill}>
                Receivable: ₨ {safeNum(kpiExtras.receivable).toLocaleString()} • Received: ₨{" "}
                {safeNum(summary?.totalCredit).toLocaleString()}
              </span>
            </div>

            <div style={styles.card}>
              <div style={styles.toolbar}>
                <div style={styles.toolbarLeft}>
                  <span style={styles.badge(theme.success)}>
                    <span style={styles.dot(theme.success)} /> Active
                  </span>
                  <span style={styles.badge(theme.warning)}>
                    <span style={styles.dot(theme.warning)} /> Warning
                  </span>
                  <span style={styles.badge(theme.danger)}>
                    <span style={styles.dot(theme.danger)} /> Alert
                  </span>
                </div>

                <div style={styles.toolbarRight}>
                  <div style={{ ...styles.searchWrap }} className="searchWide">
                    <input
                      style={styles.searchInput}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search client (name)..."
                    />
                    <span style={styles.countPill}>
                      {filteredClientsBase.length}/{clients.length}
                    </span>
                  </div>

                  <span style={styles.filterPill(filter === "ALL")} onClick={() => setFilter("ALL")}>
                    All
                  </span>
                  <span style={styles.filterPill(filter === "PINNED")} onClick={() => setFilter("PINNED")}>
                    <Icon name="star" size={14} /> Pinned
                  </span>
                  <span style={styles.filterPill(filter === "WARNING")} onClick={() => setFilter("WARNING")}>
                    Warning
                  </span>
                  <span style={styles.filterPill(filter === "DANGER")} onClick={() => setFilter("DANGER")}>
                    Alert
                  </span>

                  <span style={styles.tinyPill}>Showing: {filteredClientsBase.length}</span>
                </div>
              </div>

              <div style={styles.clientsList}>
                {filteredClientsBase.map((c) => {
                  const status = getClientStatus(c.closingBalance, c.lastDate);
                  const stColor = statusColor(status);
                  const daysSince = getDaysSinceLastEntry(c.lastDate);
                  const phone = (phoneMap?.[c.accountName] || "").toString().trim();
                  const pinned = !!pinnedMap?.[c.accountName];

                  const bal = safeNum(c.closingBalance);
                  const balColor =
                    bal < 0 ? theme.primary : bal > 0 ? theme.purple : theme.muted;

                  return (
                    <div key={c.accountName} className="clientHover" style={styles.clientCard}>
                      <div style={styles.leftCluster}>
                        <button
                          style={styles.starBtn(pinned)}
                          onClick={() => togglePin(c.accountName)}
                          title={pinned ? "Unpin" : "Pin"}
                        >
                          <Icon name="star" size={16} />
                        </button>

                        <div style={styles.clientMain}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <span style={styles.dot(stColor)} />
                            <Link to={`/clients/${encodeURIComponent(c.accountName)}`} style={styles.clientLink}>
                              {c.accountName}
                            </Link>
                            <span style={styles.miniChip(stColor, true)}>
                              <span style={styles.dot(stColor)} />
                              {status === "danger" ? "ALERT" : status === "warning" ? "WARNING" : "ACTIVE"}
                            </span>
                          </div>

                          <div style={styles.metaRow}>
                            {phone ? (
                              <>
                                <span style={styles.phoneLine}>
                                  <Icon name="phone" size={14} />
                                  <a
                                    href={`tel:${phone.replace(/\s+/g, "")}`}
                                    style={{ color: theme.muted, textDecoration: "none" }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {phone}
                                  </a>
                                </span>
                                <button
                                  className="hoverLift"
                                  style={{ ...styles.btnSmallGhost, padding: "7px 10px", borderRadius: 12, fontSize: 11 }}
                                  onClick={() => editClientPhoneSafe(c.accountName)}
                                  title="Edit phone"
                                >
                                  Edit
                                </button>
                              </>
                            ) : (
                              <>
                                <span style={styles.phoneLine}>
                                  <Icon name="phone" size={14} />
                                  <span>Not set</span>
                                </span>
                                <button
                                  className="hoverLift"
                                  style={{ ...styles.btnSmallGhost, padding: "7px 10px", borderRadius: 12, fontSize: 11 }}
                                  onClick={() => editClientPhoneSafe(c.accountName)}
                                  title="Add phone"
                                >
                                  + Add
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={styles.rightCluster}>
                        <span style={styles.miniChip(theme.steel)}>
                          Last: {c.lastDate ? c.lastDate.toLocaleDateString() : "-"}
                        </span>

                        <span style={styles.miniChip(stColor)}>
                          Inactive: {daysSince !== null ? `${daysSince} days` : "-"}
                        </span>

                        <span style={styles.miniChip(balColor, true)}>
                          Balance: ₨ {bal.toLocaleString()}
                        </span>

                        <div style={styles.btnRow}>
                          <button
                            className="hoverLift"
                            style={styles.btnSmall}
                            onClick={() => navigate(`/clients/${encodeURIComponent(c.accountName)}`)}
                          >
                            View Ledger
                          </button>

                          <button
                            className="hoverLift"
                            style={styles.btnSmallGhost}
                            onClick={() => handleEditName(c.accountName)}
                          >
                            Edit Name
                          </button>

                          <button
                            className="hoverLift"
                            style={styles.btnSmallGhost}
                            onClick={() => editClientPhoneSafe(c.accountName)}
                            title="Add/Edit phone"
                          >
                            Phone
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredClientsBase.length === 0 && !loading && (
                  <div style={styles.empty}>No clients found.</div>
                )}
              </div>
            </div>

            <div style={{ height: 4 }} />
          </div>

          {/* SIDE COLUMN */}
          <div style={styles.sideGrid}>
            <div style={styles.card}>
              <div style={styles.cardPad}>
                <div style={styles.cardHeadRow}>
                  <div>
                    <p style={styles.cardTitle}>Risk Monitor</p>
                    <p style={styles.cardSub}>Client inactivity + alert distribution</p>
                  </div>
                  <span style={styles.tinyPill}>LIVE</span>
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                  {statusBadges.map((b, i) => (
                    <span key={i} style={styles.badge(b.accent)}>
                      <span style={styles.dot(b.accent)} />
                      {b.label}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: 12, borderTop: `1px solid ${theme.stroke2}`, paddingTop: 12 }}>
                  <p style={{ ...styles.cardTitle, marginBottom: 6 }}>Top Receivable</p>
                  <div style={{ fontSize: 12, fontWeight: 950, color: theme.muted, lineHeight: 1.35 }}>
                    <span style={{ color: theme.ink2, fontWeight: 1200 }}>{kpiExtras.topReceivableName}</span>
                    <br />
                    <span style={{ color: theme.primary, fontWeight: 1300 }}>
                      ₨ {safeNum(kpiExtras.topReceivableValue).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardPad}>
                <div style={styles.cardHeadRow}>
                  <div>
                    <p style={styles.cardTitle}>Sales by Payment Type</p>
                    <p style={styles.cardSub}>Doughnut distribution</p>
                  </div>
                  <span style={styles.tinyPill}>DOUGHNUT</span>
                </div>
                <Doughnut data={paymentDoughnutData} options={doughnutOptions} />
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardPad}>
                <div style={styles.cardHeadRow}>
                  <div>
                    <p style={styles.cardTitle}>Quick Actions</p>
                    <p style={styles.cardSub}>Fast navigation for daily work</p>
                  </div>
                  <span style={styles.tinyPill}>SHORTCUTS</span>
                </div>

                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {/* ✅ PDF shortcut */}
                  <button
                    className="hoverLift"
                    style={{
                      ...styles.navItem(false),
                      border: `1px solid ${theme.stroke}`,
                      background: theme.mode === "light" ? "rgba(255,255,255,0.72)" : "rgba(17,24,39,0.52)",
                    }}
                    onClick={handleDashboardPdf}
                  >
                    <div style={styles.navLeft}>
                      <span style={styles.navIcon(theme.primary)}>
                        <Icon name="download" />
                      </span>
                      <span>Download Dashboard PDF</span>
                    </div>
                    <span style={{ color: theme.muted, fontWeight: 1100 }}>›</span>
                  </button>

                  {navItems.map((it) => {
                    const active = isActivePath(it.path) || (it.path === "/ledger" && location.pathname === "/");
                    return (
                      <button
                        key={it.path}
                        className="hoverLift"
                        style={{
                          ...styles.navItem(active),
                          border: `1px solid ${active ? `${theme.primary}44` : theme.stroke}`,
                          background: active
                            ? theme.primarySoft
                            : theme.mode === "light"
                            ? "rgba(255,255,255,0.72)"
                            : "rgba(17,24,39,0.52)",
                        }}
                        onClick={it.onClick}
                      >
                        <div style={styles.navLeft}>
                          <span style={styles.navIcon(it.accent)}>
                            <Icon name={it.icon} />
                          </span>
                          <span>{it.label}</span>
                        </div>
                        <span style={{ color: theme.muted, fontWeight: 1100 }}>›</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardPad}>
                <div style={styles.cardHeadRow}>
                  <div>
                    <p style={styles.cardTitle}>Snapshot</p>
                    <p style={styles.cardSub}>All-time sales performance</p>
                  </div>
                  <span style={styles.tinyPill}>STATS</span>
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                  <div style={styles.badge(theme.primary)}>
                    <span style={styles.dot(theme.primary)} />
                    All-Time Sold Value: ₨ {safeNum(totalSalesValue).toLocaleString()}
                  </div>
                  <div style={styles.badge(theme.steel)}>
                    <span style={styles.dot(theme.steel)} />
                    Avg Sale Qty: {safeNum(kpiExtras.avgSaleQty).toLocaleString()}
                  </div>
                  <div style={styles.badge(theme.success)}>
                    <span style={styles.dot(theme.success)} />
                    Pinned Clients: {pinnedCount}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: 4 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ledger;
