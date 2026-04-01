import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getProfile } from '@/lib/db/queries'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { BottomNav } from '@/components/dashboard/BottomNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value

  if (!token) redirect('/login')

  let user
  try {
    const decodedToken = await verifyIdToken(token)
    user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    }
  } catch (error) {
    console.error('Token verification failed in layout:', error)
    redirect('/login?error=token-verify-failed')
  }

  // 프로필 정보 가져오기
  const profile = await getProfile(user.uid)

  return (
    <div className="min-h-screen bg-premium-mesh relative">
      {/* 배경 텍스처 레이어 */}
      <div className="fixed inset-0 bg-grid-dots-light pointer-events-none" />
      <div className="fixed inset-0 bg-noise-light pointer-events-none" />

      {/* 헤더 */}
      <DashboardHeader user={user} profile={profile} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* 사이드바 (데스크톱) */}
          <aside className="hidden lg:block">
            <Sidebar profile={profile} />
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="pb-24 lg:pb-0">{children}</main>
        </div>
      </div>

      {/* 하단 네비게이션 (모바일) */}
      <BottomNav profile={profile} />
    </div>
  )
}
