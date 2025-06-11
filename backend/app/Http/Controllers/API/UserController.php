<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Student;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // Afficher la liste des users.

public function index(Request $request)
{
    $role = $request->input('role');
    
    $query = User::query();
    
    if ($role) {
        $query->where('role', $role);
        
        // Add this line to load relationships based on role
        if ($role === 'étudiant') {
            $query->with(['student.class']);
        } elseif ($role === 'enseignant') {
            $query->with(['teacher.subjects']);
        }
    }
    
    $perPage = $request->input('per_page', 10);
    $users = $query->paginate($perPage);
    
    return response()->json($users);
 }

    // creer un nouveau user.

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,enseignant,étudiant',
            'class_id' => 'required_if:role,étudiant|exists:classes,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        if ($request->role === 'enseignant') {
            Teacher::create([
                'user_id' => $user->id,
            ]);
        } elseif ($request->role === 'étudiant') {
            Student::create([
                'user_id' => $user->id,
                'class_id' => $request->class_id,
            ]);
        }

        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user' => $user
        ], 201);
    }

    //get l'utilisateur selon id.

    public function show($id)
    {
        $user = User::findOrFail($id);
        
        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];
        
        if ($user->isTeacher()) {
            $data['teacher'] = $user->teacher;
        } elseif ($user->isStudent()) {
            $data['student'] = $user->student;
            $data['class'] = $user->student->class;
        }
        
        return response()->json($data);
    }

    //Mettre à jour l'utilisateur selon id.

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:8',
            'role' => 'required|in:admin,enseignant,étudiant',
            'class_id' => 'required_if:role,étudiant|exists:classes,id',
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        
        if ($request->password) {
            $user->password = Hash::make($request->password);
        }
        
        // Si le rôle change
        if ($user->role !== $request->role) {
            // Supprimer les anciens profils
            if ($user->isTeacher()) {
                $user->teacher()->delete();
            } elseif ($user->isStudent()) {
                $user->student()->delete();
            }
            
            // Créer le nouveau profil
            if ($request->role === 'enseignant') {
                Teacher::create([
                    'user_id' => $user->id,
                ]);
            } elseif ($request->role === 'étudiant') {
                Student::create([
                    'user_id' => $user->id,
                    'class_id' => $request->class_id,
                ]);
            }
            
            $user->role = $request->role;
        } elseif ($user->isStudent() && $request->has('class_id')) {
            // Mettre à jour la classe de l'étudiant si nécessaire
            $user->student->class_id = $request->class_id;
            $user->student->save();
        }
        
        $user->save();

        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès',
            'user' => $user
        ]);
    }

    //Supprimer l'utilisateur selon id.

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => 'Utilisateur supprimé avec succès'
        ]);
    }
}