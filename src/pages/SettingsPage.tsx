import { Link } from 'react-router-dom'
import { Building2, Camera, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LogoutButton } from '../components/LogoutButton'
import { getProfileCreatePath } from '../lib/auth-paths'

export default function SettingsPage() {
  const { user, hasCreatorProfile, hasBrandProfile, activeMode } = useAuth()

  return (
    <div className="px-4 pt-6 lg:px-0 animate-fade-in">
      <PageHeader title="Settings" subtitle="Manage your account" back />

      <Card className="space-y-4 mb-4">
        <div>
          <p className="text-sm font-medium text-text-secondary">Email</p>
          <p className="text-text-primary">{user?.email}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-text-secondary">Current Mode</p>
          <p className="text-text-primary capitalize">{activeMode ?? 'Not set'}</p>
        </div>
      </Card>

      <Card className="space-y-4 mb-4">
        <h2 className="text-base font-semibold text-text-primary">Account Modes</h2>
        <p className="text-sm text-text-secondary">
          One account can have both a Creator and Brand profile. Switch modes from the header anytime.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-primary">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Creator Profile</p>
                <p className="text-xs text-text-secondary">Apply to campaigns and showcase your work</p>
              </div>
            </div>
            {hasCreatorProfile ? (
              <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                <Check className="h-4 w-4" />
                Active
              </span>
            ) : (
              <Link to={getProfileCreatePath('creator')}>
                <Button size="sm" variant="outline">
                  Create
                </Button>
              </Link>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Brand Profile</p>
                <p className="text-xs text-text-secondary">Post campaigns and review applicants</p>
              </div>
            </div>
            {hasBrandProfile ? (
              <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                <Check className="h-4 w-4" />
                Active
              </span>
            ) : (
              <Link to={getProfileCreatePath('brand')}>
                <Button size="sm" variant="outline">
                  Create
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <LogoutButton fullWidth variant="danger" />
      </Card>
    </div>
  )
}
