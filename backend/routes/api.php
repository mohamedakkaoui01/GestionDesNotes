<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ClassController;
use App\Http\Controllers\API\GradeController;
use App\Http\Controllers\API\SubjectController;
use App\Http\Controllers\API\TeacherAssignmentController;
use App\Http\Middleware\CheckRole;
use App\Models\User;
use App\Models\Subject;
use App\Models\SchoolClass;
// ------------------------------
// 🌐 Public Routes
// ------------------------------

Route::post('/login', [AuthController::class, 'login']);


// ------------------------------
// 🔐 Authenticated Routes (Sanctum)
// ------------------------------
Route::middleware('auth:sanctum')->group(function () {

    // ✅ Authenticated User Info
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // ✅ Grades – Access for teachers & students
    Route::get('/grades', [GradeController::class, 'index']);
    Route::get('/grades/{id}', [GradeController::class, 'show']);
    Route::get('/students/{studentId}/averages/{academicYearId}', [GradeController::class, 'studentAverages']);

    // ✅ Grades – Only Teachers
    Route::middleware(CheckRole::class . ':enseignant')->group(function () {
        Route::post('/grades', [GradeController::class, 'store']);
        Route::put('/grades/{id}', [GradeController::class, 'update']);
        Route::delete('/grades/{id}', [GradeController::class, 'destroy']);
    });

    // ✅ Admin-Only Routes
    Route::middleware(CheckRole::class . ':admin')->group(function () {

        // 👥 User Management
        Route::apiResource('users', UserController::class);

        // 🏫 Class Management
        Route::apiResource('classes', ClassController::class);
        Route::get('/classes/{id}/students', [ClassController::class, 'students']);
        Route::get('/classes/{id}/subjects', [ClassController::class, 'subjects']);

        // 📚 Subject Management
        Route::apiResource('subjects', SubjectController::class);
        Route::get('/subjects/{id}/teachers', [SubjectController::class, 'teachers']);
        Route::get('/subjects/{id}/classes', [SubjectController::class, 'classes']);

        // 👨‍🏫 Teacher Assignments
        Route::get('/assignments', [TeacherAssignmentController::class, 'index']);
        Route::post('/assignments', [TeacherAssignmentController::class, 'assign']);
        Route::post('/assignments/batch', [TeacherAssignmentController::class, 'batchAssign']);
        Route::delete('/assignments', [TeacherAssignmentController::class, 'unassign']);
        Route::get('/teachers/{teacherId}/subjects', [TeacherAssignmentController::class, 'teacherSubjects']);
    });

    // 👨‍🏫 Teacher-Only Routes
    Route::middleware(['auth:sanctum', CheckRole::class . ':enseignant'])->group(function () {
        Route::get('/teacher/classes', [\App\Http\Controllers\API\TeacherAssignmentController::class, 'myClasses']);
        Route::get('/teacher/subjects', [\App\Http\Controllers\API\TeacherAssignmentController::class, 'mySubjects']);
        Route::get('/teacher/classes/{id}/students', [\App\Http\Controllers\API\TeacherAssignmentController::class, 'myClassStudents']);
    });

    Route::middleware('auth:sanctum')->get('/academic-years', [\App\Http\Controllers\API\AcademicYearController::class, 'index']);

    // 👨‍🎓 Student-Only Routes
    Route::middleware(['auth:sanctum', CheckRole::class . ':étudiant'])->group(function () {
        Route::get('/student/class', [ClassController::class, 'myClass']);
        Route::get('/student/subjects', [ClassController::class, 'mySubjects']);
    });
});

Route::middleware(['auth:sanctum', CheckRole::class . ':admin'])->get('/dashboard-stats', function () {
    $studentsCount = User::where('role', 'étudiant')->count();
    $subjectsCount = Subject::count();
    $teachersCount = User::where('role', 'enseignant')->count();
    $classesCount = SchoolClass::count();

    return response()->json([
        'students' => $studentsCount,
        'subjects' => $subjectsCount,
        'teachers' => $teachersCount,
        'classesCount' => $classesCount,
    ]);
});

