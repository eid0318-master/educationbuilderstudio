// src/components/dashboard/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Wand2,
  Library,
  Upload,
  Trophy,
  User,
  Shield,
  MessageSquare,
  Bell,
  HelpCircle
} from 'lucide-react'
import { UnreadBadge } from '@/components/messages/UnreadBadge'
import { useNotificationCounts } from '@/hooks/useNotificationCounts'

interface SidebarProps {
  profile: any
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const { messages, announcements, inquiries } = useNotificationCounts()

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
      href: '/announcements',
      label: '공지사항',
      icon: Bell,
      badgeCount: announcements,
    },
    {
      href: '/messages',
      label: '메시지',
      icon: MessageSquare,
      badgeCount: messages,
    },
    {
      href: '/inquiries',
      label: '1:1 문의',
      icon: HelpCircle,
      badgeCount: inquiries,
    },
    {
      href: '/profile',
      label: '프로필',
      icon: User,
    },
  ]

  // 관리자인 경우 관리자 메뉴 추가
  if (profile?.role === 'admin') {
    navItems.push({
      href: '/admin',
      label: '관리자',
      icon: Shield,
    })
  }

  return (
    <nav className="sticky top-24 space-y-1 glass-sidebar rounded-2xl p-3">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        const badgeCount = 'badgeCount' in item ? (item.badgeCount ?? 0) : 0
        const hasUnread = badgeCount > 0

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium spring-hover relative',
              isActive
                ? 'sidebar-item-active text-white'
                : hasUnread
                  ? 'bg-red-50/80 text-red-600 hover:bg-red-100 ring-1 ring-red-200/60'
                  : 'text-gray-500 hover:text-cobalt-700 hover:bg-cobalt-50/80'
            )}
          >
            <Icon className={cn('h-[18px] w-[18px]', hasUnread && !isActive && 'text-red-500')} />
            <span>{item.label}</span>
            {hasUnread && <UnreadBadge count={badgeCount} />}
          </Link>
        )
      })}
    </nav>
  )
}
