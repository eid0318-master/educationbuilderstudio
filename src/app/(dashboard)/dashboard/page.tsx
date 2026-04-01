import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { verifyIdToken } from '@/lib/firebase/admin'
import { getProfile, getMaterialsWithCount } from '@/lib/db/queries'
import { RankBadge } from '@/components/rank/RankBadge'
import { RankProgress } from '@/components/rank/RankProgress'
import { InstructorRank } from '@/lib/rank/types'
import { getPinnedAnnouncements } from '@/lib/db/announcements'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) {
    redirect('/login')
  }

  let user
  try {
    user = await verifyIdToken(token)
  } catch (error) {
    console.error('Token verification failed:', error)
    redirect('/login')
  }

  // 모든 DB 쿼리를 병렬 실행 (verifyIdToken, getProfile은 cache()로 레이아웃과 중복 제거됨)
  const [profile, materialsData, pinnedAnnouncements] = await Promise.all([
    getProfile(user.uid),
    getMaterialsWithCount(user.uid),
    getPinnedAnnouncements().catch(() => [] as any[]),
  ])

  if (!profile) {
    redirect('/login?error=no-profile')
  }

  const { materials, count: materialsCount } = materialsData
  const approvedCount = materials?.filter(m => m.status === 'approved').length || 0

  return (
    <div className="space-y-6">
      {/* 고정 공지사항 */}
      {pinnedAnnouncements.length > 0 && (
        <div className="glass-card rounded-2xl p-4 !border-amber-200/40 !bg-amber-50/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-amber-400/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 18.364a7 7 0 010-12.728M18.364 5.636a9 9 0 010 12.728" /></svg>
              </div>
              공지사항
            </h2>
            <Link href="/announcements" className="text-xs text-amber-600 hover:text-amber-800 font-medium spring-hover">
              전체보기
            </Link>
          </div>
          <div className="space-y-1.5">
            {pinnedAnnouncements.map((a) => (
              <Link
                key={a.id}
                href={`/announcements/${a.id}`}
                className="block text-sm text-amber-800/80 hover:text-amber-900 truncate spring-hover"
              >
                {a.title}
                <span className="text-[11px] text-amber-500 ml-2 tabular-nums">
                  {new Date(a.created_at).toLocaleDateString('ko-KR')}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 환영 메시지 + 랭크 정보 통합 */}
      <div className="glass-card rounded-2xl p-6 md:p-8 relative overflow-hidden">
        {/* 배경 데코레이션 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cobalt-100/30 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-cobalt-50/50 to-transparent rounded-full blur-2xl -z-10" />

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              안녕하세요, {profile?.name || '강사'}님
            </h1>
            <p className="text-gray-400 mt-1.5 text-sm">
              오늘도 멋진 교육과정을 설계해보세요
            </p>
          </div>
          <div className="flex-shrink-0">
            <RankBadge rank={profile?.rank as InstructorRank} />
          </div>
        </div>

        <div className="mt-6">
          <RankProgress
            currentRank={profile?.rank as InstructorRank}
            currentPoints={profile?.points || 0}
          />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-white/50">
            <div className="text-2xl font-bold text-premium-gradient tabular-nums">
              {profile?.points || 0}
            </div>
            <div className="text-[11px] text-gray-400 font-medium mt-0.5">총 포인트</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/50">
            <div className="text-2xl font-bold text-emerald-500 tabular-nums">
              {approvedCount}
            </div>
            <div className="text-[11px] text-gray-400 font-medium mt-0.5">승인 콘텐츠</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/50">
            <div className="text-2xl font-bold text-violet-500 tabular-nums">
              {materialsCount || 0}
            </div>
            <div className="text-[11px] text-gray-400 font-medium mt-0.5">전체 콘텐츠</div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 - 벤토 그리드 */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {/* AI 설계 마법사 - 메인 카드 (2열) */}
        <a
          href="/design"
          className="col-span-2 premium-action-card rounded-2xl p-6 md:p-8 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-cobalt-100/40 to-transparent rounded-full blur-2xl -z-10 group-hover:from-cobalt-200/50 transition-colors" />
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-cobalt-400 to-cobalt-600 rounded-2xl flex items-center justify-center shadow-cobalt-md group-hover:shadow-cobalt-lg group-hover:scale-105 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">AI 설계 마법사</h3>
              <p className="text-sm text-gray-400 mt-0.5">3분 안에 맞춤형 교육과정을 자동 생성합니다</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-cobalt-500 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </div>
        </a>

        {/* 콘텐츠 라이브러리 */}
        <a
          href="/library"
          className="premium-action-card rounded-2xl p-5 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-100/40 to-transparent rounded-full blur-xl -z-10 group-hover:from-emerald-200/50 transition-colors" />
          <div className="h-11 w-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-[15px]">라이브러리</h3>
          <p className="text-xs text-gray-400 mt-0.5">베테랑 자료 탐색</p>
        </a>

        {/* 콘텐츠 기여 */}
        <a
          href="/contribute"
          className="premium-action-card rounded-2xl p-5 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-100/40 to-transparent rounded-full blur-xl -z-10 group-hover:from-amber-200/50 transition-colors" />
          <div className="h-11 w-11 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-[15px]">콘텐츠 기여</h3>
          <p className="text-xs text-gray-400 mt-0.5">자료 공유 & 리워드</p>
        </a>

        {/* 리워드 */}
        <a
          href="/rewards"
          className="premium-action-card rounded-2xl p-5 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-100/40 to-transparent rounded-full blur-xl -z-10 group-hover:from-violet-200/50 transition-colors" />
          <div className="h-11 w-11 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228M18.75 4.236V2.721" /></svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-[15px]">리워드</h3>
          <p className="text-xs text-gray-400 mt-0.5">기여도 확인</p>
        </a>

        {/* 마켓플레이스 */}
        <a
          href="/marketplace"
          className="premium-action-card rounded-2xl p-5 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-100/40 to-transparent rounded-full blur-xl -z-10 group-hover:from-rose-200/50 transition-colors" />
          <div className="h-11 w-11 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0A2.25 2.25 0 015.25 7.5h13.5a2.25 2.25 0 012.25 1.849m-18 0v-.464c0-.332.261-.644.591-.706a18.73 18.73 0 018.818 0 .657.657 0 01.591.706v.464" /></svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-[15px]">마켓플레이스</h3>
          <p className="text-xs text-gray-400 mt-0.5">프리미엄 자료 거래</p>
        </a>
      </div>
    </div>
  )
}
