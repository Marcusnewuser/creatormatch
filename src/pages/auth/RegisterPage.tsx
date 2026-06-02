import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await signUp(email, password)
      navigate('/role', { state: { fullName: name } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
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
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Join thousands of creators and brands on CreatorMatch
          </p>
        </div>

        <form className="mt-8 space-y-5 animate-slide-up stagger-1" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <Input
            label="Name"
            type="text"
            placeholder="Your full name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            placeholder="Create a password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Register
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-text-secondary animate-slide-up stagger-2">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-primary hover:text-brand-secondary">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
