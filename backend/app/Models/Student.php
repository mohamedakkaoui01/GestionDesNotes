<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'class_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function class()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    public function getAverageForSubject($subjectId, $academicYearId)
    {
        return $this->grades()
                    ->where('subject_id', $subjectId)
                    ->where('academic_year_id', $academicYearId)
                    ->avg('grade');
    }

    public function getGeneralAverage($academicYearId)
    {
        return $this->grades()
                    ->where('academic_year_id', $academicYearId)
                    ->avg('grade');
    }
}