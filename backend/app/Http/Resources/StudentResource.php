<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'full_name' => $this->full_name,
            'gender' => $this->gender,
            'phone_number' => $this->phone_number,
            'address' => $this->address,
            'image_path' => $this->image_path,
            'stage_id' => $this->stage_id,
            'study_type_id' => $this->study_type_id,
            'group_id' => $this->group_id,
            'stage' => new StageResource($this->whenLoaded('stage')),
            'study_type' => new StudyTypeResource($this->whenLoaded('studyType')),
            'group' => new GroupResource($this->whenLoaded('group')),
            'created_at' => $this->created_at,
        ];
    }
}
