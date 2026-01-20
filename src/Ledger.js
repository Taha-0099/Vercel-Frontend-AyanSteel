import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";
import Swal from "sweetalert2";

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
import { Line, Bar, Pie } from "react-chartjs-2";

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

// -----------------------------
// Modern Design System
// -----------------------------
const palette = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  text: "#0f172a",
  textLight: "#475569",
  muted: "#64748b",
  mutedLight: "#94a3b8",
  primary: "#3b82f6",
  primaryDark: "#2563eb",
  primaryLight: "#dbeafe",
  success: "#10b981",
  successLight: "#d1fae5",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  warningDark: "#d97706",
  accent: "#8b5cf6",
  accentLight: "#ede9fe",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: `linear-gradient(135deg, ${palette.bg} 0%, #e0e7ff 100%)`,
    padding: "24px",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
  shell: {
    background: palette.card,
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
    border: `1px solid ${palette.borderLight}`,
  },
  headerBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "32px",
    paddingBottom: "24px",
    borderBottom: `2px solid ${palette.borderLight}`,
  },
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    color: palette.text,
    background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "14px",
    color: palette.muted,
    fontWeight: "500",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  btn: {
    padding: "11px 18px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
    color: "#fff",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(59,130,246,0.2)",
  },
  btnSmall: {
    padding: "8px 14px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    background: palette.primary,
    color: "#fff",
    fontWeight: "600",
    fontSize: "12px",
    transition: "all 0.2s ease",
  },
  btnGhost: {
    padding: "11px 18px",
    borderRadius: "12px",
    border: `1.5px solid ${palette.border}`,
    cursor: "pointer",
    background: "#fff",
    color: palette.text,
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s ease",
  },
  btnGhostSmall: {
    padding: "8px 14px",
    borderRadius: "10px",
    border: `1.5px solid ${palette.border}`,
    cursor: "pointer",
    background: "#fff",
    color: palette.textLight,
    fontWeight: "600",
    fontSize: "12px",
    transition: "all 0.2s ease",
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr",
    gap: "20px",
  },
  gridAuto: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },

  card: {
    background: `linear-gradient(135deg, ${palette.card} 0%, ${palette.borderLight} 100%)`,
    border: `1px solid ${palette.border}`,
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 2px 4px rgba(15,23,42,0.04)",
    transition: "all 0.2s ease",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  cardTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: palette.muted,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  kpiValue: {
    fontSize: "28px",
    fontWeight: "800",
    color: palette.text,
    letterSpacing: "-0.5px",
    marginBottom: "4px",
  },
  kpiSub: {
    fontSize: "12px",
    color: palette.mutedLight,
    fontWeight: "500",
  },

  sectionTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    marginTop: "32px",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "22px",
    fontWeight: "800",
    color: palette.text,
    letterSpacing: "-0.3px",
  },

  searchInput: {
    width: "100%",
    maxWidth: "380px",
    padding: "12px 16px",
    borderRadius: "12px",
    border: `1.5px solid ${palette.border}`,
    fontSize: "14px",
    outline: "none",
    background: "#fff",
    transition: "all 0.2s ease",
    fontWeight: "500",
  },

  tableWrap: {
    background: "#fff",
    border: `1px solid ${palette.border}`,
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "16px 16px",
    fontSize: "11px",
    background: `linear-gradient(135deg, ${palette.borderLight} 0%, #e0e7ff 100%)`,
    color: palette.text,
    fontWeight: "800",
    textAlign: "left",
    borderBottom: `2px solid ${palette.border}`,
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },
  td: {
    padding: "14px 16px",
    fontSize: "13px",
    borderBottom: `1px solid ${palette.borderLight}`,
    color: palette.text,
    verticalAlign: "middle",
    fontWeight: "500",
  },
  rowMuted: {
    color: palette.muted,
  },

  badge: {
    padding: "4px 10px",
    fontSize: "10px",
    fontWeight: "700",
    borderRadius: "999px",
    background: palette.primaryLight,
    color: palette.primary,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },

  chartBox: {
    background: "#fff",
    border: `1px solid ${palette.border}`,
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 2px 4px rgba(15,23,42,0.04)",
  },
  chartTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: palette.text,
    marginBottom: "4px",
    letterSpacing: "-0.2px",
  },
  chartSub: {
    fontSize: "12px",
    color: palette.muted,
    marginBottom: "16px",
    fontWeight: "500",
  },

  empty: {
    padding: "20px",
    fontSize: "13px",
    color: palette.muted,
    textAlign: "center",
    fontWeight: "500",
  },

  statusIndicator: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    marginRight: "8px",
  },

  warningRow: {
    background: `${palette.warningLight} !important`,
    borderLeft: `4px solid ${palette.warning}`,
  },

  dangerRow: {
    background: `${palette.dangerLight} !important`,
    borderLeft: `4px solid ${palette.danger}`,
  },

  legend: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    padding: "12px 16px",
    background: palette.borderLight,
    borderRadius: "12px",
    marginBottom: "16px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    fontWeight: "600",
    color: palette.textLight,
  },
};

// -----------------------------
// Helpers
// -----------------------------
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

const isSaleEntry = (e) => {
  const cat = (e?.category || "").toString().trim().toUpperCase();
  if (cat) return cat === "SALE" || cat === "SALES";

  const raw =
    (e?.ledgerType ?? e?.type ?? e?.entryType ?? "")
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

// Calculate days since last entry
function getDaysSinceLastEntry(lastDate) {
  if (!lastDate) return null;
  const now = new Date();
  const last = new Date(lastDate);
  const diffTime = now - last;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Get row status based on closing balance and inactivity
function getClientStatus(closingBalance, lastDate) {
  const balance = safeNum(closingBalance);
  
  // Only apply color coding if there's a closing balance
  if (balance === 0) return "normal";
  
  const daysSince = getDaysSinceLastEntry(lastDate);
  
  if (daysSince === null) return "normal";
  
  if (daysSince >= 15) return "danger";
  if (daysSince >= 10) return "warning";
  
  return "normal";
}

function Ledger() {
  const [summary, setSummary] = useState(null);
  const [clients, setClients] = useState([]);
  const [entriesAll, setEntriesAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

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
        if (
          d &&
          !Number.isNaN(d.getTime()) &&
          (!client.lastDate || d > client.lastDate)
        ) {
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

      const res = await api.get("/api/ledger", {
        params: { accountName: oldName },
      });
      const entries = res.data || [];

      await Promise.all(
        entries.map((e) =>
          api.put(`/api/ledger/${e._id || e.id}`, {
            accountName: trimmed,
          })
        )
      );

      await fetchAll();

      Swal.fire({
        icon: "success",
        title: "Name updated",
        timer: 900,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error updating account name.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      (c.accountName || "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  const salesEntries = useMemo(() => {
    return entriesAll.filter(isSaleEntry);
  }, [entriesAll]);

  const totalSalesValue = useMemo(() => {
    return salesEntries.reduce((s, e) => s + getSaleValue(e), 0);
  }, [salesEntries]);

  const totalSalesQty = useMemo(() => {
    return salesEntries.reduce((s, e) => s + getQty(e), 0);
  }, [salesEntries]);

  const dailyKeys = useMemo(() => lastNDaysKeys(14), []);
  const monthlyKeys = useMemo(() => lastNMonthsKeys(6), []);

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

  const dailyLineData = useMemo(() => {
    const values = dailyKeys.map((k) => safeNum(dailySalesMap[k]));
    return {
      labels: dailyKeys,
      datasets: [
        {
          label: "Daily Sales (₨)",
          data: values,
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderColor: palette.primary,
        },
      ],
    };
  }, [dailyKeys, dailySalesMap]);

  const monthlyBarData = useMemo(() => {
    const labels = monthlyKeys.map(prettyMonthLabel);
    const values = monthlyKeys.map((k) => safeNum(monthlySalesMap[k]));
    return {
      labels,
      datasets: [
        {
          label: "Monthly Sales (₨)",
          data: values,
          borderWidth: 0,
          borderRadius: 8,
          backgroundColor: palette.primary,
        },
      ],
    };
  }, [monthlyKeys, monthlySalesMap]);

  const paymentPieData = useMemo(() => {
    const keys = Object.keys(paymentSplit);
    const values = keys.map((k) => safeNum(paymentSplit[k]));
    return {
      labels: keys.length ? keys : ["No Data"],
      datasets: [
        {
          label: "Sales by Payment Type",
          data: keys.length ? values : [1],
          backgroundColor: [
            palette.primary,
            palette.success,
            palette.warning,
            palette.accent,
            palette.danger,
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [paymentSplit]);

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, position: "top" },
        tooltip: { 
          mode: "index", 
          intersect: false,
          backgroundColor: palette.text,
          padding: 12,
          cornerRadius: 8,
        },
      },
      interaction: { mode: "nearest", axis: "x", intersect: false },
      scales: {
        x: {
          ticks: { maxRotation: 0, autoSkip: true },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          grid: { color: palette.borderLight },
        },
      },
    }),
    []
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, position: "top" },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          grid: { color: palette.borderLight },
        },
      },
    }),
    []
  );

  const pieOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: "bottom" },
      },
    }),
    []
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.shell}>
          <div style={styles.headerBar}>
            <div style={styles.titleBlock}>
              <div style={styles.title}>Ledger Dashboard</div>
              <div style={styles.subtitle}>
                Manage clients, track balances, and analyze sales performance
              </div>
            </div>
            <div style={styles.headerActions}>
              <button style={styles.btn} onClick={() => navigate("/sales")}>
                + New Sale
              </button>
              <button
                style={styles.btnGhost}
                onClick={() => navigate("/company-balance")}
              >
                Company Balance
              </button>
              <button
                style={styles.btnGhost}
                onClick={() => navigate("/available-stock")}
              >
                Available Stock
              </button>
              <button
                style={styles.btnGhost}
                onClick={() => navigate("/stock")}
              >
                Stock Dashboard
              </button>
            </div>
          </div>

          {loading && <div style={styles.empty}>Loading dashboard...</div>}
          {error && (
            <div style={{ ...styles.empty, color: palette.danger }}>{error}</div>
          )}

          {summary && (
            <div style={styles.gridAuto}>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitle}>Total Clients</span>
                  <span style={styles.badge}>Active</span>
                </div>
                <div style={styles.kpiValue}>{summary.totalClients}</div>
                <div style={styles.kpiSub}>All unique account names</div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitle}>Total Entries</span>
                </div>
                <div style={styles.kpiValue}>{summary.totalEntries}</div>
                <div style={styles.kpiSub}>Across all ledger types</div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitle}>Total Receivable</span>
                </div>
                <div style={styles.kpiValue}>
                  ₨ {safeNum(summary.totalDebit).toLocaleString()}
                </div>
                <div style={styles.kpiSub}>Sum of absolute closing balances</div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitle}>Total Credit</span>
                </div>
                <div style={styles.kpiValue}>
                  ₨ {safeNum(summary.totalCredit).toLocaleString()}
                </div>
                <div style={styles.kpiSub}>Payments and credits recorded</div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitle}>Total Sales Value</span>
                  <span
                    style={{
                      ...styles.badge,
                      background: palette.successLight,
                      color: palette.success,
                    }}
                  >
                    All Time
                  </span>
                </div>
                <div style={styles.kpiValue}>
                  ₨ {safeNum(totalSalesValue).toLocaleString()}
                </div>
                <div style={styles.kpiSub}>
                  Based on SALES entries (debit amounts only)
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitle}>Total Qty Sold</span>
                </div>
                <div style={styles.kpiValue}>
                  {safeNum(totalSalesQty).toLocaleString()}
                </div>
                <div style={styles.kpiSub}>
                  Sum of quantity across SALES entries
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: "32px" }}>
            <div style={styles.sectionTitleRow}>
              <div style={styles.sectionTitle}>Sales Analytics</div>
              <span style={styles.badge}>Last 14 days & 6 months</span>
            </div>

            <div style={styles.grid2}>
              <div style={styles.chartBox}>
                <div style={styles.chartTitle}>Daily Sales Trend</div>
                <div style={styles.chartSub}>
                  Last 14 days (based on SALES)
                </div>
                <Line data={dailyLineData} options={lineOptions} />
              </div>

              <div style={{ display: "grid", gap: "20px" }}>
                <div style={styles.chartBox}>
                  <div style={styles.chartTitle}>Monthly Sales Summary</div>
                  <div style={styles.chartSub}>Last 6 months</div>
                  <Bar data={monthlyBarData} options={barOptions} />
                </div>

                <div style={styles.chartBox}>
                  <div style={styles.chartTitle}>Sales by Payment Type</div>
                  <div style={styles.chartSub}>
                    Distribution of sales value
                  </div>
                  <Pie data={paymentPieData} options={pieOptions} />
                </div>
              </div>
            </div>
          </div>

          <div style={styles.sectionTitleRow}>
            <div style={styles.sectionTitle}>Clients</div>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search client by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={styles.legend}>
            <div style={styles.legendItem}>
              <span
                style={{
                  ...styles.statusIndicator,
                  background: palette.success,
                }}
              />
              Active (Recent activity)
            </div>
            <div style={styles.legendItem}>
              <span
                style={{
                  ...styles.statusIndicator,
                  background: palette.warning,
                }}
              />
              Warning (10+ days inactive with balance)
            </div>
            <div style={styles.legendItem}>
              <span
                style={{
                  ...styles.statusIndicator,
                  background: palette.danger,
                }}
              />
              Alert (15+ days inactive with balance)
            </div>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Account Name</th>
                  <th style={styles.th}>Last Date</th>
                  <th style={styles.th}>Days Inactive</th>
                  <th style={styles.th}>Closing Balance</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c, idx) => {
                  const status = getClientStatus(c.closingBalance, c.lastDate);
                  const daysSince = getDaysSinceLastEntry(c.lastDate);
                  
                  let rowStyle = {
                    background: idx % 2 ? "#fcfdff" : "#fff",
                  };
                  
                  if (status === "warning") {
                    rowStyle = { ...rowStyle, ...styles.warningRow };
                  } else if (status === "danger") {
                    rowStyle = { ...rowStyle, ...styles.dangerRow };
                  }

                  return (
                    <tr key={c.accountName} style={rowStyle}>
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span
                            style={{
                              ...styles.statusIndicator,
                              background:
                                status === "danger"
                                  ? palette.danger
                                  : status === "warning"
                                  ? palette.warning
                                  : palette.success,
                            }}
                          />
                          <Link
                            to={`/clients/${encodeURIComponent(c.accountName)}`}
                            style={{
                              color: palette.primary,
                              fontWeight: "700",
                              textDecoration: "none",
                            }}
                          >
                            {c.accountName}
                          </Link>
                        </div>
                      </td>
                      <td style={{ ...styles.td, ...styles.rowMuted }}>
                        {c.lastDate ? c.lastDate.toLocaleDateString() : "-"}
                      </td>
                      <td style={styles.td}>
                        {daysSince !== null ? (
                          <span
                            style={{
                              fontWeight: "700",
                              color:
                                status === "danger"
                                  ? palette.danger
                                  : status === "warning"
                                  ? palette.warningDark
                                  : palette.success,
                            }}
                          >
                            {daysSince} days
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            fontWeight: "700",
                            color:
                              c.closingBalance > 0
                                ? palette.text
                                : palette.muted,
                          }}
                        >
                          ₨{" "}
                          {typeof c.closingBalance === "number"
                            ? c.closingBalance.toLocaleString()
                            : "-"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.btnSmall}
                          onClick={() =>
                            navigate(
                              `/clients/${encodeURIComponent(c.accountName)}`
                            )
                          }
                        >
                          View Ledger
                        </button>
                        <span style={{ display: "inline-block", width: 8 }} />
                        <button
                          style={styles.btnGhostSmall}
                          onClick={() => handleEditName(c.accountName)}
                        >
                          Edit Name
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredClients.length === 0 && !loading && (
                  <tr>
                    <td style={styles.td} colSpan={5}>
                      <div style={styles.empty}>No clients found.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ledger;