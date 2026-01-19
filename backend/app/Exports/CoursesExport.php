<?php

namespace App\Exports;

use App\Models\Course;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CoursesExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function collection()
    {
        $query = Course::with('stage');

        if (!empty($this->filters['stage_id']) && $this->filters['stage_id'] !== 'all') {
            $query->where('stage_id', $this->filters['stage_id']);
        }

        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return $query->get();
    }

    public function map($course): array
    {
        return [
            $course->id,
            $course->name,
            $course->code,
            $course->stage ? $course->stage->name : 'غير محدد',
            $this->getTypeLabel($course->type),
            $course->created_at->format('Y-m-d'),
        ];
    }

    public function headings(): array
    {
        return [
            '#',
            'اسم المادة',
            'رمز المادة',
            'المرحلة الدراسية',
            'النوع',
            'تاريخ الإضافة',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 12]],
        ];
    }

    private function getTypeLabel($type)
    {
        switch ($type) {
            case 'theory': return 'نظري';
            case 'practical': return 'عملي';
            case 'both': return 'نظري وعملي';
            default: return $type;
        }
    }
}
