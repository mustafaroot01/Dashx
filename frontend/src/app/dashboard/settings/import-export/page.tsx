"use client"

import { useState } from "react"
import axiosClient from "@/lib/axios"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ImportExportPage() {
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)

    const [successMessage, setSuccessMessage] = useState("")

    // Import Selections
    const [importStage, setImportStage] = useState<string>("")
    const [importStudyType, setImportStudyType] = useState<string>("")
    const [importGroup, setImportGroup] = useState<string>("")
    const [importFile, setImportFile] = useState<File | null>(null)

    const { data: stages } = useSWR('/stages', (url) => axiosClient.get(url).then(res => res.data.data))
    const { data: studyTypes } = useSWR('/study-types', (url) => axiosClient.get(url).then(res => res.data.data))
    const { data: groups } = useSWR('/groups', (url) => axiosClient.get(url).then(res => res.data.data))

    const handleImportStudents = async () => {
        if (!importFile || !importStage || !importStudyType) return;

        setIsImporting(true)
        setSuccessMessage("")
        const formData = new FormData()
        formData.append('file', importFile)
        formData.append('stage_id', importStage)
        formData.append('study_type_id', importStudyType)
        if (importGroup) formData.append('group_id', importGroup)

        try {
            await axiosClient.post('/students/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setSuccessMessage("تم استيراد الطلاب بنجاح")
            setImportFile(null)
            setTimeout(() => setSuccessMessage(""), 5000)
        } catch (error) {
            console.error("Import failed", error)
            alert("فشل الاستيراد")
        } finally {
            setIsImporting(false)
        }
    }

    const handleExportStudents = async () => {
        setIsExporting(true)
        setSuccessMessage("")
        try {
            const response = await axiosClient.get('/students/export', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'students.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            setSuccessMessage("تم تصدير الملف بنجاح")
            setTimeout(() => setSuccessMessage(""), 5000)
        } catch (error) {
            console.error("Export failed", error);
            alert("فشل التصدير");
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">التصدير والاستيراد</h1>
                <p className="text-muted-foreground mt-2">إدارة بيانات النظام عن طريق ملفات Excel.</p>
            </div>

            {successMessage && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                    <AlertTitle>عملية ناجحة!</AlertTitle>
                    <AlertDescription>
                        {successMessage}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-blue-500" />
                            تصدير البيانات
                        </CardTitle>
                        <CardDescription>
                            تحميل بيانات النظام الحالية كملفات Excel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">بيانات الطلاب</h4>
                                    <p className="text-xs text-muted-foreground">شامل الأسماء، الكود، والمراحل</p>
                                </div>
                            </div>
                            <Button onClick={handleExportStudents} disabled={isExporting} variant="outline" className="border-blue-200 hover:bg-blue-50 text-blue-700">
                                {isExporting ? "جارٍ التحميل..." : "تصدير"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Import Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-orange-500" />
                            استيراد البيانات
                        </CardTitle>
                        <CardDescription>
                            رفع بيانات جديدة للنظام من ملفات Excel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">المرحلة</label>
                                <Select onValueChange={setImportStage}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر المرحلة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stages?.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">نوع الدراسة</label>
                                <Select onValueChange={setImportStudyType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر النوع" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {studyTypes?.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">الكروب (اختياري)</label>
                                <Select onValueChange={setImportGroup}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الكروب (اختياري)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups?.map((g: any) => <SelectItem key={g.id} value={String(g.id)}>{g.symbol}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50 mt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <FileSpreadsheet className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">ملف الطلاب</h4>
                                    <p className="text-xs text-muted-foreground">.xlsx, .csv</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    id="import-file"
                                    className="hidden"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                />
                                <Button
                                    variant="outline"
                                    className="border-orange-200 hover:bg-orange-50 text-orange-700"
                                    onClick={() => document.getElementById('import-file')?.click()}
                                >
                                    {importFile ? importFile.name : "اختر ملف"}
                                </Button>
                                <Button
                                    onClick={handleImportStudents}
                                    disabled={isImporting || !importFile || !importStage || !importStudyType}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    {isImporting ? "جارٍ الرفع..." : "رفع"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="md:col-span-2 border-red-200 dark:border-red-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            منطقة الخطر
                        </CardTitle>
                        <CardDescription>
                            إجراءات حساسة لا يمكن التراجع عنها.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-red-50 dark:bg-red-900/20">
                            <div>
                                <h4 className="font-semibold text-sm text-red-900 dark:text-red-200">حذف جميع الطلاب</h4>
                                <p className="text-xs text-red-700/70 dark:text-red-300/70">سيتم حذف كل بيانات الطلاب المسجلة في النظام نهائياً.</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">حذف الكل</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white dark:bg-slate-950 border-red-200 dark:border-red-900">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-red-600">هل أنت متأكد تماماً؟</AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                                            هذا الإجراء سيقوم بحذف **جميع الطلاب** من قاعدة البيانات بشكل نهائي.
                                            <br />
                                            لا يمكن التراجع عن هذه العملية، وستفقد كل البيانات المرتبطة بهم.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                            onClick={async () => {
                                                try {
                                                    await axiosClient.delete('/students/delete-all')
                                                    setSuccessMessage("تم حذف جميع الطلاب بنجاح")
                                                    setTimeout(() => setSuccessMessage(""), 5000)
                                                } catch (e) {
                                                    console.error(e)
                                                    alert("فشل الحذف")
                                                }
                                            }}
                                        >
                                            تأكيد الحذف النهائي
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
