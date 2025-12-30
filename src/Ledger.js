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
// Modern inline design system
// -----------------------------
const palette = {
  bg: "#f4f7fb",
  card: "#ffffff",
  border: "#e6eaf0",
  text: "#0f172a",
  muted: "#64748b",
  primary: "#1f4aa8",
  primarySoft: "#e8f0ff",
  success: "#16a34a",
  danger: "#dc2626",
  warning: "#f59e0b",
};

const styles = {
  page: {
    maxWidth: "1250px",
    margin: "18px auto",
    padding: "18px",
  },
  shell: {
    background: palette.bg,
    borderRadius: "14px",
    padding: "22px",
    border: `1px solid ${palette.border}`,
  },
  headerBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    letterSpacing: "-0.4px",
    color: palette.text,
  },
  subtitle: {
    fontSize: "12px",
    color: palette.muted,
  },
  headerActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  btn: {
    padding: "9px 14px",
    borderRadius: "10px",
    border: `1px solid ${palette.border}`,
    cursor: "pointer",
    background: palette.primary,
    color: "#fff",
    fontWeight: "700",
    fontSize: "12px",
    transition: "0.2s",
  },
  btnGhost: {
    padding: "9px 12px",
    borderRadius: "10px",
    border: `1px solid ${palette.border}`,
    cursor: "pointer",
    background: "#fff",
    color: palette.text,
    fontWeight: "700",
    fontSize: "12px",
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "14px",
  },
  gridAuto: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "12px",
  },

  card: {
    background: palette.card,
    border: `1px solid ${palette.border}`,
    borderRadius: "12px",
    padding: "14px",
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  cardTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: palette.muted,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },
  kpiValue: {
    fontSize: "22px",
    fontWeight: "800",
    color: palette.text,
    letterSpacing: "-0.3px",
  },
  kpiSub: {
    fontSize: "11px",
    color: palette.muted,
    marginTop: "2px",
  },

  sectionTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "18px",
    marginBottom: "8px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: palette.text,
  },

  searchInput: {
    width: "100%",
    maxWidth: "340px",
    padding: "10px 12px",
    borderRadius: "10px",
    border: `1px solid ${palette.border}`,
    fontSize: "13px",
    outline: "none",
    background: "#fff",
  },

  tableWrap: {
    background: "#fff",
    border: `1px solid ${palette.border}`,
    borderRadius: "12px",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px 12px",
    fontSize: "11px",
    background: "#f1f5fb",
    color: "#0f172a",
    fontWeight: "800",
    textAlign: "left",
    borderBottom: `1px solid ${palette.border}`,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "11px 12px",
    fontSize: "12.5px",
    borderBottom: `1px solid ${palette.border}`,
    color: palette.text,
    verticalAlign: "middle",
  },
  rowMuted: {
    color: palette.muted,
  },

  badge: {
    padding: "3px 8px",
    fontSize: "10px",
    fontWeight: "700",
    borderRadius: "999px",
    background: palette.primarySoft,
    color: palette.primary,
  },

  chartBox: {
    background: "#fff",
    border: `1px solid ${palette.border}`,
    borderRadius: "12px",
    padding: "14px",
  },
  chartTitle: {
    fontSize: "13px",
    fontWeight: "800",
    color: palette.text,
    marginBottom: "6px",
  },
  chartSub: {
    fontSize: "11px",
    color: palette.muted,
    marginBottom: "10px",
  },

  empty: {
    padding: "14px",
    fontSize: "12px",
    color: palette.muted,
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

// ✅ CORRECTED: Only calculate debit (sale amount), ignore credit (payments)
const getSaleValue = (e) => {
  // For SALES entries, only count the debit (amount customer owes)
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

  return v; // Return only debit, never credit for sales
};

// ✅ More robust QTY resolver (supports arrays)
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

// ✅ Flexible but safe sales detector (UPDATED)
const isSaleEntry = (e) => {
  // ✅ 1) Prefer your actual schema field
  const cat = (e?.category || "").toString().trim().toUpperCase();
  if (cat) return cat === "SALE" || cat === "SALES";

  // ✅ 2) Fallback to legacy fields if any older data exists
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


function Ledger() {
  const [summary, setSummary] = useState(null);
  const [clients, setClients] = useState([]);
  const [entriesAll, setEntriesAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Reusable loader for all data
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

        // runningBalance += credit - debit
        client._balance += credit - debit;
        client.closingBalance = client._balance;
      });

      const clientArray = Object.values(byClient).sort((a, b) =>
        a.accountName.localeCompare(b.accountName)
      );

      // Total Debit on dashboard = sum of all clients' remaining balances (absolute)
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

  // 👉 Edit name handler (renames all entries of that account)
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

  // -----------------------------
  // SALES analytics (robust + correct)
  // -----------------------------
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

  // Chart datasets (no hardcoded colors)
  const dailyLineData = useMemo(() => {
    const values = dailyKeys.map((k) => safeNum(dailySalesMap[k]));
    return {
      labels: dailyKeys,
      datasets: [
        {
          label: "Daily Sales (₨)",
          data: values,
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 2,
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
          borderWidth: 1,
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
        },
      ],
    };
  }, [paymentSplit]);

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: { mode: "index", intersect: false },
      },
      interaction: { mode: "nearest", axis: "x", intersect: false },
      scales: {
        x: {
          ticks: { maxRotation: 0, autoSkip: true },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(190, 19, 19, 0.48)" },
        },
      },
    }),
    []
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: true },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(63, 63, 63, 0.21)" },
        },
      },
    }),
    []
  );

  const pieOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
      },
    }),
    []
  );

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        {/* Header */}
        <div style={styles.headerBar}>
          <div style={styles.titleBlock}>
            <div style={styles.title}>Ledger Dashboard</div>
            <div style={styles.subtitle}>
              Clients overview, balances, and sales analytics
            </div>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.btn} onClick={() => navigate("/sales")}>
              New Sale
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

        {/* KPIs */}
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
                <span style={styles.cardTitle}>Total Recvieable</span>
              </div>
              <div style={styles.kpiValue}>
                {safeNum(summary.totalDebit).toLocaleString()}
              </div>
              <div style={styles.kpiSub}>Sum of absolute closing balances</div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Total Credit</span>
              </div>
              <div style={styles.kpiValue}>
                {safeNum(summary.totalCredit).toLocaleString()}
              </div>
              <div style={styles.kpiSub}>Payments and credits recorded</div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Total Qty Value (All Time)</span>
                <span
                  style={{
                    ...styles.badge,
                    background: "#ecfdf3",
                    color: palette.success,
                  }}
                >
                  Sales
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
                <span style={styles.cardTitle}>Total Qty Sold (All Time)</span>
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

        {/* Charts Row */}
        <div style={{ marginTop: "18px" }}>
          <div style={styles.sectionTitleRow}>
            <div style={styles.sectionTitle}>Sales Analytics</div>
            <span style={styles.badge}>Last 14 days & 6 months</span>
          </div>

          <div style={styles.grid2}>
            {/* Daily line */}
            <div style={styles.chartBox}>
              <div style={styles.chartTitle}>Daily Sales Trend</div>
              <div style={styles.chartSub}>
                Last 14 days (based on SALES)
              </div>
              <Line data={dailyLineData} options={lineOptions} />
            </div>

            {/* Right column charts */}
            <div style={{ display: "grid", gap: "14px" }}>
              {/* Monthly bar */}
              <div style={styles.chartBox}>
                <div style={styles.chartTitle}>Monthly Sales Summary</div>
                <div style={styles.chartSub}>Last 6 months</div>
                <Bar data={monthlyBarData} options={barOptions} />
              </div>

              {/* Payment split pie */}
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

        {/* Clients section */}
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

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Account Name</th>
                <th style={styles.th}>Last Date</th>
                <th style={styles.th}>Closing Balance</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c, idx) => (
                <tr
                  key={c.accountName}
                  style={{ background: idx % 2 ? "#fcfdff" : "#fff" }}
                >
                  <td style={styles.td}>
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
                  </td>
                  <td style={{ ...styles.td, ...styles.rowMuted }}>
                    {c.lastDate ? c.lastDate.toLocaleDateString() : "-"}
                  </td>
                  <td style={styles.td}>
                    {typeof c.closingBalance === "number"
                      ? c.closingBalance.toLocaleString()
                      : "-"}
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.btn}
                      onClick={() =>
                        navigate(`/clients/${encodeURIComponent(c.accountName)}`)
                      }
                    >
                      View Ledger
                    </button>
                    <span style={{ display: "inline-block", width: 6 }} />
                    <button
                      style={{ ...styles.btnGhost }}
                      onClick={() => handleEditName(c.accountName)}
                    >
                      Edit Name
                    </button>
                  </td>
                </tr>
              ))}

              {filteredClients.length === 0 && !loading && (
                <tr>
                  <td style={styles.td} colSpan={4}>
                    <div style={styles.empty}>No clients found.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Ledger;