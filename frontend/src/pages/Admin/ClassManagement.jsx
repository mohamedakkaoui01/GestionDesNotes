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
import "../../css/Admin/classmanagement.css";

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

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
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
    fetchClasses();
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
      console.error("Erreur lors du chargement des classes:", error);
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
          `http://localhost:8000/api/classes/${editingId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        showFeedback("Classe modifiée avec succès", "success");
      } else {
        await axios.post("http://localhost:8000/api/classes", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showFeedback("Classe ajoutée avec succès", "success");
      }
      setFormData({ name: "" });
      setEditingId(null);
      setShowForm(false);
      fetchClasses();
    } catch (error) {
      setError("Erreur lors de l'enregistrement de la classe");
      showFeedback("Erreur lors de l'enregistrement de la classe", "error");
      console.error("Erreur lors de l'enregistrement de la classe:", error);
    }
  };

  const handleEdit = (classe) => {
    setFormData({ name: classe.name });
    setEditingId(classe.id);
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
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette classe ?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:8000/api/classes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showFeedback("Classe supprimée avec succès", "success");
        fetchClasses();
      } catch (error) {
        setError("Erreur lors de la suppression de la classe");
        showFeedback("Erreur lors de la suppression de la classe", "error");
        console.error("Erreur lors de la suppression de la classe:", error);
      }
    }
  };

  return (
    <div className="classes-management">
      <div className="management-content">
        <div className="page-header">
          <h2>Gestion des classes</h2>
          {!showForm && (
            <button className="ajouter-toggle-button" onClick={handleShowForm}>
              <FiPlus /> Ajouter une classe
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
                <label htmlFor="name">Nom de la classe :</label>
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
              {classes.map((classe) => (
                <tr key={classe.id}>
                  <td>{classe.id}</td>
                  <td>{classe.name}</td>
                  <td className="action-buttons">
                    <button
                      className="icon-btn-small modify"
                      title="Modifier"
                      onClick={() => handleEdit(classe)}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="icon-btn-small delete"
                      title="Supprimer"
                      onClick={() => handleDelete(classe.id)}
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

export default ClassManagement;
