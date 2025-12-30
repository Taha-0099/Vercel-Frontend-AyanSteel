// src/SupplierLedgerDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api";

const headerBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  flexWrap: "wrap",
  gap: "8px"
};

const titleStyle = {
  fontSize: "22px",
  fontWeight: "bold"
};

const btn = {
  padding: "8px 16px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  background: "#2f5597",
  color: "#fff",
  fontWeight: "600"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px"
};

const thtd = {
  border: "1px solid #ccc",
  padding: "8px",
  fontSize: "14px"
};

const headerCell = {
  ...thtd,
  background: "#dfebf7",
  fontWeight: "bold",
  textAlign: "left"
};

function SupplierLedgerDashboard() {
  const [summary, setSummary] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/supplier-ledger");
      const entries = res.data || [];

      const bySupplier = {};
      let totalPayments = 0; // money you paid
      let totalPurchases = 0; // money you owe (purchases/opening)

      entries.forEach((e) => {
        const name = e.personName || "Unknown";
        const type = e.type || "PAYMENT";
        const amount = Number(e.amount) || 0;
        const extra = Number(e.otherExpenseAmount) || 0;

        if (!bySupplier[name]) {
          bySupplier[name] = {
            personName: name,
            lastDate: null,
            closingBalance: 0,
            _balance: 0
          };
        }

        const sup = bySupplier[name];

        const d = e.paymentDate ? new Date(e.paymentDate) : null;
        if (d && (!sup.lastDate || d > sup.lastDate)) {
          sup.lastDate = d;
        }

        // Balance logic:
        // OPENING/PURCHASE increases payable (you owe supplier)
        // PAYMENT decreases payable
        if (type === "PAYMENT") {
          sup._balance -= amount;
          totalPayments += amount;
        } else {
          sup._balance += amount + extra;
          totalPurchases += amount + extra;
        }

        sup.closingBalance = sup._balance;
      });

      const supplierArray = Object.values(bySupplier).sort((a, b) =>
        a.personName.localeCompare(b.personName)
      );

      const totalOutstanding = supplierArray.reduce((sum, s) => {
        const bal = Number(s.closingBalance) || 0;
        return sum + Math.abs(bal);
      }, 0);

      setSummary({
        totalSuppliers: supplierArray.length,
        totalEntries: entries.length,
        totalPurchases,
        totalPayments,
        totalOutstanding
      });

      setSuppliers(supplierArray);
    } catch (err) {
      console.error(err);
      setError("Error loading supplier ledger dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleEditName = async (oldName) => {
    const newName = window.prompt("Enter new supplier name:", oldName);
    if (!newName) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;

    try {
      setLoading(true);

      const res = await api.get("/api/supplier-ledger", {
        params: { personName: oldName }
      });
      const entries = res.data || [];

      await Promise.all(
        entries.map((e) =>
          api.put(`/api/supplier-ledger/${e._id || e.id}`, {
            personName: trimmed,
            type: e.type,
            paymentDate: e.paymentDate,
            bankName: e.bankName || "",
            amount: e.amount,
            note: e.note || "",
            otherExpenseName: e.otherExpenseName || "",
            otherExpenseAmount: e.otherExpenseAmount || 0
          })
        )
      );

      await fetchAll();
    } catch (err) {
      console.error(err);
      alert("Error updating supplier name.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={headerBar}>
        <div style={titleStyle}>Purchases (Supplier Ledger)</div>
        <div>
          <button
            style={btn}
            onClick={() => navigate("/supplier-ledger/new")}
          >
            + New Supplier Entry
          </button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {summary && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap"
          }}
        >
          <div style={{ flex: "1 1 160px", background: "#fff", padding: "10px", borderRadius: "6px" }}>
            <strong>Total Suppliers</strong>
            <div>{summary.totalSuppliers}</div>
          </div>
          <div style={{ flex: "1 1 160px", background: "#fff", padding: "10px", borderRadius: "6px" }}>
            <strong>Total Entries</strong>
            <div>{summary.totalEntries}</div>
          </div>
          <div style={{ flex: "1 1 160px", background: "#fff", padding: "10px", borderRadius: "6px" }}>
            <strong>Total Purchases</strong>
            <div>{summary.totalPurchases.toLocaleString()}</div>
          </div>
          <div style={{ flex: "1 1 160px", background: "#fff", padding: "10px", borderRadius: "6px" }}>
            <strong>Total Payments</strong>
            <div>{summary.totalPayments.toLocaleString()}</div>
          </div>
          <div style={{ flex: "1 1 160px", background: "#fff", padding: "10px", borderRadius: "6px" }}>
            <strong>Total Outstanding</strong>
            <div>{summary.totalOutstanding.toLocaleString()}</div>
          </div>
        </div>
      )}

      <h3>Suppliers</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headerCell}>Supplier Name</th>
            <th style={headerCell}>Last Date</th>
            <th style={headerCell}>Closing Balance</th>
            <th style={headerCell}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.personName}>
              <td style={thtd}>
                <Link to={`/suppliers/${encodeURIComponent(s.personName)}`}>
                  {s.personName}
                </Link>
              </td>
              <td style={thtd}>
                {s.lastDate ? s.lastDate.toLocaleDateString() : "-"}
              </td>
              <td style={thtd}>
                {typeof s.closingBalance === "number"
                  ? s.closingBalance.toLocaleString()
                  : "-"}
              </td>
              <td style={thtd}>
                <button
                  style={btn}
                  onClick={() =>
                    navigate(`/suppliers/${encodeURIComponent(s.personName)}`)
                  }
                >
                  View Ledger
                </button>
                &nbsp;
                <button
                  style={{ ...btn, background: "#888" }}
                  onClick={() => handleEditName(s.personName)}
                >
                  Edit Name
                </button>
              </td>
            </tr>
          ))}
          {suppliers.length === 0 && !loading && (
            <tr>
              <td style={thtd} colSpan={4}>
                No suppliers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SupplierLedgerDashboard;
