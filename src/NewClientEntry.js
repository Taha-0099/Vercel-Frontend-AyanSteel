// src/NewClientEntry.js - Form to add new client ledger entry
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";
import Swal from "sweetalert2";

/* ----------------------------- */
/* ✅ UI STYLES */
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

const select = {
  ...input,
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

const stockInfo = {
  fontSize: "12px",
  marginTop: "6px",
  color: "#374151",
  fontWeight: "600",
};

/* ----------------------------- */
/* ✅ COMPONENT LOGIC */
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
  const [productTypes, setProductTypes] = useState([]);
  const [availableByType, setAvailableByType] = useState({});
  const [stockLoading, setStockLoading] = useState(false);

  // Calculate values with useMemo for performance
  const qtyNum = useMemo(() => Number(form.quantity) || 0, [form.quantity]);
  const rateNum = useMemo(() => Number(form.rate) || 0, [form.rate]);
  const loadingNum = useMemo(() => Number(form.loading) || 0, [form.loading]);
  const debit = useMemo(() => qtyNum * rateNum + loadingNum, [qtyNum, rateNum, loadingNum]);

  // Get available stock for selected product
  const availableForSelected = useMemo(() => {
    return form.productType ? (availableByType[form.productType] || 0) : 0;
  }, [form.productType, availableByType]);

  // Calculate stock after this sale
  const afterSale = useMemo(() => {
    return availableForSelected - qtyNum;
  }, [availableForSelected, qtyNum]);

  // Load stock data from API
  const loadStock = async () => {
    try {
      setStockLoading(true);
      const res = await api.get("/api/stock");
      const list = res.data || [];

      const typesSet = new Set();
      const availableMap = {};

      // Calculate REMAINING stock by summing ALL quantities
      // (includes negative values from sales)
      list.forEach((s) => {
        if (s.productType) {
          typesSet.add(s.productType);
          const q = Number(s.quantity) || 0;
          availableMap[s.productType] = (availableMap[s.productType] || 0) + q;
        }
      });

      setProductTypes(Array.from(typesSet).sort());
      setAvailableByType(availableMap);
    } catch (err) {
      console.error("Error loading stock", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load stock data.",
        timer: 2000,
      });
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Check stock availability
    if (qtyNum > 0 && form.productType) {
      const available = availableByType[form.productType] || 0;
      if (qtyNum > available) {
        await Swal.fire({
          icon: "error",
          title: "Insufficient Stock",
          html: `
            <p><strong>Product:</strong> ${form.productType}</p>
            <p><strong>Available:</strong> ${available.toLocaleString()}</p>
            <p><strong>Requested:</strong> ${qtyNum.toLocaleString()}</p>
            <p style="color: #dc2626; font-weight: 600; margin-top: 10px;">
              Cannot sell more than available stock!
            </p>
          `,
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Create ledger entry
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

      // Deduct from stock
      if (qtyNum > 0 && form.productType) {
        await api.post("/api/stock", {
          productType: form.productType,
          status: "AVAILABLE",
          date: form.date,
          quantity: -qtyNum, // Negative to deduct
          rate: rateNum
        });
      }

      await Swal.fire({
        icon: "success",
        title: "Sale Entry Created",
        text: `Stock deducted: ${qtyNum.toLocaleString()} ${form.productType}`,
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(`/clients/${encodeURIComponent(decodedName)}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Error creating entry.";
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrap}>
      <div style={container}>
        {/* Header */}
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
            <h2 style={title}>New Sale Entry</h2>
            <span style={subtitle}>{decodedName}</span>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ ...hint, display: "inline-block" }}>
              Sales Ledger Entry
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Client/Account Name & Opening Balance */}
          <div style={formGrid}>
            <div style={formGroup}>
              <label style={label}>Client / Account Name</label>
              <input
                type="text"
                value={decodedName}
                style={inputReadOnly}
                readOnly
              />
            </div>

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
              <label style={label}>Type (Product)</label>
              <select
                name="productType"
                value={form.productType}
                onChange={handleChange}
                style={select}
              >
                <option value="">Select Product Type</option>
                {productTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div style={stockInfo}>
                {stockLoading ? (
                  "Loading stock..."
                ) : form.productType ? (
                  <>
                    Available Qty: <strong>{availableForSelected.toLocaleString()}</strong>
                    {qtyNum > 0 && (
                      <>
                        {" | "}After this sale: <strong style={{ color: afterSale < 0 ? "#dc2626" : "#059669" }}>
                          {afterSale.toLocaleString()}
                        </strong>
                      </>
                    )}
                  </>
                ) : (
                  "Select a product to see available stock"
                )}
              </div>
            </div>

            <div style={formGroup}>
              <label style={label}>Qty</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                style={input}
                placeholder="0"
                min="0"
                step="0.01"
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
                min="0"
                step="0.01"
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Loading Balance</label>
              <input
                type="number"
                name="loading"
                value={form.loading}
                onChange={handleChange}
                style={input}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Debit (Qty × Rate + Loading)</label>
              <input
                type="text"
                value={debit.toLocaleString()}
                style={inputReadOnly}
                readOnly
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Credit</label>
              <input
                type="number"
                name="credit"
                value={form.credit}
                onChange={handleChange}
                style={input}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Payment Type</label>
              <select
                name="paymentType"
                value={form.paymentType}
                onChange={handleChange}
                style={select}
              >
                <option value="CASH">CASH</option>
                <option value="BANK">BANK-Transfer</option>
                <option value="CHEQUE">Check Payment</option>
              </select>
            </div>
          </div>

          <div style={divider} />

          {/* Conditional payment fields */}
          {form.paymentType === "BANK" && (
            <div style={{ ...formGrid, marginBottom: "14px" }}>
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
            <div style={{ ...formGrid, marginBottom: "14px" }}>
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



            <h1>KYA HAL AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA</h1>

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

          {/* Footer actions */}
          <div style={footerBar}>
            <div style={hint}>
              💡 Stock will be deducted automatically after saving this sale.
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