<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Http\Resources\StudentResource;

class DashboardController extends Controller
{
    public function stats()
    {
        return response()->json([
            'stages_count' => \App\Models\Stage::count(),
            'groups_count' => \App\Models\Group::count(),
            'students_count' => \App\Models\Student::count(),
            'courses_count' => \App\Models\Course::count(),
            'lecturers_count' => \App\Models\Lecturer::count(),
            'study_types_count' => \App\Models\StudyType::count(),
            'recent_students' => StudentResource::collection(\App\Models\Student::with('stage', 'group')->latest()->take(5)->get())->resolve(),
        ]);
    }
}
