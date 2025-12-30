// src/AdminPanel.js
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "./api";
import { useNavigate } from "react-router-dom";  // 🔹 NEW

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

// ------- helpers -------
function formatCurrency(v) {
  if (!v) return "0";
  return v.toLocaleString();
}

const padRight = (str, len) => {
  str = String(str ?? "");
  if (str.length > len) return str.slice(0, len);
  return str + " ".repeat(len - str.length);
};
const padLeft = (str, len) => {
  str = String(str ?? "");
  if (str.length > len) return str.slice(0, len);
  return " ".repeat(len - str.length) + str;
};
const padCenter = (str, len) => {
  str = String(str ?? "");
  if (str.length > len) return str.slice(0, len);
  const total = len - str.length;
  const left = Math.floor(total / 2);
  const right = total - left;
  return " ".repeat(left) + str + " ".repeat(right);
};
function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ASCII ledger builder (for View → print)
function buildLedgerText(meta, entries) {
  const {
    accountName,
    fromDate,
    toDate,
    currentDate,
    pageNo,
    openingBalance,
    rate
  } = meta;

  const from = fromDate ? formatDate(fromDate) : "";
  const to = toDate ? formatDate(toDate) : "";
  const current = currentDate ? new Date(currentDate).toDateString() : "";

  const line1Left = `: ${accountName || ""}`;
  const line1Right = rate ? rate.toFixed(2) : "";
  const line1 = padRight(line1Left, 100 - line1Right.length) + line1Right;

  const line2Left = `FROM   ${from} TO   ${to}`;
  const line2Right = `Page # ${pageNo || "1"}`;
  const line2 = padRight(line2Left, 100 - line2Right.length) + line2Right;

  const line3 = `Current Date:-  ${current}`;

  const W = {
    date: 10,
    desc: 30,
    qty: 8,
    rate: 7,
    mDays: 8,
    debit: 12,
    credit: 12,
    dc: 3,
    bal: 12,
    due: 10,
    lifting: 10
  };

  const headerCells = [
    padRight("DATE", W.date),
    padRight("DESCRIPTION", W.desc),
    padRight("QTY", W.qty),
    padRight("RATE", W.rate),
    padCenter("M/DAYS", W.mDays),
    padCenter("DEBIT", W.debit),
    padCenter("CREDIT", W.credit),
    padCenter("DC", W.dc),
    padCenter("BAL.AMOUNT", W.bal),
    padRight("DUE DATE", W.due),
    padRight("LIFTING DT", W.lifting)
  ];
  const headerRow = " " + headerCells.join(" | ");

  const dashCells = [
    "-".repeat(W.date),
    "-".repeat(W.desc),
    "-".repeat(W.qty),
    "-".repeat(W.rate),
    "-".repeat(W.mDays),
    "-".repeat(W.debit),
    "-".repeat(W.credit),
    "-".repeat(W.dc),
    "-".repeat(W.bal),
    "-".repeat(W.due),
    "-".repeat(W.lifting)
  ];
  const sepRow = " " + dashCells.join("-+-");
  const totalWidth = headerRow.length;
  const hrTop = " " + "-".repeat(totalWidth - 1);

  const headerBlock = [line1, "", line2, line3, "", hrTop, headerRow, sepRow];

  const makeRow = (
    date,
    description,
    qty,
    rateVal,
    mDays,
    debit,
    credit,
    dc,
    bal,
    dueDate,
    liftingDate
  ) => {
    const cells = [
      padRight(date || "", W.date),
      padRight(description || "", W.desc),
      padLeft(qty || "", W.qty),
      padLeft(rateVal || "", W.rate),
      padCenter(mDays || "", W.mDays),
      padCenter(debit || "", W.debit),
      padCenter(credit || "", W.credit),
      padCenter(dc || "", W.dc),
      padCenter(bal || "", W.bal),
      padRight(dueDate || "", W.due),
      padRight(liftingDate || "", W.lifting)
    ];
    return " " + cells.join(" | ");
  };

  let balance = Number(openingBalance || 0);
  const rows = [];

  rows.push(
    makeRow(
      "",
      "Opening Bal.",
      "",
      "",
      "",
      "",
      "",
      "DR",
      balance.toFixed(0),
      "",
      ""
    )
  );

  entries.forEach((e) => {
    const dateStr = formatDate(e.date);

    // 🔹 use quantity from API; fallback to e.qty if older data
    const qtyValue =
      typeof e.quantity === "number"
        ? e.quantity
        : typeof e.qty === "number"
        ? e.qty
        : 0;
    const qtyStr = qtyValue ? qtyValue.toFixed(3) : "0.000";

    const rateStr = e.rate ? e.rate.toFixed(1) : "0.0";

    // your schema uses "mdays", so prefer that but fallback to mDays
    const mDaysValue =
      typeof e.mdays === "number"
        ? e.mdays
        : typeof e.mDays === "number"
        ? e.mDays
        : 0;
    const mDaysStr = String(mDaysValue);

    const debit = e.debit || 0;
    const credit = e.credit || 0;


    balance = balance + debit - credit;
    const dc = balance >= 0 ? "DR" : "CR";
    const balAbs = Math.abs(balance);

    const dueStr = formatDate(e.dueDate);
    const liftingStr = formatDate(e.liftingDate);

    rows.push(
      makeRow(
        dateStr,
        e.description,
        qtyStr,
        rateStr,
        mDaysStr,
        debit ? debit.toFixed(0) : "",
        credit ? credit.toFixed(0) : "",
        dc,
        balAbs.toFixed(0),
        dueStr,
        liftingStr
      )
    );
  });

  return [...headerBlock, ...rows].join("\n");
}

// ----------------- component -----------------
const AdminPanel = ({
  onSelectClient,
  onLoadEntryForEdit,
  refreshKey = 0
}) => {
  const navigate = useNavigate(); // 🔹 NEW

  const [summary, setSummary] = useState({
    totalSales: 0,
    todaySales: 0,
    todayQty: 0,
    todayPayment: 0,
    totalQty: 0,
    clientCount: 0,
    pendingFromClients: 0,
    pendingFromCompany: 0
  });
  const [monthly, setMonthly] = useState([]);
  const [last30, setLast30] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientEntries, setClientEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSummaryAndClients = async () => {
    const [summaryRes, clientsRes] = await Promise.all([
      api.get("/ledger/admin/summary"),
      api.get("/ledger/admin/clients")
    ]);

    const s = summaryRes.data.summary || {};
    setSummary({
      totalSales: s.totalSales || 0,
      todaySales: s.todaySales || 0,
      todayQty: s.todayQty || 0,
      todayPayment: s.todayPayment || 0,
      totalQty: s.totalQty || 0,
      clientCount: s.clientCount || 0,
      pendingFromClients: s.pendingFromClients || 0,
      pendingFromCompany: s.pendingFromCompany || 0
    });

    setMonthly(summaryRes.data.monthly || []);
    setLast30(summaryRes.data.last30 || []);
    setClients(clientsRes.data || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await fetchSummaryAndClients();
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to load admin analytics", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [refreshKey]);

  // ✅ FIXED: use /ledger?accountName= instead of /ledger/admin/client/...
  const handleClientClick = async (name) => {
    setSelectedClient(name);
    setClientEntries([]);
    if (onSelectClient) onSelectClient(name);

    try {
      const res = await api.get("/ledger", {
        params: { accountName: name }
      });
      setClientEntries(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load client ledger", "error");
    }
  };

  const handleDeleteEntry = async (entryId) => {
    const result = await Swal.fire({
      title: "Delete this entry?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/ledger/${entryId}`);
      setClientEntries((prev) => prev.filter((e) => e._id !== entryId));

      await fetchSummaryAndClients();
      Swal.fire("Deleted", "Entry removed", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete entry", "error");
    }
  };

  const handleEditEntry = (entry) => {
    if (onLoadEntryForEdit) {
      onLoadEntryForEdit(entry);
    }
    Swal.fire({
      icon: "info",
      title: "Edit in Ledger",
      text: "Entry loaded into the ledger form for editing."
    });
  };

  const handleNewSaleForClient = async (clientName) => {
    const today = new Date().toISOString().substring(0, 10);

    const { value: formValues } = await Swal.fire({
      title: `New Sale for ${clientName}`,
      html: `
        <input id="ns-date" class="swal2-input" type="date" value="${today}" />
        <input id="ns-desc" class="swal2-input" placeholder="Description" />
        <input id="ns-qty"  class="swal2-input" type="number" placeholder="Qty" />
        <input id="ns-rate" class="swal2-input" type="number" placeholder="Rate" />
        <input id="ns-debit" class="swal2-input" type="number" placeholder="Debit (optional)" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save Sale",
      preConfirm: () => {
        const date = document.getElementById("ns-date").value;
        const description = document.getElementById("ns-desc").value;
        const qtyStr = document.getElementById("ns-qty").value;
        const rateStr = document.getElementById("ns-rate").value;
        const debitStr = document.getElementById("ns-debit").value;

        if (!date || !description) {
          Swal.showValidationMessage("Date and Description are required");
          return;
        }

        const qty = Number(qtyStr || "0");
        const rate = Number(rateStr || "0");
        const debit =
          debitStr === "" ? qty * rate : Number(debitStr || "0");

        return { date, description, qty, rate, debit };
      }
    });

    if (!formValues) return;

    try {
      const payload = {
        accountName: clientName,
        date: formValues.date,
        description: formValues.description,
        qty: formValues.qty,
        rate: formValues.rate,
        mDays: 0,
        debit: formValues.debit,
        credit: 0,
        dueDate: null,
        liftingDate: null
      };

      const res = await api.post("/ledger", payload);

      if (selectedClient === clientName) {
        setClientEntries((prev) => [...prev, res.data]);
      }

      await fetchSummaryAndClients();

      Swal.fire({
        icon: "success",
        title: "Sale Added",
        text: "New sale saved to ledger and analytics updated.",
        timer: 1700,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save new sale", "error");
    }
  };

  const handleViewLedger = (clientName) => {
    const entriesForClient = clientEntries.filter(
      (e) => (e.accountName || clientName) === clientName
    );

    if (!entriesForClient.length) {
      Swal.fire("Info", "No ledger entries for this client", "info");
      return;
    }

    const dates = entriesForClient
      .map((e) => (e.date ? new Date(e.date) : null))
      .filter(Boolean);

    let fromDate = null;
    let toDate = null;

    if (dates.length) {
      fromDate = dates.reduce((a, b) => (a < b ? a : b));
      toDate = dates.reduce((a, b) => (a > b ? a : b));
    }

    const meta = {
      accountName: clientName,
      fromDate,
      toDate,
      currentDate: new Date(),
      openingBalance: 0,
      pageNo: 1,
      rate: 2.99
    };

    const text = buildLedgerText(meta, entriesForClient);

    const win = window.open("", "_blank", "width=1000,height=700");
    if (!win) return;

    const safeText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    win.document.write(`
      <html>
        <head>
          <title>Ledger - ${clientName}</title>
          <style>
            body {
              margin: 0;
              font-family: "Courier New", monospace;
            }
            .toolbar {
              padding: 8px 10px;
              border-bottom: 1px solid #ccc;
            }
            .toolbar button {
              padding: 6px 14px;
              font-size: 12px;
              cursor: pointer;
            }
            pre {
              font-size: 8pt;
              line-height: 1.1;
              white-space: pre;
              overflow: visible;
              padding: 10px;
            }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <button onclick="window.print()">Print</button>
          </div>
          <pre>${safeText}</pre>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
  };

  const monthlyChartData = {
    labels: monthly.map((m) => m.label),
    datasets: [
      {
        label: "Sales",
        data: monthly.map((m) => m.totalSales),
        backgroundColor: "rgba(54, 162, 235, 0.6)"
      }
    ]
  };

  const last30ChartData = {
    labels: last30.map((d) => d.label),
    datasets: [
      {
        label: "Sales",
        data: last30.map((d) => d.totalSales),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.3)",
        tension: 0.3,
        fill: true
      }
    ]
  };

  const topClients = [...clients]
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);

  const pieData = {
    labels: topClients.map((c) => c.accountName || "Unknown"),
    datasets: [
      {
        data: topClients.map((c) => c.totalSales),
        backgroundColor: [
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)"
        ]
      }
    ]
  };

  return (
    <div className="admin-panel container-fluid pb-4">
      {/* 🔹 NEW BUTTON ROW AT TOP RIGHT */}
      <div className="d-flex justify-content-end mb-3">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => navigate("/company-balance")}
        >
          Company Balance
        </button>
      </div>

      {loading && <div className="alert alert-info">Loading analytics...</div>}

      {/* SUMMARY CARDS – 2 rows of 4 */}
      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title text-muted mb-1">Total Sales</h6>
              <h3 className="mb-0">Rs {formatCurrency(summary.totalSales)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title text-muted mb-1">Today Sales</h6>
              <h3 className="mb-0">Rs {formatCurrency(summary.todaySales)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title text-muted mb-1">Today QTY Sale</h6>
              <h3 className="mb-0">{formatCurrency(summary.todayQty)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title text-muted mb-1">
                Payment Received Today
              </h6>
              <h3 className="mb-0">
                Rs {formatCurrency(summary.todayPayment)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title text-muted mb-1">Total Quantity</h6>
              <h3 className="mb-0">{formatCurrency(summary.totalQty)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title text-muted mb-1">Clients</h6>
              <h3 className="mb-0">{summary.clientCount || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title text-muted mb-1">
                Total Balance Pending (From Clients)
              </h6>
              <h3 className="mb-0">
                Rs {formatCurrency(summary.pendingFromClients)}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title text-muted mb-1">
                Total Balance Pending (From Company)
              </h6>
              <h3 className="mb-0">
                Rs {formatCurrency(summary.pendingFromCompany)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3 mb-3">
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title mb-3">Monthly Sales</h6>
              {monthly.length === 0 ? (
                <div className="text-muted">No data yet</div>
              ) : (
                <Bar data={monthlyChartData} options={{ responsive: true }} />
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title mb-3">Last 30 Days Sales</h6>
              {last30.length === 0 ? (
                <div className="text-muted">No data yet</div>
              ) : (
                <Line
                  data={last30ChartData}
                  options={{ responsive: true }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client book + ledger + top clients */}
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title mb-3">Client Book</h6>
              <div className="list-group client-book-list">
                {clients.length === 0 && (
                  <div className="text-muted">No clients found</div>
                )}
                {clients.map((c) => (
                  <button
                    key={c.accountName}
                    type="button"
                    className={
                      "list-group-item list-group-item-action d-flex justify-content-between align-items-center " +
                      (selectedClient === c.accountName ? "active" : "")
                    }
                    onClick={() => handleClientClick(c.accountName)}
                  >
                    <span>{c.accountName || "(no name)"}</span>
                    <small>
                      Rs {formatCurrency(c.totalSales)} / Qty{" "}
                      {formatCurrency(c.totalQty)}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <h6 className="card-title mb-3">
                {selectedClient
                  ? `Ledger for: ${selectedClient}`
                  : "Select a client from Client Book"}
              </h6>
              {selectedClient && clientEntries.length === 0 && (
                <div className="text-muted">No entries for this client</div>
              )}
              {selectedClient && clientEntries.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th className="text-end">Qty</th>
                        <th className="text-end">Rate</th>
                        <th className="text-end">Debit</th>
                        <th className="text-end">Credit</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientEntries.map((e) => (
                        <tr key={e._id}>
                          <td>
                            {e.date
                              ? new Date(e.date).toLocaleDateString()
                              : ""}
                          </td>
                          <td>{e.description}</td>
                          <td className="text-end">{e.qty}</td>
                          <td className="text-end">{e.rate}</td>
                          <td className="text-end">{e.debit}</td>
                          <td className="text-end">{e.credit}</td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success me-1"
                              onClick={() =>
                                handleNewSaleForClient(
                                  e.accountName || selectedClient
                                )
                              }
                            >
                              New Sale
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => handleEditEntry(e)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger me-1"
                              onClick={() => handleDeleteEntry(e._id)}
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() =>
                                handleViewLedger(
                                  e.accountName || selectedClient
                                )
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-3">Top Clients by Sales</h6>
              {topClients.length === 0 ? (
                <div className="text-muted">No data yet</div>
              ) : (
                <Pie data={pieData} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
