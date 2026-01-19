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
        Schema::table('students', function (Blueprint $table) { $table->softDeletes(); });
        Schema::table('lecturers', function (Blueprint $table) { $table->softDeletes(); });
        Schema::table('courses', function (Blueprint $table) { $table->softDeletes(); });
        Schema::table('stages', function (Blueprint $table) { $table->softDeletes(); });
        Schema::table('groups', function (Blueprint $table) { $table->softDeletes(); });
        Schema::table('study_types', function (Blueprint $table) { $table->softDeletes(); });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) { $table->dropSoftDeletes(); });
        Schema::table('lecturers', function (Blueprint $table) { $table->dropSoftDeletes(); });
        Schema::table('courses', function (Blueprint $table) { $table->dropSoftDeletes(); });
        Schema::table('stages', function (Blueprint $table) { $table->dropSoftDeletes(); });
        Schema::table('groups', function (Blueprint $table) { $table->dropSoftDeletes(); });
        Schema::table('study_types', function (Blueprint $table) { $table->dropSoftDeletes(); });
    }
};
