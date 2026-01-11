"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Loader2, UploadCloud } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"
// Components
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { SignatureBox } from "@/components/signature-box"
// PDF Support
import jsPDF from "jspdf"

// --- Zod Schema for Entry ---
const formSchema = z.object({
    date: z.date(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Saat formatı Örn: 09:00"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Saat formatı Örn: 18:00"),
    description: z.string().optional(),
})

export default function UserDashboard() {
    const [activeTab, setActiveTab] = useState<"entry" | "report">("entry")
    const [isLoading, setIsLoading] = useState(false)
    const [toastMessage, setToastMessage] = useState("")

    // -- REPORT STATE --
    const [startDate, setStartDate] = useState<Date>()
    const [endDate, setEndDate] = useState<Date>()
    const [reportData, setReportData] = useState<any[]>([])
    const [signatureType, setSignatureType] = useState<"draw" | "upload">("draw")
    const [signatureData, setSignatureData] = useState<string | null>(null) // base64
    const [uploadedSignatureName, setUploadedSignatureName] = useState("")

    // Form definition
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: "",
        },
    })

    // 1. Submit Single Entry
    async function onEntrySubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setToastMessage("")
        try {
            const res = await fetch("/api/overtime", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: values.date,
                    startTime: values.startTime,
                    endTime: values.endTime,
                    description: values.description,
                    signature: "pending",
                    pdfBase64: null,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Hata")

            // LOCAL STORAGE FALLBACK (Demo Mode Persistence)
            // Even if API "pretends" to save, we save locally to ensure it shows up in reports.
            const demoRecord = {
                id: "demo-" + Math.random(),
                date: values.date.toISOString(),
                startTime: values.startTime,
                endTime: values.endTime,
                description: values.description || "",
                userOrName: "Demo User"
            }
            const existing = JSON.parse(localStorage.getItem("overtime_demo_data") || "[]")
            localStorage.setItem("overtime_demo_data", JSON.stringify([...existing, demoRecord]))

            setToastMessage("✅ Kayıt başarıyla eklendi! (Demo: Tarayıcıya kaydedildi)")
            form.reset()
        } catch (error) {
            setToastMessage("❌ Bir hata oluştu.")
        } finally {
            setIsLoading(false)
        }
    }

    // 2. Fetch Report Data
    async function fetchReport() {
        if (!startDate || !endDate) {
            alert("Lütfen başlangıç ve bitiş tarihini seçin.")
            return
        }
        setIsLoading(true)
        try {
            // 1. Try API
            const res = await fetch(`/api/overtime?start=${startDate.toISOString()}&end=${endDate.toISOString()}`)
            const apiData = await res.json()

            let combinedData: any[] = []

            if (apiData.success && Array.isArray(apiData.data)) {
                combinedData = [...apiData.data]
            }

            // 2. Merge with LocalStorage (Demo Data)
            const localDataRaw = localStorage.getItem("overtime_demo_data")
            if (localDataRaw) {
                const localData = JSON.parse(localDataRaw)
                // Filter by date range
                const filteredLocal = localData.filter((item: any) => {
                    const d = new Date(item.date)
                    return d >= startDate && d <= endDate
                })
                combinedData = [...combinedData, ...filteredLocal]
            }

            setReportData(combinedData)

            if (combinedData.length === 0) setToastMessage("⚠️ Bu aralıkta kayıt bulunamadı.")
            else setToastMessage(`✅ ${combinedData.length} kayıt listelendi (Demo dahil).`)

        } catch (e) {
            setToastMessage("❌ Veri çekilemedi.")
            // On API fail, at least show local
            const localDataRaw = localStorage.getItem("overtime_demo_data")
            if (localDataRaw) {
                const localData = JSON.parse(localDataRaw)
                const filteredLocal = localData.filter((item: any) => {
                    const d = new Date(item.date)
                    return d >= startDate && d <= endDate
                })
                setReportData(filteredLocal)
                setToastMessage(`✅ ${filteredLocal.length} yerel kayıt listelendi.`)
            }
        } finally {
            setIsLoading(false)
        }
    }

    // 3. Handle File Upload (Signature)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setUploadedSignatureName(file.name)
            const reader = new FileReader()
            reader.onloadend = () => {
                setSignatureData(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    // 4. Generate Custom Template PDF
    const generatePDF = () => {
        if (!signatureData) {
            alert("Lütfen imza ekleyin (Çizin veya Yükleyin).")
            return
        }
        if (reportData.length === 0) {
            alert("Listelenecek veri yok.")
            return
        }

        const doc = new jsPDF()

        // Load Template
        const img = new Image()
        img.src = "/form-sablon.jpg" // Using existing JPG
        img.onload = () => {
            // Add Template to PDF (A4 size approx: 210 x 297 mm)
            doc.addImage(img, "JPEG", 0, 0, 210, 297)

            // Setup Text
            doc.setFontSize(10)
            doc.setTextColor(0, 0, 0)

            // Loop and Print Data
            // TODO: Coordinates need to be adjusted based on the actual template image.
            // Assuming a list structure starting at Y=100
            let y = 100
            reportData.forEach((item, index) => {
                const dateStr = new Date(item.date).toLocaleDateString('tr-TR')
                // Simple Row: Date - Start - End - Verified (mock)
                doc.text(`${index + 1}. ${dateStr}`, 20, y)
                doc.text(`${item.startTime}`, 60, y)
                doc.text(`${item.endTime}`, 90, y)
                doc.text(`${item.description || '-'}`, 120, y)
                y += 10
            })

            // Add Signature (Bottom Right usually)
            doc.addImage(signatureData!, "PNG", 140, 250, 40, 20)

            doc.save("mesai-formu.pdf")
        }
        img.onerror = () => {
            // Fallback to white background if image fails
            alert("Şablon resmi (/form-sablon.jpg) yüklenemedi. Beyaz sayfa oluşturuluyor...")
            doc.setFontSize(10)
            doc.setTextColor(0, 0, 0)
            let y = 50
            doc.text("MESAİ KONTROL FORMU (Şablonsuz)", 20, 20)

            reportData.forEach((item, index) => {
                const dateStr = new Date(item.date).toLocaleDateString('tr-TR')
                doc.text(`${index + 1}. ${dateStr} | ${item.startTime}-${item.endTime} | ${item.description}`, 20, y)
                y += 10
            })
            doc.addImage(signatureData!, "PNG", 140, y + 20, 40, 20)
            doc.save("mesai-formu-simple.pdf")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex space-x-4 border-b pb-2">
                <button
                    onClick={() => setActiveTab("entry")}
                    className={cn("px-4 py-2 font-medium rounded-t-lg transition-colors", activeTab === "entry" ? "bg-white text-blue-600 border-t border-x" : "text-gray-500 hover:text-gray-700")}
                >
                    Mesai Giriş
                </button>
                <button
                    onClick={() => setActiveTab("report")}
                    className={cn("px-4 py-2 font-medium rounded-t-lg transition-colors", activeTab === "report" ? "bg-white text-blue-600 border-t border-x" : "text-gray-500 hover:text-gray-700")}
                >
                    Rapor Oluştur
                </button>
            </div>

            {/* TAB 1: ENTRY */}
            {activeTab === "entry" && (
                <div className="bg-white p-6 rounded-lg shadow max-w-lg mx-auto">
                    <h2 className="text-xl font-bold mb-4">Yeni Mesai Kaydı</h2>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onEntrySubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Tarih</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-white text-black border-gray-400", !field.value && "text-muted-foreground")}>
                                                        {field.value ? format(field.value, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="startTime" render={({ field }) => (<FormItem><FormLabel>Başlangıç</FormLabel><FormControl><Input placeholder="09:00" {...field} className="bg-white text-black border-gray-400 placeholder:text-gray-500" /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="endTime" render={({ field }) => (<FormItem><FormLabel>Bitiş</FormLabel><FormControl><Input placeholder="18:00" {...field} className="bg-white text-black border-gray-400 placeholder:text-gray-500" /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Açıklama (Opsiyonel)</FormLabel><FormControl><Input placeholder="Proje detayları..." {...field} className="bg-white text-black border-gray-400 placeholder:text-gray-500" /></FormControl><FormMessage /></FormItem>)} />

                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Kaydet"}
                            </Button>
                        </form>
                    </Form>
                    {toastMessage && <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded text-center text-sm">{toastMessage}</div>}
                </div>
            )}

            {/* TAB 2: REPORT */}
            {activeTab === "report" && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-6">Toplu Form Oluştur</h2>

                    {/* Date Range Picker */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Başlangıç</label>
                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="border rounded-md" />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Bitiş</label>
                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="border rounded-md" />
                        </div>
                        <Button onClick={fetchReport} className="mb-1" disabled={isLoading}>Kayıtları Getir</Button>
                    </div>

                    {/* Explicit No Records Warning */}
                    {toastMessage.includes("bulunamadı") && (
                        <div className="p-4 mb-6 text-sm text-red-800 bg-red-100 rounded-lg border border-red-200">
                            ⚠️ <strong>Kayıt Yok:</strong> Seçilen tarih aralığında veritabanında herhangi bir mesai kaydı bulunamadı. Lütfen "Mesai Giriş" sekmesinden kayıt eklediğinizden emin olun (Demo modunda kayıtlar sadece o anki oturumda geçerlidir).
                        </div>
                    )}

                    {/* Explicit No Records Warning */}
                    {toastMessage.includes("bulunamadı") && (
                        <div className="p-4 mb-6 text-sm text-red-800 bg-red-100 rounded-lg border border-red-200">
                            ⚠️ <strong>Kayıt Yok:</strong> Seçilen tarih aralığında veritabanında herhangi bir mesai kaydı bulunamadı.
                        </div>
                    )}

                    {/* Results Table */}
                    {reportData.length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-semibold mb-2">Bulunan Kayıtlar ({reportData.length})</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2">Tarih</th>
                                            <th className="px-4 py-2">Saat</th>
                                            <th className="px-4 py-2">Açıklama</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {reportData.map((item, idx) => (
                                            <tr key={idx} className="bg-white">
                                                <td className="px-4 py-2">{new Date(item.date).toLocaleDateString('tr-TR')}</td>
                                                <td className="px-4 py-2">{item.startTime} - {item.endTime}</td>
                                                <td className="px-4 py-2">{item.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Signature Section */}
                    {reportData.length > 0 && (
                        <div className="space-y-4 border-t pt-6">
                            <h3 className="font-semibold">İmza Ekle</h3>
                            <div className="flex gap-4 text-sm mb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="sigType" checked={signatureType === "draw"} onChange={() => setSignatureType("draw")} />
                                    Ekrana Çiz
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="sigType" checked={signatureType === "upload"} onChange={() => setSignatureType("upload")} />
                                    Resim Yükle
                                </label>
                            </div>

                            {signatureType === "draw" ? (
                                <div className="border rounded-md inline-block">
                                    <SignatureBox onSave={(data) => setSignatureData(data)} />
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <label className="flex flex-col items-center justify-center w-64 h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud className="w-8 h-8 mb-3 text-gray-500" />
                                            <p className="text-sm text-gray-500">İmza Görselini Seçin</p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                    {uploadedSignatureName && <span className="text-sm text-green-600">Seçildi: {uploadedSignatureName}</span>}
                                </div>
                            )}

                            <Button onClick={generatePDF} className="w-full md:w-auto mt-4" size="lg">
                                PDF Formu İndir
                            </Button>
                        </div>
                    )}

                    {toastMessage && <div className="mt-4 text-sm text-gray-600">{toastMessage}</div>}
                </div>
            )}
        </div>
    )
}
