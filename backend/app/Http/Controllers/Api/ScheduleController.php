<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;
use App\Services\ActivityLogger;

class ScheduleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Schedule::with(['course', 'lecturer', 'stage', 'group']);

        if ($request->has('stage_id')) {
            $query->where('stage_id', $request->stage_id);
        }

        if ($request->has('group_id')) {
            $query->where('group_id', $request->group_id);
        }

        return $query->get();
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'stage_id' => 'required|exists:stages,id',
            'group_id' => 'required|exists:groups,id',
            'course_id' => 'required|exists:courses,id',
            'lecturer_id' => 'required|exists:lecturers,id',
            'day' => 'required|string|in:sunday,monday,tuesday,wednesday,thursday,friday,saturday',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'type' => 'required|in:theory,practical',
            'room' => 'nullable|string',
            'location' => 'nullable|string',
        ]);

        $schedule = Schedule::create($validated);

        ActivityLogger::log('create', "Created schedule for course {$schedule->course_id}", $schedule);

        return response()->json($schedule->load(['course', 'lecturer']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Schedule $schedule)
    {
        $validated = $request->validate([
            'stage_id' => 'exists:stages,id',
            'group_id' => 'exists:groups,id',
            'course_id' => 'exists:courses,id',
            'lecturer_id' => 'exists:lecturers,id',
            'day' => 'string|in:sunday,monday,tuesday,wednesday,thursday,friday,saturday',
            'start_time' => 'date_format:H:i',
            'end_time' => 'date_format:H:i|after:start_time',
            'type' => 'in:theory,practical',
            'room' => 'nullable|string',
            'location' => 'nullable|string',
        ]);

        $schedule->update($validated);

        ActivityLogger::log('update', "Updated schedule {$schedule->id}", $schedule);

        return response()->json($schedule->load(['course', 'lecturer']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $schedule = Schedule::with('course')->findOrFail($id);
        $courseName = $schedule->course ? $schedule->course->name : 'Unknown Course';
        $schedule->delete();
        
        ActivityLogger::log('delete', "Deleted schedule for course {$courseName}", $schedule);
        
        return response()->json(null, 204);
    }
}
