"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axiosClient from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/mode-toggle"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("admin")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const response = await axiosClient.post('/login', {
                username,
                password,
                type: activeTab
            })

            localStorage.setItem('token', response.data.access_token)
            localStorage.setItem('user', JSON.stringify({ ...response.data.user, role: response.data.role || 'admin' }))

            router.push('/dashboard')
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message)
            } else if (err.response?.data?.errors?.username) {
                setError(err.response.data.errors.username[0])
            } else {
                setError("حدث خطأ ما، يرجى المحاولة لاحقاً.")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
            <div className="absolute top-4 left-4">
                <ModeToggle />
            </div>

            {/* Background Gradient Blob */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>

            <Card className="w-full max-w-md shadow-2xl border-primary/10 backdrop-blur-sm bg-card/80">
                <CardHeader className="text-center space-y-1">
                    <CardTitle className="text-3xl font-bold tracking-tight">تسجيل الدخول</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        نظام إدارة الطلاب والدرجات
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex bg-muted p-1 rounded-lg mb-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab("admin")}
                            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${activeTab === "admin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            الإدارة
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("lecturer")}
                            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${activeTab === "lecturer" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            الكادر التدريسي
                        </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">اسم المستخدم {activeTab === "lecturer" && "(أو الرمز)"}</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder={activeTab === "admin" ? "admin" : "رقمك الوظيفي أو اسم المستخدم"}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">كلمة المرور</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-background/50"
                            />
                        </div>
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    جارٍ التحقق...
                                </>
                            ) : (
                                "دخول"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4">
                    <p className="text-xs text-muted-foreground">
                        نظام إدارة الطلاب &copy; {new Date().getFullYear()}
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
