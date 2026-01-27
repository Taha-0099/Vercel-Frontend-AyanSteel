// src/NewLedgerEntryPage.js
// ✅ UX UPGRADE (design only)
// ✅ Added Payment Type option "---" that SAVES as "---" (no fallback to CASH)
// ✅ NO LOGIC CHANGE in calculations / stock behavior

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";
import Swal from "sweetalert2";

/* ----------------------------- */
/* ✅ UI (Upgraded, clean + modern) */
/* ----------------------------- */

const styles = {
  page: {
    minHeight: "100vh",
    padding: "26px 14px 60px",
    background:
      "radial-gradient(1000px 520px at 12% 12%, #eef3ff 0%, transparent 55%)," +
      "radial-gradient(900px 520px at 88% 18%, #f3f7ff 0%, transparent 55%)," +
      "linear-gradient(180deg, #f7f9ff 0%, #f5f7fb 100%)",
  },
  outerBox: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "18px",
    background: "rgba(255,255,255,0.65)",
    border: "1px solid #e6ebf5",
    borderRadius: "16px",
    boxShadow: "0 14px 36px rgba(16, 24, 40, 0.08)",
    backdropFilter: "blur(8px)",
  },
  headerRow: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: "12px",
    padding: "14px 14px",
    marginBottom: "14px",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid #e8edf7",
    borderRadius: "14px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
  title: {
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "900",
    color: "#0f1f3d",
    lineHeight: 1.12,
  },
  subtitle: {
    marginTop: 6,
    display: "flex",
    gap: 8,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "10.5px",
    fontWeight: 900,
    background: "#eef5ff",
    color: "#1f3b7a",
    border: "1px solid #dbe7ff",
  },
  badgeWarn: {
    background: "#fff7ed",
    borderColor: "#fed7aa",
    color: "#9a3412",
  },
  badgeOk: {
    background: "#eefaf3",
    borderColor: "#bfead3",
    color: "#0f5132",
  },
  button: {
    padding: "9px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.25)",
    cursor: "pointer",
    background: "linear-gradient(135deg, #2f5597 0%, #1f3b7a 50%, #2f5597 100%)",
    color: "#fff",
    fontWeight: 900,
    fontSize: "12px",
    letterSpacing: "0.2px",
    transition: "all .2s ease",
    boxShadow: "0 8px 18px rgba(47, 85, 151, 0.24)",
    userSelect: "none",
  },
  buttonMuted: {
    padding: "9px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.25)",
    cursor: "pointer",
    background: "linear-gradient(135deg, #6c757d 0%, #5a6268 100%)",
    color: "#fff",
    fontWeight: 900,
    fontSize: "12px",
    letterSpacing: "0.2px",
    transition: "all .2s ease",
    boxShadow: "0 8px 18px rgba(108, 117, 125, 0.22)",
    userSelect: "none",
  },
  card: {
    background: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e8edf7",
    boxShadow: "0 10px 22px rgba(16, 24, 40, 0.05)",
    padding: "14px",
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.3px",
    color: "#1f3b7a",
    margin: "4px 0 12px",
    textTransform: "uppercase",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gap: "12px",
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: "11px", fontWeight: 900, color: "#1f3b7a" },
  hint: { fontSize: "10.5px", color: "#6b7280" },
  input: {
    width: "100%",
    padding: "10px 10px",
    borderRadius: "10px",
    border: "1px solid #d9e2f2",
    background: "#fff",
    fontSize: "13px",
    outline: "none",
    transition: "border .15s ease, box-shadow .15s ease",
  },
  inputReadOnly: {
    background: "#f6f8ff",
    border: "1px solid #e8edf7",
    fontWeight: 900,
    color: "#1f3b7a",
  },
  rowActions: {
    marginTop: "14px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  colSpan12: { gridColumn: "span 12" },
  colSpan6: { gridColumn: "span 6" },
  colSpan4: { gridColumn: "span 4" },
  colSpan3: { gridColumn: "span 3" },
  colSpan8: { gridColumn: "span 8" },
};

function formatDateForInput(d) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function NewLedgerEntryPage() {
  const { accountName } = useParams();
  const decodedName = decodeURIComponent(accountName || "");
  const navigate = useNavigate();

  // We keep this page focused on client SALES records,
  // but allow "RETURN" via transactionType.
  const [form, setForm] = useState({
    date: formatDateForInput(new Date()),
    description: "",
    productType: "",
    quantity: "",
    rate: "",
    loading: "",
    credit: "",
    paymentType: "CASH",
    bankName: "",
    chequeNo: "",
    chequeDate: "",
    transactionType: "SALE", // SALE | RETURN | PAYMENT_ONLY
  });

  const [productTypes, setProductTypes] = useState([]);
  const [availableByType, setAvailableByType] = useState({});
  const [stockLoading, setStockLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const qtyNum = useMemo(() => Number(form.quantity) || 0, [form.quantity]);
  const rateNum = useMemo(() => Number(form.rate) || 0, [form.rate]);
  const loadingNum = useMemo(() => Number(form.loading) || 0, [form.loading]);
  const creditNum = useMemo(() => Number(form.credit) || 0, [form.credit]);

  // For SALES logic:
  // debit is the sale cost: qty * rate + loading
  const computedDebit = useMemo(() => {
    if (form.transactionType === "PAYMENT_ONLY") return 0;
    const q = Math.abs(qtyNum);
    return q * rateNum + loadingNum;
  }, [form.transactionType, qtyNum, rateNum, loadingNum]);

  const loadStock = async () => {
    try {
      setStockLoading(true);
      const res = await api.get("/api/stock");
      const list = res.data || [];

      const typesSet = new Set();
      const availableMap = {};

      // Calculate the REMAINING stock for each product type
      // by summing ALL quantity values (which include negative values for sales)
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
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      // keep UX clean: if payment type changes, clear irrelevant fields
      if (name === "paymentType") {
        const p = String(value || "").toUpperCase();
        return {
          ...prev,
          paymentType: value,
          bankName: p === "BANK" ? prev.bankName : "",
          chequeNo: p === "CHEQUE" ? prev.chequeNo : "",
          chequeDate: p === "CHEQUE" ? prev.chequeDate : "",
        };
      }

      // if transactionType becomes PAYMENT_ONLY, disable product/qty/rate/loading (keep your existing logic)
      if (name === "transactionType") {
        const t = value;
        if (t === "PAYMENT_ONLY") {
          return {
            ...prev,
            transactionType: t,
            productType: "",
            quantity: "",
            rate: "",
            loading: "",
          };
        }
      }

      return { ...prev, [name]: value };
    });
  };

  const validate = async () => {
    if (!form.date) {
      await Swal.fire({
        icon: "warning",
        title: "Missing date",
        text: "Please select a date.",
      });
      return false;
    }

    if (form.transactionType !== "PAYMENT_ONLY") {
      if (!form.productType) {
        await Swal.fire({
          icon: "warning",
          title: "Missing product type",
          text: "Please select a product type.",
        });
        return false;
      }

      if (!qtyNum || qtyNum <= 0) {
        await Swal.fire({
          icon: "warning",
          title: "Invalid quantity",
          text: "Please enter a valid quantity greater than 0.",
        });
        return false;
      }

      if (!rateNum || rateNum < 0) {
        await Swal.fire({
          icon: "warning",
          title: "Invalid rate",
          text: "Please enter a valid rate.",
        });
        return false;
      }
    }

    // If SALE, ensure available stock
    if (form.transactionType === "SALE") {
      const available = availableByType[form.productType] || 0;
      if (qtyNum > available) {
        await Swal.fire({
          icon: "error",
          title: "Not enough stock",
          text: `Available ${form.productType}: ${available.toLocaleString()}. You are trying to sell: ${qtyNum.toLocaleString()}.`,
        });
        return false;
      }
    }

    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!(await validate())) return;

    try {
      setSaving(true);

      // 1) Build ledger payload (CLIENT SALES page)
      // We keep ledgerType = SALES to match your ClientLedgerPage filtering.
      const payload = {
        accountName: decodedName,
        ledgerType: "SALES",
        date: form.date,
        description: form.description,
        productType: form.transactionType === "PAYMENT_ONLY" ? "" : form.productType,

        // Store quantity as POSITIVE number in ledger for readability
        // (Your ClientLedgerPage expects positive qty for SALES)
        quantity: form.transactionType === "PAYMENT_ONLY" ? 0 : Math.abs(qtyNum),

        rate: form.transactionType === "PAYMENT_ONLY" ? 0 : rateNum,
        loading: form.transactionType === "PAYMENT_ONLY" ? 0 : loadingNum,

        debit: Number(computedDebit) || 0,
        credit: creditNum,

        // ✅ IMPORTANT FIX: keep "---" as "---" (no auto CASH fallback)
        paymentType: form.paymentType,
        bankName: form.paymentType === "BANK" ? form.bankName : "",
        chequeNo: form.paymentType === "CHEQUE" ? form.chequeNo : "",
        chequeDate: form.paymentType === "CHEQUE" && form.chequeDate ? form.chequeDate : null,
      };

      await api.post("/api/ledger", payload);

      // 2) STOCK EFFECT
      // SALE -> deduct stock (negative quantity)
      // RETURN -> add stock back (positive quantity)
      // PAYMENT_ONLY -> no stock change
      if (form.transactionType !== "PAYMENT_ONLY") {
        const stockQty = form.transactionType === "SALE" ? -Math.abs(qtyNum) : Math.abs(qtyNum);

        await api.post("/api/stock", {
          productType: form.productType,
          status: "AVAILABLE",
          date: form.date,
          quantity: stockQty,
          rate: rateNum,
        });
      }

      await loadStock();

      await Swal.fire({
        icon: "success",
        title: "Record added",
        text:
          form.transactionType === "SALE"
            ? "Sale saved and stock deducted."
            : form.transactionType === "RETURN"
            ? "Return saved and stock added back."
            : "Payment record saved.",
        timer: 1400,
        showConfirmButton: false,
      });

      navigate(`/clients/${encodeURIComponent(decodedName)}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Error saving new ledger record.";
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  const availableForSelected = form.productType ? availableByType[form.productType] || 0 : 0;

  const paymentUpper = String(form.paymentType || "").toUpperCase();
  const bankEnabled = paymentUpper === "BANK";
  const chequeEnabled = paymentUpper === "CHEQUE";

  return (
    <div style={styles.page}>
      <div style={styles.outerBox}>
        <div style={styles.headerRow}>
          <div>
            <button
              style={styles.button}
              onClick={() => navigate(-1)}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
            >
              ⬅ Back
            </button>
          </div>

          <div style={styles.title}>
            New Record — {decodedName}
            <div style={styles.subtitle}>
              <span style={styles.badge}>Sales Entry</span>
              <span style={{ ...styles.badge, ...(stockLoading ? styles.badgeWarn : styles.badgeOk) }}>
                {stockLoading ? "Stock loading..." : "Stock ready"}
              </span>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <button
              style={styles.buttonMuted}
              onClick={() => navigate(`/clients/${encodeURIComponent(decodedName)}`)}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
            >
              ✖ Cancel
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Entry Details</div>

          <form onSubmit={submit}>
            <div style={styles.grid}>
              {/* Transaction Type */}
              <div style={{ ...styles.field, ...styles.colSpan4 }}>
                <label style={styles.label}>Transaction Type *</label>
                <select name="transactionType" value={form.transactionType} onChange={handleChange} style={styles.input}>
                  <option value="SALE">SALE (Deduct Stock)</option>
                  <option value="RETURN">RETURN (Add Stock Back)</option>
                  <option value="PAYMENT_ONLY">PAYMENT ONLY (No Stock)</option>
                </select>
                <div style={styles.hint}>Choose sale/return/payment-only.</div>
              </div>

              {/* Date */}
              <div style={{ ...styles.field, ...styles.colSpan4 }}>
                <label style={styles.label}>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              {/* Payment Type */}
              <div style={{ ...styles.field, ...styles.colSpan4 }}>
                <label style={styles.label}>Payment Type</label>
                <select name="paymentType" value={form.paymentType} onChange={handleChange} style={styles.input}>
                  {/* ✅ NEW: saves as "---" */}
                  <option value="---">---</option>
                  <option value="CASH">CASH</option>
                  <option value="BANK">BANK-Transfer</option>
                  <option value="CHEQUE">Check Payment</option>
                </select>
                <div style={styles.hint}>Select "---" if payment type not decided.</div>
              </div>

              {/* Description */}
              <div style={{ ...styles.field, ...styles.colSpan12 }}>
                <label style={styles.label}>Description</label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Optional note / invoice / remarks..."
                />
              </div>

              {/* Product Type */}
              <div style={{ ...styles.field, ...styles.colSpan6 }}>
                <label style={styles.label}>
                  Product Type {form.transactionType !== "PAYMENT_ONLY" ? "*" : ""}
                </label>
                <select
                  name="productType"
                  value={form.productType}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={form.transactionType === "PAYMENT_ONLY"}
                >
                  <option value="">Select Type</option>
                  {productTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <div style={styles.hint}>
                  {stockLoading
                    ? "Stock loading..."
                    : form.productType
                    ? `Available: ${availableForSelected.toLocaleString()}`
                    : "Select a product type to see available stock."}
                </div>
              </div>

              {/* Quantity */}
              <div style={{ ...styles.field, ...styles.colSpan3 }}>
                <label style={styles.label}>
                  Quantity {form.transactionType !== "PAYMENT_ONLY" ? "*" : ""}
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  style={styles.input}
                  min="0"
                  step="0.01"
                  disabled={form.transactionType === "PAYMENT_ONLY"}
                  placeholder="0"
                />
              </div>

              {/* Rate */}
              <div style={{ ...styles.field, ...styles.colSpan3 }}>
                <label style={styles.label}>Rate {form.transactionType !== "PAYMENT_ONLY" ? "*" : ""}</label>
                <input
                  type="number"
                  name="rate"
                  value={form.rate}
                  onChange={handleChange}
                  style={styles.input}
                  min="0"
                  step="0.01"
                  disabled={form.transactionType === "PAYMENT_ONLY"}
                  placeholder="0"
                />
              </div>

              {/* Loading */}
              <div style={{ ...styles.field, ...styles.colSpan3 }}>
                <label style={styles.label}>Loading</label>
                <input
                  type="number"
                  name="loading"
                  value={form.loading}
                  onChange={handleChange}
                  style={styles.input}
                  min="0"
                  step="0.01"
                  disabled={form.transactionType === "PAYMENT_ONLY"}
                  placeholder="0"
                />
              </div>

              {/* Debit */}
              <div style={{ ...styles.field, ...styles.colSpan3 }}>
                <label style={styles.label}>Debit (Auto)</label>
                <input
                  type="text"
                  value={(Number(computedDebit) || 0).toLocaleString("en-US")}
                  readOnly
                  style={{ ...styles.input, ...styles.inputReadOnly }}
                />
              </div>

              {/* Credit */}
              <div style={{ ...styles.field, ...styles.colSpan3 }}>
                <label style={styles.label}>Credit (Payment Received)</label>
                <input
                  type="number"
                  name="credit"
                  value={form.credit}
                  onChange={handleChange}
                  style={styles.input}
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>

              {/* Bank Name */}
              <div style={{ ...styles.field, ...styles.colSpan4 }}>
                <label style={styles.label}>Bank Name (BANK)</label>
                <input
                  type="text"
                  name="bankName"
                  value={form.bankName}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={!bankEnabled}
                  placeholder="Bank"
                />
              </div>

              {/* Cheque No */}
              <div style={{ ...styles.field, ...styles.colSpan4 }}>
                <label style={styles.label}>Cheque No (CHEQUE)</label>
                <input
                  type="text"
                  name="chequeNo"
                  value={form.chequeNo}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={!chequeEnabled}
                  placeholder="Cheque No"
                />
              </div>

              {/* Cheque Date */}
              <div style={{ ...styles.field, ...styles.colSpan4 }}>
                <label style={styles.label}>Cheque Date (CHEQUE)</label>
                <input
                  type="date"
                  name="chequeDate"
                  value={form.chequeDate}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={!chequeEnabled}
                />
              </div>
            </div>

            <div style={styles.rowActions}>
              <button type="button" style={styles.buttonMuted} onClick={() => navigate(-1)} disabled={saving}>
                Cancel
              </button>

              <button type="submit" style={styles.button} disabled={saving}>
                {saving ? "Saving..." : "Save Record"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NewLedgerEntryPage;
