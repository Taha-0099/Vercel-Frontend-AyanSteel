// src/SalesLedgerDashboard.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

// Build a safe update payload for your backend PUT (prevents undefined overwrite)
const buildLedgerPayload = (e, newName) => ({
  accountName: newName,
  date: e.date,
  description: e.description || "",
  productType: e.productType || "",
  quantity: Number(e.quantity ?? e.qty ?? 0) || 0,
  rate: Number(e.rate || 0),
  loading: Number(e.loading || 0),
  debit: Number(e.debit || 0),
  credit: Number(e.credit || 0),
  closingBalance: Number(e.closingBalance || 0),
  mdays: Number(e.mdays || 0),
  dueDate: e.dueDate || null,
  liftingDate: e.liftingDate || null,
  paymentType: e.paymentType || "CASH",
  bankName: e.paymentType === "BANK" ? (e.bankName || "") : "",
  chequeNo: e.paymentType === "CHEQUE" ? (e.chequeNo || "") : "",
  chequeDate:
    e.paymentType === "CHEQUE" && e.chequeDate ? e.chequeDate : null
});

function SalesLedgerDashboard() {
  const [summary, setSummary] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/ledger");
      const entries = res.data || [];

      const byClient = {};
      let totalCredit = 0;

      entries.forEach((e) => {
        const name = e.accountName || "Unknown";

        if (!byClient[name]) {
          byClient[name] = {
            accountName: name,
            lastDate: null,
            closingBalance: 0,
            _balance: 0
          };
        }

        const client = byClient[name];

        const d = e.date ? new Date(e.date) : null;
        if (d && (!client.lastDate || d > client.lastDate)) {
          client.lastDate = d;
        }

        const debit = Number(e.debit) || 0;
        const credit = Number(e.credit) || 0;

        totalCredit += credit;

        client._balance += credit - debit;
        client.closingBalance = client._balance;
      });

      const clientArray = Object.values(byClient).sort((a, b) =>
        a.accountName.localeCompare(b.accountName)
      );

      const totalDebitFromClosing = clientArray.reduce((sum, c) => {
        const bal = Number(c.closingBalance) || 0;
        return sum + Math.abs(bal);
      }, 0);

      setSummary({
        totalClients: clientArray.length,
        totalEntries: entries.length,
        totalDebit: totalDebitFromClosing,
        totalCredit
      });

      setClients(clientArray);
    } catch (err) {
      console.error(err);
      setError("Error loading sales ledger dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditName = async (oldName) => {
    const newName = window.prompt("Enter new account name:", oldName);
    if (!newName) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;

    try {
      setLoading(true);

      // Get all entries for this client
      const res = await api.get("/api/ledger", {
        params: { accountName: oldName }
      });
      const entries = res.data || [];

      // Update each entry with FULL SAFE payload
      await Promise.all(
        entries.map((e) =>
          api.put(`/api/ledger/${e._id || e.id}`, buildLedgerPayload(e, trimmed))
        )
      );

      await fetchAll();
    } catch (err) {
      console.error(err);
      alert("Error updating account name.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={headerBar}>
        <div style={titleStyle}>Sales (Client Ledger)</div>
        <div>
          <button style={btn} onClick={() => navigate("/sales")}>
            New Sale
          </button>
          &nbsp;&nbsp;
          <button style={btn} onClick={() => navigate("/company-balance")}>
            Company Balance
          </button>
          &nbsp;
          <button style={btn} onClick={() => navigate("/available-stock")}>
            Availible-Stock
          </button>
          &nbsp;
          <button style={btn} onClick={() => navigate("/stock")}>
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
          <div style={{ flex: "1 1 160px", background: "#fff", padding: "10px", borderRadius: "6px" }}>
            <strong>Total Clients</strong>
            <div>{summary.totalClients}</div>
          </div>
          <div style={{ flex: "1 1 160px", background: "#fff", padding: "10px", borderRadius: "6px" }}>
            <strong>Total Entries</strong>
            <div>{summary.totalEntries}</div>
          </div>
          <div style={{ flex: "1 1 160px", background: "#fff", padding: "10px", borderRadius: "6px" }}>
            <strong>Total Debit</strong>
            <div>{summary.totalDebit.toLocaleString()}</div>
          </div>
          <div style={{ flex: "1 1 160px", background: "#fff", padding: "10px", borderRadius: "6px" }}>
            <strong>Total Credit</strong>
            <div>{summary.totalCredit.toLocaleString()}</div>
          </div>
        </div>
      )}

      <h3>Clients</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headerCell}>Account Name</th>
            <th style={headerCell}>Last Date</th>
            <th style={headerCell}>Closing Balance</th>
            <th style={headerCell}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.accountName}>
              <td style={thtd}>
                <Link to={`/clients/${encodeURIComponent(c.accountName)}`}>
                  {c.accountName}
                </Link>
              </td>
              <td style={thtd}>
                {c.lastDate ? c.lastDate.toLocaleDateString() : "-"}
              </td>
              <td style={thtd}>
                {typeof c.closingBalance === "number"
                  ? c.closingBalance.toLocaleString()
                  : "-"}
              </td>
              <td style={thtd}>
                <button
                  style={btn}
                  onClick={() =>
                    navigate(`/clients/${encodeURIComponent(c.accountName)}`)
                  }
                >
                  View Ledger
                </button>
                &nbsp;
                <button
                  style={{ ...btn, background: "#888" }}
                  onClick={() => handleEditName(c.accountName)}
                >
                  Edit Name
                </button>
              </td>
            </tr>
          ))}
          {clients.length === 0 && !loading && (
            <tr>
              <td style={thtd} colSpan={4}>
                No clients yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SalesLedgerDashboard;
