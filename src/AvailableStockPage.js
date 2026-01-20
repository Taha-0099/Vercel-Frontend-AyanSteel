import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px 16px 60px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    position: "relative",
    overflow: "hidden"
  },

  bgOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 
      "radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.4), transparent 50%)," +
      "radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.4), transparent 50%)",
    pointerEvents: "none"
  },

  container: {
    maxWidth: "1600px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1
  },

  header: {
    background: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "28px 32px",
    marginBottom: "24px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)"
  },

  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "20px"
  },

  titleSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },

  iconBadge: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
    fontSize: "28px"
  },

  title: {
    fontSize: "32px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "4px",
    letterSpacing: "-0.5px"
  },

  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "600"
  },

  headerActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },

  btn: {
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.4)",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },

  btnOutline: {
    padding: "12px 24px",
    borderRadius: "12px",
    border: "2px solid #667eea",
    background: "#fff",
    color: "#667eea",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },

  searchBar: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },

  searchInput: {
    flex: "1 1 300px",
    padding: "14px 20px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    fontWeight: "600",
    outline: "none",
    transition: "all 0.3s ease"
  },

  filterGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },

  filterBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },

  filterBtnActive: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    borderColor: "transparent",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "24px"
  },

  statCard: {
    background: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    position: "relative",
    overflow: "hidden"
  },

  statCardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)"
  },

  statLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "12px"
  },

  statValue: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: "8px",
    letterSpacing: "-1px"
  },

  statSubtext: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "600"
  },

  mainContent: {
    background: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)"
  },

  sectionTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  productCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "20px",
    border: "2px solid #e2e8f0",
    transition: "all 0.3s ease",
    cursor: "pointer"
  },

  productCardExpanded: {
    borderColor: "#667eea",
    boxShadow: "0 8px 32px rgba(102, 126, 234, 0.2)"
  },

  productHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px"
  },

  productName: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#1e293b"
  },

  productStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "16px",
    marginTop: "16px"
  },

  productStatItem: {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "12px 16px"
  },

  productStatLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "6px"
  },

  productStatValue: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#1e293b"
  },

  badge: {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px"
  },

  badgeAvailable: {
    background: "rgba(16, 185, 129, 0.1)",
    color: "#059669",
    border: "1px solid rgba(16, 185, 129, 0.2)"
  },

  badgeSold: {
    background: "rgba(239, 68, 68, 0.1)",
    color: "#dc2626",
    border: "1px solid rgba(239, 68, 68, 0.2)"
  },

  badgePartial: {
    background: "rgba(245, 158, 11, 0.1)",
    color: "#d97706",
    border: "1px solid rgba(245, 158, 11, 0.2)"
  },

  expandedContent: {
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "2px solid #e2e8f0"
  },

  tableWrapper: {
    overflowX: "auto",
    marginTop: "16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0"
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0",
    background: "#fff",
    minWidth: "900px"
  },

  th: {
    padding: "16px",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#64748b",
    background: "#f8fafc",
    textAlign: "left",
    borderBottom: "2px solid #e2e8f0",
    whiteSpace: "nowrap"
  },

  td: {
    padding: "16px",
    fontSize: "14px",
    color: "#334155",
    borderBottom: "1px solid #e2e8f0",
    fontWeight: "600"
  },

  profitPositive: {
    color: "#059669",
    fontWeight: "800"
  },

  profitNegative: {
    color: "#dc2626",
    fontWeight: "800"
  },

  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#64748b"
  },

  emptyStateIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    opacity: 0.5
  },

  emptyStateText: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "8px"
  },

  emptyStateSubtext: {
    fontSize: "14px",
    color: "#94a3b8"
  }
};

// Utility functions
const safeNum = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/,/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  });
};

const formatCurrency = (amount) => {
  return `₨ ${safeNum(amount).toLocaleString("en-US", { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })}`;
};

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
  const items = (Array.isArray(e?.items) && e.items) ||
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

  const items = (Array.isArray(entry?.items) && entry.items) ||
    (Array.isArray(entry?.products) && entry.products) ||
    (Array.isArray(entry?.lineItems) && entry.lineItems) ||
    (Array.isArray(entry?.details) && entry.details) ||
    null;

  if (!items) return 0;

  const sum = items.reduce((s, it) =>
    s + safeNum(it?.qty ?? it?.quantity ?? it?.soldQty ?? it?.soldQuantity ?? it?.saleQty ?? 0),
    0
  );

  return Math.abs(sum);
};

const normalizeProductKey = (p) => {
  return (p || "").toString().trim().toLowerCase();
};

function AvailableStockPage() {
  const navigate = useNavigate();
  const [stockEntries, setStockEntries] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedProduct, setExpandedProduct] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [stockRes, ledgerRes] = await Promise.all([
        api.get("/api/stock"),
        api.get("/api/ledger")
      ]);

      setStockEntries(stockRes.data || []);
      
      const sales = (ledgerRes.data || []).filter(isSaleEntry);
      setSalesData(sales);
    } catch (err) {
      console.error(err);
      setError("Error loading stock data");
    } finally {
      setLoading(false);
    }
  };

  // Group stock by product - only count positive quantities as purchases
  const productGroups = useMemo(() => {
    const groups = {};

    stockEntries.forEach(entry => {
      const product = entry.productType || "Unknown";
      const qty = safeNum(entry.quantity);
      
      // Only process positive quantities (purchases)
      if (qty <= 0) return;
      
      const rate = safeNum(entry.purchaseRate);
      const loading = safeNum(entry.loadingCharges);
      const unloading = safeNum(entry.unloadingCharges);
      const transport = safeNum(entry.transportCharges);
      const other = safeNum(entry.otherCharges);

      const purchaseCost = (qty * rate) + loading + unloading + transport + other;
      const avgPurchaseRate = qty > 0 ? purchaseCost / qty : rate;

      if (!groups[product]) {
        groups[product] = {
          productType: product,
          totalPurchased: 0,
          totalRemaining: 0,
          totalSold: 0,
          totalPurchaseCost: 0,
          entries: []
        };
      }

      groups[product].totalPurchased += qty;
      groups[product].totalPurchaseCost += purchaseCost;
      
      // Note: remaining and sold will be calculated from ledger sales below
      groups[product].entries.push({
        ...entry,
        qty,
        purchaseCost,
        avgPurchaseRate
      });
    });

    return groups;
  }, [stockEntries]);

  // Map sales to products
  const salesByProduct = useMemo(() => {
    const map = {};

    salesData.forEach(sale => {
      const productKey = normalizeProductKey(
        sale.productType || sale.type || sale.itemType || sale.product || sale.stockType
      );
      
      if (!productKey) return;

      const items = (Array.isArray(sale?.items) && sale.items) ||
        (Array.isArray(sale?.products) && sale.products) ||
        (Array.isArray(sale?.lineItems) && sale.lineItems) ||
        (Array.isArray(sale?.details) && sale.details) ||
        null;

      if (items && items.length) {
        items.forEach(item => {
          const itemProductKey = normalizeProductKey(
            item?.productType ?? item?.type ?? item?.itemType ?? item?.product ?? item?.stockType
          );
          
          if (!itemProductKey) return;

          const qty = safeNum(item?.qty ?? item?.quantity ?? item?.soldQty ?? item?.soldQuantity ?? item?.saleQty ?? 0);
          const rate = safeNum(item?.rate ?? item?.unitRate ?? item?.price ?? 0);
          const loading = safeNum(item?.loading ?? item?.loadingCharges ?? 0);
          const itemValue = safeNum(item?.value ?? item?.amount ?? item?.total ?? ((qty * rate) + loading));

          const productName = Object.keys(productGroups).find(
            p => normalizeProductKey(p) === itemProductKey
          ) || item.productType || item.type || "Unknown";

          if (!map[productName]) {
            map[productName] = [];
          }

          map[productName].push({
            ...sale,
            qty,
            rate,
            loading,
            saleValue: itemValue,
            itemSource: true
          });
        });
      } else {
        const productName = Object.keys(productGroups).find(
          p => normalizeProductKey(p) === productKey
        ) || sale.productType || "Unknown";

        const qty = getLedgerSaleQty(sale);
        const rate = safeNum(sale.rate ?? sale.saleRate ?? sale.unitRate ?? 0);
        const loading = safeNum(sale.loading ?? sale.loadingCharges ?? 0);
        const debit = safeNum(sale.debit ?? sale.amount ?? 0);
        const saleValue = debit || ((qty * rate) + loading);

        if (!map[productName]) {
          map[productName] = [];
        }

        map[productName].push({
          ...sale,
          qty,
          rate,
          loading,
          saleValue
        });
      }
    });

    return map;
  }, [salesData, productGroups]);

  // Calculate detailed stats for each product
  const enrichedProducts = useMemo(() => {
    return Object.entries(productGroups).map(([product, data]) => {
      const sales = salesByProduct[product] || [];
      
      // ✅ FIXED: Total sold comes from ledger sales (not from stock entries)
      const totalSaleQty = sales.reduce((sum, s) => sum + safeNum(s.qty), 0);
      const totalSaleValue = sales.reduce((sum, s) => sum + safeNum(s.saleValue), 0);
      
      // ✅ FIXED: Available = Total Purchased - Total Sold
      const totalPurchased = safeNum(data.totalPurchased);
      const totalSold = totalSaleQty; // Use ledger sales qty
      const totalRemaining = Math.max(0, totalPurchased - totalSold); // Available qty
      
      const avgPurchaseRate = totalPurchased > 0 
        ? data.totalPurchaseCost / totalPurchased 
        : 0;
      
      const avgSaleRate = totalSold > 0 
        ? totalSaleValue / totalSold 
        : 0;

      const estimatedSoldCost = totalSold * avgPurchaseRate;
      const totalProfit = totalSaleValue - estimatedSoldCost;
      const profitPercentage = estimatedSoldCost > 0 
        ? (totalProfit / estimatedSoldCost) * 100 
        : 0;

      const remainingValue = totalRemaining * avgPurchaseRate;

      // ✅ FIXED: Status based on correct available qty
      const status = totalRemaining === 0 
        ? "sold" 
        : totalRemaining === totalPurchased 
        ? "available" 
        : "partial";

      // ✅ Update entries with remaining based on ledger sales
      const entries = data.entries.map(entry => {
        // For each entry, calculate its contribution to sold
        // Simple approach: proportional distribution if we can't match exactly
        const entrySold = totalPurchased > 0 ? (entry.qty / totalPurchased) * totalSold : 0;
        const entryRemaining = Math.max(0, entry.qty - entrySold);
        
        return {
          ...entry,
          remaining: entryRemaining,
          sold: entrySold
        };
      });

      return {
        product,
        ...data,
        totalPurchased,
        totalRemaining, // ✅ Available qty = Total Purchased - Total Sold
        totalSold, // ✅ From ledger sales
        entries, // ✅ Updated with correct remaining/sold
        sales,
        totalSaleQty,
        totalSaleValue,
        avgPurchaseRate,
        avgSaleRate,
        totalProfit,
        profitPercentage,
        remainingValue,
        status
      };
    }).sort((a, b) => a.product.localeCompare(b.product));
  }, [productGroups, salesByProduct]);

  // Filter products
  const filteredProducts = enrichedProducts.filter(p => {
    const matchesSearch = p.product.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Overall statistics
  const overallStats = useMemo(() => {
    return filteredProducts.reduce((acc, p) => ({
      totalPurchased: acc.totalPurchased + p.totalPurchased,
      totalRemaining: acc.totalRemaining + p.totalRemaining,
      totalSold: acc.totalSold + p.totalSold,
      totalPurchaseCost: acc.totalPurchaseCost + p.totalPurchaseCost,
      totalSaleValue: acc.totalSaleValue + p.totalSaleValue,
      totalProfit: acc.totalProfit + p.totalProfit,
      remainingValue: acc.remainingValue + p.remainingValue
    }), {
      totalPurchased: 0,
      totalRemaining: 0,
      totalSold: 0,
      totalPurchaseCost: 0,
      totalSaleValue: 0,
      totalProfit: 0,
      remainingValue: 0
    });
  }, [filteredProducts]);

  const toggleProduct = (product) => {
    setExpandedProduct(expandedProduct === product ? null : product);
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.bgOverlay} />
        <div style={styles.container}>
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>⏳</div>
            <div style={styles.emptyStateText}>Loading stock data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgOverlay} />
      
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div style={styles.titleSection}>
              <div style={styles.iconBadge}>📦</div>
              <div>
                <div style={styles.title}>Available Stock Dashboard</div>
                <div style={styles.subtitle}>
                  Comprehensive inventory tracking with sales analytics & profit margins
                </div>
              </div>
            </div>

            <div style={styles.headerActions}>
              <button 
                style={styles.btnOutline} 
                onClick={() => navigate("/stock")}
              >
                ← Stock Management
              </button>
              <button 
                style={styles.btn} 
                onClick={() => navigate("/")}
              >
                📊 Ledger
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={styles.searchBar}>
            <input
              type="text"
              placeholder="🔍 Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />

            <div style={styles.filterGroup}>
              <button
                style={{
                  ...styles.filterBtn,
                  ...(filterStatus === "all" ? styles.filterBtnActive : {})
                }}
                onClick={() => setFilterStatus("all")}
              >
                All Products
              </button>
              <button
                style={{
                  ...styles.filterBtn,
                  ...(filterStatus === "available" ? styles.filterBtnActive : {})
                }}
                onClick={() => setFilterStatus("available")}
              >
                Available
              </button>
              <button
                style={{
                  ...styles.filterBtn,
                  ...(filterStatus === "partial" ? styles.filterBtnActive : {})
                }}
                onClick={() => setFilterStatus("partial")}
              >
                Partially Sold
              </button>
              <button
                style={{
                  ...styles.filterBtn,
                  ...(filterStatus === "sold" ? styles.filterBtnActive : {})
                }}
                onClick={() => setFilterStatus("sold")}
              >
                Sold Out
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statCardAccent} />
            <div style={styles.statLabel}>Total Purchased</div>
            <div style={styles.statValue}>
              {overallStats.totalPurchased.toLocaleString()}
            </div>
            <div style={styles.statSubtext}>
              {formatCurrency(overallStats.totalPurchaseCost)}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statCardAccent} />
            <div style={styles.statLabel}>Available Stock</div>
            <div style={{ ...styles.statValue, color: "#059669" }}>
              {overallStats.totalRemaining.toLocaleString()}
            </div>
            <div style={styles.statSubtext}>
              {formatCurrency(overallStats.remainingValue)}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statCardAccent} />
            <div style={styles.statLabel}>Total Sold</div>
            <div style={{ ...styles.statValue, color: "#dc2626" }}>
              {overallStats.totalSold.toLocaleString()}
            </div>
            <div style={styles.statSubtext}>
              {formatCurrency(overallStats.totalSaleValue)}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statCardAccent} />
            <div style={styles.statLabel}>Total Profit</div>
            <div 
              style={{ 
                ...styles.statValue, 
                color: overallStats.totalProfit >= 0 ? "#059669" : "#dc2626" 
              }}
            >
              {formatCurrency(overallStats.totalProfit)}
            </div>
            <div style={styles.statSubtext}>
              {overallStats.totalPurchaseCost > 0
                ? `${((overallStats.totalProfit / overallStats.totalPurchaseCost) * 100).toFixed(1)}% margin`
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.mainContent}>
          <div style={styles.sectionTitle}>
            📋 Products Inventory ({filteredProducts.length})
          </div>

          {error && (
            <div style={{ ...styles.emptyState, color: "#dc2626" }}>
              <div style={styles.emptyStateIcon}>⚠️</div>
              <div style={styles.emptyStateText}>{error}</div>
            </div>
          )}

          {!error && filteredProducts.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}>📦</div>
              <div style={styles.emptyStateText}>No products found</div>
              <div style={styles.emptyStateSubtext}>
                Try adjusting your search or filters
              </div>
            </div>
          )}

          {filteredProducts.map((productData) => {
            const isExpanded = expandedProduct === productData.product;
            
            return (
              <div
                key={productData.product}
                style={{
                  ...styles.productCard,
                  ...(isExpanded ? styles.productCardExpanded : {})
                }}
                onClick={() => toggleProduct(productData.product)}
              >
                {/* Product Header */}
                <div style={styles.productHeader}>
                  <div>
                    <div style={styles.productName}>
                      {productData.product}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span
                      style={{
                        ...styles.badge,
                        ...(productData.status === "available"
                          ? styles.badgeAvailable
                          : productData.status === "sold"
                          ? styles.badgeSold
                          : styles.badgePartial)
                      }}
                    >
                      {productData.status === "available"
                        ? "✅ Fully Available"
                        : productData.status === "sold"
                        ? "🔴 Sold Out"
                        : "⚠️ Partially Sold"}
                    </span>

                    <span style={{ fontSize: "20px", fontWeight: "800" }}>
                      {isExpanded ? "▼" : "▶"}
                    </span>
                  </div>
                </div>

                {/* Product Stats Grid */}
                <div style={styles.productStats}>
                  <div style={styles.productStatItem}>
                    <div style={styles.productStatLabel}>Purchased</div>
                    <div style={styles.productStatValue}>
                      {productData.totalPurchased.toLocaleString()}
                    </div>
                  </div>

                  <div style={styles.productStatItem}>
                    <div style={styles.productStatLabel}>Remaining</div>
                    <div style={{ ...styles.productStatValue, color: "#059669" }}>
                      {productData.totalRemaining.toLocaleString()}
                    </div>
                  </div>

                  <div style={styles.productStatItem}>
                    <div style={styles.productStatLabel}>Sold</div>
                    <div style={{ ...styles.productStatValue, color: "#dc2626" }}>
                      {productData.totalSold.toLocaleString()}
                    </div>
                  </div>

                  <div style={styles.productStatItem}>
                    <div style={styles.productStatLabel}>Avg Purchase Rate</div>
                    <div style={styles.productStatValue}>
                      {formatCurrency(productData.avgPurchaseRate)}
                    </div>
                  </div>

                  <div style={styles.productStatItem}>
                    <div style={styles.productStatLabel}>Avg Sale Rate</div>
                    <div style={styles.productStatValue}>
                      {formatCurrency(productData.avgSaleRate)}
                    </div>
                  </div>

                  <div style={styles.productStatItem}>
                    <div style={styles.productStatLabel}>Total Profit</div>
                    <div 
                      style={{ 
                        ...styles.productStatValue, 
                        color: productData.totalProfit >= 0 ? "#059669" : "#dc2626" 
                      }}
                    >
                      {formatCurrency(productData.totalProfit)}
                    </div>
                  </div>

                  <div style={styles.productStatItem}>
                    <div style={styles.productStatLabel}>Profit Margin</div>
                    <div 
                      style={{ 
                        ...styles.productStatValue, 
                        color: productData.profitPercentage >= 0 ? "#059669" : "#dc2626" 
                      }}
                    >
                      {productData.profitPercentage.toFixed(1)}%
                    </div>
                  </div>

                  <div style={styles.productStatItem}>
                    <div style={styles.productStatLabel}>Remaining Value</div>
                    <div style={styles.productStatValue}>
                      {formatCurrency(productData.remainingValue)}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={styles.expandedContent}>
                    {/* Sales Details Table */}
                    {productData.sales.length > 0 && (
                      <>
                        <h3 style={{ 
                          fontSize: "18px", 
                          fontWeight: "800", 
                          marginBottom: "16px",
                          color: "#1e293b"
                        }}>
                          💰 Sales Details ({productData.sales.length} transactions)
                        </h3>

                        <div style={styles.tableWrapper}>
                          <table style={styles.table}>
                            <thead>
                              <tr>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Customer</th>
                                <th style={styles.th}>Description</th>
                                <th style={styles.th}>Quantity</th>
                                <th style={styles.th}>Rate</th>
                                <th style={styles.th}>Loading</th>
                                <th style={styles.th}>Sale Value</th>
                                <th style={styles.th}>Est. Cost</th>
                                <th style={styles.th}>Est. Profit</th>
                                <th style={styles.th}>Payment</th>
                                <th style={styles.th}>Bank/Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {productData.sales.map((sale, idx) => {
                                const estCost = sale.qty * productData.avgPurchaseRate;
                                const estProfit = sale.saleValue - estCost;
                                const profitPercent = estCost > 0 ? (estProfit / estCost) * 100 : 0;

                                return (
                                  <tr key={sale._id || idx}>
                                    <td style={styles.td}>
                                      {formatDate(sale.date)}
                                    </td>
                                    <td style={styles.td}>
                                      <strong>{sale.accountName || "N/A"}</strong>
                                    </td>
                                    <td style={styles.td}>
                                      {sale.description || "-"}
                                    </td>
                                    <td style={styles.td}>
                                      <strong>{sale.qty.toLocaleString()}</strong>
                                    </td>
                                    <td style={styles.td}>
                                      {formatCurrency(sale.rate)}
                                    </td>
                                    <td style={styles.td}>
                                      {formatCurrency(sale.loading)}
                                    </td>
                                    <td style={styles.td}>
                                      <strong style={{ color: "#059669" }}>
                                        {formatCurrency(sale.saleValue)}
                                      </strong>
                                    </td>
                                    <td style={styles.td}>
                                      {formatCurrency(estCost)}
                                    </td>
                                    <td style={styles.td}>
                                      <strong 
                                        style={estProfit >= 0 ? styles.profitPositive : styles.profitNegative}
                                      >
                                        {formatCurrency(estProfit)}
                                        <br />
                                        <span style={{ fontSize: "11px" }}>
                                          ({profitPercent.toFixed(1)}%)
                                        </span>
                                      </strong>
                                    </td>
                                    <td style={styles.td}>
                                      <span
                                        style={{
                                          ...styles.badge,
                                          background: sale.paymentType === "CASH" 
                                            ? "rgba(16, 185, 129, 0.1)" 
                                            : "rgba(59, 130, 246, 0.1)",
                                          color: sale.paymentType === "CASH" 
                                            ? "#059669" 
                                            : "#2563eb",
                                          border: "none"
                                        }}
                                      >
                                        {sale.paymentType || "CASH"}
                                      </span>
                                    </td>
                                    <td style={styles.td}>
                                      {sale.bankName || sale.chequeNo || "-"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: "#f8fafc", fontWeight: "800" }}>
                                <td style={styles.td} colSpan="3">
                                  <strong>Totals</strong>
                                </td>
                                <td style={styles.td}>
                                  <strong>{productData.totalSaleQty.toLocaleString()}</strong>
                                </td>
                                <td style={styles.td}>-</td>
                                <td style={styles.td}>-</td>
                                <td style={styles.td}>
                                  <strong style={{ color: "#059669" }}>
                                    {formatCurrency(productData.totalSaleValue)}
                                  </strong>
                                </td>
                                <td style={styles.td}>
                                  {formatCurrency(productData.totalSold * productData.avgPurchaseRate)}
                                </td>
                                <td style={styles.td}>
                                  <strong 
                                    style={productData.totalProfit >= 0 
                                      ? styles.profitPositive 
                                      : styles.profitNegative}
                                  >
                                    {formatCurrency(productData.totalProfit)}
                                    <br />
                                    <span style={{ fontSize: "11px" }}>
                                      ({productData.profitPercentage.toFixed(1)}%)
                                    </span>
                                  </strong>
                                </td>
                                <td style={styles.td} colSpan="2">-</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </>
                    )}

                    {/* Stock Entries */}
                    <h3 style={{ 
                      fontSize: "18px", 
                      fontWeight: "800", 
                      marginTop: "32px",
                      marginBottom: "16px",
                      color: "#1e293b"
                    }}>
                      📦 Purchase Entries ({productData.entries.length})
                    </h3>

                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Purchase Date</th>
                            <th style={styles.th}>Supplier</th>
                            <th style={styles.th}>Purchased Qty</th>
                            <th style={styles.th}>Remaining Qty</th>
                            <th style={styles.th}>Sold Qty</th>
                            <th style={styles.th}>Purchase Rate</th>
                            <th style={styles.th}>Avg Rate (incl. charges)</th>
                            <th style={styles.th}>Total Cost</th>
                            <th style={styles.th}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productData.entries.map((entry, idx) => (
                            <tr key={entry._id || idx}>
                              <td style={styles.td}>
                                {formatDate(entry.purchaseDate)}
                              </td>
                              <td style={styles.td}>
                                <strong>{entry.supplierName || "N/A"}</strong>
                              </td>
                              <td style={styles.td}>
                                {entry.qty.toLocaleString()}
                              </td>
                              <td style={styles.td}>
                                <strong style={{ color: "#059669" }}>
                                  {entry.remaining.toLocaleString()}
                                </strong>
                              </td>
                              <td style={styles.td}>
                                <strong style={{ color: "#dc2626" }}>
                                  {entry.sold.toLocaleString()}
                                </strong>
                              </td>
                              <td style={styles.td}>
                                {formatCurrency(safeNum(entry.purchaseRate))}
                              </td>
                              <td style={styles.td}>
                                {formatCurrency(entry.avgPurchaseRate)}
                              </td>
                              <td style={styles.td}>
                                <strong>{formatCurrency(entry.purchaseCost)}</strong>
                              </td>
                              <td style={styles.td}>
                                <span
                                  style={{
                                    ...styles.badge,
                                    ...(entry.remaining === 0
                                      ? styles.badgeSold
                                      : entry.remaining === entry.qty
                                      ? styles.badgeAvailable
                                      : styles.badgePartial),
                                    border: "none"
                                  }}
                                >
                                  {entry.remaining === 0
                                    ? "Sold Out"
                                    : entry.remaining === entry.qty
                                    ? "Available"
                                    : "Partial"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AvailableStockPage;