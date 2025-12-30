// src/SalesLedger.js - Sales/Clients Dashboard
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

function SalesLedger() {
  const [summary, setSummary] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");

      // Get SALES ledger entries only
      const res = await api.get("/api/ledger", {
        params: { ledgerType: "SALES" }
      });
      const entries = res.data || [];

      const byClient = {};
      let totalDebit = 0;
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

        totalDebit += debit;
        totalCredit += credit;

        client._balance += credit - debit;
        client.closingBalance = client._balance;
      });

      const clientArray = Object.values(byClient).sort((a, b) =>
        a.accountName.localeCompare(b.accountName)
      );

      setSummary({
        totalClients: clientArray.length,
        totalEntries: entries.length,
        totalDebit,
        totalCredit
      });

      setClients(clientArray);
    } catch (err) {
      console.error(err);
      setError("Error loading sales ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleEditName = async (oldName) => {
    const newName = window.prompt("Enter new account name:", oldName);
    if (!newName) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;

    try {
      setLoading(true);

      const res = await api.get("/api/ledger", {
        params: { accountName: oldName, ledgerType: "SALES" }
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
      alert("Error updating account name.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <div style={headerBar}>
        <div style={titleStyle}>Sales Ledger (Clients)</div>
        <div>
          <button style={btn} onClick={() => navigate("/purchase-ledger")}>
            Purchase Ledger
          </button>
          &nbsp;&nbsp;
          <button style={btn} onClick={() => navigate("/sales")}>
            New Sale
          </button>
          &nbsp;&nbsp;
          <button style={btn} onClick={() => navigate("/company-balance")}>
            Company Balance
          </button>
          &nbsp;
          <button style={btn} onClick={() => navigate("/available-stock")}>
            Available Stock
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
          <div
            style={{
              flex: "1 1 160px",
              background: "#fff",
              padding: "10px",
              borderRadius: "6px"
            }}
          >
            <strong>Total Clients</strong>
            <div>{summary.totalClients}</div>
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
            <strong>Total Debit (Sales)</strong>
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
            <strong>Total Credit (Received)</strong>
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

export default SalesLedger;