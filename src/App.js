// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Ledger from "./Ledger";
import Login from "./Login";
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

// -------------------------------
// Helpers
// -------------------------------
function getUser() {
  const raw = localStorage.getItem("ledgerUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Invalid ledgerUser in localStorage", e);
    return null;
  }
}

// Simple auth guard – user must be logged in
function RequireAuth({ children }) {
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Admin-only guard – user must be logged in AND role === 'admin'
function RequireAdmin({ children }) {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") {
    return children;
  }

  // Logged in but not admin → send back to main ledger
  return <Navigate to="/ledger" replace />;
}

// Redirect root based on auth state
function RootRedirect() {
  const user = getUser();
  if (user) {
    return <Navigate to="/ledger" replace />;
  }
  return <Navigate to="/login" replace />;
}

// Optional: if someone visits /login while already logged in
function LoginRedirectGuard({ children }) {
  const user = getUser();
  if (user) {
    return <Navigate to="/ledger" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Root auto-redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Login page */}
        <Route
          path="/login"
          element={
            <LoginRedirectGuard>
              <Login />
            </LoginRedirectGuard>
          }
        />

        {/* Dashboard / clients list */}
        <Route
          path="/ledger"
          element={
            <RequireAuth>
              <Ledger />
            </RequireAuth>
          }
        />

        {/* Sales page – any logged user can create sales */}
        <Route
          path="/sales"
          element={
            <RequireAuth>
              <SalesPage />
            </RequireAuth>
          }
        />

        {/* Client ledger page – all entries for a specific client */}
        <Route
          path="/clients/:accountName"
          element={
            <RequireAuth>
              <ClientLedgerPage />
            </RequireAuth>
          }
        />

        {/* Supplier ledger page */}
        <Route
          path="/suppliers/:personName"
          element={
            <RequireAuth>
              <SupplierLedgerPage />
            </RequireAuth>
          }
        />

        {/* Sales/Purchases dashboards */}
        <Route
          path="/ledger/sales"
          element={
            <RequireAuth>
              <SalesLedgerDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/ledger/purchases"
          element={
            <RequireAuth>
              <SupplierLedgerDashboard />
            </RequireAuth>
          }
        />

        {/* Stock pages */}
        <Route
          path="/stock"
          element={
            <RequireAuth>
              <StockDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/available-stock"
          element={
            <RequireAuth>
              <AvailableStockPage />
            </RequireAuth>
          }
        />

        {/* Company Balance – ADMIN ONLY */}
        <Route
          path="/company-balance"
          element={
            <RequireAdmin>
              <CompanyBalancePage />
            </RequireAdmin>
          }
        />

        {/* New record page for specific client */}
        <Route
          path="/clients/:accountName/new-entry"
          element={
            <RequireAuth>
              <NewLedgerEntryPage />
            </RequireAuth>
          }
        />

        {/* Standalone Admin Panel route – ADMIN ONLY */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPanel />
            </RequireAdmin>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
