<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stage;
use App\Models\StageConfiguration;
use App\Models\Group;
use App\Http\Resources\StageResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $query = Stage::with('configurations.group', 'configurations.studyType');

        $user = auth()->user();
        if ($user instanceof \App\Models\Lecturer) {
            $query->whereHas('lecturers', function ($q) use ($user) {
                $q->where('lecturers.id', $user->id);
            });
        }

        return StageResource::collection($query->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:stages,code',
            'study_types' => 'nullable|array',
            'study_types.*.id' => 'required|exists:study_types,id',
            'study_types.*.groups' => 'nullable|array',
            'study_types.*.groups.*' => 'required|exists:groups,id' // These are Template Group IDs
        ]);

        return \DB::transaction(function () use ($validated) {
            $stage = Stage::create([
                'name' => $validated['name'],
                'code' => $validated['code'],
            ]);

            if (isset($validated['study_types'])) {
                foreach ($validated['study_types'] as $type) {
                    if (isset($type['groups'])) {
                        foreach ($type['groups'] as $groupId) {
                             StageConfiguration::create([
                                'stage_id' => $stage->id,
                                'study_type_id' => $type['id'],
                                'group_id' => $groupId,
                            ]);
                        }
                    }
                }
            }

            \App\Services\ActivityLogger::log('create', "Created stage: {$stage->name}", $stage);

            return new StageResource($stage);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return new StageResource(Stage::findOrFail($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $stage = Stage::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:stages,code,' . $id,
            'study_types' => 'nullable|array',
            'study_types.*.id' => 'required|exists:study_types,id',
            'study_types.*.groups' => 'nullable|array',
            'study_types.*.groups.*' => 'required|exists:groups,id'
        ]);

        return \DB::transaction(function () use ($validated, $stage) {
            $stage->update([
                'name' => $validated['name'],
                'code' => $validated['code'],
            ]);

            // Clear existing configurations
            $stage->configurations()->delete();

            if (isset($validated['study_types'])) {
                foreach ($validated['study_types'] as $type) {
                    if (isset($type['groups'])) {
                        foreach ($type['groups'] as $groupId) {
                             StageConfiguration::create([
                                'stage_id' => $stage->id,
                                'study_type_id' => $type['id'],
                                'group_id' => $groupId,
                            ]);
                        }
                    }
                }
            }

            \App\Services\ActivityLogger::log('update', "Updated stage: {$stage->name}", $stage);

            return new StageResource($stage);
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $stage = Stage::findOrFail($id);
        $name = $stage->name;
        
        // Manually delete related students to trigger the 'deleting' event in Student model (deletes images)
        $stage->students()->get()->each(function($student) {
            $student->delete();
        });
        
        // Delete related courses
        $stage->courses()->delete();

        $stage->delete();

        \App\Services\ActivityLogger::log('delete', "Deleted stage: {$name}", $stage);

        return response()->json(null, 204);
    }
}
