import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || "ethereal_user", // Generated ethereal user
        pass: process.env.SMTP_PASS || "ethereal_pass", // Generated ethereal password
    },
})

export async function sendApprovalMail(
    to: string,
    userName: string,
    date: string,
    pdfBuffer: Buffer
) {
    try {
        const info = await transporter.sendMail({
            from: '"Mesai Takip Sistemi" <system@example.com>',
            to,
            subject: `Mesai Onay Talebi - ${userName} - ${date}`,
            text: `${userName} adlı personel ${date} tarihi için mesai formu oluşturmuştur. PDF ektedir.`,
            html: `<p><b>${userName}</b> adlı personel <b>${date}</b> tarihi için mesai formu oluşturmuştur.</p><p>Lütfen ekteki formu inceleyiniz.</p>`,
            attachments: [
                {
                    filename: `mesai-formu-${userName}-${date}.pdf`,
                    content: pdfBuffer,
                },
            ],
        })

        console.log("Message sent: %s", info.messageId)
        return true
    } catch (error) {
        console.error("Error sending mail:", error)
        return false
    }
}
