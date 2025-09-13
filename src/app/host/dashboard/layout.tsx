import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../../globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SupaQuiz (Host)',
  description: 'Quiz en direct propulsé par Supabase',
}

const menuItems: {
  label: string
  href: string
  icon: React.ReactNode
}[] = [
  {
    label: 'Accueil',
    href: '/host/dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
        className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: 'Mode d’emploi',
    href: '/host/dashboard/how-to',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
        className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
    ),
  },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={inter.className}>
      {/* barre violette */}
      <div className="h-2 w-full bg-[#5E17EB]" />
      <header className="h-16 px-4 flex justify-between items-center border-b border-gray-200 bg-white">
        <h1 className="text-xl font-extrabold text-[#111827]">Espace animateur</h1>
      </header>
      <div className="flex">
        <nav className="border-r border-gray-200 bg-white/70 min-h-[calc(100vh-4rem-0.5rem)]">
          <ul>
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  className="flex items-center h-12 w-56 hover:bg-gray-100 px-2"
                  href={item.href}
                >
                  <div className="px-2">{item.icon}</div>
                  <div className="flex-grow">{item.label}</div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex-grow p-4 bg-[#F3F4F6] min-h-[calc(100vh-4rem-0.5rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}
