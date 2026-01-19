<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\RecordsActivity;

class Lecturer extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, RecordsActivity, SoftDeletes;

    protected $fillable = [
        'full_name',
        'username',
        'password',
        'code',
        'image_path',
        'certificate',
        'academic_title',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function stages()
    {
        return $this->belongsToMany(Stage::class, 'lecturer_stage');
    }

    public function courses()
    {
        return $this->belongsToMany(Course::class, 'course_lecturer');
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_lecturer');
    }

    public function studyTypes()
    {
        return $this->belongsToMany(StudyType::class, 'lecturer_study_type');
    }
}
