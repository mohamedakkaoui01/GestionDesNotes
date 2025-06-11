import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import "../../css/TeacherCss/etudiants.css";

function BulletinScolaire() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        const userData = await api.getUser();
        if (userData.role !== "enseignant" || !userData.teacher) {
          throw new Error("Accès réservé aux enseignants");
        }

        setTeacherId(userData.teacher.id);

        // Fetch classes, subjects, and academic years in parallel
        const [teacherClasses, teacherSubjects, years] = await Promise.all([
          api.getTeacherClasses(),
          api.getTeacherSubjects(),
          api.getAcademicYears(),
        ]);

        setClasses(teacherClasses);

        // Transform subjects to match the expected structure if needed
        const transformedSubjects = Array.isArray(teacherSubjects)
          ? teacherSubjects.map((subject) => ({
              ...subject,
              // Ensure subject has a classes array
              classes:
                subject.classes || [subject.class]?.filter(Boolean) || [],
            }))
          : [];

        setAllSubjects(transformedSubjects);
        setAcademicYears(years);
      } catch (err) {
        console.error("Initialization Error:", err);
        setError(err.message || "Erreur lors de l'initialisation");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Reset selected subject when class changes
  useEffect(() => {
    if (selectedClassId) {
      setSelectedSubjectId("");
    }
  }, [selectedClassId]);

  // Fetch students when class is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassId) {
        setStudents([]);
        return;
      }
      try {
        const studentsData = await api.getTeacherClassStudents(selectedClassId);
        setStudents(studentsData);
      } catch (err) {
        setError("Erreur lors du chargement des étudiants");
      }
    };

    fetchStudents();
  }, [selectedClassId]);

  // Fetch grades when filters change
  const fetchGrades = useCallback(async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedYear) {
      setGrades([]);
      return;
    }

    try {
      setIsGenerating(true);
      const gradesData = await api.getGrades({
        class_id: selectedClassId,
        subject_id: selectedSubjectId,
        academic_year: selectedYear,
      });
      setGrades(gradesData);
    } catch (err) {
      console.error("Error fetching grades:", err);
      setError("Erreur lors du chargement des notes");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedClassId, selectedSubjectId, selectedYear]);

  // Calculate student averages
  const calculateAverages = useCallback(() => {
    const studentGrades = {};

    grades.forEach((grade) => {
      if (!studentGrades[grade.student_id]) {
        studentGrades[grade.student_id] = {
          name:
            students.find((s) => s.id === grade.student_id)?.user?.name ||
            "Inconnu",
          cc1: null,
          cc2: null,
          cc3: null,
          exam: null,
        };
      }

      // Map grade types to their values
      if (grade.type === "CC1")
        studentGrades[grade.student_id].cc1 = parseFloat(grade.grade);
      else if (grade.type === "CC2")
        studentGrades[grade.student_id].cc2 = parseFloat(grade.grade);
      else if (grade.type === "CC3")
        studentGrades[grade.student_id].cc3 = parseFloat(grade.grade);
      else if (grade.type === "EXAM")
        studentGrades[grade.student_id].exam = parseFloat(grade.grade);
    });

    // Calculate averages
    Object.values(studentGrades).forEach((student) => {
      const ccGrades = [student.cc1, student.cc2, student.cc3].filter(
        (g) => g !== null
      );
      const ccAverage =
        ccGrades.length > 0
          ? ccGrades.reduce((sum, grade) => sum + grade, 0) / ccGrades.length
          : 0;

      student.average =
        student.exam !== null ? ccAverage * 0.4 + student.exam * 0.6 : null;
    });

    return Object.values(studentGrades);
  }, [grades, students]);

  const studentAverages = calculateAverages();

  if (loading) {
    return <div className="loading">Chargement en cours...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="bulletin-container">
      <h2>Bulletin Scolaire</h2>

      <div className="filters">
        <div className="filter-group">
          <label>Classe:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">Sélectionnez une classe</option>
            {classes.map((classe) => (
              <option key={classe.id} value={classe.id}>
                {classe.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Matière:</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={!selectedClassId}
            className={!selectedClassId ? "disabled" : ""}
          >
            <option value="">Sélectionnez une matière</option>
            {allSubjects
              .filter((subject) => {
                if (!selectedClassId) return false;
                return subject.classes?.some(
                  (c) => c.id.toString() === selectedClassId
                );
              })
              .filter((item, index, self) => {
                // Filter out duplicate subjects by ID - same as in GradesManagement.jsx
                const subjectId = item.subject?.id || item.id;
                return (
                  subjectId &&
                  self.findIndex(
                    (i) => (i.subject?.id || i.id) === subjectId
                  ) === index
                );
              })
              .map((item) => {
                const subjectId = item.subject?.id || item.id;
                const subjectName =
                  item.subject?.name || item.name || "Matière inconnue";

                return (
                  <option key={`subject-${subjectId}`} value={subjectId}>
                    {subjectName}
                  </option>
                );
              })}
          </select>
        </div>

        <div className="filter-group">
          <label>Année Scolaire:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className={!selectedYear ? "disabled" : ""}
          >
            <option value="">Sélectionnez une année</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name ||
                  year.label ||
                  `${year.start_year}/${year.end_year}`}
              </option>
            ))}
          </select>
        </div>

        <button
          className="generate-btn"
          onClick={fetchGrades}
          disabled={
            !selectedClassId ||
            !selectedSubjectId ||
            !selectedYear ||
            isGenerating
          }
        >
          {isGenerating ? "Génération en cours..." : "Générer le bulletin"}
        </button>
      </div>

      {grades.length > 0 && (
        <div className="grades-table-container">
          <table className="grades-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>CC1</th>
                <th>CC2</th>
                <th>CC3</th>
                <th>Examen</th>
                <th>Moyenne</th>
              </tr>
            </thead>
            <tbody>
              {studentAverages.map((student, index) => (
                <tr key={index}>
                  <td>{student.name}</td>
                  <td>{student.cc1?.toFixed(2) || "-"}</td>
                  <td>{student.cc2?.toFixed(2) || "-"}</td>
                  <td>{student.cc3?.toFixed(2) || "-"}</td>
                  <td>{student.exam?.toFixed(2) || "-"}</td>
                  <td
                    className={student.average !== null ? "average-cell" : ""}
                  >
                    {student.average ? student.average.toFixed(2) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BulletinScolaire;
