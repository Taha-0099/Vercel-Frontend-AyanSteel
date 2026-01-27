// src/StockDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import api from "./api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// ✅ PDF Export
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* -------------------------- */
/* ✅ CRAZY UI + PRO FEATURES  */
/* (Safe + No backend changes) */
/* -------------------------- */

const styles = {
  page: {
    minHeight: "100vh",
    padding: "22px 14px 70px",
    background:
      "radial-gradient(1200px 600px at 10% 10%, #eef3ff 0%, transparent 50%)," +
      "radial-gradient(1200px 600px at 90% 20%, #f1f7ff 0%, transparent 50%)," +
      "linear-gradient(180deg, #f8faff 0%, #f5f7fb 100%)",
  },

  container: {
    maxWidth: "1480px",
    margin: "0 auto",
    padding: "18px",
    background: "rgba(255,255,255,0.65)",
    backdropFilter: "blur(8px)",
    borderRadius: "16px",
    border: "1px solid #e6ebf5",
    boxShadow: "0 12px 34px rgba(16, 24, 40, 0.08)",
  },

  headerBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
    padding: "14px 14px",
    background: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e8edf7",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    flexWrap: "wrap",
    position: "sticky",
    top: 12,
    zIndex: 20,
  },

  titleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 280,
  },

  titleBadge: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #2f5597, #1f3b7a)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "18px",
    boxShadow: "0 10px 18px rgba(47, 85, 151, 0.24)",
    flex: "0 0 auto",
  },

  titleStyle: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#0f1f3d",
    letterSpacing: "0.2px",
    lineHeight: 1.1,
  },

  subTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#5a6b88",
    marginTop: "3px",
  },

  headerActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  btn: {
    padding: "9px 14px",
    borderRadius: "11px",
    border: "1px solid rgba(255,255,255,0.25)",
    cursor: "pointer",
    background:
      "linear-gradient(135deg, #2f5597 0%, #1f3b7a 55%, #2f5597 100%)",
    color: "#fff",
    fontWeight: "900",
    fontSize: "11.5px",
    letterSpacing: "0.2px",
    transition: "all .2s ease",
    boxShadow: "0 8px 18px rgba(47, 85, 151, 0.22)",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  },

  btnGhost: {
    padding: "9px 12px",
    borderRadius: "11px",
    border: "1px solid #e3e9f5",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "11.5px",
    color: "#1f3b7a",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  },

  btnDanger: {
    padding: "9px 12px",
    borderRadius: "11px",
    border: "1px solid rgba(255,255,255,0.25)",
    cursor: "pointer",
    background: "linear-gradient(135deg, #dc3545, #b02a37)",
    color: "#fff",
    fontWeight: "900",
    fontSize: "11.5px",
    boxShadow: "0 8px 18px rgba(220, 53, 69, 0.22)",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  },

  btnMini: {
    padding: "6px 10px",
    borderRadius: "10px",
    border: "1px solid #e3e9f5",
    cursor: "pointer",
    background: "#fff",
    color: "#1f3b7a",
    fontWeight: "900",
    fontSize: "10.5px",
  },

  btnDangerMini: {
    padding: "6px 10px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg, #dc3545, #b02a37)",
    color: "#fff",
    fontWeight: "900",
    fontSize: "10.5px",
  },

  topToolsRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "12px",
    marginBottom: "14px",
  },

  toolCard: {
    background: "#fff",
    border: "1px solid #e8edf7",
    borderRadius: "14px",
    padding: "14px",
    boxShadow: "0 8px 22px rgba(16, 24, 40, 0.06)",
  },

  toolTitle: {
    margin: 0,
    fontSize: 12,
    fontWeight: 900,
    color: "#0f1f3d",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  toolHint: {
    marginTop: 4,
    fontSize: 10.5,
    color: "#6b7a94",
    fontWeight: 700,
  },

  inputRow: {
    display: "grid",
    gridTemplateColumns: "1fr 160px 160px",
    gap: "10px",
    marginTop: "12px",
  },

  input: {
    padding: "9px 10px",
    borderRadius: "10px",
    border: "1px solid #d9e2f2",
    width: "100%",
    fontSize: "11.5px",
    background: "#fff",
    boxSizing: "border-box",
    outline: "none",
  },

  select: {
    padding: "9px 10px",
    borderRadius: "10px",
    border: "1px solid #d9e2f2",
    width: "100%",
    fontSize: "11.5px",
    background: "#fff",
    boxSizing: "border-box",
    outline: "none",
  },

  cardsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
  },

  card: {
    background: "#ffffff",
    padding: "16px 16px 14px",
    borderRadius: "14px",
    border: "1px solid #e8edf7",
    boxShadow: "0 8px 20px rgba(16, 24, 40, 0.06)",
    position: "relative",
    overflow: "hidden",
  },

  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "3px",
    background: "linear-gradient(90deg, #2f5597, #6aa5ff, #2f5597)",
    opacity: 0.9,
  },

  cardLabel: {
    fontSize: "10.5px",
    color: "#6b7a94",
    fontWeight: "900",
    letterSpacing: "0.6px",
  },

  cardValue: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#0f1f3d",
    marginTop: "6px",
  },

  cardSubValue: {
    fontSize: "12px",
    color: "#6b7a94",
    marginTop: "2px",
    fontWeight: "700",
  },

  section: {
    background: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e8edf7",
    padding: "16px",
    marginBottom: "14px",
    boxShadow: "0 8px 22px rgba(16, 24, 40, 0.05)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "900",
    color: "#0f1f3d",
  },

  sectionHint: {
    fontSize: "10.5px",
    color: "#6b7a94",
    fontWeight: "700",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },

  label: {
    display: "block",
    fontSize: "10.5px",
    fontWeight: "900",
    color: "#27324a",
    marginBottom: "6px",
    letterSpacing: "0.2px",
  },

  textarea: {
    padding: "9px 10px",
    borderRadius: "10px",
    border: "1px solid #d9e2f2",
    width: "100%",
    fontSize: "11.5px",
    background: "#fff",
    boxSizing: "border-box",
    outline: "none",
    minHeight: "76px",
  },

  costBox: {
    marginTop: "12px",
    padding: "14px",
    background:
      "linear-gradient(135deg, #f7faff 0%, #ffffff 40%, #f7faff 100%)",
    borderRadius: "12px",
    border: "1px solid #eef2f8",
  },

  costGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px",
    fontSize: "11.5px",
  },

  costItem: {
    padding: "10px",
    background: "#ffffff",
    borderRadius: "10px",
    border: "1px solid #eef2f8",
  },

  badge: {
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "9.5px",
    fontWeight: "900",
    letterSpacing: "0.3px",
    border: "1px solid rgba(0,0,0,0.05)",
    display: "inline-block",
  },

  tableWrap: {
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid #eef2f8",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    background: "#fff",
    minWidth: "1100px",
  },

  th: {
    padding: "11px 10px",
    fontSize: "11px",
    background: "linear-gradient(180deg, #f4f8ff 0%, #eef4ff 100%)",
    fontWeight: "900",
    textAlign: "left",
    whiteSpace: "nowrap",
    color: "#1f3b7a",
    borderBottom: "1px solid #e6ebf5",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },

  td: {
    padding: "10px 10px",
    fontSize: "11.5px",
    borderBottom: "1px solid #eef2f8",
    verticalAlign: "top",
    color: "#24324a",
  },

  rowAlt: {
    background: "#fbfdff",
  },

  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    border: "1px solid #e3e9f5",
    borderRadius: "999px",
    background: "#fff",
    fontSize: 11,
    fontWeight: 900,
    color: "#1f3b7a",
  },

  divider: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, #e7edf7, transparent)",
    margin: "14px 0",
  },

  modalBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(8, 16, 32, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "14px",
    backdropFilter: "blur(4px)",
  },

  modal: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    maxWidth: "1150px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    border: "1px solid #e8edf7",
    boxShadow: "0 18px 55px rgba(0,0,0,0.22)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },

  modalTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "900",
    color: "#0f1f3d",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px 16px",
    fontSize: "12px",
  },

  detailLabel: {
    color: "#6b7a94",
    fontSize: "10px",
    fontWeight: "900",
  },

  detailValue: {
    fontWeight: "900",
    fontSize: "13px",
    color: "#0f1f3d",
    marginTop: "3px",
  },
};

const statusColors = {
  BOOKED: { bg: "#fff3cd", color: "#856404" },
  ON_WAY: { bg: "#cfe2ff", color: "#084298" },
  UNLOADED: { bg: "#cff4fc", color: "#055160" },
  AVAILABLE: { bg: "#d1e7dd", color: "#0f5132" },
  SOLD: { bg: "#f8d7da", color: "#842029" },
};

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

const safeNum = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/,/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

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

function normalizeSaleRow(sale = {}, forcedQty = null, forcedType = null) {
  const qty = forcedQty != null ? Number(forcedQty) || 0 : getLedgerSaleQty(sale);

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

  const type =
    forcedType ||
    sale.productType ||
    sale.type ||
    sale.itemType ||
    "";

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

function isSaleLinkedToEntry(sale, entry) {
  if (!sale || !entry) return false;
  const possibleKeys = ["stockEntryId", "stockId", "entryId", "sourceStockId", "refStockId"];
  for (const k of possibleKeys) {
    if (sale[k] && String(sale[k]) === String(entry._id)) return true;
  }
  if (sale.stock && sale.stock._id && String(sale.stock._id) === String(entry._id)) return true;
  return false;
}

function getSalesStats(sales = [], productType = null) {
  const key = normalizeProductKey(productType);
  const norm = sales.map((s) => {
    const qty = key ? getLedgerSaleQtyForProduct(s, productType) : getLedgerSaleQty(s);
    return normalizeSaleRow(s, qty, productType || null);
  });

  const totalQty = norm.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);
  const totalDebit = norm.reduce((sum, s) => sum + (Number(s.debit) || 0), 0);
  const uniqueClients = new Set(norm.map((s) => s.accountName).filter(Boolean)).size;

  const avgRate =
    norm.length > 0
      ? norm.reduce((sum, s) => sum + (Number(s.rate) || 0), 0) / norm.length
      : 0;

  return { totalQty, totalDebit, uniqueClients, avgRate };
}

/* ✅ Computes totalCost + effectiveRate WITH charges (fix issue permanently) */
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

  return { qty, rate, loading, unloading, transport, other, totalCharges, baseValue, totalCost, effectiveRate };
}

/* ✅ FIXED: ledger-based sold-by-product (handles items arrays) */
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
          it?.productType ?? it?.type ?? it?.itemType ?? it?.product ?? it?.stockType
        );
        if (!key) continue;

        const q = safeNum(it?.qty ?? it?.quantity ?? it?.soldQty ?? it?.soldQuantity ?? it?.saleQty ?? 0);
        map[key] = (map[key] || 0) + Math.abs(q);
      }
      continue;
    }

    const key = normalizeProductKey(e?.productType ?? e?.type ?? e?.itemType ?? e?.product ?? e?.stockType);
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
    const soldFromNegatives = negatives.reduce((s, e) => s + Math.abs(getEntryQty(e)), 0);
    const hasRemainingInfo = purchases.some((e) => getEntryRemainingRaw(e) !== null);

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

    result[product] = { totalPurchased, remaining, sold, purchaseValue, remainingValue };
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

function StockDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [ledgerSales, setLedgerSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ✅ PRO Controls
  const [searchText, setSearchText] = useState("");
  const [sort, setSort] = useState({ key: "purchaseDate", dir: "desc" });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const [filters, setFilters] = useState({
    status: "",
    productType: "",
    supplierName: "",
  });

  const [form, setForm] = useState({
    productType: "",
    status: "BOOKED",
    purchaseDate: "",
    quantity: "",
    purchaseRate: "",
    supplierName: "",
    supplierInvoiceNo: "",
    transportCompany: "",
    vehicleNumber: "",
    warehouseLocation: "",
    loadingCharges: "",
    unloadingCharges: "",
    transportCharges: "",
    otherCharges: "",
    otherChargesDescription: "",
    expectedArrivalDate: "",
    notes: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewingEntry, setViewingEntry] = useState(null);

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

      // ✅ Auto mark SOLD if sold by qty/remaining
      const toMarkSold = rawEntries.filter((e) => {
        const effective = getEffectiveStatus(e);
        const current = (e?.status || "").toString().trim().toUpperCase();
        return effective === "SOLD" && current !== "SOLD";
      });

      if (toMarkSold.length > 0) {
        await Promise.allSettled(
          toMarkSold.map((e) => api.post(`/api/stock/${e._id}/update-status`, { status: "SOLD" }))
        );

        const soldSet = new Set(toMarkSold.map((x) => String(x._id)));
        for (let i = 0; i < rawEntries.length; i++) {
          if (soldSet.has(String(rawEntries[i]._id))) rawEntries[i] = { ...rawEntries[i], status: "SOLD" };
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

      // reset selection if items changed a lot
      setSelectedIds(new Set());
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ FIXED: charges included
  const calculateTotalCost = () => {
    const qty = safeNum(form.quantity);
    const rate = safeNum(form.purchaseRate);
    const loading = safeNum(form.loadingCharges);
    const unloading = safeNum(form.unloadingCharges);
    const transport = safeNum(form.transportCharges);
    const other = safeNum(form.otherCharges);

    const baseValue = qty * rate;
    const totalCharges = loading + unloading + transport + other;
    const totalCost = baseValue + totalCharges;
    const effectiveRate = qty > 0 ? totalCost / qty : 0;

    return { baseValue, totalCharges, totalCost, effectiveRate };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const qty = safeNum(form.quantity);
    const rate = safeNum(form.purchaseRate);

    if (!form.productType || !form.purchaseDate || qty <= 0 || rate < 0) {
      await Swal.fire({
        icon: "warning",
        title: "Missing / invalid fields",
        text: "Please fill product type, purchase date, and valid quantity + rate.",
      });
      return;
    }

    // ✅ PRO sanity checks
    const anyNegativeCharges =
      safeNum(form.loadingCharges) < 0 ||
      safeNum(form.unloadingCharges) < 0 ||
      safeNum(form.transportCharges) < 0 ||
      safeNum(form.otherCharges) < 0;

    if (anyNegativeCharges) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid charges",
        text: "Charges cannot be negative.",
      });
      return;
    }

    try {
      setSaving(true);

      // ✅ send numeric values (backend safe)
      await api.post("/api/stock", {
        ...form,
        quantity: qty,
        purchaseRate: rate,
        loadingCharges: safeNum(form.loadingCharges),
        unloadingCharges: safeNum(form.unloadingCharges),
        transportCharges: safeNum(form.transportCharges),
        otherCharges: safeNum(form.otherCharges),

        // ✅ extra fields (backend may ignore, but harmless)
        totalCost: calculateTotalCost().totalCost,
        effectiveRate: calculateTotalCost().effectiveRate,
      });

      setForm({
        productType: "",
        status: "BOOKED",
        purchaseDate: "",
        quantity: "",
        purchaseRate: "",
        supplierName: "",
        supplierInvoiceNo: "",
        transportCompany: "",
        vehicleNumber: "",
        warehouseLocation: "",
        loadingCharges: "",
        unloadingCharges: "",
        transportCharges: "",
        otherCharges: "",
        otherChargesDescription: "",
        expectedArrivalDate: "",
        notes: "",
      });

      await loadData();

      await Swal.fire({
        icon: "success",
        title: "Stock entry saved",
        timer: 1100,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Full error:", err);
      const errorMessage = err.response?.data?.message || "Error saving stock entry.";
      Swal.fire({ icon: "error", title: "Error", text: errorMessage });
    } finally {
      setSaving(false);
    }
  };




  const startEdit = (entry) => {
    setEditingId(entry._id);
    setEditForm({
      productType: entry.productType || "",
      status: entry.status || "BOOKED",
      purchaseDate: formatDate(entry.purchaseDate),
      quantity: entry.quantity ?? "",
      purchaseRate: entry.purchaseRate ?? "",
      supplierName: entry.supplierName || "",
      supplierInvoiceNo: entry.supplierInvoiceNo || "",
      transportCompany: entry.transportCompany || "",
      vehicleNumber: entry.vehicleNumber || "",
      warehouseLocation: entry.warehouseLocation || "",
      loadingCharges: entry.loadingCharges ?? "",
      unloadingCharges: entry.unloadingCharges ?? "",
      transportCharges: entry.transportCharges ?? "",
      otherCharges: entry.otherCharges ?? "",
      otherChargesDescription: entry.otherChargesDescription || "",
      expectedArrivalDate: formatDate(entry.expectedArrivalDate),
      notes: entry.notes || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async (id) => {
    const qty = safeNum(editForm.quantity);
    const rate = safeNum(editForm.purchaseRate);

    if (!editForm.productType || !editForm.purchaseDate) {
      await Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please fill product type and purchase date.",
      });
      return;
    }

    if (qty < 0 || rate < 0) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid values",
        text: "Quantity/Rate cannot be negative.",
      });
      return;
    }

    try {
      await api.put(`/api/stock/${id}`, {
        ...editForm,
        quantity: qty,
        purchaseRate: rate,
        loadingCharges: safeNum(editForm.loadingCharges),
        unloadingCharges: safeNum(editForm.unloadingCharges),
        transportCharges: safeNum(editForm.transportCharges),
        otherCharges: safeNum(editForm.otherCharges),

        // ✅ extra fields (safe)
        totalCost: calcEntryCosts({
          quantity: qty,
          purchaseRate: rate,
          loadingCharges: editForm.loadingCharges,
          unloadingCharges: editForm.unloadingCharges,
          transportCharges: editForm.transportCharges,
          otherCharges: editForm.otherCharges,
        }).totalCost,
        effectiveRate: calcEntryCosts({
          quantity: qty,
          purchaseRate: rate,
          loadingCharges: editForm.loadingCharges,
          unloadingCharges: editForm.unloadingCharges,
          transportCharges: editForm.transportCharges,
          otherCharges: editForm.otherCharges,
        }).effectiveRate,
      });

      setEditingId(null);
      await loadData();

      await Swal.fire({
        icon: "success",
        title: "Stock entry updated",
        timer: 1000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Error updating stock entry." });
    }
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

    try {
      await Promise.allSettled(ids.map((id) => api.post(`/api/stock/${id}/update-status`, { status: newStatus })));
      await loadData();
      await Swal.fire({ icon: "success", title: "Bulk status updated", timer: 1100, showConfirmButton: false });
    } catch (e) {
      console.error(e);
      await Swal.fire({ icon: "error", title: "Error", text: "Bulk update failed." });
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

    try {
      await Promise.allSettled(ids.map((id) => api.delete(`/api/stock/${id}`)));
      await loadData();
      await Swal.fire({ icon: "success", title: "Bulk deleted", timer: 1100, showConfirmButton: false });
    } catch (e) {
      console.error(e);
      await Swal.fire({ icon: "error", title: "Error", text: "Bulk delete failed." });
    }
  };

  const viewDetails = async (entry) => {
    const qty = getEntryQty(entry);
    const remaining = getEntryRemaining(entry);
    const effectiveStatus = getEffectiveStatus(entry);
    const isSaleEntryStock = effectiveStatus === "SOLD" || qty > remaining;

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
        const topKey = normalizeProductKey(s.productType || s.type || s.itemType || s.product || s.stockType);
        if (topKey && entryTypeKey && topKey === entryTypeKey) return true;

        const items =
          (Array.isArray(s?.items) && s.items) ||
          (Array.isArray(s?.products) && s.products) ||
          (Array.isArray(s?.lineItems) && s.lineItems) ||
          (Array.isArray(s?.details) && s.details) ||
          null;

        if (!items || !entryTypeKey) return false;

        return items.some((it) => {
          const itKey = normalizeProductKey(it?.productType ?? it?.type ?? it?.itemType ?? it?.product ?? it?.stockType);
          return itKey && itKey === entryTypeKey;
        });
      });

      const linked = salesForProduct.filter((s) => isSaleLinkedToEntry(s, entry));
      const finalSales = linked.length > 0 ? linked : salesForProduct;

      setViewingEntry({ ...entry, salesDetails: finalSales, salesLinked: linked.length > 0 });
    } catch (err) {
      console.error("Error fetching sales details:", err);
      setViewingEntry(entry);
    }
  };

  const closeDetails = () => setViewingEntry(null);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => setFilters({ status: "", productType: "", supplierName: "" });

  const costDetails = calculateTotalCost();

  const uniqueProducts = useMemo(
    () => [...new Set(entries.map((e) => e.productType).filter(Boolean))].sort(),
    [entries]
  );
  const uniqueSuppliers = useMemo(
    () => [...new Set(entries.map((e) => e.supplierName).filter(Boolean))].sort(),
    [entries]
  );

  // ✅ ledger sold map first
  const ledgerSoldByProduct = useMemo(() => {
    if (!Array.isArray(ledgerSales) || ledgerSales.length === 0) return {};
    return computeLedgerSoldByProduct(ledgerSales);
  }, [ledgerSales]);

  // ✅ localByProduct uses ledger fallback too
  const localByProduct = useMemo(
    () => computeByProductFromEntries(entries, ledgerSoldByProduct),
    [entries, ledgerSoldByProduct]
  );

  // ✅ overall totals (prefer ledger sold)
  const stockBasedSoldQtyOverall = useMemo(() => {
    const allNeg = entries.filter((e) => getEntryQty(e) < 0);
    if (allNeg.length > 0) return allNeg.reduce((s, e) => s + Math.abs(getEntryQty(e)), 0);

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

  // ✅ FIX: totalPurchasedValueOverall uses FULL effective cost (charges included)
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

  // ✅ Available value by avg effective unit cost
  const availableValueOverall = useMemo(() => {
    if (availableQtyOverall <= 0 || totalPurchasedOverall <= 0) return 0;
    const avgUnitCost = totalPurchasedValueOverall / totalPurchasedOverall;
    return avgUnitCost * availableQtyOverall;
  }, [availableQtyOverall, totalPurchasedOverall, totalPurchasedValueOverall]);

  // ✅ PRO: Low stock alerts by product
  const lowStockProducts = useMemo(() => {
    const threshold = safeNum(lowStockThreshold);
    if (!localByProduct || threshold <= 0) return [];
    return Object.entries(localByProduct)
      .map(([product, data]) => ({ product, remaining: safeNum(data.remaining) }))
      .filter((x) => x.remaining > 0 && x.remaining <= threshold)
      .sort((a, b) => a.remaining - b.remaining);
  }, [localByProduct, lowStockThreshold]);

  // ✅ PRO: entries pipeline (search + sort)
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
      if (key === "qty") {
        return (getEntryQty(a) - getEntryQty(b)) * sign;
      }
      if (key === "remaining") {
        return (getEntryRemaining(a) - getEntryRemaining(b)) * sign;
      }
      if (key === "totalCost") {
        return (calcEntryCosts(a).totalCost - calcEntryCosts(b).totalCost) * sign;
      }
      return 0;
    });

    return searched;
  }, [entries, searchText, sort]);

  const toggleSort = (key) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  };

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
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const exportDashboardPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    const now = new Date();
    const stamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    doc.setFontSize(16);
    doc.text("Stock Management Dashboard Summary", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${stamp}`, 40, 58);

    const topRows = [
      ["TOTAL STOCK (Purchased Qty)", Number(totalPurchasedOverall || 0).toLocaleString()],
      ["TOTAL PURCHASE VALUE", `₨ ${Number(totalPurchasedValueOverall || 0).toLocaleString()}`],
      ["TOTAL SOLD QTY", Number(totalSoldQtyOverall || 0).toLocaleString()],
      ["AVAILABLE QTY", Number(availableQtyOverall || 0).toLocaleString()],
      ["AVAILABLE VALUE (avg cost)", `₨ ${Number(availableValueOverall || 0).toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: 80,
      head: [["Metric", "Value"]],
      body: topRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [31, 59, 122] },
    });

    const byProdRows = Object.entries(localByProduct || {}).map(([product, d]) => [
      product,
      Number(d.totalPurchased || 0).toLocaleString(),
      Number(d.remaining || 0).toLocaleString(),
      Number(d.sold || 0).toLocaleString(),
      `₨ ${Number(d.purchaseValue || 0).toLocaleString()}`,
      `₨ ${Number(d.remainingValue || 0).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [["Product", "Purchased", "Remaining", "Sold", "Purchase Value", "Remaining Value"]],
      body: byProdRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [47, 85, 151] },
      theme: "grid",
    });

    doc.save(`Stock_Dashboard_Summary_${formatDate(new Date())}.pdf`);
  };

  const exportEntriesCSV = () => {
    const rows = [
      [
        "Purchase Date",
        "Product",
        "Supplier",
        "Status",
        "Qty",
        "Remaining",
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
      const rem = getEntryRemaining(e);
      const st = getEffectiveStatus(e);
      const costs = calcEntryCosts(e);

      rows.push([
        formatDate(e.purchaseDate),
        e.productType || "",
        e.supplierName || "",
        st,
        qty,
        rem,
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

  const handleFilterChip = async () => {
    await Swal.fire({
      icon: "info",
      title: "Pro Tip",
      text: "Use Search + Sort + Bulk actions to manage stock like an enterprise dashboard.",
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.headerBar}>
          <div style={styles.titleWrap}>
            <div style={styles.titleBadge}>S</div>
            <div>
              <div style={styles.titleStyle}>Stock Management Dashboard</div>
              <div style={styles.subTitle}>
                Enterprise View • Charges Included • Exports • Bulk Actions • Alerts
              </div>
            </div>
          </div>

          <div style={styles.headerActions}>
            <button style={styles.btnGhost} onClick={handleFilterChip}>
              ✨ Tips
            </button>

            <button style={styles.btnGhost} onClick={() => navigate("/")}>
              ← Ledger
            </button>

            <button style={styles.btn} onClick={() => navigate("/available-stock")}>
              ✅ Available Stock
            </button>

            <button style={styles.btnGhost} onClick={exportEntriesCSV}>
              ⬇️ Export CSV
            </button>

            <button style={styles.btn} onClick={exportDashboardPDF}>
              🧾 Download PDF Summary
            </button>
          </div>
        </div>

        {loading && <p style={styles.sectionHint}>Loading...</p>}
        {error && <p style={{ color: "red", fontWeight: 800 }}>{error}</p>}

        {/* Top Tools */}
        <div style={styles.topToolsRow}>
          <div style={styles.toolCard}>
            <h4 style={styles.toolTitle}>🔎 Smart Search + Sorting</h4>
            <div style={styles.toolHint}>Search anything: product, supplier, invoice, vehicle, warehouse, notes...</div>

            <div style={styles.inputRow}>
              <input
                style={styles.input}
                placeholder="Search in entries..."
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
                <option value="remaining">Sort: Remaining</option>
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

          <div style={styles.toolCard}>
            <h4 style={styles.toolTitle}>🚨 Low Stock Alerts</h4>
            <div style={styles.toolHint}>Set threshold and instantly see products running low.</div>

            <div style={styles.inputRow}>
              <input
                style={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value) || 0)}
                placeholder="Threshold"
              />
              <div style={styles.pill}>
                Alert Items: <span style={{ color: "#842029" }}>{lowStockProducts.length}</span>
              </div>
              <button
                style={styles.btnGhost}
                onClick={() =>
                  Swal.fire({
                    icon: lowStockProducts.length ? "warning" : "success",
                    title: "Low Stock Alerts",
                    html:
                      lowStockProducts.length === 0
                        ? "No products under threshold."
                        : `<div style="text-align:left">
                            ${lowStockProducts
                              .slice(0, 10)
                              .map((x) => `<div><b>${x.product}</b> — Remaining: ${x.remaining}</div>`)
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

        {/* Summary Cards */}
        {summary && (
          <div style={styles.cardsRow}>
            <div style={styles.card}>
              <div style={styles.cardAccent} />
              <div style={styles.cardLabel}>BOOKED</div>
              <div style={styles.cardValue}>{Number(summary.bookedQty || 0).toLocaleString()}</div>
              <div style={styles.cardSubValue}>₨ {Number(summary.bookedValue || 0).toLocaleString()}</div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardAccent} />
              <div style={styles.cardLabel}>ON WAY</div>
              <div style={styles.cardValue}>{Number(summary.onWayQty || 0).toLocaleString()}</div>
              <div style={styles.cardSubValue}>₨ {Number(summary.onWayValue || 0).toLocaleString()}</div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardAccent} />
              <div style={styles.cardLabel}>UNLOADED</div>
              <div style={styles.cardValue}>{Number(summary.unloadedQty || 0).toLocaleString()}</div>
              <div style={styles.cardSubValue}>₨ {Number(summary.unloadedValue || 0).toLocaleString()}</div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardAccent} />
              <div style={styles.cardLabel}>AVAILABLE</div>
              <div style={{ ...styles.cardValue, color: "#0f5132" }}>
                {Number(availableQtyOverall || 0).toLocaleString()}
              </div>
              <div style={styles.cardSubValue}>
                ₨ {Number(availableValueOverall || 0).toLocaleString()}
                <div style={{ fontSize: "9px", marginTop: "2px", color: "#6b7a94" }}>
                  (Total Purchased - Total Sold) • charges included
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardAccent} />
              <div style={styles.cardLabel}>TOTAL SOLD QTY</div>
              <div style={{ ...styles.cardValue, color: "#842029" }}>
                {Number(totalSoldQtyOverall || 0).toLocaleString()}
              </div>
              <div style={styles.cardSubValue}>Preferred: ledger SALES qty</div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardAccent} />
              <div style={styles.cardLabel}>TOTAL STOCK (PURCHASED)</div>
              <div style={styles.cardValue}>{Number(totalPurchasedOverall || 0).toLocaleString()}</div>
              <div style={styles.cardSubValue}>₨ {Number(totalPurchasedValueOverall || 0).toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Stock by Product */}
        {localByProduct && Object.keys(localByProduct).length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Stock by Product</h3>
              <div style={styles.sectionHint}>Accurate: charges included + safe sold logic</div>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product</th>
                    <th style={styles.th}>Total Purchased</th>
                    <th style={styles.th}>Remaining</th>
                    <th style={styles.th}>Sold</th>
                    <th style={styles.th}>Purchase Value</th>
                    <th style={styles.th}>Remaining Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(localByProduct).map(([product, data], idx) => (
                    <tr key={product} style={idx % 2 ? styles.rowAlt : null}>
                      <td style={styles.td}>
                        <strong>{product}</strong>
                      </td>
                      <td style={styles.td}>{Number(data.totalPurchased || 0).toLocaleString()}</td>
                      <td style={styles.td}>
                        <strong style={{ color: Number(data.remaining || 0) <= lowStockThreshold ? "#b02a37" : "#0f5132" }}>
                          {Number(data.remaining || 0).toLocaleString()}
                        </strong>
                      </td>
                      <td style={styles.td}>{Number(data.sold || 0).toLocaleString()}</td>
                      <td style={styles.td}>₨ {Number(data.purchaseValue || 0).toLocaleString()}</td>
                      <td style={styles.td}>₨ {Number(data.remainingValue || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add New Stock Entry */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Add New Stock Entry</h3>
            <div style={styles.sectionHint}>Charges will be included in total + effective unit cost</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Product Type *</label>
                <input
                  name="productType"
                  list="product-types"
                  value={form.productType}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
                <datalist id="product-types">
                  {uniqueProducts.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              <div>
                <label style={styles.label}>Status</label>
                <select name="status" value={form.status} onChange={handleChange} style={styles.select}>
                  <option value="BOOKED">Booked</option>
                  <option value="ON_WAY">On Way</option>
                  <option value="UNLOADED">Unloaded</option>
                  <option value="AVAILABLE">Available</option>
                </select>
              </div>

              <div>
                <label style={styles.label}>Purchase Date *</label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={form.purchaseDate}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  style={styles.input}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Purchase Rate (per unit) *</label>
                <input
                  type="number"
                  name="purchaseRate"
                  value={form.purchaseRate}
                  onChange={handleChange}
                  style={styles.input}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Supplier Name</label>
                <input
                  name="supplierName"
                  list="supplier-names"
                  value={form.supplierName}
                  onChange={handleChange}
                  style={styles.input}
                />
                <datalist id="supplier-names">
                  {uniqueSuppliers.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div>
                <label style={styles.label}>Invoice No</label>
                <input name="supplierInvoiceNo" value={form.supplierInvoiceNo} onChange={handleChange} style={styles.input} />
              </div>

              <div>
                <label style={styles.label}>Transport Company</label>
                <input name="transportCompany" value={form.transportCompany} onChange={handleChange} style={styles.input} />
              </div>

              <div>
                <label style={styles.label}>Vehicle Number</label>
                <input name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange} style={styles.input} />
              </div>

              <div>
                <label style={styles.label}>Warehouse Location</label>
                <input name="warehouseLocation" value={form.warehouseLocation} onChange={handleChange} style={styles.input} />
              </div>

              <div>
                <label style={styles.label}>Loading Charges</label>
                <input type="number" name="loadingCharges" value={form.loadingCharges} onChange={handleChange} style={styles.input} min="0" step="0.01" />
              </div>

              <div>
                <label style={styles.label}>Unloading Charges</label>
                <input type="number" name="unloadingCharges" value={form.unloadingCharges} onChange={handleChange} style={styles.input} min="0" step="0.01" />
              </div>

              <div>
                <label style={styles.label}>Transport Charges</label>
                <input type="number" name="transportCharges" value={form.transportCharges} onChange={handleChange} style={styles.input} min="0" step="0.01" />
              </div>

              <div>
                <label style={styles.label}>Other Charges</label>
                <input type="number" name="otherCharges" value={form.otherCharges} onChange={handleChange} style={styles.input} min="0" step="0.01" />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Other Charges Description</label>
                <input name="otherChargesDescription" value={form.otherChargesDescription} onChange={handleChange} style={styles.input} />
              </div>

              <div>
                <label style={styles.label}>Expected Arrival Date</label>
                <input type="date" name="expectedArrivalDate" value={form.expectedArrivalDate} onChange={handleChange} style={styles.input} />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} style={styles.textarea} />
              </div>
            </div>

            {/* Cost Box */}
            <div style={styles.costBox}>
              <div style={styles.costGrid}>
                <div style={styles.costItem}>
                  <div style={styles.sectionHint}>Base Value</div>
                  <div style={{ fontWeight: 900, fontSize: "14px" }}>₨ {Number(costDetails.baseValue || 0).toLocaleString()}</div>
                </div>
                <div style={styles.costItem}>
                  <div style={styles.sectionHint}>Total Charges</div>
                  <div style={{ fontWeight: 900, fontSize: "14px" }}>₨ {Number(costDetails.totalCharges || 0).toLocaleString()}</div>
                </div>
                <div style={styles.costItem}>
                  <div style={styles.sectionHint}>Total Cost</div>
                  <div style={{ fontWeight: 900, fontSize: "14px", color: "#1f3b7a" }}>
                    ₨ {Number(costDetails.totalCost || 0).toLocaleString()}
                  </div>
                </div>
                <div style={styles.costItem}>
                  <div style={styles.sectionHint}>Effective Rate/Unit (includes charges)</div>
                  <div style={{ fontWeight: 900, fontSize: "14px" }}>₨ {Number(costDetails.effectiveRate || 0).toFixed(4)}</div>
                </div>
              </div>
            </div>

            <button style={{ ...styles.btn, marginTop: "14px" }} type="submit" disabled={saving}>
              {saving ? "Saving..." : "➕ Add Stock Entry"}
            </button>
          </form>
        </div>

        {/* Filters */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Filters</h3>
            <div style={styles.sectionHint}>Use these + search for fastest results</div>
          </div>

          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} style={styles.select}>
                <option value="">All Status</option>
                <option value="BOOKED">Booked</option>
                <option value="ON_WAY">On Way</option>
                <option value="UNLOADED">Unloaded</option>
                <option value="AVAILABLE">Available</option>
                <option value="SOLD">Sold</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Product Type</label>
              <select name="productType" value={filters.productType} onChange={handleFilterChange} style={styles.select}>
                <option value="">All Products</option>
                {uniqueProducts.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Supplier</label>
              <select name="supplierName" value={filters.supplierName} onChange={handleFilterChange} style={styles.select}>
                <option value="">All Suppliers</option>
                {uniqueSuppliers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <button type="button" onClick={clearFilters} style={{ ...styles.btnGhost, width: "100%" }}>
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Bulk Actions</h3>
            <div style={styles.sectionHint}>
              Selected: <b>{selectedIds.size}</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={styles.btnGhost} onClick={() => bulkUpdateStatus("BOOKED")}>Mark BOOKED</button>
            <button style={styles.btnGhost} onClick={() => bulkUpdateStatus("ON_WAY")}>Mark ON WAY</button>
            <button style={styles.btnGhost} onClick={() => bulkUpdateStatus("UNLOADED")}>Mark UNLOADED</button>
            <button style={styles.btn} onClick={() => bulkUpdateStatus("AVAILABLE")}>Mark AVAILABLE</button>
            <button style={styles.btnDanger} onClick={bulkDelete}>🗑️ Delete Selected</button>
          </div>
        </div>

        {/* Entries Table */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              Stock Entries <span style={styles.sectionHint}>({filteredEntries.length})</span>
            </h3>
            <div style={styles.sectionHint}>Includes Effective Rate + charges</div>
          </div>

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
                  <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("purchaseDate")}>
                    Date
                  </th>
                  <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("productType")}>
                    Product
                  </th>
                  <th style={styles.th}>Supplier</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("qty")}>
                    Qty
                  </th>
                  <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("remaining")}>
                    Remaining
                  </th>
                  <th style={styles.th}>Rate</th>
                  <th style={styles.th}>Charges</th>
                  <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => toggleSort("totalCost")}>
                    Total Cost
                  </th>
                  <th style={styles.th}>Effective / Unit</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEntries.map((entry, idx) => {
                  const isEditing = editingId === entry._id;

                  const qty = getEntryQty(entry);
                  const remaining = getEntryRemaining(entry);
                  const effectiveStatus = getEffectiveStatus(entry);
                  const statusStyle = statusColors[effectiveStatus] || { bg: "#e9ecef", color: "#495057" };

                  if (isEditing) {
                    return (
                      <tr key={entry._id}>
                        <td style={styles.td} colSpan="12">
                          <div style={{ fontSize: "12px" }}>
                            <strong>Editing Entry</strong>

                            <div style={{ ...styles.formGrid, marginTop: "10px" }}>
                              <input type="date" name="purchaseDate" value={editForm.purchaseDate} onChange={handleEditChange} style={styles.input} />
                              <input name="productType" value={editForm.productType} onChange={handleEditChange} style={styles.input} />
                              <input name="supplierName" value={editForm.supplierName} onChange={handleEditChange} style={styles.input} placeholder="Supplier" />
                              <select name="status" value={editForm.status} onChange={handleEditChange} style={styles.select}>
                                <option value="BOOKED">Booked</option>
                                <option value="ON_WAY">On Way</option>
                                <option value="UNLOADED">Unloaded</option>
                                <option value="AVAILABLE">Available</option>
                                <option value="SOLD">Sold</option>
                              </select>

                              <input type="number" name="quantity" value={editForm.quantity} onChange={handleEditChange} style={styles.input} placeholder="Quantity" />
                              <input type="number" name="purchaseRate" value={editForm.purchaseRate} onChange={handleEditChange} style={styles.input} placeholder="Rate" />
                              <input type="number" name="loadingCharges" value={editForm.loadingCharges} onChange={handleEditChange} style={styles.input} placeholder="Loading" />
                              <input type="number" name="unloadingCharges" value={editForm.unloadingCharges} onChange={handleEditChange} style={styles.input} placeholder="Unloading" />
                              <input type="number" name="transportCharges" value={editForm.transportCharges} onChange={handleEditChange} style={styles.input} placeholder="Transport" />
                              <input type="number" name="otherCharges" value={editForm.otherCharges} onChange={handleEditChange} style={styles.input} placeholder="Other" />
                            </div>

                            <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                              <button style={styles.btn} onClick={() => saveEdit(entry._id)}>
                                Save
                              </button>
                              <button style={styles.btnGhost} onClick={cancelEdit}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const costs = calcEntryCosts(entry);
                  const statusTextColor = effectiveStatus === "SOLD" ? "#842029" : "#0f5132";

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

                      <td style={styles.td}>
                        <strong>{entry.productType}</strong>
                      </td>

                      <td style={styles.td}>{entry.supplierName || "-"}</td>

                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: statusStyle.bg, color: statusStyle.color }}>
                          {effectiveStatus}
                        </span>
                      </td>

                      <td style={styles.td}>{Number(qty || 0).toLocaleString()}</td>

                      <td style={styles.td}>
                        <strong style={{ color: statusTextColor }}>{Number(remaining || 0).toLocaleString()}</strong>
                      </td>

                      <td style={styles.td}>₨ {Number(costs.rate || 0).toLocaleString()}</td>

                      <td style={styles.td}>₨ {Number(costs.totalCharges || 0).toLocaleString()}</td>

                      <td style={styles.td}>
                        <strong>₨ {Number(costs.totalCost || 0).toLocaleString()}</strong>
                      </td>

                      <td style={styles.td}>₨ {Number(costs.effectiveRate || 0).toFixed(4)}</td>

                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button style={styles.btnMini} onClick={() => viewDetails(entry)}>
                            View
                          </button>
                          <button style={styles.btnMini} onClick={() => startEdit(entry)}>
                            Edit
                          </button>
                          <button style={styles.btnDangerMini} onClick={() => deleteEntry(entry._id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredEntries.length === 0 && !loading && (
                  <tr>
                    <td style={styles.td} colSpan="12">
                      No stock entries found. Try clearing filters or search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {viewingEntry && (() => {
          const qty = getEntryQty(viewingEntry);
          const remaining = getEntryRemaining(viewingEntry);
          const effectiveStatus = getEffectiveStatus(viewingEntry);
          const statusStyle = statusColors[effectiveStatus] || { bg: "#e9ecef", color: "#495057" };
          const costs = calcEntryCosts(viewingEntry);

          return (
            <div style={styles.modalBackdrop} onClick={closeDetails}>
              <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h2 style={styles.modalTitle}>Stock Entry Details</h2>
                  <button style={styles.btnGhost} onClick={closeDetails}>
                    Close
                  </button>
                </div>

                <div style={styles.detailGrid}>
                  <div>
                    <div style={styles.detailLabel}>Product Type</div>
                    <div style={styles.detailValue}>{viewingEntry.productType}</div>
                  </div>

                  <div>
                    <div style={styles.detailLabel}>Status</div>
                    <span style={{ ...styles.badge, background: statusStyle.bg, color: statusStyle.color }}>
                      {effectiveStatus}
                    </span>
                  </div>

                  <div>
                    <div style={styles.detailLabel}>Purchase Date</div>
                    <div style={styles.detailValue}>{formatDate(viewingEntry.purchaseDate)}</div>
                  </div>

                  <div>
                    <div style={styles.detailLabel}>Supplier</div>
                    <div style={styles.detailValue}>{viewingEntry.supplierName || "-"}</div>
                  </div>

                  <div>
                    <div style={styles.detailLabel}>Quantity</div>
                    <div style={styles.detailValue}>{Number(qty || 0).toLocaleString()}</div>
                  </div>

                  <div>
                    <div style={styles.detailLabel}>Remaining Quantity</div>
                    <div style={{ ...styles.detailValue, color: effectiveStatus === "SOLD" ? "#842029" : "#0f5132" }}>
                      {Number(remaining || 0).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div style={styles.detailLabel}>Total Charges</div>
                    <div style={styles.detailValue}>₨ {Number(costs.totalCharges || 0).toLocaleString()}</div>
                  </div>

                  <div>
                    <div style={styles.detailLabel}>Effective Rate/Unit</div>
                    <div style={styles.detailValue}>₨ {Number(costs.effectiveRate || 0).toFixed(4)}</div>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={styles.divider} />
                    <div style={styles.detailLabel}>Total Cost</div>
                    <div style={{ fontSize: "22px", fontWeight: 900, color: "#1f3b7a" }}>
                      ₨ {Number(costs.totalCost || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* SOLD TO (Client Ledger Details) */}
                {viewingEntry.salesDetails &&
                  Array.isArray(viewingEntry.salesDetails) &&
                  viewingEntry.salesDetails.length > 0 && (
                    <>
                      <div style={styles.divider} />
                      <div style={styles.sectionHeader}>
                        <h3 style={{ ...styles.sectionTitle, color: "#1f3b7a" }}>Sold To (Client Ledger Details)</h3>
                        {!viewingEntry.salesLinked && (
                          <span style={{ ...styles.badge, background: "#fff3cd", color: "#856404" }}>
                            Filtered by product type
                          </span>
                        )}
                      </div>

                      <div style={styles.sectionHint}>
                        Showing SALES entries for <strong>{viewingEntry.productType}</strong>.
                      </div>

                      {(() => {
                        const stats = getSalesStats(viewingEntry.salesDetails, viewingEntry.productType);
                        return (
                          <div style={{ ...styles.cardsRow, marginTop: "10px" }}>
                            <div style={styles.card}>
                              <div style={styles.cardAccent} />
                              <div style={styles.cardLabel}>TOTAL CLIENTS</div>
                              <div style={styles.cardValue}>{stats.uniqueClients}</div>
                            </div>
                            <div style={styles.card}>
                              <div style={styles.cardAccent} />
                              <div style={styles.cardLabel}>TOTAL SOLD QTY</div>
                              <div style={styles.cardValue}>{stats.totalQty.toLocaleString()}</div>
                            </div>
                            <div style={styles.card}>
                              <div style={styles.cardAccent} />
                              <div style={styles.cardLabel}>TOTAL SALES VALUE</div>
                              <div style={{ ...styles.cardValue, color: "#0f5132" }}>₨ {stats.totalDebit.toLocaleString()}</div>
                            </div>
                            <div style={styles.card}>
                              <div style={styles.cardAccent} />
                              <div style={styles.cardLabel}>AVG SALE RATE</div>
                              <div style={styles.cardValue}>₨ {Number(stats.avgRate || 0).toFixed(2)}</div>
                            </div>
                          </div>
                        );
                      })()}

                      <div style={{ ...styles.tableWrap, marginTop: "10px" }}>
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
                                s.paymentType === "CASH" ? "#d1e7dd" : s.paymentType === "BANK" ? "#cfe2ff" : "#fff3cd";
                              const payBadgeColor =
                                s.paymentType === "CASH" ? "#0f5132" : s.paymentType === "BANK" ? "#084298" : "#856404";

                              return (
                                <tr key={idx} style={idx % 2 ? styles.rowAlt : null}>
                                  <td style={styles.td}>{formatDate(s.date)}</td>
                                  <td style={styles.td}><strong>{s.accountName || "-"}</strong></td>
                                  <td style={styles.td}>{s.description}</td>
                                  <td style={styles.td}>{s.type || viewingEntry.productType}</td>
                                  <td style={{ ...styles.td, textAlign: "right" }}>{(s.qty || 0).toLocaleString()}</td>
                                  <td style={{ ...styles.td, textAlign: "right" }}>₨ {(s.rate || 0).toLocaleString()}</td>
                                  <td style={{ ...styles.td, textAlign: "right" }}>₨ {(s.loading || 0).toLocaleString()}</td>
                                  <td style={{ ...styles.td, textAlign: "right" }}><strong>₨ {(s.debit || 0).toLocaleString()}</strong></td>
                                  <td style={styles.td}>
                                    <span style={{ ...styles.badge, background: payBadgeBg, color: payBadgeColor }}>
                                      {s.paymentType}
                                    </span>
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
                    </>
                  )}

                {/* Status quick actions */}
                {effectiveStatus !== "AVAILABLE" && effectiveStatus !== "SOLD" && (
                  <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {effectiveStatus === "BOOKED" && (
                      <button
                        style={styles.btn}
                        onClick={() => {
                          updateStatus(viewingEntry._id, "ON_WAY");
                          closeDetails();
                        }}
                      >
                        Mark as On Way
                      </button>
                    )}
                    {effectiveStatus === "ON_WAY" && (
                      <button
                        style={styles.btn}
                        onClick={() => {
                          updateStatus(viewingEntry._id, "UNLOADED");
                          closeDetails();
                        }}
                      >
                        Mark as Unloaded
                      </button>
                    )}
                    {effectiveStatus === "UNLOADED" && (
                      <button
                        style={styles.btn}
                        onClick={() => {
                          updateStatus(viewingEntry._id, "AVAILABLE");
                          closeDetails();
                        }}
                      >
                        Mark as Available
                      </button>
                    )}
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
