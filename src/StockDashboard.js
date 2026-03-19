// src/StockDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import api from "./api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// PDF Export
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ---------------------------------
   Helpers (NO backend changes)
---------------------------------- */
const safeNum = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/,/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeProductKey(p) {
  return (p || "").toString().trim().toLowerCase();
}

const getEntryQty = (e) => safeNum(e?.quantity);

const getEntryRemainingRaw = (e) => {
  const raw =
    e?.remainingQuantity ??
    e?.remainingQty ??
    e?.remainingquantity ??
    e?.remaining ??
    e?.remainingStock ??
    e?.remaining_balance ??
    null;

  if (raw === null || raw === undefined || raw === "") return null;
  return safeNum(raw);
};

const getEntryRemaining = (e) => {
  const qty = getEntryQty(e);
  const raw = getEntryRemainingRaw(e);
  if (raw === null) return qty > 0 ? qty : 0;
  let rem = safeNum(raw);
  if (qty <= 0 || rem <= 0) return 0;
  if (qty > 0 && rem > qty) rem = qty;
  return rem;
};

const getEffectiveStatus = (e) => {
  const qty = getEntryQty(e);
  const rem = getEntryRemaining(e);
  if (qty <= 0) return "SOLD";
  if (rem <= 0) return "SOLD";
  const s = (e?.status || "").toString().trim().toUpperCase();
  return s || "BOOKED";
};

const isSaleEntry = (e) => {
  const cat = (e?.category || "").toString().trim().toUpperCase();
  if (cat) return cat.includes("SALE");

  const raw =
    (e?.ledgerType ?? e?.type ?? e?.entryType ?? e?.transactionType ?? "")
      .toString()
      .trim()
      .toUpperCase();

  if (raw) {
    const compact = raw.replace(/[\s_-]/g, "");
    if (compact.includes("PURCHASE")) return false;
    if (compact.includes("EXPENSE")) return false;
    if (compact.includes("ADJUST")) return false;
    if (compact.includes("RETURN") || compact.includes("REFUND")) return false;
    if (compact.includes("SALE")) return true;
  }

  const debit = safeNum(e?.debit ?? e?.amount ?? 0);
  const items =
    (Array.isArray(e?.items) && e.items) ||
    (Array.isArray(e?.products) && e.products) ||
    (Array.isArray(e?.lineItems) && e.lineItems) ||
    (Array.isArray(e?.details) && e.details) ||
    null;

  if (items && items.length && debit > 0) return true;
  return false;
};

function getLedgerSaleQty(entry) {
  const direct = safeNum(
    entry?.quantity ??
      entry?.qty ??
      entry?.soldQty ??
      entry?.soldQuantity ??
      entry?.saleQty ??
      entry?.totalQty ??
      0
  );
  if (direct !== 0) return Math.abs(direct);

  const items =
    (Array.isArray(entry?.items) && entry.items) ||
    (Array.isArray(entry?.products) && entry.products) ||
    (Array.isArray(entry?.lineItems) && entry.lineItems) ||
    (Array.isArray(entry?.details) && entry.details) ||
    null;

  if (!items) return 0;

  const sum = items.reduce(
    (s, it) =>
      s +
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

  return Math.abs(sum);
}

function getLedgerSaleQtyForProduct(entry, productType) {
  const key = normalizeProductKey(productType);
  if (!key) return getLedgerSaleQty(entry);

  const items =
    (Array.isArray(entry?.items) && entry.items) ||
    (Array.isArray(entry?.products) && entry.products) ||
    (Array.isArray(entry?.lineItems) && entry.lineItems) ||
    (Array.isArray(entry?.details) && entry.details) ||
    null;

  if (!items) return getLedgerSaleQty(entry);

  const sum = items.reduce((s, it) => {
    const itKey = normalizeProductKey(
      it?.productType ?? it?.type ?? it?.itemType ?? it?.product ?? it?.stockType
    );
    if (!itKey || itKey !== key) return s;

    const q = safeNum(
      it?.qty ??
        it?.quantity ??
        it?.soldQty ??
        it?.soldQuantity ??
        it?.saleQty ??
        0
    );
    return s + Math.abs(q);
  }, 0);

  return sum;
}

function isSaleLinkedToEntry(sale, entry) {
  if (!sale || !entry) return false;
  const possibleKeys = [
    "stockEntryId",
    "stockId",
    "entryId",
    "sourceStockId",
    "refStockId",
  ];
  for (const k of possibleKeys) {
    if (sale[k] && String(sale[k]) === String(entry._id)) return true;
  }
  if (
    sale.stock &&
    sale.stock._id &&
    String(sale.stock._id) === String(entry._id)
  )
    return true;
  return false;
}

function normalizeSaleRow(sale = {}, forcedQty = null, forcedType = null) {
  const qty =
    forcedQty != null ? Number(forcedQty) || 0 : getLedgerSaleQty(sale);

  const rate = Number(sale.rate ?? sale.saleRate ?? sale.unitRate ?? 0) || 0;
  const loading =
    Number(sale.loading ?? sale.loadingCharges ?? sale.loadingAmount ?? 0) || 0;
  const debit = Number(sale.debit ?? sale.totalDebit ?? sale.amount ?? 0) || 0;
  const credit = Number(sale.credit ?? sale.totalCredit ?? 0) || 0;

  const accountName =
    sale.accountName ||
    sale.clientName ||
    sale.customerName ||
    sale.partyName ||
    sale.name ||
    "";

  const paymentType =
    (sale.paymentType || sale.paymentMethod || sale.mode || "CASH")
      .toString()
      .toUpperCase();

  const bankName = sale.bankName || sale.bank || "";
  const chequeNo = sale.chequeNo || sale.checkNo || "";
  const chequeDate = sale.chequeDate || sale.checkDate || "";

  const description = sale.description || sale.note || sale.remarks || "-";

  const type = forcedType || sale.productType || sale.type || sale.itemType || "";

  const closingBalance =
    sale.closingBalance ?? sale.balance ?? sale.runningBalance ?? null;

  const date = sale.date || sale.createdAt || sale.updatedAt || "";

  return {
    _raw: sale,
    date,
    accountName,
    description,
    type,
    qty,
    rate,
    loading,
    debit,
    credit,
    paymentType,
    bankName,
    chequeNo,
    chequeDate,
    closingBalance,
  };
}

function getSalesStats(sales = [], productType = null) {
  const key = normalizeProductKey(productType);
  const norm = sales.map((s) => {
    const qty = key
      ? getLedgerSaleQtyForProduct(s, productType)
      : getLedgerSaleQty(s);
    return normalizeSaleRow(s, qty, productType || null);
  });

  const totalQty = norm.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);
  const totalDebit = norm.reduce((sum, s) => sum + (Number(s.debit) || 0), 0);
  const uniqueClients = new Set(
    norm.map((s) => s.accountName).filter(Boolean)
  ).size;

  const avgRate =
    norm.length > 0
      ? norm.reduce((sum, s) => sum + (Number(s.rate) || 0), 0) / norm.length
      : 0;

  return { totalQty, totalDebit, uniqueClients, avgRate };
}

/* ✅ Computes totalCost + effectiveRate WITH charges */
function calcEntryCosts(e) {
  const qty = safeNum(e?.quantity);
  const rate = safeNum(e?.purchaseRate);
  const loading = safeNum(e?.loadingCharges);
  const unloading = safeNum(e?.unloadingCharges);
  const transport = safeNum(e?.transportCharges);
  const other = safeNum(e?.otherCharges);

  const totalCharges = loading + unloading + transport + other;
  const baseValue = qty * rate;
  const totalCost = baseValue + totalCharges;
  const effectiveRate = qty > 0 ? totalCost / qty : 0;

  return {
    qty,
    rate,
    loading,
    unloading,
    transport,
    other,
    totalCharges,
    baseValue,
    totalCost,
    effectiveRate,
  };
}

/* ✅ ledger-based sold-by-product (handles items arrays) */
function computeLedgerSoldByProduct(ledgerSales = []) {
  const map = {};

  for (const e of ledgerSales) {
    const items =
      (Array.isArray(e?.items) && e.items) ||
      (Array.isArray(e?.products) && e.products) ||
      (Array.isArray(e?.lineItems) && e.lineItems) ||
      (Array.isArray(e?.details) && e.details) ||
      null;

    if (items && items.length) {
      for (const it of items) {
        const key = normalizeProductKey(
          it?.productType ??
            it?.type ??
            it?.itemType ??
            it?.product ??
            it?.stockType
        );
        if (!key) continue;

        const q = safeNum(
          it?.qty ??
            it?.quantity ??
            it?.soldQty ??
            it?.soldQuantity ??
            it?.saleQty ??
            0
        );
        map[key] = (map[key] || 0) + Math.abs(q);
      }
      continue;
    }

    const key = normalizeProductKey(
      e?.productType ?? e?.type ?? e?.itemType ?? e?.product ?? e?.stockType
    );
    if (!key) continue;

    const qty = getLedgerSaleQty(e);
    map[key] = (map[key] || 0) + qty;
  }

  return map;
}

/* ✅ Stock-by-product with correct values using effective unit cost */
function computeByProductFromEntries(entries = [], ledgerSoldMap = {}) {
  const groups = {};

  const entryTotalCost = (e) => calcEntryCosts(e).totalCost;

  for (const e of entries) {
    const product = (e.productType || "").trim();
    if (!product) continue;

    const nKey = normalizeProductKey(product);
    if (!groups[nKey]) groups[nKey] = { product, purchases: [], negatives: [] };

    const qty = getEntryQty(e);
    if (qty < 0) groups[nKey].negatives.push(e);
    else if (qty > 0) groups[nKey].purchases.push(e);
  }

  const result = {};

  for (const nKey of Object.keys(groups)) {
    const { product, purchases, negatives } = groups[nKey];

    const totalPurchased = purchases.reduce((s, e) => s + getEntryQty(e), 0);
    const soldFromNegatives = negatives.reduce(
      (s, e) => s + Math.abs(getEntryQty(e)),
      0
    );
    const hasRemainingInfo = purchases.some(
      (e) => getEntryRemainingRaw(e) !== null
    );

    const ledgerSold = safeNum(ledgerSoldMap[nKey] || 0);

    let sold = 0;
    let remaining = 0;

    if (ledgerSold > 0) {
      sold = ledgerSold;
      remaining = Math.max(0, totalPurchased - sold);
    } else if (soldFromNegatives > 0) {
      sold = soldFromNegatives;
      remaining = Math.max(0, totalPurchased - sold);
    } else if (hasRemainingInfo) {
      remaining = purchases.reduce((s, e) => {
        const q = getEntryQty(e);
        if (q <= 0) return s;
        const rRaw = getEntryRemainingRaw(e);
        const r = rRaw == null ? q : rRaw;
        return s + Math.max(0, Math.min(q, r));
      }, 0);
      sold = Math.max(0, totalPurchased - remaining);
    } else {
      sold = 0;
      remaining = totalPurchased;
    }

    const purchaseValue = purchases.reduce((s, e) => s + entryTotalCost(e), 0);

    let remainingValue = 0;
    if (totalPurchased > 0) {
      if (hasRemainingInfo && soldFromNegatives <= 0) {
        remainingValue = purchases.reduce((s, e) => {
          const q = getEntryQty(e);
          if (q <= 0) return s;
          const rRaw = getEntryRemainingRaw(e);
          const r = rRaw == null ? q : rRaw;
          const rr = Math.max(0, Math.min(q, r));
          const cost = entryTotalCost(e);
          const unitCost = q > 0 ? cost / q : 0;
          return s + unitCost * rr;
        }, 0);
      } else {
        const avgUnitCost = purchaseValue / totalPurchased;
        remainingValue = avgUnitCost * remaining;
      }
    }

    result[product] = {
      totalPurchased,
      remaining,
      sold,
      purchaseValue,
      remainingValue,
    };
  }

  return result;
}

/* ✅ CSV Export helper */
function downloadCSV(filename, rows) {
  const escape = (v) => {
    const s = String(v ?? "");
    if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------------------------------
   New Design System (Fresh Look)
---------------------------------- */
const ui = {
  bg:
    "radial-gradient(1200px 500px at 12% 10%, rgba(82,120,255,.18), transparent 55%)," +
    "radial-gradient(900px 450px at 90% 20%, rgba(0,200,255,.10), transparent 55%)," +
    "linear-gradient(180deg, #f7f9ff 0%, #f3f6ff 55%, #f7f9ff 100%)",
  card: "rgba(255,255,255,.82)",
  solidCard: "#ffffff",
  stroke: "rgba(20, 33, 61, 0.10)",
  stroke2: "rgba(20, 33, 61, 0.08)",
  text: "#0b1220",
  sub: "#58657a",
  accent: "#1f4bff",
  accent2: "#00b2ff",
  danger: "#d90429",
  ok: "#1b8a5a",
  warn: "#c77d00",
  shadow: "0 18px 50px rgba(15, 23, 42, 0.10)",
  softShadow: "0 10px 26px rgba(15, 23, 42, 0.08)",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: ui.bg,
    padding: "18px 12px 90px",
    color: ui.text,
  },
  shell: {
    maxWidth: 1520,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
  },
  brandHeader: {
    position: "sticky",
    top: 10,
    zIndex: 30,
    background: ui.card,
    backdropFilter: "blur(10px)",
    border: `1px solid ${ui.stroke}`,
    borderRadius: 18,
    boxShadow: ui.softShadow,
    padding: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  brandLeft: { display: "flex", alignItems: "center", gap: 12, minWidth: 280 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background:
      "linear-gradient(135deg, rgba(31,75,255,1) 0%, rgba(0,178,255,1) 100%)",
    boxShadow: "0 12px 24px rgba(31,75,255,.25)",
    display: "grid",
    placeItems: "center",
    color: "#fff",
    fontWeight: 1000,
    letterSpacing: ".5px",
    fontSize: 18,
    flex: "0 0 auto",
  },
  brandTitle: { fontSize: 18, fontWeight: 1000, letterSpacing: ".2px" },
  brandSub: { marginTop: 2, fontSize: 11, color: ui.sub, fontWeight: 800 },
  topActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  btn: {
    border: `1px solid ${ui.stroke}`,
    background: ui.solidCard,
    padding: "10px 12px",
    borderRadius: 12,
    fontWeight: 950,
    cursor: "pointer",
    fontSize: 12,
    color: ui.text,
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    boxShadow: "0 10px 18px rgba(15,23,42,.05)",
    whiteSpace: "nowrap",
  },
  btnPrimary: {
    border: "none",
    background:
      "linear-gradient(135deg, rgba(31,75,255,1) 0%, rgba(0,178,255,1) 100%)",
    color: "#fff",
    padding: "10px 13px",
    borderRadius: 12,
    fontWeight: 1000,
    cursor: "pointer",
    fontSize: 12,
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    boxShadow: "0 14px 26px rgba(31,75,255,.22)",
    whiteSpace: "nowrap",
  },
  btnDanger: {
    border: "none",
    background:
      "linear-gradient(135deg, rgba(217,4,41,1) 0%, rgba(156,0,24,1) 100%)",
    color: "#fff",
    padding: "10px 13px",
    borderRadius: 12,
    fontWeight: 1000,
    cursor: "pointer",
    fontSize: 12,
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    boxShadow: "0 14px 26px rgba(217,4,41,.18)",
    whiteSpace: "nowrap",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1.35fr .65fr",
    gap: 14,
  },
  panel: {
    background: ui.card,
    backdropFilter: "blur(10px)",
    border: `1px solid ${ui.stroke}`,
    borderRadius: 18,
    boxShadow: ui.softShadow,
    overflow: "hidden",
  },
  panelHead: {
    padding: "14px 14px 10px",
    borderBottom: `1px solid ${ui.stroke2}`,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  panelTitle: { margin: 0, fontSize: 14, fontWeight: 1000 },
  panelHint: { fontSize: 11, color: ui.sub, fontWeight: 800 },
  panelBody: { padding: 14 },
  kpis: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 12,
  },
  kpi: {
    background: ui.solidCard,
    border: `1px solid ${ui.stroke2}`,
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 10px 20px rgba(15,23,42,.05)",
    position: "relative",
    overflow: "hidden",
  },
  kpiBar: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: 4,
    background:
      "linear-gradient(90deg, rgba(31,75,255,1), rgba(0,178,255,1), rgba(31,75,255,1))",
    opacity: 0.9,
  },
  kpiLabel: {
    fontSize: 10.5,
    color: ui.sub,
    fontWeight: 1000,
    letterSpacing: ".6px",
  },
  kpiValue: { marginTop: 6, fontSize: 22, fontWeight: 1000 },
  kpiSub: { marginTop: 2, fontSize: 11, color: ui.sub, fontWeight: 800 },
  toolRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr .8fr",
    gap: 12,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 11px",
    borderRadius: 12,
    border: `1px solid ${ui.stroke}`,
    outline: "none",
    background: "#fff",
    fontSize: 12,
    fontWeight: 800,
    color: ui.text,
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 11px",
    borderRadius: 12,
    border: `1px solid ${ui.stroke}`,
    outline: "none",
    background: "#fff",
    fontSize: 12,
    fontWeight: 850,
    color: ui.text,
  },
  miniRow: { display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 10 },
  badge: (bg, color) => ({
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: bg,
    color: color,
    fontWeight: 1000,
    fontSize: 10,
    letterSpacing: ".4px",
    border: `1px solid ${ui.stroke2}`,
    whiteSpace: "nowrap",
  }),
  tableWrap: {
    border: `1px solid ${ui.stroke}`,
    borderRadius: 16,
    overflowX: "auto",
    background: ui.solidCard,
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 1250,
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    textAlign: "left",
    padding: "12px 10px",
    fontSize: 11,
    fontWeight: 1000,
    color: "#0c2c7a",
    background:
      "linear-gradient(180deg, rgba(240,246,255,1) 0%, rgba(232,241,255,1) 100%)",
    borderBottom: `1px solid ${ui.stroke}`,
    whiteSpace: "nowrap",
    cursor: "default",
  },
  td: {
    padding: "11px 10px",
    borderBottom: `1px solid ${ui.stroke2}`,
    fontSize: 12,
    color: ui.text,
    verticalAlign: "top",
  },
  rowAlt: { background: "rgba(247,250,255,.75)" },
  actionBtn: {
    border: `1px solid ${ui.stroke}`,
    background: "#fff",
    padding: "7px 10px",
    borderRadius: 11,
    fontWeight: 950,
    cursor: "pointer",
    fontSize: 11,
    whiteSpace: "nowrap",
  },
  actionDanger: {
    border: "none",
    background:
      "linear-gradient(135deg, rgba(217,4,41,1) 0%, rgba(156,0,24,1) 100%)",
    color: "#fff",
    padding: "7px 10px",
    borderRadius: 11,
    fontWeight: 1000,
    cursor: "pointer",
    fontSize: 11,
    whiteSpace: "nowrap",
  },
  footerBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 12,
    display: "flex",
    justifyContent: "center",
    zIndex: 50,
    pointerEvents: "none",
  },
  bulkBar: {
    pointerEvents: "auto",
    width: "min(1100px, calc(100% - 24px))",
    background: ui.card,
    backdropFilter: "blur(12px)",
    border: `1px solid ${ui.stroke}`,
    borderRadius: 16,
    boxShadow: ui.shadow,
    padding: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
};

/* Status Colors */
const statusColors = {
  BOOKED: { bg: "#fff2cc", color: "#7a5b00" },
  ON_WAY: { bg: "#dbe7ff", color: "#0c2c7a" },
  UNLOADED: { bg: "#dff7ff", color: "#0a5566" },
  AVAILABLE: { bg: "#dcfce7", color: "#14532d" },
  SOLD: { bg: "#ffe0e3", color: "#7f1d1d" },
};

const LS_VIEWS_KEY = "stock_dashboard_views_v1";

/* ✅ NEW: Stock Transfers (LocalStorage only — no backend changes) */
const LS_TRANSFERS_KEY = "stock_transfers_v1";
const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function getTransfersLS() {
  try {
    const raw = localStorage.getItem(LS_TRANSFERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function setTransfersLS(list) {
  try {
    localStorage.setItem(LS_TRANSFERS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
  } catch {
    // ignore
  }
}

/* ---------------------------------
   SweetAlert2 Wizard (NEW ENTRY)
---------------------------------- */
function buildWizardHTML(step, data = {}, options = {}) {
  const products = options.products || [];
  const suppliers = options.suppliers || [];

  const datalistProducts = products
    .map((p) => `<option value="${String(p).replace(/"/g, "&quot;")}"></option>`)
    .join("");
  const datalistSuppliers = suppliers
    .map((s) => `<option value="${String(s).replace(/"/g, "&quot;")}"></option>`)
    .join("");

  const field = (label, id, type = "text", placeholder = "", extra = "") => `
    <div style="display:flex; flex-direction:column; gap:6px;">
      <div style="font-weight:900; font-size:11px; color:#0b1220; letter-spacing:.2px;">${label}</div>
      <input id="${id}" type="${type}" placeholder="${placeholder}"
        value="${String(data[id] ?? "").replace(/"/g, "&quot;")}"
        style="padding:10px 11px; border-radius:12px; border:1px solid rgba(20,33,61,.15); outline:none; font-size:12px; font-weight:800; background:#fff;" ${extra} />
    </div>
  `;

  const select = (label, id, items = []) => {
    const val = String(data[id] ?? "");
    return `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="font-weight:900; font-size:11px; color:#0b1220; letter-spacing:.2px;">${label}</div>
        <select id="${id}"
          style="padding:10px 11px; border-radius:12px; border:1px solid rgba(20,33,61,.15); outline:none; font-size:12px; font-weight:900; background:#fff;">
          ${items
            .map(
              (it) =>
                `<option value="${it.value}" ${String(it.value) === val ? "selected" : ""}>${it.label}</option>`
            )
            .join("")}
        </select>
      </div>
    `;
  };

  const textarea = (label, id, placeholder = "") => `
    <div style="display:flex; flex-direction:column; gap:6px;">
      <div style="font-weight:900; font-size:11px; color:#0b1220; letter-spacing:.2px;">${label}</div>
      <textarea id="${id}" placeholder="${placeholder}"
        style="padding:10px 11px; border-radius:12px; border:1px solid rgba(20,33,61,.15); outline:none; font-size:12px; font-weight:800; background:#fff; min-height:88px; resize:vertical;">${String(
          data[id] ?? ""
        )}</textarea>
    </div>
  `;

  const costBox = `
    <div style="margin-top:10px; padding:12px; border-radius:14px; border:1px solid rgba(20,33,61,.10);
      background: linear-gradient(135deg, rgba(31,75,255,.08), rgba(0,178,255,.06));
    ">
      <div style="font-weight:1000; font-size:11px; letter-spacing:.4px; color:#0c2c7a;">Live Cost Preview</div>
      <div id="cost-preview" style="margin-top:8px; display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:8px;">
        <div style="padding:10px; border-radius:12px; background:#fff; border:1px solid rgba(20,33,61,.08);">
          <div style="font-size:10px; color:#58657a; font-weight:900;">Base</div>
          <div id="pv-base" style="font-weight:1000; font-size:13px;">₨ 0</div>
        </div>
        <div style="padding:10px; border-radius:12px; background:#fff; border:1px solid rgba(20,33,61,.08);">
          <div style="font-size:10px; color:#58657a; font-weight:900;">Charges</div>
          <div id="pv-chg" style="font-weight:1000; font-size:13px;">₨ 0</div>
        </div>
        <div style="padding:10px; border-radius:12px; background:#fff; border:1px solid rgba(20,33,61,.08);">
          <div style="font-size:10px; color:#58657a; font-weight:900;">Total</div>
          <div id="pv-total" style="font-weight:1000; font-size:13px; color:#1f4bff;">₨ 0</div>
        </div>
        <div style="padding:10px; border-radius:12px; background:#fff; border:1px solid rgba(20,33,61,.08);">
          <div style="font-size:10px; color:#58657a; font-weight:900;">Eff/Unit</div>
          <div id="pv-eff" style="font-weight:1000; font-size:13px;">₨ 0</div>
        </div>
      </div>
      <div style="margin-top:8px; font-size:10px; color:#58657a; font-weight:800;">
        Tip: Fill Qty + Rate and optional charges — effective rate updates automatically.
      </div>
    </div>
  `;

  if (step === 0) {
    return `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
        <div style="grid-column:1/-1; padding:10px 12px; border-radius:14px; border:1px solid rgba(20,33,61,.10);
          background: linear-gradient(135deg, rgba(31,75,255,.08), rgba(0,178,255,.06));">
          <div style="font-weight:1000; font-size:12px; color:#0b1220;">Step 1 — Basics</div>
          <div style="font-size:10.5px; color:#58657a; font-weight:800; margin-top:3px;">
            Product, date, quantity, rate, status and supplier info.
          </div>
        </div>

        ${field("Product Type *", "productType", "text", "e.g. Coil / Sheet", `list="swal-products"`)}
        ${select("Status", "status", [
          { value: "BOOKED", label: "Booked" },
          { value: "ON_WAY", label: "On Way" },
          { value: "UNLOADED", label: "Unloaded" },
          { value: "AVAILABLE", label: "Available" },
        ])}

        ${field("Purchase Date *", "purchaseDate", "date")}
        ${field("Quantity *", "quantity", "number", "0", `step="0.01" min="0"`)}
        ${field("Purchase Rate *", "purchaseRate", "number", "0", `step="0.01" min="0"`)}
        ${field("Supplier Name", "supplierName", "text", "Optional", `list="swal-suppliers"`)}
        ${field("Supplier Invoice No", "supplierInvoiceNo", "text", "Optional")}

        <datalist id="swal-products">${datalistProducts}</datalist>
        <datalist id="swal-suppliers">${datalistSuppliers}</datalist>
      </div>
      ${costBox}
    `;
  }

  if (step === 1) {
    return `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
        <div style="grid-column:1/-1; padding:10px 12px; border-radius:14px; border:1px solid rgba(20,33,61,.10);
          background: linear-gradient(135deg, rgba(31,75,255,.08), rgba(0,178,255,.06));">
          <div style="font-weight:1000; font-size:12px; color:#0b1220;">Step 2 — Charges</div>
          <div style="font-size:10.5px; color:#58657a; font-weight:800; margin-top:3px;">
            Add all charges — total cost and effective/unit will be accurate.
          </div>
        </div>

        ${field("Loading Charges", "loadingCharges", "number", "0", `step="0.01" min="0"`)}
        ${field("Unloading Charges", "unloadingCharges", "number", "0", `step="0.01" min="0"`)}
        ${field("Transport Charges", "transportCharges", "number", "0", `step="0.01" min="0"`)}
        ${field("Other Charges", "otherCharges", "number", "0", `step="0.01" min="0"`)}
        <div style="grid-column:1/-1;">
          ${field("Other Charges Description", "otherChargesDescription", "text", "Optional")}
        </div>
      </div>
      ${costBox}
    `;
  }

  return `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
      <div style="grid-column:1/-1; padding:10px 12px; border-radius:14px; border:1px solid rgba(20,33,61,.10);
        background: linear-gradient(135deg, rgba(31,75,255,.08), rgba(0,178,255,.06));">
        <div style="font-weight:1000; font-size:12px; color:#0b1220;">Step 3 — Logistics & Notes</div>
        <div style="font-size:10.5px; color:#58657a; font-weight:800; margin-top:3px;">
          Optional details for tracking and operations.
        </div>
      </div>

      ${field("Transport Company", "transportCompany", "text", "Optional")}
      ${field("Vehicle Number", "vehicleNumber", "text", "Optional")}
      ${field("Warehouse Location", "warehouseLocation", "text", "Optional")}
      ${field("Expected Arrival Date", "expectedArrivalDate", "date")}
      <div style="grid-column:1/-1;">
        ${textarea("Notes", "notes", "Add any remark...")}
      </div>
    </div>
    ${costBox}
  `;
}

function bindCostPreview(getVal) {
  const update = () => {
    const qty = safeNum(getVal("quantity"));
    const rate = safeNum(getVal("purchaseRate"));
    const loading = safeNum(getVal("loadingCharges"));
    const unloading = safeNum(getVal("unloadingCharges"));
    const transport = safeNum(getVal("transportCharges"));
    const other = safeNum(getVal("otherCharges"));

    const base = qty * rate;
    const chg = loading + unloading + transport + other;
    const total = base + chg;
    const eff = qty > 0 ? total / qty : 0;

    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    set("pv-base", `₨ ${Number(base || 0).toLocaleString()}`);
    set("pv-chg", `₨ ${Number(chg || 0).toLocaleString()}`);
    set("pv-total", `₨ ${Number(total || 0).toLocaleString()}`);
    set("pv-eff", `₨ ${Number(eff || 0).toFixed(4)}`);
  };

  update();
  const ids = [
    "quantity",
    "purchaseRate",
    "loadingCharges",
    "unloadingCharges",
    "transportCharges",
    "otherCharges",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", update);
    el.addEventListener("change", update);
  });
}

function readWizardValues(keys) {
  const obj = {};
  keys.forEach((k) => {
    const el = document.getElementById(k);
    obj[k] = el ? el.value : "";
  });
  return obj;
}

/* ---------------------------------
   Component
---------------------------------- */
function StockDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [ledgerSales, setLedgerSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [sort, setSort] = useState({ key: "purchaseDate", dir: "desc" });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const [filters, setFilters] = useState({
    status: "",
    productType: "",
    supplierName: "",
  });

  const [viewingEntry, setViewingEntry] = useState(null);

  /* ✅ NEW: Transfers state (local only) */
  const [transfers, setTransfers] = useState(() => getTransfersLS());

  const companyName = "AYAN STEEL"; // change if you want (or load from localStorage)

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.productType) params.append("productType", filters.productType);
      if (filters.supplierName) params.append("supplierName", filters.supplierName);

      const [sumRes, stockRes, ledgerRes] = await Promise.all([
        api.get("/api/stock/summary"),
        api.get(`/api/stock?${params.toString()}`),
        api.get("/api/ledger"),
      ]);

      const rawEntries = Array.isArray(stockRes.data) ? stockRes.data : [];
      const allLedger = Array.isArray(ledgerRes.data) ? ledgerRes.data : [];
      const salesOnly = allLedger.filter(isSaleEntry);

      // Auto mark SOLD if sold by qty/remaining (backend status)
      const toMarkSold = rawEntries.filter((e) => {
        const effective = getEffectiveStatus(e);
        const current = (e?.status || "").toString().trim().toUpperCase();
        return effective === "SOLD" && current !== "SOLD";
      });

      if (toMarkSold.length > 0) {
        await Promise.allSettled(
          toMarkSold.map((e) =>
            api.post(`/api/stock/${e._id}/update-status`, { status: "SOLD" })
          )
        );

        const soldSet = new Set(toMarkSold.map((x) => String(x._id)));
        for (let i = 0; i < rawEntries.length; i++) {
          if (soldSet.has(String(rawEntries[i]._id))) {
            rawEntries[i] = { ...rawEntries[i], status: "SOLD" };
          }
        }

        try {
          const sumAgain = await api.get("/api/stock/summary");
          setSummary(sumAgain.data);
        } catch {
          setSummary(sumRes.data);
        }
      } else {
        setSummary(sumRes.data);
      }

      setEntries(rawEntries);
      setLedgerSales(salesOnly);
      setSelectedIds(new Set());

      // refresh transfers from LS (so they reflect immediately)
      setTransfers(getTransfersLS());
    } catch (err) {
      console.error(err);
      setError("Error loading stock dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const uniqueProducts = useMemo(
    () => [...new Set(entries.map((e) => e.productType).filter(Boolean))].sort(),
    [entries]
  );
  const uniqueSuppliers = useMemo(
    () => [...new Set(entries.map((e) => e.supplierName).filter(Boolean))].sort(),
    [entries]
  );

  const ledgerSoldByProduct = useMemo(() => {
    if (!Array.isArray(ledgerSales) || ledgerSales.length === 0) return {};
    return computeLedgerSoldByProduct(ledgerSales);
  }, [ledgerSales]);

  /* ✅ Transfers Maps */
  const transferOutByEntryId = useMemo(() => {
    const m = {};
    (transfers || []).forEach((t) => {
      const id = String(t?.fromEntryId || "").trim();
      if (!id) return;
      m[id] = (m[id] || 0) + safeNum(t?.qty);
    });
    return m;
  }, [transfers]);

  const getTransferredOutForEntry = (entryId) => safeNum(transferOutByEntryId[String(entryId)] || 0);

  const getEntryRemainingNow = (entry) => {
    const baseRem = getEntryRemaining(entry); // backend remaining / computed
    const out = getTransferredOutForEntry(entry?._id);
    const nowRem = baseRem - out;
    return nowRem > 0 ? nowRem : 0;
  };

  /* ✅ Base by-product + Adjust with Transfers */
  const baseByProduct = useMemo(
    () => computeByProductFromEntries(entries, ledgerSoldByProduct),
    [entries, ledgerSoldByProduct]
  );

  const localByProduct = useMemo(() => {
    const base = baseByProduct || {};

    const outQty = {};
    const inQty = {};
    const outVal = {};
    const inVal = {};

    (transfers || []).forEach((t) => {
      const q = safeNum(t?.qty);
      if (q <= 0) return;

      const fromKey = normalizeProductKey(t?.fromProductType);
      const toKey = normalizeProductKey(t?.toProductType);
      const unit = safeNum(t?.unitCost);

      if (fromKey) {
        outQty[fromKey] = (outQty[fromKey] || 0) + q;
        outVal[fromKey] = (outVal[fromKey] || 0) + q * unit;
      }
      if (toKey) {
        inQty[toKey] = (inQty[toKey] || 0) + q;
        inVal[toKey] = (inVal[toKey] || 0) + q * unit;
      }
    });

    const baseKeyToLabel = {};
    Object.keys(base).forEach((label) => {
      const k = normalizeProductKey(label);
      if (k && !baseKeyToLabel[k]) baseKeyToLabel[k] = label;
    });

    const allKeys = new Set([
      ...Object.keys(baseKeyToLabel),
      ...Object.keys(outQty),
      ...Object.keys(inQty),
    ]);

    const pickLabel = (nKey) => {
      if (baseKeyToLabel[nKey]) return baseKeyToLabel[nKey];
      const tIn = (transfers || []).find((x) => normalizeProductKey(x?.toProductType) === nKey);
      if (tIn?.toProductType) return tIn.toProductType;
      const tOut = (transfers || []).find((x) => normalizeProductKey(x?.fromProductType) === nKey);
      if (tOut?.fromProductType) return tOut.fromProductType;
      return nKey || "-";
    };

    const merged = {};
    allKeys.forEach((nKey) => {
      const label = pickLabel(nKey);
      const baseLabel = baseKeyToLabel[nKey];
      const b = baseLabel
        ? base[baseLabel]
        : { totalPurchased: 0, remaining: 0, sold: 0, purchaseValue: 0, remainingValue: 0 };

      const oQ = safeNum(outQty[nKey] || 0);
      const iQ = safeNum(inQty[nKey] || 0);
      const oV = safeNum(outVal[nKey] || 0);
      const iV = safeNum(inVal[nKey] || 0);

      const remaining = Math.max(0, safeNum(b.remaining) - oQ + iQ);
      const remainingValue = Math.max(0, safeNum(b.remainingValue) - oV + iV);

      merged[label] = {
        ...b,
        remaining,
        remainingValue,
        transferOut: oQ,
        transferIn: iQ,
      };
    });

    const sorted = {};
    Object.keys(merged)
      .sort((a, b) => String(a).localeCompare(String(b)))
      .forEach((k) => (sorted[k] = merged[k]));
    return sorted;
  }, [baseByProduct, transfers]);

  const stockBasedSoldQtyOverall = useMemo(() => {
    const allNeg = entries.filter((e) => getEntryQty(e) < 0);
    if (allNeg.length > 0)
      return allNeg.reduce((s, e) => s + Math.abs(getEntryQty(e)), 0);

    return entries.reduce((s, e) => {
      const q = getEntryQty(e);
      const r = getEntryRemaining(e);
      const diff = q - r;
      return s + (diff > 0 ? diff : 0);
    }, 0);
  }, [entries]);

  const ledgerBasedSoldQtyOverall = useMemo(() => {
    if (!Array.isArray(ledgerSales) || ledgerSales.length === 0) return 0;
    return ledgerSales.reduce((sum, e) => sum + getLedgerSaleQty(e), 0);
  }, [ledgerSales]);

  const totalSoldQtyOverall = useMemo(
    () => (ledgerBasedSoldQtyOverall > 0 ? ledgerBasedSoldQtyOverall : stockBasedSoldQtyOverall),
    [ledgerBasedSoldQtyOverall, stockBasedSoldQtyOverall]
  );

  const totalPurchasedOverall = useMemo(() => {
    return entries.reduce((sum, e) => {
      const q = getEntryQty(e);
      return q > 0 ? sum + q : sum;
    }, 0);
  }, [entries]);

  const totalPurchasedValueOverall = useMemo(() => {
    return entries.reduce((sum, e) => {
      const q = getEntryQty(e);
      if (q <= 0) return sum;
      return sum + calcEntryCosts(e).totalCost;
    }, 0);
  }, [entries]);

  const availableQtyOverall = useMemo(() => {
    const purchased = safeNum(totalPurchasedOverall);
    const sold = safeNum(totalSoldQtyOverall);
    const diff = purchased - sold;
    return diff > 0 ? diff : 0;
  }, [totalPurchasedOverall, totalSoldQtyOverall]);

  const availableValueOverall = useMemo(() => {
    if (availableQtyOverall <= 0 || totalPurchasedOverall <= 0) return 0;
    const avgUnitCost = totalPurchasedValueOverall / totalPurchasedOverall;
    return avgUnitCost * availableQtyOverall;
  }, [availableQtyOverall, totalPurchasedOverall, totalPurchasedValueOverall]);

  const lowStockProducts = useMemo(() => {
    const threshold = safeNum(lowStockThreshold);
    if (!localByProduct || threshold <= 0) return [];
    return Object.entries(localByProduct)
      .map(([product, data]) => ({ product, remaining: safeNum(data.remaining) }))
      .filter((x) => x.remaining > 0 && x.remaining <= threshold)
      .sort((a, b) => a.remaining - b.remaining);
  }, [localByProduct, lowStockThreshold]);

  const filteredEntries = useMemo(() => {
    const text = (searchText || "").trim().toLowerCase();
    const base = [...entries];

    const searched =
      text.length === 0
        ? base
        : base.filter((e) => {
            const blob = [
              e.productType,
              e.supplierName,
              e.supplierInvoiceNo,
              e.transportCompany,
              e.vehicleNumber,
              e.warehouseLocation,
              e.notes,
              formatDate(e.purchaseDate),
              e.status,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return blob.includes(text);
          });

    const { key, dir } = sort || {};
    const sign = dir === "asc" ? 1 : -1;

    searched.sort((a, b) => {
      if (key === "purchaseDate") {
        const av = new Date(a.purchaseDate || 0).getTime();
        const bv = new Date(b.purchaseDate || 0).getTime();
        return (av - bv) * sign;
      }
      if (key === "productType") {
        return String(a.productType || "").localeCompare(String(b.productType || "")) * sign;
      }
      if (key === "qty") return (getEntryQty(a) - getEntryQty(b)) * sign;

      // ✅ sort by current remaining (after transfers)
      if (key === "remaining") return (getEntryRemainingNow(a) - getEntryRemainingNow(b)) * sign;

      if (key === "totalCost") return (calcEntryCosts(a).totalCost - calcEntryCosts(b).totalCost) * sign;
      return 0;
    });

    return searched;
  }, [entries, searchText, sort, transferOutByEntryId]);

  /* ----------------------------
     Selection + Bulk
  ----------------------------- */
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const s = String(id);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const ids = filteredEntries.map((e) => String(e._id));
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.post(`/api/stock/${id}/update-status`, { status: newStatus });
      await loadData();
      await Swal.fire({ icon: "success", title: "Status updated", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Error updating status." });
    }
  };

  const bulkUpdateStatus = async (newStatus) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      await Swal.fire({ icon: "info", title: "No selection", text: "Select entries first." });
      return;
    }

    const result = await Swal.fire({
      title: `Update ${ids.length} entries to ${newStatus}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, update",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    await Promise.allSettled(
      ids.map((id) => api.post(`/api/stock/${id}/update-status`, { status: newStatus }))
    );

    await loadData();
    await Swal.fire({ icon: "success", title: "Bulk status updated", timer: 1100, showConfirmButton: false });
  };

  const deleteEntry = async (id) => {
    const result = await Swal.fire({
      title: "Delete stock entry?",
      text: "This will permanently remove this stock entry.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/stock/${id}`);
      await loadData();
      await Swal.fire({ icon: "success", title: "Deleted", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Error deleting stock entry.";
      Swal.fire({ icon: "error", title: "Error", text: message });
    }
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      await Swal.fire({ icon: "info", title: "No selection", text: "Select entries first." });
      return;
    }

    const result = await Swal.fire({
      title: `Delete ${ids.length} selected entries?`,
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete all",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    await Promise.allSettled(ids.map((id) => api.delete(`/api/stock/${id}`)));
    await loadData();
    await Swal.fire({ icon: "success", title: "Bulk deleted", timer: 1100, showConfirmButton: false });
  };

  /* ----------------------------
     Transfers (NEW FEATURE)
     - Valid only on remaining NOW
     - Source entry shows Purchased Qty as-is
     - Side shows Transferred Out
     - Product totals adjust: Remaining (type) decreases/increases
  ----------------------------- */
  const upsertTransfer = (t) => {
    const next = [t, ...(transfers || [])];
    setTransfers(next);
    setTransfersLS(next);
  };

  const removeTransfer = async (transferId) => {
    const res = await Swal.fire({
      title: "Undo Transfer?",
      text: "This will remove the transfer record and restore quantities.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, undo",
      cancelButtonText: "Cancel",
    });
    if (!res.isConfirmed) return;

    const next = (transfers || []).filter((x) => String(x?.id) !== String(transferId));
    setTransfers(next);
    setTransfersLS(next);
    await Swal.fire({ icon: "success", title: "Transfer removed", timer: 900, showConfirmButton: false });
  };

  const exportTransfersCSV = () => {
    const rows = [
      ["Transfer Date", "From Entry Date", "From Product", "To Product", "Qty", "Unit Cost", "Value", "Note"],
    ];

    (transfers || []).forEach((t) => {
      rows.push([
        t.transferDate || formatDate(t.createdAt) || "",
        t.fromPurchaseDate || "",
        t.fromProductType || "",
        t.toProductType || "",
        Number(t.qty || 0).toLocaleString(),
        Number(t.unitCost || 0).toFixed(4),
        `₨ ${Number((safeNum(t.qty) * safeNum(t.unitCost)) || 0).toLocaleString()}`,
        t.note || "",
      ]);
    });

    downloadCSV(`Stock_Transfers_${formatDate(new Date())}.csv`, rows);
  };

  const openTransferWizard = async ({ fromEntry = null } = {}) => {
    const sorted = [...entries].sort((a, b) => new Date(b.purchaseDate || 0) - new Date(a.purchaseDate || 0));

    const optionsHtml = sorted
      .map((e) => {
        const remNow = getEntryRemainingNow(e);
        const label = `${formatDate(e.purchaseDate)} • ${e.productType || "-"} • RemNow: ${Number(remNow || 0).toLocaleString()} • Supplier: ${e.supplierName || "-"}`;
        const disabled = remNow <= 0 ? "disabled" : "";
        const selected = fromEntry && String(fromEntry._id) === String(e._id) ? "selected" : "";
        return `<option value="${escapeHtml(e._id)}" ${disabled} ${selected}>${escapeHtml(label)}</option>`;
      })
      .join("");

    const productsDatalist = [
      ...new Set([
        ...uniqueProducts.filter(Boolean),
        ...Object.keys(localByProduct || {}),
        ...(transfers || []).map((t) => t?.toProductType).filter(Boolean),
      ]),
    ]
      .sort((a, b) => String(a).localeCompare(String(b)))
      .map((p) => `<option value="${escapeHtml(p)}"></option>`)
      .join("");

    const html = `
      <div style="text-align:left; display:flex; flex-direction:column; gap:10px;">
        <div style="padding:10px 12px; border-radius:14px; border:1px solid rgba(20,33,61,.10);
          background: linear-gradient(135deg, rgba(31,75,255,.08), rgba(0,178,255,.06));">
          <div style="font-weight:1000; font-size:12px; color:#0b1220;">Transfer Qty (Between Stock Types)</div>
          <div style="font-size:10.5px; color:#58657a; font-weight:800; margin-top:3px;">
            ✅ Valid only on <b>Remaining Now</b> of the selected entry. Source Purchased Qty stays same — we only show Transfer Out separately.
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div style="grid-column:1/-1; display:flex; flex-direction:column; gap:6px;">
            <div style="font-weight:900; font-size:11px; color:#0b1220;">From Stock Entry *</div>
            <select id="tr-from"
              style="padding:10px 11px; border-radius:12px; border:1px solid rgba(20,33,61,.15); outline:none; font-size:12px; font-weight:900; background:#fff;">
              <option value="">Select an entry...</option>
              ${optionsHtml}
            </select>
            <div style="margin-top:6px;">
              <span id="tr-available-badge"
                style="display:inline-block; padding:6px 10px; border-radius:999px; background:#dcfce7; color:#14532d; font-weight:1000; font-size:10px; border:1px solid rgba(20,33,61,.08);">
                Available: 0
              </span>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="font-weight:900; font-size:11px; color:#0b1220;">To Product Type *</div>
            <input id="tr-to" placeholder="e.g. Sheet / Coil"
              list="tr-products"
              style="padding:10px 11px; border-radius:12px; border:1px solid rgba(20,33,61,.15); outline:none; font-size:12px; font-weight:800; background:#fff;" />
            <datalist id="tr-products">${productsDatalist}</datalist>
          </div>

          <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="font-weight:900; font-size:11px; color:#0b1220;">Transfer Qty *</div>
            <input id="tr-qty" type="number" step="0.01" min="0"
              placeholder="0"
              style="padding:10px 11px; border-radius:12px; border:1px solid rgba(20,33,61,.15); outline:none; font-size:12px; font-weight:900; background:#fff;" />
          </div>

          <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="font-weight:900; font-size:11px; color:#0b1220;">Transfer Date</div>
            <input id="tr-date" type="date" value="${formatDate(new Date())}"
              style="padding:10px 11px; border-radius:12px; border:1px solid rgba(20,33,61,.15); outline:none; font-size:12px; font-weight:900; background:#fff;" />
          </div>

          <div style="grid-column:1/-1; display:flex; flex-direction:column; gap:6px;">
            <div style="font-weight:900; font-size:11px; color:#0b1220;">Note</div>
            <input id="tr-note" placeholder="Optional (e.g. Coil converted to Sheet)"
              style="padding:10px 11px; border-radius:12px; border:1px solid rgba(20,33,61,.15); outline:none; font-size:12px; font-weight:800; background:#fff;" />
          </div>
        </div>
      </div>
    `;

    const res = await Swal.fire({
      title: "🔁 Transfer Stock Qty",
      html,
      width: 980,
      showCancelButton: true,
      confirmButtonText: "Transfer",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      didOpen: () => {
        const fromSel = document.getElementById("tr-from");
        const qtyInp = document.getElementById("tr-qty");
        const badge = document.getElementById("tr-available-badge");

        const getAvail = () => {
          const id = fromSel?.value;
          if (!id) return 0;
          const e = entries.find((x) => String(x._id) === String(id));
          if (!e) return 0;
          return getEntryRemainingNow(e);
        };

        const updateBadge = () => {
          const avail = getAvail();
          if (badge) badge.textContent = `Available: ${Number(avail || 0).toLocaleString()}`;
          if (qtyInp) qtyInp.max = String(avail || 0);
        };

        if (fromSel) fromSel.addEventListener("change", updateBadge);
        updateBadge();
      },
      preConfirm: () => {
        const fromId = document.getElementById("tr-from")?.value || "";
        const toType = String(document.getElementById("tr-to")?.value || "").trim();
        const qty = safeNum(document.getElementById("tr-qty")?.value || 0);
        const tDate = document.getElementById("tr-date")?.value || formatDate(new Date());
        const note = String(document.getElementById("tr-note")?.value || "").trim();

        if (!fromId) {
          Swal.showValidationMessage("Please select a source stock entry.");
          return false;
        }
        const src = entries.find((x) => String(x._id) === String(fromId));
        if (!src) {
          Swal.showValidationMessage("Selected entry not found. Refresh and try again.");
          return false;
        }

        if (!toType) {
          Swal.showValidationMessage("Please enter/select To Product Type.");
          return false;
        }

        const fromType = String(src.productType || "").trim();
        if (normalizeProductKey(fromType) === normalizeProductKey(toType)) {
          Swal.showValidationMessage("To Product Type must be different from From Product Type.");
          return false;
        }

        const avail = getEntryRemainingNow(src);
        if (qty <= 0) {
          Swal.showValidationMessage("Transfer quantity must be greater than 0.");
          return false;
        }
        if (qty > avail) {
          Swal.showValidationMessage(`Transfer qty cannot exceed Remaining Now (${Number(avail).toLocaleString()}).`);
          return false;
        }

        return {
          fromId,
          fromType,
          toType,
          qty,
          tDate,
          note,
        };
      },
    });

    if (!res.isConfirmed) return;

    const v = res.value;
    const src = entries.find((x) => String(x._id) === String(v.fromId));
    if (!src) return;

    const unitCost = safeNum(calcEntryCosts(src).effectiveRate); // carries correct charges value
    const record = {
      id: uid(),
      createdAt: new Date().toISOString(),
      transferDate: v.tDate,
      fromEntryId: String(src._id),
      fromPurchaseDate: formatDate(src.purchaseDate),
      fromProductType: String(src.productType || "").trim(),
      toProductType: String(v.toType || "").trim(),
      qty: safeNum(v.qty),
      unitCost,
      note: String(v.note || "").trim(),
    };

    upsertTransfer(record);

    await Swal.fire({
      icon: "success",
      title: "Transferred",
      html: `<div style="text-align:left; font-weight:900;">
              ✅ <b>${record.qty}</b> moved from <b>${escapeHtml(record.fromProductType)}</b> to <b>${escapeHtml(record.toProductType)}</b><br/>
              <div style="margin-top:6px; font-size:12px; color:#58657a; font-weight:800;">
                Source entry keeps purchased qty same. We show Transfer Out separately and update Remaining Now.
              </div>
            </div>`,
    });
  };

  /* ----------------------------
     Exports
  ----------------------------- */
  const exportEntriesCSV = () => {
    const rows = [
      [
        "Purchase Date",
        "Product",
        "Supplier",
        "Status",
        "Qty (Purchased)",
        "Remaining (Now)",
        "Transferred Out",
        "Purchase Rate",
        "Total Charges",
        "Total Cost",
        "Effective Rate/Unit",
        "Invoice",
        "Transport",
        "Vehicle",
        "Warehouse",
        "Notes",
      ],
    ];

    filteredEntries.forEach((e) => {
      const qty = getEntryQty(e);
      const st = getEffectiveStatus(e);
      const costs = calcEntryCosts(e);
      const tOut = getTransferredOutForEntry(e._id);
      const remNow = getEntryRemainingNow(e);

      rows.push([
        formatDate(e.purchaseDate),
        e.productType || "",
        e.supplierName || "",
        st,
        qty,
        remNow,
        tOut,
        safeNum(e.purchaseRate),
        costs.totalCharges,
        costs.totalCost,
        costs.effectiveRate.toFixed(4),
        e.supplierInvoiceNo || "",
        e.transportCompany || "",
        e.vehicleNumber || "",
        e.warehouseLocation || "",
        e.notes || "",
      ]);
    });

    downloadCSV(`Stock_Entries_${formatDate(new Date())}.csv`, rows);
  };

  const exportDashboardPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    const now = new Date();
    const stamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    doc.setFontSize(16);
    doc.text(`${companyName} — Stock Dashboard Summary`, 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${stamp}`, 40, 58);
    doc.text(`Note: Product Remaining includes Transfers (In/Out)`, 40, 74);

    const topRows = [
      ["TOTAL STOCK (Purchased Qty)", Number(totalPurchasedOverall || 0).toLocaleString()],
      ["TOTAL PURCHASE VALUE (Charges Included)", `₨ ${Number(totalPurchasedValueOverall || 0).toLocaleString()}`],
      ["TOTAL SOLD QTY", Number(totalSoldQtyOverall || 0).toLocaleString()],
      ["AVAILABLE QTY (Overall)", Number(availableQtyOverall || 0).toLocaleString()],
      ["AVAILABLE VALUE (Avg Cost)", `₨ ${Number(availableValueOverall || 0).toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: 90,
      head: [["Metric", "Value"]],
      body: topRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [31, 75, 255] },
    });

    const byProdRows = Object.entries(localByProduct || {}).map(([product, d]) => [
      product,
      Number(d.totalPurchased || 0).toLocaleString(),
      Number(d.remaining || 0).toLocaleString(),
      Number(d.sold || 0).toLocaleString(),
      `₨ ${Number(d.purchaseValue || 0).toLocaleString()}`,
      `₨ ${Number(d.remainingValue || 0).toLocaleString()}`,
      Number(d.transferOut || 0).toLocaleString(),
      Number(d.transferIn || 0).toLocaleString(),
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [["Product", "Purchased", "Remaining", "Sold", "Purchase Value", "Remaining Value", "Transfer Out", "Transfer In"]],
      body: byProdRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 178, 255] },
      theme: "grid",
    });

    doc.save(`Stock_Dashboard_${formatDate(new Date())}.pdf`);
  };

  /* ----------------------------
     Saved Views (NEW FEATURE)
  ----------------------------- */
  const getViews = () => {
    try {
      const raw = localStorage.getItem(LS_VIEWS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveView = async () => {
    const res = await Swal.fire({
      title: "Save this View",
      input: "text",
      inputPlaceholder: "e.g. Supplier A + Available",
      showCancelButton: true,
      confirmButtonText: "Save",
    });
    if (!res.isConfirmed) return;

    const name = String(res.value || "").trim();
    if (!name) return;

    const views = getViews();
    const next = [
      ...views.filter((v) => v.name !== name),
      {
        name,
        filters,
        searchText,
        sort,
        lowStockThreshold,
      },
    ];
    localStorage.setItem(LS_VIEWS_KEY, JSON.stringify(next));

    Swal.fire({ icon: "success", title: "Saved", timer: 900, showConfirmButton: false });
  };

  const loadView = async () => {
    const views = getViews();
    if (!views.length) {
      await Swal.fire({ icon: "info", title: "No saved views", text: "Save a view first." });
      return;
    }

    const html = `
      <div style="text-align:left; display:flex; flex-direction:column; gap:8px;">
        ${views
          .map(
            (v) => `
          <button data-name="${String(v.name).replace(/"/g, "&quot;")}"
            style="text-align:left; padding:10px 12px; border-radius:12px; border:1px solid rgba(20,33,61,.12);
              background:#fff; cursor:pointer; font-weight:900;">
            ${v.name}
            <div style="font-size:10.5px; color:#58657a; font-weight:800; margin-top:3px;">
              status: ${v.filters?.status || "all"} • product: ${v.filters?.productType || "all"} • supplier: ${
              v.filters?.supplierName || "all"
            }
            </div>
          </button>
        `
          )
          .join("")}
      </div>
    `;

    await Swal.fire({
      title: "Load View",
      html,
      showCancelButton: true,
      confirmButtonText: "Close",
      didOpen: () => {
        document.querySelectorAll("button[data-name]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const name = btn.getAttribute("data-name");
            const found = views.find((x) => x.name === name);
            if (!found) return;

            setFilters(found.filters || { status: "", productType: "", supplierName: "" });
            setSearchText(found.searchText || "");
            setSort(found.sort || { key: "purchaseDate", dir: "desc" });
            setLowStockThreshold(Number(found.lowStockThreshold || 5));
            Swal.close();
          });
        });
      },
    });
  };

  const clearFilters = () => setFilters({ status: "", productType: "", supplierName: "" });

  /* ----------------------------
     View Details (kept)
  ----------------------------- */
  const viewDetails = async (entry) => {
    const qty = getEntryQty(entry);
    const remainingBase = getEntryRemaining(entry); // sales-based remaining (backend/computed)
    const effectiveStatus = getEffectiveStatus(entry);
    const isSaleEntryStock = effectiveStatus === "SOLD" || qty > remainingBase;

    if (!isSaleEntryStock) {
      setViewingEntry(entry);
      return;
    }

    try {
      const ledgerRes = await api.get("/api/ledger");
      const all = Array.isArray(ledgerRes.data) ? ledgerRes.data : [];
      const allSales = all.filter(isSaleEntry);

      const entryTypeKey = normalizeProductKey(entry.productType);

      const salesForProduct = allSales.filter((s) => {
        const topKey = normalizeProductKey(
          s.productType || s.type || s.itemType || s.product || s.stockType
        );
        if (topKey && entryTypeKey && topKey === entryTypeKey) return true;

        const items =
          (Array.isArray(s?.items) && s.items) ||
          (Array.isArray(s?.products) && s.products) ||
          (Array.isArray(s?.lineItems) && s.lineItems) ||
          (Array.isArray(s?.details) && s.details) ||
          null;

        if (!items || !entryTypeKey) return false;

        return items.some((it) => {
          const itKey = normalizeProductKey(
            it?.productType ??
              it?.type ??
              it?.itemType ??
              it?.product ??
              it?.stockType
          );
          return itKey && itKey === entryTypeKey;
        });
      });

      const linked = salesForProduct.filter((s) => isSaleLinkedToEntry(s, entry));
      const finalSales = linked.length > 0 ? linked : salesForProduct;

      setViewingEntry({
        ...entry,
        salesDetails: finalSales,
        salesLinked: linked.length > 0,
      });
    } catch (err) {
      console.error("Error fetching sales details:", err);
      setViewingEntry(entry);
    }
  };

  const closeDetails = () => setViewingEntry(null);

  /* ----------------------------
     NEW: SweetAlert Add/Edit Wizard
  ----------------------------- */
  const openStockWizard = async ({
    mode = "create", // create | edit
    entry = null,
    prefill = null,
  } = {}) => {
    const base = entry ? { ...entry } : {};
    const initial = {
      productType: prefill?.productType ?? base.productType ?? "",
      status: prefill?.status ?? base.status ?? "BOOKED",
      purchaseDate: prefill?.purchaseDate ?? formatDate(base.purchaseDate) ?? formatDate(new Date()),
      quantity: prefill?.quantity ?? (base.quantity ?? ""),
      purchaseRate: prefill?.purchaseRate ?? (base.purchaseRate ?? ""),
      supplierName: prefill?.supplierName ?? base.supplierName ?? "",
      supplierInvoiceNo: prefill?.supplierInvoiceNo ?? base.supplierInvoiceNo ?? "",

      loadingCharges: prefill?.loadingCharges ?? (base.loadingCharges ?? ""),
      unloadingCharges: prefill?.unloadingCharges ?? (base.unloadingCharges ?? ""),
      transportCharges: prefill?.transportCharges ?? (base.transportCharges ?? ""),
      otherCharges: prefill?.otherCharges ?? (base.otherCharges ?? ""),
      otherChargesDescription: prefill?.otherChargesDescription ?? base.otherChargesDescription ?? "",

      transportCompany: prefill?.transportCompany ?? base.transportCompany ?? "",
      vehicleNumber: prefill?.vehicleNumber ?? base.vehicleNumber ?? "",
      warehouseLocation: prefill?.warehouseLocation ?? base.warehouseLocation ?? "",
      expectedArrivalDate: prefill?.expectedArrivalDate ?? formatDate(base.expectedArrivalDate) ?? "",
      notes: prefill?.notes ?? base.notes ?? "",
    };

    const steps = ["Basics", "Charges", "Logistics"];
    let data = { ...initial };

    const swal = Swal.mixin({
      customClass: {
        popup: "swal2-border-radius",
        confirmButton: "swal2-confirm",
      },
      confirmButtonText: "Next →",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      reverseButtons: true,
      width: 980,
    });

    const getVal = (k) => {
      const el = document.getElementById(k);
      return el ? el.value : data[k];
    };

    for (let step = 0; step < steps.length; step++) {
      const isLast = step === steps.length - 1;

      const html = buildWizardHTML(step, data, {
        products: uniqueProducts,
        suppliers: uniqueSuppliers,
      });

      const res = await swal.fire({
        title:
          mode === "edit"
            ? `Edit Stock Entry — ${steps[step]}`
            : `New Stock Entry — ${steps[step]}`,
        html,
        confirmButtonText: isLast ? (mode === "edit" ? "Save Changes" : "Save Entry") : "Next →",
        showDenyButton: isLast && mode === "create",
        denyButtonText: "Save & Add Another",
        focusConfirm: false,
        didOpen: () => {
          bindCostPreview(getVal);
        },
        preConfirm: () => {
          const stepKeys =
            step === 0
              ? [
                  "productType",
                  "status",
                  "purchaseDate",
                  "quantity",
                  "purchaseRate",
                  "supplierName",
                  "supplierInvoiceNo",
                ]
              : step === 1
              ? [
                  "loadingCharges",
                  "unloadingCharges",
                  "transportCharges",
                  "otherCharges",
                  "otherChargesDescription",
                ]
              : [
                  "transportCompany",
                  "vehicleNumber",
                  "warehouseLocation",
                  "expectedArrivalDate",
                  "notes",
                ];

          const values = readWizardValues(stepKeys);
          data = { ...data, ...values };

          if (step === 0) {
            const qty = safeNum(values.quantity);
            const rate = safeNum(values.purchaseRate);
            if (
              !String(values.productType || "").trim() ||
              !String(values.purchaseDate || "").trim() ||
              qty <= 0 ||
              rate < 0
            ) {
              Swal.showValidationMessage("Please fill Product, Purchase Date, valid Quantity and Rate.");
              return false;
            }
          }

          if (step === 1) {
            const neg =
              safeNum(values.loadingCharges) < 0 ||
              safeNum(values.unloadingCharges) < 0 ||
              safeNum(values.transportCharges) < 0 ||
              safeNum(values.otherCharges) < 0;
            if (neg) {
              Swal.showValidationMessage("Charges cannot be negative.");
              return false;
            }
          }

          return true;
        },
      });

      if (!res.isConfirmed && !res.isDenied) {
        return; // cancelled
      }

      if (isLast) {
        const payload = {
          productType: String(data.productType || "").trim(),
          status: String(data.status || "BOOKED").toUpperCase(),
          purchaseDate: data.purchaseDate,
          quantity: safeNum(data.quantity),
          purchaseRate: safeNum(data.purchaseRate),
          supplierName: String(data.supplierName || "").trim(),
          supplierInvoiceNo: String(data.supplierInvoiceNo || "").trim(),

          transportCompany: String(data.transportCompany || "").trim(),
          vehicleNumber: String(data.vehicleNumber || "").trim(),
          warehouseLocation: String(data.warehouseLocation || "").trim(),

          loadingCharges: safeNum(data.loadingCharges),
          unloadingCharges: safeNum(data.unloadingCharges),
          transportCharges: safeNum(data.transportCharges),
          otherCharges: safeNum(data.otherCharges),
          otherChargesDescription: String(data.otherChargesDescription || "").trim(),

          expectedArrivalDate: data.expectedArrivalDate || "",
          notes: String(data.notes || "").trim(),
        };

        const costs = calcEntryCosts(payload);

        try {
          Swal.fire({
            title: mode === "edit" ? "Saving Changes..." : "Saving Entry...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });

          if (mode === "edit" && entry?._id) {
            await api.put(`/api/stock/${entry._id}`, {
              ...payload,
              totalCost: costs.totalCost,
              effectiveRate: costs.effectiveRate,
            });
          } else {
            await api.post("/api/stock", {
              ...payload,
              totalCost: costs.totalCost,
              effectiveRate: costs.effectiveRate,
            });
          }

          await loadData();

          Swal.close();
          await Swal.fire({
            icon: "success",
            title: mode === "edit" ? "Updated" : "Saved",
            text: mode === "edit" ? "Stock entry updated successfully." : "Stock entry saved successfully.",
            timer: 1200,
            showConfirmButton: false,
          });

          if (res.isDenied && mode === "create") {
            openStockWizard({
              mode: "create",
              prefill: {
                productType: payload.productType,
                supplierName: payload.supplierName,
                status: payload.status,
                purchaseDate: formatDate(new Date()),
              },
            });
          }
        } catch (err) {
          console.error(err);
          const msg = err.response?.data?.message || "Error saving stock entry.";
          await Swal.fire({ icon: "error", title: "Error", text: msg });
        }

        return;
      }
    }
  };

  const cloneEntry = (e) => {
    const costs = calcEntryCosts(e);
    openStockWizard({
      mode: "create",
      prefill: {
        productType: e.productType || "",
        status: (e.status || "BOOKED").toUpperCase(),
        purchaseDate: formatDate(new Date()),
        supplierName: e.supplierName || "",
        supplierInvoiceNo: e.supplierInvoiceNo || "",
        purchaseRate: e.purchaseRate ?? "",
        quantity: "",
        loadingCharges: e.loadingCharges ?? "",
        unloadingCharges: e.unloadingCharges ?? "",
        transportCharges: e.transportCharges ?? "",
        otherCharges: e.otherCharges ?? "",
        otherChargesDescription: e.otherChargesDescription || "",
        transportCompany: e.transportCompany || "",
        vehicleNumber: e.vehicleNumber || "",
        warehouseLocation: e.warehouseLocation || "",
        expectedArrivalDate: "",
        notes: e.notes
          ? `Cloned from ${formatDate(e.purchaseDate)} — ${e.notes}`
          : `Cloned from ${formatDate(e.purchaseDate)}`,
        _previewTotal: costs.totalCost,
      },
    });
  };

  /* ----------------------------
     Filters/Sort
  ----------------------------- */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const toggleSort = (key) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  };

  /* ----------------------------
     Tips
  ----------------------------- */
  const showTips = async () => {
    await Swal.fire({
      icon: "info",
      title: "Pro Tips",
      html: `
        <div style="text-align:left; font-weight:800; color:#24324a;">
          ✅ Use <b>Saved Views</b> for daily operations.<br/>
          ✅ Use <b>Search</b> to filter by invoice, vehicle, warehouse, notes.<br/>
          ✅ Use <b>Bulk Bar</b> to update statuses faster.<br/>
          ✅ Your <b>Total Cost</b> includes charges and effective/unit is auto-calculated.<br/>
          ✅ Use <b>Transfer Qty</b> to move remaining stock from one type to another (no backend change).
        </div>
      `,
    });
  };

  /* ----------------------------
     UI
  ----------------------------- */
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        {/* Company Header */}
        <div style={styles.brandHeader}>
          <div style={styles.brandLeft}>
            <div style={styles.logo}>AS</div>
            <div>
              <div style={styles.brandTitle}>{companyName} — Stock Center</div>
              <div style={styles.brandSub}>
                Premium Dashboard • Charges Included • Smart Search • Saved Views • Bulk Actions • Transfers
              </div>
            </div>
          </div>

          <div style={styles.topActions}>
            <button style={styles.btn} onClick={showTips}>✨ Tips</button>
            <button style={styles.btn} onClick={saveView}>💾 Save View</button>
            <button style={styles.btn} onClick={loadView}>📌 Load View</button>
            <button style={styles.btn} onClick={() => navigate("/")}>← Ledger</button>
            <button style={styles.btn} onClick={() => navigate("/available-stock")}>✅ Available Stock</button>

            {/* ✅ NEW: Transfer button */}
            <button style={styles.btn} onClick={() => openTransferWizard()}>🔁 Transfer Qty</button>

            <button style={styles.btn} onClick={exportTransfersCSV}>📤 Transfers CSV</button>
            <button style={styles.btn} onClick={exportEntriesCSV}>⬇️ Export CSV</button>
            <button style={styles.btn} onClick={exportDashboardPDF}>🧾 PDF Summary</button>
            <button style={styles.btnPrimary} onClick={() => openStockWizard({ mode: "create" })}>
              ➕ New Stock Entry
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ ...styles.panel, padding: 14 }}>
            <div style={{ fontWeight: 900, color: ui.sub }}>Loading stock dashboard...</div>
          </div>
        )}
        {error && (
          <div style={{ ...styles.panel, padding: 14 }}>
            <div style={{ fontWeight: 1000, color: ui.danger }}>{error}</div>
          </div>
        )}

        {/* Tools Row */}
        <div style={styles.toolRow}>
          <div style={styles.panel}>
            <div style={styles.panelHead}>
              <div>
                <h3 style={styles.panelTitle}>Smart Search & Sorting</h3>
                <div style={styles.panelHint}>Search by product, supplier, invoice, vehicle, warehouse, notes...</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  style={styles.btn}
                  onClick={() => {
                    setSearchText("");
                    setSort({ key: "purchaseDate", dir: "desc" });
                  }}
                >
                  ♻️ Reset
                </button>
              </div>
            </div>
            <div style={styles.panelBody}>
              <div style={styles.miniRow}>
                <input
                  style={styles.input}
                  placeholder="Search..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <select
                  style={styles.select}
                  value={sort.key}
                  onChange={(e) => setSort((p) => ({ ...p, key: e.target.value }))}
                >
                  <option value="purchaseDate">Sort: Date</option>
                  <option value="productType">Sort: Product</option>
                  <option value="qty">Sort: Qty</option>
                  <option value="remaining">Sort: Remaining (Now)</option>
                  <option value="totalCost">Sort: Total Cost</option>
                </select>
                <select
                  style={styles.select}
                  value={sort.dir}
                  onChange={(e) => setSort((p) => ({ ...p, dir: e.target.value }))}
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHead}>
              <div>
                <h3 style={styles.panelTitle}>Low Stock Alerts</h3>
                <div style={styles.panelHint}>Threshold checks Remaining (with Transfers).</div>
              </div>
              <div style={styles.badge(lowStockProducts.length ? "#ffe0e3" : "#dcfce7", lowStockProducts.length ? "#7f1d1d" : "#14532d")}>
                Alerts: {lowStockProducts.length}
              </div>
            </div>
            <div style={styles.panelBody}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 10 }}>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value) || 0)}
                  placeholder="Threshold"
                />
                <button
                  style={styles.btnPrimary}
                  onClick={() =>
                    Swal.fire({
                      icon: lowStockProducts.length ? "warning" : "success",
                      title: "Low Stock Alerts",
                      html:
                        lowStockProducts.length === 0
                          ? "No products under threshold."
                          : `<div style="text-align:left; font-weight:800;">
                              ${lowStockProducts
                                .slice(0, 12)
                                .map((x) => `<div>• <b>${escapeHtml(x.product)}</b> — Remaining: ${x.remaining}</div>`)
                                .join("")}
                             </div>`,
                    })
                  }
                >
                  View Alerts
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Panel */}
        {summary && (
          <div style={styles.panel}>
            <div style={styles.panelHead}>
              <div>
                <h3 style={styles.panelTitle}>Executive Summary</h3>
                <div style={styles.panelHint}>
                  Overall Available = Total Purchased − Total Sold (Transfers do NOT change overall, only type-wise remaining)
                </div>
              </div>
            </div>
            <div style={styles.panelBody}>
              <div style={styles.kpis}>
                <div style={styles.kpi}>
                  <div style={styles.kpiBar} />
                  <div style={styles.kpiLabel}>BOOKED</div>
                  <div style={styles.kpiValue}>{Number(summary.bookedQty || 0).toLocaleString()}</div>
                  <div style={styles.kpiSub}>₨ {Number(summary.bookedValue || 0).toLocaleString()}</div>
                </div>

                <div style={styles.kpi}>
                  <div style={styles.kpiBar} />
                  <div style={styles.kpiLabel}>ON WAY</div>
                  <div style={styles.kpiValue}>{Number(summary.onWayQty || 0).toLocaleString()}</div>
                  <div style={styles.kpiSub}>₨ {Number(summary.onWayValue || 0).toLocaleString()}</div>
                </div>

                <div style={styles.kpi}>
                  <div style={styles.kpiBar} />
                  <div style={styles.kpiLabel}>UNLOADED</div>
                  <div style={styles.kpiValue}>{Number(summary.unloadedQty || 0).toLocaleString()}</div>
                  <div style={styles.kpiSub}>₨ {Number(summary.unloadedValue || 0).toLocaleString()}</div>
                </div>

                <div style={styles.kpi}>
                  <div style={styles.kpiBar} />
                  <div style={styles.kpiLabel}>AVAILABLE QTY (OVERALL)</div>
                  <div style={{ ...styles.kpiValue, color: ui.ok }}>
                    {Number(availableQtyOverall || 0).toLocaleString()}
                  </div>
                  <div style={styles.kpiSub}>₨ {Number(availableValueOverall || 0).toLocaleString()}</div>
                </div>

                <div style={styles.kpi}>
                  <div style={styles.kpiBar} />
                  <div style={styles.kpiLabel}>TOTAL SOLD QTY</div>
                  <div style={{ ...styles.kpiValue, color: ui.danger }}>
                    {Number(totalSoldQtyOverall || 0).toLocaleString()}
                  </div>
                  <div style={styles.kpiSub}>Preferred: Ledger SALES quantity</div>
                </div>

                <div style={styles.kpi}>
                  <div style={styles.kpiBar} />
                  <div style={styles.kpiLabel}>TOTAL PURCHASED</div>
                  <div style={styles.kpiValue}>{Number(totalPurchasedOverall || 0).toLocaleString()}</div>
                  <div style={styles.kpiSub}>₨ {Number(totalPurchasedValueOverall || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div style={styles.grid2}>
          <div style={styles.panel}>
            <div style={styles.panelHead}>
              <div>
                <h3 style={styles.panelTitle}>Stock by Product</h3>
                <div style={styles.panelHint}>Remaining includes Transfers (In/Out). Purchased stays original.</div>
              </div>
            </div>
            <div style={styles.panelBody}>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Purchased</th>
                      <th style={styles.th}>Remaining (Now)</th>
                      <th style={styles.th}>Sold</th>
                      <th style={styles.th}>Purchase Value</th>
                      <th style={styles.th}>Remaining Value</th>
                      <th style={styles.th}>Transfer Out</th>
                      <th style={styles.th}>Transfer In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(localByProduct || {}).length === 0 && (
                      <tr>
                        <td style={styles.td} colSpan={8}>
                          No product summary yet.
                        </td>
                      </tr>
                    )}

                    {Object.entries(localByProduct || {}).map(([product, data], idx) => {
                      const warn = Number(data.remaining || 0) > 0 && Number(data.remaining || 0) <= lowStockThreshold;
                      return (
                        <tr key={product} style={idx % 2 ? styles.rowAlt : null}>
                          <td style={styles.td}><b>{product}</b></td>
                          <td style={styles.td}>{Number(data.totalPurchased || 0).toLocaleString()}</td>
                          <td style={styles.td}>
                            <span style={styles.badge(warn ? "#ffe0e3" : "#dcfce7", warn ? "#7f1d1d" : "#14532d")}>
                              {Number(data.remaining || 0).toLocaleString()}
                            </span>
                          </td>
                          <td style={styles.td}>{Number(data.sold || 0).toLocaleString()}</td>
                          <td style={styles.td}>₨ {Number(data.purchaseValue || 0).toLocaleString()}</td>
                          <td style={styles.td}>₨ {Number(data.remainingValue || 0).toLocaleString()}</td>
                          <td style={styles.td}>{Number(data.transferOut || 0).toLocaleString()}</td>
                          <td style={styles.td}>{Number(data.transferIn || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 10, fontSize: 11, color: ui.sub, fontWeight: 800 }}>
                Tip: Use <b>Transfer Qty</b> to move remaining stock from one type to another (entry stays same, only remaining changes).
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={styles.panel}>
            <div style={styles.panelHead}>
              <div>
                <h3 style={styles.panelTitle}>Filters</h3>
                <div style={styles.panelHint}>Use filters + search for fastest results</div>
              </div>
              <button style={styles.btn} onClick={clearFilters}>♻️ Clear</button>
            </div>

            <div style={styles.panelBody}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 1000, color: ui.sub, marginBottom: 6 }}>Status</div>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    style={styles.select}
                  >
                    <option value="">All Status</option>
                    <option value="BOOKED">Booked</option>
                    <option value="ON_WAY">On Way</option>
                    <option value="UNLOADED">Unloaded</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="SOLD">Sold</option>
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 1000, color: ui.sub, marginBottom: 6 }}>Product</div>
                  <select
                    name="productType"
                    value={filters.productType}
                    onChange={handleFilterChange}
                    style={styles.select}
                  >
                    <option value="">All Products</option>
                    {uniqueProducts.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 1000, color: ui.sub, marginBottom: 6 }}>Supplier</div>
                  <select
                    name="supplierName"
                    value={filters.supplierName}
                    onChange={handleFilterChange}
                    style={styles.select}
                  >
                    <option value="">All Suppliers</option>
                    {uniqueSuppliers.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  style={styles.btn}
                  onClick={() => openTransferWizard()}
                >
                  🔁 Transfer Qty
                </button>

                <button
                  style={styles.btnPrimary}
                  onClick={() => openStockWizard({ mode: "create" })}
                >
                  ➕ Add Stock Entry (Wizard)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Transfer History Panel */}
        <div style={styles.panel}>
          <div style={styles.panelHead}>
            <div>
              <h3 style={styles.panelTitle}>Transfer History</h3>
              <div style={styles.panelHint}>
                Local-only records • Undo any transfer to restore qty
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={styles.btn} onClick={exportTransfersCSV}>📤 Export Transfers CSV</button>
              <button
                style={styles.btnDanger}
                onClick={async () => {
                  if (!transfers?.length) return;
                  const res = await Swal.fire({
                    title: "Clear all transfers?",
                    text: "This removes all transfer records and restores type totals.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, clear",
                    cancelButtonText: "Cancel",
                  });
                  if (!res.isConfirmed) return;
                  setTransfers([]);
                  setTransfersLS([]);
                  Swal.fire({ icon: "success", title: "Cleared", timer: 900, showConfirmButton: false });
                }}
              >
                🧹 Clear Transfers
              </button>
            </div>
          </div>

          <div style={styles.panelBody}>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>From (Entry)</th>
                    <th style={styles.th}>From Type</th>
                    <th style={styles.th}>To Type</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Unit Cost</th>
                    <th style={styles.th}>Note</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(transfers || []).length === 0 && (
                    <tr>
                      <td style={styles.td} colSpan={8}>
                        No transfers yet. Use <b>Transfer Qty</b> to move remaining qty between types.
                      </td>
                    </tr>
                  )}

                  {(transfers || []).slice(0, 50).map((t, idx) => {
                    const fromLabel = `${t.fromPurchaseDate || "-"} • ${t.fromEntryId || "-"}`;
                    return (
                      <tr key={t.id || idx} style={idx % 2 ? styles.rowAlt : null}>
                        <td style={styles.td}>{t.transferDate || formatDate(t.createdAt) || "-"}</td>
                        <td style={styles.td}><b>{fromLabel}</b></td>
                        <td style={styles.td}>{t.fromProductType || "-"}</td>
                        <td style={styles.td}><b>{t.toProductType || "-"}</b></td>
                        <td style={styles.td}>{Number(t.qty || 0).toLocaleString()}</td>
                        <td style={styles.td}>₨ {Number(t.unitCost || 0).toFixed(4)}</td>
                        <td style={styles.td}>{t.note || "-"}</td>
                        <td style={styles.td}>
                          <button style={styles.actionDanger} onClick={() => removeTransfer(t.id)}>
                            Undo
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {(transfers || []).length > 50 && (
              <div style={{ marginTop: 10, fontSize: 11, color: ui.sub, fontWeight: 800 }}>
                Showing latest 50 transfers. Export CSV for full list.
              </div>
            )}
          </div>
        </div>

        {/* Entries Table */}
        <div style={styles.panel}>
          <div style={styles.panelHead}>
            <div>
              <h3 style={styles.panelTitle}>
                Stock Entries <span style={styles.panelHint}>({filteredEntries.length})</span>
              </h3>
              <div style={styles.panelHint}>
                Remaining (Now) = Remaining (sales-based) − Transfer Out • Purchased qty stays same
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={styles.btn} onClick={() => bulkUpdateStatus("AVAILABLE")}>✅ Bulk Available</button>
              <button style={styles.btnDanger} onClick={bulkDelete}>🗑️ Bulk Delete</button>
            </div>
          </div>

          <div style={styles.panelBody}>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      <input
                        type="checkbox"
                        onChange={selectAllVisible}
                        checked={
                          filteredEntries.length > 0 &&
                          filteredEntries.every((e) => selectedIds.has(String(e._id)))
                        }
                      />
                    </th>
                    <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("purchaseDate")}>Date</th>
                    <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("productType")}>Product</th>
                    <th style={styles.th}>Supplier</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("qty")}>Qty (Purchased)</th>
                    <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("remaining")}>Remaining (Now)</th>
                    <th style={styles.th}>Transferred Out</th>
                    <th style={styles.th}>Rate</th>
                    <th style={styles.th}>Charges</th>
                    <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("totalCost")}>Total Cost</th>
                    <th style={styles.th}>Eff/Unit</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEntries.map((entry, idx) => {
                    const qty = getEntryQty(entry);
                    const effectiveStatus = getEffectiveStatus(entry);
                    const statusStyle = statusColors[effectiveStatus] || { bg: "#eef2ff", color: "#0b1220" };
                    const costs = calcEntryCosts(entry);

                    const tOut = getTransferredOutForEntry(entry._id);
                    const remNow = getEntryRemainingNow(entry);

                    return (
                      <tr key={entry._id} style={idx % 2 ? styles.rowAlt : null}>
                        <td style={styles.td}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(String(entry._id))}
                            onChange={() => toggleSelect(entry._id)}
                          />
                        </td>

                        <td style={styles.td}>{formatDate(entry.purchaseDate)}</td>
                        <td style={styles.td}><b>{entry.productType || "-"}</b></td>
                        <td style={styles.td}>{entry.supplierName || "-"}</td>

                        <td style={styles.td}>
                          <span style={styles.badge(statusStyle.bg, statusStyle.color)}>
                            {effectiveStatus}
                          </span>
                        </td>

                        <td style={styles.td}>{Number(qty || 0).toLocaleString()}</td>

                        <td style={styles.td}>
                          <span
                            style={styles.badge(
                              remNow <= 0 ? "#ffe0e3" : "#dcfce7",
                              remNow <= 0 ? "#7f1d1d" : "#14532d"
                            )}
                          >
                            {Number(remNow || 0).toLocaleString()}
                          </span>
                        </td>

                        <td style={styles.td}>
                          {tOut > 0 ? (
                            <span style={styles.badge("#fff2cc", "#7a5b00")}>
                              {Number(tOut).toLocaleString()}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td style={styles.td}>₨ {Number(costs.rate || 0).toLocaleString()}</td>
                        <td style={styles.td}>₨ {Number(costs.totalCharges || 0).toLocaleString()}</td>
                        <td style={styles.td}><b>₨ {Number(costs.totalCost || 0).toLocaleString()}</b></td>
                        <td style={styles.td}>₨ {Number(costs.effectiveRate || 0).toFixed(4)}</td>

                        <td style={styles.td}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button style={styles.actionBtn} onClick={() => viewDetails(entry)}>View</button>
                            <button style={styles.actionBtn} onClick={() => openStockWizard({ mode: "edit", entry })}>
                              Edit
                            </button>
                            <button style={styles.actionBtn} onClick={() => cloneEntry(entry)}>Clone</button>

                            {/* ✅ NEW: Transfer from this entry */}
                            <button style={styles.actionBtn} onClick={() => openTransferWizard({ fromEntry: entry })}>
                              Transfer
                            </button>

                            <button style={styles.actionDanger} onClick={() => deleteEntry(entry._id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredEntries.length === 0 && !loading && (
                    <tr>
                      <td style={styles.td} colSpan={13}>
                        No entries found. Try clearing filters or search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bulk floating bar */}
        {selectedIds.size > 0 && (
          <div style={styles.footerBar}>
            <div style={styles.bulkBar}>
              <div style={{ fontWeight: 1000 }}>
                Selected: <span style={{ color: ui.accent }}>{selectedIds.size}</span>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={styles.btn} onClick={() => bulkUpdateStatus("BOOKED")}>Mark BOOKED</button>
                <button style={styles.btn} onClick={() => bulkUpdateStatus("ON_WAY")}>Mark ON WAY</button>
                <button style={styles.btn} onClick={() => bulkUpdateStatus("UNLOADED")}>Mark UNLOADED</button>
                <button style={styles.btnPrimary} onClick={() => bulkUpdateStatus("AVAILABLE")}>Mark AVAILABLE</button>
                <button style={styles.btnDanger} onClick={bulkDelete}>🗑️ Delete Selected</button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {viewingEntry && (() => {
          const qty = getEntryQty(viewingEntry);

          const remainingBase = getEntryRemaining(viewingEntry); // sales-based remaining
          const transferredOut = getTransferredOutForEntry(viewingEntry._id);
          const remainingNow = getEntryRemainingNow(viewingEntry);

          const effectiveStatus = getEffectiveStatus(viewingEntry);
          const statusStyle = statusColors[effectiveStatus] || { bg: "#eef2ff", color: "#0b1220" };
          const costs = calcEntryCosts(viewingEntry);

          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(8,12,20,.55)",
                backdropFilter: "blur(6px)",
                zIndex: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 14,
              }}
              onClick={closeDetails}
            >
              <div
                style={{
                  width: "min(1150px, 100%)",
                  maxHeight: "90vh",
                  overflow: "auto",
                  background: "#fff",
                  borderRadius: 18,
                  border: `1px solid ${ui.stroke}`,
                  boxShadow: ui.shadow,
                  padding: 16,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 1000, fontSize: 16 }}>{companyName} — Stock Entry Details</div>
                    <div style={{ fontSize: 11, color: ui.sub, fontWeight: 800, marginTop: 3 }}>
                      Purchased qty stays same • Remaining Now includes Transfer Out
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button style={styles.btn} onClick={() => openStockWizard({ mode: "edit", entry: viewingEntry })}>
                      Edit
                    </button>
                    <button style={styles.btn} onClick={() => openTransferWizard({ fromEntry: viewingEntry })}>
                      🔁 Transfer
                    </button>
                    <button style={styles.btn} onClick={closeDetails}>Close</button>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 }}>
                  <div style={styles.kpi}>
                    <div style={styles.kpiBar} />
                    <div style={styles.kpiLabel}>PRODUCT</div>
                    <div style={{ ...styles.kpiValue, fontSize: 16 }}>{viewingEntry.productType || "-"}</div>
                    <div style={styles.kpiSub}>Purchase Date: {formatDate(viewingEntry.purchaseDate)}</div>
                  </div>

                  <div style={styles.kpi}>
                    <div style={styles.kpiBar} />
                    <div style={styles.kpiLabel}>STATUS</div>
                    <div style={{ marginTop: 8 }}>
                      <span style={styles.badge(statusStyle.bg, statusStyle.color)}>{effectiveStatus}</span>
                    </div>
                    <div style={styles.kpiSub}>Supplier: {viewingEntry.supplierName || "-"}</div>
                  </div>

                  <div style={styles.kpi}>
                    <div style={styles.kpiBar} />
                    <div style={styles.kpiLabel}>REMAINING NOW</div>
                    <div style={{ ...styles.kpiValue, color: remainingNow <= 0 ? ui.danger : ui.ok }}>
                      {Number(remainingNow || 0).toLocaleString()}
                    </div>
                    <div style={styles.kpiSub}>
                      Purchased: {Number(qty || 0).toLocaleString()} • Transfer Out: {Number(transferredOut || 0).toLocaleString()}
                    </div>
                  </div>

                  <div style={styles.kpi}>
                    <div style={styles.kpiBar} />
                    <div style={styles.kpiLabel}>TOTAL COST</div>
                    <div style={{ ...styles.kpiValue, color: ui.accent }}>
                      ₨ {Number(costs.totalCost || 0).toLocaleString()}
                    </div>
                    <div style={styles.kpiSub}>
                      Eff/Unit: ₨ {Number(costs.effectiveRate || 0).toFixed(4)} • Remaining (sales-based): {Number(remainingBase || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* SOLD TO (Client Ledger Details) */}
                {viewingEntry.salesDetails &&
                  Array.isArray(viewingEntry.salesDetails) &&
                  viewingEntry.salesDetails.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 1000, fontSize: 14, color: "#0c2c7a" }}>Sold To (Client Ledger Details)</div>
                          <div style={{ fontSize: 11, color: ui.sub, fontWeight: 800, marginTop: 3 }}>
                            Showing SALES entries for <b>{viewingEntry.productType}</b>
                          </div>
                        </div>
                        {!viewingEntry.salesLinked && (
                          <span style={styles.badge("#fff2cc", "#7a5b00")}>Filtered by product type</span>
                        )}
                      </div>

                      {(() => {
                        const stats = getSalesStats(viewingEntry.salesDetails, viewingEntry.productType);
                        return (
                          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
                            <div style={styles.kpi}>
                              <div style={styles.kpiBar} />
                              <div style={styles.kpiLabel}>TOTAL CLIENTS</div>
                              <div style={styles.kpiValue}>{stats.uniqueClients}</div>
                            </div>
                            <div style={styles.kpi}>
                              <div style={styles.kpiBar} />
                              <div style={styles.kpiLabel}>TOTAL SOLD QTY</div>
                              <div style={styles.kpiValue}>{stats.totalQty.toLocaleString()}</div>
                            </div>
                            <div style={styles.kpi}>
                              <div style={styles.kpiBar} />
                              <div style={styles.kpiLabel}>TOTAL SALES VALUE</div>
                              <div style={{ ...styles.kpiValue, color: ui.ok }}>₨ {stats.totalDebit.toLocaleString()}</div>
                            </div>
                            <div style={styles.kpi}>
                              <div style={styles.kpiBar} />
                              <div style={styles.kpiLabel}>AVG SALE RATE</div>
                              <div style={styles.kpiValue}>₨ {Number(stats.avgRate || 0).toFixed(2)}</div>
                            </div>
                          </div>
                        );
                      })()}

                      <div style={{ marginTop: 10, ...styles.tableWrap }}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Date</th>
                              <th style={styles.th}>Client</th>
                              <th style={styles.th}>Description</th>
                              <th style={styles.th}>Type</th>
                              <th style={{ ...styles.th, textAlign: "right" }}>Qty</th>
                              <th style={{ ...styles.th, textAlign: "right" }}>Rate</th>
                              <th style={{ ...styles.th, textAlign: "right" }}>Loading</th>
                              <th style={{ ...styles.th, textAlign: "right" }}>Debit</th>
                              <th style={styles.th}>Payment</th>
                              <th style={{ ...styles.th, textAlign: "right" }}>Closing</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewingEntry.salesDetails.map((sale, idx) => {
                              const forcedQty = getLedgerSaleQtyForProduct(sale, viewingEntry.productType);
                              const s = normalizeSaleRow(sale, forcedQty, viewingEntry.productType);

                              const payBadgeBg =
                                s.paymentType === "CASH"
                                  ? "#dcfce7"
                                  : s.paymentType === "BANK"
                                  ? "#dbe7ff"
                                  : "#fff2cc";
                              const payBadgeColor =
                                s.paymentType === "CASH"
                                  ? "#14532d"
                                  : s.paymentType === "BANK"
                                  ? "#0c2c7a"
                                  : "#7a5b00";

                              return (
                                <tr key={idx} style={idx % 2 ? styles.rowAlt : null}>
                                  <td style={styles.td}>{formatDate(s.date)}</td>
                                  <td style={styles.td}><b>{s.accountName || "-"}</b></td>
                                  <td style={styles.td}>{s.description}</td>
                                  <td style={styles.td}>{s.type || viewingEntry.productType}</td>
                                  <td style={{ ...styles.td, textAlign: "right" }}>{(s.qty || 0).toLocaleString()}</td>
                                  <td style={{ ...styles.td, textAlign: "right" }}>₨ {(s.rate || 0).toLocaleString()}</td>
                                  <td style={{ ...styles.td, textAlign: "right" }}>₨ {(s.loading || 0).toLocaleString()}</td>
                                  <td style={{ ...styles.td, textAlign: "right" }}><b>₨ {(s.debit || 0).toLocaleString()}</b></td>
                                  <td style={styles.td}>
                                    <span style={styles.badge(payBadgeBg, payBadgeColor)}>{s.paymentType}</span>
                                  </td>
                                  <td style={{ ...styles.td, textAlign: "right" }}>
                                    {s.closingBalance != null ? Number(s.closingBalance).toLocaleString() : "-"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Quick Status Actions */}
                {effectiveStatus !== "SOLD" && (
                  <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button style={styles.btn} onClick={() => updateStatus(viewingEntry._id, "BOOKED")}>BOOKED</button>
                    <button style={styles.btn} onClick={() => updateStatus(viewingEntry._id, "ON_WAY")}>ON WAY</button>
                    <button style={styles.btn} onClick={() => updateStatus(viewingEntry._id, "UNLOADED")}>UNLOADED</button>
                    <button style={styles.btnPrimary} onClick={() => updateStatus(viewingEntry._id, "AVAILABLE")}>
                      AVAILABLE
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default StockDashboard;
