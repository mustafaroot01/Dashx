<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Http\Resources\StudentResource;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\StudentsExport;
use App\Imports\StudentsImport;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;

class StudentController extends Controller
{
    public function deleteAll()
    {
        // 1. Get all image paths to delete files physically
        $imagePaths = \Illuminate\Support\Facades\DB::table('students')
            ->whereNotNull('image_path')
            ->pluck('image_path')
            ->toArray();

        // 2. Delete files if any exist
        if (!empty($imagePaths)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($imagePaths);
        }
        
        // 3. Delete records from database
        \Illuminate\Support\Facades\DB::table('students')->delete();
        
        return response()->json(['message' => 'All students deleted successfully']);
    }

    public function import(Request $request) 
    {
        $request->validate([
            'stage_id' => 'required',
            'study_type_id' => 'required',
            'file' => 'required|mimes:xlsx,xls,csv'
        ]);

        Excel::import(new StudentsImport(
            $request->stage_id, 
            $request->study_type_id,
            $request->group_id // Optional
        ), $request->file('file'));

        return response()->json(['message' => 'Imported successfully']);
    }

    public function export() 
    {
        return Excel::download(new StudentsExport, 'students.xlsx');
    }
    public function index(Request $request)
    {
        $query = Student::with(['stage', 'group', 'studyType'])->oldest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('stage_id') && $request->stage_id !== 'all') {
            $query->where('stage_id', $request->stage_id);
        }

        if ($request->filled('study_type_id') && $request->study_type_id !== 'all') {
            $query->where('study_type_id', $request->study_type_id);
        }

        if ($request->filled('group_id') && $request->group_id !== 'all') {
            $query->where('group_id', $request->group_id);
        }

        return StudentResource::collection(
            $query->paginate(50)
        );
    }

    public function store(StoreStudentRequest $request)
    {
        $data = $request->except('image');

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('students', 'public');
        }

        $student = Student::create($data);

        \App\Services\ActivityLogger::log('create', "Created student: {$student->full_name}", $student);

        return new StudentResource($student->load(['stage', 'group', 'studyType']));
    }

    public function show(string $id)
    {
        return new StudentResource(
            Student::with(['stage', 'group', 'studyType'])->findOrFail($id)
        );
    }

    public function update(UpdateStudentRequest $request, string $id)
    {
        $student = Student::findOrFail($id);
        $data = $request->except('image');

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($student->image_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($student->image_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($student->image_path);
            }
            $data['image_path'] = $request->file('image')->store('students', 'public');
        }

        $student->update($data);

        \App\Services\ActivityLogger::log('update', "Updated student: {$student->full_name}", $student);

        return new StudentResource($student->load(['stage', 'group', 'studyType']));
    }

    public function destroy(string $id)
    {
        $student = Student::findOrFail($id);
        $name = $student->full_name;
        $student->delete();
        
        \App\Services\ActivityLogger::log('delete', "Deleted student: {$name}", $student);

        return response()->json(null, 204);
    }
}
