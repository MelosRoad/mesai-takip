"use client"

import { useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        const res = await signIn("credentials", {
            username,
            password,
            redirect: false,
        })

        if (res?.error) {
            setError("Giriş başarısız. Bilgilerinizi kontrol edin.")
        } else {
            const session = await getSession()
            if (session?.user && (session.user as any).role === 'admin') {
                router.push("/dashboard/admin")
            } else {
                router.push("/dashboard/user")
            }
            router.refresh()
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
                    Giriş Yap
                    <span className="block text-sm font-normal text-gray-500 mt-1">Versiyon 1.2</span>
                </h1>
                {error && (
                    <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 rounded-lg">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Kullanıcı Adı
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Şifre
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2.5 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors"
                    >
                        Giriş Yap
                    </button>
                    <div className="text-center text-sm mt-4">
                        Hesabın yok mu?{" "}
                        <Link href="/register" className="text-blue-600 hover:underline">
                            Kayıt Ol
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
