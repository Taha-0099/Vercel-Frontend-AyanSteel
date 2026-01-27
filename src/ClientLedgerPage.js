// src/ClientLedgerPage.js
// ✅ UX IMPROVED (structure + spacing + sticky header + zebra rows + hover + badges)
// ✅ EDIT opens SweetAlert2 popup and SAVES ONCE (fix double-save issue)
// ✅ PDF untouched

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";

/* ----------------------------- */
/* ✅ UI UPGRADE (NO LOGIC CHANGE) */
/* ----------------------------- */

const outerBox = {
  maxWidth: "1250px",
  margin: "24px auto 60px",
  padding: "22px",
  background:
    "radial-gradient(1000px 500px at 10% 10%, #eef3ff 0%, transparent 55%)," +
    "radial-gradient(900px 500px at 90% 20%, #f3f7ff 0%, transparent 55%)," +
    "linear-gradient(180deg, #f7f9ff 0%, #f5f7fb 100%)",
  borderRadius: "16px",
  border: "1px solid #e6ebf5",
  boxShadow: "0 12px 30px rgba(16, 24, 40, 0.08)",
};

const headerRow = {
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  gap: "12px",
  padding: "14px 14px",
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(6px)",
  borderRadius: "14px",
  border: "1px solid #e8edf7",
  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  marginBottom: "14px",
};

const title = {
  fontSize: "26px",
  fontWeight: "900",
  textAlign: "center",
  color: "#0f1f3d",
  letterSpacing: "0.2px",
  padding: "0 8px",
  lineHeight: 1.12,
};

const button = {
  padding: "9px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.25)",
  cursor: "pointer",
  background: "linear-gradient(135deg, #2f5597 0%, #1f3b7a 50%, #2f5597 100%)",
  color: "#fff",
  fontWeight: "800",
  fontSize: "12px",
  letterSpacing: "0.2px",
  transition: "all .2s ease",
  boxShadow: "0 8px 18px rgba(47, 85, 151, 0.24)",
};

const buttonSecondary = {
  ...button,
  background: "linear-gradient(135deg, #6c757d 0%, #5a6268 100%)",
  boxShadow: "0 8px 18px rgba(108, 117, 125, 0.22)",
};

const buttonDanger = {
  ...button,
  background: "linear-gradient(135deg, #dc3545 0%, #b02a37 100%)",
  boxShadow: "0 8px 18px rgba(220, 53, 69, 0.22)",
};

const buttonMuted = {
  ...button,
  background: "linear-gradient(135deg, #8b95a7 0%, #6f7888 100%)",
  boxShadow: "0 8px 18px rgba(111, 120, 136, 0.22)",
};

const topTools = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 12px",
  marginBottom: "12px",
  border: "1px solid #e8edf7",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.88)",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const inputBase = {
  width: "100%",
  minWidth: "90px",
  padding: "9px 10px",
  fontSize: "12px",
  borderRadius: "10px",
  border: "1px solid #d9e2f2",
  outline: "none",
  background: "#ffffff",
  transition: "border .15s ease, box-shadow .15s ease",
};

const badgeInfo = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "10.5px",
  fontWeight: "800",
  background: "#eef5ff",
  color: "#1f3b7a",
  border: "1px solid #dbe7ff",
};

const smallHint = {
  fontSize: "10px",
  color: "#6b7280",
  marginTop: "4px",
};

const manualCard = {
  background: "#ffffff",
  borderRadius: "14px",
  border: "1px solid #e8edf7",
  boxShadow: "0 6px 18px rgba(16, 24, 40, 0.04)",
  padding: "14px",
  marginBottom: "14px",
};

const kpiRow = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
  gap: "10px",
  padding: "6px 0 12px",
};

const kpiCard = {
  background: "rgba(255,255,255,0.95)",
  border: "1px solid #e8edf7",
  borderRadius: "14px",
  padding: "12px",
  boxShadow: "0 6px 16px rgba(16, 24, 40, 0.05)",
};

const kpiLabel = { fontSize: "11px", color: "#64748b", fontWeight: 900 };
const kpiValue = { fontSize: "18px", color: "#0f1f3d", fontWeight: 900, marginTop: 6 };

const tableWrap = {
  background: "#fff",
  borderRadius: "14px",
  border: "1px solid #e8edf7",
  overflow: "hidden",
  boxShadow: "0 10px 22px rgba(16, 24, 40, 0.05)",
};

const table = { width: "100%", borderCollapse: "separate", borderSpacing: "0" };

const thtd = {
  borderBottom: "1px solid #edf1f7",
  padding: "11px 10px",
  fontSize: "12px",
  textAlign: "center",
  color: "#111827",
  whiteSpace: "nowrap",
};

const headerCell = {
  ...thtd,
  position: "sticky",
  top: 0,
  zIndex: 5,
  background: "#f2f6ff",
  fontWeight: "900",
  color: "#1f3b7a",
  textTransform: "uppercase",
  fontSize: "10.5px",
  letterSpacing: "0.55px",
  borderBottom: "1px solid #dde6f6",
};

/* ----------------------------- */
/* ✅ LOGIC HELPERS */
/* ----------------------------- */

function computeClosing(entries) {
  let balance = 0;
  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));

  return sorted.map((e, index) => {
    const debit = Number(e.debit) || 0;
    const credit = Number(e.credit) || 0;

    if (index === 0 && (e.description === "B/F" || e.description === "Opening Balance")) {
      balance = credit - debit;
    } else {
      balance += credit - debit;
    }

    return { ...e, closingBalance: balance };
  });
}

function formatDateForDisplay(d) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function formatDateForInput(d) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function dateKey(d) {
  return formatDateForInput(d);
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* ✅ NEW: robust number parsing (handles "3,318") */
function n(v) {
  const x = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(x) ? x : 0;
}

/* ✅ NEW: pick first valid numeric field */
function pickNum(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return n(v);
    }
  }
  return null;
}

const clamp0 = (v) => (v < 0 ? 0 : v);

/* ----------------------------- */
/* ✅ COMPONENT */
/* ----------------------------- */

function ClientLedgerPage() {
  const { accountName } = useParams();
  const decodedName = decodeURIComponent(accountName);
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [productTypes, setProductTypes] = useState([]);
  const [availableByType, setAvailableByType] = useState({});
  const [stockLoading, setStockLoading] = useState(false);

  // ✅ Manual debit (old sell)
  const [showManualDebit, setShowManualDebit] = useState(false);
  const [manualForm, setManualForm] = useState({
    date: formatDateForInput(new Date()),
    description: "",
    debit: "",
  });

  // ✅ Search
  const [search, setSearch] = useState("");

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/ledger", {
        params: {
          accountName: decodedName,
          ledgerType: "SALES",
          from: "1900-01-01",
          to: "2100-12-31",
        },
      });

      setEntries(computeClosing(res.data || []));
    } catch (err) {
      console.error(err);
      setError("Error loading ledger entries.");
    } finally {
      setLoading(false);
    }
  };



















  /* ✅ FIXED: Available qty SAME as NewLedgerEntryPage (sum all stock.quantity incl negatives) */
const loadStock = async () => {
  try {
    setStockLoading(true);
    const res = await api.get("/api/stock");
    const list = res.data || [];

    const typesSet = new Set();
    const availableMap = {};

    list.forEach((s) => {
      const type = (s.productType || "").trim();
      if (!type) return;

      typesSet.add(type);

      // IMPORTANT: stock.quantity can be + (purchase/return) OR - (sale)
      const q = n(s.quantity); // uses your comma-safe parser
      availableMap[type] = (availableMap[type] || 0) + q;
    });

    // Never show negative available in UI
    Object.keys(availableMap).forEach((t) => {
      availableMap[t] = clamp0(availableMap[t]);
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
    loadEntries();
    loadStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedName]);

  const handleDelete = async (id) => {
    const res = await Swal.fire({
      title: "Delete this entry?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });
    if (!res.isConfirmed) return;

    try {
      await api.delete(`/api/ledger/${id}`);
      await loadEntries();
      await loadStock();
      Swal.fire({ icon: "success", title: "Deleted", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Error deleting entry." });
    }
  };

  /* ----------------------------- */
  /* ✅ EDIT SAVE (FIXED: saves once) */
  /* ----------------------------- */

  const createStockAdjustment = async (adj, ctx) => {
    const q = Number(adj?.quantity) || 0;
    const pType = adj?.productType;
    if (!pType || q === 0) return;

    return api.post("/api/stock", {
      productType: pType,
      status: "AVAILABLE",

      date: ctx.date,
      purchaseDate: ctx.date,

      quantity: q,
      remainingQuantity: q,

      rate: ctx.rate,
      purchaseRate: ctx.rate,

      supplierName: "AUTO-ADJUST",
      supplierInvoiceNo: "",
      transportCompany: "",
      vehicleNumber: "",
      warehouseLocation: "",
      loadingCharges: 0,
      unloadingCharges: 0,
      transportCharges: 0,
      otherCharges: 0,
      otherChargesDescription: "",
      expectedArrivalDate: "",
      notes: `Auto adjustment from SALES edit for ${decodedName}`,
    });
  };

  const saveEditDirect = async (entryId, oldQty, oldType, values) => {
    try {
      if (!entryId) return;

      const qtyNumLocal = Number(values.quantity) || 0;
      const rateNumLocal = Number(values.rate) || 0;
      const loadingNumLocal = Number(values.loading) || 0;
      const editDebitLocal = qtyNumLocal * rateNumLocal + loadingNumLocal;

      const newType = (values.productType || "").trim();
      const prevType = (oldType || newType || "").trim();

      const stockAdjustments = [];
      const isStockRelatedEdit =
        !!newType || !!prevType || (Number(oldQty) || 0) !== 0 || qtyNumLocal !== 0;

      if (isStockRelatedEdit) {
        if (newType === prevType) {
          const availableForType = newType && availableByType[newType] ? availableByType[newType] : 0;
          const deltaQty = qtyNumLocal - (Number(oldQty) || 0);

          if (deltaQty > 0 && deltaQty > availableForType) {
            await Swal.fire({
              icon: "warning",
              title: "Not enough stock",
              text: `Type: ${newType} | Available: ${availableForType} | Extra needed: ${deltaQty}`,
            });
            return;
          }

          if (deltaQty !== 0 && newType) {
            stockAdjustments.push({ productType: newType, quantity: -deltaQty });
          }
        } else {
          if (prevType && (Number(oldQty) || 0)) {
            stockAdjustments.push({ productType: prevType, quantity: Number(oldQty) || 0 });
          }

          if (newType) {
            const availableForNew = availableByType[newType] ? availableByType[newType] : 0;

            if (qtyNumLocal > 0 && qtyNumLocal > availableForNew) {
              await Swal.fire({
                icon: "warning",
                title: "Not enough stock",
                text: `Type: ${newType} | Available: ${availableForNew} | Trying to sell: ${qtyNumLocal}`,
              });
              return;
            }

            if (qtyNumLocal !== 0) {
              stockAdjustments.push({ productType: newType, quantity: -qtyNumLocal });
            }
          }
        }
      }

      const payload = {
        accountName: decodedName,
        ledgerType: "SALES",
        date: values.date,
        description: values.description,
        productType: newType,
        quantity: qtyNumLocal,
        rate: rateNumLocal,
        loading: loadingNumLocal,
        debit: editDebitLocal,
        credit: Number(values.credit) || 0,
        paymentType: values.paymentType || "CASH",
        bankName: values.paymentType === "BANK" ? values.bankName : "",
        chequeNo: values.paymentType === "CHEQUE" ? values.chequeNo : "",
        chequeDate: values.paymentType === "CHEQUE" && values.chequeDate ? values.chequeDate : null,
      };

      await api.put(`/api/ledger/${entryId}`, payload);

      if (stockAdjustments.length > 0) {
        await Promise.all(
          stockAdjustments.map((adj) =>
            createStockAdjustment(adj, { date: values.date, rate: rateNumLocal })
          )
        );
      }

      await loadEntries();
      await loadStock();

      Swal.fire({ icon: "success", title: "Updated", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Error updating entry." });
    }
  };

  const openEditPopup = async (entry) => {
    const entryId = entry._id || entry.id;
    const oldQty = Number(entry.qty ?? entry.quantity ?? 0) || 0;
    const oldType = entry.productType || "";

    const html = `
      <div style="text-align:left">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label style="font-size:11px;font-weight:900;color:#1f3b7a">Date</label>
            <input id="sw_date" type="date" value="${formatDateForInput(entry.date) || ""}"
              style="width:100%;padding:10px;border:1px solid #d9e2f2;border-radius:10px;outline:none" />
          </div>
          <div>
            <label style="font-size:11px;font-weight:900;color:#1f3b7a">Payment Type</label>
            <select id="sw_payment" style="width:100%;padding:10px;border:1px solid #d9e2f2;border-radius:10px;outline:none">
              <option value="CASH" ${(entry.paymentType || "CASH") === "CASH" ? "selected" : ""}>CASH</option>
              <option value="BANK" ${entry.paymentType === "BANK" ? "selected" : ""}>BANK-Transfer</option>
              <option value="CHEQUE" ${entry.paymentType === "CHEQUE" ? "selected" : ""}>Check Payment</option>
              <option value="--" ${entry.paymentType === "--" ? "selected" : ""}>---</option>
            </select>
          </div>
        </div>

        <div style="margin-top:10px">
          <label style="font-size:11px;font-weight:900;color:#1f3b7a">Description</label>
          <input id="sw_desc" type="text" value="${(entry.description || "").replace(/"/g, "&quot;")}"
            style="width:100%;padding:10px;border:1px solid #d9e2f2;border-radius:10px;outline:none" />
        </div>

        <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:10px;margin-top:10px">
          <div>
            <label style="font-size:11px;font-weight:900;color:#1f3b7a">Product Type</label>
            <select id="sw_type" style="width:100%;padding:10px;border:1px solid #d9e2f2;border-radius:10px;outline:none">
              <option value="">Select Type</option>
              ${productTypes
                .map(
                  (t) =>
                    `<option value="${t}" ${t === (entry.productType || "") ? "selected" : ""}>${t}</option>`
                )
                .join("")}
            </select>
            <div id="sw_stock_hint" style="margin-top:6px;font-size:10px;color:#6b7280"></div>
          </div>

          <div>
            <label style="font-size:11px;font-weight:900;color:#1f3b7a">Quantity</label>
            <input id="sw_qty" type="number" value="${oldQty}"
              style="width:100%;padding:10px;border:1px solid #d9e2f2;border-radius:10px;outline:none" />
          </div>

          <div>
            <label style="font-size:11px;font-weight:900;color:#1f3b7a">Rate</label>
            <input id="sw_rate" type="number" value="${Number(entry.rate || 0) || 0}"
              style="width:100%;padding:10px;border:1px solid #d9e2f2;border-radius:10px;outline:none" />
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px">
          <div>
            <label style="font-size:11px;font-weight:900;color:#1f3b7a">Loading</label>
            <input id="sw_loading" type="number" value="${Number(entry.loading || 0) || 0}"
              style="width:100%;padding:10px;border:1px solid #d9e2f2;border-radius:10px;outline:none" />
          </div>
          <div>
            <label style="font-size:11px;font-weight:900;color:#1f3b7a">Credit</label>
            <input id="sw_credit" type="number" value="${Number(entry.credit || 0) || 0}"
              style="width:100%;padding:10px;border:1px solid #d9e2f2;border-radius:10px;outline:none" />
          </div>
          <div>
            <label style="font-size:11px;font-weight:900;color:#1f3b7a">Debit (Auto)</label>
            <input id="sw_debit" type="text"
              value="${oldQty * (Number(entry.rate || 0) || 0) + (Number(entry.loading || 0) || 0)}"
              readonly
              style="width:100%;padding:10px;border:1px solid #e8edf7;border-radius:10px;outline:none;background:#f6f8ff;font-weight:900;color:#1f3b7a" />
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
          <div>
            <label style="font-size:11px;font-weight:900;color:#1f3b7a">Bank (BANK)</label>
            <input id="sw_bank" type="text" value="${(entry.bankName || "").replace(/"/g, "&quot;")}"
              style="width:100%;padding:10px;border:1px solid #d9e2f2;border-radius:10px;outline:none" />
          </div>
          <div>
            <label style="font-size:11px;font-weight:900;color:#1f3b7a">Cheque No (CHEQUE)</label>
            <input id="sw_cheque" type="text" value="${(entry.chequeNo || "").replace(/"/g, "&quot;")}"
              style="width:100%;padding:10px;border:1px solid #d9e2f2;border-radius:10px;outline:none" />
          </div>
          <div>
            <label style="font-size:11px;font-weight:900;color:#1f3b7a">Cheque Date (CHEQUE)</label>
            <input id="sw_chequeDate" type="date" value="${entry.chequeDate ? formatDateForInput(entry.chequeDate) : ""}"
              style="width:100%;padding:10px;border:1px solid #d9e2f2;border-radius:10px;outline:none" />
          </div>
        </div>
      </div>
    `;

    const res = await Swal.fire({
      title: "Edit Entry",
      html,
      width: 900,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      didOpen: () => {
        const $ = (id) => document.getElementById(id);

        const typeEl = $("sw_type");
        const qtyEl = $("sw_qty");
        const rateEl = $("sw_rate");
        const loadingEl = $("sw_loading");
        const debitEl = $("sw_debit");
        const stockHintEl = $("sw_stock_hint");

        const paymentEl = $("sw_payment");
        const bankEl = $("sw_bank");
        const chequeEl = $("sw_cheque");
        const chequeDateEl = $("sw_chequeDate");

        const refreshDebit = () => {
          const q = Number(qtyEl.value) || 0;
          const r = Number(rateEl.value) || 0;
          const l = Number(loadingEl.value) || 0;
          debitEl.value = (q * r + l).toLocaleString("en-US");
        };

        const refreshStockHint = () => {
          const t = (typeEl.value || "").trim();
          if (!t) {
            stockHintEl.innerHTML = "";
            return;
          }
          const availableForType = availableByType[t] ? availableByType[t] : 0;
          stockHintEl.innerHTML = stockLoading
            ? "Stock loading..."
            : `Available: <b>${Number(availableForType).toLocaleString("en-US")}</b>`;
        };

        const refreshPaymentFields = () => {
          const p = (paymentEl.value || "CASH").toUpperCase();

          if (p === "BANK") {
            bankEl.disabled = false;
            chequeEl.disabled = true;
            chequeDateEl.disabled = true;
          } else if (p === "CHEQUE") {
            bankEl.disabled = true;
            chequeEl.disabled = false;
            chequeDateEl.disabled = false;
          } else {
            bankEl.disabled = true;
            chequeEl.disabled = true;
            chequeDateEl.disabled = true;
          }

          if (p !== "BANK") bankEl.value = "";
          if (p !== "CHEQUE") {
            chequeEl.value = "";
            chequeDateEl.value = "";
          }
        };

        [qtyEl, rateEl, loadingEl].forEach((el) => el.addEventListener("input", refreshDebit));
        typeEl.addEventListener("change", refreshStockHint);
        paymentEl.addEventListener("change", refreshPaymentFields);

        refreshDebit();
        refreshStockHint();
        refreshPaymentFields();
      },
      preConfirm: () => {
        const $ = (id) => document.getElementById(id);

        const date = $("sw_date").value;
        const description = ($("sw_desc").value || "").trim();
        const productType = ($("sw_type").value || "").trim();
        const quantity = Number($("sw_qty").value) || 0;
        const rate = Number($("sw_rate").value) || 0;
        const loading = Number($("sw_loading").value) || 0;
        const credit = Number($("sw_credit").value) || 0;
        const paymentType = ($("sw_payment").value || "CASH").toUpperCase();
        const bankName = ($("sw_bank").value || "").trim();
        const chequeNo = ($("sw_cheque").value || "").trim();
        const chequeDate = $("sw_chequeDate").value || "";

        if (!date) {
          Swal.showValidationMessage("Please select date.");
          return;
        }
        if (!description) {
          Swal.showValidationMessage("Please enter description.");
          return;
        }
        if (quantity < 0 || rate < 0 || loading < 0 || credit < 0) {
          Swal.showValidationMessage("Quantity/Rate/Loading/Credit cannot be negative.");
          return;
        }

        // ✅ stock validation (local oldQty/oldType)
        const newType = productType;
        const prevType = oldType || newType;
        const deltaQty = quantity - oldQty;

        if (newType === prevType) {
          const availableForType = newType && availableByType[newType] ? availableByType[newType] : 0;
          if (deltaQty > 0 && deltaQty > availableForType) {
            Swal.showValidationMessage(
              `Not enough available stock for ${newType}. Available: ${availableForType}, trying to sell extra: ${deltaQty}`
            );
            return;
          }
        } else {
          if (newType) {
            const availableForNew = availableByType[newType] ? availableByType[newType] : 0;
            if (quantity > 0 && quantity > availableForNew) {
              Swal.showValidationMessage(
                `Not enough available stock for ${newType}. Available: ${availableForNew}, trying to sell: ${quantity}`
              );
              return;
            }
          }
        }

        const debit = quantity * rate + loading;

        return {
          date,
          description,
          productType,
          quantity,
          rate,
          loading,
          debit,
          credit,
          paymentType,
          bankName: paymentType === "BANK" ? bankName : "",
          chequeNo: paymentType === "CHEQUE" ? chequeNo : "",
          chequeDate: paymentType === "CHEQUE" && chequeDate ? chequeDate : null,
        };
      },
    });

    if (!res.isConfirmed || !res.value) return;

    // ✅ Save ONCE (direct)
    await saveEditDirect(entryId, oldQty, oldType, res.value);
  };

  /* ----------------------------- */
  /* ✅ Manual debit save */
  /* ----------------------------- */

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveManualDebit = async () => {
    try {
      const d = manualForm.date;
      const desc = (manualForm.description || "").trim();
      const debitVal = Number(manualForm.debit) || 0;

      if (!d) return Swal.fire({ icon: "warning", title: "Select date" });
      if (!desc) return Swal.fire({ icon: "warning", title: "Enter description" });
      if (debitVal <= 0) return Swal.fire({ icon: "warning", title: "Enter valid debit" });

      await api.post("/api/ledger", {
        accountName: decodedName,
        ledgerType: "SALES",
        date: d,
        description: desc,
        productType: "",
        quantity: 0,
        rate: 0,
        loading: 0,
        debit: debitVal,
        credit: 0,
        paymentType: "",
        bankName: "",
        chequeNo: "",
        chequeDate: null,
      });

      setManualForm({
        date: formatDateForInput(new Date()),
        description: "",
        debit: "",
      });
      setShowManualDebit(false);

      await loadEntries();
      await loadStock();

      Swal.fire({ icon: "success", title: "Saved", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Error saving manual debit entry." });
    }
  };

  /* ----------------------------- */
  /* ✅ PDF HELPERS (UNCHANGED) */
  /* ----------------------------- */

  const lastDateKeyMemo = useMemo(() => {
    if (!entries || entries.length === 0) return "";
    let max = null;
    for (const e of entries) {
      const d = new Date(e.date);
      if (!Number.isNaN(d.getTime())) {
        if (!max || d.getTime() > max.getTime()) max = d;
      }
    }
    return max ? dateKey(max) : "";
  }, [entries]);

  const entriesLastDate = useMemo(() => {
    if (!lastDateKeyMemo) return [];
    return entries.filter((e) => dateKey(e.date) === lastDateKeyMemo);
  }, [entries, lastDateKeyMemo]);

  const getFittingColumnWidths = (availableWidth) => {
    const desired = [58, 150, 58, 34, 38, 46, 54, 54, 52, 52, 52, 52, 60];
    const sum = desired.reduce((a, b) => a + b, 0);
    const scale = sum > availableWidth ? availableWidth / sum : 1;

    let scaled = desired.map((w) => Math.max(28, Math.floor(w * scale)));
    const scaledSum = scaled.reduce((a, b) => a + b, 0);
    const leftover = Math.floor(availableWidth - scaledSum);
    if (leftover > 0) scaled[1] += leftover;

    return scaled;
  };

  const makeLedgerPdf = ({
    rows,
    reportTitle = "CLIENT LEDGER STATEMENT",
    reportTag = "FULL LEDGER",
    fileSuffix = "FULL",
  }) => {
    if (!rows || rows.length === 0) {
      alert("No entries to export.");
      return;
    }

    const doc = new jsPDF("l", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margins = { left: 18, right: 18, bottom: 48, top: 0 };
    const availableW = pageWidth - margins.left - margins.right;
    const W = getFittingColumnWidths(availableW);

    doc.setFillColor(247, 250, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setFillColor(31, 59, 122);
    doc.rect(0, 0, pageWidth, 78, "F");

    doc.setFillColor(85, 132, 255);
    doc.rect(0, 78, pageWidth, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("AYAN STEEL", 30, 38);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("We Deal in All Kind Of CRC, EG, GP HRC Color Coils Steel Sheets", 30, 56);

    doc.setFontSize(9.2);
    doc.text(
      "Arslan Iftikhar: 03229848888 | Atif Iftikhar: 03214097588 | Salman Iftikhar: 03244905087 | Numan Iftikhar: 03224100022",
      30,
      68
    );

    const badgeText = reportTag || "FULL LEDGER";
    const badgeW = Math.min(240, 9.2 * badgeText.length + 34);
    const badgeH = 22;
    const badgeX = pageWidth - 30 - badgeW;
    const badgeY = (78 - badgeH) / 2;

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 10, 10, "FD");

    doc.setTextColor(31, 59, 122);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(badgeText, badgeX + badgeW / 2, badgeY + 15, { align: "center" });

    doc.setTextColor(31, 59, 122);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, pageWidth / 2, 112, { align: "center" });

    const pillText = `Account: ${decodedName}`;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 59, 122);
    doc.setFillColor(235, 242, 255);
    doc.setDrawColor(210, 224, 255);
    doc.roundedRect(pageWidth / 2 - 210, 122, 420, 30, 10, 10, "FD");
    doc.text(pillText, pageWidth / 2, 142, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(95, 105, 120);
    const currentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    let rangeLine = `Generated on: ${currentDate}`;
    const uniqueKeys = Array.from(new Set(rows.map((r) => dateKey(r.date)).filter(Boolean)));
    if (uniqueKeys.length === 1) rangeLine += `  |  Date: ${uniqueKeys[0]}`;
    doc.text(rangeLine, pageWidth / 2, 165, { align: "center" });

    const body = rows.map((e) => [
      formatDateForDisplay(e.date),
      e.description || "",
      e.productType || "",
      String(e.qty ?? e.quantity ?? ""),
      String(e.rate ?? ""),
      String(e.loading ?? ""),
      e.debit ? Number(e.debit).toLocaleString("en-US") : "",
      e.credit ? Number(e.credit).toLocaleString("en-US") : "",
      e.paymentType || "",
      e.bankName || "",
      e.chequeNo || "",
      formatDateForDisplay(e.chequeDate),
      typeof e.closingBalance === "number" ? Number(e.closingBalance).toLocaleString("en-US") : "",
    ]);

    autoTable(doc, {
      startY: 180,
      tableWidth: availableW,
      margin: { left: margins.left, right: margins.right, bottom: margins.bottom, top: margins.top },
      head: [["Date", "Description", "Type", "Qty", "Rate", "Loading", "Debit", "Credit", "Pay", "Bank", "Chq#", "Chq Dt", "Balance"]],
      body,
      theme: "grid",
      styles: {
        fontSize: 7.2,
        cellPadding: 3,
        overflow: "ellipsize",
        cellWidth: "wrap",
        lineColor: [220, 228, 242],
        lineWidth: 0.6,
        textColor: [20, 24, 32],
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [31, 59, 122],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.2,
        halign: "center",
        valign: "middle",
        cellPadding: 4,
      },
      alternateRowStyles: { fillColor: [248, 250, 255] },
      columnStyles: {
        0: { cellWidth: W[0], halign: "center" },
        1: { cellWidth: W[1], halign: "left" },
        2: { cellWidth: W[2], halign: "center" },
        3: { cellWidth: W[3], halign: "center" },
        4: { cellWidth: W[4], halign: "center" },
        5: { cellWidth: W[5], halign: "center" },
        6: { cellWidth: W[6], halign: "center" },
        7: { cellWidth: W[7], halign: "center" },
        8: { cellWidth: W[8], halign: "center" },
        9: { cellWidth: W[9], halign: "center" },
        10: { cellWidth: W[10], halign: "center" },
        11: { cellWidth: W[11], halign: "center" },
        12: { cellWidth: W[12], halign: "center", fontStyle: "bold" },
      },
      didDrawPage: function () {
        doc.setDrawColor(210, 220, 235);
        doc.setLineWidth(0.8);
        doc.line(18, pageHeight - 30, pageWidth - 18, pageHeight - 30);

        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

        doc.setFontSize(8);
        doc.setTextColor(110, 120, 135);
        doc.setFont("helvetica", "normal");
        doc.text("AYAN STEEL - Confidential Document", 18, pageHeight - 14);
        doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth - 18, pageHeight - 14, { align: "right" });
      },
    });

    const totalDebit = rows.reduce((s, e) => s + safeNum(e.debit), 0);
    const totalCredit = rows.reduce((s, e) => s + safeNum(e.credit), 0);
    const totalQty = rows.reduce((s, e) => s + safeNum(e.qty ?? e.quantity), 0);

    const lastRow = rows[rows.length - 1];
    const lastClosing =
      lastRow && typeof lastRow.closingBalance === "number"
        ? safeNum(lastRow.closingBalance)
        : totalCredit - totalDebit;

    const lastY = doc.lastAutoTable?.finalY ?? 180;

    const boxW = 260;
    const boxH = 110;
    const marginRight = 22;

    let boxX = pageWidth - marginRight - boxW;
    let boxY = lastY + 16;

    const maxY = pageHeight - boxH - 44;
    if (boxY > maxY) boxY = maxY;

    doc.setDrawColor(210, 224, 255);
    doc.setLineWidth(1);
    doc.setFillColor(235, 242, 255);
    doc.roundedRect(boxX, boxY, boxW, boxH, 10, 10, "FD");

    doc.setFillColor(31, 59, 122);
    doc.roundedRect(boxX, boxY, boxW, 28, 10, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("SUMMARY", boxX + 14, boxY + 19);

    const labelX = boxX + 14;
    const valueX = boxX + boxW - 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(45, 55, 70);

    doc.text("Total Qty:", labelX, boxY + 48);
    doc.text(Number(totalQty || 0).toLocaleString("en-US"), valueX, boxY + 48, { align: "right" });

    doc.text("Total Debit:", labelX, boxY + 68);
    doc.text(totalDebit.toLocaleString("en-US"), valueX, boxY + 68, { align: "right" });

    doc.text("Total Credit:", labelX, boxY + 88);
    doc.text(totalCredit.toLocaleString("en-US"), valueX, boxY + 88, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 59, 122);
    doc.text("Closing Balance:", labelX, boxY + 108);
    doc.text(Number(lastClosing || 0).toLocaleString("en-US"), valueX, boxY + 108, { align: "right" });

    const fileName = `AYAN_STEEL_Ledger_${decodedName.replace(/\s+/g, "_")}_${fileSuffix}_${new Date()
      .toISOString()
      .split("T")[0]}.pdf`;
    doc.save(fileName);
  };

  const handleWhatsAppPdf = () => {
    makeLedgerPdf({
      rows: entries,
      reportTitle: "CLIENT LEDGER STATEMENT",
      reportTag: "FULL LEDGER",
      fileSuffix: "FULL",
    });
  };

  const handleLastDatePdf = () => {
    if (!entriesLastDate || entriesLastDate.length === 0) {
      alert("No entries found for last date.");
      return;
    }
    makeLedgerPdf({
      rows: entriesLastDate,
      reportTitle: "CLIENT LEDGER STATEMENT",
      reportTag: `LAST DATE (${lastDateKeyMemo || "—"})`,
      fileSuffix: `LAST_DATE_${(lastDateKeyMemo || "NA").replaceAll("-", "")}`,
    });
  };

  /* ----------------------------- */
  /* ✅ FILTER + KPI */
  /* ----------------------------- */

  const filteredEntries = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const s = `${formatDateForDisplay(e.date)} ${e.description || ""} ${e.productType || ""} ${
        e.paymentType || ""
      } ${e.bankName || ""} ${e.chequeNo || ""}`.toLowerCase();
      return s.includes(q);
    });
  }, [entries, search]);

  const kpis = useMemo(() => {
    const totalDebit = filteredEntries.reduce((s, e) => s + safeNum(e.debit), 0);
    const totalCredit = filteredEntries.reduce((s, e) => s + safeNum(e.credit), 0);
    const totalQty = filteredEntries.reduce((s, e) => s + safeNum(e.qty ?? e.quantity), 0);
    const last = filteredEntries.length ? filteredEntries[filteredEntries.length - 1] : null;
    const bal =
      last && typeof last.closingBalance === "number" ? safeNum(last.closingBalance) : totalCredit - totalDebit;
    return { totalDebit, totalCredit, totalQty, bal };
  }, [filteredEntries]);

  return (
    <div style={outerBox}>
      <div style={headerRow}>
        <div>
          <button
            style={button}
            onClick={() => navigate(-1)}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
          >
            ⬅ Back
          </button>
        </div>

        <div style={title}>
          {decodedName}
          <div style={{ marginTop: "6px" }}>
            <span style={badgeInfo}>Sales Ledger</span>
            {lastDateKeyMemo ? (
              <span
                style={{
                  ...badgeInfo,
                  marginLeft: 8,
                  background: "#f7f0ff",
                  borderColor: "#ead8ff",
                  color: "#5a2ea6",
                }}
              >
                Last Date: {lastDateKeyMemo}
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button style={buttonSecondary} onClick={handleLastDatePdf} disabled={!lastDateKeyMemo}>
            ⬇ Last Date PDF
          </button>

          <button
            style={buttonSecondary}
            onClick={() => setShowManualDebit((p) => !p)}
            title="Add old sell debit without stock"
          >
            + Old Sell Debit
          </button>

          <button style={button} onClick={() => navigate(`/clients/${encodeURIComponent(decodedName)}/new-entry`)}>
            + New Record
          </button>
        </div>
      </div>

      <div style={topTools}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, color: "#1f3b7a", fontSize: 12 }}>
            Records: {filteredEntries.length.toLocaleString("en-US")}
          </div>
          {stockLoading ? (
            <span style={{ ...badgeInfo, background: "#fff7ed", borderColor: "#fed7aa", color: "#9a3412" }}>
              Stock syncing...
            </span>
          ) : (
            <span style={{ ...badgeInfo, background: "#eefaf3", borderColor: "#bfead3", color: "#0f5132" }}>
              Stock ready
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            style={{ ...inputBase, minWidth: 300 }}
            placeholder="Search date / description / type / payment / bank / cheque…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button style={buttonMuted} onClick={() => setSearch("")}>
            Clear
          </button>
        </div>
      </div>

      <div style={kpiRow}>
        <div style={kpiCard}>
          <div style={kpiLabel}>Total Qty (Filtered)</div>
          <div style={kpiValue}>{kpis.totalQty.toLocaleString("en-US")}</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiLabel}>Total Debit (Filtered)</div>
          <div style={kpiValue}>{kpis.totalDebit.toLocaleString("en-US")}</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiLabel}>Total Credit (Filtered)</div>
          <div style={kpiValue}>{kpis.totalCredit.toLocaleString("en-US")}</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiLabel}>Closing Balance (Filtered)</div>
          <div style={{ ...kpiValue, color: "#1f3b7a" }}>{kpis.bal.toLocaleString("en-US")}</div>
        </div>
      </div>

      {showManualDebit && (
        <div style={manualCard}>
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 160px auto", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: "900", color: "#1f3b7a", marginBottom: 6 }}>Date</div>
              <input style={inputBase} type="date" name="date" value={manualForm.date} onChange={handleManualChange} />
            </div>

            <div>
              <div style={{ fontSize: "11px", fontWeight: "900", color: "#1f3b7a", marginBottom: 6 }}>
                Description (Old Sell)
              </div>
              <input
                style={{ ...inputBase, minWidth: "220px" }}
                type="text"
                name="description"
                placeholder="e.g. Old sell (manual) / invoice ref..."
                value={manualForm.description}
                onChange={handleManualChange}
              />
              <div style={smallHint}>No stock will be deducted. Only Debit will be added in closing balance.</div>
            </div>

            <div>
              <div style={{ fontSize: "11px", fontWeight: "900", color: "#1f3b7a", marginBottom: 6 }}>Debit Amount</div>
              <input
                style={inputBase}
                type="number"
                name="debit"
                placeholder="0"
                value={manualForm.debit}
                onChange={handleManualChange}
              />
            </div>

            <div style={{ display: "flex", alignItems: "end", gap: "8px" }}>
              <button style={button} onClick={saveManualDebit}>
                Save
              </button>
              <button
                style={buttonMuted}
                onClick={() => {
                  setShowManualDebit(false);
                  setManualForm({ date: formatDateForInput(new Date()), description: "", debit: "" });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p style={{ margin: "10px 4px" }}>Loading...</p>}
      {error && <p style={{ color: "#c0392b", margin: "10px 4px" }}>{error}</p>}

      <div style={tableWrap}>
        <div style={{ overflowX: "auto", maxHeight: "70vh", overflowY: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={headerCell}>Date</th>
                <th style={headerCell}>Description</th>
                <th style={headerCell}>Type</th>
                <th style={headerCell}>Quantity</th>
                <th style={headerCell}>Rate</th>
                <th style={headerCell}>Loading</th>
                <th style={headerCell}>Debit</th>
                <th style={headerCell}>Credit</th>
                <th style={headerCell}>Payment Type</th>
                <th style={headerCell}>Bank</th>
                <th style={headerCell}>Cheque No</th>
                <th style={headerCell}>Cheque Date</th>
                <th style={headerCell}>Closing Balance</th>
                <th style={headerCell}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEntries.map((e, idx) => {
                const entryId = e._id || e.id;
                const even = idx % 2 === 0;

                return (
                  <tr
                    key={entryId}
                    style={{ background: even ? "#ffffff" : "#fbfdff", transition: "all .15s ease" }}
                    onMouseEnter={(ev) => (ev.currentTarget.style.background = "#f4f8ff")}
                    onMouseLeave={(ev) => (ev.currentTarget.style.background = even ? "#ffffff" : "#fbfdff")}
                  >
                    <td style={thtd}>{formatDateForDisplay(e.date)}</td>
                    <td style={{ ...thtd, textAlign: "left", maxWidth: "360px", whiteSpace: "normal", lineHeight: 1.25 }}>
                      {e.description}
                    </td>
                    <td style={{ ...thtd, fontWeight: 800, color: e.productType ? "#1f3b7a" : "#64748b" }}>
                      {e.productType || ""}
                    </td>
                    <td style={thtd}>{e.qty ?? e.quantity ?? ""}</td>
                    <td style={thtd}>{e.rate || ""}</td>
                    <td style={thtd}>{e.loading || ""}</td>
                    <td style={{ ...thtd, fontWeight: 900, color: safeNum(e.debit) ? "#b02a37" : "#64748b" }}>
                      {e.debit ? Number(e.debit).toLocaleString("en-US") : ""}
                    </td>
                    <td style={{ ...thtd, fontWeight: 900, color: safeNum(e.credit) ? "#0f5132" : "#64748b" }}>
                      {e.credit ? Number(e.credit).toLocaleString("en-US") : ""}
                    </td>
                    <td style={thtd}>{e.paymentType || "CASH"}</td>
                    <td style={thtd}>{e.bankName || ""}</td>
                    <td style={thtd}>{e.chequeNo || ""}</td>
                    <td style={thtd}>{formatDateForDisplay(e.chequeDate)}</td>
                    <td style={{ ...thtd, fontWeight: "900", color: "#1f3b7a" }}>
                      {typeof e.closingBalance === "number" ? Number(e.closingBalance).toLocaleString("en-US") : ""}
                    </td>
                    <td style={thtd}>
                      <button style={button} onClick={() => openEditPopup(e)}>
                        Edit
                      </button>
                      <button style={{ ...buttonDanger, marginLeft: "6px" }} onClick={() => handleDelete(entryId)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredEntries.length === 0 && !loading && (
                <tr>
                  <td style={thtd} colSpan={14}>
                    No entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ position: "fixed", right: "26px", bottom: "26px", zIndex: 9999, display: "flex", gap: "12px" }}>
        <button
          onClick={handleLastDatePdf}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "linear-gradient(135deg, #6f42c1 0%, #5a2ea6 50%, #6f42c1 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 22px rgba(111, 66, 193, 0.35)",
            cursor: "pointer",
            opacity: lastDateKeyMemo ? 1 : 0.6,
          }}
          title={lastDateKeyMemo ? `Save LAST DATE PDF (${lastDateKeyMemo})` : "Last Date not available"}
          disabled={!lastDateKeyMemo}
        >
          <i className="fa fa-calendar" style={{ fontSize: "22px" }} />
        </button>

        <button
          onClick={handleWhatsAppPdf}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "linear-gradient(135deg, #25D366 0%, #1fb954 50%, #25D366 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 22px rgba(37, 211, 102, 0.35)",
            cursor: "pointer",
          }}
          title="Save FULL ledger PDF"
        >
          <i className="fa fa-whatsapp" style={{ fontSize: "28px" }} />
        </button>
      </div>
    </div>
  );
}

export default ClientLedgerPage;
