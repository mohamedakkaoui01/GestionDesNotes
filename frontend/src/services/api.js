import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable sending cookies
});

// Add request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      return Promise.reject(error.response.data);
    } else if (error.request) {
      return Promise.reject(
        new Error(
          "Pas de réponse du serveur. Veuillez vérifier que le serveur est en cours d'exécution."
        )
      );
    } else {
      return Promise.reject(new Error("Erreur lors de la requête."));
    }
  }
);

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    throw new Error("Token manquant. Veuillez vous reconnecter.");
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
};

const api = {
  async getUser() {
    try {
      const response = await axiosInstance.get("/user", {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  },

  async getGrades(params = {}) {
    try {
      const response = await axiosInstance.get("/grades", {
        headers: getAuthHeaders(),
        params,
      });
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching grades:", error);
      throw error;
    }
  },

  async getStudentAverages(studentId, yearId) {
    try {
      const response = await axiosInstance.get(
        `/students/${studentId}/averages/${yearId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student averages:", error);
      throw error;
    }
  },

  async createGrade(gradeData) {
    try {
      const response = await axiosInstance.post("/grades", gradeData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error creating grade:", error);
      throw error;
    }
  },

  async updateGrade(gradeId, gradeData) {
    try {
      const response = await axiosInstance.put(
        `/grades/${gradeId}`,
        gradeData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating grade:", error);
      throw error;
    }
  },

  async deleteGrade(gradeId) {
    try {
      const response = await axiosInstance.delete(`/grades/${gradeId}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting grade:", error);
      throw error;
    }
  },

  async getTeacherClasses() {
    try {
      const response = await axiosInstance.get("/teacher/classes", {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching teacher classes:", error);
      throw error;
    }
  },

  async getTeacherSubjects() {
    try {
      const response = await axiosInstance.get("/teacher/subjects", {
        headers: getAuthHeaders(),
      });
      return response.data.assignments || [];
    } catch (error) {
      console.error("Error fetching teacher subjects:", error);
      throw error;
    }
  },

  async getTeacherClassStudents(classId) {
    try {
      const response = await axiosInstance.get(
        `/teacher/classes/${classId}/students`,
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching students for teacher's class:", error);
      throw error;
    }
  },

  async getAcademicYears() {
    try {
      const response = await axiosInstance.get("/academic-years", {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching academic years:", error);
      throw error;
    }
  },

  async getStudentSubjects() {
    try {
      const response = await axiosInstance.get("/student/subjects", {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching student subjects:", error);
      throw error;
    }
  },
};

export default api;
