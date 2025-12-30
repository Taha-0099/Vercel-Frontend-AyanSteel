// src/SupplierLedgerPage.js
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "./api";

const outerBox = {
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
  marginBottom: "16px",
  gap: "8px",
  flexWrap: "wrap"
};

const title = {
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center",
  flex: 1
};

const button = {
  padding: "8px 16px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  background: "#2f5597",
  color: "#fff",
  fontWeight: "600",
  marginLeft: "8px"
};

const table = {
  width: "100%",
  borderCollapse: "collapse"
};

const thtd = {
  border: "1px solid #999",
  padding: "6px",
  fontSize: "13px",
  textAlign: "center"
};

const headerCell = {
  ...thtd,
  background: "#dfebf7",
  fontWeight: "bold"
};

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function computeSupplierClosing(entries) {
  let balance = 0;
  const sorted = [...entries].sort(
    (a, b) => new Date(a.paymentDate) - new Date(b.paymentDate)
  );

  return sorted.map((e) => {
    const type = e.type || "PAYMENT";
    const amount = Number(e.amount) || 0;
    const extra = Number(e.otherExpenseAmount) || 0;

    if (type === "PAYMENT") {
      balance -= amount;
    } else {
      balance += amount + extra;
    }

    return { ...e, closingBalance: balance };
  });
}

function SupplierLedgerPage() {
  const { personName } = useParams();
  const decodedName = decodeURIComponent(personName);
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/supplier-ledger", {
        params: { personName: decodedName }
      });

      const withClosing = computeSupplierClosing(res.data || []);
      setEntries(withClosing);
    } catch (err) {
      console.error(err);
      setError("Error loading supplier ledger entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedName]);

  return (
    <div style={outerBox}>
      <div style={headerRow}>
        <button style={button} onClick={() => navigate(-1)}>
          ⬅ Back
        </button>
        <div style={title}>{decodedName}</div>
        <div />
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table style={table}>
        <thead>
          <tr>
            <th style={headerCell}>Date</th>
            <th style={headerCell}>Type</th>
            <th style={headerCell}>Bank</th>
            <th style={headerCell}>Amount</th>
            <th style={headerCell}>Other Expense</th>
            <th style={headerCell}>Other Amount</th>
            <th style={headerCell}>Note</th>
            <th style={headerCell}>Closing Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e._id || Math.random()}>
              <td style={thtd}>{formatDate(e.paymentDate)}</td>
              <td style={thtd}>{e.type || "-"}</td>
              <td style={thtd}>{e.bankName || "CASH"}</td>
              <td style={thtd}>
                {e.amount ? Number(e.amount).toLocaleString() : ""}
              </td>
              <td style={thtd}>{e.otherExpenseName || ""}</td>
              <td style={thtd}>
                {e.otherExpenseAmount
                  ? Number(e.otherExpenseAmount).toLocaleString()
                  : ""}
              </td>
              <td style={thtd}>{e.note || ""}</td>
              <td style={thtd}>
                {typeof e.closingBalance === "number"
                  ? e.closingBalance.toLocaleString()
                  : ""}
              </td>
            </tr>
          ))}
          {entries.length === 0 && !loading && (
            <tr>
              <td style={thtd} colSpan={8}>
                No entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SupplierLedgerPage;
