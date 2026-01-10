"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { SignatureBox } from "@/components/signature-box"
import { jsPDF } from "jspdf"

export default function UserDashboard() {
    const { data: session } = useSession()
    const [date, setDate] = useState("")
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [description, setDescription] = useState("")
    const [signature, setSignature] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    const generatePDF = () => {
        const doc = new jsPDF()
        doc.setFont("helvetica", "bold")
        doc.setFontSize(22)
        doc.text("Mesai Takip Formu", 105, 20, { align: "center" })

        doc.setFont("helvetica", "normal")
        doc.setFontSize(12)
        doc.text(`Personel: ${session?.user?.name || session?.user?.email}`, 20, 40)
        doc.text(`Tarih: ${date}`, 20, 50)

        doc.rect(20, 60, 170, 0.5, 'F') // Line separator

        doc.text(`Mesai Başlangıç Saati: ${startTime}`, 20, 75)
        doc.text(`Mesai Bitiş Saati: ${endTime}`, 20, 85)

        doc.text("Yapılan İş / Açıklama:", 20, 100)
        doc.text(description, 20, 107, { maxWidth: 170 })

        if (signature) {
            doc.text("Personel İmzası:", 130, 140)
            doc.addImage(signature, "PNG", 120, 145, 60, 30)
        }

        doc.setFontSize(10)
        doc.text("Bu belge dijital olarak oluşturulmuştur ve onay için sunulmuştur.", 105, 280, { align: "center" })

        return doc.output('datauristring')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!signature) {
            setMessage("Lütfen imza atınız.")
            return
        }

        setLoading(true)
        setMessage("")

        try {
            const pdfBase64 = generatePDF()

            const res = await fetch("/api/overtime", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date,
                    startTime,
                    endTime,
                    description,
                    signature,
                    pdfBase64
                }),
            })

            const data = await res.json()

            if (res.ok) {
                setMessage("Mesai başarıyla kaydedildi, PDF oluşturuldu ve onaya gönderildi.")
                // Reset form
                setDate("")
                setStartTime("")
                setEndTime("")
                setDescription("")
            } else {
                setMessage(`Hata: ${data.error || "Bir sorun oluştu."}`)
            }
        } catch (error) {
            console.error(error)
            setMessage("Sunucu hatası.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Mesai Formu</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Lütfen mesai bilgilerinizi eksiksiz giriniz ve imzalayınız.
                        </p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Tarih</label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    {/* Empty column for layout */}
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Başlangıç Saati</label>
                                    <input
                                        type="time"
                                        required
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Bitiş Saati</label>
                                    <input
                                        type="time"
                                        required
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label className="block text-sm font-medium text-gray-700">Açıklama / Yapılan İş</label>
                                    <textarea
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">İmza</label>
                                    <SignatureBox onSave={setSignature} />
                                </div>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-md ${message.includes("Hata") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                                    {message}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {loading ? "Gönderiliyor..." : "Formu Oluştur ve Gönder"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
