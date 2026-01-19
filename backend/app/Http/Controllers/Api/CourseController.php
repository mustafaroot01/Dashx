<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Http\Resources\CourseResource;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    protected $exportService;

    public function __construct(\App\Services\ExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    public function index(Request $request)
    {
        $query = Course::with('stage');

        if ($request->has('stage_id')) {
            $query->where('stage_id', $request->stage_id);
        }

        if ($request->has('semester')) {
            if ($request->semester === 'yearly') {
                $query->whereNull('semester');
            } else {
                $query->where('semester', $request->semester);
            }
        }

        $user = auth()->user();
        if ($user instanceof \App\Models\Lecturer) {
            $query->whereHas('lecturers', function ($q) use ($user) {
                $q->where('lecturers.id', $user->id);
            });
        }

        return CourseResource::collection($query->get());
    }

    public function store(StoreCourseRequest $request)
    {
        $course = Course::create($request->validated());
        \App\Services\ActivityLogger::log('create', "Created course: {$course->name}", $course);
        return new CourseResource($course->load('stage'));
    }

    public function show(string $id)
    {
        return new CourseResource(Course::with('stage')->findOrFail($id));
    }

    public function update(UpdateCourseRequest $request, string $id)
    {
        $course = Course::findOrFail($id);
        $course->update($request->validated());
        \App\Services\ActivityLogger::log('update', "Updated course: {$course->name}", $course);
        return new CourseResource($course->load('stage'));
    }

    public function destroy(string $id)
    {
        $course = Course::findOrFail($id);
        $name = $course->name;
        $course->delete();
        \App\Services\ActivityLogger::log('delete', "Deleted course: {$name}", $course);
        return response()->json(null, 204);
    }

    public function exportExcel(Request $request)
    {
        return $this->exportService->exportCoursesToExcel($request->all());
    }

    public function exportPDF(Request $request)
    {
        try {
            return $this->exportService->exportCoursesToPDF($request->all());
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate PDF'], 500);
        }
    }
}
