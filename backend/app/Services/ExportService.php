<?php

namespace App\Services;

use App\Models\Course;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Exports\CoursesExport;
use Illuminate\Support\Facades\Log;

class ExportService
{
    /**
     * Export courses to Excel
     */
    public function exportCoursesToExcel(array $filters)
    {
        return Excel::download(
            new CoursesExport($filters), 
            'courses_' . date('Y-m-d') . '.xlsx'
        );
    }

    /**
     * Export courses to PDF
     */
    public function exportCoursesToPDF(array $filters)
    {
        try {
            $query = Course::with('stage');
            $filterParts = [];

            // Apply Filters (Stage)
            if (isset($filters['stage_id']) && $filters['stage_id'] !== 'all') {
                $query->where('stage_id', $filters['stage_id']);
                $stage = \App\Models\Stage::find($filters['stage_id']);
                if ($stage) {
                    $filterParts[] = 'المرحلة: ' . $stage->name;
                }
            }

            // Apply Filters (Search)
            if (isset($filters['search']) && $filters['search']) {
                $search = $filters['search'];
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
                });
                $filterParts[] = 'بحث: ' . $search;
            }

            $courses = $query->get();
            $filterInfo = implode('، ', $filterParts);

            $pdf = Pdf::loadView('exports.courses_pdf', compact('courses', 'filterInfo'));
            
            // Set options for better Arabic support
            $pdf->setOptions([
                'defaultFont' => 'dejavu sans',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'fontDir' => storage_path('fonts'),
                'fontCache' => storage_path('fonts'),
            ]);

            return $pdf->download('courses_' . date('Y-m-d') . '.pdf');

        } catch (\Exception $e) {
            Log::error('PDF Export Error: ' . $e->getMessage());
            throw $e; // Re-throw to be handled by controller
        }
    }
}
