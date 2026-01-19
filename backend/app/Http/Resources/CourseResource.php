<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
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
            'name' => $this->name,
            'code' => $this->code,
            'stage_id' => $this->stage_id,
            'type' => $this->type,
            'semester' => $this->semester,
            'stage' => new StageResource($this->whenLoaded('stage')),
        ];
    }
}
