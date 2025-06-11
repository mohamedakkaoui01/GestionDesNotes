import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiFilter, FiAlertCircle, FiInfo } from "react-icons/fi";
import "../../css/Admin/bulletin.css";
import api from "../../services/api";

const API_URL = "http://localhost:8000/api";

const GRADE_PERIODS = {
  CC1: "Contrôle Continu 1",
  CC2: "Contrôle Continu 2",
  CC3: "Contrôle Continu 3",
  EXAM_FINAL: "Examen Final",
};

function StudentGrades() {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [grades, setGrades] = useState([]);
  const [averages, setAverages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [subjects, setSubjects] = useState([]);

  // Fetch current user (student)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.role === "étudiant") {
          setStudentId(response.data.student.id);
        } else {
          setError("Vous devez être connecté en tant qu'étudiant.");
        }
      } catch (err) {
        setError("Erreur lors de la récupération de l'utilisateur");
        console.error(err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch academic years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/academic-years`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAcademicYears(response.data);
        if (response.data.length > 0) {
          setSelectedYear(response.data[0].id);
        }
      } catch (err) {
        setError("Erreur lors du chargement des années académiques");
        console.error(err);
      }
    };
    fetchAcademicYears();
  }, []);

  // Fetch grades and averages when year changes AND showResults is true
  useEffect(() => {
    if (!showResults || !studentId) return;
    const fetchGradesAndAverages = async () => {
      if (!selectedYear) return;
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        // Fetch grades
        const gradesResponse = await axios.get(`${API_URL}/grades`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            student_id: studentId,
            academic_year_id: selectedYear,
            all: 1,
          },
        });
        // Fetch averages
        const averagesResponse = await axios.get(
          `${API_URL}/students/${studentId}/averages/${selectedYear}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setGrades(gradesResponse.data.data);
        setAverages(averagesResponse.data);
      } catch (err) {
        setError("Erreur lors du chargement des notes");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGradesAndAverages();
  }, [studentId, selectedYear, showResults]);

  // Reset results if year changes
  useEffect(() => {
    setShowResults(false);
    setGrades([]);
    setAverages(null);
  }, [selectedYear]);

  // Fetch subjects for the student when studentId is available
  useEffect(() => {
    if (!studentId) return;
    const fetchSubjects = async () => {
      try {
        const subjectsData = await api.getStudentSubjects();
        setSubjects(subjectsData);
      } catch (err) {
        setError("Erreur lors du chargement des matières");
        console.error(err);
      }
    };
    fetchSubjects();
  }, [studentId]);

  // Group grades by subject and period using grading_period from API
  const gradesBySubject = grades.reduce((acc, grade) => {
    const subjectId = grade.subject.id;
    if (!acc[subjectId]) {
      acc[subjectId] = {
        subject: grade.subject,
        periods: {
          CC1: null,
          CC2: null,
          CC3: null,
          EXAM_FINAL: null,
        },
      };
    }
    // Use the grading_period field from the API
    let periodKey = null;
    if (grade.grading_period) {
      const normalized = grade.grading_period
        .replace(/\s+/g, "_")
        .toUpperCase();
      if (
        normalized === "CC1" ||
        normalized === "CC2" ||
        normalized === "CC3" ||
        normalized === "EXAM_FINAL" ||
        normalized === "EXAMEN_FINAL"
      ) {
        periodKey = normalized === "EXAMEN_FINAL" ? "EXAM_FINAL" : normalized;
      }
    }
    if (periodKey && acc[subjectId].periods.hasOwnProperty(periodKey)) {
      acc[subjectId].periods[periodKey] = grade.grade;
    }
    return acc;
  }, {});

  // Check if all grades for all subjects and all periods are present
  const uniqueSubjects = subjects.filter(
    (subject, index, self) =>
      index === self.findIndex((s) => s.id === subject.id)
  );
  const allGradesPresent = uniqueSubjects.every((subject) => {
    const subjectGrades = gradesBySubject[subject.id] || { periods: {} };
    return Object.keys(GRADE_PERIODS).every(
      (period) =>
        subjectGrades.periods[period] !== null &&
        subjectGrades.periods[period] !== undefined
    );
  });

  return (
    <div className="management-page">
      <h2>Mon Bulletin de Notes</h2>
      <div
        style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}
      >
        <div className="form-group" style={{ flex: 1, minWidth: 250 }}>
          <label
            style={{
              color: "var(--color-purple)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiFilter /> Année Académique
          </label>
          <select
            className="form-control"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Sélectionner une année</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => setShowResults(true)}
        disabled={!selectedYear}
        style={{ marginBottom: "1.5rem" }}
      >
        Générer le bulletin
      </button>
      {error && (
        <div className="error-message">
          <FiAlertCircle /> {error}
        </div>
      )}
      {loading && showResults ? (
        <div className="loading-message">Chargement...</div>
      ) : showResults && selectedYear ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Matière</th>
                {Object.entries(GRADE_PERIODS).map(([key, label]) => (
                  <th key={key}>{label}</th>
                ))}
                <th>Moyenne</th>
              </tr>
            </thead>
            <tbody>
              {subjects
                .filter(
                  (subject, index, self) =>
                    index === self.findIndex((s) => s.id === subject.id)
                )
                .map((subject) => {
                  const subjectGrades = gradesBySubject[subject.id] || {
                    subject,
                    periods: {
                      CC1: null,
                      CC2: null,
                      CC3: null,
                      EXAM_FINAL: null,
                    },
                  };
                  return (
                    <tr key={subject.id}>
                      <td>{subject.name}</td>
                      {Object.entries(GRADE_PERIODS).map(([period, _]) => (
                        <td key={period}>
                          {subjectGrades.periods[period] !== null ? (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 8px",
                                margin: "0 4px",
                                backgroundColor: "#ebf8ff",
                                borderRadius: 4,
                                color: "#2b6cb0",
                                fontWeight: 500,
                              }}
                            >
                              {subjectGrades.periods[period]}
                            </span>
                          ) : (
                            "--"
                          )}
                        </td>
                      ))}
                      <td>
                        {averages?.subject_averages
                          .find((avg) => avg.subject.id === subject.id)
                          ?.average.toFixed(2) || "--"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={Object.keys(GRADE_PERIODS).length + 1}
                  style={{
                    fontWeight: 600,
                    color: "#2d3748",
                    textAlign: "right",
                  }}
                >
                  Moyenne Générale
                </td>
                <td
                  style={{
                    fontWeight: 600,
                    color: "#2d3748",
                    fontSize: "1.1rem",
                  }}
                >
                  {allGradesPresent && averages?.general_average
                    ? averages.general_average.toFixed(2)
                    : "--"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <FiInfo /> Veuillez sélectionner une année académique puis cliquer sur
          "Générer le bulletin"
        </div>
      )}
    </div>
  );
}

export default StudentGrades;
