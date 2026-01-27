// src/AvailableStockPage.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

/* =========================================================
   ✅ PRO AVAILABLE STOCK APP (Big Factory Style)
   - Overview KPIs + Alerts
   - Products table + Expandable Lots (FIFO allocation)
   - Valuation switch: FIFO vs Weighted Average
   - Warehouse / Supplier / Aging / Status filters
   - Reorder Point (saved in localStorage)
   - CSV Export (current filtered products + lots)
   - “Lots View” (full lot list) + “Sales View” (by product)
   ========================================================= */

/* ------------------------ */
/* Utils */
/* ------------------------ */
const safeNum = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/,/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const toISODate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString();
};

const formatDate = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (amount) => {
  const n = safeNum(amount);
  return `₨ ${n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const normalizeKey = (v) => (v || "").toString().trim().toLowerCase();
const clamp0 = (n) => (n < 0 ? 0 : n);

const daysBetween = (fromDate) => {
  const a = new Date(fromDate);
  if (Number.isNaN(a.getTime())) return 0;
  const now = new Date();
  const diff = now.getTime() - a.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/* ------------------------ */
/* Sale detection + qty */
/* ------------------------ */
const isSaleEntry = (e) => {
  const cat = (e?.category || "").toString().trim().toUpperCase();
  if (cat) return cat.includes("SALE");

  const raw = (e?.ledgerType ?? e?.type ?? e?.entryType ?? e?.transactionType ?? "")
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

const getLedgerSaleQty = (entry) => {
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
      s + safeNum(it?.qty ?? it?.quantity ?? it?.soldQty ?? it?.soldQuantity ?? it?.saleQty ?? 0),
    0
  );
  return Math.abs(sum);
};

/* ------------------------ */
/* LocalStorage: Reorder Points */
/* ------------------------ */
const REORDER_KEY = "factory_reorder_points_v1";
const readReorderMap = () => {
  try {
    const raw = localStorage.getItem(REORDER_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};
const writeReorderMap = (map) => {
  try {
    localStorage.setItem(REORDER_KEY, JSON.stringify(map || {}));
  } catch {}
};

/* ------------------------ */
/* CSV Export */
/* ------------------------ */
const toCSV = (rows) => {
  const esc = (v) => {
    const s = (v ?? "").toString();
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
};

const downloadTextFile = (filename, content, mime = "text/plain;charset=utf-8") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/* ------------------------ */
/* FIFO Allocation (lots) */
/* ------------------------ */
const allocateFIFO = (lots, soldQty) => {
  let remainingToSell = clamp0(safeNum(soldQty));
  const sorted = [...lots].sort((a, b) => {
    const da = new Date(a.purchaseDate || a.createdAt || 0).getTime();
    const db = new Date(b.purchaseDate || b.createdAt || 0).getTime();
    return da - db;
  });

  const out = sorted.map((lot) => {
    const lotQty = clamp0(safeNum(lot.qty));
    const use = Math.min(lotQty, remainingToSell);
    remainingToSell -= use;

    const remainingQty = clamp0(lotQty - use);
    const rate = safeNum(lot.avgPurchaseRate);
    const lotCOGS = use * rate;
    const remainingValue = remainingQty * rate;

    return {
      ...lot,
      soldQty: use,
      remainingQty,
      lotCOGS,
      remainingValue,
    };
  });

  const notFulfilled = clamp0(remainingToSell);
  return { lots: out, notFulfilled };
};

/* ========================================================= */
/* Styles */
/* ========================================================= */
const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 700px at 15% 0%, rgba(102,126,234,0.35), transparent 55%)," +
      "radial-gradient(900px 600px at 85% 20%, rgba(118,75,162,0.35), transparent 55%)," +
      "linear-gradient(135deg, #0b1220 0%, #111a2e 45%, #0b1220 100%)",
    padding: "18px 14px 60px",
    color: "#e5e7eb",
  },

  shell: {
    maxWidth: "1650px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "14px",
  },

  glass: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "18px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
    backdropFilter: "blur(14px)",
  },

  topBar: {
    gridColumn: "1 / -1",
    padding: "14px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 10,
    zIndex: 10,
  },

  brand: { display: "flex", alignItems: "center", gap: "12px" },

  brandIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 10px 28px rgba(102,126,234,0.35)",
    fontSize: "20px",
  },

  brandTitle: { fontSize: "16px", fontWeight: 900, letterSpacing: "0.2px", color: "#fff" },
  brandSub: { fontSize: "12px", color: "rgba(229,231,235,0.75)", marginTop: "2px" },

  actions: { display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" },

  btn: {
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    padding: "10px 12px",
    borderRadius: "12px",
    color: "#fff",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    boxShadow: "0 10px 22px rgba(102,126,234,0.25)",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    transition: "transform .12s ease, filter .12s ease",
  },

  btnGhost: {
    border: "1px solid rgba(255,255,255,0.14)",
    cursor: "pointer",
    fontWeight: 800,
    padding: "10px 12px",
    borderRadius: "12px",
    color: "#e5e7eb",
    background: "rgba(255,255,255,0.06)",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
  },

  btnDanger: {
    border: "1px solid rgba(239,68,68,0.35)",
    cursor: "pointer",
    fontWeight: 800,
    padding: "10px 12px",
    borderRadius: "12px",
    color: "#fecaca",
    background: "rgba(239,68,68,0.10)",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
  },

  leftPanel: { padding: "14px" },
  panelTitle: { fontSize: "13px", fontWeight: 900, letterSpacing: "0.7px", color: "#fff" },
  panelSub: { fontSize: "12px", color: "rgba(229,231,235,0.72)", marginTop: 4 },

  input: {
    width: "100%",
    marginTop: "10px",
    padding: "12px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    outline: "none",
    fontWeight: 700,
    fontSize: "13px",
  },

  select: {
    width: "100%",
    marginTop: "10px",
    padding: "12px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    outline: "none",
    fontWeight: 800,
    fontSize: "13px",
  },

  chipRow: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" },
  chip: {
    padding: "8px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  chipOn: {
    background: "linear-gradient(135deg, rgba(102,126,234,0.35), rgba(118,75,162,0.35))",
    border: "1px solid rgba(102,126,234,0.45)",
  },

  main: { padding: "14px" },

  tabs: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    padding: "10px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
  },
  tab: {
    padding: "9px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "12px",
    letterSpacing: "0.3px",
  },
  tabOn: {
    background: "linear-gradient(135deg, rgba(102,126,234,0.50), rgba(118,75,162,0.50))",
    border: "1px solid rgba(102,126,234,0.55)",
    color: "#fff",
  },

  kpiGrid: {
    marginTop: "12px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "12px",
  },
  kpi: {
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
    position: "relative",
    overflow: "hidden",
  },
  kpiTopLine: {
    position: "absolute",
    inset: "0 0 auto 0",
    height: "3px",
    background: "linear-gradient(90deg, #667eea, #764ba2)",
    opacity: 0.9,
  },
  kpiLabel: { fontSize: "12px", fontWeight: 900, color: "rgba(229,231,235,0.75)" },
  kpiValue: { fontSize: "22px", fontWeight: 1000, color: "#fff", marginTop: 8 },
  kpiSub: { fontSize: "12px", fontWeight: 800, color: "rgba(229,231,235,0.70)", marginTop: 6 },

  card: {
    marginTop: "12px",
    padding: "12px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
  },

  tableWrap: { overflowX: "auto", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.10)" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1100 },
  th: {
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 1000,
    letterSpacing: "0.7px",
    color: "rgba(229,231,235,0.75)",
    padding: "12px",
    position: "sticky",
    top: 0,
    background: "rgba(17,26,46,0.95)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    zIndex: 1,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px",
    fontSize: "13px",
    fontWeight: 800,
    color: "#e5e7eb",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    verticalAlign: "top",
  },

  rowHover: { cursor: "pointer" },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 1000,
    letterSpacing: "0.2px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    whiteSpace: "nowrap",
  },
  ok: { border: "1px solid rgba(16,185,129,0.30)", background: "rgba(16,185,129,0.10)", color: "#d1fae5" },
  warn: { border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.10)", color: "#fde68a" },
  bad: { border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.10)", color: "#fecaca" },

  subtle: { color: "rgba(229,231,235,0.70)", fontWeight: 800, fontSize: "12px" },

  split: { display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
    padding: 14,
  },
  modal: {
    width: "min(720px, 95vw)",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(17,26,46,0.98)",
    boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
    overflow: "hidden",
  },
  modalHead: {
    padding: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },
  modalTitle: { fontSize: "14px", fontWeight: 1000, color: "#fff" },
  modalBody: { padding: "14px" },
  modalGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },

  tiny: { fontSize: "11px", color: "rgba(229,231,235,0.70)", fontWeight: 800 },
};

/* ========================================================= */
/* Component */
/* ========================================================= */
function AvailableStockPage() {
  const navigate = useNavigate();

  // Data
  const [stockEntries, setStockEntries] = useState([]);
  const [salesData, setSalesData] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("products"); // overview | products | lots | sales
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("all");
  const [supplier, setSupplier] = useState("all");
  const [aging, setAging] = useState("all"); // all | 0-30 | 31-90 | 90+
  const [status, setStatus] = useState("all"); // all | in | low | out
  const [valuation, setValuation] = useState("FIFO"); // FIFO | AVG

  // Expand & modal
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [reorderMap, setReorderMap] = useState(() => readReorderMap());
  const [reorderModal, setReorderModal] = useState({ open: false, product: "", value: 0 });
  const [lotModal, setLotModal] = useState({ open: false, lot: null });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [stockRes, ledgerRes] = await Promise.all([api.get("/api/stock"), api.get("/api/ledger")]);
      setStockEntries(stockRes.data || []);
      const sales = (ledgerRes.data || []).filter(isSaleEntry);
      setSalesData(sales);
    } catch (err) {
      console.error(err);
      setError("Error loading stock/ledger data");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------ */
  /* Build lots (positive purchases only) */
  /* ------------------------ */
  const lotsByProduct = useMemo(() => {
    const map = {};
    (stockEntries || []).forEach((entry, idx) => {
      const product = (entry.productType || "Unknown").toString().trim() || "Unknown";
      const qty = safeNum(entry.quantity);
      if (qty <= 0) return; // purchases only

      const rate = safeNum(entry.purchaseRate);
      const loadingC = safeNum(entry.loadingCharges);
      const unloadingC = safeNum(entry.unloadingCharges);
      const transportC = safeNum(entry.transportCharges);
      const otherC = safeNum(entry.otherCharges);

      const purchaseCost = qty * rate + loadingC + unloadingC + transportC + otherC;
      const avgPurchaseRate = qty > 0 ? purchaseCost / qty : rate;

      const lot = {
        lotId: entry._id || `LOT-${idx + 1}`,
        product,
        productKey: normalizeKey(product),
        purchaseDate: entry.purchaseDate || entry.createdAt || "",
        supplierName: entry.supplierName || "",
        supplierInvoiceNo: entry.supplierInvoiceNo || "",
        warehouseLocation: entry.warehouseLocation || "Main",
        vehicleNumber: entry.vehicleNumber || "",
        notes: entry.notes || "",
        qty,
        purchaseRate: rate,
        purchaseCost,
        avgPurchaseRate,
        raw: entry,
      };

      if (!map[product]) map[product] = [];
      map[product].push(lot);
    });
    return map;
  }, [stockEntries]);

  const allWarehouses = useMemo(() => {
    const s = new Set();
    Object.values(lotsByProduct).forEach((lots) => lots.forEach((l) => s.add(l.warehouseLocation || "Main")));
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [lotsByProduct]);

  const allSuppliers = useMemo(() => {
    const s = new Set();
    Object.values(lotsByProduct).forEach((lots) => lots.forEach((l) => l.supplierName && s.add(l.supplierName)));
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [lotsByProduct]);

  /* ------------------------ */
  /* Sales aggregated by product (from ledger) */
  /* ------------------------ */
  const salesByProduct = useMemo(() => {
    const map = {};
    (salesData || []).forEach((sale) => {
      const items =
        (Array.isArray(sale?.items) && sale.items) ||
        (Array.isArray(sale?.products) && sale.products) ||
        (Array.isArray(sale?.lineItems) && sale.lineItems) ||
        (Array.isArray(sale?.details) && sale.details) ||
        null;

      if (items && items.length) {
        items.forEach((it) => {
          const pName =
            (it?.productType ?? it?.type ?? it?.itemType ?? it?.product ?? it?.stockType ?? "Unknown")
              .toString()
              .trim() || "Unknown";
          const qty = safeNum(it?.qty ?? it?.quantity ?? it?.soldQty ?? it?.soldQuantity ?? it?.saleQty ?? 0);
          if (!qty) return;

          const rate = safeNum(it?.rate ?? it?.unitRate ?? it?.price ?? 0);
          const loading = safeNum(it?.loading ?? it?.loadingCharges ?? 0);
          const itemValue = safeNum(it?.value ?? it?.amount ?? it?.total ?? qty * rate + loading);

          if (!map[pName]) map[pName] = [];
          map[pName].push({
            saleId: sale._id,
            date: sale.date || sale.createdAt || "",
            accountName: sale.accountName || sale.customerName || "",
            description: sale.description || "",
            paymentType: sale.paymentType || "",
            bankName: sale.bankName || "",
            chequeNo: sale.chequeNo || "",
            qty: Math.abs(qty),
            rate,
            loading,
            saleValue: itemValue,
            raw: sale,
          });
        });
      } else {
        const pName =
          (sale.productType || sale.type || sale.itemType || sale.product || sale.stockType || "Unknown")
            .toString()
            .trim() || "Unknown";

        const qty = getLedgerSaleQty(sale);
        if (!qty) return;

        const rate = safeNum(sale.rate ?? sale.saleRate ?? sale.unitRate ?? 0);
        const loading = safeNum(sale.loading ?? sale.loadingCharges ?? 0);
        const debit = safeNum(sale.debit ?? sale.amount ?? 0);
        const saleValue = debit || qty * rate + loading;

        if (!map[pName]) map[pName] = [];
        map[pName].push({
          saleId: sale._id,
          date: sale.date || sale.createdAt || "",
          accountName: sale.accountName || sale.customerName || "",
          description: sale.description || "",
          paymentType: sale.paymentType || "",
          bankName: sale.bankName || "",
          chequeNo: sale.chequeNo || "",
          qty: Math.abs(qty),
          rate,
          loading,
          saleValue,
          raw: sale,
        });
      }
    });

    return map;
  }, [salesData]);

  /* ------------------------ */
  /* Enrich Products with FIFO lots + valuation */
  /* ------------------------ */
  const products = useMemo(() => {
    const productNames = Object.keys(lotsByProduct).sort((a, b) => a.localeCompare(b));
    const out = productNames.map((productName) => {
      const lots = lotsByProduct[productName] || [];
      const totalPurchased = lots.reduce((s, l) => s + safeNum(l.qty), 0);
      const totalPurchaseCost = lots.reduce((s, l) => s + safeNum(l.purchaseCost), 0);
      const avgCostRate = totalPurchased > 0 ? totalPurchaseCost / totalPurchased : 0;

      const sales = salesByProduct[productName] || [];
      const totalSold = sales.reduce((s, x) => s + safeNum(x.qty), 0);
      const totalSaleValue = sales.reduce((s, x) => s + safeNum(x.saleValue), 0);

      // FIFO allocate sold qty into lots
      const { lots: fifoLots, notFulfilled } = allocateFIFO(
        lots.map((l) => ({ ...l, qty: safeNum(l.qty), avgPurchaseRate: safeNum(l.avgPurchaseRate) })),
        totalSold
      );

      const fifoRemaining = fifoLots.reduce((s, l) => s + safeNum(l.remainingQty), 0);
      const fifoCOGS = fifoLots.reduce((s, l) => s + safeNum(l.lotCOGS), 0);
      const fifoRemainingValue = fifoLots.reduce((s, l) => s + safeNum(l.remainingValue), 0);

      // AVG valuation (weighted avg cost)
      const soldClamped = Math.min(totalSold, totalPurchased);
      const avgRemainingQty = clamp0(totalPurchased - soldClamped);
      const avgCOGS = soldClamped * avgCostRate;
      const avgRemainingValue = avgRemainingQty * avgCostRate;

      const methodCOGS = valuation === "FIFO" ? fifoCOGS : avgCOGS;
      const methodRemainingQty = valuation === "FIFO" ? fifoRemaining : avgRemainingQty;
      const methodRemainingValue = valuation === "FIFO" ? fifoRemainingValue : avgRemainingValue;

      const profit = totalSaleValue - methodCOGS;
      const margin = methodCOGS > 0 ? (profit / methodCOGS) * 100 : 0;

      const reorderPoint = safeNum(reorderMap[productName] ?? 0);

      const computedStatus =
        methodRemainingQty <= 0
          ? "out"
          : reorderPoint > 0 && methodRemainingQty <= reorderPoint
          ? "low"
          : "in";

      // aging based on oldest remaining lot purchase date (FIFO)
      const oldestRemainingLot = fifoLots
        .filter((l) => safeNum(l.remainingQty) > 0)
        .sort((a, b) => new Date(a.purchaseDate || 0).getTime() - new Date(b.purchaseDate || 0).getTime())[0];

      const agingDays = oldestRemainingLot?.purchaseDate ? daysBetween(oldestRemainingLot.purchaseDate) : 0;

      const avgSaleRate = totalSold > 0 ? totalSaleValue / totalSold : 0;

      return {
        productName,
        totalPurchased,
        totalPurchaseCost,
        avgCostRate,
        sales,
        totalSold,
        totalSaleValue,
        avgSaleRate,
        fifoLots,
        notFulfilled,
        remainingQty: methodRemainingQty,
        remainingValue: methodRemainingValue,
        cogs: methodCOGS,
        profit,
        margin,
        reorderPoint,
        computedStatus,
        agingDays,
      };
    });

    return out;
  }, [lotsByProduct, salesByProduct, valuation, reorderMap]);

  /* ------------------------ */
  /* Apply Filters */
  /* ------------------------ */
  const filteredProducts = useMemo(() => {
    const q = normalizeKey(search);

    return products.filter((p) => {
      // status
      if (status !== "all" && p.computedStatus !== status) return false;

      // search on product + supplier + warehouse
      if (q) {
        const hay1 = normalizeKey(p.productName);
        const hay2 = normalizeKey(
          (p.fifoLots || [])
            .map((l) => `${l.supplierName || ""} ${l.warehouseLocation || ""} ${l.supplierInvoiceNo || ""}`)
            .join(" ")
        );
        if (!hay1.includes(q) && !hay2.includes(q)) return false;
      }

      // warehouse filter
      if (warehouse !== "all") {
        const has = (p.fifoLots || []).some((l) => (l.warehouseLocation || "Main") === warehouse);
        if (!has) return false;
      }

      // supplier filter
      if (supplier !== "all") {
        const has = (p.fifoLots || []).some((l) => (l.supplierName || "") === supplier);
        if (!has) return false;
      }

      // aging filter (based on product agingDays)
      if (aging === "0-30" && !(p.agingDays >= 0 && p.agingDays <= 30)) return false;
      if (aging === "31-90" && !(p.agingDays >= 31 && p.agingDays <= 90)) return false;
      if (aging === "90+" && !(p.agingDays >= 91)) return false;

      return true;
    });
  }, [products, search, warehouse, supplier, aging, status]);

  /* ------------------------ */
  /* Overview KPIs + Alerts */
  /* ------------------------ */
  const kpis = useMemo(() => {
    const agg = filteredProducts.reduce(
      (a, p) => {
        a.purchasedQty += safeNum(p.totalPurchased);
        a.remainingQty += safeNum(p.remainingQty);
        a.soldQty += safeNum(p.totalSold);
        a.purchaseValue += safeNum(p.totalPurchaseCost);
        a.remainingValue += safeNum(p.remainingValue);
        a.saleValue += safeNum(p.totalSaleValue);
        a.cogs += safeNum(p.cogs);
        a.profit += safeNum(p.profit);
        a.lowCount += p.computedStatus === "low" ? 1 : 0;
        a.outCount += p.computedStatus === "out" ? 1 : 0;
        return a;
      },
      {
        purchasedQty: 0,
        remainingQty: 0,
        soldQty: 0,
        purchaseValue: 0,
        remainingValue: 0,
        saleValue: 0,
        cogs: 0,
        profit: 0,
        lowCount: 0,
        outCount: 0,
      }
    );

    agg.margin = agg.cogs > 0 ? (agg.profit / agg.cogs) * 100 : 0;
    return agg;
  }, [filteredProducts]);

  const topAlerts = useMemo(() => {
    const low = filteredProducts
      .filter((p) => p.computedStatus === "low")
      .sort((a, b) => safeNum(a.remainingQty) - safeNum(b.remainingQty))
      .slice(0, 6);

    const out = filteredProducts
      .filter((p) => p.computedStatus === "out")
      .sort((a, b) => a.productName.localeCompare(b.productName))
      .slice(0, 6);

    const old = filteredProducts
      .filter((p) => safeNum(p.remainingQty) > 0)
      .sort((a, b) => safeNum(b.agingDays) - safeNum(a.agingDays))
      .slice(0, 6);

    return { low, out, old };
  }, [filteredProducts]);

  /* ------------------------ */
  /* Lots View */
  /* ------------------------ */
  const filteredLots = useMemo(() => {
    const q = normalizeKey(search);
    const lots = [];
    filteredProducts.forEach((p) => {
      (p.fifoLots || []).forEach((l) => {
        // apply warehouse/supplier filters already implied by products, but keep lot-level still ok
        if (warehouse !== "all" && (l.warehouseLocation || "Main") !== warehouse) return;
        if (supplier !== "all" && (l.supplierName || "") !== supplier) return;

        if (q) {
          const hay = normalizeKey(
            `${p.productName} ${l.supplierName || ""} ${l.warehouseLocation || ""} ${l.supplierInvoiceNo || ""}`
          );
          if (!hay.includes(q)) return;
        }

        // aging filter by lot date
        const d = l.purchaseDate ? daysBetween(l.purchaseDate) : 0;
        if (aging === "0-30" && !(d >= 0 && d <= 30)) return;
        if (aging === "31-90" && !(d >= 31 && d <= 90)) return;
        if (aging === "90+" && !(d >= 91)) return;

        lots.push({
          ...l,
          productName: p.productName,
          remainingQty: safeNum(l.remainingQty),
          soldQty: safeNum(l.soldQty),
          lotCOGS: safeNum(l.lotCOGS),
          remainingValue: safeNum(l.remainingValue),
          agingDays: d,
        });
      });
    });

    // show “active” lots first
    return lots.sort((a, b) => {
      const ar = safeNum(a.remainingQty) > 0 ? 0 : 1;
      const br = safeNum(b.remainingQty) > 0 ? 0 : 1;
      if (ar !== br) return ar - br;
      return new Date(a.purchaseDate || 0).getTime() - new Date(b.purchaseDate || 0).getTime();
    });
  }, [filteredProducts, search, warehouse, supplier, aging]);

  /* ------------------------ */
  /* Actions */
  /* ------------------------ */
  const toggleProduct = (name) => setExpandedProduct((prev) => (prev === name ? null : name));

  const openReorder = (productName) => {
    setReorderModal({
      open: true,
      product: productName,
      value: safeNum(reorderMap[productName] ?? 0),
    });
  };

  const saveReorder = () => {
    const p = reorderModal.product;
    const v = clamp0(safeNum(reorderModal.value));
    const next = { ...reorderMap, [p]: v };
    setReorderMap(next);
    writeReorderMap(next);
    setReorderModal({ open: false, product: "", value: 0 });
  };

  const exportCSV = () => {
    // Products sheet
    const header1 = [
      "Product",
      "Status",
      "ReorderPoint",
      "PurchasedQty",
      "SoldQty",
      "RemainingQty",
      "AvgCostRate",
      "AvgSaleRate",
      "PurchaseValue",
      "SaleValue",
      "COGS",
      "Profit",
      "Margin(%)",
      "RemainingValue",
      "AgingDays(OldestRemaining)",
      "NotFulfilledSalesQty",
      "ValuationMethod",
    ];

    const rows1 = filteredProducts.map((p) => [
      p.productName,
      p.computedStatus,
      p.reorderPoint,
      p.totalPurchased,
      p.totalSold,
      p.remainingQty,
      Math.round(p.avgCostRate),
      Math.round(p.avgSaleRate),
      Math.round(p.totalPurchaseCost),
      Math.round(p.totalSaleValue),
      Math.round(p.cogs),
      Math.round(p.profit),
      p.margin.toFixed(2),
      Math.round(p.remainingValue),
      p.agingDays,
      Math.round(p.notFulfilled || 0),
      valuation,
    ]);

    const csvProducts = toCSV([header1, ...rows1]);

    // Lots sheet
    const header2 = [
      "LotID",
      "Product",
      "Warehouse",
      "Supplier",
      "Invoice",
      "PurchaseDate",
      "PurchasedQty",
      "SoldQty(FIFO)",
      "RemainingQty(FIFO)",
      "AvgLotCostRate",
      "LotCostTotal",
      "RemainingValue(FIFO)",
      "AgingDays",
      "Vehicle",
      "Notes",
    ];
    const rows2 = filteredLots.map((l) => [
      l.lotId,
      l.productName,
      l.warehouseLocation || "Main",
      l.supplierName || "",
      l.supplierInvoiceNo || "",
      formatDate(l.purchaseDate),
      l.qty,
      l.soldQty,
      l.remainingQty,
      Math.round(l.avgPurchaseRate),
      Math.round(l.purchaseCost),
      Math.round(l.remainingValue),
      l.agingDays,
      l.vehicleNumber || "",
      l.notes || "",
    ]);

    const csvLots = toCSV([header2, ...rows2]);

    // Combine as 2 CSV files
    downloadTextFile(`factory_stock_products_${new Date().toISOString().slice(0, 10)}.csv`, csvProducts, "text/csv");
    downloadTextFile(`factory_stock_lots_${new Date().toISOString().slice(0, 10)}.csv`, csvLots, "text/csv");
  };

  /* ------------------------ */
  /* Badges */
  /* ------------------------ */
  const statusBadge = (s) => {
    if (s === "in") return { ...styles.badge, ...styles.ok, label: "✅ In Stock" };
    if (s === "low") return { ...styles.badge, ...styles.warn, label: "⚠️ Low Stock" };
    return { ...styles.badge, ...styles.bad, label: "🔴 Out of Stock" };
  };

  const agingBadge = (d) => {
    const days = safeNum(d);
    if (days <= 30) return { ...styles.badge, ...styles.ok, label: `🟢 Fresh • ${days}d` };
    if (days <= 90) return { ...styles.badge, ...styles.warn, label: `🟡 Aging • ${days}d` };
    return { ...styles.badge, ...styles.bad, label: `🔴 Old • ${days}d` };
  };

  /* ------------------------ */
  /* Render */
  /* ------------------------ */
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.glass, padding: 18, maxWidth: 900, margin: "30px auto", textAlign: "center" }}>
          <div style={{ fontSize: 44 }}>🏭</div>
          <div style={{ fontWeight: 1000, fontSize: 16, marginTop: 8, color: "#fff" }}>
            Loading Factory Stock Intelligence...
          </div>
          <div style={{ ...styles.subtle, marginTop: 6 }}>Fetching /api/stock + /api/ledger</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        {/* TOP BAR */}
        <div style={{ ...styles.glass, ...styles.topBar }}>
          <div style={styles.brand}>
            <div style={styles.brandIcon}>🏭</div>
            <div>
              <div style={styles.brandTitle}>Factory Stock Intelligence</div>
              <div style={styles.brandSub}>
                {filteredProducts.length} products • Valuation: <b style={{ color: "#fff" }}>{valuation}</b>
              </div>
            </div>
          </div>

          <div style={styles.actions}>
            <button style={styles.btnGhost} onClick={() => navigate("/stock")}>
              ← Stock
            </button>
            <button style={styles.btnGhost} onClick={() => navigate("/")}>
              📒 Ledger
            </button>
            <button style={styles.btnGhost} onClick={loadData}>
              🔄 Refresh
            </button>
            <button style={styles.btn} onClick={exportCSV}>
              ⬇️ Export CSV
            </button>
          </div>
        </div>

        {/* LEFT FILTER PANEL */}
        <div style={{ ...styles.glass, ...styles.leftPanel }}>
          <div style={styles.panelTitle}>FILTERS & CONTROL</div>
          <div style={styles.panelSub}>Use these like a real factory system (warehouse/supplier/aging/reorder).</div>

          <input
            style={styles.input}
            placeholder="🔎 Search product / supplier / warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select style={styles.select} value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
            {allWarehouses.map((w) => (
              <option key={w} value={w}>
                {w === "all" ? "All Warehouses" : `Warehouse: ${w}`}
              </option>
            ))}
          </select>

          <select style={styles.select} value={supplier} onChange={(e) => setSupplier(e.target.value)}>
            {allSuppliers.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Suppliers" : `Supplier: ${s}`}
              </option>
            ))}
          </select>

          <select style={styles.select} value={aging} onChange={(e) => setAging(e.target.value)}>
            <option value="all">All Aging</option>
            <option value="0-30">0–30 Days</option>
            <option value="31-90">31–90 Days</option>
            <option value="90+">90+ Days</option>
          </select>

          <div style={{ marginTop: 12, ...styles.panelTitle, fontSize: 12, opacity: 0.9 }}>STATUS</div>
          <div style={styles.chipRow}>
            <button style={{ ...styles.chip, ...(status === "all" ? styles.chipOn : {}) }} onClick={() => setStatus("all")}>
              All
            </button>
            <button style={{ ...styles.chip, ...(status === "in" ? styles.chipOn : {}) }} onClick={() => setStatus("in")}>
              ✅ In Stock
            </button>
            <button style={{ ...styles.chip, ...(status === "low" ? styles.chipOn : {}) }} onClick={() => setStatus("low")}>
              ⚠️ Low
            </button>
            <button style={{ ...styles.chip, ...(status === "out" ? styles.chipOn : {}) }} onClick={() => setStatus("out")}>
              🔴 Out
            </button>
          </div>

          <div style={{ marginTop: 14, ...styles.panelTitle, fontSize: 12, opacity: 0.9 }}>VALUATION METHOD</div>
          <div style={styles.chipRow}>
            <button
              style={{ ...styles.chip, ...(valuation === "FIFO" ? styles.chipOn : {}) }}
              onClick={() => setValuation("FIFO")}
              title="FIFO lots allocation for COGS + remaining valuation"
            >
              FIFO
            </button>
            <button
              style={{ ...styles.chip, ...(valuation === "AVG" ? styles.chipOn : {}) }}
              onClick={() => setValuation("AVG")}
              title="Weighted average cost valuation"
            >
              AVG
            </button>
          </div>

          <div style={{ ...styles.card, marginTop: 12 }}>
            <div style={styles.panelTitle}>ALERTS</div>
            <div style={{ ...styles.subtle, marginTop: 6 }}>
              Low Stock: <b style={{ color: "#fff" }}>{kpis.lowCount}</b> • Out:{" "}
              <b style={{ color: "#fff" }}>{kpis.outCount}</b>
            </div>
            <div style={{ ...styles.tiny, marginTop: 8 }}>
              Tip: Set reorder points per product to unlock real “Low Stock” warnings.
            </div>
          </div>

          {error && (
            <div style={{ ...styles.card, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.10)" }}>
              <div style={{ fontWeight: 1000, color: "#fecaca" }}>⚠️ {error}</div>
            </div>
          )}
        </div>

        {/* MAIN */}
        <div style={{ ...styles.glass, ...styles.main }}>
          {/* Tabs */}
          <div style={styles.tabs}>
            <button style={{ ...styles.tab, ...(tab === "overview" ? styles.tabOn : {}) }} onClick={() => setTab("overview")}>
              📊 Overview
            </button>
            <button style={{ ...styles.tab, ...(tab === "products" ? styles.tabOn : {}) }} onClick={() => setTab("products")}>
              📦 Products
            </button>
            <button style={{ ...styles.tab, ...(tab === "lots" ? styles.tabOn : {}) }} onClick={() => setTab("lots")}>
              🧾 Lots (Batches)
            </button>
            <button style={{ ...styles.tab, ...(tab === "sales" ? styles.tabOn : {}) }} onClick={() => setTab("sales")}>
              💰 Sales
            </button>
          </div>

          {/* KPI GRID */}
          <div style={styles.kpiGrid}>
            <div style={styles.kpi}>
              <div style={styles.kpiTopLine} />
              <div style={styles.kpiLabel}>Purchased Quantity</div>
              <div style={styles.kpiValue}>{kpis.purchasedQty.toLocaleString()}</div>
              <div style={styles.kpiSub}>Purchase Value: {formatCurrency(kpis.purchaseValue)}</div>
            </div>

            <div style={styles.kpi}>
              <div style={styles.kpiTopLine} />
              <div style={styles.kpiLabel}>Available Stock</div>
              <div style={styles.kpiValue}>{kpis.remainingQty.toLocaleString()}</div>
              <div style={styles.kpiSub}>Remaining Value: {formatCurrency(kpis.remainingValue)}</div>
            </div>

            <div style={styles.kpi}>
              <div style={styles.kpiTopLine} />
              <div style={styles.kpiLabel}>Sold Quantity</div>
              <div style={styles.kpiValue}>{kpis.soldQty.toLocaleString()}</div>
              <div style={styles.kpiSub}>Sales Value: {formatCurrency(kpis.saleValue)}</div>
            </div>

            <div style={styles.kpi}>
              <div style={styles.kpiTopLine} />
              <div style={styles.kpiLabel}>Profit (Estimated)</div>
              <div style={styles.kpiValue}>{formatCurrency(kpis.profit)}</div>
              <div style={styles.kpiSub}>Margin: {kpis.margin.toFixed(1)}%</div>
            </div>
          </div>

          {/* Tab Content */}
          {tab === "overview" && (
            <>
              <div style={styles.card}>
                <div style={{ ...styles.split, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 1000, color: "#fff" }}>⚡ Factory Alerts Dashboard</div>
                    <div style={styles.subtle}>Most critical items (low/out/old inventory)</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                  <div style={{ ...styles.card, marginTop: 0 }}>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>⚠️ Low Stock</div>
                    <div style={{ ...styles.tiny, marginTop: 6 }}>Based on reorder points</div>
                    <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                      {topAlerts.low.length === 0 ? (
                        <div style={styles.subtle}>No low-stock alerts in current filters.</div>
                      ) : (
                        topAlerts.low.map((p) => (
                          <div key={p.productName} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ fontWeight: 1000 }}>{p.productName}</div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ ...styles.badge, ...styles.warn }}>
                                Rem: {p.remainingQty.toLocaleString()} / RP: {p.reorderPoint}
                              </div>
                              <div style={styles.tiny}>Valuation: {valuation}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{ ...styles.card, marginTop: 0 }}>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>🔴 Out of Stock</div>
                    <div style={{ ...styles.tiny, marginTop: 6 }}>Immediate production risk</div>
                    <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                      {topAlerts.out.length === 0 ? (
                        <div style={styles.subtle}>No out-of-stock items in current filters.</div>
                      ) : (
                        topAlerts.out.map((p) => (
                          <div key={p.productName} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ fontWeight: 1000 }}>{p.productName}</div>
                            <div style={{ ...styles.badge, ...styles.bad }}>0 Remaining</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{ ...styles.card, marginTop: 0 }}>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>🧊 Old Inventory</div>
                    <div style={{ ...styles.tiny, marginTop: 6 }}>Oldest remaining stock (aging risk)</div>
                    <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                      {topAlerts.old.length === 0 ? (
                        <div style={styles.subtle}>No inventory aging signals.</div>
                      ) : (
                        topAlerts.old.map((p) => (
                          <div key={p.productName} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ fontWeight: 1000 }}>{p.productName}</div>
                            <div style={{ textAlign: "right" }}>
                              <div style={agingBadge(p.agingDays)}>{agingBadge(p.agingDays).label}</div>
                              <div style={styles.tiny}>Remaining: {p.remainingQty.toLocaleString()}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "products" && (
            <div style={styles.card}>
              <div style={{ ...styles.split, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 1000, color: "#fff" }}>📦 Products View</div>
                  <div style={styles.subtle}>Click a product to expand lots + set reorder point.</div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button style={styles.btnGhost} onClick={() => setExpandedProduct(null)}>
                    ⤵ Collapse All
                  </button>
                </div>
              </div>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Reorder</th>
                      <th style={styles.th}>Purchased</th>
                      <th style={styles.th}>Sold</th>
                      <th style={styles.th}>Remaining</th>
                      <th style={styles.th}>Remaining Value</th>
                      <th style={styles.th}>Sales Value</th>
                      <th style={styles.th}>COGS</th>
                      <th style={styles.th}>Profit</th>
                      <th style={styles.th}>Margin</th>
                      <th style={styles.th}>Aging</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td style={styles.td} colSpan={13}>
                          <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <div style={{ fontSize: 36 }}>📦</div>
                            <div style={{ fontWeight: 1000, marginTop: 6 }}>No products found</div>
                            <div style={styles.subtle}>Adjust filters or search to see data.</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const expanded = expandedProduct === p.productName;
                        const st = statusBadge(p.computedStatus);
                        return (
                          <React.Fragment key={p.productName}>
                            <tr
                              onClick={() => toggleProduct(p.productName)}
                              style={{ ...styles.rowHover }}
                              title="Click to expand lots"
                            >
                              <td style={styles.td}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                  <div>
                                    <div style={{ fontWeight: 1000, color: "#fff" }}>{p.productName}</div>
                                    <div style={styles.tiny}>
                                      Avg Cost: {formatCurrency(p.avgCostRate)} • Avg Sale: {formatCurrency(p.avgSaleRate)}
                                    </div>
                                  </div>
                                  <div style={{ fontSize: 16, fontWeight: 1000, opacity: 0.9 }}>
                                    {expanded ? "▼" : "▶"}
                                  </div>
                                </div>
                              </td>

                              <td style={styles.td}>
                                <span style={st}>{st.label}</span>
                              </td>

                              <td style={styles.td}>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <div style={{ fontWeight: 1000 }}>{p.reorderPoint ? p.reorderPoint : "-"}</div>
                                  <div style={styles.tiny}>Set RP for alerts</div>
                                </div>
                              </td>

                              <td style={styles.td}>{p.totalPurchased.toLocaleString()}</td>
                              <td style={styles.td}>{p.totalSold.toLocaleString()}</td>
                              <td style={styles.td}>
                                <div style={{ fontWeight: 1000, color: "#fff" }}>{p.remainingQty.toLocaleString()}</div>
                                {p.notFulfilled > 0 && (
                                  <div style={{ ...styles.tiny, color: "#fecaca" }}>
                                    ⚠ Unmatched sales qty: {Math.round(p.notFulfilled).toLocaleString()}
                                  </div>
                                )}
                              </td>

                              <td style={styles.td}>{formatCurrency(p.remainingValue)}</td>
                              <td style={styles.td}>{formatCurrency(p.totalSaleValue)}</td>
                              <td style={styles.td}>{formatCurrency(p.cogs)}</td>
                              <td style={styles.td}>
                                <span style={{ fontWeight: 1000, color: p.profit >= 0 ? "#d1fae5" : "#fecaca" }}>
                                  {formatCurrency(p.profit)}
                                </span>
                              </td>
                              <td style={styles.td}>{p.margin.toFixed(1)}%</td>
                              <td style={styles.td}>
                                <span style={agingBadge(p.agingDays)}>{agingBadge(p.agingDays).label}</span>
                              </td>

                              <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <button style={styles.btnGhost} onClick={() => openReorder(p.productName)}>
                                    🎯 Reorder
                                  </button>
                                  <button
                                    style={styles.btnGhost}
                                    onClick={() => {
                                      setTab("sales");
                                      setExpandedProduct(p.productName);
                                    }}
                                  >
                                    💰 Sales
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {expanded && (
                              <tr>
                                <td style={{ ...styles.td, padding: 0 }} colSpan={13}>
                                  <div style={{ padding: 12 }}>
                                    <div style={{ ...styles.split, marginBottom: 10 }}>
                                      <div>
                                        <div style={{ fontWeight: 1000, color: "#fff" }}>🧾 Lots (FIFO Allocation)</div>
                                        <div style={styles.subtle}>
                                          This shows real lot-level sold/remaining using FIFO.
                                        </div>
                                      </div>
                                      <div style={styles.tiny}>
                                        Valuation shown in KPIs = <b style={{ color: "#fff" }}>{valuation}</b>
                                      </div>
                                    </div>

                                    <div style={styles.tableWrap}>
                                      <table style={{ ...styles.table, minWidth: 1000 }}>
                                        <thead>
                                          <tr>
                                            <th style={styles.th}>Lot ID</th>
                                            <th style={styles.th}>Warehouse</th>
                                            <th style={styles.th}>Supplier</th>
                                            <th style={styles.th}>Invoice</th>
                                            <th style={styles.th}>Purchase Date</th>
                                            <th style={styles.th}>Purchased</th>
                                            <th style={styles.th}>Sold (FIFO)</th>
                                            <th style={styles.th}>Remaining</th>
                                            <th style={styles.th}>Avg Lot Cost</th>
                                            <th style={styles.th}>Lot Cost Total</th>
                                            <th style={styles.th}>Remaining Value</th>
                                            <th style={styles.th}>Aging</th>
                                            <th style={styles.th}>View</th>
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {p.fifoLots.map((l) => (
                                            <tr key={l.lotId}>
                                              <td style={styles.td}>{l.lotId}</td>
                                              <td style={styles.td}>{l.warehouseLocation || "Main"}</td>
                                              <td style={styles.td}>{l.supplierName || "-"}</td>
                                              <td style={styles.td}>{l.supplierInvoiceNo || "-"}</td>
                                              <td style={styles.td}>{formatDate(l.purchaseDate)}</td>
                                              <td style={styles.td}>{safeNum(l.qty).toLocaleString()}</td>
                                              <td style={styles.td}>{safeNum(l.soldQty).toLocaleString()}</td>
                                              <td style={styles.td}>
                                                <b style={{ color: "#fff" }}>{safeNum(l.remainingQty).toLocaleString()}</b>
                                              </td>
                                              <td style={styles.td}>{formatCurrency(l.avgPurchaseRate)}</td>
                                              <td style={styles.td}>{formatCurrency(l.purchaseCost)}</td>
                                              <td style={styles.td}>{formatCurrency(l.remainingValue)}</td>
                                              <td style={styles.td}>
                                                <span style={agingBadge(daysBetween(l.purchaseDate))}>
                                                  {agingBadge(daysBetween(l.purchaseDate)).label}
                                                </span>
                                              </td>
                                              <td style={styles.td}>
                                                <button
                                                  style={styles.btnGhost}
                                                  onClick={() => setLotModal({ open: true, lot: { ...l, productName: p.productName } })}
                                                >
                                                  🔍 Details
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "lots" && (
            <div style={styles.card}>
              <div style={{ ...styles.split, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 1000, color: "#fff" }}>🧾 Lots View (All Batches)</div>
                  <div style={styles.subtle}>Best for big factories: warehouse & supplier batch control.</div>
                </div>
                <div style={styles.tiny}>Lots shown are FIFO-allocated for sold/remaining</div>
              </div>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Lot</th>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Warehouse</th>
                      <th style={styles.th}>Supplier</th>
                      <th style={styles.th}>Invoice</th>
                      <th style={styles.th}>Purchase Date</th>
                      <th style={styles.th}>Purchased</th>
                      <th style={styles.th}>Sold (FIFO)</th>
                      <th style={styles.th}>Remaining</th>
                      <th style={styles.th}>Avg Lot Cost</th>
                      <th style={styles.th}>Remaining Value</th>
                      <th style={styles.th}>Aging</th>
                      <th style={styles.th}>Details</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLots.length === 0 ? (
                      <tr>
                        <td style={styles.td} colSpan={13}>
                          <div style={{ textAlign: "center", padding: "22px 0" }}>
                            <div style={{ fontSize: 36 }}>🧾</div>
                            <div style={{ fontWeight: 1000, marginTop: 6 }}>No lots match your filters</div>
                            <div style={styles.subtle}>Try “All Warehouses” or remove supplier filter.</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredLots.map((l) => (
                        <tr key={`${l.productName}-${l.lotId}`}>
                          <td style={styles.td}>{l.lotId}</td>
                          <td style={styles.td}>
                            <b style={{ color: "#fff" }}>{l.productName}</b>
                            <div style={styles.tiny}>Vehicle: {l.vehicleNumber || "-"}</div>
                          </td>
                          <td style={styles.td}>{l.warehouseLocation || "Main"}</td>
                          <td style={styles.td}>{l.supplierName || "-"}</td>
                          <td style={styles.td}>{l.supplierInvoiceNo || "-"}</td>
                          <td style={styles.td}>{formatDate(l.purchaseDate)}</td>
                          <td style={styles.td}>{safeNum(l.qty).toLocaleString()}</td>
                          <td style={styles.td}>{safeNum(l.soldQty).toLocaleString()}</td>
                          <td style={styles.td}>
                            <b style={{ color: "#fff" }}>{safeNum(l.remainingQty).toLocaleString()}</b>
                          </td>
                          <td style={styles.td}>{formatCurrency(l.avgPurchaseRate)}</td>
                          <td style={styles.td}>{formatCurrency(l.remainingValue)}</td>
                          <td style={styles.td}>
                            <span style={agingBadge(l.agingDays)}>{agingBadge(l.agingDays).label}</span>
                          </td>
                          <td style={styles.td}>
                            <button style={styles.btnGhost} onClick={() => setLotModal({ open: true, lot: l })}>
                              🔍 Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "sales" && (
            <div style={styles.card}>
              <div style={{ ...styles.split, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 1000, color: "#fff" }}>💰 Sales Intelligence</div>
                  <div style={styles.subtle}>Sales per product (ledger-driven). Profit uses {valuation} valuation.</div>
                </div>
                <div style={styles.tiny}>Tip: Expand product in “Products” tab for full transaction history.</div>
              </div>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Transactions</th>
                      <th style={styles.th}>Sold Qty</th>
                      <th style={styles.th}>Sales Value</th>
                      <th style={styles.th}>COGS ({valuation})</th>
                      <th style={styles.th}>Profit</th>
                      <th style={styles.th}>Margin</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td style={styles.td} colSpan={8}>
                          <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <div style={{ fontSize: 36 }}>💰</div>
                            <div style={{ fontWeight: 1000, marginTop: 6 }}>No sales in current filters</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={`sales-${p.productName}`}>
                          <td style={styles.td}>
                            <b style={{ color: "#fff" }}>{p.productName}</b>
                            <div style={styles.tiny}>Avg sale rate: {formatCurrency(p.avgSaleRate)}</div>
                          </td>
                          <td style={styles.td}>{(p.sales || []).length}</td>
                          <td style={styles.td}>{p.totalSold.toLocaleString()}</td>
                          <td style={styles.td}>{formatCurrency(p.totalSaleValue)}</td>
                          <td style={styles.td}>{formatCurrency(p.cogs)}</td>
                          <td style={styles.td}>
                            <span style={{ fontWeight: 1000, color: p.profit >= 0 ? "#d1fae5" : "#fecaca" }}>
                              {formatCurrency(p.profit)}
                            </span>
                          </td>
                          <td style={styles.td}>{p.margin.toFixed(1)}%</td>
                          <td style={styles.td}>
                            <button
                              style={styles.btnGhost}
                              onClick={() => {
                                setTab("products");
                                setExpandedProduct(p.productName);
                              }}
                            >
                              ▶ Open Lots
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reorder Modal */}
      {reorderModal.open && (
        <div style={styles.modalOverlay} onClick={() => setReorderModal({ open: false, product: "", value: 0 })}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <div>
                <div style={styles.modalTitle}>🎯 Reorder Point</div>
                <div style={styles.tiny}>{reorderModal.product}</div>
              </div>
              <button style={styles.btnDanger} onClick={() => setReorderModal({ open: false, product: "", value: 0 })}>
                ✕ Close
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={{ ...styles.card, marginTop: 0 }}>
                <div style={{ fontWeight: 1000, color: "#fff" }}>Set reorder threshold</div>
                <div style={styles.subtle}>
                  When remaining stock ≤ reorder point → product becomes “Low Stock”.
                </div>

                <div style={{ ...styles.modalGrid, marginTop: 12 }}>
                  <div>
                    <div style={styles.tiny}>Reorder Point (Qty)</div>
                    <input
                      style={styles.input}
                      type="number"
                      value={reorderModal.value}
                      onChange={(e) => setReorderModal((p) => ({ ...p, value: e.target.value }))}
                      min="0"
                    />
                  </div>
                  <div>
                    <div style={styles.tiny}>Current Remaining (selected filters)</div>
                    <input
                      style={{ ...styles.input, opacity: 0.75 }}
                      readOnly
                      value={() => {
                        const found = products.find((x) => x.productName === reorderModal.product);
                        return found ? found.remainingQty : 0;
                      }}
                      onFocus={(e) => e.target.blur()}
                    />
                    <div style={styles.tiny}>
                      Note: Remaining depends on valuation method for display, but reorder is just quantity.
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
                  <button
                    style={styles.btnGhost}
                    onClick={() => {
                      const next = { ...reorderMap };
                      delete next[reorderModal.product];
                      setReorderMap(next);
                      writeReorderMap(next);
                      setReorderModal({ open: false, product: "", value: 0 });
                    }}
                  >
                    🗑 Clear
                  </button>
                  <button style={styles.btn} onClick={saveReorder}>
                    ✅ Save
                  </button>
                </div>
              </div>

              <div style={{ ...styles.tiny, marginTop: 12 }}>
                Saved in localStorage key: <b style={{ color: "#fff" }}>{REORDER_KEY}</b>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lot Details Modal */}
      {lotModal.open && lotModal.lot && (
        <div style={styles.modalOverlay} onClick={() => setLotModal({ open: false, lot: null })}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <div>
                <div style={styles.modalTitle}>🔍 Lot Details</div>
                <div style={styles.tiny}>
                  {lotModal.lot.productName ? `${lotModal.lot.productName} • ` : ""}
                  {lotModal.lot.lotId}
                </div>
              </div>
              <button style={styles.btnDanger} onClick={() => setLotModal({ open: false, lot: null })}>
                ✕ Close
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={{ ...styles.card, marginTop: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={styles.tiny}>Warehouse</div>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>{lotModal.lot.warehouseLocation || "Main"}</div>
                  </div>
                  <div>
                    <div style={styles.tiny}>Supplier</div>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>{lotModal.lot.supplierName || "-"}</div>
                  </div>
                  <div>
                    <div style={styles.tiny}>Invoice</div>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>{lotModal.lot.supplierInvoiceNo || "-"}</div>
                  </div>
                  <div>
                    <div style={styles.tiny}>Purchase Date</div>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>{formatDate(lotModal.lot.purchaseDate)}</div>
                  </div>
                  <div>
                    <div style={styles.tiny}>Purchased Qty</div>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>{safeNum(lotModal.lot.qty).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={styles.tiny}>Sold Qty (FIFO)</div>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>{safeNum(lotModal.lot.soldQty).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={styles.tiny}>Remaining Qty</div>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>
                      {safeNum(lotModal.lot.remainingQty).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={styles.tiny}>Aging</div>
                    <div style={agingBadge(daysBetween(lotModal.lot.purchaseDate))}>
                      {agingBadge(daysBetween(lotModal.lot.purchaseDate)).label}
                    </div>
                  </div>
                  <div>
                    <div style={styles.tiny}>Avg Lot Cost Rate</div>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>{formatCurrency(lotModal.lot.avgPurchaseRate)}</div>
                  </div>
                  <div>
                    <div style={styles.tiny}>Lot Total Cost</div>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>{formatCurrency(lotModal.lot.purchaseCost)}</div>
                  </div>
                  <div>
                    <div style={styles.tiny}>Remaining Value (FIFO)</div>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>{formatCurrency(lotModal.lot.remainingValue)}</div>
                  </div>
                  <div>
                    <div style={styles.tiny}>Vehicle</div>
                    <div style={{ fontWeight: 1000, color: "#fff" }}>{lotModal.lot.vehicleNumber || "-"}</div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={styles.tiny}>Notes</div>
                  <div style={{ ...styles.subtle, whiteSpace: "pre-wrap" }}>{lotModal.lot.notes || "-"}</div>
                </div>

                <div style={{ ...styles.tiny, marginTop: 12 }}>
                  Internal: lot purchase ISO = <b style={{ color: "#fff" }}>{toISODate(lotModal.lot.purchaseDate) || "-"}</b>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <button style={styles.btn} onClick={() => setLotModal({ open: false, lot: null })}>
                  ✅ Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvailableStockPage;
