<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Stage;
use App\Models\Student;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Map duplicate code (bad) => original code (good)
        $map = [
            'S1' => 'STG1',
            'S2' => 'STG2',
            'S3' => 'STG3',
            'S4' => 'STG4',
        ];

        foreach ($map as $badCode => $goodCode) {
            $badStage = Stage::where('code', $badCode)->first();
            $goodStage = Stage::where('code', $goodCode)->first();

            if ($badStage && $goodStage) {
                // Move students from bad stage to good stage
                Student::where('stage_id', $badStage->id)
                    ->update(['stage_id' => $goodStage->id]);

                // Delete bad stage (force delete to remove completely)
                $badStage->forceDelete();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot easily reverse this merger without backups
    }
};
