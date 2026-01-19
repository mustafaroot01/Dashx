<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Grade;
use App\Models\Student;
use App\Services\ActivityLogger;
use Illuminate\Support\Facades\DB;

class GradeController extends Controller
{
    /**
     * Get grades for a specific course, optionally filtered by stage/group.
     */
    public function index(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'stage_id' => 'required|exists:stages,id',
            'group_id' => 'nullable|exists:groups,id',
        ]);

        $courseId = $request->course_id;
        $stageId = $request->stage_id;
        $groupId = $request->group_id;

        // Authorization Check for Lecturers
        $user = auth()->user();
        if ($user instanceof \App\Models\Lecturer) {
            if (!$user->courses()->where('courses.id', $courseId)->exists()) {
                 return response()->json(['message' => 'Unauthorized access to this course.'], 403);
            }
             // Optional: Strict check for stage as well
            if (!$user->stages()->where('stages.id', $stageId)->exists()) {
                 return response()->json(['message' => 'Unauthorized access to this stage.'], 403);
            }
        }

        // Get students in the selected stage (and group if provided)
        $query = Student::where('stage_id', $stageId)
                        ->with(['grades' => function ($q) use ($courseId) {
                            $q->where('course_id', $courseId);
                        }]);

        if ($groupId) {
            $query->where('group_id', $groupId);
        }

        $students = $query->orderBy('full_name')->get();

        // Transform data for frontend
        return response()->json($students->map(function ($student) {
            $grade = $student->grades->first(); // Since we filtered relation by course_id
            return [
                'student_id' => $student->id,
                'student_name' => $student->full_name,
                'student_code' => $student->code,
                'grades' => $grade ? [
                    'quizzes' => $grade->quizzes,
                    'projects' => $grade->projects,
                    'online_assignments' => $grade->online_assignments,
                    'onsite_assignments' => $grade->onsite_assignments,
                    'midterm_practical' => $grade->midterm_practical,
                    'final_exam' => $grade->final_exam,
                ] : null,
            ];
        }));
    }

    /**
     * Store or update grades in bulk.
     */
    public function store(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.quizzes' => 'nullable|numeric|between:0,10',
            'grades.*.projects' => 'nullable|numeric|between:0,10',
            'grades.*.online_assignments' => 'nullable|numeric|between:0,10',
            'grades.*.onsite_assignments' => 'nullable|numeric|between:0,10',
            'grades.*.midterm_practical' => 'nullable|numeric|between:0,10',
            'grades.*.final_exam' => 'nullable|numeric|between:0,50',
        ]);

        $courseId = $request->course_id;
        
        // Authorization Check for Lecturers
        $user = auth()->user();
        if ($user instanceof \App\Models\Lecturer) {
             if (!$user->courses()->where('courses.id', $courseId)->exists()) {
                 return response()->json(['message' => 'Unauthorized access to this course.'], 403);
             }
        }

        $entries = $request->grades;

        DB::transaction(function () use ($courseId, $entries) {
            foreach ($entries as $entry) {
                Grade::updateOrCreate(
                    [
                        'student_id' => $entry['student_id'],
                        'course_id' => $courseId,
                    ],
                    [
                        'quizzes' => $entry['quizzes'] ?? null,
                        'projects' => $entry['projects'] ?? null,
                        'online_assignments' => $entry['online_assignments'] ?? null,
                        'onsite_assignments' => $entry['onsite_assignments'] ?? null,
                        'midterm_practical' => $entry['midterm_practical'] ?? null,
                        'final_exam' => $entry['final_exam'] ?? null,
                    ]
                );
            }
        });

        ActivityLogger::log('update', "Updated grades for course ID: {$courseId}");

        return response()->json(['message' => 'Grades saved successfully']);
    }
}
