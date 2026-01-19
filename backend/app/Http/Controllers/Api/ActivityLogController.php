<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use App\Http\Resources\ActivityLogResource;

class ActivityLogController extends Controller
{
    public function index()
    {
        return ActivityLogResource::collection(
            ActivityLog::with('user')->latest()->paginate(10)
        );
    }
}
