import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Camera, Building2, ArrowRight } from 'lucide-react'
import { Logo } from '../../components/Logo'
import { Card } from '../../components/ui/Card'
import { useAuth } from '../../contexts/AuthContext'
import { completeOnboarding } from '../../lib/api'
import { getModeHomePath } from '../../lib/account-mode'

export default function RoleSelectionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshAccount, switchMode } = useAuth()
  const [loading, setLoading] = useState<'creator' | 'brand' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fullName = (location.state as { fullName?: string } | null)?.fullName

  async function selectMode(mode: 'creator' | 'brand') {
    if (!user) return
    setLoading(mode)
    setError(null)
    try {
      await completeOnboarding(user.id, mode, fullName)
      await refreshAccount()
      switchMode(mode)
      navigate(getModeHomePath(mode))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-lg animate-fade-in">
        <div className="mb-10 text-center">
          <Logo size="md" className="justify-center" />
        </div>

        <div className="text-center animate-slide-up">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Choose Your Primary Mode
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            This sets your starting dashboard. You can add both profiles and switch anytime.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-10 space-y-4">
          <button
            type="button"
            onClick={() => selectMode('creator')}
            disabled={loading !== null}
            className="block w-full text-left animate-slide-up stagger-1"
          >
            <Card hover padding="lg" className="group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
                  <Camera className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-primary">Creator</h2>
                    <ArrowRight className="h-5 w-5 text-text-secondary group-hover:text-brand-primary transition-colors" />
                  </div>
                  <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                    I create content and collaborate with brands.
                  </p>
                  {loading === 'creator' && (
                    <p className="mt-2 text-xs text-brand-primary">Setting up your account...</p>
                  )}
                </div>
              </div>
            </Card>
          </button>

          <button
            type="button"
            onClick={() => selectMode('brand')}
            disabled={loading !== null}
            className="block w-full text-left animate-slide-up stagger-2"
          >
            <Card hover padding="lg" className="group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-primary">Brand</h2>
                    <ArrowRight className="h-5 w-5 text-text-secondary group-hover:text-brand-primary transition-colors" />
                  </div>
                  <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                    I represent a business and hire creators.
                  </p>
                  {loading === 'brand' && (
                    <p className="mt-2 text-xs text-brand-primary">Setting up your account...</p>
                  )}
                </div>
              </div>
            </Card>
          </button>
        </div>
      </div>
    </div>
  )
}
