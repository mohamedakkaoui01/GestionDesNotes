import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "../../css/TeacherCss/TeacherDashboard.css";

function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [topBottomScorers, setTopBottomScorers] = useState({
    top: [],
    bottom: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = await api.getUser();
        if (user.role !== "enseignant" || !user.teacher) {
          throw new Error(
            "Accès interdit : vous devez être connecté en tant qu'enseignant."
          );
        }

        const teacherId = user.teacher.id;

        const [teacherClasses, teacherSubjects, teacherGrades] =
          await Promise.all([
            api.getTeacherClasses(),
            api.getTeacherSubjects(),
            api.getGrades({ teacher_id: teacherId }),
          ]);

        setClasses(teacherClasses);
        setSubjects(teacherSubjects);

        if (!Array.isArray(teacherGrades)) {
          throw new Error("Format de données invalide reçu du serveur.");
        }

        // Top & Bottom Scorers
        const studentStats = {};
        teacherGrades.forEach(({ grade, student }) => {
          const id = student?.id;
          const name = student?.user?.name || "Inconnu";
          if (!id) return;

          if (!studentStats[id])
            studentStats[id] = { name, total: 0, count: 0 };
          studentStats[id].total += grade;
          studentStats[id].count++;
        });

        const averages = Object.entries(studentStats).map(
          ([id, { name, total, count }]) => ({
            id,
            name,
            average: count ? (total / count).toFixed(2) : "-",
          })
        );

        averages.sort((a, b) => b.average - a.average);

        setTopBottomScorers({
          top: averages.slice(0, 3),
          bottom: averages.slice(-3).reverse(),
        });

        // Recent Activities
        const last5 = [...teacherGrades]
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 5);

        setRecentActivities(last5);
      } catch (err) {
        console.error("Dashboard Error:", err);
        setError(
          err.message ||
            "Une erreur est survenue lors du chargement des données."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Date invalide";
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">Chargement du tableau de bord…</div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p className="error-message">{error}</p>
        <button
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard-page">
      <div className="dashboard-container">
        <h2>Tableau de bord</h2>
        <div className="dashboard-content">
          <div className="dashboard-layout">
            {/* Teacher's Subjects */}
            <div className="subjects-container">
              <section className="teacher-subjects-section">
                <h3>Mes Matières</h3>
                {subjects.length === 0 ? (
                  <p className="no-data">Aucune matière assignée</p>
                ) : (
                  <ul className="subjects-list">
                    {subjects
                      .reduce((uniqueItems, item) => {
                        // Create a unique key for each subject
                        const subjectId =
                          item.id ||
                          item.subject?.id ||
                          Math.random().toString(36).substr(2, 9);
                        const subjectName =
                          item.subject?.name || item.name || "Matière inconnue";

                        // Check if we've already processed this subject
                        if (!uniqueItems.some((ui) => ui.id === subjectId)) {
                          const classes = Array.isArray(item.classes)
                            ? item.classes
                            : [];
                          const firstLetter = subjectName
                            .charAt(0)
                            .toUpperCase();

                          uniqueItems.push({
                            id: subjectId,
                            name: subjectName,
                            classes: classes,
                            firstLetter: firstLetter,
                          });
                        }
                        return uniqueItems;
                      }, [])
                      .map((subject, idx) => (
                        <li key={subject.id} className="subject-item">
                          <div className="subject-info">
                            <div className="subject-icon">
                              {subject.firstLetter}
                            </div>
                            <div>
                              <div className="subject-name">{subject.name}</div>
                              {subject.classes.length > 0 && (
                                <div className="subject-classes">
                                  Classes:{" "}
                                  {subject.classes.map((c, i) => (
                                    <span key={`${subject.id}-class-${i}`}>
                                      {typeof c === "object"
                                        ? c.name || "Classe inconnue"
                                        : c}
                                      {i < subject.classes.length - 1
                                        ? ", "
                                        : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Performance Section */}
            <div className="performance-container">
              <section className="performance-section">
                <h3>Performance des élèves</h3>
                <div className="student-performance-summary">
                  <div className="performance-columns">
                    <div>
                      <h4>Top 3</h4>
                      <ul className="student-rank-list">
                        {topBottomScorers.top.length > 0 ? (
                          topBottomScorers.top.map((s, index) => (
                            <li key={s.id} className="student-rank-item">
                              <span className="rank-emoji">
                                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                              </span>
                              <span className="student-name">{s.name}</span>
                            </li>
                          ))
                        ) : (
                          <li className="no-data">Aucune donnée disponible</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4>Flop 3</h4>
                      <ul className="student-rank-list">
                        {topBottomScorers.bottom.length > 0 ? (
                          topBottomScorers.bottom.map((s, index) => (
                            <li key={s.id} className="student-rank-item">
                              <span className="rank-emoji">
                                {index === 0 ? "😟" : index === 1 ? "😕" : "😔"}
                              </span>
                              <span className="student-name">{s.name}</span>
                            </li>
                          ))
                        ) : (
                          <li className="no-data">Aucune donnée disponible</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Recent Activity Section */}
          <section className="recent-activity-section">
            <h3>Activité récente</h3>
            {recentActivities.length === 0 ? (
              <p className="no-activity">Aucune activité récente.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Élève</th>
                      <th>Matière</th>
                      <th>Note</th>
                      <th>Année</th>
                      <th>Mis à jour</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.map((activity) => {
                      return (
                        <tr key={activity.id}>
                          <td>{activity.student?.user?.name || "Inconnu"}</td>
                          <td>{activity.subject?.name || "N/A"}</td>
                          <td>{activity.grade}/20</td>
                          <td>
                            {(() => {
                              const yearData = activity.academic_year;
                              if (!yearData) return activity.year || "—";
                              if (typeof yearData === "object") {
                                return yearData.name || yearData.label || "—";
                              }
                              return yearData;
                            })()}
                          </td>
                          <td>{formatDate(activity.updated_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
