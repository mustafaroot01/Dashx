<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\ActivityLogController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    Route::apiResource('stages', \App\Http\Controllers\Api\StageController::class);
    Route::apiResource('study-types', \App\Http\Controllers\Api\StudyTypeController::class);
    Route::apiResource('groups', \App\Http\Controllers\Api\GroupController::class);
    
    Route::post('/students/import', [\App\Http\Controllers\Api\StudentController::class, 'import']);
    Route::delete('/students/delete-all', [\App\Http\Controllers\Api\StudentController::class, 'deleteAll']);
    Route::get('/students/export', [\App\Http\Controllers\Api\StudentController::class, 'export']);
    Route::apiResource('students', \App\Http\Controllers\Api\StudentController::class);

    
    // Export Routes
    Route::get('/courses/export/excel', [\App\Http\Controllers\Api\CourseController::class, 'exportExcel']);
    Route::get('/courses/export/pdf', [\App\Http\Controllers\Api\CourseController::class, 'exportPDF']);
    
    // Dashboard Stats
    Route::get('/dashboard/stats', [\App\Http\Controllers\Api\DashboardController::class, 'stats']);

    Route::apiResource('courses', \App\Http\Controllers\Api\CourseController::class);
    Route::apiResource('lecturers', \App\Http\Controllers\Api\LecturerController::class);
    Route::get('/activity-logs', [\App\Http\Controllers\Api\ActivityLogController::class, 'index']);

    // Profile & Settings
    Route::post('/profile/update', [\App\Http\Controllers\Api\ProfileController::class, 'updateProfile']);
    Route::post('/profile/password', [\App\Http\Controllers\Api\ProfileController::class, 'updatePassword']);

    Route::apiResource('schedules', \App\Http\Controllers\Api\ScheduleController::class);
    // Grades
    Route::get('/grades', [\App\Http\Controllers\Api\GradeController::class, 'index']);
    Route::post('/grades', [\App\Http\Controllers\Api\GradeController::class, 'store']);
});
