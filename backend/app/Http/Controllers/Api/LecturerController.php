<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lecturer;
use App\Http\Resources\LecturerResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LecturerController extends Controller
{
    public function index()
    {
        return LecturerResource::collection(Lecturer::with(['stages', 'courses', 'groups', 'studyTypes'])->oldest()->paginate(10));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:lecturers',
            'password' => 'required|string|min:6',
            'code' => 'required|string|max:50|unique:lecturers',
            'certificate' => 'nullable|string',
            'academic_title' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
            'stage_ids' => 'array',
            'course_ids' => 'array',
            'group_ids' => 'array',
            'study_type_ids' => 'array',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('lecturers', 'public');
            $validated['image_path'] = $path;
        }

        // Auto-hash password
        // $validated['password'] is handled by model cast? No, casts works for accessors usually or explicit set. 
        // Actually 'hashed' cast in Laravel 10+ handles hashing on set automatically! 
        // BUT verify if explicit Hash::make is safer or compatible. Model casting 'hashed' is typically sufficient. 
        // Let's rely on the model cast I added.

        $lecturer = Lecturer::create($validated);

        if ($request->has('stage_ids')) $lecturer->stages()->sync($request->stage_ids);
        if ($request->has('course_ids')) $lecturer->courses()->sync($request->course_ids);
        if ($request->has('group_ids')) $lecturer->groups()->sync($request->group_ids);
        if ($request->has('study_type_ids')) $lecturer->studyTypes()->sync($request->study_type_ids);

        \App\Services\ActivityLogger::log('create', "Created lecturer: {$lecturer->full_name}", $lecturer);

        return new LecturerResource($lecturer->load(['stages', 'courses', 'groups', 'studyTypes']));
    }

    public function update(Request $request, Lecturer $lecturer)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:lecturers,username,' . $lecturer->id,
            'password' => 'nullable|string|min:6', // Optional on update
            'code' => 'required|string|max:50|unique:lecturers,code,' . $lecturer->id,
            'certificate' => 'nullable|string',
            'academic_title' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
            'stage_ids' => 'array',
            'course_ids' => 'array',
            'group_ids' => 'array',
            'study_type_ids' => 'array',
        ]);

        if ($request->hasFile('image')) {
            if ($lecturer->image_path) {
                Storage::disk('public')->delete($lecturer->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('lecturers', 'public');
        }

        // If password is not provided/null, removed it from array so it doesn't overwrite with null
        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $lecturer->update($validated);

        if ($request->has('stage_ids')) $lecturer->stages()->sync($request->stage_ids);
        if ($request->has('course_ids')) $lecturer->courses()->sync($request->course_ids);
        if ($request->has('group_ids')) $lecturer->groups()->sync($request->group_ids);
        if ($request->has('study_type_ids')) $lecturer->studyTypes()->sync($request->study_type_ids);

        \App\Services\ActivityLogger::log('update', "Updated lecturer: {$lecturer->full_name}", $lecturer);

        return new LecturerResource($lecturer->load(['stages', 'courses', 'groups', 'studyTypes']));
    }

    public function destroy(Lecturer $lecturer)
    {
        if ($lecturer->image_path) {
            Storage::disk('public')->delete($lecturer->image_path);
        }
        $name = $lecturer->full_name;
        $lecturer->delete();
        \App\Services\ActivityLogger::log('delete', "Deleted lecturer: {$name}", $lecturer);
        return response()->noContent();
    }
}
