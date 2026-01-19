<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\RecordsActivity;

use Illuminate\Database\Eloquent\SoftDeletes;

class Group extends Model
{
    use HasFactory, RecordsActivity, SoftDeletes;

    protected $guarded = [];

    // Relationships removed as Group is now a standalone symbol


    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function stages()
    {
        return $this->belongsToMany(Stage::class, 'stage_configurations');
    }
}
