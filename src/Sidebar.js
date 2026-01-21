// src/Sidebar.js
import React from "react";
import { NavLink } from "react-router-dom";

const palette = {
  card: "#ffffff",
  border: "#e6ebf5",
  text: "#0f172a",
  muted: "#64748b",
  primary: "#2f5597",
  primary2: "#1f3b7a",
  activeBg: "#eef4ff",
};

const baseLink = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 12.5,
  border: "1px solid transparent",
};

function Item({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...baseLink,
        color: isActive ? palette.primary2 : palette.text,
        background: isActive ? palette.activeBg : "transparent",
        borderColor: isActive ? "#d6e3ff" : "transparent",
      })}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f4f8ff, #ffffff)",
          border: `1px solid ${palette.border}`,
          fontSize: 14,
        }}
      >
        {icon}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose, onOpen }) {
  // ✅ When closed: show ONLY right-arrow open button
  if (!isOpen) {
    return (
      <button
        onClick={onOpen}
        title="Open Sidebar"
        style={{
          position: "fixed",
          left: 10,
          top: 12,
          zIndex: 9999,
          width: 42,
          height: 42,
          borderRadius: 14,
          border: `1px solid ${palette.border}`,
          background: "#fff",
          cursor: "pointer",
          fontWeight: 900,
          color: palette.primary2,
          boxShadow: "0 10px 22px rgba(16, 24, 40, 0.12)",
        }}
      >
        ➜
      </button>
    );
  }

  // ✅ When open: normal sidebar with X close button
  return (
    <div
      style={{
        width: 270,
        padding: 14,
        position: "sticky",
        top: 0,
        height: "100vh",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          height: "100%",
          background: palette.card,
          border: `1px solid ${palette.border}`,
          borderRadius: 16,
          boxShadow: "0 10px 26px rgba(16, 24, 40, 0.06)",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            paddingBottom: 10,
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${palette.primary}, ${palette.primary2})`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                boxShadow: "0 6px 14px rgba(47, 85, 151, 0.22)",
              }}
            >
              L
            </div>
            <div>
              <div style={{ fontWeight: 900, color: palette.text, fontSize: 14 }}>
                Ledger Menu
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: palette.muted }}>
                Navigation Panel
              </div>
            </div>
          </div>

          {/* ✅ X close button */}
          <button
            onClick={onClose}
            title="Close Sidebar"
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              border: `1px solid ${palette.border}`,
              background: "#fff",
              cursor: "pointer",
              fontWeight: 900,
              color: palette.primary2,
            }}
          >
            ✕
          </button>
        </div>

        {/* Links */}
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <Item to="/" label="Ledger Dashboard" icon="📒" />
          <Item to="/sales" label="Sales Page" icon="➕" />

          <div
            style={{
              marginTop: 6,
              padding: "8px 10px",
              borderRadius: 12,
              background: "#f6f8ff",
              border: `1px solid ${palette.border}`,
              fontWeight: 900,
              fontSize: 11,
              color: palette.primary2,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}
          >
            Reports
          </div>

          <Item to="/ledger/sales" label="Sales Ledger Dashboard" icon="📊" />
          <Item to="/ledger/purchases" label="Supplier Ledger Dashboard" icon="🧾" />

          <div
            style={{
              marginTop: 6,
              padding: "8px 10px",
              borderRadius: 12,
              background: "#f6f8ff",
              border: `1px solid ${palette.border}`,
              fontWeight: 900,
              fontSize: 11,
              color: palette.primary2,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}
          >
            Stock
          </div>

          <Item to="/stock" label="Stock Dashboard" icon="📈" />
          <Item to="/available-stock" label="Available Stock" icon="📦" />

          <div
            style={{
              marginTop: 6,
              padding: "8px 10px",
              borderRadius: 12,
              background: "#f6f8ff",
              border: `1px solid ${palette.border}`,
              fontWeight: 900,
              fontSize: 11,
              color: palette.primary2,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}
          >
            Settings
          </div>

          <Item to="/company-balance" label="Company Balance" icon="🏦" />
          <Item to="/admin" label="Admin Panel" icon="🛠️" />
        </div>

        {/* Footer tip */}
        <div style={{ marginTop: "auto", fontSize: 11, color: palette.muted, fontWeight: 700 }}>
          Tip: Client/Supplier detail pages open from tables (dynamic routes).
        </div>
      </div>
    </div>
  );
}
