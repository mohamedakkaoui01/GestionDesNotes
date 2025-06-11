import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiSave,
  FiUserPlus,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";
import "../../css/Admin/teachersmanagement.css";

// Feedback Message Component
const FeedbackMessage = ({ type, message, onClose }) => {
  const iconMap = {
    success: <FiCheckCircle className="feedback-icon" />,
    error: <FiXCircle className="feedback-icon" />,
    warning: <FiAlertCircle className="feedback-icon" />,
    info: <FiInfo className="feedback-icon" />,
  };

  return (
    <div className={`feedback-message feedback-${type}`}>
      <div className="feedback-content">
        {iconMap[type]}
        <span>{message}</span>
      </div>
      <button className="feedback-close" onClick={onClose}>
        <FiX size={16} />
      </button>
    </div>
  );
};

const API_URL = "http://localhost:8000/api";
const ROLE_ENSEIGNANT = "enseignant";

// Form component for adding/editing teachers
const TeacherForm = ({
  formData,
  onSubmit,
  onCancel,
  mode,
  subjects,
  classes,
  loading,
  onFormChange,
}) => (
  <div className="teacher-form-container">
    <h3>
      {mode === "add" ? "Ajouter un enseignant" : "Modifier l'enseignant"}
    </h3>
    <form onSubmit={onSubmit} className="teacher-form">
      <div className="form-row">
        <label>Nom complet</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={(e) => {
            const value = e.target.value;
            // Generate email based on name
            const email = value
              ? value
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-z0-9\s-]/g, "")
                  .trim()
                  .replace(/\s+/g, ".")
                  .replace(/\.+/g, ".")
                  .replace(/\.?@/, "@")
                  .replace(/[^a-z0-9@.-]/g, "")
                  .replace(/^[^a-z0-9]|[^a-z0-9]$/g, "")
                  .replace(/@.*$/, "")
                  .substring(0, 30)
                  .replace(/\.+$/, "") + "@school.ma"
              : "";

            onFormChange(e);
            onFormChange({
              target: {
                name: "email",
                value: email,
              },
            });
          }}
          required
          placeholder="Nom complet"
        />
      </div>

      <div className="form-row">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={onFormChange}
          required
          placeholder="email@example.com"
        />
      </div>

      <div className="form-row">
        <label>Matières</label>
        <div className="tm-subjects-scroll">
          {subjects.map((subject) => (
            <div key={subject.id} className="subject-checkbox">
              <input
                type="checkbox"
                id={`subject-${subject.id}`}
                name="subjects"
                value={subject.id}
                checked={formData.subjects.includes(subject.id)}
                onChange={(e) => {
                  const subjectId = parseInt(e.target.value);
                  const newSubjects = e.target.checked
                    ? [...formData.subjects, subjectId]
                    : formData.subjects.filter((id) => id !== subjectId);
                  onFormChange({
                    target: {
                      name: "subjects",
                      value: newSubjects,
                    },
                  });
                }}
              />
              <label htmlFor={`subject-${subject.id}`}>{subject.name}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="form-row">
        <label>Classes</label>
        <div className="tm-classes-scroll">
          {classes.map((cls) => (
            <div key={cls.id} className="class-checkbox">
              <input
                type="checkbox"
                id={`class-${cls.id}`}
                name="classes"
                value={cls.id}
                checked={formData.classes.includes(cls.id)}
                onChange={(e) => {
                  const classId = parseInt(e.target.value);
                  const newClasses = e.target.checked
                    ? [...formData.classes, classId]
                    : formData.classes.filter((id) => id !== classId);
                  onFormChange({
                    target: {
                      name: "classes",
                      value: newClasses,
                    },
                  });
                }}
              />
              <label htmlFor={`class-${cls.id}`}>{cls.name}</label>
            </div>
          ))}
        </div>
      </div>

      {mode === "add" && (
        <div className="form-row">
          <label>Mot de passe</label>
          <div className="form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={onFormChange}
              required={mode === "add"}
              placeholder="••••••••"
              minLength={8}
              title="Le mot de passe doit contenir au moins 8 caractères"
            />
            <small className="form-text text-muted">
              Le mot de passe doit contenir au moins 8 caractères
            </small>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="cancel-button"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </button>
        {mode === "add" ? (
          <button type="submit" className="add-button" disabled={loading}>
            {loading ? "Ajout..." : "Ajouter"}
          </button>
        ) : (
          <button type="submit" className="update-button" disabled={loading}>
            {loading ? "Mise à jour..." : "Mettre à jour"}
          </button>
        )}
      </div>
    </form>
  </div>
);

function TeachersManagement() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const feedbackTimeout = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [currentTeacherId, setCurrentTeacherId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "Teacher@123",
    subjects: [],
    classes: [],
  });

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        showFeedback("Vous devez être connecté.", "error");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [teachersRes, subjectsRes, classesRes] = await Promise.all([
          axios.get(`${API_URL}/users?role=${ROLE_ENSEIGNANT}&per_page=1000`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/subjects`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/classes`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setTeachers(teachersRes.data.data || []);
        setSubjects(subjectsRes.data || []);
        setClasses(classesRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        showFeedback("Erreur lors du chargement des données.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showFeedback = (message, type = "info", duration = 5000) => {
    if (feedbackTimeout.current) {
      clearTimeout(feedbackTimeout.current);
    }

    setFeedback({ show: true, message, type });

    feedbackTimeout.current = setTimeout(() => {
      setFeedback((prev) => ({ ...prev, show: false }));
    }, duration);
  };

  const hideFeedback = () => {
    setFeedback((prev) => ({ ...prev, show: false }));
    if (feedbackTimeout.current) {
      clearTimeout(feedbackTimeout.current);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation
    if (
      !formData.name ||
      !formData.email ||
      (formMode === "add" && !formData.password)
    ) {
      showFeedback("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }
    if (formData.subjects.length === 0 || formData.classes.length === 0) {
      showFeedback(
        "Veuillez sélectionner au moins une matière et une classe.",
        "error"
      );
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showFeedback("Vous devez être connecté.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const isEdit = formMode === "edit";

      // First, create/update the user
      const userData = {
        name: formData.name,
        email: formData.email,
        role: ROLE_ENSEIGNANT,
        ...(formData.password && { password: formData.password }),
      };

      let userId;
      let teacherId;
      if (isEdit) {
        await axios.put(`${API_URL}/users/${currentTeacherId}`, userData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        userId = currentTeacherId;
        // Fetch teacher entity for edit as well
        const teacherDetails = await axios.get(`${API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        teacherId = teacherDetails.data.teacher?.id || userId;
      } else {
        const response = await axios.post(`${API_URL}/users`, userData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        userId = response.data.user.id;
        // Fetch teacher entity to get teacher.id
        const teacherDetails = await axios.get(`${API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        teacherId = teacherDetails.data.teacher?.id || userId;
      }

      // Then, handle assignments
      const assignments = [];
      for (const subjectId of formData.subjects) {
        for (const classId of formData.classes) {
          assignments.push({
            teacher_id: teacherId,
            subject_id: subjectId,
            class_id: classId,
          });
        }
      }

      // Create assignments
      if (assignments.length > 0) {
        await axios.post(
          `${API_URL}/assignments/batch`,
          { assignments },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      showFeedback(
        isEdit
          ? "Enseignant mis à jour avec succès"
          : "Enseignant ajouté avec succès",
        "success"
      );

      // Refresh the teachers list
      const response = await axios.get(
        `${API_URL}/users?role=${ROLE_ENSEIGNANT}&per_page=1000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTeachers(response.data.data || []);

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "Teacher@123",
        subjects: [],
        classes: [],
      });
      setShowForm(false);
      setFormMode("add");
      setCurrentTeacherId(null);
    } catch (error) {
      let backendMsg =
        error.response?.data?.message || error.response?.data?.error;
      // Handle batch assignment errors (array)
      if (
        error.response?.data?.errors &&
        Array.isArray(error.response.data.errors)
      ) {
        backendMsg += "\n" + error.response.data.errors.join("\n");
      }
      if (
        !backendMsg &&
        error.response?.data &&
        typeof error.response.data === "object"
      ) {
        // Try to extract first error from validation errors
        const firstKey = Object.keys(error.response.data)[0];
        backendMsg = error.response.data[firstKey];
        if (Array.isArray(backendMsg)) backendMsg = backendMsg[0];
      }
      showFeedback(
        `Erreur: ${backendMsg || error.message || "Une erreur est survenue"}`,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (teacher) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Fetch the teacher entity to get the real teacher.id
      const userDetails = await axios.get(`${API_URL}/users/${teacher.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teacherId = userDetails.data.teacher?.id || teacher.id;

      // Now fetch assignments using the correct teacherId
      const response = await axios.get(
        `${API_URL}/teachers/${teacherId}/subjects`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const assignments = response.data.assignments || [];
      const subjects = assignments.map((a) => a.subject.id);
      const classes = assignments.flatMap((a) => a.classes.map((c) => c.id));

      setFormMode("edit");
      setCurrentTeacherId(teacher.id);
      setFormData({
        name: teacher.name,
        email: teacher.email,
        subjects,
        classes,
      });
      setShowForm(true);
    } catch (error) {
      console.error("Error loading teacher details:", error);
      showFeedback(
        "Erreur lors du chargement des détails de l'enseignant.",
        "error"
      );
    }
  };

  const handleDelete = async (teacherId, teacherName) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer l'enseignant ${teacherName} ?`
      )
    ) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showFeedback("Vous devez être connecté.", "error");
      return;
    }

    try {
      await axios.delete(`${API_URL}/users/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
      showFeedback("Enseignant supprimé avec succès", "success");
    } catch (error) {
      console.error("Error deleting teacher:", error);
      showFeedback("Erreur lors de la suppression de l'enseignant.", "error");
    }
  };

  if (loading)
    return <div className="loading-message">Chargement en cours...</div>;

  return (
    <div className="teachers-management">
      <div className="management-content">
        {feedback.show && (
          <FeedbackMessage
            type={feedback.type}
            message={feedback.message}
            onClose={hideFeedback}
          />
        )}
        <div className="page-header">
          <h2 className="page-header">Gestion des Enseignants</h2>
          {!showForm && (
            <button
              className="ajouter-toggle-button"
              onClick={() => setShowForm(true)}
            >
              <FiUserPlus /> Ajouter un enseignant
            </button>
          )}
        </div>

        {showForm && (
          <div className="form-section">
            <TeacherForm
              formData={formData}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setFormMode("add");
                setCurrentTeacherId(null);
                setFormData({
                  name: "",
                  email: "",
                  password: "Teacher@123",
                  subjects: [],
                  classes: [],
                });
              }}
              onFormChange={handleFormChange}
              mode={formMode}
              subjects={subjects}
              classes={classes}
              loading={isSubmitting}
            />
          </div>
        )}

        <div className="table-container">
          <p className="total-count">
            {`${teachers.length} enseignant(s) trouvé(s)`}
          </p>
          <table className="teachers-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.email}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleEdit(teacher)}
                      className="icon-btn-small modify"
                      title="Modifier"
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="icon-btn-small delete"
                      onClick={() => handleDelete(teacher.id, teacher.name)}
                      title="Supprimer"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TeachersManagement;
