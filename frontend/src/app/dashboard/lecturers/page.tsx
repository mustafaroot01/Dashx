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
import { Plus, Search, Loader2, Trash2, Pencil, Upload, GraduationCap, BookOpen, Users, Layers, Award, Filter } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TableSkeleton } from "@/components/shared/TableSkeleton"

// Fetcher
// Fetcher for simple lists (unwraps data)
const fetcher = (url: string) => axiosClient.get(url).then(res => res.data.data || res.data)
// Fetcher for paginated data (returns raw response with meta)
const fetcherWithMeta = (url: string) => axiosClient.get(url).then(res => res.data)

import { Lecturer, Stage, Course, Group, StudyType } from "@/types"

export default function LecturersPage() {
    // Pagination State
    const [pageIndex, setPageIndex] = useState(1)

    // Use fetcherWithMeta for lecturers to get pagination metadata
    const { data: lecturersResponse, mutate: mutateLecturers, isLoading: loadingLecturers } = useSWR<any>(`/lecturers?page=${pageIndex}`, fetcherWithMeta)
    const lecturers = lecturersResponse?.data as Lecturer[] || []
    const meta = lecturersResponse?.meta

    const { data: stages } = useSWR<Stage[]>('/stages', fetcher)
    const { data: courses } = useSWR<Course[]>('/courses', fetcher)
    const { data: groups } = useSWR<Group[]>('/groups', fetcher)
    const { data: studyTypes } = useSWR<StudyType[]>('/study-types', fetcher)

    const isLoading = loadingLecturers

    // Filter State
    const [searchQuery, setSearchQuery] = useState("")

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        password: "",
        code: "",
        certificate: "",
        academic_title: "",
        stage_ids: [] as string[],
        course_ids: [] as string[],
        group_ids: [] as string[],
        study_type_ids: [] as string[],
    })
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const resetForm = () => {
        setFormData({
            full_name: "",
            username: "",
            password: "",
            code: "",
            certificate: "",
            academic_title: "",
            stage_ids: [],
            course_ids: [],
            group_ids: [],
            study_type_ids: [],
        })
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

    const handleOpenEdit = (lecturer: Lecturer) => {
        setFormData({
            full_name: lecturer.full_name,
            username: lecturer.username,
            password: "", // Password always empty on edit default
            code: lecturer.code,
            certificate: lecturer.certificate || "",
            academic_title: lecturer.academic_title || "",
            stage_ids: lecturer.stages.map(s => String(s.id)),
            course_ids: lecturer.courses.map(c => String(c.id)),
            group_ids: lecturer.groups.map(g => String(g.id)),
            study_type_ids: lecturer.study_types.map(s => String(s.id)),
        })
        setImagePreview(lecturer.image_path ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${lecturer.image_path}` : null)
        setIsEditMode(true)
        setEditingId(lecturer.id)
        setIsDialogOpen(true)
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setSelectedImage(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleCheckboxChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => {
            const current = (prev as any)[field] as string[]
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(id => id !== value) }
            } else {
                return { ...prev, [field]: [...current, value] }
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)

        try {
            const payload = new FormData()
            payload.append('full_name', formData.full_name)
            payload.append('username', formData.username)
            if (formData.password) payload.append('password', formData.password)
            payload.append('code', formData.code)
            if (formData.certificate) payload.append('certificate', formData.certificate)
            if (formData.academic_title) payload.append('academic_title', formData.academic_title)

            formData.stage_ids.forEach(id => payload.append('stage_ids[]', id))
            formData.course_ids.forEach(id => payload.append('course_ids[]', id))
            formData.group_ids.forEach(id => payload.append('group_ids[]', id))
            formData.study_type_ids.forEach(id => payload.append('study_type_ids[]', id))

            if (selectedImage) {
                payload.append('image', selectedImage)
            }

            if (isEditMode && editingId) {
                payload.append('_method', 'PUT')
                await axiosClient.post(`/lecturers/${editingId}`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            } else {
                await axiosClient.post('/lecturers', payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            }

            setIsDialogOpen(false)
            resetForm()
            mutateLecturers()
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const msgs = Object.values(err.response.data.errors).flat()
                setError(msgs[0] as string)
            } else {
                setError("فشل حفظ البيانات.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await axiosClient.delete(`/lecturers/${deleteId}`)
            mutateLecturers()
        } catch (e) {
            alert("فشل الحذف")
        } finally {
            setDeleteId(null)
        }
    }

    // Filter logic (Client-side filtering on current page - optimal would be backend search)
    const filteredLecturers = lecturers?.filter(l =>
        l.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.code.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="bg-[var(--sidebar)] rounded-xl p-8 shadow-lg border-l-4 border-[var(--primary)] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <GraduationCap className="h-6 w-6 text-[var(--sidebar-primary)]" />
                        </div>
                        <span className="text-[var(--sidebar-primary)] font-semibold tracking-wider text-xs uppercase">إدارة الموارد البشرية</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                        الكادر التدريسي
                        <Badge variant="secondary" className="mr-3 bg-white/10 text-white hover:bg-white/20 border-0">
                            {filteredLecturers.length} تدريسي
                        </Badge>
                    </h1>
                    <p className="text-[var(--sidebar-foreground)]/80 text-sm max-w-xl">
                        إدارة الأساتذة، التعيينات، وتوزيع المهام الأكاديمية والمراحل الدراسية.
                    </p>
                </div>
                <div className="relative z-10 w-full md:w-auto flex gap-3">
                    <Button onClick={handleOpenCreate} className="w-full md:w-auto bg-[var(--sidebar-primary)] text-[var(--sidebar)] hover:bg-white hover:text-[var(--sidebar)] font-bold transition-all shadow-md">
                        <Plus className="ml-2 h-4 w-4" />
                        إضافة تدريسي جديد
                    </Button>
                </div>
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-[var(--sidebar-primary)]/10 blur-3xl rounded-full"></div>
            </div>

            {/* Filters Bar */}
            <div className="bg-card border border-[var(--border)] rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث بالاسم أو الكود..."
                        className="pr-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Table Section */}
            <div className="rounded-xl border-t-[4px] border-t-[var(--primary)] shadow-md bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
                        <TableRow>
                            <TableHead className="text-right w-[50px] font-bold text-[var(--sidebar)]">#</TableHead>
                            <TableHead className="text-right w-[80px] font-bold text-[var(--sidebar)]">الصورة</TableHead>
                            <TableHead className="text-right font-bold text-[var(--sidebar)]">الاسم والمعلومات</TableHead>
                            <TableHead className="text-right font-bold text-[var(--sidebar)]">الشهادة / اللقب</TableHead>
                            <TableHead className="text-right font-bold text-[var(--sidebar)]">المهام الأكاديمية</TableHead>
                            <TableHead className="text-right w-[100px] font-bold text-[var(--sidebar)]">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableSkeleton columns={6} rows={5} />
                        ) : filteredLecturers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="p-4 rounded-full bg-[var(--muted)]/50">
                                            <Filter className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                        <span>لا توجد بيانات للعرض.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLecturers.map((lecturer, index) => (
                                <TableRow key={lecturer.id} className="hover:bg-[var(--muted)]/30 transition-colors border-b border-[var(--border)]/50 last:border-0 group">
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <Avatar className="h-12 w-12 border-2 border-[var(--border)] shadow-sm cursor-pointer hover:border-[var(--primary)] transition-all">
                                            {lecturer.image_path ? (
                                                <AvatarImage src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/storage/${lecturer.image_path}`} />
                                            ) : (
                                                <AvatarFallback className="bg-[var(--sidebar)] text-white font-bold text-sm">
                                                    {lecturer.full_name.charAt(0)}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-[var(--foreground)] text-base">{lecturer.full_name}</span>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Badge variant="outline" className="font-mono bg-[var(--muted)] border-0">{lecturer.code}</Badge>
                                                <span className="opacity-50">|</span>
                                                <span className="font-mono">{lecturer.username}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 items-start">
                                            {lecturer.certificate && (
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200">
                                                    <Award className="w-3 h-3 ml-1" />
                                                    {lecturer.certificate}
                                                </Badge>
                                            )}
                                            {lecturer.academic_title && (
                                                <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 border-purple-200">
                                                    <GraduationCap className="w-3 h-3 ml-1" />
                                                    {lecturer.academic_title}
                                                </Badge>
                                            )}
                                            {!lecturer.certificate && !lecturer.academic_title && <span className="text-muted-foreground text-xs">-</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-sm">
                                            {lecturer.stages.length > 0 && (
                                                <div className="flex gap-1 items-center" title="المراحل">
                                                    <Layers className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground text-xs truncate max-w-[200px]">{lecturer.stages.map(s => s.name).join('، ')}</span>
                                                </div>
                                            )}
                                            {lecturer.courses.length > 0 && (
                                                <div className="flex gap-1 items-center" title="المواد">
                                                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground text-xs truncate max-w-[200px]">{lecturer.courses.map(c => c.name).join('، ')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[var(--primary)] hover:bg-[var(--primary)]/10" onClick={() => handleOpenEdit(lecturer)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(lecturer.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'تعديل بيانات التدريسي' : 'إضافة تدريسي جديد'}</DialogTitle>
                        <DialogDescription>أدخل البيانات الشخصية والأكاديمية.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full overflow-hidden p-1">
                            {/* Right Side: Profile & Personal Info */}
                            <div className="md:col-span-4 flex flex-col gap-4 border-l pl-4 overflow-y-auto pr-1">
                                {/* Image Upload */}
                                <div className="flex justify-center mb-2">
                                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('lecturerImageUpload')?.click()}>
                                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg group-hover:border-violet-200 transition-colors">
                                            <AvatarImage src={imagePreview || undefined} className="object-cover" />
                                            <AvatarFallback className="bg-gray-100 group-hover:bg-gray-200">
                                                <Upload className="h-8 w-8 text-gray-400" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-0 right-0 bg-violet-600 text-white p-1.5 rounded-full shadow-md">
                                            <Pencil className="h-3 w-3" />
                                        </div>
                                        <input id="lecturerImageUpload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label>الاسم الثلاثي</Label>
                                        <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>اسم المستخدم (Login)</Label>
                                        <Input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                                    </div>

                                    <div className="space-y-1">
                                        <Label>كلمة المرور {isEditMode && <span className="text-xs font-normal text-muted-foreground">(اتركه فارغاً للتجاهل)</span>}</Label>
                                        <Input
                                            type="password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required={!isEditMode}
                                            placeholder={isEditMode ? "••••••" : "أدخل كلمة مرور قوية"}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label>الرمز (Code)</Label>
                                        <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required />
                                    </div>

                                    <div className="space-y-1">
                                        <Label>الشهادة</Label>
                                        <Select value={formData.certificate} onValueChange={v => setFormData({ ...formData, certificate: v })}>
                                            <SelectTrigger><SelectValue placeholder="اختر الشهادة..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="بكالوريوس">بكالوريوس</SelectItem>
                                                <SelectItem value="ماجستير">ماجستير</SelectItem>
                                                <SelectItem value="دكتوراه">دكتوراه</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label>اللقب العلمي</Label>
                                        <Select value={formData.academic_title} onValueChange={v => setFormData({ ...formData, academic_title: v })}>
                                            <SelectTrigger><SelectValue placeholder="اختر اللقب..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="معيد">معيد</SelectItem>
                                                <SelectItem value="مدرس مساعد">مدرس مساعد</SelectItem>
                                                <SelectItem value="مدرس">مدرس</SelectItem>
                                                <SelectItem value="أستاذ مساعد">أستاذ مساعد</SelectItem>
                                                <SelectItem value="أستاذ">أستاذ</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Left Side: Academic Assignments */}
                            <div className="md:col-span-8 flex flex-col h-full overflow-hidden">
                                <Label className="mb-2 font-bold text-[var(--primary)]">المهام الأكاديمية</Label>
                                <Tabs defaultValue="academics" className="w-full flex-1 flex flex-col overflow-hidden">
                                    <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-[var(--muted)]/50 shrink-0">
                                        <TabsTrigger value="academics" className="text-xs py-2">المراحل والمواد</TabsTrigger>
                                        <TabsTrigger value="assignments" className="text-xs py-2">الكروبات والدراسة</TabsTrigger>
                                    </TabsList>

                                    <div className="mt-2 flex-1 overflow-y-auto border rounded-lg bg-card/50 p-3">
                                        <TabsContent value="academics" className="mt-0 space-y-4">
                                            {stages?.map(stage => {
                                                const stageCourses = courses?.filter(c => c.stage_id === stage.id) || []
                                                return (
                                                    <div key={stage.id} className="border rounded-lg p-3 bg-card shadow-sm">
                                                        <div className="flex items-center space-x-2 space-x-reverse mb-2 pb-2 border-b">
                                                            <input
                                                                type="checkbox"
                                                                id={`stage-${stage.id}`}
                                                                checked={formData.stage_ids.includes(String(stage.id))}
                                                                onChange={() => handleCheckboxChange('stage_ids', String(stage.id))}
                                                                className="h-4 w-4 rounded border-gray-300 text-[var(--primary)]"
                                                            />
                                                            <label htmlFor={`stage-${stage.id}`} className="font-bold text-sm cursor-pointer select-none">
                                                                {stage.name}
                                                            </label>
                                                        </div>

                                                        {stageCourses.length > 0 ? (
                                                            <div className="grid grid-cols-2 gap-2 pr-6">
                                                                {stageCourses.map(course => (
                                                                    <div key={course.id} className="flex items-center space-x-2 space-x-reverse">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`course-${course.id}`}
                                                                            checked={formData.course_ids.includes(String(course.id))}
                                                                            onChange={() => handleCheckboxChange('course_ids', String(course.id))}
                                                                            className="h-3.5 w-3.5 rounded border-gray-300 text-[var(--primary)]"
                                                                        />
                                                                        <label htmlFor={`course-${course.id}`} className="text-xs cursor-pointer select-none text-muted-foreground">
                                                                            {course.name}
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground pr-6 italic">لا توجد مواد.</p>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </TabsContent>

                                        <TabsContent value="assignments" className="mt-0 space-y-4">
                                            <div className="border rounded-lg p-3 bg-card shadow-sm">
                                                <h4 className="font-bold text-xs mb-2 text-muted-foreground">أنواع الدراسة</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {studyTypes?.map(st => (
                                                        <div key={st.id} className="flex items-center space-x-2 space-x-reverse">
                                                            <input
                                                                type="checkbox"
                                                                id={`st-${st.id}`}
                                                                checked={formData.study_type_ids.includes(String(st.id))}
                                                                onChange={() => handleCheckboxChange('study_type_ids', String(st.id))}
                                                                className="h-4 w-4 rounded border-gray-300 text-[var(--primary)]"
                                                            />
                                                            <label htmlFor={`st-${st.id}`} className="text-sm cursor-pointer select-none">
                                                                {st.name}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="border rounded-lg p-3 bg-card shadow-sm">
                                                <h4 className="font-bold text-xs mb-2 text-muted-foreground">الكروبات الدراسية</h4>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {groups?.map(group => (
                                                        <div key={group.id} className="flex items-center space-x-2 space-x-reverse">
                                                            <input
                                                                type="checkbox"
                                                                id={`group-${group.id}`}
                                                                checked={formData.group_ids.includes(String(group.id))}
                                                                onChange={() => handleCheckboxChange('group_ids', String(group.id))}
                                                                className="h-4 w-4 rounded border-gray-300 text-[var(--primary)]"
                                                            />
                                                            <label htmlFor={`group-${group.id}`} className="text-sm cursor-pointer select-none">
                                                                {group.symbol}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        </div>

                        {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded text-center mt-2">{error}</p>}

                        <DialogFooter className="mt-4 pt-3 border-t">
                            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-[var(--sidebar)] text-white hover:bg-[var(--sidebar)]/90">
                                {isSubmitting ? "جارٍ الحفظ..." : "حفظ البيانات"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف سجل التدريسي</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف هذا السجل نهائياً. هل أنت متأكد؟
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
