'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HostIndex() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/host/dashboard')
  }, [router])

  return (
    <main className="min-h-screen bg-[#111827] text-white flex items-center justify-center">
      <div className="text-white/70">Redirection vers le tableau de bord…</div>
    </main>
  )
}
