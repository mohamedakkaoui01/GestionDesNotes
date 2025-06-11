<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
    ];


    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'teacher_subject')
                    ->withPivot('class_id')
                    ->withTimestamps();
    }


    public function classes()
    {
        return $this->belongsToMany(SchoolClass::class, 'teacher_subject', 'teacher_id', 'class_id')
                    ->withPivot('subject_id')
                    ->withTimestamps();
    }


    public function grades()
    {
        return $this->hasMany(Grade::class);
    }
}