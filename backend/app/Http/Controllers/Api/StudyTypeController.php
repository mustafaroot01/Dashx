<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudyType;
use App\Http\Resources\StudyTypeResource;
use Illuminate\Http\Request;

class StudyTypeController extends Controller
{
    public function index()
    {
        return StudyTypeResource::collection(StudyType::all());
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:study_types,name']);
        $studyType = StudyType::create($request->all());
        \App\Services\ActivityLogger::log('create', "Created study type: {$studyType->name}", $studyType);
        return new StudyTypeResource($studyType);
    }

    public function show(string $id)
    {
        return new StudyTypeResource(StudyType::findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $studyType = StudyType::findOrFail($id);
        $request->validate(['name' => 'required|string|unique:study_types,name,' . $id]);
        $studyType->update($request->all());
        \App\Services\ActivityLogger::log('update', "Updated study type: {$studyType->name}", $studyType);
        return new StudyTypeResource($studyType);
    }

    public function destroy(string $id)
    {
        $studyType = StudyType::findOrFail($id);
        $name = $studyType->name;

        // Delete related students (triggers image cleanup)
        $studyType->students()->get()->each(function($student) {
            $student->delete();
        });

        // Groups are now decoupled, so we don't delete them.


        $studyType->delete();
        \App\Services\ActivityLogger::log('delete', "Deleted study type: {$name}", $studyType);
        return response()->json(null, 204);
    }
}
