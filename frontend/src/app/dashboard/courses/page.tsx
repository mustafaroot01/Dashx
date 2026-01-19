"use client"

import { useState } from "react"
import axiosClient from "@/lib/axios"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Plus, Loader2, Trash2, BookOpen, Pencil, Search, Filter, FileSpreadsheet, FileText, Download, Layers } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/shared/TableSkeleton"

// Fetcher
const fetcher = (url: string) => axiosClient.get(url).then(res => res.data.data || res.data)

import { Course, Stage } from "@/types"

export default function CoursesPage() {
    const [userRole, setUserRole] = useState<string>('admin')

    // SWR Hooks
    const { data: courses, mutate: mutateCourses, isLoading: loadingCourses } = useSWR<Course[]>('/courses', fetcher)
    const { data: stages } = useSWR<Stage[]>('/stages', fetcher)

    const isLoading = loadingCourses

    // Filter State
    const [selectedStageFilter, setSelectedStageFilter] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isExportingExcel, setIsExportingExcel] = useState(false)
    const [isExportingPDF, setIsExportingPDF] = useState(false)

    // Delete State
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        stage_id: "",
        type: "theory",
        semester: "0"
    })
    const [error, setError] = useState("")

    // Check user role
    useState(() => {
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('user')
            if (userData) {
                const user = JSON.parse(userData)
                setUserRole(user.role || 'admin')
            }
        }
    })

    const resetForm = () => {
        setFormData({ name: "", code: "", stage_id: "", type: "theory", semester: "0" })
        setIsEditMode(false)
        setEditingId(null)
        setError("")
    }

    const handleOpenCreate = () => {
        resetForm()
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (course: Course) => {
        setFormData({
            name: course.name,
            code: course.code,
            stage_id: String(course.stage_id),
            type: course.type || "theory",
            semester: course.semester ? String(course.semester) : "0"
        })
        setIsEditMode(true)
        setEditingId(course.id)
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)

        try {
            const payload = {
                ...formData,
                semester: formData.semester === "0" ? null : formData.semester
            }

            if (isEditMode && editingId) {
                await axiosClient.put(`/courses/${editingId}`, payload)
            } else {
                await axiosClient.post('/courses', payload)
            }
            setIsDialogOpen(false)
            resetForm()
            mutateCourses() // Refresh list
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const msgs = Object.values(err.response.data.errors).flat()
                setError(msgs[0] as string)
            } else {
                setError("فشل حفظ البيانات")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await axiosClient.delete(`/courses/${deleteId}`)
            mutateCourses()
        } catch (e) {
            alert("فشل الحذف")
        } finally {
            setDeleteId(null)
        }
    }

    // Export Handlers (Updated to export currently viewable stuff if needed, sticking to generic export)
    const handleExportExcel = async () => {
        try {
            setIsExportingExcel(true)
            const response = await axiosClient.get('/courses/export/excel', {
                params: {
                    stage_id: selectedStageFilter,
                    search: searchQuery
                },
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `courses_${new Date().toISOString().split('T')[0]}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            console.error("Export failed", error)
            alert("فشل تصدير ملف Excel")
        } finally {
            setIsExportingExcel(false)
        }
    }

    const handleExportPDF = async () => {
        try {
            setIsExportingPDF(true)
            const response = await axiosClient.get('/courses/export/pdf', {
                params: {
                    stage_id: selectedStageFilter,
                    search: searchQuery
                },
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `courses_${new Date().toISOString().split('T')[0]}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            console.error("Export failed", error)
            alert("فشل تصدير ملف PDF")
        } finally {
            setIsExportingPDF(false)
        }
    }

    // Filter Logic
    const filteredCourses = !courses ? [] : courses.filter(course => {
        const matchesStage = selectedStageFilter === "all" || course.stage_id.toString() === selectedStageFilter
        const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.code.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesStage && matchesSearch
    })

    const semester1Courses = filteredCourses.filter(c => c.semester === 1)
    const semester2Courses = filteredCourses.filter(c => c.semester === 2)
    const yearlyCourses = filteredCourses.filter(c => !c.semester || c.semester === 0)

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'theory': return 'نظري';
            case 'practical': return 'عملي';
            case 'both': return 'نظري وعملي';
            default: return type;
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'theory': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'practical': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'both': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    }

    const CoursesTable = ({ coursesList }: { coursesList: Course[] }) => (
        <div className="rounded-xl border border-[var(--border)]/50 shadow-sm bg-card overflow-hidden">
            <Table>
                <TableHeader className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
                    <TableRow>
                        <TableHead className="text-center w-[50px] font-bold text-[var(--sidebar)]">#</TableHead>
                        <TableHead className="text-right font-bold text-[var(--sidebar)]">اسم المادة</TableHead>
                        <TableHead className="text-center font-bold text-[var(--sidebar)]">الرمز</TableHead>
                        <TableHead className="text-center font-bold text-[var(--sidebar)]">المرحلة الدراسية</TableHead>
                        <TableHead className="text-center font-bold text-[var(--sidebar)]">الكورس</TableHead>
                        <TableHead className="text-center font-bold text-[var(--sidebar)]">النوع</TableHead>
                        {userRole === 'admin' && (
                            <TableHead className="text-left w-[100px] font-bold text-[var(--sidebar)]">الإجراءات</TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableSkeleton columns={userRole === 'admin' ? 7 : 6} rows={5} />
                    ) : coursesList.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={userRole === 'admin' ? 7 : 6} className="h-32 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Layers className="h-8 w-8 text-muted-foreground/30" />
                                    <span>لا توجد مقاررات في هذا القسم.</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        coursesList.map((course, index) => (
                            <TableRow key={course.id} className="hover:bg-[var(--muted)]/30 transition-colors border-b border-[var(--border)]/50 last:border-0 group">
                                <TableCell className="font-medium text-muted-foreground bg-[var(--muted)]/20 text-center">
                                    {index + 1}
                                </TableCell>
                                <TableCell className="font-semibold text-[var(--foreground)] text-right">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-[var(--sidebar)]/5 flex items-center justify-center group-hover:bg-[var(--primary)]/10 transition-colors">
                                            <BookOpen className="h-4 w-4 text-[var(--sidebar)] group-hover:text-[var(--primary)]" />
                                        </div>
                                        {course.name}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="border-[var(--border)] text-[var(--muted-foreground)] font-mono shadow-sm bg-[var(--card)]">
                                        {course.code}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--sidebar)]/5 text-[var(--sidebar)] border border-[var(--sidebar)]/10">
                                        {course.stage?.name}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${course.semester === 1 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        course.semester === 2 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                            'bg-slate-50 text-slate-700 border-slate-200'
                                        }`}>
                                        {course.semester === 1 ? 'الكورس الأول' : course.semester === 2 ? 'الكورس الثاني' : 'سنوي'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getTypeColor(course.type)}`}>
                                        {getTypeLabel(course.type)}
                                    </span>
                                </TableCell>
                                {userRole === 'admin' && (
                                    <TableCell className="text-left">
                                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[var(--primary)] hover:bg-[var(--primary)]/10" onClick={() => handleOpenEdit(course)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(course.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" dir="rtl" style={{ direction: 'rtl' }}>
            {/* Hero Section - Official Academic Style */}
            <div className="relative overflow-hidden rounded-xl bg-[var(--sidebar)] text-white shadow-xl border-t-4 border-[var(--primary)] flex flex-col md:flex-row items-center justify-between p-8">
                <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                            <BookOpen className="h-6 w-6 text-[var(--sidebar-primary)]" />
                        </div>
                        <span className="text-[var(--sidebar-primary)] font-semibold tracking-wider text-xs uppercase">إدارة المناهج</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        المقررات الدراسية
                    </h1>
                    <p className="text-[var(--sidebar-foreground)]/80 text-sm max-w-lg">
                        إدارة شاملة للمواد الدراسية وتوزيعها على الكورسات والمراحل.
                    </p>
                </div>

                <div className="relative z-10 mt-6 md:mt-0">
                    {userRole === 'admin' && (
                        <Button onClick={handleOpenCreate} size="lg" className="rounded-md shadow-lg bg-[var(--sidebar-primary)] hover:bg-white hover:text-[var(--sidebar)] text-[var(--sidebar)] font-bold transition-all px-6">
                            <Plus className="ml-2 h-5 w-5" />
                            إضافة مقرر جديد
                        </Button>
                    )}
                </div>

                {/* Abstract Background Decoration */}
                <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/2 w-64 h-64 bg-[var(--sidebar-primary)]/20 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/2 w-80 h-80 bg-blue-900/40 blur-3xl rounded-full"></div>
            </div>

            {/* Filters & Stats Bar */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card className="md:col-span-3 border-t-[4px] border-t-[var(--primary)] shadow-sm bg-card overflow-hidden">
                    <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute right-3 top-3.5 h-4 w-4 text-[var(--muted-foreground)]" />
                            <Input
                                placeholder="بحث باسم المادة أو الرمز..."
                                className="pr-10 border-[var(--border)] focus-visible:ring-[var(--primary)] bg-[var(--background)] h-11"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="p-2 bg-[var(--muted)] rounded-md border border-[var(--border)]">
                                <Filter className="h-5 w-5 text-[var(--muted-foreground)]" />
                            </div>
                            <Select value={selectedStageFilter} onValueChange={setSelectedStageFilter}>
                                <SelectTrigger className="w-full md:w-[220px] border-[var(--border)] focus:ring-[var(--primary)] h-11 bg-[var(--background)]">
                                    <SelectValue placeholder="تصفية حسب المرحلة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">عرض كل المراحل</SelectItem>
                                    {stages?.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-[var(--sidebar)] text-white relative overflow-hidden group">
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--sidebar-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardContent className="p-6 flex flex-col justify-center items-center text-center relative z-10 h-full">
                        <div className="mb-2 p-3 bg-white/5 rounded-full ring-1 ring-white/10">
                            <BookOpen className="h-6 w-6 text-[var(--sidebar-primary)]" />
                        </div>
                        <span className="text-4xl font-bold font-mono tracking-tight">{filteredCourses.length}</span>
                        <span className="text-[var(--sidebar-foreground)]/70 text-sm font-medium mt-1">مقرر دراسي مسجل</span>
                    </CardContent>
                </Card>
            </div>

            {/* Export Section */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    disabled={isExportingExcel || loadingCourses}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                >
                    {isExportingExcel ? (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FileSpreadsheet className="ml-2 h-4 w-4" />
                    )}
                    تصدير Excel
                </Button>
                <Button
                    variant="outline"
                    onClick={handleExportPDF}
                    disabled={isExportingPDF || loadingCourses}
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                >
                    {isExportingPDF ? (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FileText className="ml-2 h-4 w-4" />
                    )}
                    تصدير PDF
                </Button>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="semester1" className="w-full" dir="rtl">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-[var(--muted)] p-1 h-auto">
                        <TabsTrigger value="semester1" className="px-6 py-2">الكورس الأول ({semester1Courses.length})</TabsTrigger>
                        <TabsTrigger value="semester2" className="px-6 py-2">الكورس الثاني ({semester2Courses.length})</TabsTrigger>
                        <TabsTrigger value="yearly" className="px-6 py-2">نظام سنوي ({yearlyCourses.length})</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="semester1" className="mt-0">
                    <CoursesTable coursesList={semester1Courses} />
                </TabsContent>
                <TabsContent value="semester2" className="mt-0">
                    <CoursesTable coursesList={semester2Courses} />
                </TabsContent>
                <TabsContent value="yearly" className="mt-0">
                    <CoursesTable coursesList={yearlyCourses} />
                </TabsContent>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'تعديل المقرر' : 'إضافة مادة جديدة'}</DialogTitle>
                        <DialogDescription>
                            {isEditMode ? 'تعديل تفاصيل المقرر الدراسي' : 'أدخل اسم المادة ورمزها واختر المرحلة.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>اسم المادة</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="مثال: برمجة 1"
                                required
                                className="focus:ring-[var(--primary)]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>رمز المادة</Label>
                            <Input
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                placeholder="مثال: CS101"
                                required
                                className="focus:ring-[var(--primary)]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>المرحلة</Label>
                            <Select onValueChange={v => setFormData({ ...formData, stage_id: v })} value={formData.stage_id}>
                                <SelectTrigger className="focus:ring-[var(--primary)]">
                                    <SelectValue placeholder="اختر المرحلة" />
                                </SelectTrigger>
                                <SelectContent>
                                    {stages?.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>نوع المادة</Label>
                            <Select onValueChange={v => setFormData({ ...formData, type: v })} value={formData.type}>
                                <SelectTrigger className="focus:ring-[var(--primary)]">
                                    <SelectValue placeholder="اختر النوع" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="theory">نظري</SelectItem>
                                    <SelectItem value="practical">عملي</SelectItem>
                                    <SelectItem value="both">نظري وعملي</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>الكورس الدراسي</Label>
                            <Select onValueChange={v => setFormData({ ...formData, semester: v })} value={formData.semester}>
                                <SelectTrigger className="focus:ring-[var(--primary)]">
                                    <SelectValue placeholder="اختر الكورس (اختياري)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">الكورس الأول</SelectItem>
                                    <SelectItem value="2">الكورس الثاني</SelectItem>
                                    <SelectItem value="0">بدون كورس (سنوي)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>}

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting} className="bg-[var(--sidebar)] text-white hover:bg-[var(--sidebar)]/90">
                                {isSubmitting ? "جارٍ الحفظ..." : "حفظ"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف هذا المقرر بشكل نهائي. تأكد من عدم وجود بيانات مهمة تعتمد عليه.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            نعم، احذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
