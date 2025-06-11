import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../css/common.css";
import "../../css/Admin/admindashboard.css";

function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({
    students: 0,
    subjects: 0,
    teachers: 0,
    classesCount: 0,
  });
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(function () {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Vous devez être connecté.");
      return;
    }

    axios
      .get("http://localhost:8000/api/user", {
        headers: {
          Authorization: "Bearer " + token,
        },
      })
      .then(function (response) {
        if (
          response.data.role !== "admin" &&
          response.data.role !== "super admin"
        ) {
          setError("Accès refusé. Réservé aux administrateurs.");
          return;
        }

        setAdmin(response.data);

        const statsPromise = axios.get(
          "http://localhost:8000/api/dashboard-stats",
          {
            headers: { Authorization: "Bearer " + token },
          }
        );

        const classesPromise = axios.get("http://localhost:8000/api/classes", {
          headers: { Authorization: "Bearer " + token },
        });

        return Promise.all([statsPromise, classesPromise]);
      })
      .then(function (results) {
        if (results) {
          setStats({
            students: results[0].data.students,
            subjects: results[0].data.subjects,
            teachers: results[0].data.teachers,
            classesCount: results[0].data.classesCount,
          });
          setClasses(results[1].data);
        }
      })
      .catch(function () {
        setError("Erreur lors du chargement du tableau de bord.");
      });
  }, []);

  // Navigation functions for stats cards
  function goToStudentsManagement() {
    navigate("/admin/students");
  }

  function goToSubjectsManagement() {
    navigate("/admin/subjects");
  }

  function goToTeachersManagement() {
    navigate("/admin/teachers");
  }

  function goToClassesManagement() {
    navigate("/admin/classes");
  }

  // Navigation functions for add buttons
  function goToAddStudent() {
    navigate("/admin/add-student");
  }

  function goToAddSubject() {
    navigate("/admin/add-subject");
  }

  function goToAddTeacher() {
    navigate("/admin/add-teacher");
  }

  function goToAddClass() {
    navigate("/admin/add-class");
  }

  function goToClassDetails(id) {
    navigate("/admin/class/" + id);
  }

  if (error) {
    return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  }

  if (!admin) {
    return <p style={{ textAlign: "center" }}>Chargement...</p>;
  }

  return (
    <div className="admin-dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-content">
          <h1 className="admin-title">Bienvenue, {admin.name}</h1>
          <p className="admin-subtitle">Tableau de bord administrateur</p>

          <div className="stats-container">
            <div
              className="stat-card clickable-card"
              onClick={goToStudentsManagement}
            >
              <div className="stat-content">
                <p className="stat-title">Total des étudiants</p>
                <p className="stat-value">{stats.students}</p>
              </div>
            </div>

            <div
              className="stat-card clickable-card"
              onClick={goToSubjectsManagement}
            >
              <div className="stat-content">
                <p className="stat-title">Total des matières</p>
                <p className="stat-value">{stats.subjects}</p>
              </div>
            </div>

            <div
              className="stat-card clickable-card"
              onClick={goToTeachersManagement}
            >
              <div className="stat-content">
                <p className="stat-title">Total des enseignants</p>
                <p className="stat-value">{stats.teachers}</p>
              </div>
            </div>

            <div
              className="stat-card clickable-card"
              onClick={goToClassesManagement}
            >
              <div className="stat-content">
                <p className="stat-title">Total des classes</p>
                <p className="stat-value">{stats.classesCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
