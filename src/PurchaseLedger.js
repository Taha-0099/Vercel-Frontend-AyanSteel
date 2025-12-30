// src/PurchaseLedger.js - Purchase/Suppliers Dashboard
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";

const container = {
  maxWidth: "1100px",
  margin: "20px auto",
  padding: "20px",
  background: "#f5f7fb",
  borderRadius: "8px",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)"
};

const headerBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
};

const titleStyle = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#c0392b"
};

const btn = {
  padding: "8px 16px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  background: "#c0392b",
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
  background: "#f7dfdf",
  fontWeight: "bold",
  textAlign: "left"
};

function PurchaseLedger() {
  const [summary, setSummary] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");

      // Get PURCHASE ledger entries only
      const res = await api.get("/api/ledger", {
        params: { ledgerType: "PURCHASE" }
      });
      const entries = res.data || [];

      const bySupplier = {};
      let totalDebit = 0;
      let totalCredit = 0;

      entries.forEach((e) => {
        const name = e.accountName || "Unknown";

        if (!bySupplier[name]) {
          bySupplier[name] = {
            accountName: name,
            lastDate: null,
            closingBalance: 0,
            _balance: 0
          };
        }

        const supplier = bySupplier[name];
        const d = e.date ? new Date(e.date) : null;
        if (d && (!supplier.lastDate || d > supplier.lastDate)) {
          supplier.lastDate = d;
        }

        const debit = Number(e.debit) || 0;
        const credit = Number(e.credit) || 0;

        totalDebit += debit;
        totalCredit += credit;

        // For purchases: debit = we paid, credit = we purchased (owe)
        supplier._balance += credit - debit;
        supplier.closingBalance = supplier._balance;
      });

      const supplierArray = Object.values(bySupplier).sort((a, b) =>
        a.accountName.localeCompare(b.accountName)
      );

      setSummary({
        totalSuppliers: supplierArray.length,
        totalEntries: entries.length,
        totalDebit,
        totalCredit
      });

      setSuppliers(supplierArray);
    } catch (err) {
      console.error(err);
      setError("Error loading purchase ledger.");
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

      const res = await api.get("/api/ledger", {
        params: { accountName: oldName, ledgerType: "PURCHASE" }
      });
      const entries = res.data || [];

      await Promise.all(
        entries.map((e) =>
          api.put(`/api/ledger/${e._id || e.id}`, {
            accountName: trimmed
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
    <div style={container}>
      <div style={headerBar}>
        <div style={titleStyle}>Purchase Ledger (Suppliers)</div>
        <div>
          <button 
            style={{ ...btn, background: "#2f5597" }} 
            onClick={() => navigate("/sales-ledger")}
          >
            Sales Ledger
          </button>
          &nbsp;&nbsp;
          <button style={btn} onClick={() => navigate("/purchases/new")}>
            New Purchase
          </button>
          &nbsp;&nbsp;
          <button 
            style={{ ...btn, background: "#2f5597" }} 
            onClick={() => navigate("/company-balance")}
          >
            Company Balance
          </button>
          &nbsp;
          <button 
            style={{ ...btn, background: "#2f5597" }} 
            onClick={() => navigate("/stock")}
          >
            Stock Dashboard
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
          <div
            style={{
              flex: "1 1 160px",
              background: "#fff",
              padding: "10px",
              borderRadius: "6px"
            }}
          >
            <strong>Total Suppliers</strong>
            <div>{summary.totalSuppliers}</div>
          </div>
          <div
            style={{
              flex: "1 1 160px",
              background: "#fff",
              padding: "10px",
              borderRadius: "6px"
            }}
          >
            <strong>Total Entries</strong>
            <div>{summary.totalEntries}</div>
          </div>
          <div
            style={{
              flex: "1 1 160px",
              background: "#fff",
              padding: "10px",
              borderRadius: "6px"
            }}
          >
            <strong>Total Debit (Paid)</strong>
            <div>{summary.totalDebit.toLocaleString()}</div>
          </div>
          <div
            style={{
              flex: "1 1 160px",
              background: "#fff",
              padding: "10px",
              borderRadius: "6px"
            }}
          >
            <strong>Total Credit (Purchases)</strong>
            <div>{summary.totalCredit.toLocaleString()}</div>
          </div>
        </div>
      )}

      <h3>Suppliers</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headerCell}>Supplier Name</th>
            <th style={headerCell}>Last Date</th>
            <th style={headerCell}>Closing Balance (Payable)</th>
            <th style={headerCell}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.accountName}>
              <td style={thtd}>
                <Link to={`/suppliers/${encodeURIComponent(s.accountName)}`}>
                  {s.accountName}
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
                    navigate(`/suppliers/${encodeURIComponent(s.accountName)}`)
                  }
                >
                  View Ledger
                </button>
                &nbsp;
                <button
                  style={{ ...btn, background: "#888" }}
                  onClick={() => handleEditName(s.accountName)}
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

export default PurchaseLedger;