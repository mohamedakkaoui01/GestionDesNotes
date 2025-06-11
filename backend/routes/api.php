<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ClassController;
use App\Http\Controllers\API\GradeController;
use App\Http\Controllers\API\SubjectController;
use App\Http\Controllers\API\TeacherAssignmentController;
use App\Http\Controllers\API\AcademicYearController;
use App\Http\Middleware\CheckRole;
use App\Models\User;
use App\Models\Subject;
use App\Models\SchoolClass;

// ==============================
// 🌐 ROUTES PUBLIQUES
// ==============================

Route::post('/login', [AuthController::class, 'login']);


// ==============================
// 🔐 ROUTES AUTHENTIFIÉES (avec Sanctum)
// ==============================
Route::middleware('auth:sanctum')->group(function () {

    // 👤 Authentification de l'utilisateur connecté
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // 📊 Années académiques (accessible à tous les utilisateurs connectés)
    Route::get('/academic-years', [AcademicYearController::class, 'index']);

    // 📝 Gestion des notes (enseignants & étudiants)
    Route::get('/grades', [GradeController::class, 'index']);
    Route::get('/grades/{id}', [GradeController::class, 'show']);
    Route::get('/students/{studentId}/averages/{academicYearId}', [GradeController::class, 'studentAverages']);

    // 🧑‍🏫 Routes réservées aux enseignants (gestion des notes)
    Route::middleware(CheckRole::class . ':enseignant')->group(function () {
        Route::post('/grades', [GradeController::class, 'store']);
        Route::put('/grades/{id}', [GradeController::class, 'update']);
        Route::delete('/grades/{id}', [GradeController::class, 'destroy']);

        // 👨‍🏫 Vue des classes, matières et élèves assignés à l'enseignant
        Route::get('/teacher/classes', [TeacherAssignmentController::class, 'myClasses']);
        Route::get('/teacher/subjects', [TeacherAssignmentController::class, 'mySubjects']);
        Route::get('/teacher/classes/{id}/students', [TeacherAssignmentController::class, 'myClassStudents']);
    });

    // 👩‍🎓 Routes réservées aux étudiants
    Route::middleware(CheckRole::class . ':étudiant')->group(function () {
        Route::get('/student/class', [ClassController::class, 'myClass']);
        Route::get('/student/subjects', [ClassController::class, 'mySubjects']);
    });

    // ⚙️ Routes réservées à l'administrateur
    Route::middleware(CheckRole::class . ':admin')->group(function () {

        // 👥 Gestion des utilisateurs
        Route::apiResource('users', UserController::class);

        // 🏫 Gestion des classes
        Route::apiResource('classes', ClassController::class);
        Route::get('/classes/{id}/students', [ClassController::class, 'students']);
        Route::get('/classes/{id}/subjects', [ClassController::class, 'subjects']);

        // 📚 Gestion des matières
        Route::apiResource('subjects', SubjectController::class);
        Route::get('/subjects/{id}/teachers', [SubjectController::class, 'teachers']);
        Route::get('/subjects/{id}/classes', [SubjectController::class, 'classes']);

        // 👨‍🏫 Assignation des enseignants
        Route::get('/assignments', [TeacherAssignmentController::class, 'index']);
        Route::post('/assignments', [TeacherAssignmentController::class, 'assign']);
        Route::post('/assignments/batch', [TeacherAssignmentController::class, 'batchAssign']);
        Route::delete('/assignments', [TeacherAssignmentController::class, 'unassign']);
        Route::get('/teachers/{teacherId}/subjects', [TeacherAssignmentController::class, 'teacherSubjects']);
    });
});

// ==============================
// 📊 STATS TABLEAU DE BORD (Admin uniquement)
// ==============================
Route::middleware(['auth:sanctum', CheckRole::class . ':admin'])->get('/dashboard-stats', function () {
    return response()->json([
        'students' => User::where('role', 'étudiant')->count(),
        'subjects' => Subject::count(),
        'teachers' => User::where('role', 'enseignant')->count(),
        'classesCount' => SchoolClass::count(),
    ]);
});
