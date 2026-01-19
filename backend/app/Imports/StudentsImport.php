<?php

namespace App\Imports;

use App\Models\Student;
use App\Models\Group;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class StudentsImport implements ToCollection, WithHeadingRow
{
    protected $stageId;
    protected $studyTypeId;
    protected $groupId;

    public function __construct($stageId, $studyTypeId, $groupId = null)
    {
        $this->stageId = $stageId;
        $this->studyTypeId = $studyTypeId;
        $this->groupId = $groupId;
    }

    public function collection(Collection $rows)
    {
        \Illuminate\Support\Facades\Log::info('Importing rows count: ' . $rows->count());
        
        foreach ($rows as $index => $row) {
            \Illuminate\Support\Facades\Log::info("Row {$index} data: " . json_encode($row->toArray()));

            // Skip empty rows
            // Flexible Name Detection
            $nameHeaders = [
                'full_name', 'name', 'student_name', 
                'asm_altalb', 'asm_talb', 'alasm', 'asm', 
                'fullname', 'first_name', 'student'
            ];
            
            $fullName = null;
            foreach ($nameHeaders as $header) {
                if (!empty($row[$header])) {
                    $fullName = $row[$header];
                    break;
                }
            }
            
            if (!$fullName) {
                \Illuminate\Support\Facades\Log::warning("Row {$index} skipped: No name found.");
                continue;
            }
            
            try {
                // Determine Group: 
                // 1. If passed from frontend selector, use it.
                // 2. If present in Excel 'group' column, try to find it by symbol.
                // 3. Otherwise null.
                $groupId = $this->groupId;
                
                if (!$groupId && isset($row['group'])) {
                    $group = Group::where('symbol', $row['group'])->first();
                    if ($group) {
                        $groupId = $group->id;
                    }
                }
    
                Student::create([
                    'stage_id' => $this->stageId,
                    'study_type_id' => $this->studyTypeId,
                    'group_id' => $groupId,
                    'full_name' => $fullName,
                    'code' => $row['code'] ?? $this->generateUniqueCode(),
                    'gender' => $this->normalizeGender($row['gender'] ?? null),
                    'phone_number' => $row['phone'] ?? $row['phone_number'] ?? null,
                    'address' => $row['address'] ?? null,
                ]);
                \Illuminate\Support\Facades\Log::info("Row {$index} imported successfully.");
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Row {$index} failed: " . $e->getMessage());
            }
        }
    }

    private function generateUniqueCode()
    {
        return 'ST-' . strtoupper(uniqid());
    }

    private function normalizeGender($gender)
    {
        if (empty($gender)) return null;

        $gender = strtolower(trim($gender));
        if (in_array($gender, ['male', 'm', 'ذكر', 'ولد'])) return 'male';
        if (in_array($gender, ['female', 'f', 'anther', 'أنثى', 'انثى', 'بنت'])) return 'female';
        
        return null;
    }
}
