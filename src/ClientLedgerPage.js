// src/ClientLedgerPage.js - FIXED: PDF Balance column always fits (mobile-friendly) + Last Date PDF + Summary includes Total Qty
import React, { useEffect, useMemo, useState } from "react";
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

function dateKey(d) {
  return formatDateForInput(d);
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
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
    paymentType: "",
    bankName: "",
    chequeNo: "",
    chequeDate: "",
  });

  const [productTypes, setProductTypes] = useState([]);
  const [availableByType, setAvailableByType] = useState({});
  const [stockLoading, setStockLoading] = useState(false);

  const [originalQty, setOriginalQty] = useState(0);
  const [originalProductType, setOriginalProductType] = useState("");

  // ✅ Manual debit (old sell) UI + state (no stock selection)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      paymentType: entry.paymentType || "",
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

  const createStockAdjustment = async (adj) => {
    const q = Number(adj?.quantity) || 0;
    const pType = adj?.productType;

    if (!pType || q === 0) return;

    return api.post("/api/stock", {
      productType: pType,
      status: "AVAILABLE",

      date: editForm.date,
      purchaseDate: editForm.date,

      quantity: q,
      remainingQuantity: q,

      rate: rateNum,
      purchaseRate: rateNum,

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
      const isStockRelatedEdit = !!newType || !!oldType || originalQty !== 0 || qtyNum !== 0;

      if (isStockRelatedEdit) {
        if (newType === oldType) {
          const availableForType =
            newType && availableByType[newType] ? availableByType[newType] : 0;

          const deltaQty = qtyNum - originalQty;

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
          if (oldType && originalQty) {
            stockAdjustments.push({
              productType: oldType,
              quantity: originalQty,
            });
          }

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

      await api.put(`/api/ledger/${editingId}`, payload);

      if (stockAdjustments.length > 0) {
        await Promise.all(stockAdjustments.map(createStockAdjustment));
      }

      setEditingId(null);

      await loadEntries();
      await loadStock();
    } catch (err) {
      console.error(err);
      alert("Error updating entry.");
    }
  };

  // ✅ Manual debit save
  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveManualDebit = async () => {
    try {
      const d = manualForm.date;
      const desc = (manualForm.description || "").trim();
      const debitVal = Number(manualForm.debit) || 0;

      if (!d) return alert("Please select date.");
      if (!desc) return alert("Please enter description.");
      if (debitVal <= 0) return alert("Please enter a valid debit amount.");

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
    } catch (err) {
      console.error(err);
      alert("Error saving manual debit entry.");
    }
  };

  /* ----------------------------- */
  /* ✅ PDF HELPERS (FIXED TABLE WIDTH SO LAST BALANCE NEVER CUTS) */
  /* ----------------------------- */

  const lastDateKey = useMemo(() => {
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
    if (!lastDateKey) return [];
    return entries.filter((e) => dateKey(e.date) === lastDateKey);
  }, [entries, lastDateKey]);

  // ✅ Helper: scale column widths to ALWAYS fit inside page width (fixes Balance cut off)
  const getFittingColumnWidths = (availableWidth) => {
    // Order matches table columns:
    // Date, Description, Type, Qty, Rate, Loading, Debit, Credit, Payment, Bank, Cheque No, Cheque Date, Balance
    const desired = [58, 150, 58, 34, 38, 46, 54, 54, 52, 52, 52, 52, 60];

    const sum = desired.reduce((a, b) => a + b, 0);
    const scale = sum > availableWidth ? availableWidth / sum : 1;

    let scaled = desired.map((w) => Math.max(28, Math.floor(w * scale))); // keep min width
    // Give any leftover pixels to Description so it uses full width nicely
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

    // ✅ Keep landscape, but make table fit 100% always
    const doc = new jsPDF("l", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margins = { left: 18, right: 18, bottom: 48, top: 0 };
    const availableW = pageWidth - margins.left - margins.right;
    const W = getFittingColumnWidths(availableW);

    // Background tint
    doc.setFillColor(247, 250, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Top brand bar
    doc.setFillColor(31, 59, 122);
    doc.rect(0, 0, pageWidth, 78, "F");

    // Accent line
    doc.setFillColor(85, 132, 255);
    doc.rect(0, 78, pageWidth, 3, "F");













// Title: AYAN STEEL
doc.setTextColor(255, 255, 255);
doc.setFontSize(28);
doc.setFont("helvetica", "bold");
doc.text("AYAN STEEL", 30, 38);

// Subtitle (left)
doc.setFontSize(10);
doc.setFont("helvetica", "normal");
doc.text(
  "We Deal in All Kind Of CRC, EG, GP HRC Color Coils Steel Sheets",
  30,
  56
);

// ✅ Phones UNDER company name (3rd line)
doc.setFontSize(9.2);
doc.setFont("helvetica", "normal");
doc.text(
  "Arslan Iftikhar: 03229848888 | Atif Iftikhar: 03214097588 | Salman Iftikhar: 03244905087 | Numan Iftikhar: 03224100022",

  30,
  68
);








    // Badge (right)
    const badgeText = reportTag || "FULL LEDGER";
    const badgeW = Math.min(240, 9.2 * badgeText.length + 34);
    const badgeH = 22;
    const badgeX = pageWidth - 30 - badgeW;
const badgeY = (78 - badgeH) / 2;   // = 28


    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 10, 10, "FD");

    doc.setTextColor(31, 59, 122);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(badgeText, badgeX + badgeW / 2, badgeY + 15, { align: "center" });

    // Center report title
    doc.setTextColor(31, 59, 122);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, pageWidth / 2, 112, { align: "center" });

    // Account pill
    const pillText = `Account: ${decodedName}`;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 59, 122);
    doc.setFillColor(235, 242, 255);
    doc.setDrawColor(210, 224, 255);
    doc.roundedRect(pageWidth / 2 - 210, 122, 420, 30, 10, 10, "FD");
    doc.text(pillText, pageWidth / 2, 142, { align: "center" });

    // Generated on + optional date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(95, 105, 120);
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let rangeLine = `Generated on: ${currentDate}`;
    const uniqueKeys = Array.from(new Set(rows.map((r) => dateKey(r.date)).filter(Boolean)));
    if (uniqueKeys.length === 1) {
      rangeLine += `  |  Date: ${uniqueKeys[0]}`;
    }
    doc.text(rangeLine, pageWidth / 2, 165, { align: "center" });

    // Table body
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

    // ✅ Build table (fixed to page width + smaller padding/font so Balance never cuts on mobile)
    autoTable(doc, {
      startY: 180,
      tableWidth: availableW, // ✅ force fit inside margins
      margin: { left: margins.left, right: margins.right, bottom: margins.bottom, top: margins.top },
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
          "Pay",
          "Bank",
          "Chq#",
          "Chq Dt",
          "Balance",
        ],
      ],
      body,
      theme: "grid",
      styles: {
        fontSize: 7.2,
        cellPadding: 3, // ✅ reduced padding so table width stays inside page
        overflow: "ellipsize", // ✅ prevents stretching columns
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
      alternateRowStyles: {
        fillColor: [248, 250, 255],
      },
      columnStyles: {
        0: { cellWidth: W[0], halign: "center" }, // Date
        1: { cellWidth: W[1], halign: "left" },   // Desc
        2: { cellWidth: W[2], halign: "center" }, // Type
        3: { cellWidth: W[3], halign: "center" }, // Qty
        4: { cellWidth: W[4], halign: "center" },  // Rate
        5: { cellWidth: W[5], halign: "center" },  // Loading
        6: { cellWidth: W[6], halign: "center" },  // Debit
        7: { cellWidth: W[7], halign: "center" },  // Credit
        8: { cellWidth: W[8], halign: "center" }, // Payment
        9: { cellWidth: W[9], halign: "center" }, // Bank
        10:{ cellWidth: W[10], halign: "center" },// Cheque No
        11:{ cellWidth: W[11], halign: "center" },// Cheque Date
        12:{ cellWidth: W[12], halign: "center", fontStyle: "bold" }, // Balance
      },
      didDrawPage: function () {
        // Footer line
        doc.setDrawColor(210, 220, 235);
        doc.setLineWidth(0.8);
        doc.line(18, pageHeight - 30, pageWidth - 18, pageHeight - 30);

        // Footer text
        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

        doc.setFontSize(8);
        doc.setTextColor(110, 120, 135);
        doc.setFont("helvetica", "normal");
        doc.text("AYAN STEEL - Confidential Document", 18, pageHeight - 14);
        doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth - 18, pageHeight - 14, {
          align: "right",
        });
      },
    });

    /* ----------------------------- */
    /* ✅ SUMMARY BOX (INCLUDES TOTAL QTY) */
    /* ----------------------------- */
    const totalDebit = rows.reduce((s, e) => s + safeNum(e.debit), 0);
    const totalCredit = rows.reduce((s, e) => s + safeNum(e.credit), 0);
    const totalQty = rows.reduce((s, e) => s + safeNum(e.qty ?? e.quantity), 0);

    const lastRow = rows[rows.length - 1];
    const lastClosing =
      lastRow && typeof lastRow.closingBalance === "number"
        ? safeNum(lastRow.closingBalance)
        : totalCredit - totalDebit;

    const lastY = doc.lastAutoTable && doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY : 180;

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
      reportTag: `LAST DATE (${lastDateKey || "—"})`,
      fileSuffix: `LAST_DATE_${(lastDateKey || "NA").replaceAll("-", "")}`,
    });
  };

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
            {lastDateKey ? (
              <span
                style={{
                  ...badgeInfo,
                  marginLeft: 8,
                  background: "#f7f0ff",
                  borderColor: "#ead8ff",
                  color: "#5a2ea6",
                }}
              >
                Last Date: {lastDateKey}
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            style={buttonSecondary}
            onClick={handleLastDatePdf}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
            title="Download last date entries PDF (latest date only)"
            disabled={!lastDateKey}
          >
            ⬇ Last Date PDF
          </button>

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

      {showManualDebit && (
        <div style={manualCard}>
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 160px auto", gap: "10px" }}>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "#1f3b7a",
                  marginBottom: 6,
                }}
              >
                Date
              </div>
              <input style={inputBase} type="date" name="date" value={manualForm.date} onChange={handleManualChange} />
            </div>

            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "#1f3b7a",
                  marginBottom: 6,
                }}
              >
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
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "#1f3b7a",
                  marginBottom: 6,
                }}
              >
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
                        <input style={inputBase} type="date" name="date" value={editForm.date} onChange={handleEditChange} />
                      </td>
                      <td style={thtd}>
                        <input style={inputBase} type="text" name="description" value={editForm.description} onChange={handleEditChange} />
                      </td>
                      <td style={thtd}>
                        <select style={selectBase} name="productType" value={editForm.productType} onChange={handleEditChange}>
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
                        <input style={inputBase} type="number" name="quantity" value={editForm.quantity} onChange={handleEditChange} />
                      </td>
                      <td style={thtd}>
                        <input style={inputBase} type="number" name="rate" value={editForm.rate} onChange={handleEditChange} />
                      </td>
                      <td style={thtd}>
                        <input style={inputBase} type="number" name="loading" value={editForm.loading} onChange={handleEditChange} />
                      </td>
                      <td style={thtd}>
                        <input
                          style={{ ...inputBase, background: "#f6f8ff", fontWeight: "700" }}
                          type="text"
                          name="debit"
                          value={editDebit.toLocaleString("en-US")}
                          readOnly
                        />
                      </td>
                      <td style={thtd}>
                        <input style={inputBase} type="number" name="credit" value={editForm.credit} onChange={handleEditChange} />
                      </td>
                      <td style={thtd}>
                        <select style={selectBase} name="paymentType" value={editForm.paymentType} onChange={handleEditChange}>
                          <option value="CASH">CASH</option>
                          <option value="BANK">BANK-Transfer</option>
                          <option value="CHEQUE">Check Payment</option>
                          <option value="--">---</option>

                        </select>
                      </td>
                      <td style={thtd}>
                        <input
                          style={{ ...inputBase, background: editForm.paymentType !== "BANK" ? "#f3f5f8" : "#fff" }}
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
                          style={{ ...inputBase, background: editForm.paymentType !== "--" ? "#f3f5f8" : "#fff" }}
                          type="text"
                          name=""
                          placeholder=""
                          value={editForm.bankName}
                          onChange={handleEditChange}
                          disabled={editForm.paymentType !== ""}
                        />
                      </td>
                      <td style={thtd}>
                        <input
                          style={{ ...inputBase, background: editForm.paymentType !== "CHEQUE" ? "#f3f5f8" : "#fff" }}
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
                          style={{ ...inputBase, background: editForm.paymentType !== "CHEQUE" ? "#f3f5f8" : "#fff" }}
                          type="date"
                          name="chequeDate"
                          value={editForm.chequeDate}
                          onChange={handleEditChange}
                          disabled={editForm.paymentType !== "CHEQUE"}
                        />
                      </td>
                      <td style={thtd}>{e.closingBalance?.toLocaleString("en-US")}</td>
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
                    <td style={thtd}>{e.debit ? Number(e.debit).toLocaleString("en-US") : ""}</td>
                    <td style={thtd}>{e.credit ? Number(e.credit).toLocaleString("en-US") : ""}</td>
                    <td style={thtd}>{e.paymentType || "CASH"}</td>
                    <td style={thtd}>{e.bankName || ""}</td>
                    <td style={thtd}>{e.chequeNo || ""}</td>
                    <td style={thtd}>{formatDateForDisplay(e.chequeDate)}</td>
                    <td style={{ ...thtd, fontWeight: "700", color: "#1f3b7a" }}>
                      {typeof e.closingBalance === "number" ? Number(e.closingBalance).toLocaleString("en-US") : ""}
                    </td>
                    <td style={thtd}>
                      <button style={button} onClick={() => startEdit(e)}>
                        Edit
                      </button>
                      <button style={{ ...buttonDanger, marginLeft: "6px" }} onClick={() => handleDelete(entryId)}>
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

      {/* ✅ Floating PDF Buttons (FULL + LAST DATE) */}
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
            transition: "transform .15s ease, box-shadow .15s ease",
            opacity: lastDateKey ? 1 : 0.6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 14px 26px rgba(111, 66, 193, 0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px)";
            e.currentTarget.style.boxShadow = "0 10px 22px rgba(111, 66, 193, 0.35)";
          }}
          title={lastDateKey ? `Save LAST DATE PDF (${lastDateKey})` : "Last Date not available"}
          disabled={!lastDateKey}
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
          title="Save FULL ledger PDF"
        >
          <i className="fa fa-whatsapp" style={{ fontSize: "28px" }} />
        </button>
      </div>
    </div>
  );
}

export default ClientLedgerPage;
