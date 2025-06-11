<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Subject;

class SubjectController extends Controller
{
    // Afficher la liste des matieres.

    public function index()
    {
        $subjects = Subject::all();
        return response()->json($subjects);
    }


    //Creer une nouvelle matiere.

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:subjects',
        ]);

        $subject = Subject::create([
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'Matière créée avec succès',
            'subject' => $subject
        ], 201);
    }

    //get la matiere selon id.
    public function show($id)
    {
        $subject = Subject::findOrFail($id);
        return response()->json($subject);
    }

    // Mettre à jour la matiere selon id.

    public function update(Request $request, $id)
    {
        $subject = Subject::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:100|unique:subjects,name,' . $id,
        ]);

        $subject->name = $request->name;
        $subject->save();

        return response()->json([
            'message' => 'Matière mise à jour avec succès',
            'subject' => $subject
        ]);
    }

    //Supprimer la matiere selon id.

    public function destroy($id)
    {
        $subject = Subject::findOrFail($id);
        $subject->delete();

        return response()->json([
            'message' => 'Matière supprimée avec succès'
        ]);
    }

    // Get les enseignants d'une matiere.
    public function teachers($id)
    {
        $subject = Subject::findOrFail($id);
        $teachers = $subject->teachers()->with('user')->get();
        
        return response()->json($teachers);
    }

    //get les classes where une matiere est enseignee.

    public function classes($id)
    {
        $subject = Subject::findOrFail($id);
        $classes = $subject->classes()->get();
        
        return response()->json($classes);
    }
}