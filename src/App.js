// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Ledger from "./Ledger";
import SalesPage from "./SalesPage";
import AdminPanel from "./AdminPanel";
import ClientLedgerPage from "./ClientLedgerPage";
import NewLedgerEntryPage from "./NewLedgerEntryPage";
import CompanyBalancePage from "./CompanyBalancePage";
import StockDashboard from "./StockDashboard";
import AvailableStockPage from "./AvailableStockPage";

import SalesLedgerDashboard from "./SalesLedgerDashboard";
import SupplierLedgerDashboard from "./SupplierLedgerDashboard";
import SupplierLedgerPage from "./SupplierLedgerPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ MAIN PAGE */}
        <Route path="/" element={<Ledger />} />

        {/* Ledger dashboard */}
        <Route path="/ledger" element={<Ledger />} />

        {/* Sales */}
        <Route path="/sales" element={<SalesPage />} />

        {/* Client ledger */}
        <Route
          path="/clients/:accountName"
          element={<ClientLedgerPage />}
        />

        {/* New entry for client */}
        <Route
          path="/clients/:accountName/new-entry"
          element={<NewLedgerEntryPage />}
        />

        {/* Supplier ledger */}
        <Route
          path="/suppliers/:personName"
          element={<SupplierLedgerPage />}
        />

        {/* Sales & Purchase dashboards */}
        <Route
          path="/ledger/sales"
          element={<SalesLedgerDashboard />}
        />
        <Route
          path="/ledger/purchases"
          element={<SupplierLedgerDashboard />}
        />

        {/* Stock */}
        <Route path="/stock" element={<StockDashboard />} />
        <Route
          path="/available-stock"
          element={<AvailableStockPage />}
        />

        {/* Company balance */}
        <Route
          path="/company-balance"
          element={<CompanyBalancePage />}
        />

        {/* Admin panel */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* Fallback → Ledger */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
