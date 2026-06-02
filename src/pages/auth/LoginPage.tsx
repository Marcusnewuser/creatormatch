import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const homePath = await signIn(email, password)
      navigate(homePath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
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
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-text-secondary">Sign in to your CreatorMatch account</p>
        </div>

        <form className="mt-8 space-y-5 animate-slide-up stagger-1" onSubmit={handleSubmit}>
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
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand-primary hover:text-brand-secondary"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Login
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-text-secondary animate-slide-up stagger-2">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-brand-primary hover:text-brand-secondary">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
