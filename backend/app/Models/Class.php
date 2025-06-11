<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'name',
    ];

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }


    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'teacher_subject')
                    ->withPivot('subject_id')
                    ->withTimestamps();
    }


    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'teacher_subject', 'class_id', 'subject_id')
                    ->withPivot('teacher_id')
                    ->withTimestamps();
    }
}