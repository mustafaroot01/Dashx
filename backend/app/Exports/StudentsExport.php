<?php

namespace App\Exports;

use App\Models\Student;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class StudentsExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Student::with(['stage', 'group', 'studyType'])->get();
    }

    public function map($student): array
    {
        return [
            $student->id,
            $student->full_name,
            $student->code,
            $student->gender,
            $student->phone_number,
            $student->address,
            $student->stage ? $student->stage->name : '',
            $student->studyType ? $student->studyType->name : '',
            $student->group ? $student->group->symbol : '',
            $student->created_at->format('Y-m-d'),
        ];
    }

    public function headings(): array
    {
        return [
            'ID',
            'Full Name',
            'Code',
            'Gender',
            'Phone',
            'Address',
            'Stage',
            'Study Type',
            'Group',
            'Created At',
        ];
    }
}
