"use client"

import { useState } from "react"
import axiosClient from "@/lib/axios"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import {
    Plus, Loader2, Trash2, Pencil, Users, MoreVertical
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Fetcher - handles wrapped API resources
const fetcher = (url: string) => axiosClient.get(url).then(res => res.data.data || res.data)

export default function GroupsPage() {
    const { data: groups, mutate: mutateGroups, isLoading } = useSWR<any[]>('/groups', fetcher)

    const [isDialog, setIsDialog] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [symbol, setSymbol] = useState("")
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const openCreate = () => {
        setSymbol("")
        setIsEditMode(false)
        setEditingId(null)
        setIsDialog(true)
    }

    const openEdit = (item: any) => {
        setSymbol(item.symbol)
        setIsEditMode(true)
        setEditingId(item.id)
        setIsDialog(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            if (isEditMode && editingId) {
                await axiosClient.put(`/groups/${editingId}`, { symbol })
            } else {
                await axiosClient.post('/groups', { symbol })
            }
            setIsDialog(false)
            mutateGroups()
        } catch (err) { setError("فشل الحفظ") } finally { setIsSubmitting(false) }
    }

    const executeDelete = async () => {
        if (!deleteId) return
        try {
            await axiosClient.delete(`/groups/${deleteId}`)
            mutateGroups()
        } catch (e) { alert("فشل الحذف") } finally { setDeleteId(null) }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-xl bg-[var(--sidebar)] text-white shadow-xl border-t-4 border-[var(--primary)] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                            <Users className="h-6 w-6 text-[var(--sidebar-primary)]" />
                        </div>
                        <span className="text-[var(--sidebar-primary)] font-semibold tracking-wider text-xs uppercase">إدارة التوزيع الأكاديمي</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                        الكروبات الدراسية
                    </h1>
                    <p className="text-[var(--sidebar-foreground)]/80 text-sm max-w-xl">
                        إدارة رموز الكروبات (A, B, C ...).
                    </p>
                </div>
                <div className="relative z-10 w-full md:w-auto">
                    <Button onClick={openCreate} className="w-full md:w-auto bg-[var(--sidebar-primary)] text-[var(--sidebar)] hover:bg-white hover:text-[var(--sidebar)] font-bold transition-all shadow-md">
                        <Plus className="ml-2 h-4 w-4" />
                        إضافة كروب
                    </Button>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-80 h-80 bg-[var(--sidebar-primary)]/10 blur-3xl rounded-full"></div>
            </div>

            {isLoading ? (
                <div className="flex h-60 items-center justify-center">
                    <Loader2 className="animate-spin h-8 w-8 text-[var(--primary)]" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {groups?.map(group => (
                        <Card key={group.id} className="group border-t-[4px] border-t-[var(--primary)] shadow-sm hover:shadow-xl transition-all duration-300 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-[var(--muted)]/30 border-b border-[var(--border)] px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-md bg-[var(--sidebar)]/5 text-[var(--sidebar)] group-hover:bg-[var(--sidebar)] group-hover:text-[var(--sidebar-primary)] transition-colors">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{group.symbol}</CardTitle>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-[var(--muted)]">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="border-[var(--border)]">
                                        <DropdownMenuItem onClick={() => openEdit(group)} className="focus:bg-[var(--muted)]"><Pencil className="mr-2 h-3 w-3" /> تعديل</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => setDeleteId(group.id)}><Trash2 className="mr-2 h-3 w-3" /> حذف</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="pt-6 px-5">
                                <p className="text-sm text-muted-foreground">تاريخ الإنشاء: {new Date(group.created_at).toLocaleDateString('ar-IQ')}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialog} onOpenChange={setIsDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{isEditMode ? 'تعديل' : 'جديد'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2"><Label>الرمز</Label><Input value={symbol} onChange={e => setSymbol(e.target.value)} required /></div>
                        <DialogFooter><Button type="submit" disabled={isSubmitting}>حفظ</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>اجراء نهائي.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={executeDelete} className="bg-destructive">حذف</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
