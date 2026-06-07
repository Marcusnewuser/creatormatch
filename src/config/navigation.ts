import {
  Home,
  Briefcase,
  FileText,
  User,
  Settings,
  LayoutDashboard,
  Megaphone,
  Users,
  Building2,
  BarChart3,
  MessageCircle,
  Handshake,
  LineChart,
  Search,
} from 'lucide-react'
import type { NavItem } from '../components/layout/Sidebar'

export const creatorNavItems: NavItem[] = [
  { to: '/creator/dashboard', icon: Home, label: 'Home' },
  { to: '/creator/campaigns', icon: Briefcase, label: 'Opportunities' },
  { to: '/creator/applications', icon: FileText, label: 'Applications' },
  { to: '/creator/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/creator/profile', icon: User, label: 'Profile' },
  { to: '/creator/settings', icon: Settings, label: 'Settings' },
]

export const brandNavItems: NavItem[] = [
  { to: '/brand/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/brand/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/brand/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/brand/dashboard', icon: Users, label: 'Applicants' },
  { to: '/brand/profile', icon: Building2, label: 'Company Profile' },
  { to: '/brand/settings', icon: Settings, label: 'Settings' },
]

export const adminNavItems: NavItem[] = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: User, label: 'Users' },
  { to: '/admin/creators', icon: Users, label: 'Creators' },
  { to: '/admin/brands', icon: Building2, label: 'Brands' },
  { to: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/admin/applications', icon: FileText, label: 'Applications' },
  { to: '/admin/collaborations', icon: Handshake, label: 'Collaborations' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/analytics', icon: LineChart, label: 'Analytics' },
  { to: '/admin/search', icon: Search, label: 'Search' },
]
