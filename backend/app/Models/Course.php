<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\RecordsActivity;

class Course extends Model
{
    use HasFactory, RecordsActivity, SoftDeletes;
    protected $fillable = ['name', 'code', 'stage_id', 'type', 'semester'];

    public function stage()
    {
        return $this->belongsTo(Stage::class);
    }

    public function lecturers()
    {
        return $this->belongsToMany(Lecturer::class, 'course_lecturer');
    }
}
