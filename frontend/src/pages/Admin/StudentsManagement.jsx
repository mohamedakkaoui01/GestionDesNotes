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
import "../../css/Admin/studentsmanagement.css";

// Composant de message de feedback
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
const ROLE_ETUDIANT = "étudiant";

// Form component for adding/editing students
const StudentForm = ({
  formData,
  onSubmit,
  onCancel,
  mode,
  classes,
  loading,
  onFormChange,
}) => (
  <div className="student-form-container">
    <h3>{mode === "add" ? "Ajouter un étudiant" : "Modifier l'étudiant"}</h3>
    <form onSubmit={onSubmit} className="student-form">
      <div className="form-row">
        <label>Nom complet</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={(e) => {
            const value = e.target.value;
            // Generate email based on name (remove accents and special chars)
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
        <label>Classe</label>
        <select
          name="class_id"
          value={formData.class_id || ""}
          onChange={onFormChange}
          required
        >
          <option value="">Sélectionner une classe</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
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

function StudentsManagement() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [feedback, setFeedback] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const feedbackTimeout = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add"); // 'add' or 'edit'
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    class_id: "",
    password: "Student@123", // Strong default password that meets requirements
  });
  const formRef = React.useRef(null);

  // Ne pas charger les étudiants tant qu'une classe n'est pas sélectionnée
  const [error, setError] = useState("");

  // Charger les classes au montage du composant
  useEffect(() => {
    const fetchClasses = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vous devez être connecté.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/classes`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        // Handle both array and object responses
        const responseData = response.data?.data || response.data;
        const classesData = Array.isArray(responseData) ? responseData : [];

        setClasses(classesData);
        setError("");
      } catch (error) {
        console.error("Error fetching classes:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Erreur lors du chargement des classes";
        setError(errorMessage);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchClasses();
  }, []);

  // Fonction pour récupérer les étudiants
  const fetchStudents = async (classId) => {
    if (!classId) {
      setStudents([]);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Vous devez être connecté.");
      return;
    }

    try {
      setLoading(true);
      // D'abord, récupérer tous les étudiants de la classe sélectionnée
      const response = await axios.get(
        `${API_URL}/classes/${classId}/students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      // Traiter la réponse - gérer à la fois les tableaux et les objets
      const responseData = response.data?.data || response.data || [];
      const studentsArray = Array.isArray(responseData)
        ? responseData
        : [responseData];

      // Map the students data
      const studentsData = studentsArray.map((student) => {
        // Handle both nested user object and flat structure
        const studentObj = student.user || student;
        return {
          id: studentObj.id || student.id,
          name: studentObj.name || "",
          email: studentObj.email || "",
          class_id: studentObj.class_id || student.class_id || classId,
          class_name:
            studentObj.class_name || (student.class ? student.class.name : ""),
        };
      });

      setStudents(studentsData);
      setError("");
    } catch (error) {
      console.error("Error fetching students:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Erreur lors du chargement des étudiants";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Charger les étudiants lorsque la classe sélectionnée change
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  const filteredStudents = students;

  const toggleForm = () => {
    setShowForm(!showForm);
    if (showForm) {
      // Réinitialiser le formulaire lors de la fermeture
      setFormMode("add");
      setCurrentStudentId(null);
      setFormData({
        name: "",
        email: "",
        class_id: "",
        password: "Etudiant@123",
      });
    }
  };

  const handleEdit = (student) => {
    // Faire défiler vers le haut de la page
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Mettre à jour les données du formulaire et l'afficher
    setFormMode("edit");
    setCurrentStudentId(student.id);
    setFormData({
      name: student.name || "",
      email: student.email || "",
      class_id: student.class_id || selectedClass || "",
      password: "", // Ne pas afficher le mot de passe en mode édition
    });

    // Show the form
    setShowForm(true);
  };

  const handleDelete = async (studentId, studentName) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer l'étudiant ${studentName} ?`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      // Use DELETE to /users/{id} endpoint
      await axios.delete(`${API_URL}/users/${studentId}`, { headers });

      // Update the local state
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      setError("");
      // Show success message
      showFeedback("Étudiant supprimé avec succès", "success");
    } catch (error) {
      setError(
        `Erreur lors de la suppression: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const getStudentClassName = (student) => {
    // Vérifier si l'étudiant a directement les informations de classe
    if (student.class_name) return student.class_name;

    // Sinon, essayer de trouver dans le tableau des classes si nécessaire
    const classId = student.class_id || student.student?.class_id;
    if (!classId) return "Non assigné";

    const studentClass = classes.find((c) => c.id == classId);
    return studentClass?.name || "Non assigné";
  };

  const handleFormChange = (e, skipSet = false) => {
    if (!skipSet) {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Fonction pour valider le format d'email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const showFeedback = (message, type = "info", duration = 5000) => {
    // Effacer tout délai existant
    if (feedbackTimeout.current) {
      clearTimeout(feedbackTimeout.current);
    }

    setFeedback({ show: true, message, type });

    // Masquage automatique après la durée spécifiée
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Valider le formulaire
    if (
      !formData.name ||
      !formData.email ||
      (formMode === "add" && !formData.password)
    ) {
      showFeedback("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

    // Valider le format de l'email
    if (!isValidEmail(formData.email)) {
      showFeedback("Veuillez entrer une adresse email valide", "error");
      return;
    }

    // Valider la classe pour les étudiants
    if (!formData.class_id) {
      showFeedback("La classe est requise pour un étudiant", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Vous devez être connecté.");
      }

      setIsSubmitting(true);
      setError("");

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: ROLE_ETUDIANT,
        class_id: formData.class_id,
      };

      // Inclure le mot de passe uniquement pour les nouveaux étudiants
      if (formMode === "add") {
        const password = formData.password || "Etudiant@123";
        if (password.length < 8) {
          throw new Error(
            "Le mot de passe doit contenir au moins 8 caractères"
          );
        }
        payload.password = password;
        payload.password_confirmation = password;
      }

      const isEdit = formMode === "edit" && currentStudentId;
      const url = isEdit
        ? `${API_URL}/users/${currentStudentId}`
        : `${API_URL}/users`;

      // Effectuer la requête API
      const response = await axios({
        method: isEdit ? "put" : "post",
        url,
        data: payload,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      // Afficher le message de succès
      showFeedback(
        isEdit
          ? "Étudiant mis à jour avec succès"
          : "Étudiant ajouté avec succès",
        "success"
      );

      // Actualiser la liste des étudiants avec notre fonction fetchStudents
      if (selectedClass) {
        await fetchStudents(selectedClass);
      }

      // Réinitialiser le formulaire
      setFormData({
        name: "",
        email: "",
        class_id: "",
        password: "Etudiant@123",
      });
      setShowForm(false);
      setFormMode("add");
      setCurrentStudentId(null);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Erreur lors de l'enregistrement";
      showFeedback(`Erreur: ${errorMessage}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return <div className="loading-message">Chargement en cours...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="students-management">
      <div className="management-content">
        {feedback.show && (
          <FeedbackMessage
            type={feedback.type}
            message={feedback.message}
            onClose={hideFeedback}
          />
        )}
        <div className="page-header">
          <h2 className="page-header">Gestion des Étudiants</h2>
          {!showForm && (
            <button className="ajouter-toggle-button" onClick={toggleForm}>
              <FiUserPlus /> Ajouter un étudiant
            </button>
          )}
        </div>

        {showForm && (
          <div className="form-section">
            <StudentForm
              formData={formData}
              onSubmit={handleFormSubmit}
              onCancel={toggleForm}
              onFormChange={handleFormChange}
              mode={formMode}
              classes={classes}
              loading={isSubmitting}
            />
          </div>
        )}

        <div className="form-row">
          <label htmlFor="class-select">Sélectionner une classe</label>
          <select
            id="class-select"
            className="class-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value || "")}
            required
          >
            <option value="">-- Sélectionner une classe --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">Chargement en cours...</div>
        ) : !selectedClass ? (
          <div className="empty-state">
            <p>Veuillez sélectionner une classe pour afficher les étudiants</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <p>Aucun étudiant trouvé dans cette classe</p>
          </div>
        ) : (
          <div className="table-container">
            <p className="total-count">
              {`${filteredStudents.length} étudiant(s) trouvé(s)`}
            </p>
            <table className="students-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Classe</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name || "Nom non disponible"}</td>
                    <td>{student.id || "N/A"}</td>
                    <td>{student.email || "Non disponible"}</td>
                    <td>{getStudentClassName(student)}</td>
                    <td className="actions-cell">
                      <button
                        onClick={() => handleEdit(student)}
                        className="icon-btn-small modify"
                        title="Modifier"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="icon-btn-small delete"
                        onClick={() => handleDelete(student.id, student.name)}
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
        )}
      </div>
    </div>
  );
}

export default StudentsManagement;
