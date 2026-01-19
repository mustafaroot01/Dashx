<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StageConfiguration extends Model
{
    protected $guarded = [];

    public function stage()
    {
        return $this->belongsTo(Stage::class);
    }

    public function studyType()
    {
        return $this->belongsTo(StudyType::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }
}
