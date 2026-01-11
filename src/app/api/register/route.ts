import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const { name, username, password } = await req.json()

        if (!name || !username || !password) {
            return NextResponse.json({ error: "Tüm alanları doldurunuz." }, { status: 400 })
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
                name,
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
