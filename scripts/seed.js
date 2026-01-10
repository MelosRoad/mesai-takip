const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const users = [
    { name: 'Ahmet Yılmaz', username: 'ahmet' },
    { name: 'Ayşe Kaya', username: 'ayse' },
    { name: 'Mehmet Demir', username: 'mehmet' },
    { name: 'Fatma Çelik', username: 'fatma' },
    { name: 'Ali Vural', username: 'ali' }
]

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
    console.log('Seeding database...')

    // Create Users
    for (const u of users) {
        const user = await prisma.user.upsert({
            where: { username: u.username },
            update: {},
            create: {
                username: u.username,
                name: u.name,
                password: '123', // Simple password for all
                role: 'user',
            },
        })
        console.log(`Created user: ${user.name}`)

        // Create Overtimes for each user (last 1 month)
        const numOvertimes = Math.floor(Math.random() * 5) + 3 // 3 to 8 entries
        for (let i = 0; i < numOvertimes; i++) {
            const date = getRandomDate(new Date(2026, 0, 1), new Date(2026, 0, 30))
            const h1 = Math.floor(Math.random() * 4) + 18 // 18:00 - 21:00 start
            const h2 = h1 + Math.floor(Math.random() * 3) + 1 // 1-3 hours work
            const isWeekend = date.getDay() === 0 || date.getDay() === 6

            await prisma.overtime.create({
                data: {
                    userId: user.id,
                    date: date,
                    startTime: `${h1}:00`,
                    endTime: `${h2}:00`,
                    description: 'Test mesai kaydı',
                    isWeekend: isWeekend
                }
            })
        }
    }

    // Ensure Admin
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            name: 'Yönetici',
            password: 'admin',
            role: 'admin'
        }
    })

    console.log('Seeding completed.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
