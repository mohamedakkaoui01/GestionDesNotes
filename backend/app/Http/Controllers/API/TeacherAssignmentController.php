<?php

namespace App\Http\Controllers\API;

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Teacher;
use App\Models\Subject;
use App\Models\SchoolClass;

class TeacherAssignmentController extends Controller
{
    //Assigner un enseignant a une matiere et une classe.

    public function assign(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'subject_id' => 'required|exists:subjects,id',
            'class_id' => 'required|exists:classes,id',
        ]);
        
        $teacher = Teacher::findOrFail($request->teacher_id);
        
        // Verifier si l'enseignant est déjà assigné à cette matière dans cette classe
        $exists = $teacher->subjects()
            ->wherePivot('subject_id', $request->subject_id)
            ->wherePivot('class_id', $request->class_id)
            ->exists();
        
        if ($exists) {
            // Just return success, don't error
            return response()->json([
                'message' => 'Enseignant déjà assigné à cette matière dans cette classe'
            ], 200);
        }
        
        $teacher->subjects()->attach($request->subject_id, ['class_id' => $request->class_id]);
        
        return response()->json([
            'message' => 'Enseignant assigné avec succès'
        ], 201);
    }

    // Retirer l'assignation d'un enseignant à une matière et une classe.

    public function unassign(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'subject_id' => 'required|exists:subjects,id',
            'class_id' => 'required|exists:classes,id',
        ]);
        
        $teacher = Teacher::findOrFail($request->teacher_id);
        
        $teacher->subjects()
            ->wherePivot('subject_id', $request->subject_id)
            ->wherePivot('class_id', $request->class_id)
            ->detach();
        
        return response()->json([
            'message' => 'Assignation supprimée avec succès'
        ]);
    }

    // Obtenir toutes les assignations d'enseignants.

    public function index()
    {
        $assignments = DB::table('teacher_subject')
            ->join('teachers', 'teacher_subject.teacher_id', '=', 'teachers.id')
            ->join('users', 'teachers.user_id', '=', 'users.id')
            ->join('subjects', 'teacher_subject.subject_id', '=', 'subjects.id')
            ->join('classes', 'teacher_subject.class_id', '=', 'classes.id')
            ->select(
                'teacher_subject.id',
                'teacher_subject.teacher_id',
                'teacher_subject.subject_id',
                'teacher_subject.class_id',
                'users.name as teacher_name',
                'subjects.name as subject_name',
                'classes.name as class_name'
            )
            ->get();
        
        return response()->json($assignments);
    }

    //get les matieres assignées à un enseignant spécifique.

    public function teacherSubjects($teacherId)
    {
        $teacher = Teacher::findOrFail($teacherId);
        
        $assignments = $teacher->subjects()
            ->with('classes')
            ->get()
            ->map(function ($subject) use ($teacher) {
                $classes = DB::table('teacher_subject')
                    ->where('teacher_id', $teacher->id)
                    ->where('subject_id', $subject->id)
                    ->join('classes', 'teacher_subject.class_id', '=', 'classes.id')
                    ->select('classes.*')
                    ->get();
                
                return [
                    'subject' => $subject,
                    'classes' => $classes
                ];
            });
        
        return response()->json([
            'teacher' => $teacher->load('user'),
            'assignments' => $assignments
        ]);
    }

    // Get all classes assigned to the logged-in teacher
    public function myClasses(Request $request)
    {
        $teacher = $request->user()->teacher;
        $classIds = \DB::table('teacher_subject')
            ->where('teacher_id', $teacher->id)
            ->pluck('class_id')
            ->unique();
        $classes = SchoolClass::whereIn('id', $classIds)->get();
        return response()->json($classes);
    }

    // Get all subjects assigned to the logged-in teacher, grouped by class
    public function mySubjects(Request $request)
    {
        $teacher = $request->user()->teacher;
        $assignments = $teacher->subjects()
            ->with('classes')
            ->get()
            ->map(function ($subject) use ($teacher) {
                $classes = \DB::table('teacher_subject')
                    ->where('teacher_id', $teacher->id)
                    ->where('subject_id', $subject->id)
                    ->join('classes', 'teacher_subject.class_id', '=', 'classes.id')
                    ->select('classes.*')
                    ->get();
                return [
                    'subject' => $subject,
                    'classes' => $classes
                ];
            });
        return response()->json([
            'teacher' => $teacher->load('user'),
            'assignments' => $assignments
        ]);
    }

    // Get students for a class, only if the logged-in teacher is assigned to that class
    public function myClassStudents(Request $request, $id)
    {
        $teacher = $request->user()->teacher;
        $isAssigned = \DB::table('teacher_subject')
            ->where('teacher_id', $teacher->id)
            ->where('class_id', $id)
            ->exists();
        if (!$isAssigned) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $class = SchoolClass::findOrFail($id);
        $students = $class->students()->with('user')->get();
        return response()->json($students);
    }

    public function batchAssign(Request $request)
    {
        $request->validate([
            'assignments' => 'required|array|min:1',
            'assignments.*.teacher_id' => 'required|exists:teachers,id',
            'assignments.*.subject_id' => 'required|exists:subjects,id',
            'assignments.*.class_id' => 'required|exists:classes,id',
        ]);

        $assignments = collect($request->assignments);
        $grouped = $assignments->groupBy('teacher_id');

        foreach ($grouped as $teacherId => $teacherAssignments) {
            $teacher = \App\Models\Teacher::find($teacherId);

            // Build a list of new assignments (subject_id, class_id)
            $newAssignments = $teacherAssignments->map(function ($a) {
                return [
                    'subject_id' => $a['subject_id'],
                    'class_id' => $a['class_id'],
                ];
            })->toArray();

            // Remove all old assignments for this teacher that are not in the new list
            $allOld = DB::table('teacher_subject')
                ->where('teacher_id', $teacherId)
                ->get(['subject_id', 'class_id']);

            foreach ($allOld as $old) {
                $stillExists = collect($newAssignments)->contains(function ($a) use ($old) {
                    return $a['subject_id'] == $old->subject_id && $a['class_id'] == $old->class_id;
                });
                if (!$stillExists) {
                    DB::table('teacher_subject')
                        ->where('teacher_id', $teacherId)
                        ->where('subject_id', $old->subject_id)
                        ->where('class_id', $old->class_id)
                        ->delete();
                }
            }

            // Now attach new assignments (only those not already existing)
            // Refresh the existing assignments after deletions
            $existing = DB::table('teacher_subject')
                ->where('teacher_id', $teacherId)
                ->get(['subject_id', 'class_id'])
                ->map(function ($row) {
                    return $row->subject_id . '-' . $row->class_id;
                })->toArray();

            foreach ($teacherAssignments as $a) {
                $key = $a['subject_id'] . '-' . $a['class_id'];
                if (!in_array($key, $existing)) {
                    $teacher->subjects()->attach($a['subject_id'], ['class_id' => $a['class_id']]);
                    $existing[] = $key;
                }
            }
        }

        return response()->json(['message' => 'Batch assignment processed.'], 200);
    }
}