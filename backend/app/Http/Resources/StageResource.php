<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StageResource extends JsonResource
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
            'configurations' => $this->whenLoaded('configurations', function () {
                return $this->configurations->map(function ($config) {
                    return [
                        'study_type' => $config->studyType ? [
                            'id' => $config->studyType->id,
                            'name' => $config->studyType->name
                        ] : null,
                        'group' => $config->group ? [
                            'id' => $config->group->id,
                            'symbol' => $config->group->symbol
                        ] : null,
                    ];
                });
            }),
        ];
    }
}
