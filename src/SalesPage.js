// src/SalesPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const page = {
  maxWidth: "1200px",
  margin: "20px auto",
  padding: "20px",
  background: "#f5f7fb",
  borderRadius: "8px",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)"
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
  padding: "20px",
  border: "1px solid #e0e0e0"
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
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "12px",
  marginBottom: "12px"
};

const footerRow = {
  marginTop: "20px",
  textAlign: "right"
};

const saveBtn = {
  padding: "8px 18px",
  borderRadius: "4px",
  border: "none",
  background: "#28a745",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600
};

// same function as backend computeClosing
function computeClosing(entries) {
  let balance = 0;
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return sorted.map((e, index) => {
    const debit = Number(e.debit) || 0;
    const credit = Number(e.credit) || 0;

    if (
      index === 0 &&
      (e.description === "B/F" || e.description === "Opening Balance")
    ) {
      balance = credit - debit;
    } else {
      balance += credit - debit;
    }

    return { ...e, closingBalance: balance };
  });
}

function SalesPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    accountName: "",
    date: "",
    description: "",
    productType: "", // 🔹 NEW: Type
    qty: 0,
    rate: 0,
    loading: 0, // loading amount
    credit: 0,
    mdays: 0,
    dueDate: "",
    liftingDate: "",
    paymentType: "CASH", // CASH | BANK | CHEQUE
    bankName: "",
    chequeNo: "",
    chequeDate: ""
  });

  const [saving, setSaving] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0); // previous remaining balance
  const [loadingPrev, setLoadingPrev] = useState(false);

  // 🔹 stock info
  const [productTypes, setProductTypes] = useState([]);
  const [availableByType, setAvailableByType] = useState({});
  const [stockLoading, setStockLoading] = useState(false);

  // numeric helpers
  const qtyNum = Number(form.qty) || 0;
  const rateNum = Number(form.rate) || 0;
  const loadingNum = Number(form.loading) || 0;
  const creditNum = Number(form.credit) || 0;

  // Debit = Qty × Rate + Loading Balance
  const computedDebit = qtyNum * rateNum + loadingNum;

  // New remaining balance = openingBalance + credit - debit
  const newRemainingBalance = openingBalance + creditNum - computedDebit;

  // available stock for selected type
  const availableForType =
    form.productType && availableByType[form.productType]
      ? availableByType[form.productType]
      : 0;
  const remainingQtyAfterSale = availableForType - qtyNum;

  // --- input handlers ---
  const handleChangeNum = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value === "" ? "" : Number(value)
    }));
  };

  const handleChangeText = (e) => {
    const { name, value } = e.target;

    // payment type change
    if (name === "paymentType") {
      setForm((prev) => ({
        ...prev,
        paymentType: value,
        bankName: "",
        chequeNo: "",
        chequeDate: ""
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 load stock for types + available qty
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
          const q = Number(s.quantity) || 0;
          availableMap[s.productType] =
            (availableMap[s.productType] || 0) + q;
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

  // --- fetch previous closing balance whenever accountName changes ---
  useEffect(() => {
    const name = form.accountName?.trim();
    if (!name) {
      setOpeningBalance(0);
      return;
    }

    const fetchBalance = async () => {
      try {
        setLoadingPrev(true);
        const res = await api.get("/api/ledger", {
          params: {
            accountName: name,
            from: "1900-01-01",
            to: "2100-12-31"
          }
        });

        const withClosing = computeClosing(res.data || []);
        if (withClosing.length === 0) {
          setOpeningBalance(0);
        } else {
          const last = withClosing[withClosing.length - 1];
          setOpeningBalance(last.closingBalance || 0);
        }
      } catch (err) {
        console.error("Error fetching previous balance", err);
        setOpeningBalance(0);
      } finally {
        setLoadingPrev(false);
      }
    };

    fetchBalance();
  }, [form.accountName]);

  // 🔹 load stock once on mount
  useEffect(() => {
    loadStock();
  }, []);

  // --- submit handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.accountName || !form.date) {
      alert("Please enter Client/Account Name and Date.");
      return;
    }

    if (!form.productType) {
      alert("Please select Type (product).");
      return;
    }

    // check stock
    if (qtyNum > 0 && qtyNum > availableForType) {
      alert(
        `Not enough available stock for ${form.productType}. ` +
          `Available: ${availableForType}, trying to sell: ${qtyNum}`
      );
      return;
    }

    try {
      setSaving(true);

      const closingBalance = newRemainingBalance; // use preview value

      const payload = {
        accountName: form.accountName.trim(),
        date: form.date,
        description: form.description,
        productType: form.productType,
        quantity: qtyNum,
        rate: rateNum,
        debit: computedDebit,
        credit: creditNum,
        closingBalance,
        mdays: form.mdays,
        dueDate: form.dueDate,
        liftingDate: form.liftingDate,
        loading: loadingNum,
        paymentType: form.paymentType,
        bankName: form.paymentType === "BANK" ? form.bankName : "",
        chequeNo: form.paymentType === "CHEQUE" ? form.chequeNo : "",
        chequeDate: form.paymentType === "CHEQUE" ? form.chequeDate : ""
      };

      // 1) save ledger entry
      await api.post("/api/ledger", payload);

      // 2) deduct stock in real time (negative AVAILABLE entry)
      if (form.productType && qtyNum !== 0) {
        await api.post("/api/stock", {
          productType: form.productType,
          status: "AVAILABLE",
          date: form.date,
          quantity: -qtyNum, // deduct
          rate: rateNum
        });
      }

      alert("Sale saved and ledger + stock updated.");

      setForm({
        accountName: "",
        date: "",
        description: "",
        productType: "",
        qty: 0,
        rate: 0,
        loading: 0,
        credit: 0,
        mdays: 0,
        dueDate: "",
        liftingDate: "",
        paymentType: "CASH",
        bankName: "",
        chequeNo: "",
        chequeDate: ""
      });
      setOpeningBalance(0);
      await loadStock(); // refresh available stock
    } catch (err) {
      console.error(err);
      alert("Error saving sale.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={page}>
      <div style={headerRow}>
        <div style={title}>New Sale Entry</div>
        <div>
          <button style={btn} onClick={() => navigate("/admin")}>
            Admin Panel
          </button>
          <button style={btn} onClick={() => navigate("/")}>
            Ledger
          </button>
        </div>
      </div>

      <p style={{ marginBottom: "14px", fontSize: "13px", color: "#555" }}>
        Create a simple sale entry. It will be stored in the ledger and reflected
        in the Admin Panel and Client Book automatically. Stock will also be
        deducted in real time.
      </p>

      <div style={card}>
        <form onSubmit={handleSubmit}>
          {/* Row 1 */}
          <div style={row}>
            <div>
              <div style={label}>Client / Account Name</div>
              <input
                style={input}
                type="text"
                name="accountName"
                value={form.accountName}
                onChange={handleChangeText}
                required
              />
              <div
                style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}
              >
                {loadingPrev
                  ? "Loading previous balance..."
                  : `Opening Balance: ${openingBalance.toLocaleString("en-US")}`}
              </div>
            </div>
            <div>
              <div style={label}>Date</div>
              <input
                style={input}
                type="date"
                name="date"
                value={form.date}
                onChange={handleChangeText}
                required
              />
            </div>
            <div>
              <div style={label}>Description</div>
              <input
                style={input}
                type="text"
                name="description"
                value={form.description}
                onChange={handleChangeText}
              />
            </div>
          </div>

          {/* Row 1.5 – Type & stock info */}
          <div style={row}>
            <div>
              <div style={label}>Type (Product)</div>
              <select
                style={input}
                name="productType"
                value={form.productType}
                onChange={handleChangeText}
              >
                <option value="">Select Type</option>
                {productTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: "11px", marginTop: "4px", color: "#555" }}>
                {stockLoading
                  ? "Stock loading..."
                  : form.productType
                  ? `Available Qty: ${availableForType.toLocaleString()} | After this sale: ${remainingQtyAfterSale.toLocaleString()}`
                  : "Select a type to see available stock"}
              </div>
            </div>
            <div />
            <div />
          </div>

          {/* Row 2 */}
          <div style={row}>
            <div>
              <div style={label}>Qty</div>
              <input
                style={input}
                type="number"
                name="qty"
                value={form.qty}
                onChange={handleChangeNum}
              />
            </div>
            <div>
              <div style={label}>Rate</div>
              <input
                style={input}
                type="number"
                name="rate"
                value={form.rate}
                onChange={handleChangeNum}
              />
            </div>
            <div>
              <div style={label}>Loading Balance</div>
              <input
                style={input}
                type="number"
                name="loading"
                value={form.loading}
                onChange={handleChangeNum}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div style={row}>
            <div>
              <div style={label}>Debit (Qty × Rate + Loading)</div>
              <input
                style={{ ...input, background: "#f1f3f5" }}
                type="text"
                value={computedDebit.toLocaleString("en-US")}
                readOnly
              />
            </div>
            <div>
              <div style={label}>Credit</div>
              <input
                style={input}
                type="number"
                name="credit"
                value={form.credit}
                onChange={handleChangeNum}
              />
            </div>
            <div>
              <div style={label}>Payment Type</div>
              <select
                style={input}
                name="paymentType"
                value={form.paymentType}
                onChange={handleChangeText}
              >
                <option value="CASH">CASH</option>
                <option value="BANK">BANK-Transfer</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>
          </div>

          {/* Row 4 */}
          <div style={row}>
            <div>
              <div style={label}>New Remaining Balance</div>
              <input
                style={{ ...input, background: "#f1f3f5" }}
                type="text"
                value={newRemainingBalance.toLocaleString("en-US")}
                readOnly
              />
            </div>
            <div>
              <div style={label}>M/Days</div>
              <input
                style={input}
                type="number"
                name="mdays"
                value={form.mdays}
                onChange={handleChangeNum}
              />
            </div>
            <div>
              <div style={label}>Due Date</div>
              <input
                style={input}
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChangeText}
              />
            </div>
          </div>

          {/* Row 5: Lifting + Bank / Cheque fields */}
          <div style={row}>
            <div>
              <div style={label}>Lifting Date</div>
              <input
                style={input}
                type="date"
                name="liftingDate"
                value={form.liftingDate}
                onChange={handleChangeText}
              />
            </div>

            <div>
              <div style={label}>Bank (if Bank Payment)</div>
              <select
                style={input}
                name="bankName"
                value={form.bankName}
                onChange={handleChangeText}
                disabled={form.paymentType !== "BANK"}
              >
                <option value="">Select Bank</option>
                <option value="Mezan">Mezan</option>
                <option value="JS">JS</option>
                <option value="ASKARI">ASKARI</option>
                <option value="FAISAL">FAISAL</option>
                <option value="BANK-ISLAMI">BANK-ISLAMI</option>
                <option value="UBL">UBL</option>
                <option value="ALLIED">ALLIED</option>
              </select>
            </div>

            <div>
              <div style={label}>Cheque Details (if Cheque)</div>
              <div style={{ display: "flex", gap: "4px" }}>
                <input
                  style={{ ...input, flex: 1 }}
                  type="text"
                  name="chequeNo"
                  placeholder="Cheque No."
                  value={form.chequeNo}
                  onChange={handleChangeText}
                  disabled={form.paymentType !== "CHEQUE"}
                />
                <input
                  style={{ ...input, flex: 1 }}
                  type="date"
                  name="chequeDate"
                  value={form.chequeDate}
                  onChange={handleChangeText}
                  disabled={form.paymentType !== "CHEQUE"}
                />
              </div>
            </div>
          </div>

          <div style={footerRow}>
            <button style={saveBtn} type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SalesPage;
