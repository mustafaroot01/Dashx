"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    Users,
    LayoutDashboard,
    GraduationCap,
    BookOpen,
    Layers,
    LogOut,
    Menu,
    X,
    Settings,
    Calendar,
    School,
    Clock,
    Table,
    FileSpreadsheet,
    Calculator
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import axiosClient from "@/lib/axios"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(true) // Sidebar state
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        // Basic Client-side Auth Check
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')

        if (!token) {
            router.push('/login')
        } else {
            if (userData) {
                setUser(JSON.parse(userData))
            }
        }
    }, [router])

    const handleLogout = async () => {
        try {
            await axiosClient.post('/logout')
        } catch (e) {
            console.error(e)
        }
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
    }

    if (!user) return null // or loading spinner

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Modern Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 right-0 z-50 w-72 bg-gradient-to-b from-[var(--sidebar)] to-[var(--sidebar)]/95 backdrop-blur-xl text-[var(--sidebar-foreground)] border-l border-[var(--sidebar-border)] transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-2xl",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo Header */}
                    <div className="h-20 flex items-center justify-between px-6 border-b border-[var(--sidebar-border)]/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[var(--sidebar-primary)]/20 rounded-xl border border-[var(--sidebar-primary)]/30">
                                <GraduationCap className="h-6 w-6 text-[var(--sidebar-primary)]" />
                            </div>
                            <div>
                                <span className="text-lg font-bold text-[var(--sidebar-foreground)]">DashX</span>
                                <p className="text-xs text-[var(--sidebar-foreground)]/60">لوحة التحكم</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="lg:hidden text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]" onClick={() => setIsOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto py-6 px-3">
                        <nav className="space-y-6">
                            {/* Main Group */}
                            <div>
                                <h3 className="mb-2 px-4 text-xs font-semibold text-[var(--sidebar-foreground)]/40 tracking-wider">
                                    المعلومات العامة
                                </h3>
                                <div className="space-y-1.5">
                                    {[
                                        { name: "الرئيسية", href: "/dashboard", icon: LayoutDashboard, roles: ['admin', 'lecturer'] },
                                        { name: "الجدول الاسبوعي", href: "/dashboard/schedules", icon: Table, roles: ['admin'] },
                                        { name: "المراحل الدراسية", href: "/dashboard/stages", icon: Layers, roles: ['admin'] },
                                        { name: "المقررات الدراسية", href: "/dashboard/courses", icon: BookOpen, roles: ['admin', 'lecturer'] },
                                        { name: "أنواع الدراسة", href: "/dashboard/study-types", icon: Calendar, roles: ['admin'] },
                                        { name: "الكروبات الدراسية", href: "/dashboard/groups", icon: School, roles: ['admin'] },
                                        { name: "الكادر التدريسي", href: "/dashboard/lecturers", icon: GraduationCap, roles: ['admin'] },
                                        { name: "الطلاب", href: "/dashboard/students", icon: Users, roles: ['admin'] },
                                        { name: "سجل الدرجات", href: "/dashboard/grades", icon: Calculator, roles: ['admin', 'lecturer'] },
                                        { name: "سجل الحركات", href: "/dashboard/activity-logs", icon: Clock, roles: ['admin'] },
                                    ].filter(item => item.roles.includes(user?.role || 'admin')).map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                                pathname === item.href
                                                    ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] shadow-lg shadow-[var(--sidebar-primary)]/20"
                                                    : "text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-foreground)]"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5 shrink-0" />
                                            <span>{item.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Settings Group */}
                            <div>
                                <h3 className="mb-2 px-4 text-xs font-semibold text-[var(--sidebar-foreground)]/40 tracking-wider">
                                    الإعدادات
                                </h3>
                                <div className="space-y-1.5">
                                    {[
                                        { name: "إعدادات الحساب والأمان", href: "/dashboard/settings", icon: Settings, roles: ['admin', 'lecturer'] },
                                        { name: "تصدير / استيراد", href: "/dashboard/settings/import-export", icon: FileSpreadsheet, roles: ['admin'] },
                                    ].filter(item => item.roles.includes(user?.role || 'admin')).map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                                pathname === item.href
                                                    ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] shadow-lg shadow-[var(--sidebar-primary)]/20"
                                                    : "text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-foreground)]"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5 shrink-0" />
                                            <span>{item.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </nav>
                    </div>

                    {/* User Profile Card */}
                    <div className="p-4 border-t border-[var(--sidebar-border)]/50 bg-[var(--sidebar-accent)]/30 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[var(--sidebar-border)]/30">
                            <Avatar className="h-11 w-11 ring-2 ring-[var(--sidebar-primary)]/30">
                                <AvatarImage
                                    src={user.profile_photo_path
                                        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${user.profile_photo_path}`
                                        : `https://ui-avatars.com/api/?name=${user.name}`
                                    }
                                />
                                <AvatarFallback className="bg-[var(--sidebar-primary)]/20 text-[var(--sidebar-primary)]">
                                    {user.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--sidebar-foreground)] truncate">{user.name}</p>
                                <span className="text-xs text-[var(--sidebar-foreground)]/50">مشرف النظام</span>
                            </div>
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full justify-start gap-2 bg-destructive/90 hover:bg-destructive text-white shadow-md"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            تسجيل الخروج
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Modern Top Bar */}
                <header className="h-16 border-b border-border/40 bg-card/50 backdrop-blur-xl px-6 flex items-center justify-between shadow-sm z-40 sticky top-0">
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(true)}>
                        <Menu className="h-5 w-5" />
                    </Button>

                    <div className="flex-1 flex justify-between items-center mr-4">
                        <h2 className="text-lg font-bold text-foreground tracking-tight hidden md:block">
                            نظام إدارة الطلاب المركزي
                        </h2>
                        <div className="flex items-center gap-3 mr-auto">
                            <ModeToggle />
                        </div>
                    </div>
                </header>

                {/* Page Content with Padding */}
                <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-background via-background to-muted/20">
                    <div className="max-w-screen-2xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
