import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg text-center">
        <h1 className="text-4xl font-extrabold text-blue-600">Mesai Takip Sistemi</h1>
        <p className="mt-2 text-gray-600">
          Personel mesai takip, imza ve onay yönetim sistemi.
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Sisteme Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
