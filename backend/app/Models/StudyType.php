<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class StudyType extends Model
{
    use SoftDeletes;
    protected $guarded = [];

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    // Relationship removed as Group is now decoupled

}
