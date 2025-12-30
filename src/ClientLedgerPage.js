// src/ClientLedgerPage.js - Updated to allow MANUAL DEBIT (old sell) without stock
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ----------------------------- */
/* ✅ UI UPGRADE (NO LOGIC CHANGE) */
/* ----------------------------- */

const outerBox = {
  maxWidth: "1200px",
  margin: "24px auto 60px",
  padding: "24px",
  background: "linear-gradient(180deg, #f7f9ff 0%, #f5f7fb 100%)",
  borderRadius: "14px",
  border: "1px solid #e6ebf5",
  boxShadow: "0 10px 26px rgba(16, 24, 40, 0.06)",
};

const headerRow = {
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
  fontSize: "28px",
  fontWeight: "800",
  textAlign: "center",
  color: "#0f1f3d",
  letterSpacing: "0.2px",
  padding: "0 8px",
  lineHeight: 1.2,
};

const button = {
  padding: "9px 14px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.25)",
  cursor: "pointer",
  background:
    "linear-gradient(135deg, #2f5597 0%, #1f3b7a 50%, #2f5597 100%)",
  color: "#fff",
  fontWeight: "700",
  fontSize: "12px",
  letterSpacing: "0.2px",
  transition: "all .2s ease",
  boxShadow: "0 6px 14px rgba(47, 85, 151, 0.22)",
};

const buttonSecondary = {
  ...button,
  background: "linear-gradient(135deg, #6c757d 0%, #5a6268 100%)",
  boxShadow: "0 6px 14px rgba(108, 117, 125, 0.22)",
};

const buttonDanger = {
  ...button,
  background: "linear-gradient(135deg, #dc3545 0%, #b02a37 100%)",
  boxShadow: "0 6px 14px rgba(220, 53, 69, 0.22)",
};

const buttonMuted = {
  ...button,
  background: "linear-gradient(135deg, #8b95a7 0%, #6f7888 100%)",
  boxShadow: "0 6px 14px rgba(111, 120, 136, 0.22)",
};

const tableWrap = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e8edf7",
  overflow: "hidden",
  boxShadow: "0 6px 18px rgba(16, 24, 40, 0.04)",
};

const table = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: "0",
};

const thtd = {
  borderBottom: "1px solid #edf1f7",
  padding: "10px 8px",
  fontSize: "12px",
  textAlign: "center",
  color: "#111827",
  whiteSpace: "nowrap",
};

const headerCell = {
  ...thtd,
  background: "#f2f6ff",
  fontWeight: "800",
  color: "#1f3b7a",
  textTransform: "uppercase",
  fontSize: "10.5px",
  letterSpacing: "0.5px",
  borderBottom: "1px solid #dde6f6",
};

const inputBase = {
  width: "100%",
  minWidth: "90px",
  padding: "7px 8px",
  fontSize: "11.5px",
  borderRadius: "6px",
  border: "1px solid #d9e2f2",
  outline: "none",
  background: "#ffffff",
  transition: "border .15s ease, box-shadow .15s ease",
};

const selectBase = {
  ...inputBase,
  cursor: "pointer",
};

const smallHint = {
  fontSize: "10px",
  color: "#6b7280",
  marginTop: "4px",
};

const badgeInfo = {
  display: "inline-block",
  padding: "3px 8px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: "700",
  background: "#eef5ff",
  color: "#1f3b7a",
  border: "1px solid #dbe7ff",
};

const manualCard = {
  background: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e8edf7",
  boxShadow: "0 6px 18px rgba(16, 24, 40, 0.04)",
  padding: "14px",
  marginBottom: "18px",
};

/* ----------------------------- */
/* ✅ LOGIC */
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

function ClientLedgerPage() {
  const { accountName } = useParams();
  const decodedName = decodeURIComponent(accountName);
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    date: "",
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
  });

  const [productTypes, setProductTypes] = useState([]);
  const [availableByType, setAvailableByType] = useState({});
  const [stockLoading, setStockLoading] = useState(false);

  const [originalQty, setOriginalQty] = useState(0);
  const [originalProductType, setOriginalProductType] = useState("");

  // ✅ NEW: Manual debit (old sell) UI + state (no stock selection)
  const [showManualDebit, setShowManualDebit] = useState(false);
  const [manualForm, setManualForm] = useState({
    date: formatDateForInput(new Date()),
    description: "",
    debit: "",
  });

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

      const withClosing = computeClosing(res.data || []);
      setEntries(withClosing);
    } catch (err) {
      console.error(err);
      setError("Error loading ledger entries.");
    } finally {
      setLoading(false);
    }
  };

  const loadStock = async () => {
    try {
      setStockLoading(true);
      const res = await api.get("/api/stock");
      const list = res.data || [];

      const typesSet = new Set();
      const availableMap = {};

      list.forEach((s) => {
        if (s.productType) typesSet.add(s.productType);

        // ✅ Better available calc (supports remainingQuantity)
        if (s.productType && s.status === "AVAILABLE") {
          const q =
            Number(s.remainingQuantity != null ? s.remainingQuantity : s.quantity) || 0;

          availableMap[s.productType] = (availableMap[s.productType] || 0) + q;
        }
      });

      setProductTypes(Array.from(typesSet));
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
  }, [decodedName]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await api.delete(`/api/ledger/${id}`);
      await loadEntries();
      await loadStock();
    } catch (err) {
      console.error(err);
      alert("Error deleting entry.");
    }
  };

  const startEdit = (entry) => {
    const entryId = entry._id || entry.id;
    const q = entry.qty ?? entry.quantity ?? 0;

    setEditingId(entryId);
    setOriginalQty(Number(q) || 0);
    setOriginalProductType(entry.productType || "");

    setEditForm({
      date: formatDateForInput(entry.date),
      description: entry.description || "",
      productType: entry.productType || "",
      quantity: q,
      rate: entry.rate || "",
      loading: entry.loading || "",
      credit: entry.credit || "",
      paymentType: entry.paymentType || "CASH",
      bankName: entry.bankName || "",
      chequeNo: entry.chequeNo || "",
      chequeDate: entry.chequeDate ? formatDateForInput(entry.chequeDate) : "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      date: "",
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
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const qtyNum = Number(editForm.quantity) || 0;
  const rateNum = Number(editForm.rate) || 0;
  const loadingNum = Number(editForm.loading) || 0;
  const editDebit = qtyNum * rateNum + loadingNum;

  /**
   * ✅ CRITICAL FIX:
   * Send BOTH naming styles so it matches ANY backend/stock UI:
   * - date + purchaseDate
   * - rate + purchaseRate
   * - remainingQuantity
   */
  const createStockAdjustment = async (adj) => {
    const q = Number(adj?.quantity) || 0;
    const pType = adj?.productType;

    // no stock mutation for empty type or 0 qty
    if (!pType || q === 0) return;

    return api.post("/api/stock", {
      productType: pType,
      status: "AVAILABLE",

      // ✅ dual date fields
      date: editForm.date,
      purchaseDate: editForm.date,

      // ✅ quantities
      quantity: q,
      remainingQuantity: q,

      // ✅ dual rate fields
      rate: rateNum,
      purchaseRate: rateNum,

      // optional fields (safe defaults)
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

  const saveEdit = async () => {
    try {
      if (!editingId) return;

      const newType = editForm.productType;
      const oldType = originalProductType || newType;

      const stockAdjustments = [];

      // ✅ If this entry is just a payment row (no type + qty 0)
      // we still allow edit of credit/payment fields without stock changes.
      const isStockRelatedEdit = !!newType || !!oldType || originalQty !== 0 || qtyNum !== 0;

      if (isStockRelatedEdit) {
        if (newType === oldType) {
          const availableForType =
            newType && availableByType[newType] ? availableByType[newType] : 0;

          const deltaQty = qtyNum - originalQty;

          // if qty increased, must have stock
          if (deltaQty > 0 && deltaQty > availableForType) {
            alert(
              `Not enough available stock for ${newType}. ` +
                `Available: ${availableForType}, trying to sell extra: ${deltaQty}`
            );
            return;
          }

          if (deltaQty !== 0 && newType) {
            stockAdjustments.push({
              productType: newType,
              quantity: -deltaQty,
            });
          }
        } else {
          // ✅ return old qty to old type
          if (oldType && originalQty) {
            stockAdjustments.push({
              productType: oldType,
              quantity: originalQty,
            });
          }

          // ✅ subtract new qty from new type
          if (newType) {
            const availableForNew = availableByType[newType] ? availableByType[newType] : 0;

            if (qtyNum > 0 && qtyNum > availableForNew) {
              alert(
                `Not enough available stock for ${newType}. ` +
                  `Available: ${availableForNew}, trying to sell: ${qtyNum}`
              );
              return;
            }

            if (qtyNum !== 0) {
              stockAdjustments.push({
                productType: newType,
                quantity: -qtyNum,
              });
            }
          }
        }
      }

      const payload = {
        accountName: decodedName,
        ledgerType: "SALES",
        date: editForm.date,
        description: editForm.description,
        productType: newType,
        quantity: qtyNum,
        rate: rateNum,
        loading: loadingNum,
        debit: editDebit,
        credit: Number(editForm.credit) || 0,
        paymentType: editForm.paymentType || "CASH",
        bankName: editForm.paymentType === "BANK" ? editForm.bankName : "",
        chequeNo: editForm.paymentType === "CHEQUE" ? editForm.chequeNo : "",
        chequeDate:
          editForm.paymentType === "CHEQUE" && editForm.chequeDate ? editForm.chequeDate : null,
      };

      // 1) update SALES ledger
      await api.put(`/api/ledger/${editingId}`, payload);

      // 2) apply stock adjustments (fixed payload)
      if (stockAdjustments.length > 0) {
        await Promise.all(stockAdjustments.map(createStockAdjustment));
      }

      setEditingId(null);

      // 3) reload data
      await loadEntries();
      await loadStock();
    } catch (err) {
      console.error(err);
      alert("Error updating entry.");
    }
  };










const [newForm, setNewForm] = useState({
  productType: "",
  quantity: "",
  rate: "",
  loading: "",
});

const newQty = Number(newForm.quantity) || 0;
const newAvailable =
  newForm.productType && availableByType[newForm.productType]
    ? availableByType[newForm.productType]
    : 0;

const remainingAfterNew = Math.max(newAvailable - newQty, 0);
const isQtyExceeded = newQty > newAvailable;




  // ✅ NEW: Save manual debit (old sell) without stock selection
  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveManualDebit = async () => {
    try {
      const d = manualForm.date;
      const desc = (manualForm.description || "").trim();
      const debitVal = Number(manualForm.debit) || 0;

      if (!d) {
        alert("Please select date.");
        return;
      }
      if (!desc) {
        alert("Please enter description.");
        return;
      }
      if (debitVal <= 0) {
        alert("Please enter a valid debit amount.");
        return;
      }

      // ✅ Create SALES ledger entry with ONLY description + debit (no stock)
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
        paymentType: "CASH",
        bankName: "",
        chequeNo: "",
        chequeDate: null,
      });

      // reset + close
      setManualForm({
        date: formatDateForInput(new Date()),
        description: "",
        debit: "",
      });
      setShowManualDebit(false);

      // reload (closing balance will include this debit automatically)
      await loadEntries();
      await loadStock();
    } catch (err) {
      console.error(err);
      alert("Error saving manual debit entry.");
    }
  };

  // ✅ UPDATED: PDF now includes SUMMARY box at the end
  const handleWhatsAppPdf = () => {
    if (!entries || entries.length === 0) {
      alert("No entries to export.");
      return;
    }

    const doc = new jsPDF("l", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(47, 85, 151);
    doc.rect(0, 0, pageWidth, 80, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("AYAN STEEL", pageWidth / 2, 35, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      "We Deal in All Kind Of CRC, EG, GP HRC Color Coils Steel Sheets",
      pageWidth / 2,
      55,
      { align: "center" }
    );
    doc.text(
      "Contact No. Arslan Iftikhar (03229848888), Atif Iftikhar (03214097588)",
      pageWidth / 2,
      70,
      { align: "center" }
    );

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.line(40, 78, pageWidth - 40, 78);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENT LEDGER STATEMENT", pageWidth / 2, 105, {
      align: "center",
    });

    doc.setFillColor(223, 235, 247);
    doc.roundedRect(pageWidth / 2 - 150, 115, 300, 28, 3, 3, "F");
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(47, 85, 151);
    doc.text(`Account: ${decodedName}`, pageWidth / 2, 133, {
      align: "center",
    });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(`Generated on: ${currentDate}`, pageWidth / 2, 155, {
      align: "center",
    });

    const body = entries.map((e) => [
      formatDateForDisplay(e.date),
      e.description || "",
      e.productType || "",
      String(e.qty ?? e.quantity ?? ""),
      String(e.rate ?? ""),
      String(e.loading ?? ""),
      e.debit ? e.debit.toLocaleString() : "",
      e.credit ? e.credit.toLocaleString() : "",
      e.paymentType || "CASH",
      e.bankName || "",
      e.chequeNo || "",
      formatDateForDisplay(e.chequeDate),
      typeof e.closingBalance === "number" ? e.closingBalance.toLocaleString() : "",
    ]);

    autoTable(doc, {
      startY: 170,
      head: [
        [
          "Date",
          "Description",
          "Type",
          "Qty",
          "Rate",
          "Loading",
          "Debit",
          "Credit",
          "Payment",
          "Bank",
          "Cheque No",
          "Cheque Date",
          "Balance",
        ],
      ],
      body,
      theme: "striped",
      styles: {
        fontSize: 8,
        cellPadding: 5,
        overflow: "linebreak",
        cellWidth: "wrap",
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [47, 85, 151],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
        valign: "middle",
        cellPadding: 6,
      },
      alternateRowStyles: {
        fillColor: [245, 248, 252],
      },
      columnStyles: {
        0: { cellWidth: 55, halign: "center" },
        1: { cellWidth: 75, halign: "left" },
        2: { cellWidth: 55, halign: "center" },
        3: { cellWidth: 40, halign: "center" },
        4: { cellWidth: 40, halign: "center" },
        5: { cellWidth: 45, halign: "right" },
        6: { cellWidth: 55, halign: "right" },
        7: { cellWidth: 55, halign: "right" },
        8: { cellWidth: 55, halign: "center" },
        9: { cellWidth: 60, halign: "center" },
        10: { cellWidth: 50, halign: "center" },
        11: { cellWidth: 55, halign: "center" },
        12: { cellWidth: 60, halign: "right", fontStyle: "bold" },
      },
      margin: { left: 15, right: 15, bottom: 40 },
      didDrawPage: function () {
        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);

        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.setFont("helvetica", "normal");
        doc.text("AYAN STEEL - Confidential Document", 15, pageHeight - 12);
        doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth - 15, pageHeight - 12, {
          align: "right",
        });
      },
    });

    /* ----------------------------- */
    /* ✅ ADD SUMMARY BOX (like sample PDF) */
    /* ----------------------------- */

    // totals
    const totalDebit = entries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
    const totalCredit = entries.reduce((s, e) => s + (Number(e.credit) || 0), 0);

    const lastClosing =
      entries.length > 0 && typeof entries[entries.length - 1].closingBalance === "number"
        ? entries[entries.length - 1].closingBalance
        : totalCredit - totalDebit;

    // position near end of last page
    const lastY = doc.lastAutoTable && doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY : 170;

    const boxW = 220;
    const boxH = 90;
    const marginRight = 20;

    // place it below table if possible, otherwise pin it a bit higher
    let boxX = pageWidth - marginRight - boxW;
    let boxY = lastY + 18;

    const maxY = pageHeight - boxH - 35;
    if (boxY > maxY) boxY = maxY;

    // card background
    doc.setDrawColor(220, 230, 246);
    doc.setLineWidth(1);
    doc.setFillColor(245, 248, 255);
    doc.roundedRect(boxX, boxY, boxW, boxH, 6, 6, "FD");

    // title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(31, 59, 122);
    doc.text("SUMMARY", boxX + 14, boxY + 22);

    // rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    const labelX = boxX + 14;
    const valueX = boxX + boxW - 14;

    doc.text("Total Debit:", labelX, boxY + 45);
    doc.text(totalDebit.toLocaleString(), valueX, boxY + 45, { align: "right" });

    doc.text("Total Credit:", labelX, boxY + 63);
    doc.text(totalCredit.toLocaleString(), valueX, boxY + 63, { align: "right" });

    // closing bold
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 59, 122);
    doc.text("Closing Balance:", labelX, boxY + 82);
    doc.text(Number(lastClosing || 0).toLocaleString(), valueX, boxY + 82, { align: "right" });

    /* ----------------------------- */

    const fileName = `AYAN_STEEL_Ledger_${decodedName.replace(/\s+/g, "_")}_${new Date()
      .toISOString()
      .split("T")[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div style={outerBox}>
      {/* ✅ Modern Header Card */}
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
          </div>
        </div>

        <div style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          {/* ✅ NEW: Manual debit toggle button */}
          <button
            style={buttonSecondary}
            onClick={() => setShowManualDebit((p) => !p)}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
            title="Add old sell debit without stock"
          >
            + Old Sell Debit
          </button>

          <button
            style={button}
            onClick={() => navigate(`/clients/${encodeURIComponent(decodedName)}/new-entry`)}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
          >
            + New Record
          </button>
        </div>
      </div>

      {/* ✅ NEW: Manual Debit Form */}
      {showManualDebit && (
        <div style={manualCard}>
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 160px auto", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#1f3b7a", marginBottom: 6 }}>
                Date
              </div>
              <input
                style={inputBase}
                type="date"
                name="date"
                value={manualForm.date}
                onChange={handleManualChange}
              />
            </div>

            <div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#1f3b7a", marginBottom: 6 }}>
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
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#1f3b7a", marginBottom: 6 }}>
                Debit Amount
              </div>
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
                  setManualForm({
                    date: formatDateForInput(new Date()),
                    description: "",
                    debit: "",
                  });
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

      {/* ✅ Premium Table Container */}
      <div style={tableWrap}>
        <div style={{ overflowX: "auto" }}>
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
              {entries.map((e) => {
                const entryId = e._id || e.id;
                const isEditing = editingId === entryId;

                if (isEditing) {
                  const availableForType =
                    editForm.productType && availableByType[editForm.productType]
                      ? availableByType[editForm.productType]
                      : 0;

                  const deltaQty = qtyNum - originalQty;
                  const remainingAfter = availableForType - (deltaQty > 0 ? deltaQty : 0);

                  return (
                    <tr key={entryId} style={{ background: "#fbfdff" }}>
                      <td style={thtd}>
                        <input
                          style={inputBase}
                          type="date"
                          name="date"
                          value={editForm.date}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td style={thtd}>
                        <input
                          style={inputBase}
                          type="text"
                          name="description"
                          value={editForm.description}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td style={thtd}>
                        <select
                          style={selectBase}
                          name="productType"
                          value={editForm.productType}
                          onChange={handleEditChange}
                        >
                          <option value="">Select Type</option>
                          {productTypes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <div style={smallHint}>
                          {stockLoading
                            ? "Stock loading..."
                            : editForm.productType
                            ? `Available: ${availableByType[editForm.productType] || 0} | After edit: ${remainingAfter}`
                            : ""}
                        </div>
                      </td>
                      <td style={thtd}>
                        <input
                          style={inputBase}
                          type="number"
                          name="quantity"
                          value={editForm.quantity}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td style={thtd}>
                        <input
                          style={inputBase}
                          type="number"
                          name="rate"
                          value={editForm.rate}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td style={thtd}>
                        <input
                          style={inputBase}
                          type="number"
                          name="loading"
                          value={editForm.loading}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td style={thtd}>
                        <input
                          style={{
                            ...inputBase,
                            background: "#f6f8ff",
                            fontWeight: "700",
                          }}
                          type="text"
                          name="debit"
                          value={editDebit.toLocaleString("en-US")}
                          readOnly
                        />
                      </td>
                      <td style={thtd}>
                        <input
                          style={inputBase}
                          type="number"
                          name="credit"
                          value={editForm.credit}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td style={thtd}>
                        <select
                          style={selectBase}
                          name="paymentType"
                          value={editForm.paymentType}
                          onChange={handleEditChange}
                        >
                          <option value="CASH">CASH</option>
                          <option value="BANK">BANK-Transfer</option>
                          <option value="CHEQUE">Check Payment</option>
                        </select>
                      </td>
                      <td style={thtd}>
                        <input
                          style={{
                            ...inputBase,
                            background: editForm.paymentType !== "BANK" ? "#f3f5f8" : "#fff",
                          }}
                          type="text"
                          name="bankName"
                          placeholder="Bank"
                          value={editForm.bankName}
                          onChange={handleEditChange}
                          disabled={editForm.paymentType !== "BANK"}
                        />
                      </td>
                      <td style={thtd}>
                        <input
                          style={{
                            ...inputBase,
                            background: editForm.paymentType !== "CHEQUE" ? "#f3f5f8" : "#fff",
                          }}
                          type="text"
                          name="chequeNo"
                          placeholder="Cheque No"
                          value={editForm.chequeNo}
                          onChange={handleEditChange}
                          disabled={editForm.paymentType !== "CHEQUE"}
                        />
                      </td>
                      <td style={thtd}>
                        <input
                          style={{
                            ...inputBase,
                            background: editForm.paymentType !== "CHEQUE" ? "#f3f5f8" : "#fff",
                          }}
                          type="date"
                          name="chequeDate"
                          value={editForm.chequeDate}
                          onChange={handleEditChange}
                          disabled={editForm.paymentType !== "CHEQUE"}
                        />
                      </td>
                      <td style={thtd}>{e.closingBalance?.toLocaleString()}</td>
                      <td style={thtd}>
                        <button style={button} onClick={saveEdit}>
                          Save
                        </button>
                        <button style={{ ...buttonMuted, marginLeft: "6px" }} onClick={cancelEdit}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={entryId}>
                    <td style={thtd}>{formatDateForDisplay(e.date)}</td>
                    <td style={{ ...thtd, textAlign: "left", maxWidth: "260px" }}>{e.description}</td>
                    <td style={thtd}>{e.productType || ""}</td>
                    <td style={thtd}>{e.qty ?? e.quantity ?? ""}</td>
                    <td style={thtd}>{e.rate || ""}</td>
                    <td style={thtd}>{e.loading || ""}</td>
                    <td style={thtd}>{e.debit ? e.debit.toLocaleString() : ""}</td>
                    <td style={thtd}>{e.credit ? e.credit.toLocaleString() : ""}</td>
                    <td style={thtd}>{e.paymentType || "CASH"}</td>
                    <td style={thtd}>{e.bankName || ""}</td>
                    <td style={thtd}>{e.chequeNo || ""}</td>
                    <td style={thtd}>{formatDateForDisplay(e.chequeDate)}</td>
                    <td style={{ ...thtd, fontWeight: "700", color: "#1f3b7a" }}>
                      {typeof e.closingBalance === "number" ? e.closingBalance.toLocaleString() : ""}
                    </td>
                    <td style={thtd}>
                      <button style={button} onClick={() => startEdit(e)}>
                        Edit
                      </button>
                      <button
                        style={{ ...buttonDanger, marginLeft: "6px" }}
                        onClick={() => handleDelete(entryId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {entries.length === 0 && !loading && (
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

      {/* ✅ Premium Floating WhatsApp PDF Button */}
      <button
        onClick={handleWhatsAppPdf}
        style={{
          position: "fixed",
          right: "26px",
          bottom: "26px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.25)",
          background:
            "linear-gradient(135deg, #25D366 0%, #1fb954 50%, #25D366 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 22px rgba(37, 211, 102, 0.35)",
          cursor: "pointer",
          zIndex: 9999,
          transition: "transform .15s ease, box-shadow .15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 14px 26px rgba(37, 211, 102, 0.45)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = "0 10px 22px rgba(37, 211, 102, 0.35)";
        }}
        title="Save ledger PDF"
      >
        <i className="fa fa-whatsapp" style={{ fontSize: "28px" }} />
      </button>
    </div>
  );
}

export default ClientLedgerPage;
