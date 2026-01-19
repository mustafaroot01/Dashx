<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Http\Resources\GroupResource;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    public function index(Request $request)
    {
        $query = Group::query();

        if ($request->has('stage_id')) {
            $query->whereHas('stages', function($q) use ($request) {
                $q->where('stages.id', $request->stage_id);
            });
        }

        if ($request->has('study_type_id')) {
            $query->where('study_type_id', $request->study_type_id);
        }

        return GroupResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'symbol' => 'required|string|unique:groups,symbol',
        ]);

        $group = Group::create($request->all());
        \App\Services\ActivityLogger::log('create', "Created group: {$group->symbol}", $group);
        return new GroupResource($group);
    }

    public function show(string $id)
    {
        return new GroupResource(Group::findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $group = Group::findOrFail($id);
        
        $request->validate([
            'symbol' => 'required|string|unique:groups,symbol,' . $id,
        ]);

        $group->update($request->all());
        \App\Services\ActivityLogger::log('update', "Updated group: {$group->symbol}", $group);
        return new GroupResource($group);
    }

    public function destroy(string $id)
    {
        $group = Group::findOrFail($id);
        $symbol = $group->symbol;
        
        // Delete related students to trigger image cleanup
        $group->students()->get()->each(function($student) {
            $student->delete();
        });

        $group->delete();
        \App\Services\ActivityLogger::log('delete', "Deleted group: {$symbol}", $group);
        return response()->json(null, 204);
    }
}
