// src/AvailableStockPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const page = {
  maxWidth: "1100px",
  margin: "20px auto",
  padding: "20px",
  background: "#f5f7fb",
  borderRadius: "8px",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)"
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px"
};

const title = {
  fontSize: "24px",
  fontWeight: "bold"
};

const btn = {
  padding: "6px 12px",
  borderRadius: "4px",
  border: "1px solid #2f5597",
  background: "#fff",
  color: "#2f5597",
  cursor: "pointer",
  marginLeft: "8px",
  fontSize: "13px",
  fontWeight: 600
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "14px",
  gap: "8px",
  flexWrap: "wrap"
};

const searchInput = {
  flex: "1 1 240px",
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid #ced4da",
  fontSize: "13px"
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
  borderRadius: "8px",
  overflow: "hidden",
  border: "1px solid #e0e0e0"
};

const thtd = {
  border: "1px solid #e0e0e0",
  padding: "8px",
  fontSize: "13px",
  textAlign: "center"
};

const headerCell = {
  ...thtd,
  background: "#dfebf7",
  fontWeight: "bold"
};

const summaryRow = {
  display: "flex",
  gap: "12px",
  marginTop: "16px",
  flexWrap: "wrap"
};

const summaryCard = {
  flex: "1 1 220px",
  background: "#ffffff",
  borderRadius: "6px",
  padding: "10px 12px",
  border: "1px solid #e0e0e0"
};

function AvailableStockPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // load + aggregate AVAILABLE stock
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/stock");
      const list = res.data || [];

      // Aggregate only AVAILABLE
      const map = {};

      list.forEach((s) => {
        if (!s.productType || s.status !== "AVAILABLE") return;

        const key = s.productType;
        const qty = Number(s.quantity) || 0;
        const rate = Number(s.rate) || 0;

        if (!map[key]) {
          map[key] = {
            productType: key,
            totalQty: 0,
            totalValue: 0
          };
        }

        map[key].totalQty += qty;
        map[key].totalValue += qty * rate;
      });

      const aggregated = Object.values(map)
        .map((r) => ({
          productType: r.productType,
          totalQty: r.totalQty,
          avgRate: r.totalQty !== 0 ? r.totalValue / r.totalQty : 0,
          totalValue: r.totalValue
        }))
        // only show positive available stock
        .filter((r) => r.totalQty > 0)
        .sort((a, b) => a.productType.localeCompare(b.productType));

      setRows(aggregated);
    } catch (err) {
      console.error(err);
      setError("Error loading available stock.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = rows.filter((r) =>
    r.productType.toLowerCase().includes(search.toLowerCase())
  );

  // totals for bottom summary
  let grandQty = 0;
  let grandValue = 0;
  filteredRows.forEach((r) => {
    grandQty += r.totalQty;
    grandValue += r.totalValue;
  });

  return (
    <div style={page}>
      <div style={headerRow}>
        <div style={title}>Available Stock</div>
        <div>
          <button style={btn} onClick={() => navigate("/stock")}>
            Stock Dashboard
          </button>
          <button style={btn} onClick={() => navigate("/")}>
            Ledger
          </button>
        </div>
      </div>

      <div style={topBar}>
        <input
          type="text"
          placeholder="Search Type / Product"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />
        {/* just a placeholder filter button like in your screenshot */}
        <button
          type="button"
          style={{
            ...btn,
            borderRadius: "20px",
            background: "#fff"
          }}
        >
          Filter
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && filteredRows.length === 0 && !error && (
        <p>No available stock found.</p>
      )}

      {!loading && filteredRows.length > 0 && (
        <>
          <table style={table}>
            <thead>
              <tr>
                <th style={headerCell}>#</th>
                <th style={headerCell}>Type / Product</th>
                <th style={headerCell}>Available Qty</th>
                <th style={headerCell}>Purchasing Rate</th>
                <th style={headerCell}>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, idx) => (
                <tr key={r.productType}>
                  <td style={thtd}>{idx + 1}</td>
                  <td style={thtd}>{r.productType}</td>
                  <td style={thtd}>{r.totalQty.toLocaleString("en-US")}</td>
                  <td style={thtd}>
                    {Math.round(r.avgRate).toLocaleString("en-US")}
                  </td>
                  <td style={thtd}>
                    {Math.round(r.totalValue).toLocaleString("en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom summary cards (like small KPIs) */}
          <div style={summaryRow}>
            <div style={summaryCard}>
              <div style={{ fontSize: "13px", fontWeight: 600 }}>
                Total Available Quantity
              </div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "18px",
                  fontWeight: "bold"
                }}
              >
                {grandQty.toLocaleString("en-US")}
              </div>
            </div>
            <div style={summaryCard}>
              <div style={{ fontSize: "13px", fontWeight: 600 }}>
                Total Available Value
              </div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "18px",
                  fontWeight: "bold"
                }}
              >
                {Math.round(grandValue).toLocaleString("en-US")}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AvailableStockPage;
