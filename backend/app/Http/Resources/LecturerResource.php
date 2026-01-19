<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LecturerResource extends JsonResource
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
            'full_name' => $this->full_name,
            'username' => $this->username,
            'code' => $this->code,
            'certificate' => $this->certificate,
            'academic_title' => $this->academic_title,
            'image_path' => $this->image_path,
            'stages' => StageResource::collection($this->whenLoaded('stages')),
            'courses' => CourseResource::collection($this->whenLoaded('courses')),
            'groups' => GroupResource::collection($this->whenLoaded('groups')),
            'study_types' => StudyTypeResource::collection($this->whenLoaded('studyTypes')),
        ];
    }
}
