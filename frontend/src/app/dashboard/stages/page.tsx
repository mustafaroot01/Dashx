"use client"

import { useState, useEffect } from "react"
import axiosClient from "@/lib/axios"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Loader2, Trash2, Pencil, Layers, X as XIcon, Sun, Moon, User, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Fetcher - handles wrapped API resources
const fetcher = (url: string) => axiosClient.get(url).then(res => res.data.data || res.data)

interface Stage {
    id: number;
    name: string;
    code: string;
    configurations?: {
        id: number;
        group: {
            id: number;
            symbol: string;
        };
        study_type: {
            id: number;
            name: string;
        };
    }[];
}

interface GroupTemplate {
    id: number;
    symbol: string;
    study_type_id: number;
}

interface StudyTypeConfig {
    id: number;
    name: string;
    checked: boolean;
    groupIds: number[];
}

export default function StagesPage() {
    const { data: stages, isLoading, mutate } = useSWR<Stage[]>('/stages', fetcher)
    const { data: templateGroups } = useSWR<GroupTemplate[]>('/groups?template=true', fetcher)
    const { data: studyTypes } = useSWR<any[]>('/study-types', fetcher)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [formData, setFormData] = useState({ name: "", code: "" })

    // Config state
    const [studyConfig, setStudyConfig] = useState<StudyTypeConfig[]>([])

    // Wizard State
    const [step, setStep] = useState(1)

    // Initialize config when studyTypes load or dialog opens
    useEffect(() => {
        if (studyTypes && !isEditMode && studyConfig.length === 0) {
            setStudyConfig(studyTypes.map(st => ({
                id: st.id,
                name: st.name,
                checked: false,
                groupIds: []
            })))
        }
    }, [studyTypes, isEditMode, studyConfig.length])

    const [error, setError] = useState("")

    const resetForm = () => {
        setFormData({ name: "", code: "" })
        if (studyTypes) {
            setStudyConfig(studyTypes.map(st => ({
                id: st.id,
                name: st.name,
                checked: false,
                groupIds: []
            })))
        }
        setIsEditMode(false)
        setEditingId(null)
        setStep(1)
        setError("")
    }

    const handleOpenCreate = () => {
        resetForm()
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (stage: Stage) => {
        setFormData({ name: stage.name, code: stage.code })

        if (studyTypes) {
            const newConfig = studyTypes.map(st => {
                // Check if stage has configurations for this study type using ID matching
                const relatedConfigs = stage.configurations?.filter(c => c.study_type?.id === st.id) || []

                // Map groups to the template IDs
                const templateIds: number[] = []
                if (templateGroups && relatedConfigs.length > 0) {
                    relatedConfigs.forEach(rc => {
                        // Match by symbol to find the corresponding template group
                        const foundTemplate = templateGroups.find(t => t.symbol === rc.group?.symbol)
                        if (foundTemplate) templateIds.push(foundTemplate.id)
                    })
                }

                return {
                    id: st.id,
                    name: st.name,
                    checked: relatedConfigs.length > 0,
                    groupIds: templateIds
                }
            })
            setStudyConfig(newConfig)
        }

        setIsEditMode(true)
        setEditingId(stage.id)
        setIsDialogOpen(true)
    }

    const toggleGroup = (typeId: number, groupId: number) => {
        setStudyConfig(prev => prev.map(c => {
            if (c.id === typeId) {
                const exists = c.groupIds.includes(groupId)
                const newGroupIds = exists
                    ? c.groupIds.filter(id => id !== groupId)
                    : [...c.groupIds, groupId]

                return {
                    ...c,
                    groupIds: newGroupIds,
                    checked: newGroupIds.length > 0 // Auto-check if groups exist
                }
            }
            return c
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)

        // Prepare payload - include any config that has groups selected
        const studyTypesPayload = studyConfig
            .filter(c => c.groupIds.length > 0)
            .map(c => ({
                id: c.id,
                groups: c.groupIds
            }))

        const payload = {
            ...formData,
            study_types: studyTypesPayload.length > 0 ? studyTypesPayload : undefined
        }

        try {
            if (isEditMode && editingId) {
                await axiosClient.put(`/stages/${editingId}`, payload)
            } else {
                await axiosClient.post('/stages', payload)
            }
            // Show success step instead of closing immediately
            setStep(4)
            mutate()
        } catch (err: any) {
            const msg = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat()[0] as string
                : "فشل في حفظ البيانات"
            setError(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await axiosClient.delete(`/stages/${deleteId}`)
            mutate()
        } catch (error) {
            alert("فشل الحذف")
        } finally {
            setDeleteId(null)
        }
    }

    // Helper to determine styling based on study type name
    const getStudyTypeStyle = (name: string) => {
        if (name.includes('صباحي') || name.toLowerCase().includes('morning')) {
            return {
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                text: 'text-amber-700',
                icon: <Sun className="w-4 h-4 text-amber-500" />,
                badge: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200'
            }
        }
        if (name.includes('مسائي') || name.toLowerCase().includes('evening')) {
            return {
                bg: 'bg-indigo-50',
                border: 'border-indigo-200',
                text: 'text-indigo-700',
                icon: <Moon className="w-4 h-4 text-indigo-500" />,
                badge: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200'
            }
        }
        return {
            bg: 'bg-gray-50',
            border: 'border-gray-200',
            text: 'text-gray-700',
            icon: <Layers className="w-4 h-4 text-gray-400" />,
            badge: 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section - Academic Style */}
            <div className="bg-[var(--sidebar)] rounded-xl p-8 shadow-lg border-l-4 border-[var(--primary)] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Layers className="h-6 w-6 text-[var(--sidebar-primary)]" />
                        </div>
                        <span className="text-[var(--sidebar-primary)] font-semibold tracking-wider text-xs uppercase">إدارة الهيكل الأكاديمي</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                        المراحل الدراسية
                    </h1>
                    <p className="text-[var(--sidebar-foreground)]/80 text-sm max-w-xl">
                        تعريف وإدارة المراحل التعليمية في النظام (مثال: المرحلة الأولى، المرحلة الثانية...)
                    </p>
                </div>
                <div className="relative z-10 w-full md:w-auto">
                    <Button onClick={handleOpenCreate} className="w-full md:w-auto bg-[var(--sidebar-primary)] text-[var(--sidebar)] hover:bg-white hover:text-[var(--sidebar)] font-bold transition-all shadow-md">
                        <Plus className="ml-2 h-4 w-4" />
                        إضافة مرحلة جديدة
                    </Button>
                </div>
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-[var(--sidebar-primary)]/10 blur-3xl rounded-full"></div>
            </div>

            {/* Table Section */}
            <div className="rounded-xl border-t-[4px] border-t-[var(--primary)] shadow-md bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
                        <TableRow>
                            <TableHead className="w-[80px] text-right font-bold text-[var(--sidebar)]">#</TableHead>
                            <TableHead className="text-right font-bold text-[var(--sidebar)]">اسم المرحلة</TableHead>
                            <TableHead className="text-right font-bold text-[var(--sidebar)]">الرمز التعريفي</TableHead>
                            <TableHead className="text-right font-bold text-[var(--sidebar)]">الهيكلية الأكاديمية</TableHead>
                            <TableHead className="text-right w-[120px] font-bold text-[var(--sidebar)]">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex justify-center items-center text-muted-foreground gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        جاري تحميل البيانات...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : !stages || stages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Layers className="h-8 w-8 text-muted-foreground/30" />
                                        <span>لا توجد مراحل معرفة حالياً. ابدأ بإضافة مرحلة.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            stages.map((stage, index) => (
                                <TableRow key={stage.id} className="hover:bg-[var(--muted)]/30 transition-colors border-b border-[var(--border)]/50 last:border-0">
                                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell className="font-semibold text-[var(--foreground)]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-md bg-[var(--sidebar)]/5 text-[var(--sidebar)]">
                                                <Layers className="h-4 w-4" />
                                            </div>
                                            {stage.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] shadow-sm">
                                            {stage.code}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-3">
                                            {(() => {
                                                if (!stage.configurations || stage.configurations.length === 0) {
                                                    return <span className="text-xs text-muted-foreground italic">غير محدد</span>
                                                }

                                                // Extract unique study types properly
                                                const uniqueTypes = Array.from(new Set(stage.configurations.map(c => c.study_type?.name))).filter(Boolean);

                                                return uniqueTypes.map(studyName => {
                                                    const studyConfigs = stage.configurations?.filter(c => c.study_type?.name === studyName)
                                                    const styles = getStudyTypeStyle(studyName as string)

                                                    return (
                                                        <div key={studyName as string} className={`flex items-center gap-3 ${styles.bg} px-3 py-1.5 rounded-lg border ${styles.border} shadow-sm`}>
                                                            <div className="flex items-center gap-1.5 border-l border-black/5 pl-3 ml-1">
                                                                {styles.icon}
                                                                <span className={`text-xs font-bold ${styles.text}`}>{studyName as string}</span>
                                                            </div>
                                                            <div className="flex gap-1.5">
                                                                {studyConfigs?.map((c: any, idx: number) => (
                                                                    <div key={idx} className={`text-[11px] font-mono font-bold h-6 min-w-[24px] px-1.5 rounded flex items-center justify-center border ${styles.badge}`}>
                                                                        {c.group?.symbol}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                });
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[var(--sidebar-primary)] hover:bg-[var(--sidebar)]/5" onClick={() => handleOpenEdit(stage)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(stage.id)}>
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}</DialogTitle>
                        <DialogDescription>
                            اتبع الخطوات التالية لتكوين المرحلة الدراسية بشكل كامل.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Wizard Steps Indicator */}
                    <div className="flex items-center justify-between px-8 py-4 bg-muted/30 rounded-lg mb-6 relative">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-2 relative z-10">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 border-4
                                    ${step >= s
                                        ? 'bg-[var(--sidebar)] text-white border-[var(--sidebar-primary)] shadow-lg scale-110'
                                        : 'bg-white text-muted-foreground border-gray-200'}
                                `}>
                                    {s}
                                </div>
                                <span className={`text-xs font-bold ${step >= s ? 'text-[var(--sidebar)]' : 'text-muted-foreground'}`}>
                                    {s === 1 ? 'البيانات الأساسية' : s === 2 ? 'الهيكلية' : 'المراجعة'}
                                </span>
                            </div>
                        ))}
                        {/* Progress Line */}
                        <div className="absolute top-[88px] right-[60px] left-[60px] h-1 bg-gray-200 -z-0">
                            <div
                                className="h-full bg-[var(--sidebar)] transition-all duration-500 ease-in-out"
                                style={{ width: `${((step - 1) / 2) * 100}%` }}
                            />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-2 min-h-[400px]">

                        {/* Step 1: Basic Info */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-base">اسم المرحلة</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="مثال: المرحلة الأولى"
                                            className="h-12 text-lg"
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">الاسم الرسمي للمرحلة كما سيظهر في النظام.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-base">الكود التعريفي</Label>
                                        <Input
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="مثال: STG1"
                                            className="h-12 text-lg font-mono"
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">رمز فريد يستخدم في العمليات البرمجية (Unique Code).</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Academic Configuration */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                                    <div className="bg-blue-100 p-2 rounded-full">
                                        <Layers className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-800">تكوين الهيكلية الأكاديمية</h4>
                                        <p className="text-sm text-blue-600 mt-1">
                                            حدد الكروبات الدراسية لكل نوع دراسة. سيتم تفعيل نوع الدراسة تلقائياً عند اختيار كروب واحد على الأقل.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {studyConfig.map(config => {
                                        const styles = getStudyTypeStyle(config.name || '')
                                        return (
                                            <div key={config.id} className={`bg-card rounded-xl border-2 ${config.groupIds.length > 0 ? styles.border : 'border-gray-200'} shadow-sm overflow-hidden transition-all hover:shadow-md`}>
                                                <div className={`${config.groupIds.length > 0 ? styles.bg : 'bg-gray-50'} px-4 py-4 border-b flex items-center justify-between`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                                                            {styles.icon}
                                                        </div>
                                                        <div>
                                                            <span className={`font-bold block ${styles.text} text-lg`}>{config.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {config.groupIds.length > 0 ? 'مفعل' : 'غير مفعل'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Badge variant={config.groupIds.length > 0 ? 'default' : 'outline'} className={`text-md px-3 py-1 ${config.groupIds.length > 0 ? 'bg-[var(--sidebar)]' : ''}`}>
                                                        {config.groupIds.length}
                                                    </Badge>
                                                </div>

                                                <div className="p-4 bg-white min-h-[150px]">
                                                    <p className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                                                        <span className="w-1 h-4 bg-gray-300 rounded-full"></span>
                                                        حدد الكروبات المتاحة:
                                                    </p>
                                                    <div className="flex flex-wrap gap-3">
                                                        {templateGroups?.map(g => {
                                                            const isSelected = config.groupIds.includes(g.id);
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={g.id}
                                                                    onClick={() => toggleGroup(config.id, g.id)}
                                                                    className={`
                                                                        w-14 h-14 rounded-xl font-bold text-lg border-2 transition-all duration-200 select-none flex items-center justify-center relative group
                                                                        ${isSelected
                                                                            ? `${styles.bg} ${styles.border} ${styles.text} ring-2 ring-[var(--sidebar)]/20 shadow-md transform -translate-y-1`
                                                                            : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-300 hover:text-gray-600 hover:bg-white'}
                                                                    `}
                                                                >
                                                                    {isSelected && (
                                                                        <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${styles.text.replace('text-', 'bg-')} ring-2 ring-white`} />
                                                                    )}
                                                                    {g.symbol}
                                                                </button>
                                                            );
                                                        })}
                                                        {(!templateGroups || templateGroups.length === 0) && (
                                                            <div className="text-center w-full py-8 text-muted-foreground text-sm col-span-full border-2 border-dashed rounded-xl bg-gray-50/50">
                                                                لا توجد كروبات متاحة.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Confirmation */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                                    <div className="bg-green-100 p-4 rounded-full mb-2 ring-4 ring-green-50">
                                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="font-bold text-2xl text-green-900">تأكيد البيانات</h3>
                                    <p className="text-green-700 max-w-[400px]">يرجى التحقق من صحة المعلومات أدناه. هذه هي البيانات التي سيتم حفظها في النظام.</p>
                                </div>

                                <div className="bg-white border rounded-xl overflow-hidden shadow-sm divide-y">
                                    {/* Section 1: Definition */}
                                    <div className="p-5 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="mt-1 bg-blue-100 p-2 rounded-lg">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 mb-2">تعريف المرحلة</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">الاسم الرسمي</span>
                                                    <p className="font-medium text-lg text-gray-800">{formData.name || <span className="text-muted-foreground italic">غير محدد</span>}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">الكود البرمجي</span>
                                                    <p className="font-mono text-base bg-gray-100 inline-block px-2 rounded mt-1 border">{formData.code || <span className="text-muted-foreground italic">غير محدد</span>}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Structure */}
                                    <div className="p-5 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="mt-1 bg-purple-100 p-2 rounded-lg">
                                            <Layers className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 mb-3">الهيكلية الأكاديمية</h4>

                                            <div className="space-y-3">
                                                {studyConfig.filter(c => c.groupIds.length > 0).map(config => {
                                                    const styles = getStudyTypeStyle(config.name || '')
                                                    return (
                                                        <div key={config.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                            <div className="flex items-center gap-3">
                                                                {styles.icon}
                                                                <div>
                                                                    <span className={`font-bold block text-sm ${styles.text}`}>{config.name}</span>
                                                                    <span className="text-xs text-muted-foreground">يتضمن {config.groupIds.length} كروبات</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1.5">
                                                                {config.groupIds.map(gid => {
                                                                    const g = templateGroups?.find(tg => tg.id === gid)
                                                                    return (
                                                                        <Badge
                                                                            key={gid}
                                                                            variant="secondary"
                                                                            className="bg-white border shadow-sm h-7 min-w-[30px] justify-center text-sm font-bold"
                                                                        >
                                                                            {g?.symbol}
                                                                        </Badge>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    )
                                                })}

                                                {studyConfig.every(c => c.groupIds.length === 0) && (
                                                    <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4" />
                                                        لم يتم تحديد أي هيكلية (سيتم إنشاء مرحلة فارغة).
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Success */}
                        {step === 4 && (
                            <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in-95 duration-300">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-3xl font-bold text-green-800 mb-2">تم الحفظ بنجاح!</h3>
                                <p className="text-muted-foreground mb-8">تم تحديث بيانات النظام بنجاح.</p>

                                <Button
                                    type="button"
                                    onClick={() => {
                                        setIsDialogOpen(false)
                                        resetForm()
                                    }}
                                    className="bg-green-600 hover:bg-green-700 min-w-[150px] shadow-md"
                                >
                                    إغلاق النافذة
                                </Button>
                            </div>
                        )}

                        {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm font-medium">{error}</div>}

                        {step !== 4 && (
                            <DialogFooter className="flex justify-between items-center sm:justify-between gap-2 border-t pt-4 mt-8">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => step === 1 ? setIsDialogOpen(false) : setStep(prev => prev - 1)}
                                    className="min-w-[100px]"
                                >
                                    {step === 1 ? 'إلغاء' : 'السابق'}
                                </Button>

                                <div className="flex gap-2">
                                    {step < 3 ? (
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (step === 1 && (!formData.name || !formData.code)) {
                                                    setError("يرجى ملء جميع الحقول المطلوبة");
                                                    return;
                                                }
                                                setError("");
                                                setStep(prev => prev + 1);
                                            }}
                                            className="bg-[var(--sidebar)] min-w-[120px]"
                                        >
                                            التالي
                                            <span className="mr-2">→</span>
                                        </Button>
                                    ) : (
                                        <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 min-w-[150px] shadow-lg">
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditMode ? "حفظ التعديلات" : "حفظ نهائي")}
                                        </Button>
                                    )}
                                </div>
                            </DialogFooter>
                        )}
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>هل أنت متأكد من حذف هذه المرحلة؟ هذا الإجراء نهائي.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
