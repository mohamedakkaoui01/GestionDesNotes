import React from "react";
import { NavLink } from "react-router-dom";
import "../css/sidebar.css";

function Sidebar({ user, onLogout }) {
  const getMenuItems = () => {
    switch (user.role) {
      case "admin":
        return [
          { key: "dashboard", label: "Tableau de bord" },
          { key: "students", label: "Étudiants" },
          { key: "teachers", label: "Enseignants" },
          { key: "subjects", label: "Matières" },
          { key: "classes", label: "Classes" },
          { key: "bulletin", label: "Bulletin" },
        ];
      case "enseignant":
        return [
          { key: "dashboard", label: "Tableau de bord" },
          { key: "grades", label: "Gestion des notes" },
          { key: "students", label: "Mes étudiants" },
        ];
      case "étudiant":
        return [
          { key: "dashboard", label: "Tableau de bord" },
          { key: "grades", label: "Mes notes" },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>📚</h2>
        <p className="sidebar-user-name">{user.name}</p>
        <p className="sidebar-role">
          {user.role === "enseignant" ? "Enseignant" : user.role}
        </p>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.key}
            to={`/${user.role}/${item.key}`}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <button onClick={onLogout}>Déconnexion</button>
      </div>
    </div>
  );
}

export default Sidebar;
