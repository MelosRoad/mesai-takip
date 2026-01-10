"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { data: session } = useSession()

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="font-bold text-xl text-blue-600">Mesai Takip</span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {session?.user && (session.user as any).role === 'admin' ? (
                                    <>
                                        <Link href="/dashboard/admin" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                            Yönetici Paneli
                                        </Link>
                                    </>
                                ) : (
                                    <Link href="/dashboard/user" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                        Mesai Girişi
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="mr-4 text-sm text-gray-700">
                                {session?.user?.name || session?.user?.email}
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="text-sm text-red-600 hover:text-red-800"
                            >
                                Çıkış Yap
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    )
}
