// src/components/dashboard/DashboardHeader.tsx
'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/firebase/auth'
import { RankBadge } from '@/components/rank/RankBadge'
import {
  Menu,
  X,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Wand2,
  Library,
  Upload,
  Trophy,
  Shield,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { UnreadBadge } from '@/components/messages/UnreadBadge'
import { useNotificationCounts } from '@/hooks/useNotificationCounts'

// 서버에서 전달받는 사용자 타입
interface ServerUser {
  uid: string
  email: string | undefined
}

interface DashboardHeaderProps {
  user: ServerUser
  profile: any
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { messages: unreadCount } = useNotificationCounts()

  const handleLogout = async () => {
    document.cookie = 'firebase-token=; path=/; max-age=0'
    await signOut()
    window.location.href = '/login'
  }

  const navItems = [
    {
      href: '/dashboard',
      label: '대시보드',
      icon: LayoutDashboard,
    },
    {
      href: '/design',
      label: 'AI 설계',
      icon: Wand2,
    },
    {
      href: '/library',
      label: '라이브러리',
      icon: Library,
    },
    {
      href: '/contribute',
      label: '콘텐츠 기여',
      icon: Upload,
    },
    {
      href: '/rewards',
      label: '리워드',
      icon: Trophy,
    },
    {
      href: '/messages',
      label: '메시지',
      icon: MessageSquare,
    },
  ]

  // ⭐ 관리자인 경우 관리자 메뉴 추가
  if (profile?.role === 'admin') {
    navItems.push({
      href: '/admin',
      label: '관리자',
      icon: Shield,
    })
  }

  return (
    <header className="sticky top-0 z-50 glass-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 & 사이드바 토글 */}
          <div className="flex items-center gap-3">
            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="메뉴 열기/닫기"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>

            {/* 로고 */}
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cobalt-400 to-cobalt-600 flex items-center justify-center shadow-cobalt-md group-hover:shadow-cobalt-lg transition-shadow">
                <span className="text-white font-bold text-lg">E</span>
                <div className="absolute inset-0 rounded-xl bg-cobalt-500 blur-md opacity-30 -z-10 group-hover:opacity-50 transition-opacity" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">EduBuilder</h1>
                <p className="text-[11px] text-gray-400 font-medium">AI 교육과정 설계 플랫폼</p>
              </div>
            </Link>
          </div>

          {/* 사용자 정보 */}
          <div className="flex items-center gap-3">
            {/* 랭크 뱃지 */}
            {profile?.rank && (
              <div className="hidden sm:block">
                <RankBadge rank={profile.rank} size="sm" />
              </div>
            )}

            {/* 사용자 메뉴 */}
            <div className="flex items-center gap-2 pl-3 border-l border-cobalt-100/50">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {profile?.name || '이름 없음'}
                </p>
                <p className="text-[11px] text-gray-400">{user.email}</p>
              </div>

              <div className="flex items-center gap-0.5">
                {/* 메시지 버튼 */}
                <button
                  onClick={() => router.push('/messages')}
                  className={cn(
                    'p-2 rounded-xl spring-hover relative',
                    unreadCount > 0
                      ? 'bg-red-50 hover:bg-red-100'
                      : 'hover:bg-cobalt-50'
                  )}
                  title="메시지"
                  aria-label="메시지"
                >
                  <MessageSquare className={cn(
                    'w-5 h-5',
                    unreadCount > 0 ? 'text-red-500' : 'text-gray-500'
                  )} />
                  <UnreadBadge count={unreadCount} />
                </button>

                {/* 프로필 버튼 */}
                <button
                  onClick={() => router.push('/profile')}
                  className="p-2 rounded-xl hover:bg-cobalt-50 spring-hover"
                  title="프로필"
                  aria-label="프로필"
                >
                  <UserIcon className="w-5 h-5 text-gray-500" />
                </button>

                {/* 로그아웃 버튼 */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 spring-hover"
                  title="로그아웃"
                  aria-label="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 드롭다운 */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-cobalt-100/30 bg-white/95 backdrop-blur-xl">
          {/* 사용자 정보 */}
          <div className="p-4 border-b border-gray-100/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{profile?.name || '이름 없음'}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
              {profile?.rank && <RankBadge rank={profile.rank} size="sm" />}
            </div>
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="p-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const isAdminMenu = item.href === '/admin'

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium spring-hover mb-1',
                    isActive && !isAdminMenu && 'sidebar-item-active text-white',
                    isActive && isAdminMenu && 'bg-red-500 text-white',
                    !isActive && !isAdminMenu && 'text-gray-600 hover:bg-cobalt-50/80 hover:text-cobalt-700',
                    !isActive && isAdminMenu && 'text-red-600 hover:bg-red-50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {isAdminMenu && !isActive && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-md tracking-wide">
                      ADMIN
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
