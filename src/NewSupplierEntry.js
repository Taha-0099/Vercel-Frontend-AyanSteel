// src/NewSupplierEntry.js - Form to add new supplier ledger entry
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";

const container = {
  maxWidth: "800px",
  margin: "40px auto",
  padding: "30px",
  background: "#f5f7fb",
  borderRadius: "8px",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)"
};

const formGroup = {
  marginBottom: "16px"
};

const label = {
  display: "block",
  marginBottom: "6px",
  fontWeight: "600",
  fontSize: "14px"
};

const input = {
  width: "100%",
  padding: "10px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "14px",
  boxSizing: "border-box"
};

const button = {
  padding: "10px 20px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  background: "#c0392b",
  color: "#fff",
  fontWeight: "600",
  fontSize: "14px",
  marginRight: "10px"
};

function NewSupplierEntry() {
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
        ledgerType: "PURCHASE",
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

      // If it's a purchase (credit > 0), add to stock
      if (qtyNum > 0 && form.productType) {
        await api.post("/api/stock", {
          productType: form.productType,
          status: "AVAILABLE",
          date: form.date,
          quantity: qtyNum,
          rate: rateNum
        });
      }

      navigate(`/suppliers/${encodeURIComponent(decodedName)}`);
    } catch (err) {
      console.error(err);
      alert("Error creating entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <h2 style={{ color: "#c0392b" }}>New Purchase Entry for {decodedName}</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={formGroup}>
          <label style={label}>Date</label>
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
          <label style={label}>Description</label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            style={input}
            placeholder="e.g., Purchase, Payment made"
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
          <label style={label}>Debit (Payment Made)</label>
          <input
            type="number"
            name="debit"
            value={debit}
            style={{ ...input, background: "#e9ecef" }}
            readOnly
          />
        </div>

        <div style={formGroup}>
          <label style={label}>Credit (Purchase Amount - Auto-calculated)</label>
          <input
            type="text"
            value={debit.toLocaleString()}
            style={{ ...input, background: "#e9ecef" }}
            readOnly
          />
          <small style={{ color: "#666", fontSize: "12px" }}>
            Note: For purchases, credit represents what you owe to supplier
          </small>
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

        {form.paymentType === "BANK" && (
          <div style={formGroup}>
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
        )}

        {form.paymentType === "CHEQUE" && (
          <>
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
          </>
        )}

        <div style={{ marginTop: "24px" }}>
          <button type="submit" style={button} disabled={loading}>
            {loading ? "Saving..." : "Save Purchase"}
          </button>
          <button
            type="button"
            style={{ ...button, background: "#6c757d" }}
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewSupplierEntry;