// src/AppLayout.js
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background:
          "radial-gradient(1200px 600px at 10% 10%, #eef3ff 0%, transparent 55%)," +
          "radial-gradient(1200px 600px at 90% 20%, #f1f7ff 0%, transparent 55%)," +
          "linear-gradient(180deg, #f8faff 0%, #f5f7fb 100%)",
      }}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: "18px",
          transition: "all 0.2s ease",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}
