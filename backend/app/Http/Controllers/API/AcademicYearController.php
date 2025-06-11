<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;

class AcademicYearController extends Controller
{
    public function index()
    {
        return response()->json(AcademicYear::all());
    }
} 