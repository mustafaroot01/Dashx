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
        Schema::table('students', function (Blueprint $table) {
            // Drop existing cascade foreign keys
            $table->dropForeign(['stage_id']);
            $table->dropForeign(['group_id']);
            $table->dropForeign(['study_type_id']);

            // Add new restrict foreign keys
            $table->foreign('stage_id')->references('id')->on('stages')->restrictOnDelete();
            $table->foreign('group_id')->references('id')->on('groups')->restrictOnDelete();
            $table->foreign('study_type_id')->references('id')->on('study_types')->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Drop restrict foreign keys
            $table->dropForeign(['stage_id']);
            $table->dropForeign(['group_id']);
            $table->dropForeign(['study_type_id']);

            // Restore cascade foreign keys
            $table->foreign('stage_id')->references('id')->on('stages')->cascadeOnDelete();
            $table->foreign('group_id')->references('id')->on('groups')->cascadeOnDelete();
            $table->foreign('study_type_id')->references('id')->on('study_types')->cascadeOnDelete();
        });
    }
};
