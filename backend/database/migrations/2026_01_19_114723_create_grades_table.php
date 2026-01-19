<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            
            // Coursework Components (Max 10 each)
            $table->decimal('quizzes', 5, 2)->nullable();
            $table->decimal('projects', 5, 2)->nullable();
            $table->decimal('online_assignments', 5, 2)->nullable();
            $table->decimal('onsite_assignments', 5, 2)->nullable();
            $table->decimal('midterm_practical', 5, 2)->nullable();
            
            // Final Exam (Max 50)
            $table->decimal('final_exam', 5, 2)->nullable();
            
            $table->timestamps();

            // Unique constraint to prevent duplicate entries per student per course
            $table->unique(['student_id', 'course_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
