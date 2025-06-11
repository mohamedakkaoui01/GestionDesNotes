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
} from "react-icons/fi";
import "../../css/Admin/subjectsmanagement.css";

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

const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const feedbackTimeout = useRef(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSubjects();
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
      console.error("Erreur lors du chargement des matières:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (editingId) {
        await axios.put(
          `http://localhost:8000/api/subjects/${editingId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        showFeedback("Matière modifiée avec succès", "success");
      } else {
        await axios.post("http://localhost:8000/api/subjects", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showFeedback("Matière ajoutée avec succès", "success");
      }
      setFormData({ name: "" });
      setEditingId(null);
      setShowForm(false);
      fetchSubjects();
    } catch (error) {
      setError("Erreur lors de l'enregistrement de la matière");
      showFeedback("Erreur lors de l'enregistrement de la matière", "error");
      console.error("Erreur lors de l'enregistrement de la matière:", error);
    }
  };

  const handleEdit = (subject) => {
    setFormData({ name: subject.name });
    setEditingId(subject.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleShowForm = () => {
    setFormData({ name: "" });
    setEditingId(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ name: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette matière ?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:8000/api/subjects/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showFeedback("Matière supprimée avec succès", "success");
        fetchSubjects();
      } catch (error) {
        setError("Erreur lors de la suppression de la matière");
        showFeedback("Erreur lors de la suppression de la matière", "error");
        console.error("Erreur lors de la suppression de la matière:", error);
      }
    }
  };

  return (
    <div className="subjects-management">
      <div className="management-content">
        <div className="page-header">
          <h2>Gestion des matières</h2>
          {!showForm && (
            <button className="ajouter-toggle-button" onClick={handleShowForm}>
              <FiPlus /> Ajouter une matière
            </button>
          )}
        </div>

        {feedback.show && (
          <FeedbackMessage
            type={feedback.type}
            message={feedback.message}
            onClose={hideFeedback}
          />
        )}

        {showForm && (
          <div className="form-container">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Nom de la matière :</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="button-group">
                {editingId ? (
                  <>
                    <button type="submit" className="update-button">
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={handleCancel}
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <button type="submit" className="add-button">
                      Ajouter
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={handleCancel}
                    >
                      Annuler
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <td>{subject.id}</td>
                  <td>{subject.name}</td>
                  <td className="action-buttons">
                    <button
                      className="icon-btn-small modify"
                      title="Modifier"
                      onClick={() => handleEdit(subject)}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="icon-btn-small delete"
                      title="Supprimer"
                      onClick={() => handleDelete(subject.id)}
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

export default SubjectsManagement;
