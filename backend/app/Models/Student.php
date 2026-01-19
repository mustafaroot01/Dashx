<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\RecordsActivity;

class Student extends Model
{
    use HasFactory, SoftDeletes, RecordsActivity;

    protected $guarded = [];

    // Automatically delete image when student is deleted
    protected static function booted()
    {
        static::deleting(function ($student) {
            if ($student->image_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($student->image_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($student->image_path);
            }
        });
    }

    public function stage()
    {
        return $this->belongsTo(Stage::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function studyType()
    {
        return $this->belongsTo(StudyType::class);
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }
}
