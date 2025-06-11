import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

function Layout() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!token || !user) {
    return (
      <p style={{ textAlign: "center", color: "red" }}>
        Vous devez être connecté.
      </p>
    );
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar user={user} onLogout={handleLogout} />
      <div
        className="main-content-with-sidebar"
        style={{ flex: 1, padding: "20px" }}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
