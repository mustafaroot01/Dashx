"use client"

import axiosClient from "@/lib/axios"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Layers, BookOpen, Users, GraduationCap, School, UserCheck, Clock, ArrowUpRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const fetcher = (url: string) => axiosClient.get(url).then(res => res.data)

interface DashboardStats {
    stages_count: number;
    groups_count: number;
    students_count: number;
    courses_count: number;
    lecturers_count: number;
    study_types_count: number;
    recent_students: any[];
}

export default function DashboardHome() {
    const { data: stats, isLoading } = useSWR<DashboardStats>('/dashboard/stats', fetcher)

    const statCards = [
        {
            title: "المراحل الدراسية",
            value: stats?.stages_count || 0,
            icon: Layers,
            description: "مرحلة فعالة",
            color: "text-blue-600",
            bg: "bg-blue-50",
            gradient: "from-blue-500 to-blue-300",
            glow: "bg-blue-500/5"
        },
        {
            title: "المجموعات (الكروبات)",
            value: stats?.groups_count || 0,
            icon: School,
            description: "كروب دراسي",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            gradient: "from-indigo-500 to-indigo-300",
            glow: "bg-indigo-500/5"
        },
        {
            title: "المقررات الدراسية",
            value: stats?.courses_count || 0,
            icon: BookOpen,
            description: "مادة مسجلة",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            gradient: "from-emerald-500 to-emerald-300",
            glow: "bg-emerald-500/5"
        },
        {
            title: "إجمالي الطلاب",
            value: stats?.students_count || 0,
            icon: Users,
            description: "طالب وطالبة",
            color: "text-violet-600",
            bg: "bg-violet-50",
            gradient: "from-violet-500 to-violet-300",
            glow: "bg-violet-500/5"
        },
        {
            title: "الأساتذة والمحاضرين",
            value: stats?.lecturers_count || 0,
            icon: UserCheck,
            description: "عضو هيئة تدريس",
            color: "text-amber-600",
            bg: "bg-amber-50",
            gradient: "from-amber-500 to-amber-300",
            glow: "bg-amber-500/5"
        },
        {
            title: "أنواع الدراسة",
            value: stats?.study_types_count || 0,
            icon: Clock,
            description: "نظام دراسي",
            color: "text-rose-600",
            bg: "bg-rose-50",
            gradient: "from-rose-500 to-rose-300",
            glow: "bg-rose-500/5"
        },
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Modern Welcome Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] via-[var(--primary)] to-[var(--secondary)] p-8 text-white shadow-2xl">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <GraduationCap className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-sm font-medium opacity-90">مرحباً بك في</p>
                            <h1 className="text-3xl font-bold">لوحة التحكم الأكاديمية</h1>
                        </div>
                    </div>
                    <p className="text-white/80 text-base max-w-2xl mt-2">
                        إدارة شاملة ومتكاملة للعملية التعليمية - الطلاب، المراحل، المواد، والكادر التدريسي
                    </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {statCards.map((stat, index) => (
                    <Card key={index} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                        {/* Top Accent Line */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}></div>

                        <CardContent className="pt-6 pb-5 px-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div className="text-right flex-1 mr-4">
                                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                                    <h3 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                                        {isLoading ? <Skeleton className="h-8 w-16 inline-block" /> : stat.value}
                                    </h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className={`w-2 h-2 rounded-full bg-current ${stat.color.replace('text-', 'bg-')} animate-pulse`}></div>
                                <span>{stat.description}</span>
                            </div>
                        </CardContent>

                        {/* Hover Glow Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            <div className={`absolute inset-0 ${stat.glow} blur-xl`}></div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Recent Activity / Students */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-[var(--primary)]" />
                            أحدث الطلاب المسجلين
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3">
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-1/3" />
                                            <Skeleton className="h-3 w-1/4" />
                                        </div>
                                    </div>
                                ))
                            ) : stats?.recent_students?.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">لا يوجد طلاب مسجلين.</p>
                            ) : (
                                stats?.recent_students.map((student) => (
                                    <div key={student.id} className="flex items-center justify-between p-3 bg-[var(--muted)]/30 rounded-lg hover:bg-[var(--muted)]/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-[var(--border)]">
                                                <AvatarImage src={student.image_path} />
                                                <AvatarFallback>{student.name?.substring(0, 2) || "S"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{student.name}</p>
                                                <p className="text-xs text-muted-foreground">{student.stage?.name} - {student.group?.symbol}</p>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono">
                                            {new Date(student.created_at).toLocaleDateString('ar-EG')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-[var(--sidebar)] to-[var(--sidebar)]/90 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                            روابط سريعة
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <a href="/dashboard/students" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-500/20 rounded-lg text-violet-300">
                                    <Users className="h-5 w-5" />
                                </div>
                                <span>إدارة الطلاب</span>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-white/50" />
                        </a>
                        <a href="/dashboard/courses" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-300">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <span>إدارة المقررات</span>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-white/50" />
                        </a>
                        <a href="/dashboard/lecturers" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-300">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                                <span>إدارة الأساتذة</span>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-white/50" />
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
