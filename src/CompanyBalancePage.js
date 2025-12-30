// src/CompanyBalancePage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const outerBox = {
  maxWidth: "1100px",
  margin: "20px auto",
  padding: "20px",
  background: "#f5f7fb",
  borderRadius: "8px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
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

const card = {
  background: "#ffffff",
  borderRadius: "8px",
  padding: "16px",
  border: "1px solid #e0e0e0",
  marginBottom: "16px"
};

const label = { fontSize: "13px", fontWeight: 600, marginBottom: "4px" };

const input = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: "4px",
  border: "1px solid #ced4da",
  fontSize: "13px"
};

const row = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "12px",
  marginBottom: "12px"
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

const actionBtn = {
  padding: "4px 10px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  fontSize: "12px",
  marginRight: "4px"
};

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(); // date + time
}

/**
 * Recompute Remaining Balance (closingBalance) for each person.
 * - Group by personName
 * - Sort each person’s rows by date (oldest → newest)
 * - Running balance uses: balance += credit - debit
 *   (same logic as main ledger so credits reduce negative balance)
 * - Returns a new array with updated closingBalance for every row.
 */
function computeClosingByPerson(entries) {
  const groups = {};

  (entries || []).forEach((e) => {
    const key = e.personName || "UNKNOWN";
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  const result = [];

  Object.keys(groups).forEach((person) => {
    const sorted = [...groups[person]].sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return 0;
      return da - db;
    });

    let balance = 0;

    sorted.forEach((e, index) => {
      const debit = Number(e.debit) || 0;
      const credit = Number(e.credit) || 0;
      const desc = (e.description || "").toLowerCase();

      // If FIRST row is Opening Balance or B/F → treat it specially
      if (
        index === 0 &&
        (desc === "b/f" || desc.startsWith("opening balance"))
      ) {
        balance = credit - debit;
      } else {
        balance += credit - debit;
      }

      result.push({
        ...e,
        closingBalance: balance
      });
    });
  });

  // Final sort: by person, then by date (for display)
  return result.sort((a, b) => {
    const nameDiff = (a.personName || "").localeCompare(b.personName || "");
    if (nameDiff !== 0) return nameDiff;

    const da = new Date(a.date);
    const db = new Date(b.date);
    if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return 0;
    return da - db;
  });
}

function CompanyBalancePage() {
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    personName: "",
    date: "",
    description: "",
    debit: 0,
    credit: 0
  });

  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    personName: "",
    date: "",
    description: "",
    debit: 0,
    credit: 0
  });

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/company-balance");
      const list = res.data || [];
      const withClosing = computeClosingByPerson(list);
      setEntries(withClosing);
    } catch (err) {
      console.error(err);
      setError("Error loading company balances.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "debit" || name === "credit"
          ? value === ""
            ? ""
            : Number(value)
          : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.personName || !form.date) {
      alert("Please enter Name and Date.");
      return;
    }

    try {
      setSaving(true);
      await api.post("/api/company-balance", form);
      setForm({
        personName: "",
        date: "",
        description: "",
        debit: 0,
        credit: 0
      });
      await loadEntries();
    } catch (err) {
      console.error(err);
      alert("Error saving entry.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry._id);
    setEditForm({
      personName: entry.personName,
      date: entry.date ? entry.date.substring(0, 10) : "",
      description: entry.description || "",
      debit: entry.debit || 0,
      credit: entry.credit || 0
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]:
        name === "debit" || name === "credit"
          ? value === ""
            ? ""
            : Number(value)
          : value
    }));
  };

  const saveEdit = async () => {
    try {
      await api.put(`/api/company-balance/${editingId}`, editForm);
      setEditingId(null);
      await loadEntries(); // recompute remaining balances after edit
    } catch (err) {
      console.error(err);
      alert("Error updating entry.");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await api.delete(`/api/company-balance/${id}`);
      await loadEntries(); // recompute after delete
    } catch (err) {
      console.error(err);
      alert("Error deleting entry.");
    }
  };

  return (
    <div style={outerBox}>
      <div style={headerRow}>
        <div style={title}>Company Balances</div>
        <div>
          <button style={btn} onClick={() => navigate("/admin")}>
            Admin Panel
          </button>
          <button style={btn} onClick={() => navigate("/")}>
            Ledger
          </button>
        </div>
      </div>

      {/* New entry form */}
      <div style={card}>
        <form onSubmit={handleSubmit}>
          <div style={row}>
            <div>
              <div style={label}>Person / Company Name</div>
              <input
                style={input}
                type="text"
                name="personName"
                value={form.personName}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <div style={label}>Date</div>
              <input
                style={input}
                type="date"
                name="date"
                value={form.date}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <div style={label}>Debit (You gave)</div>
              <input
                style={input}
                type="number"
                name="debit"
                value={form.debit}
                onChange={handleFormChange}
              />
            </div>
            <div>
              <div style={label}>Credit (You received)</div>
              <input
                style={input}
                type="number"
                name="credit"
                value={form.credit}
                onChange={handleFormChange}
              />
            </div>
          </div>
          <div style={row}>
            <div style={{ gridColumn: "1 / span 4" }}>
              <div style={label}>Description</div>
              <input
                style={input}
                type="text"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="e.g. Loan given, payment received, starting balance..."
              />
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <button
              style={{
                padding: "8px 18px",
                borderRadius: "4px",
                border: "none",
                background: "#28a745",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer"
              }}
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table style={table}>
        <thead>
          <tr>
            <th style={headerCell}>Person</th>
            <th style={headerCell}>Date & Time</th>
            <th style={headerCell}>Description</th>
            <th style={headerCell}>Debit</th>
            <th style={headerCell}>Credit</th>
            <th style={headerCell}>Remaining Balance</th>
            <th style={headerCell}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const isEditing = editingId === e._id;
            if (isEditing) {
              return (
                <tr key={e._id}>
                  <td style={thtd}>
                    <input
                      style={input}
                      type="text"
                      name="personName"
                      value={editForm.personName}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td style={thtd}>
                    <input
                      style={input}
                      type="date"
                      name="date"
                      value={editForm.date}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td style={thtd}>
                    <input
                      style={input}
                      type="text"
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td style={thtd}>
                    <input
                      style={input}
                      type="number"
                      name="debit"
                      value={editForm.debit}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td style={thtd}>
                    <input
                      style={input}
                      type="number"
                      name="credit"
                      value={editForm.credit}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td style={thtd}>
                    {(e.closingBalance || 0).toLocaleString()}
                  </td>
                  <td style={thtd}>
                    <button
                      style={{ ...actionBtn, background: "#2f5597", color: "#fff" }}
                      onClick={saveEdit}
                    >
                      Save
                    </button>
                    <button
                      style={{ ...actionBtn, background: "#999", color: "#fff" }}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={e._id}>
                <td style={thtd}>{e.personName}</td>
                <td style={thtd}>{formatDate(e.date)}</td>
                <td style={thtd}>{e.description}</td>
                <td style={thtd}>{(e.debit || 0).toLocaleString()}</td>
                <td style={thtd}>{(e.credit || 0).toLocaleString()}</td>
                <td style={thtd}>
                  {(e.closingBalance || 0).toLocaleString()}
                </td>
                <td style={thtd}>
                  <button
                    style={{ ...actionBtn, background: "#2f5597", color: "#fff" }}
                    onClick={() => startEdit(e)}
                  >
                    Edit
                  </button>
                  <button
                    style={{ ...actionBtn, background: "#c0392b", color: "#fff" }}
                    onClick={() => handleDelete(e._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
          {entries.length === 0 && !loading && (
            <tr>
              <td style={thtd} colSpan={7}>
                No entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CompanyBalancePage;
