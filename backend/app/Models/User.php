<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;


    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];


    protected $hidden = [
        'password',
        'remember_token',
    ];


    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];


    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }


    public function isTeacher(): bool
    {
        return $this->role === 'enseignant';
    }


    public function isStudent(): bool
    {
        return $this->role === 'étudiant';
    }


    public function teacher()
    {
        return $this->hasOne(Teacher::class);
    }


    public function student()
    {
        return $this->hasOne(Student::class);
    }
}