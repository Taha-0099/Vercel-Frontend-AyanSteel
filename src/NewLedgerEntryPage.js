// src/NewLedgerEntryPage.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";
import Swal from "sweetalert2";

const outerBox = {
  maxWidth: "1100px",
  margin: "20px auto",
  padding: "20px",
  background: "#f5f7fb",
  borderRadius: "8px",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
};

const title = {
  fontSize: "26px",
  fontWeight: "bold",
  textAlign: "center",
  flex: 1,
};

const button = {
  padding: "8px 16px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  background: "#2f5597",
  color: "#fff",
  fontWeight: "600",
  marginLeft: "8px",
};

const card = {
  background: "#fff",
  border: "1px solid #e0e0e0",
  borderRadius: "6px",
  padding: "16px",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const label = {
  display: "block",
  fontSize: "12px",
  marginBottom: "4px",
  color: "#333",
  fontWeight: "600",
};

const input = {
  width: "100%",
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ced4da",
  fontSize: "13px",
  background: "#fff",
};

const select = { ...input };

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
    setForm((prev) => ({ ...prev, [name]: value }));
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

        paymentType: form.paymentType || "CASH",
        bankName: form.paymentType === "BANK" ? form.bankName : "",
        chequeNo: form.paymentType === "CHEQUE" ? form.chequeNo : "",
        chequeDate:
          form.paymentType === "CHEQUE" && form.chequeDate
            ? form.chequeDate
            : null,
      };

      await api.post("/api/ledger", payload);

      // 2) STOCK EFFECT
      // SALE -> deduct stock (negative quantity)
      // RETURN -> add stock back (positive quantity)
      // PAYMENT_ONLY -> no stock change
      if (form.transactionType !== "PAYMENT_ONLY") {
        const stockQty =
          form.transactionType === "SALE"
            ? -Math.abs(qtyNum)
            : Math.abs(qtyNum);

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
      const msg =
        err.response?.data?.message || "Error saving new ledger record.";
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  const availableForSelected =
    form.productType ? availableByType[form.productType] || 0 : 0;

  return (
    <div style={outerBox}>
      <div style={headerRow}>
        <button style={button} onClick={() => navigate(-1)}>
          ⬅ Back
        </button>
        <div style={title}>New Record - {decodedName}</div>
        <div />
      </div>

      <div style={card}>
        <form onSubmit={submit}>
          <div style={grid}>
            <div>
              <label style={label}>Transaction Type *</label>
              <select
                name="transactionType"
                value={form.transactionType}
                onChange={handleChange}
                style={select}
              >
                <option value="SALE">SALE (Deduct Stock)</option>
                <option value="RETURN">RETURN (Add Stock Back)</option>
                <option value="PAYMENT_ONLY">PAYMENT ONLY (No Stock)</option>
              </select>
            </div>

            <div>
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

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={label}>Description</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                style={input}
                placeholder="Optional note"
              />
            </div>

            <div>
              <label style={label}>Product Type {form.transactionType !== "PAYMENT_ONLY" ? "*" : ""}</label>
              <select
                name="productType"
                value={form.productType}
                onChange={handleChange}
                style={select}
                disabled={form.transactionType === "PAYMENT_ONLY"}
              >
                <option value="">Select Type</option>
                {productTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: "11px", marginTop: "3px", color: "#666" }}>
                {stockLoading
                  ? "Stock loading..."
                  : form.productType
                  ? `Available: ${availableForSelected.toLocaleString()}`
                  : ""}
              </div>
            </div>

            <div>
              <label style={label}>Quantity {form.transactionType !== "PAYMENT_ONLY" ? "*" : ""}</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                style={input}
                min="0"
                step="0.01"
                disabled={form.transactionType === "PAYMENT_ONLY"}
              />
            </div>

            <div>
              <label style={label}>Rate {form.transactionType !== "PAYMENT_ONLY" ? "*" : ""}</label>
              <input
                type="number"
                name="rate"
                value={form.rate}
                onChange={handleChange}
                style={input}
                min="0"
                step="0.01"
                disabled={form.transactionType === "PAYMENT_ONLY"}
              />
            </div>

            <div>
              <label style={label}>Loading</label>
              <input
                type="number"
                name="loading"
                value={form.loading}
                onChange={handleChange}
                style={input}
                min="0"
                step="0.01"
                disabled={form.transactionType === "PAYMENT_ONLY"}
              />
            </div>

            <div>
              <label style={label}>Debit (Auto)</label>
              <input
                type="text"
                value={(Number(computedDebit) || 0).toLocaleString("en-US")}
                readOnly
                style={{ ...input, background: "#f1f3f5" }}
              />
            </div>

            <div>
              <label style={label}>Credit (Payment Received)</label>
              <input
                type="number"
                name="credit"
                value={form.credit}
                onChange={handleChange}
                style={input}
                min="0"
                step="0.01"
              />
            </div>

            <div>
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

            <div>
              <label style={label}>Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
                style={input}
                disabled={form.paymentType !== "BANK"}
                placeholder="Bank"
              />
            </div>

            <div>
              <label style={label}>Cheque No</label>
              <input
                type="text"
                name="chequeNo"
                value={form.chequeNo}
                onChange={handleChange}
                style={input}
                disabled={form.paymentType !== "CHEQUE"}
                placeholder="Cheque No"
              />
            </div>

            <div>
              <label style={label}>Cheque Date</label>
              <input
                type="date"
                name="chequeDate"
                value={form.chequeDate}
                onChange={handleChange}
                style={input}
                disabled={form.paymentType !== "CHEQUE"}
              />
            </div>
          </div>

          <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
            <button type="submit" style={button} disabled={saving}>
              {saving ? "Saving..." : "Save Record"}
            </button>
            <button
              type="button"
              style={{ ...button, background: "#6c757d" }}
              onClick={() => navigate(`/clients/${encodeURIComponent(decodedName)}`)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewLedgerEntryPage;