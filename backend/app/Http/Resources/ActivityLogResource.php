<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => $this->user ? $this->user->name : 'Unknown',
            'action' => $this->action,
            'description' => $this->description,
            'subject_type' => $this->subject_type,
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at,
            'created_at_human' => $this->created_at->diffForHumans(),
        ];
    }
}
