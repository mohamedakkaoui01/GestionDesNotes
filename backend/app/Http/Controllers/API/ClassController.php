<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SchoolClass;

class ClassController extends Controller
{
    
    //get la liste des classes.

    // public function index()
    // {
    //     $classes = SchoolClass::all();
    //     return response()->json($classes);
    // }
    public function index()
{
    $classes = SchoolClass::withCount('students')->get();
    return response()->json($classes);
}

    //creer une nouvelle classe.

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:50|unique:classes',
        ]);

        $class = SchoolClass::create([
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'Classe créée avec succès',
            'class' => $class
        ], 201);
    }

 
    //Afficher la classe selon id.

    public function show($id)
    {
        $class = SchoolClass::with('students.user')->findOrFail($id);
        return response()->json($class);
    }


    //Mettre à jour la classe selon id.

    public function update(Request $request, $id)
    {
        $class = SchoolClass::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:50|unique:classes,name,' . $id,
        ]);

        $class->name = $request->name;
        $class->save();

        return response()->json([
            'message' => 'Classe mise à jour avec succès',
            'class' => $class
        ]);
    }

 
    //Supprimer la classe selon id.

    public function destroy($id)
    {
        $class = SchoolClass::findOrFail($id);
        $class->delete();

        return response()->json([
            'message' => 'Classe supprimée avec succès'
        ]);
    }

    //get les étudiants d'une classe selon id.

    public function students($id)
    {
        $class = SchoolClass::findOrFail($id);
        $students = $class->students()->with('user')->get();
        
        return response()->json($students);
    }


    //get les matières enseignees dans une classe selon id.

    public function subjects($id)
    {
        $class = SchoolClass::findOrFail($id);
        $subjects = $class->subjects()->with('teachers.user')->get();
        
        return response()->json($subjects);
    }

    // Get the logged-in student's class information
    public function myClass(Request $request)
    {
        $student = $request->user()->student;
        if (!$student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $class = $student->class()->with('students.user')->first();
        return response()->json($class);
    }

    // Get the logged-in student's subjects
    public function mySubjects(Request $request)
    {
        $student = $request->user()->student;
        if (!$student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $subjects = $student->class->subjects()->with('teachers.user')->get();
        return response()->json($subjects);
    }
}