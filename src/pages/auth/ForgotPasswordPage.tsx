import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-md animate-fade-in">
        <div className="mb-10">
          <Logo size="md" />
        </div>

        <div className="animate-slide-up">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Reset password</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {success ? (
          <div className="mt-8 space-y-4 animate-slide-up">
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Check your email for a password reset link.
            </div>
            <Link to="/login">
              <Button fullWidth size="lg">Back to login</Button>
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-5 animate-slide-up" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Send reset link
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-text-secondary">
          <Link to="/login" className="font-medium text-brand-primary hover:text-brand-secondary">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
