"use client"

import { useState, useEffect } from "react"
import axiosClient from "@/lib/axios"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Calculator, AlertCircle } from "lucide-react"
import { Stage, Group, Course, StudentWithGrades, Grade } from "@/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Fetcher
const fetcher = (url: string) => axiosClient.get(url).then((res) => res.data.data || res.data)

export default function GradesPage() {
    // State
    const [selectedStage, setSelectedStage] = useState<string>("")
    const [selectedSemester, setSelectedSemester] = useState<string>("")
    const [selectedCourse, setSelectedCourse] = useState<string>("")

    // Students state for local editing
    const [students, setStudents] = useState<StudentWithGrades[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Data Fetching
    const { data: stages } = useSWR<Stage[]>('/stages', fetcher)

    // Fetch courses based on Stage AND Semester
    const { data: courses } = useSWR<Course[]>(
        selectedStage && selectedSemester
            ? `/courses?stage_id=${selectedStage}&semester=${selectedSemester}`
            : null,
        fetcher
    )

    // Fetch students with grades when Stage and Course are selected (Group removed)
    const { data: fetchedStudents, mutate } = useSWR<StudentWithGrades[]>(
        selectedStage && selectedCourse
            ? `/grades?course_id=${selectedCourse}&stage_id=${selectedStage}`
            : null,
        fetcher
    )

    // Sync fetched data to local state
    useEffect(() => {
        if (fetchedStudents) {
            setStudents(fetchedStudents)
        }
    }, [fetchedStudents])

    // ... (Handlers remain mostly same)

    const handleGradeChange = (studentId: number, field: keyof Grade, value: string) => {
        const numValue = value === "" ? null : parseFloat(value)

        // Basic validation bounds
        if (numValue !== null) {
            if (field === 'final_exam' && (numValue < 0 || numValue > 50)) return;
            if (field !== 'final_exam' && (numValue < 0 || numValue > 10)) return;
        }

        setStudents(prev => prev.map(student => {
            if (student.student_id === studentId) {
                const updatedGrades = { ...student.grades, [field]: numValue }
                // Ensure all fields exist
                return {
                    ...student,
                    grades: {
                        student_id: student.student_id,
                        quizzes: updatedGrades.quizzes ?? null,
                        projects: updatedGrades.projects ?? null,
                        online_assignments: updatedGrades.online_assignments ?? null,
                        onsite_assignments: updatedGrades.onsite_assignments ?? null,
                        midterm_practical: updatedGrades.midterm_practical ?? null,
                        final_exam: updatedGrades.final_exam ?? null,
                    },
                    isDirty: true
                } as StudentWithGrades
            }
            return student
        }))
    }

    const calculateCoursework = (grades: any) => {
        if (!grades) return 0
        return (
            (grades.quizzes || 0) +
            (grades.projects || 0) +
            (grades.online_assignments || 0) +
            (grades.onsite_assignments || 0) +
            (grades.midterm_practical || 0)
        )
    }

    const handleSave = async () => {
        if (!selectedCourse) return

        setIsSaving(true)
        setSaveSuccess(false)
        try {
            const payload = students.map(s => ({
                student_id: s.student_id,
                ...s.grades
            }))

            await axiosClient.post('/grades', {
                course_id: selectedCourse,
                grades: payload
            })

            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
            mutate() // Refresh data
        } catch (error) {
            console.error("Failed to save grades", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" dir="rtl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--chart-1)] bg-clip-text text-transparent">
                        سجل الدرجات
                    </h1>
                    <p className="text-[var(--muted-foreground)] mt-2">
                        إدارة ورصد درجات الطلاب لجميع المقررات الدراسية
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-t-4 border-t-[var(--primary)]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-[var(--primary)]" />
                        تصفية المقررات
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">المرحلة الدراسية</label>
                        <Select value={selectedStage} onValueChange={setSelectedStage}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر المرحلة" />
                            </SelectTrigger>
                            <SelectContent>
                                {stages?.map((stage) => (
                                    <SelectItem key={stage.id} value={stage.id.toString()}>
                                        {stage.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">الكورس (الفصل الدراسي)</label>
                        <Select value={selectedSemester} onValueChange={setSelectedSemester} disabled={!selectedStage}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الفصل" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">الكورس الأول</SelectItem>
                                <SelectItem value="2">الكورس الثاني</SelectItem>
                                <SelectItem value="yearly">نظام سنوي</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">المادة الدراسية</label>
                        <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={!selectedStage || !selectedSemester}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر المادة" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses?.map((course) => (
                                    <SelectItem key={course.id} value={course.id.toString()}>
                                        {course.name} ({course.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Grades Table */}
            {selectedCourse && (
                <Card className="border-t-4 border-t-[var(--chart-2)]">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Badge variant="outline" className="text-lg py-1 px-4">
                                {students.length} طالب
                            </Badge>
                        </CardTitle>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-32 transition-all duration-300 hover:scale-105"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                            حفظ التغييرات
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {saveSuccess && (
                            <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>تم بنجاح</AlertTitle>
                                <AlertDescription>
                                    تم حفظ الدرجات بنجاح لجميع الطلاب.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-[var(--muted)]">
                                    <TableRow>
                                        <TableHead className="w-[50px] text-center border-l bg-slate-100">#</TableHead>
                                        <TableHead className="w-[200px] text-right border-l font-bold bg-slate-100">الطالب</TableHead>

                                        {/* Coursework Components - Max 10 each */}
                                        <TableHead className="text-center w-[100px] border-l bg-blue-50 text-blue-800">
                                            الاختبارات<br /><span className="text-xs opacity-70">(10)</span>
                                        </TableHead>
                                        <TableHead className="text-center w-[100px] border-l bg-blue-50 text-blue-800">
                                            المشاريع<br /><span className="text-xs opacity-70">(10)</span>
                                        </TableHead>
                                        <TableHead className="text-center w-[100px] border-l bg-blue-50 text-blue-800">
                                            واجبات منزلية<br /><span className="text-xs opacity-70">(10)</span>
                                        </TableHead>
                                        <TableHead className="text-center w-[100px] border-l bg-blue-50 text-blue-800">
                                            واجبات صفية<br /><span className="text-xs opacity-70">(10)</span>
                                        </TableHead>
                                        <TableHead className="text-center w-[100px] border-l bg-blue-50 text-blue-800">
                                            عملي فصلي<br /><span className="text-xs opacity-70">(10)</span>
                                        </TableHead>

                                        {/* Computed Coursework Total */}
                                        <TableHead className="text-center w-[100px] border-l bg-indigo-100 text-indigo-900 font-bold">
                                            المجموع<br /><span className="text-xs opacity-70">(50)</span>
                                        </TableHead>

                                        {/* Final Exam - Separated */}
                                        <TableHead className="text-center w-[100px] border-l bg-amber-50 text-amber-900 font-bold border-r-4 border-r-amber-200">
                                            النهائي<br /><span className="text-xs opacity-70">(50)</span>
                                        </TableHead>

                                        {/* Grand Total */}
                                        <TableHead className="text-center w-[100px] bg-green-100 text-green-900 font-extrabold">
                                            الدرجة النهائية<br /><span className="text-xs opacity-70">(100)</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student, index) => {
                                        const coursework = calculateCoursework(student.grades)
                                        const final = student.grades?.final_exam || 0
                                        const total = coursework + final

                                        return (
                                            <TableRow key={student.student_id} className="hover:bg-slate-50 transition-colors">
                                                <TableCell className="text-center border-l bg-slate-50 font-medium text-slate-500">{index + 1}</TableCell>
                                                <TableCell className="font-medium border-l bg-slate-50">
                                                    <div className="flex flex-col">
                                                        <span>{student.student_name}</span>
                                                        <span className="text-xs text-muted-foreground font-mono">{student.student_code}</span>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="p-1 border-l">
                                                    <Input
                                                        type="number"
                                                        min="0" max="10"
                                                        className="text-center h-9 border-transparent hover:border-input focus:border-primary bg-transparent text-sm"
                                                        value={student.grades?.quizzes ?? ""}
                                                        onChange={(e) => handleGradeChange(student.student_id, 'quizzes', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-1 border-l">
                                                    <Input
                                                        type="number"
                                                        min="0" max="10"
                                                        className="text-center h-9 border-transparent hover:border-input focus:border-primary bg-transparent text-sm"
                                                        value={student.grades?.projects ?? ""}
                                                        onChange={(e) => handleGradeChange(student.student_id, 'projects', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-1 border-l">
                                                    <Input
                                                        type="number"
                                                        min="0" max="10"
                                                        className="text-center h-9 border-transparent hover:border-input focus:border-primary bg-transparent text-sm"
                                                        value={student.grades?.online_assignments ?? ""}
                                                        onChange={(e) => handleGradeChange(student.student_id, 'online_assignments', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-1 border-l">
                                                    <Input
                                                        type="number"
                                                        min="0" max="10"
                                                        className="text-center h-9 border-transparent hover:border-input focus:border-primary bg-transparent text-sm"
                                                        value={student.grades?.onsite_assignments ?? ""}
                                                        onChange={(e) => handleGradeChange(student.student_id, 'onsite_assignments', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-1 border-l">
                                                    <Input
                                                        type="number"
                                                        min="0" max="10"
                                                        className="text-center h-9 border-transparent hover:border-input focus:border-primary bg-transparent text-sm"
                                                        value={student.grades?.midterm_practical ?? ""}
                                                        onChange={(e) => handleGradeChange(student.student_id, 'midterm_practical', e.target.value)}
                                                    />
                                                </TableCell>

                                                <TableCell className="text-center font-bold text-indigo-700 bg-indigo-50 border-l">
                                                    {coursework}
                                                </TableCell>

                                                <TableCell className="p-1 border-l border-r-4 border-r-amber-100 bg-amber-50/50">
                                                    <Input
                                                        type="number"
                                                        min="0" max="50"
                                                        className="text-center h-9 font-bold text-amber-900 border-transparent hover:border-amber-300 focus:border-amber-500 bg-transparent"
                                                        value={student.grades?.final_exam ?? ""}
                                                        onChange={(e) => handleGradeChange(student.student_id, 'final_exam', e.target.value)}
                                                    />
                                                </TableCell>

                                                <TableCell className="text-center font-extrabold text-green-700 bg-green-50">
                                                    {total}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
