<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    //
    protected $fillable = [
        'student_id',
        'course_id',
        'quizzes',
        'projects',
        'online_assignments',
        'onsite_assignments',
        'midterm_practical',
        'final_exam',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
