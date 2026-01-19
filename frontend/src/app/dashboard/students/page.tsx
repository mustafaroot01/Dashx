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
import { Plus, Search, Loader2, Trash2, Pencil, Upload, Users, User, Filter, X } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/shared/TableSkeleton"
import { Student, Stage, StudyType, Group } from "@/types"

// Fetcher
// Fetcher
const fetcher = (url: string) => axiosClient.get(url).then(res => res.data)

export default function StudentsPage() {
    const [page, setPage] = useState(1)

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedStage, setSelectedStage] = useState<string>("all")
    const [selectedStudyType, setSelectedStudyType] = useState<string>("all")
    const [selectedGroup, setSelectedGroup] = useState<string>("all")

    // Construct URL with params
    const getParams = () => {
        const params = new URLSearchParams();
        params.append('page', String(page));
        if (searchQuery) params.append('search', searchQuery);
        if (selectedStage !== 'all') params.append('stage_id', selectedStage);
        if (selectedStudyType !== 'all') params.append('study_type_id', selectedStudyType);
        if (selectedGroup !== 'all') params.append('group_id', selectedGroup);
        return params.toString();
    }

    // SWR Hooks
    const { data: studentResponse, mutate: mutateStudents, isLoading: loadingStudents } = useSWR(`/students?${getParams()}`, fetcher)
    const { data: stages } = useSWR<Stage[]>('/stages', (url: string) => axiosClient.get(url).then(res => res.data.data || res.data))
    const { data: studyTypes } = useSWR<StudyType[]>('/study-types', (url: string) => axiosClient.get(url).then(res => res.data.data || res.data))
    const { data: groups } = useSWR<Group[]>('/groups', (url: string) => axiosClient.get(url).then(res => res.data.data || res.data))

    const students: Student[] = studentResponse?.data || []
    const meta = studentResponse?.meta

    const isLoading = loadingStudents

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Delete State
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const [formData, setFormData] = useState({
        full_name: "",
        code: "",
        gender: "male",
        phone_number: "",
        address: "",
        stage_id: "",
        study_type_id: "",
        group_id: ""
    })
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [error, setError] = useState("")

    const resetForm = () => {
        setFormData({ full_name: "", code: "", gender: "male", phone_number: "", address: "", stage_id: "", study_type_id: "", group_id: "" })
        setSelectedImage(null)
        setImagePreview(null)
        setIsEditMode(false)
        setEditingId(null)
        setError("")
    }

    const handleOpenCreate = () => {
        resetForm()
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (student: Student) => {
        setFormData({
            full_name: student.full_name,
            code: student.code,
            gender: student.gender,
            phone_number: student.phone_number || "",
            address: student.address || "",
            stage_id: String(student.stage_id),
            study_type_id: String(student.study_type_id),
            group_id: String(student.group_id)
        })
        setImagePreview(student.image_path ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${student.image_path}` : null)
        setIsEditMode(true)
        setEditingId(student.id)
        setIsDialogOpen(true)
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setSelectedImage(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)

        try {
            const payload = new FormData()
            payload.append('full_name', formData.full_name)
            payload.append('code', formData.code)
            payload.append('gender', formData.gender)
            payload.append('phone_number', formData.phone_number)
            payload.append('address', formData.address)
            payload.append('stage_id', formData.stage_id)
            payload.append('study_type_id', formData.study_type_id)
            payload.append('group_id', formData.group_id)
            if (selectedImage) {
                payload.append('image', selectedImage)
            }
            // For Update with FormData, we need _method=PUT
            if (isEditMode && editingId) {
                payload.append('_method', 'PUT')
                await axiosClient.post(`/students/${editingId}`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            } else {
                await axiosClient.post('/students', payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            }

            setIsDialogOpen(false)
            resetForm()
            mutateStudents()
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
            await axiosClient.delete(`/students/${deleteId}`)
            mutateStudents()
        } catch (e) {
            alert("فشل الحذف")
        } finally {
            setDeleteId(null)
        }
    }

    const resetFilters = () => {
        setSearchQuery("")
        setSelectedStage("all")
        setSelectedStudyType("all")
        setSelectedGroup("all")
    }

    // No client-side filtering needed anymore
    const filteredStudents = students;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="bg-[var(--sidebar)] rounded-xl p-8 shadow-lg border-l-4 border-[var(--primary)] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Users className="h-6 w-6 text-[var(--sidebar-primary)]" />
                        </div>
                        <span className="text-[var(--sidebar-primary)] font-semibold tracking-wider text-xs uppercase">إدارة شؤون الطلبة</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                        سجلات الطلاب
                        <Badge variant="secondary" className="mr-3 bg-white/10 text-white hover:bg-white/20 border-0">
                            {meta?.total || 0} طالب
                        </Badge>
                    </h1>
                    <p className="text-[var(--sidebar-foreground)]/80 text-sm max-w-xl">
                        قاعدة البيانات المركزية لجميع الطلاب. يمكنك البحث، الفلترة، وإدارة السجلات بسهولة.
                    </p>
                </div>
                <div className="relative z-10 w-full md:w-auto flex gap-3">
                    <Button onClick={handleOpenCreate} className="w-full md:w-auto bg-[var(--sidebar-primary)] text-[var(--sidebar)] hover:bg-white hover:text-[var(--sidebar)] font-bold transition-all shadow-md">
                        <Plus className="ml-2 h-4 w-4" />
                        تسجيل طالب جديد
                    </Button>
                </div>
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-[var(--sidebar-primary)]/10 blur-3xl rounded-full"></div>
            </div>

            {/* Filters Bar */}
            <div className="bg-card border border-[var(--border)] rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 w-full gap-2 items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث بالاسم أو الكود..."
                            className="pr-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="h-8 w-[1px] bg-border mx-2 hidden md:block"></div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Select value={selectedStage} onValueChange={setSelectedStage}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="المرحلة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل المراحل</SelectItem>
                                {stages?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={selectedStudyType} onValueChange={setSelectedStudyType}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="الدراسة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الأنواع</SelectItem>
                                {studyTypes?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="الكروب" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الكروبات</SelectItem>
                                {groups?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.symbol}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        {(searchQuery || selectedStage !== 'all' || selectedStudyType !== 'all' || selectedGroup !== 'all') && (
                            <Button variant="ghost" size="icon" onClick={resetFilters} title="مسح الفلاتر" className="text-destructive hover:bg-destructive/10">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="rounded-xl border-t-[4px] border-t-[var(--primary)] shadow-md bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                            <TableHead className="w-[50px] text-center font-bold text-slate-700 dark:text-slate-300">#</TableHead>
                            <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">الصورة</TableHead>
                            <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">الاسم</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">الكود</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">الجنس</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">الهاتف</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">المرحلة</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">الدراسة</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">الكروب</TableHead>
                            <TableHead className="text-left font-bold text-slate-700 dark:text-slate-300">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableSkeleton columns={10} rows={5} />
                        ) : filteredStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="p-4 rounded-full bg-[var(--muted)]/50">
                                            <Filter className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                        <span>لا توجد نتائج مطابقة للبحث</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStudents.map((student, index) => (
                                <TableRow key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                                    <TableCell className="text-center font-medium text-slate-500">{(meta ? (meta.current_page - 1) * meta.per_page : 0) + index + 1}</TableCell>
                                    <TableCell>
                                        <Avatar className="h-9 w-9 border border-slate-200">
                                            <AvatarImage src={student.image_path ? `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/storage/${student.image_path}` : undefined} className="object-cover" />
                                            <AvatarFallback className={`text-xs ${student.gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                                {student.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                        {student.full_name}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="font-mono text-[10px] px-2 py-0.5 bg-slate-50 text-slate-600 border-slate-200 whitespace-nowrap">
                                            {student.code}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {student.gender ? (
                                            <Badge variant="secondary" className={`font-normal text-xs px-2 ${student.gender === 'male' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}>
                                                {student.gender === 'male' ? 'ذكر' : 'أنثى'}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap" dir="ltr">
                                            {student.phone_number || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {student.stage?.name || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={`font-normal text-[10px] whitespace-nowrap ${student.study_type?.name.includes('صباح') ? 'border-orange-200 text-orange-700 bg-orange-50' : 'border-indigo-200 text-indigo-700 bg-indigo-50'}`}>
                                            {student.study_type?.name || '-'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            {student.group ? (
                                                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                    {student.group.symbol}
                                                </div>
                                            ) : <span className="text-slate-300">-</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-left">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleOpenEdit(student)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(student.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t bg-[var(--card)]">
                        <div className="text-sm text-muted-foreground">
                            صفحة {meta.current_page} من {meta.last_page}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={meta.current_page === 1}
                            >
                                السابق
                            </Button>
                            <div className="flex gap-1">
                                {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
                                    <Button
                                        key={p}
                                        variant={p === meta.current_page ? "default" : "ghost"}
                                        size="sm"
                                        className="w-8 h-8 p-0"
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                                disabled={meta.current_page === meta.last_page}
                            >
                                التالي
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'تعديل بيانات الطالب' : 'تسجيل طالب جديد'}</DialogTitle>
                        <DialogDescription>أدخل البيانات الشخصية والأكاديمية للطالب.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">

                        {/* Image Upload */}
                        <div className="flex justify-center mb-4">
                            <div className="relative group cursor-pointer" onClick={() => document.getElementById('imageUpload')?.click()}>
                                <Avatar className="h-28 w-28 border-4 border-white shadow-lg group-hover:border-violet-200 transition-colors">
                                    <AvatarImage src={imagePreview || undefined} className="object-cover" />
                                    <AvatarFallback className="bg-gray-100 group-hover:bg-gray-200">
                                        <Upload className="h-10 w-10 text-gray-400" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 bg-violet-600 text-white p-1.5 rounded-full shadow-md">
                                    <Pencil className="h-4 w-4" />
                                </div>
                                <input
                                    id="imageUpload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>الاسم الكامل</Label>
                                <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required className="focus:ring-violet-500" />
                            </div>

                            <div className="space-y-2">
                                <Label>الجنس</Label>
                                <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">ذكر</SelectItem>
                                        <SelectItem value="female">أنثى</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>رقم الهاتف</Label>
                                <Input value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} className="focus:ring-violet-500" placeholder="07xxxxxxxxx" />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label>عنوان السكن</Label>
                                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="focus:ring-violet-500" />
                            </div>

                            <div className="space-y-2">
                                <Label>كود الطالب</Label>
                                <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required className="focus:ring-violet-500" />
                            </div>
                            <div className="space-y-2">
                                <Label>المرحلة</Label>
                                <Select value={formData.stage_id} onValueChange={v => setFormData({ ...formData, stage_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                                    <SelectContent>{stages?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>نوع الدراسة</Label>
                                <Select value={formData.study_type_id} onValueChange={v => setFormData({ ...formData, study_type_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                                    <SelectContent>{studyTypes?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>الكروب</Label>
                                <Select value={formData.group_id} onValueChange={v => setFormData({ ...formData, group_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                                    <SelectContent>
                                        {groups?.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.symbol}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded text-center">{error}</p>}

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting} className="w-full bg-violet-600 hover:bg-violet-700 text-lg py-6">
                                {isSubmitting ? "جارٍ الحفظ..." : "حفظ البيانات"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف سجل الطالب</AlertDialogTitle>
                        <AlertDialogDescription>سيتم حذف الطالب وجميع بياناته وملفاته نهائياً.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">حذف نهائي</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
