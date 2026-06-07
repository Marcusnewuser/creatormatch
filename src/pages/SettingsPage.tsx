import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, Camera } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LogoutButton } from '../components/LogoutButton'
import { SettingsSection, SettingsRow } from '../components/settings/SettingsMenu'
import { ProfileModeSwitcher } from '../components/profile/ProfileModeSwitcher'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationsContext'
import { getProfileCreatePath } from '../lib/auth-paths'

export default function SettingsPage() {
  const location = useLocation()
  const isBrandRoute = location.pathname.startsWith('/brand')
  const {
    user,
    hasCreatorProfile,
    hasBrandProfile,
    activeMode,
    isAdmin,
    resetPassword,
  } = useAuth()
  const { unreadCount, activeAccountType } = useNotifications()
  const [passwordSent, setPasswordSent] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [sendingPassword, setSendingPassword] = useState(false)

  const mode = isBrandRoute || activeMode === 'brand' ? 'brand' : 'creator'
  const publicViewPath = user ? `/creators/${user.id}` : undefined
  const editProfilePath = mode === 'brand' ? '/brand/profile/edit' : '/creator/profile/edit'
  const modeLabel = activeAccountType === 'brand' ? 'Brand' : 'Creator'

  async function handleChangePassword() {
    if (!user?.email) return
    setPasswordError(null)
    setSendingPassword(true)
    try {
      await resetPassword(user.email)
      setPasswordSent(true)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setSendingPassword(false)
    }
  }

  return (
    <div className="px-4 pt-4 pb-8 lg:px-0 animate-fade-in max-w-lg mx-auto">
      <PageHeader title="Settings" subtitle="Account and app preferences" back />

      {user && (
        <Card className="mb-6">
          <p className="text-sm font-medium text-text-primary">{user.email}</p>
          <p className="text-xs text-text-secondary mt-1 capitalize">
            {isAdmin ? 'Admin' : `${mode} account`}
          </p>
        </Card>
      )}

      <SettingsSection title="Account">
        {mode === 'creator' && hasCreatorProfile && publicViewPath && (
          <SettingsRow to={publicViewPath} label="Edit Public View" subtitle="See how others view your profile" />
        )}
        <SettingsRow to={editProfilePath} label="Edit Profile" subtitle="Update photo, bio, and details" />
        {!isAdmin && (hasCreatorProfile || hasBrandProfile) && (
          <div className="border-b border-border px-4 py-4 last:border-b-0">
            <p className="text-sm font-medium text-text-primary mb-1">Switch Account Type</p>
            <p className="text-xs text-text-secondary mb-3">Creator and Brand on one account</p>
            <ProfileModeSwitcher />
          </div>
        )}
        {!hasCreatorProfile && !isAdmin && (
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 last:border-b-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-primary">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Creator Profile</p>
                <p className="text-xs text-text-secondary">Apply to campaigns</p>
              </div>
            </div>
            <Link to={getProfileCreatePath('creator')}>
              <Button size="sm" variant="outline">Create</Button>
            </Link>
          </div>
        )}
        {!hasBrandProfile && !isAdmin && (
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Brand Profile</p>
                <p className="text-xs text-text-secondary">Post campaigns</p>
              </div>
            </div>
            <Link to={getProfileCreatePath('brand')}>
              <Button size="sm" variant="outline">Create</Button>
            </Link>
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Notifications">
        <SettingsRow
          to="/notifications"
          label="View Notifications"
          subtitle={`${modeLabel} notifications`}
          badge={unreadCount}
        />
        <SettingsRow label="Notification Preferences" subtitle="Customize alerts" soon />
      </SettingsSection>

      <SettingsSection title="App">
        <SettingsRow label="Language" subtitle="English" soon />
        <SettingsRow label="Appearance" subtitle="Theme and display" soon />
      </SettingsSection>

      <SettingsSection title="Security">
        <SettingsRow
          label={sendingPassword ? 'Sending reset link…' : 'Change Password'}
          subtitle={
            passwordSent
              ? 'Reset link sent to your email'
              : passwordError ?? 'We will email you a secure reset link'
          }
          onClick={passwordSent || sendingPassword ? undefined : handleChangePassword}
          disabled={sendingPassword || passwordSent}
        />
      </SettingsSection>

      <SettingsSection title="Session">
        <div className="p-4">
          <LogoutButton fullWidth variant="danger" />
        </div>
      </SettingsSection>
    </div>
  )
}
