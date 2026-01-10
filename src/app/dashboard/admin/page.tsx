import { prisma } from "@/lib/prisma"
import { OvertimeChart } from "@/components/charts/overtime-chart"
import { OvertimeCalendar } from "@/components/calendar/overtime-calendar"

// Helper to calc duration in hours
function getDuration(start: string, end: string) {
    const [h1, m1] = start.split(':').map(Number)
    const [h2, m2] = end.split(':').map(Number)
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (diff < 0) diff += 24 * 60
    return parseFloat((diff / 60).toFixed(2))
}

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    const overtimes = await prisma.overtime.findMany({
        include: {
            user: true,
        },
        orderBy: {
            date: 'desc'
        }
    })

    // Prepare Chart Data
    const userStats = new Map<string, { userId: string; name: string; weekendHours: number; weekdayHours: number }>()

    overtimes.forEach(ot => {
        const hours = getDuration(ot.startTime, ot.endTime)
        const existing = userStats.get(ot.userId) || { userId: ot.userId, name: ot.user.name, weekendHours: 0, weekdayHours: 0 }

        if (ot.isWeekend) {
            existing.weekendHours += hours
        } else {
            existing.weekdayHours += hours
        }
        userStats.set(ot.userId, existing)
    })

    const chartData = Array.from(userStats.values())

    // Prepare Calendar Events
    const calendarEvents = overtimes.map(ot => ({
        title: `${ot.user.name} (${ot.startTime}-${ot.endTime})`,
        start: new Date(ot.date), // Simple date, might need time adjustment
        end: new Date(ot.date),
        allDay: true,
        resource: { isWeekend: ot.isWeekend, userName: ot.user.username }
    }))

    // Simple Prediction: Avg hours per month * next month factor (dummy logic for visual)
    const predictions = chartData.map(stat => ({
        name: stat.name,
        predicted: ((stat.weekdayHours + stat.weekendHours) * 1.1).toFixed(1) // Assuming 10% increase trend
    }))

    return (
        <div className="space-y-8">
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Personel Mesai Dağılımı (Saat)</h2>
                <div className="h-96">
                    <OvertimeChart data={chartData} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">Mesai Takvimi</h2>
                    <OvertimeCalendar events={calendarEvents} />
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">Gelecek Ay Tahmini</h2>
                    <p className="text-sm text-gray-500 mb-4">Mevcut verilere dayalı tahmini mesai ihtiyacı.</p>
                    <ul className="divide-y divide-gray-200">
                        {predictions.map((p, idx) => (
                            <li key={idx} className="py-4 flex justify-between">
                                <span className="font-medium text-gray-900">{p.name}</span>
                                <span className="text-gray-600">{p.predicted} Saat</span>
                            </li>
                        ))}
                        {predictions.length === 0 && <li className="text-gray-500">Veri yok.</li>}
                    </ul>
                </div>
            </div>
        </div>
    )
}
