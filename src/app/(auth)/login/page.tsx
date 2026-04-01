import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* 배경 레이어 */}
      <div className="fixed inset-0 bg-premium-mesh" />
      <div className="fixed inset-0 bg-grid-dots-light pointer-events-none" />
      <div className="fixed inset-0 bg-noise-light pointer-events-none" />

      {/* 배경 데코레이션 */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-cobalt-100/30 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-cobalt-50/40 rounded-full blur-[100px] -z-10" />

      <div className="relative w-full max-w-md space-y-8">
        {/* 로고 */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-cobalt-400 to-cobalt-600 flex items-center justify-center shadow-cobalt-lg group-hover:shadow-neon-blue transition-shadow">
              <span className="text-white font-bold text-xl">E</span>
              <div className="absolute inset-0 rounded-2xl bg-cobalt-500 blur-lg opacity-30 -z-10 group-hover:opacity-50 transition-opacity" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-gray-900 text-lg tracking-tight">EduBuilder Studio</h1>
              <p className="text-xs text-gray-400 font-medium">AI 교육과정 설계 플랫폼</p>
            </div>
          </Link>
        </div>

        {/* 로그인 폼 */}
        <div className="glass-card rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">로그인</h2>
            <p className="text-gray-400 mt-1 text-sm">계정에 로그인하여 교육과정을 설계하세요</p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              아직 계정이 없으신가요?{' '}
              <Link href="/signup" className="text-cobalt-500 hover:text-cobalt-600 font-semibold transition-colors">
                회원가입
              </Link>
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <p className="text-center text-xs text-gray-400">
          © 2026 에듀이노랩. All rights reserved.
        </p>
      </div>
    </div>
  )
}
