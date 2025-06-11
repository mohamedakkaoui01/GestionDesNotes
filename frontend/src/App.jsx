import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// 🟢 Pages Publiques
import Login from "./pages/Login";

// 🧩 Composant de mise en page (Layout principal)
import Layout from "./components/Layout";

// 🧑‍🎓 Routes Étudiant
import StudentDashboard from "./pages/Student/StudentDashboard";
import StudentGrades from "./pages/Student/StudentGrades";

// 👨‍🏫 Routes Enseignant
import TeacherDashboard from "./pages/Teacher/TeacherDashboard";
import GradesManagement from "./pages/Teacher/GradesManagement";

// 👨‍💼 Routes Admin
import AdminDashboard from "./pages/Admin/AdminDashboard";
import StudentsManagement from "./pages/Admin/StudentsManagement";
import TeachersManagement from "./pages/Admin/TeachersManagement";
import SubjectsManagement from "./pages/Admin/SubjectsManagement";
import ClassManagement from "./pages/Admin/ClassManagement";
import Bulletin from "./pages/Admin/Bulletin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🌐 Page de connexion (publique) */}
        <Route path="/" element={<Login />} />

        {/* 🛠️ Espace Administrateur */}
        <Route path="/admin" element={<Layout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<StudentsManagement />} />
          <Route path="teachers" element={<TeachersManagement />} />
          <Route path="subjects" element={<SubjectsManagement />} />
          <Route path="classes" element={<ClassManagement />} />
          <Route path="bulletin" element={<Bulletin />} />
        </Route>

        {/* 👨‍🏫 Espace Enseignant */}
        <Route path="/enseignant" element={<Layout />}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="grades" element={<GradesManagement />} />
        </Route>

        {/* 👨‍🎓 Espace Étudiant */}
        <Route path="/étudiant" element={<Layout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="grades" element={<StudentGrades />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
