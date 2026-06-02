import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { Button } from '../../components/ui/Button'

export default function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-light/60 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand-light/40 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md animate-fade-in">
        <div className="animate-scale-in mb-8">
          <Logo size="hero" showText={false} />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight animate-slide-up stagger-1">
          CreatorMatch
        </h1>

        <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed animate-slide-up stagger-2">
          Get Discovered by Brands.
          <br />
          Turn Content Into Income.
        </p>

        <div className="mt-10 w-full max-w-xs animate-slide-up stagger-3">
          <Link to="/login">
            <Button size="lg" fullWidth>
              Get Started
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-xs text-text-secondary animate-slide-up stagger-4">
          Trusted by 1,000+ creators and 300+ brands
        </p>
      </div>
    </div>
  )
}
