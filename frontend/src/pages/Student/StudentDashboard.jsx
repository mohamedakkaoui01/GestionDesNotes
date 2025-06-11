import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../css/Student/studentdashboard.css";

function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Vous devez être connecté.");
        }

        // Get user info
        const userResponse = await axios.get("http://localhost:8000/api/user", {
          headers: { Authorization: "Bearer " + token },
        });

        if (userResponse.data.role !== "étudiant") {
          throw new Error("Accès refusé. Réservé aux étudiants.");
        }

        setStudent(userResponse.data);

        // Get class info
        const classResponse = await axios.get(
          "http://localhost:8000/api/student/class",
          {
            headers: { Authorization: "Bearer " + token },
          }
        );

        setClassInfo(classResponse.data);

        // Get subjects
        const subjectsResponse = await axios.get(
          "http://localhost:8000/api/student/subjects",
          {
            headers: { Authorization: "Bearer " + token },
          }
        );

        setSubjects(subjectsResponse.data);
      } catch (err) {
        console.error("Dashboard Error:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Une erreur est survenue."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  function getUniqueTeachers(teachers) {
    const seen = new Set();
    return (teachers || []).filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }

  function groupSubjects(subjects) {
    const map = new Map();
    for (const subject of subjects) {
      if (!map.has(subject.id)) {
        map.set(subject.id, {
          ...subject,
          teachers: [...(subject.teachers || [])],
        });
      } else {
        // Merge teachers, avoiding duplicates
        const existing = map.get(subject.id);
        const allTeachers = [...existing.teachers, ...(subject.teachers || [])];
        // Remove duplicate teachers by id
        const uniqueTeachers = [];
        const seen = new Set();
        for (const t of allTeachers) {
          if (!seen.has(t.id)) {
            seen.add(t.id);
            uniqueTeachers.push(t);
          }
        }
        existing.teachers = uniqueTeachers;
      }
    }
    return Array.from(map.values());
  }

  if (loading) {
    return (
      <div className="loading-message">Chargement du tableau de bord...</div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="student-dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-content">
          <h1 className="student-title">Bienvenue, {student?.name}</h1>
          <p className="student-subtitle">Tableau de bord étudiant</p>

          {/* Class Information Section */}
          <section className="class-info-section">
            <div className="section-header">
              <h2 className="section-title">Ma Classe</h2>
            </div>
            {classInfo ? (
              <div className="class-info">
                <div className="class-card">
                  <h3 className="class-name">{classInfo.name}</h3>
                  <p className="class-students">
                    {classInfo.students?.length || 0} étudiants dans la classe
                  </p>
                </div>
              </div>
            ) : (
              <p className="no-data">Aucune information de classe disponible</p>
            )}
          </section>

          {/* Subjects Section */}
          <section className="subjects-section">
            <div className="section-header">
              <h2 className="section-title">Mes Matières</h2>
            </div>
            {subjects.length > 0 ? (
              <div className="subjects-grid">
                {groupSubjects(subjects).map((subject) => (
                  <div key={subject.id} className="subject-card">
                    <h3 className="subject-name">{subject.name}</h3>
                    {getUniqueTeachers(subject.teachers).map((teacher) => (
                      <p key={teacher.id} className="teacher-name">
                        Enseignant: {teacher.user?.name}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">Aucune matière disponible</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
