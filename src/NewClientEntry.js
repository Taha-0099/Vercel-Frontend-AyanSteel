// src/NewClientEntry.js - Form to add new client ledger entry
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";

/* ----------------------------- */
/* ✅ UI UPGRADE (NO LOGIC CHANGE) */
/* ----------------------------- */

const pageWrap = {
  minHeight: "100vh",
  padding: "28px 14px 60px",
  background:
    "radial-gradient(1200px 600px at 10% 10%, #eef3ff 0%, transparent 50%)," +
    "radial-gradient(1200px 600px at 90% 20%, #f1f7ff 0%, transparent 50%)," +
    "linear-gradient(180deg, #f8faff 0%, #f5f7fb 100%)",
};

const container = {
  maxWidth: "900px",
  margin: "0 auto",
  padding: "26px",
  background: "#ffffff",
  borderRadius: "14px",
  border: "1px solid #e6ebf5",
  boxShadow: "0 10px 26px rgba(16, 24, 40, 0.06)",
};

const headerCard = {
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  gap: "12px",
  padding: "14px 14px",
  background: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e8edf7",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  marginBottom: "18px",
};

const title = {
  margin: 0,
  fontSize: "26px",
  fontWeight: "800",
  color: "#0f1f3d",
  textAlign: "center",
  letterSpacing: "0.2px",
  lineHeight: 1.2,
};

const subtitle = {
  marginTop: "6px",
  fontSize: "11px",
  fontWeight: "700",
  color: "#1f3b7a",
  background: "#eef5ff",
  border: "1px solid #dbe7ff",
  display: "inline-block",
  padding: "3px 8px",
  borderRadius: "999px",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px 16px",
};

const formGroup = {
  marginBottom: "0px",
};

const label = {
  display: "block",
  marginBottom: "6px",
  fontWeight: "700",
  fontSize: "12px",
  color: "#27324a",
  letterSpacing: "0.2px",
};

const input = {
  width: "100%",
  padding: "10px 11px",
  borderRadius: "8px",
  border: "1px solid #d9e2f2",
  fontSize: "12.5px",
  background: "#fff",
  boxSizing: "border-box",
  outline: "none",
  transition: "border .15s ease, box-shadow .15s ease",
};

const inputReadOnly = {
  ...input,
  background: "#f6f8ff",
  fontWeight: "700",
  color: "#1f3b7a",
};

const fullRow = {
  gridColumn: "1 / -1",
};

const divider = {
  height: "1px",
  background: "linear-gradient(90deg, transparent, #e7edf7, transparent)",
  margin: "18px 0",
};

const footerBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "22px",
  paddingTop: "14px",
  borderTop: "1px solid #eef2f8",
};

const hint = {
  fontSize: "10.5px",
  color: "#6b7280",
};

const button = {
  padding: "10px 16px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.25)",
  cursor: "pointer",
  background:
    "linear-gradient(135deg, #2f5597 0%, #1f3b7a 50%, #2f5597 100%)",
  color: "#fff",
  fontWeight: "800",
  fontSize: "12px",
  letterSpacing: "0.2px",
  transition: "all .2s ease",
  boxShadow: "0 6px 14px rgba(47, 85, 151, 0.22)",
};

const buttonSecondary = {
  ...button,
  background: "linear-gradient(135deg, #6c757d 0%, #59626a 100%)",
  boxShadow: "0 6px 14px rgba(108, 117, 125, 0.22)",
};

const buttonGhost = {
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px solid #e3e9f5",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "11.5px",
  color: "#1f3b7a",
};

/* ----------------------------- */
/* ✅ LOGIC (UNCHANGED) */
/* ----------------------------- */

function NewClientEntry() {
  const { accountName } = useParams();
  const decodedName = decodeURIComponent(accountName);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    productType: "",
    quantity: "",
    rate: "",
    loading: "",
    credit: "",
    paymentType: "CASH",
    bankName: "",
    chequeNo: "",
    chequeDate: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const qtyNum = Number(form.quantity) || 0;
  const rateNum = Number(form.rate) || 0;
  const loadingNum = Number(form.loading) || 0;
  const debit = qtyNum * rateNum + loadingNum;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        accountName: decodedName,
        ledgerType: "SALES",
        date: form.date,
        description: form.description,
        productType: form.productType,
        quantity: qtyNum,
        rate: rateNum,
        loading: loadingNum,
        debit,
        credit: Number(form.credit) || 0,
        paymentType: form.paymentType,
        bankName: form.paymentType === "BANK" ? form.bankName : "",
        chequeNo: form.paymentType === "CHEQUE" ? form.chequeNo : "",
        chequeDate: form.paymentType === "CHEQUE" && form.chequeDate ? form.chequeDate : null
      };

      await api.post("/api/ledger", payload);

      // If it's a sale (debit > 0), deduct from stock
      if (qtyNum > 0 && form.productType) {
        await api.post("/api/stock", {
          productType: form.productType,
          status: "AVAILABLE",
          date: form.date,
          quantity: -qtyNum,
          rate: rateNum
        });
      }

      navigate(`/clients/${encodeURIComponent(decodedName)}`);
    } catch (err) {
      console.error(err);
      alert("Error creating entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrap}>
      <div style={container}>
        {/* ✅ Modern Header */}
        <div style={headerCard}>
          <button
            type="button"
            style={buttonGhost}
            onClick={() => navigate(-1)}
            title="Go back"
          >
            ⬅ Back
          </button>

          <div style={{ textAlign: "center" }}>
            <h2 style={title}>New Entry</h2>
            <span style={subtitle}>{decodedName}</span>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ ...hint, display: "inline-block" }}>
              Sales Ledger Entry
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ✅ Clean 2-column layout */}
          <div style={formGrid}>
            <div style={formGroup}>
              <label style={label}>Date *</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                style={input}
                required
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Payment Type</label>
              <select
                name="paymentType"
                value={form.paymentType}
                onChange={handleChange}
                style={input}
              >
                <option value="CASH">CASH</option>
                <option value="BANK">BANK-Transfer</option>
                <option value="CHEQUE">Check Payment</option>
              </select>
            </div>

            <div style={{ ...formGroup, ...fullRow }}>
              <label style={label}>Description</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                style={input}
                placeholder="e.g., Sale, Payment received"
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Product Type</label>
              <input
                type="text"
                name="productType"
                value={form.productType}
                onChange={handleChange}
                style={input}
                placeholder="e.g., CRC, EG, GP"
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Quantity</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                style={input}
                placeholder="0"
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Rate</label>
              <input
                type="number"
                name="rate"
                value={form.rate}
                onChange={handleChange}
                style={input}
                placeholder="0"
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Loading</label>
              <input
                type="number"
                name="loading"
                value={form.loading}
                onChange={handleChange}
                style={input}
                placeholder="0"
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Debit (Auto-calculated)</label>
              <input
                type="text"
                value={debit.toLocaleString()}
                style={inputReadOnly}
                readOnly
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Credit (Payment Received)</label>
              <input
                type="number"
                name="credit"
                value={form.credit}
                onChange={handleChange}
                style={input}
                placeholder="0"
              />
            </div>
          </div>

          <div style={divider} />

          {/* ✅ Conditional payment fields styled */}
          {form.paymentType === "BANK" && (
            <div style={{ ...formGrid }}>
              <div style={{ ...formGroup, ...fullRow }}>
                <label style={label}>Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={form.bankName}
                  onChange={handleChange}
                  style={input}
                  placeholder="Bank name"
                />
              </div>
            </div>
          )}

          {form.paymentType === "CHEQUE" && (
            <div style={{ ...formGrid }}>
              <div style={formGroup}>
                <label style={label}>Cheque Number</label>
                <input
                  type="text"
                  name="chequeNo"
                  value={form.chequeNo}
                  onChange={handleChange}
                  style={input}
                  placeholder="Cheque number"
                />
              </div>

              <div style={formGroup}>
                <label style={label}>Cheque Date</label>
                <input
                  type="date"
                  name="chequeDate"
                  value={form.chequeDate}
                  onChange={handleChange}
                  style={input}
                />
              </div>
            </div>
          )}

          {/* ✅ Footer actions */}
          <div style={footerBar}>
            <div style={hint}>
              Tip: Debit is calculated automatically from Qty × Rate + Loading.
            </div>

            <div>
              <button type="submit" style={button} disabled={loading}>
                {loading ? "Saving..." : "Save Entry"}
              </button>
              <button
                type="button"
                style={{ ...buttonSecondary, marginLeft: "8px" }}
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewClientEntry;
