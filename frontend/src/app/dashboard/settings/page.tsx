"use client"

import { useState } from "react"
import axiosClient from "@/lib/axios"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Save, Lock, User, Shield, Camera } from "lucide-react"

export default function SettingsPage() {
    const { data: user, mutate: mutateUser } = useSWR('/user', async (url) => {
        const res = await axiosClient.get(url)
        return res.data
    })

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
            <div className="text-right">
                <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-[var(--foreground)]">الإعدادات</h1>
                <p className="text-muted-foreground text-lg">إدارة الملف الشخصي، الأمان، وإعدادات النظام.</p>
            </div>

            <Tabs defaultValue="account" className="space-y-8" dir="rtl">
                <TabsList className="bg-transparent h-auto p-0 gap-4 w-full justify-start">
                    <TabsTrigger
                        value="account"
                        className="h-11 px-6 border bg-card hover:bg-accent data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-600 shadow-sm transition-all"
                    >
                        <User className="w-4 h-4 ml-2" />
                        الملف الشخصي
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="h-11 px-6 border bg-card hover:bg-accent data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-600 shadow-sm transition-all"
                    >
                        <Lock className="w-4 h-4 ml-2" />
                        الأمان وكلمة المرور
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="mt-0">
                    <ProfileForm user={user} mutateUser={mutateUser} />
                </TabsContent>

                <TabsContent value="security" className="mt-0">
                    <PasswordForm />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function ProfileForm({ user, mutateUser }: { user: any, mutateUser: any }) {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    // Form state (initialize with user data when available)
    const [formData, setFormData] = useState({
        name: user?.name || user?.full_name || "",
        username: user?.username || "",
    })

    // Update form when user data loads
    if (user && formData.name === "" && !imagePreview) {
        setFormData({ name: user.name || user.full_name, username: user.username })
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage({ type: '', text: '' })

        try {
            const payload = new FormData()
            payload.append('name', formData.name)
            payload.append('username', formData.username)

            const fileInput = document.getElementById('avatar-upload') as HTMLInputElement
            if (fileInput?.files?.[0]) {
                payload.append('image', fileInput.files[0])
            }

            const res = await axiosClient.post('/profile/update', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setMessage({ type: 'success', text: res.data.message })
            mutateUser()
            // Update local storage user if needed
            if (typeof window !== 'undefined' && localStorage.getItem('user')) {
                const lsUser = JSON.parse(localStorage.getItem('user')!)

                // Update specific fields based on what exists
                if ('full_name' in lsUser) lsUser.full_name = formData.name
                else lsUser.name = formData.name

                // If the response returns the updated user with the new image path, update it
                if (res.data.user) {
                    if (res.data.user.image_path) lsUser.image_path = res.data.user.image_path
                    if (res.data.user.profile_photo_path) lsUser.profile_photo_path = res.data.user.profile_photo_path
                }

                localStorage.setItem('user', JSON.stringify(lsUser))
            }

        } catch (error: any) {
            const msg = error.response?.data?.message || 'فشل تحديث الملف الشخصي'
            setMessage({ type: 'error', text: msg })
        } finally {
            setIsLoading(false)
        }
    }

    // Determine image source
    const userImage = user?.image_path || user?.profile_photo_path
    const imageUrl = imagePreview || (userImage ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${userImage}` : undefined)

    return (
        <Card className="text-right">
            <CardHeader>
                <CardTitle>معلومات الحساب</CardTitle>
                <CardDescription>قم بتحديث اسم العرض والصورة الشخصية الخاصة بك.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                <Avatar className="h-32 w-32 border-4 border-muted shadow-lg group-hover:border-primary transition-colors">
                                    <AvatarImage src={imageUrl} />
                                    <AvatarFallback className="text-4xl bg-muted">
                                        {(user?.name || user?.full_name)?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white h-8 w-8" />
                                </div>
                                <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">انقر لتغيير الصورة</p>
                        </div>

                        {/* Fields Section */}
                        <div className="flex-1 space-y-4 w-full max-w-md">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-right block">الاسم الكامل</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="text-right"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-right block">اسم المستخدم (Login)</Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    className="text-right"
                                />
                            </div>
                        </div>
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded-md text-sm text-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading} className="gap-2">
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            حفظ التغييرات
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

function PasswordForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [formData, setFormData] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage({ type: '', text: '' })

        if (formData.password !== formData.password_confirmation) {
            setMessage({ type: 'error', text: 'كلمة المرور الجديدة غير متطابقة.' })
            setIsLoading(false)
            return
        }

        try {
            const res = await axiosClient.post('/profile/password', formData)
            setMessage({ type: 'success', text: res.data.message })
            setFormData({ current_password: '', password: '', password_confirmation: '' })
        } catch (error: any) {
            const msg = error.response?.data?.message || Object.values(error.response?.data?.errors || {}).flat()[0] || 'فشل تغيير كلمة المرور'
            setMessage({ type: 'error', text: msg as string })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="text-right">
            <CardHeader>
                <CardTitle>تغيير كلمة المرور</CardTitle>
                <CardDescription>قم بتأمين حسابك عبر تحديث كلمة المرور بشكل دوري.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                        <Label htmlFor="current_password" className="text-right block">كلمة المرور الحالية</Label>
                        <Input
                            id="current_password"
                            type="password"
                            value={formData.current_password}
                            onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                            required
                            className="text-right"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new_password" className="text-right block">كلمة المرور الجديدة</Label>
                        <Input
                            id="new_password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            minLength={8}
                            className="text-right"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm_password" className="text-right block">تأكيد كلمة المرور الجديدة</Label>
                        <Input
                            id="confirm_password"
                            type="password"
                            value={formData.password_confirmation}
                            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                            required
                            className="text-right"
                        />
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded-md text-sm text-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isLoading} variant="destructive" className="gap-2">
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            تحديث كلمة المرور
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
