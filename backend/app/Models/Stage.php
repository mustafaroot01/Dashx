<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class Stage extends Model
{
    use SoftDeletes;
    protected $guarded = [];

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function courses()
    {
        return $this->hasMany(Course::class);
    }

    public function configurations()
    {
        return $this->hasMany(StageConfiguration::class);
    }

    // Helper to get groups via configurations if needed, but for now we might rely on the configuration data
    public function groups()
    {
         // This was previously hasMany(Group::class). 
         // Since Groups are now global, we can't directly get "Stage Groups".
         // But we can get the groups *assigned* to this stage via the pivot.
         return $this->belongsToMany(Group::class, 'stage_configurations');
    }

    public function lecturers()
    {
        return $this->belongsToMany(Lecturer::class, 'lecturer_stage');
    }
}
