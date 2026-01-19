"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ActivityLog } from "@/types/activity-log";
import axios from "@/lib/axios";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import useSWR from "swr";

export default function ActivityLogsPage() {

    // Fetch logs using SWR
    const { data, error, isLoading } = useSWR('/api/activity-logs', async (url) => {
        const res = await axios.get(url);
        return res.data;
    });

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                حدث خطأ أثناء تحميل السجلات.
            </div>
        );
    }

    const logs: ActivityLog[] = data?.data || [];

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">سجل الحركات</h1>
                    <p className="text-muted-foreground">
                        عرض سجل العمليات التي تمت على النظام
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>آخر العمليات</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table dir="rtl">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">المستخدم</TableHead>
                                <TableHead className="text-right">الحدث</TableHead>
                                <TableHead className="text-right">الوصف</TableHead>
                                <TableHead className="text-right">التاريخ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        لا توجد سجلات حالياً
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">
                                            {log.user?.name || "نظام"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getVariant(log.action)}>
                                                {translateAction(log.action)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{log.description}</TableCell>
                                        <TableCell>
                                            <div dir="ltr" className="text-right">
                                                {format(new Date(log.created_at), "PPP p", {
                                                    locale: ar,
                                                })}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function getVariant(action: string): "default" | "destructive" | "secondary" | "outline" {
    switch (action) {
        case "created":
            return "default"; // Blueish usually
        case "deleted":
            return "destructive"; // Red
        case "updated":
            return "secondary"; // Gray/Yellow usually
        default:
            return "outline";
    }
}

function translateAction(action: string): string {
    switch (action) {
        case "created":
            return "إضافة";
        case "updated":
            return "تعديل";
        case "deleted":
            return "حذف";
        default:
            return action;
    }
}
