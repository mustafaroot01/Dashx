'use client'

import { useState } from "react"
import useSWR from "swr"
import axiosClient from "@/lib/axios"
import { Stage, Group, Course, Lecturer } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar, Clock, MapPin, Building2, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Pencil, Trash2 } from "lucide-react"

// Fetcher
const fetcher = (url: string) => axiosClient.get(url).then(res => res.data.data || res.data)

const DAYS = [
    { key: 'sunday', label: 'الاحد' },
    { key: 'monday', label: 'الاثنين' },
    { key: 'tuesday', label: 'الثلاثاء' },
    { key: 'wednesday', label: 'الاربعاء' },
    { key: 'thursday', label: 'الخميس' },
    { key: 'friday', label: 'الجمعة' },
    { key: 'saturday', label: 'السبت' },
]

export default function SchedulesPage() {
    // Filters
    const [selectedStage, setSelectedStage] = useState<string>("")
    const [selectedStudyType, setSelectedStudyType] = useState<string>("")
    const [selectedGroup, setSelectedGroup] = useState<string>("")
    const [selectedDay, setSelectedDay] = useState<string>("sunday")

    // Data Fetching
    const { data: stages } = useSWR<Stage[]>('/stages', fetcher)

    // Fetch courses and lecturers for the form
    const { data: courses } = useSWR<Course[]>(selectedStage ? `/courses?stage_id=${selectedStage}` : '/courses', fetcher)
    const { data: lecturers } = useSWR<Lecturer[]>('/lecturers', fetcher)

    // Derived Filters Logic
    const currentStage = stages?.find(s => String(s.id) === selectedStage)

    // 1. Available Study Types based on selected Stage
    const availableStudyTypes = currentStage?.configurations
        ? Array.from(new Map(
            currentStage.configurations
                .map(c => [c.study_type.id, c.study_type])
        ).values())
        : []

    // 2. Available Groups based on selected Stage AND Study Type
    const availableGroups = currentStage?.configurations
        ?.filter(c => String(c.study_type.id) === selectedStudyType)
        .map(c => c.group) || []

    // Reset downstream filters when upstream changes
    const handleStageChange = (stageId: string) => {
        setSelectedStage(stageId)
        setSelectedStudyType("")
        setSelectedGroup("")
    }

    const handleStudyTypeChange = (typeId: string) => {
        setSelectedStudyType(typeId)
        setSelectedGroup("")
    }

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingSchedule, setEditingSchedule] = useState<any>(null)
    const [formData, setFormData] = useState({
        course_id: "",
        lecturer_id: "",
        start_time: "",
        end_time: "",
        type: "theory",
        room: "",
        location: ""
    })

    const resetForm = () => {
        setEditingSchedule(null)
        setFormData({
            course_id: "",
            lecturer_id: "",
            start_time: "",
            end_time: "",
            type: "theory",
            room: "",
            location: ""
        })
    }

    // Only fetch schedules if stage, study type, and group are selected
    const shouldFetch = selectedStage && selectedStudyType && selectedGroup
    const { data: schedules, mutate, isLoading } = useSWR<any[]>(
        shouldFetch ? `/schedules?stage_id=${selectedStage}&group_id=${selectedGroup}` : null,
        fetcher
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Basic Validation
        if (!formData.course_id || !formData.lecturer_id || !formData.start_time || !formData.end_time) {
            alert("يرجى ملء جميع الحقول المطلوبة")
            return
        }

        // Time Validation
        if (formData.start_time >= formData.end_time) {
            alert("وقت الانتهاء يجب أن يكون بعد وقت البدء")
            return
        }

        setIsSubmitting(true)

        try {
            const payload = {
                ...formData,
                // Ensure time is in HH:mm format (first 5 chars)
                start_time: formData.start_time.slice(0, 5),
                end_time: formData.end_time.slice(0, 5),
                stage_id: selectedStage,
                group_id: selectedGroup,
                day: selectedDay
            }

            if (editingSchedule) {
                await axiosClient.put(`/schedules/${editingSchedule.id}`, payload)
            } else {
                await axiosClient.post('/schedules', payload)
            }

            mutate()
            setIsDialogOpen(false)
            resetForm()
        } catch (error: any) {
            console.error("Failed to save schedule", error)
            if (error.response && error.response.status === 422) {
                const errors = error.response.data.errors
                const errorMessages = Object.values(errors).flat().join('\n')
                alert(`خطأ في البيانات:\n${errorMessages}`)
            } else {
                alert("فشل حفظ المحاضرة. يرجى التأكد من البيانات.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (schedule: any) => {
        setEditingSchedule(schedule)
        setFormData({
            course_id: String(schedule.course_id),
            lecturer_id: String(schedule.lecturer_id),
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            type: schedule.type,
            room: schedule.room || "",
            location: schedule.location || ""
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذه المحاضرة؟')) return;

        try {
            await axiosClient.delete(`/schedules/${id}`)
            mutate()
        } catch (error) {
            console.error("Failed to delete schedule", error)
            alert("فشل حذف المحاضرة")
        }
    }

    // Derived Data
    const daySchedules = schedules?.filter(s => s.day === selectedDay) || []
    const sortedSchedules = [...daySchedules].sort((a, b) => a.start_time.localeCompare(b.start_time))

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">الجدول الاسبوعي</h1>
                        <p className="text-sm text-gray-500">إدارة جداول المحاضرات الدراسية</p>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
                    <Select onValueChange={handleStageChange} value={selectedStage}>
                        <SelectTrigger className="w-[150px] bg-white">
                            <SelectValue placeholder="المرحلة" />
                        </SelectTrigger>
                        <SelectContent>
                            {stages?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select onValueChange={handleStudyTypeChange} value={selectedStudyType} disabled={!selectedStage}>
                        <SelectTrigger className="w-[150px] bg-white">
                            <SelectValue placeholder="نوع الدراسة" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableStudyTypes.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select onValueChange={setSelectedGroup} value={selectedGroup} disabled={!selectedStudyType}>
                        <SelectTrigger className="w-[150px] bg-white">
                            <SelectValue placeholder="الكروب" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableGroups.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.symbol}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) resetForm()
                    }}>
                        <DialogTrigger asChild>
                            <Button disabled={!shouldFetch} className="bg-[var(--sidebar-primary)] hover:bg-[var(--sidebar-primary)]/90">
                                إضافة محاضرة
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editingSchedule ? 'تعديل المحاضرة' : 'إضافة محاضرة جديدة'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>المادة الدراسية</Label>
                                    <Select
                                        value={formData.course_id}
                                        onValueChange={(v) => setFormData({ ...formData, course_id: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر المادة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses?.map(c => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>التدريسي</Label>
                                    <Select
                                        value={formData.lecturer_id}
                                        onValueChange={(v) => setFormData({ ...formData, lecturer_id: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر التدريسي" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {lecturers?.map(l => (
                                                <SelectItem key={l.id} value={String(l.id)}>{l.full_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>وقت البدء</Label>
                                        <Input
                                            type="time"
                                            value={formData.start_time}
                                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>وقت الانتهاء</Label>
                                        <Input
                                            type="time"
                                            value={formData.end_time}
                                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>نوع المحاضرة</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(v) => setFormData({ ...formData, type: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="theory">نظري (Theory)</SelectItem>
                                            <SelectItem value="practical">عملي (Practical)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>القاعة</Label>
                                        <Input
                                            placeholder="مثال: القاعة 1"
                                            value={formData.room}
                                            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>الموقع</Label>
                                        <Input
                                            placeholder="مثال: الطابق الثاني"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                    حفظ
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Main Content (Lectures) - Takes 3 cols */}
                <div className="lg:col-span-3 space-y-4">
                    {!shouldFetch ? (
                        <Card className="h-64 flex items-center justify-center border-dashed">
                            <div className="text-center text-gray-500">
                                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>يرجى اختيار المرحلة والكروب لعرض الجدول</p>
                            </div>
                        </Card>
                    ) : isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl" />)}
                        </div>
                    ) : sortedSchedules.length === 0 ? (
                        <Card className="h-64 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <p>لا توجد محاضرات في هذا اليوم</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sortedSchedules.map((schedule, index) => (
                                <Card key={schedule.id} className="overflow-hidden hover:shadow-md transition-shadow border-t-4 border-t-primary">
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="secondary" className="rounded-full w-6 h-6 flex items-center justify-center p-0">
                                                        {index + 1}
                                                    </Badge>
                                                    <h3 className="font-bold text-lg text-gray-800">{schedule.course?.name}</h3>
                                                </div>
                                            </div>
                                            <Badge variant={schedule.type === 'theory' ? 'default' : 'secondary'} className={schedule.type === 'theory' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}>
                                                {schedule.type === 'theory' ? 'نظري Theory' : 'عملي Practical'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600 border-t pt-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-blue-500" />
                                                    <span dir="ltr">{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">الوقت</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-indigo-500" />
                                                    <span>{schedule.room || 'غير محدد'}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">القاعة</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-red-500" />
                                                    <span>{schedule.location || 'الكلية'}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">المكان</span>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t flex items-center justify-between bg-gray-50/50 -mx-5 -mb-5 p-4 mt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                    {schedule.lecturer?.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">التدريسي</p>
                                                    <p className="text-sm font-semibold text-gray-700">{schedule.lecturer?.full_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(schedule)}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(schedule.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar (Days) - Takes 1 col */}
                <div className="lg:col-span-1">
                    <Card>
                        <div className="p-4 bg-gray-50 border-b">
                            <h3 className="font-bold text-gray-700 text-center">الايام</h3>
                        </div>
                        <div className="p-2 space-y-1">
                            {DAYS.map(day => {
                                const count = schedules?.filter(s => s.day === day.key).length || 0
                                const isSelected = selectedDay === day.key
                                return (
                                    <button
                                        key={day.key}
                                        onClick={() => setSelectedDay(day.key)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${isSelected
                                            ? 'bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-200'
                                            : 'hover:bg-gray-50 text-gray-600'
                                            }`}
                                    >
                                        <span>{day.label}</span>
                                        {shouldFetch && (
                                            <Badge variant={isSelected ? 'default' : 'secondary'} className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                                                {count}
                                            </Badge>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    )
}
