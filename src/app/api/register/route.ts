import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json()

        if (!username || !password) {
            return NextResponse.json({ error: "Kullanıcı adı ve şifre zorunludur." }, { status: 400 })
        }

        // Check availability
        const existing = await prisma.user.findUnique({
            where: { username }
        })

        if (existing) {
            return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 400 })
        }

        // Create User (Role default 'user')
        const user = await prisma.user.create({
            data: {
                name: username, // Default Name to Username
                username,
                password, // Note: In production, hash this password!
                role: 'user'
            }
        })

        return NextResponse.json({ success: true })

    } catch (e) {
        console.error("Register Error:", e)
        return NextResponse.json({ error: "Kayıt oluşturulamadı." }, { status: 500 })
    }
}
