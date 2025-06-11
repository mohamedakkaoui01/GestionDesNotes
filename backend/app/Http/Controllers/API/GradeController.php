<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Grade;
use App\Models\Student;
use App\Models\Subject;
use App\Models\AcademicYear;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class GradeController extends Controller
{

    //Afficher une liste des notes.

    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = Grade::with(['student.user', 'teacher.user', 'subject', 'academicYear']);
        
        // Filtrage de role
        if ($user->isTeacher()) {
            $query->where('teacher_id', $user->teacher->id);
        } elseif ($user->isStudent()) {
            $query->where('student_id', $user->student->id);
        }
        
        // Filtres 
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        
        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }
        
        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }
        
        // Filter by class_id (get all students in the class)
        if ($request->has('class_id')) {
            $studentIds = \App\Models\Student::where('class_id', $request->class_id)->pluck('id');
            $query->whereIn('student_id', $studentIds);
        }
        
        // Add support for ?all=1 to disable pagination
        if ($request->has('all') && $request->all == 1) {
            $grades = $query->orderBy('created_at', 'desc')->get();
            $grades = $grades->map(function ($grade) {
                return [
                    'id' => $grade->id,
                    'student' => $grade->student,
                    'teacher' => $grade->teacher,
                    'subject' => $grade->subject,
                    'academic_year' => $grade->academicYear,
                    'grade' => $grade->grade,
                    'grading_period' => $grade->grading_period,
                    'created_at' => $grade->created_at,
                    'updated_at' => $grade->updated_at,
                ];
            });
            return response()->json(['data' => $grades]);
        } else {
            $grades = $query->orderBy('created_at', 'desc')->paginate(15);
            $grades->getCollection()->transform(function ($grade) {
                return [
                    'id' => $grade->id,
                    'student' => $grade->student,
                    'teacher' => $grade->teacher,
                    'subject' => $grade->subject,
                    'academic_year' => $grade->academicYear,
                    'grade' => $grade->grade,
                    'grading_period' => $grade->grading_period,
                    'created_at' => $grade->created_at,
                    'updated_at' => $grade->updated_at,
                ];
            });
            return response()->json($grades);
        }
    }

    //creer une nouvelle note.

    public function store(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->isTeacher() && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Non autorisé'
            ], 403);
        }
        
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'subject_id' => 'required|exists:subjects,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'grade' => 'required|numeric|min:0|max:20',
            'grading_period' => 'required|string',
        ]);
        
        $teacher_id = $user->isTeacher() ? $user->teacher->id : $request->teacher_id;
        
        $grade = Grade::create([
            'student_id' => $request->student_id,
            'teacher_id' => $teacher_id,
            'subject_id' => $request->subject_id,
            'academic_year_id' => $request->academic_year_id,
            'grade' => $request->grade,
            'grading_period' => $request->grading_period,
        ]);
        
        return response()->json([
            'message' => 'Note ajoutée avec succès',
            'grade' => $grade->load(['student.user', 'teacher.user', 'subject', 'academicYear'])
        ], 201);
    }

    //Afficher la note selon id.

    public function show($id)
    {
        $user = Auth::user();
        $grade = Grade::with(['student.user', 'teacher.user', 'subject', 'academicYear'])->findOrFail($id);
        
        // Verifier les permissions
        if ($user->isStudent() && $grade->student_id !== $user->student->id) {
            return response()->json([
                'message' => 'Non autorisé'
            ], 403);
        }
        
        if ($user->isTeacher() && $grade->teacher_id !== $user->teacher->id) {
            return response()->json([
                'message' => 'Non autorisé'
            ], 403);
        }
        
        return response()->json($grade);
    }

    //Mettre à jour la note selon id.

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $grade = Grade::findOrFail($id);
        
        // Vérifier les permissions
        if ($user->isTeacher() && $grade->teacher_id !== $user->teacher->id) {
            return response()->json([
                'message' => 'Non autorisé'
            ], 403);
        }
        
        if (!$user->isTeacher() && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Non autorisé'
            ], 403);
        }
        
        $request->validate([
            'grade' => 'required|numeric|min:0|max:20',
        ]);
        
        $grade->grade = $request->grade;
        $grade->save();
        
        return response()->json([
            'message' => 'Note mise à jour avec succès',
            'grade' => $grade->load(['student.user', 'teacher.user', 'subject', 'academicYear'])
        ]);
    }

    //Supprimer la note selon id.

    public function destroy($id)
    {
        $user = Auth::user();
        $grade = Grade::findOrFail($id);
        
        // Vérifier les permissions
        if ($user->isTeacher() && $grade->teacher_id !== $user->teacher->id) {
            return response()->json([
                'message' => 'Non autorisé'
            ], 403);
        }
        
        if (!$user->isTeacher() && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Non autorisé'
            ], 403);
        }
        
        $grade->delete();
        
        return response()->json([
            'message' => 'Note supprimée avec succès'
        ]);
    }

    //Obtenir les moyennes d'un étudiant.

    public function studentAverages($studentId, $academicYearId)
    {
        $user = Auth::user();
        $student = Student::findOrFail($studentId);
        
        // Vérifier les permissions
        if ($user->isStudent() && $user->student->id !== $student->id) {
            return response()->json([
                'message' => 'Non autorisé'
            ], 403);
        }
        
        $subjects = Subject::all();
        $academicYear = AcademicYear::findOrFail($academicYearId);
        
        $averages = [];
        $generalAverage = 0;
        $totalSubjects = 0;
        
        foreach ($subjects as $subject) {
            $average = $student->getAverageForSubject($subject->id, $academicYearId);
            
            if ($average) {
                $averages[] = [
                    'subject' => $subject,
                    'average' => round($average, 2)
                ];
                
                $generalAverage += $average;
                $totalSubjects++;
            }
        }
        
        $generalAverage = $totalSubjects > 0 ? round($generalAverage / $totalSubjects, 2) : 0;
        
        return response()->json([
            'student' => $student->load('user'),
            'academic_year' => $academicYear,
            'subject_averages' => $averages,
            'general_average' => $generalAverage
        ]);
    }
}