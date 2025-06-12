import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiInfo,
  FiX,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiUserPlus,
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

// Teacher Form Component
const TeacherForm = ({
  formData,
  onSubmit,
  onCancel,
  mode,
  subjects,
  classes,
  existingAssignments,
  loading,
  onFormChange,
  currentTeacherModelId,
}) => {
  const [selectedAssignments, setSelectedAssignments] = useState(
    formData.assignments || []
  );

  const handleAssignmentChange = (subjectId, classId, checked) => {
    if (checked) {
      setSelectedAssignments([
        ...selectedAssignments,
        { subject_id: subjectId, class_id: classId },
      ]);
    } else {
      setSelectedAssignments(
        selectedAssignments.filter(
          (a) => !(a.subject_id === subjectId && a.class_id === classId)
        )
      );
    }
  };

  const isAssignmentDisabled = (subjectId, classId) => {
    if (mode === "edit") return false;
    return existingAssignments.some(
      (a) => a.subject_id === subjectId && a.class_id === classId
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, assignments: selectedAssignments });
  };

  // Table layout: columns = subjects, rows = classes
  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Nom</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onFormChange}
            required
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
          />
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
                required
                minLength={8}
                title="Le mot de passe doit contenir au moins 8 caractères"
              />
              <small className="form-text text-muted">
                Le mot de passe doit contenir au moins 8 caractères
              </small>
            </div>
          </div>
        )}

        <div className="form-row">
          <label>Assignations (Matières/Classes)</label>
          <div className="table-container assignments-table-scroll">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th className="sticky-col">Classe \\ Matière</th>
                  {subjects.map((subject) => (
                    <th key={subject.id} title={subject.name}>
                      {subject.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls.id}>
                    <td className="sticky-col">{cls.name}</td>
                    {subjects.map((subject) => {
                      // Disable if assigned to another teacher (except current teacher in edit mode)
                      const isAssignedToAnother = existingAssignments.some(
                        (a) =>
                          a.subject_id === subject.id &&
                          a.class_id === cls.id &&
                          a.teacher_id !== currentTeacherModelId
                      );
                      const isAssignedToCurrent = selectedAssignments.some(
                        (a) =>
                          a.subject_id === subject.id && a.class_id === cls.id
                      );
                      const checked = isAssignedToCurrent;
                      // Disable if assigned to another teacher (except current teacher in edit mode)
                      const disabled =
                        mode === "edit"
                          ? isAssignedToAnother && !isAssignedToCurrent
                          : isAssignedToAnother;
                      return (
                        <td key={subject.id} style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              handleAssignmentChange(
                                subject.id,
                                cls.id,
                                e.target.checked
                              )
                            }
                            disabled={disabled}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
};

const TeachersManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [existingAssignments, setExistingAssignments] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "Teacher@123",
    assignments: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const feedbackTimeout = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
    fetchClasses();
    fetchExistingAssignments();
  }, []);

  const showFeedback = (message, type = "info", duration = 4000) => {
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

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
        params: { role: "enseignant" },
      });
      const teachersArray = Array.isArray(response.data)
        ? response.data
        : response.data.data;
      setTeachers(teachersArray || []);
    } catch (error) {
      setError("Erreur lors du chargement des enseignants");
      showFeedback("Erreur lors du chargement des enseignants", "error");
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8000/api/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(response.data);
    } catch (error) {
      setError("Erreur lors du chargement des matières");
      showFeedback("Erreur lors du chargement des matières", "error");
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8000/api/classes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(response.data);
    } catch (error) {
      setError("Erreur lors du chargement des classes");
      showFeedback("Erreur lors du chargement des classes", "error");
    }
  };

  const fetchExistingAssignments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8000/api/assignments",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setExistingAssignments(response.data);
    } catch (error) {
      setError("Erreur lors du chargement des assignations");
      showFeedback("Erreur lors du chargement des assignations", "error");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      let teacherModelId;

      if (editingId) {
        // 1. Get teacher model ID from user
        const userResponse = await axios.get(
          `http://localhost:8000/api/users/${editingId}`,
          { headers }
        );
        teacherModelId = userResponse.data.teacher.id;

        // 2. Update teacher info
        await axios.put(
          `http://localhost:8000/api/users/${editingId}`,
          {
            name: formData.name,
            email: formData.email,
            role: "enseignant",
          },
          { headers }
        );
      } else {
        // 1. Create new teacher (user)
        const teacherResponse = await axios.post(
          "http://localhost:8000/api/users",
          {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: "enseignant",
          },
          { headers }
        );
        // 2. Get teacher model ID from response or fetch if missing
        if (
          teacherResponse.data.user &&
          teacherResponse.data.user.teacher &&
          teacherResponse.data.user.teacher.id
        ) {
          teacherModelId = teacherResponse.data.user.teacher.id;
        } else {
          // Fetch user details to get teacher model ID
          const userId = teacherResponse.data.user.id;
          const userDetails = await axios.get(
            `http://localhost:8000/api/users/${userId}`,
            { headers }
          );
          teacherModelId = userDetails.data.teacher.id;
        }
      }

      // 3. Prepare assignments with teacher_id
      const assignmentsWithTeacherId = (formData.assignments || []).map(
        (a) => ({
          ...a,
          teacher_id: teacherModelId,
        })
      );

      // 4. Send batch assignment only if there are assignments
      if (assignmentsWithTeacherId.length > 0) {
        await axios.post(
          "http://localhost:8000/api/assignments/batch",
          {
            assignments: assignmentsWithTeacherId,
          },
          { headers }
        );
      }

      showFeedback(
        editingId
          ? "Enseignant modifié avec succès"
          : "Enseignant ajouté avec succès",
        "success"
      );

      setFormData({
        name: "",
        email: "",
        password: "Teacher@123",
        assignments: [],
      });
      setEditingId(null);
      setShowForm(false);
      fetchTeachers();
      fetchExistingAssignments();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Erreur lors de l'enregistrement de l'enseignant";
      setError(errorMessage);
      showFeedback(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (teacher) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Get teacher model ID from user
      const userResponse = await axios.get(
        `http://localhost:8000/api/users/${teacher.id}`,
        { headers }
      );
      const teacherModelId = userResponse.data.teacher.id;

      // 2. Get assignments using teacher model ID
      const response = await axios.get(
        `http://localhost:8000/api/teachers/${teacherModelId}/subjects`,
        { headers }
      );

      // 3. Flatten assignments as before
      const assignments = [];
      (response.data.assignments || []).forEach((assignment) => {
        const subjectId = assignment.subject.id;
        (assignment.classes || []).forEach((cls) => {
          assignments.push({
            subject_id: subjectId,
            class_id: cls.id,
          });
        });
      });

      setFormData({
        name: teacher.name,
        email: teacher.email,
        assignments,
      });
      setEditingId(teacher.id);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      showFeedback("Erreur lors du chargement des assignations", "error");
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

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8000/api/users/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showFeedback("Enseignant supprimé avec succès", "success");
      fetchTeachers();
      fetchExistingAssignments();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de la suppression de l'enseignant";
      setError(errorMessage);
      showFeedback(errorMessage, "error");
    }
  };

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
          <h2>Gestion des Enseignants</h2>
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
          <TeacherForm
            formData={formData}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
              setFormData({
                name: "",
                email: "",
                password: "Teacher@123",
                assignments: [],
              });
            }}
            mode={editingId ? "edit" : "add"}
            subjects={subjects}
            classes={classes}
            existingAssignments={existingAssignments}
            loading={isSubmitting}
            onFormChange={handleFormChange}
            currentTeacherModelId={
              editingId
                ? (() => {
                    // Find teacher model ID for the current editing user
                    // We fetch it in handleEdit and store it in formData._teacherModelId if needed
                    if (formData._teacherModelId)
                      return formData._teacherModelId;
                    // Fallback: try to find in existingAssignments
                    const found = existingAssignments.find(
                      (a) =>
                        a.teacher_id && teachers.find((t) => t.id === editingId)
                    );
                    return found ? found.teacher_id : null;
                  })()
                : null
            }
          />
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="table-container">
          <table>
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
                  <td className="action-buttons">
                    <button
                      className="icon-btn-small modify"
                      title="Modifier"
                      onClick={() => handleEdit(teacher)}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="icon-btn-small delete"
                      title="Supprimer"
                      onClick={() => handleDelete(teacher.id, teacher.name)}
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
};

export default TeachersManagement;
