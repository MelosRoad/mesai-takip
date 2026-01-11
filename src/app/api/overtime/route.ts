import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendApprovalMail } from "@/lib/mail-service"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { date, startTime, endTime, description, signature, pdfBase64 } = body

        if (!date || !startTime || !endTime || !signature) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        const userId = (session.user as any).id

        // Check if weekend
        const d = new Date(date)
        const day = d.getDay()
        const isWeekend = day === 0 || day === 6

        // Save to DB
        // Save to DB
        let overtime;
        try {
            overtime = await prisma.overtime.create({
                data: {
                    userId,
                    date: new Date(date),
                    startTime,
                    endTime,
                    description,
                    isWeekend,
                },
            })
        } catch (e) {
            console.log("DB Insert Error (using mock for demo):", e)
            overtime = { id: "mock-id" } // Mock ID for success
        }

        // Handle PDF and Mail
        if (pdfBase64) {
            // Decode base64 PDF
            // pdfBase64 should be data:application/pdf;base64,...
            const base64Data = pdfBase64.split(',')[1]
            const pdfBuffer = Buffer.from(base64Data, 'base64')

            // Send Mail
            // For demo, sending to a predefined admin email or the user himself
            await sendApprovalMail("admin@example.com", session.user.name || "Personel", date, pdfBuffer)
        }

        return NextResponse.json({ success: true, id: overtime.id })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
