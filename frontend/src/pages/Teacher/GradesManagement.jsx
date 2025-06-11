import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "../../css/TeacherCss/GradesManagement.css";
import { FiEdit, FiTrash2 } from "react-icons/fi";

function GradesManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [uniqueAcademicYears, setUniqueAcademicYears] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [editGradeId, setEditGradeId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    subject_id: "",
    academic_year_id: "",
    grade: "",
    grading_period: "",
  });
  const [filterSubject, setFilterSubject] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStudent, setFilterStudent] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await api.getUser();
        if (userData.role !== "enseignant" || !userData.teacher) {
          throw new Error("Accès interdit : vous devez être un enseignant.");
        }
        setTeacherId(userData.teacher.id);
        const teacherClasses = await api.getTeacherClasses();
        setClasses(teacherClasses);
        const teacherSubjects = await api.getTeacherSubjects();
        setSubjects(teacherSubjects);
        // Recuperation des annees scolaires
        const years = await api.getAcademicYears();
        setUniqueAcademicYears(years);
      } catch (err) {
        setError(err.message || "Erreur lors de l'initialisation.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassId) {
        setStudents([]);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const studentsData = await api.getTeacherClassStudents(selectedClassId);
        setStudents(studentsData);
      } catch (err) {
        setError(
          err.message || "Erreur lors de la récupération des étudiants."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClassId]);

  useEffect(() => {
    // Reset des matieres et des étudiants lors du changement de classe
    setSelectedSubjectId("");
    setFormData((prev) => ({ ...prev, student_id: "", subject_id: "" }));
  }, [selectedClassId]);

  useEffect(() => {
    // Reset des étudiants lors du changement de matière
    setFormData((prev) => ({ ...prev, student_id: "" }));
  }, [selectedSubjectId]);

  useEffect(() => {
    if (formMode === "edit") setShowForm(true);
  }, [formMode]);

  // Filtre des matieres pour la classe selectionnée
  const filteredSubjects = selectedClassId
    ? subjects.filter((item) =>
        item.classes.some((c) => c.id.toString() === selectedClassId)
      )
    : [];

  // Filtre des etudiants pour la classe selectionnee
  const filteredStudents = students;

  const fetchGradesAndBuildData = async (teacherIdParam) => {
    try {
      setLoading(true);
      const teacherGrades = await api.getGrades({ teacher_id: teacherIdParam });

      if (!Array.isArray(teacherGrades)) {
        throw new Error("Format de données invalide reçu du serveur.");
      }

      setGrades(teacherGrades);
    } catch (err) {
      console.error("Data Fetch Error:", err);
      setError(err.message || "Erreur lors de la récupération des notes.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const grade = parseFloat(formData.grade);
    if (isNaN(grade) || grade < 0 || grade > 20) {
      throw new Error("La note doit être comprise entre 0 et 20.");
    }

    // Check if a grade already exists for this student, subject, and period
    const existingGrade = grades.find(
      (g) =>
        g.student_id === parseInt(formData.student_id) &&
        g.subject_id === parseInt(formData.subject_id) &&
        g.grading_period === formData.grading_period &&
        g.id !== editGradeId // Exclude current grade when editing
    );

    if (existingGrade) {
      throw new Error(
        `Une note existe déjà pour cette période (${formData.grading_period}) pour cet élève dans cette matière.`
      );
    }

    return true;
  };

  const showFeedback = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      console.log("Form submission started with data:", formData);

      // Validate form data
      validateForm();

      if (formMode === "add") {
        console.log("Creating new grade with data:", {
          student_id: formData.student_id,
          subject_id: formData.subject_id,
          academic_year_id: formData.academic_year_id,
          grade: formData.grade,
          grading_period: formData.grading_period,
        });

        const response = await api.createGrade({
          student_id: parseInt(formData.student_id),
          subject_id: parseInt(formData.subject_id),
          academic_year_id: parseInt(formData.academic_year_id),
          grade: parseFloat(formData.grade),
          grading_period: formData.grading_period,
        });

        console.log("Grade created successfully:", response);
        showFeedback("Note ajoutée avec succès !");
      } else if (formMode === "edit" && editGradeId) {
        console.log("Updating grade:", {
          id: editGradeId,
          grade: formData.grade,
        });
        const response = await api.updateGrade(editGradeId, {
          grade: parseFloat(formData.grade),
        });
        console.log("Grade updated successfully:", response);
        showFeedback("Note mise à jour avec succès !");
      }

      resetForm();
      await fetchGradesAndBuildData(teacherId);
    } catch (err) {
      console.error("Form Submit Error:", err);
      showFeedback(
        err.message ||
          "Une erreur est survenue lors de l'enregistrement de la note."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormMode("add");
    setEditGradeId(null);
    setFormData({
      student_id: "",
      subject_id: "",
      academic_year_id: "",
      grade: "",
      grading_period: "",
    });
  };

  const handleEditClick = (grade) => {
    setFormMode("edit");
    setEditGradeId(grade.id);
    setFormData({
      student_id: grade.student.id.toString(),
      subject_id: grade.subject.id.toString(),
      academic_year_id: grade.academic_year.id.toString(),
      grade: grade.grade.toString(),
      grading_period: grade.grading_period,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette note ?")) return;
    try {
      setLoading(true);
      await api.deleteGrade(id);
      showFeedback("Note supprimée avec succès !");
      await fetchGradesAndBuildData(teacherId);
    } catch (err) {
      console.error("Delete Error:", err);
      showFeedback(
        err.message ||
          "Une erreur est survenue lors de la suppression de la note."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teacherId) {
      fetchGradesAndBuildData(teacherId);
    }
  }, [teacherId]);

  // Group grades by student and subject
  const periods = ["CC1", "CC2", "CC3", "Exam final"];
  const gradesByStudentSubject = {};
  grades.forEach((grade) => {
    const studentId = grade.student?.id;
    const subjectId = grade.subject?.id;
    if (!studentId || !subjectId) return;
    const key = `${studentId}-${subjectId}`;
    if (!gradesByStudentSubject[key]) {
      gradesByStudentSubject[key] = {
        student: grade.student,
        subject: grade.subject,
        academic_year: grade.academic_year,
        grades: {},
      };
    }
    gradesByStudentSubject[key].grades[grade.grading_period] = grade;
  });

  // Filtered rows for the table
  const filteredRows = Object.values(gradesByStudentSubject).filter((entry) => {
    const matchSubject =
      !filterSubject || entry.subject?.id?.toString() === filterSubject;
    const matchYear =
      !filterYear || entry.academic_year?.id?.toString() === filterYear;
    const matchStudent =
      !filterStudent || entry.student?.id?.toString() === filterStudent;
    return matchSubject && matchYear && matchStudent;
  });

  // Unique students for the filter dropdown (from grades)
  const studentsForFilter = Array.from(
    new Map(
      grades
        .map((g) => g.student)
        .filter(Boolean)
        .map((s) => [s.id, s])
    ).values()
  );

  if (loading) {
    return (
      <div className="grades-loading">
        <p>Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grades-error">
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
    <div className="gestion-notes-container">
      {feedbackMessage && (
        <div className="feedback-message">{feedbackMessage}</div>
      )}
      <div className="grades-header">
        <h2>Gestion des notes</h2>
        {!showForm && (
          <button
            className="ajouter-toggle-button"
            onClick={() => {
              setShowForm((prev) => !prev);
              setFormMode("add");
              setEditGradeId(null);
              setFormData({
                student_id: "",
                subject_id: "",
                academic_year_id: "",
                grade: "",
                grading_period: "",
              });
            }}
            disabled={showForm && formMode === "edit"}
          >
            {showForm && formMode === "add"
              ? "Fermer le formulaire"
              : "Ajouter une note"}
          </button>
        )}
      </div>

      {showForm && (
        <section className="form-section">
          <h3>
            {formMode === "add" ? "Ajouter une note" : "Modifier une note"}
          </h3>
          <form onSubmit={handleFormSubmit} className="grade-form">
            <div className="form-row">
              <label>Classe :</label>
              <select
                name="class_id"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                required
                disabled={formMode === "edit" || isSubmitting}
                className="class-select"
              >
                <option value="">-- Sélectionnez une classe --</option>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Matière :</label>
              <select
                name="subject_id"
                value={formData.subject_id}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  handleFormChange(e);
                }}
                required
                disabled={
                  !selectedClassId || formMode === "edit" || isSubmitting
                }
              >
                <option value="">-- Sélectionnez une matière --</option>
                {filteredSubjects
                  .filter((item, index, self) => {
                    // Filter out duplicate subjects by ID
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
                      <option key={`subj-${subjectId}`} value={subjectId}>
                        {subjectName}
                      </option>
                    );
                  })}
              </select>
            </div>
            <div className="form-row">
              <label>Élève :</label>
              <select
                name="student_id"
                value={formData.student_id}
                onChange={handleFormChange}
                required
                disabled={
                  !selectedClassId ||
                  !formData.subject_id ||
                  formMode === "edit" ||
                  isSubmitting
                }
              >
                <option value="">-- Sélectionnez un élève --</option>
                {filteredStudents.map((stu) => (
                  <option key={stu.id} value={stu.id}>
                    {stu.user?.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Année scolaire :</label>
              <select
                name="academic_year_id"
                value={formData.academic_year_id}
                onChange={handleFormChange}
                required
                disabled={formMode === "edit" || isSubmitting}
              >
                <option value="">-- Sélectionnez une année --</option>
                {uniqueAcademicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Période d'évaluation :</label>
              <select
                name="grading_period"
                value={formData.grading_period}
                onChange={handleFormChange}
                required
                disabled={isSubmitting}
              >
                <option value="">-- Sélectionnez une période --</option>
                <option value="CC1">CC1</option>
                <option value="CC2">CC2</option>
                <option value="CC3">CC3</option>
                <option value="Exam final">Exam final</option>
              </select>
            </div>
            <div className="form-row">
              <label>Note (/20) :</label>
              <input
                type="number"
                name="grade"
                value={formData.grade}
                onChange={handleFormChange}
                min="0"
                max="20"
                step="0.1"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Enregistrement..."
                  : formMode === "add"
                  ? "Ajouter"
                  : "Mettre à jour"}
              </button>
              <button
                type="button"
                className="btn-annuler"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Annuler
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="grades-list">
        <h3>Liste des notes</h3>
        <div
          className="grades-filters"
          style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
        >
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="">Toutes les matières</option>
            {subjects
              .filter((item, index, self) => {
                // Filter out duplicate subjects by ID
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
                  <option key={`filter-subj-${subjectId}`} value={subjectId}>
                    {subjectName}
                  </option>
                );
              })}
          </select>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="">Toutes les années</option>
            {uniqueAcademicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>
                {ay.label}
              </option>
            ))}
          </select>
          <select
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
          >
            <option value="">Tous les étudiants</option>
            {studentsForFilter.map((stu) => (
              <option key={stu.id} value={stu.id}>
                {stu.user?.name}
              </option>
            ))}
          </select>
        </div>
        {grades.length === 0 ? (
          <p className="no-grades">Aucune note enregistrée.</p>
        ) : (
          <table className="grades-table">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Matière</th>
                <th>Année</th>
                {periods.map((period) => (
                  <th key={period}>{period}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((entry) => (
                <tr key={`${entry.student?.id}-${entry.subject?.id}`}>
                  <td>{entry.student?.user?.name || "Inconnu"}</td>
                  <td>{entry.subject?.name || "Inconnue"}</td>
                  <td>{entry.academic_year?.label || "Inconnue"}</td>
                  {periods.map((period) => (
                    <td key={period}>
                      {entry.grades[period] ? (
                        <div className="grade-period-cell">
                          <span>{entry.grades[period].grade}/20</span>
                          <div className="grade-period-actions">
                            <button
                              onClick={() =>
                                handleEditClick(entry.grades[period])
                              }
                              className="icon-btn-small modify"
                              disabled={isSubmitting}
                              title="Modifier"
                            >
                              <FiEdit />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteClick(entry.grades[period].id)
                              }
                              className="icon-btn-small delete"
                              disabled={isSubmitting}
                              title="Supprimer"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default GradesManagement;
