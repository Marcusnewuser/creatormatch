import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from './layouts/AuthLayout'
import { MobileLayout } from './layouts/MobileLayout'
import { BrandMobileLayout } from './layouts/BrandMobileLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { ProfileLayout } from './layouts/ProfileLayout'
import { LoadingState } from './components/ui/LoadingState'
import { SupabaseConfigBanner } from './components/SupabaseConfigBanner'
import { ProtectedRoute, GuestRoute, OnboardingRoute } from './components/auth/ProtectedRoute'
import { creatorNavItems, brandNavItems } from './config/navigation'

const SplashScreen = lazy(() => import('./pages/auth/SplashScreen'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const RoleSelectionPage = lazy(() => import('./pages/auth/RoleSelectionPage'))

const CreatorHome = lazy(() => import('./pages/creator/CreatorHome'))
const CampaignList = lazy(() => import('./pages/creator/CampaignList'))
const CampaignDetail = lazy(() => import('./pages/creator/CampaignDetail'))
const ApplyCampaign = lazy(() => import('./pages/creator/ApplyCampaign'))
const MyApplications = lazy(() => import('./pages/creator/MyApplications'))
const CreatorProfile = lazy(() => import('./pages/creator/CreatorProfile'))
const EditCreatorProfile = lazy(() => import('./pages/creator/EditCreatorProfile'))
const EditCreatorPost = lazy(() => import('./pages/creator/EditCreatorPost'))
const CreatorDashboard = lazy(() => import('./pages/creator/CreatorDashboard'))

const BrandHome = lazy(() => import('./pages/brand/BrandHome'))
const BrandCampaignList = lazy(() => import('./pages/brand/BrandCampaignList'))
const CreateCampaign = lazy(() => import('./pages/brand/CreateCampaign'))
const EditCampaign = lazy(() => import('./pages/brand/EditCampaign'))
const ApplicantList = lazy(() => import('./pages/brand/ApplicantList'))
const ApplicantDetail = lazy(() => import('./pages/brand/ApplicantDetail'))
const BrandProfile = lazy(() => import('./pages/brand/BrandProfile'))
const EditBrandProfile = lazy(() => import('./pages/brand/EditBrandProfile'))
const BrandDashboard = lazy(() => import('./pages/brand/BrandDashboard'))

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminUserDetailPage = lazy(() => import('./pages/admin/AdminUserDetailPage'))
const AdminCreatorsPage = lazy(() => import('./pages/admin/AdminCreatorsPage'))
const AdminBrandsPage = lazy(() => import('./pages/admin/AdminBrandsPage'))
const AdminCampaignsPage = lazy(() => import('./pages/admin/AdminCampaignsPage'))
const AdminApplicationsPage = lazy(() => import('./pages/admin/AdminApplicationsPage'))
const AdminCollaborationsPage = lazy(() => import('./pages/admin/AdminCollaborationsPage'))
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'))
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'))
const AdminSearchPage = lazy(() => import('./pages/admin/AdminSearchPage'))
const AdminLayout = lazy(() =>
  import('./layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)

const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const PublicCreatorProfile = lazy(() => import('./pages/PublicCreatorProfile'))
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'))
const MessagesListPage = lazy(() => import('./pages/messages/MessagesListPage'))
const ChatDetailPage = lazy(() => import('./pages/messages/ChatDetailPage'))

function PageLoader() {
  return <LoadingState />
}

export default function App() {
  return (
    <BrowserRouter>
      <SupabaseConfigBanner />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route element={<AuthLayout />}>
            <Route path="/" element={<SplashScreen />} />
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Primary mode selection after registration */}
          <Route element={<OnboardingRoute />}>
            <Route path="/role" element={<RoleSelectionPage />} />
          </Route>

          {/* Public creator profile, posts & notifications (any authenticated user) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<ProfileLayout />}>
              <Route path="/creators/:userId" element={<PublicCreatorProfile />} />
              <Route path="/posts/:postId" element={<PostDetailPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          {/* Creator */}
          <Route element={<ProtectedRoute requireMode="creator" />}>
            <Route path="/creator" element={<MobileLayout />}>
              <Route path="home" element={<CreatorHome />} />
              <Route path="campaigns" element={<CampaignList />} />
              <Route path="campaigns/:id" element={<CampaignDetail />} />
              <Route path="campaigns/:id/apply" element={<ApplyCampaign />} />
              <Route path="applications" element={<MyApplications />} />
              <Route path="profile" element={<CreatorProfile />} />
              <Route path="profile/create" element={<EditCreatorProfile />} />
              <Route path="profile/edit" element={<EditCreatorProfile />} />
              <Route path="posts/create" element={<EditCreatorPost />} />
              <Route path="posts/:id/edit" element={<EditCreatorPost />} />
              <Route path="notifications" element={<Navigate to="/notifications" replace />} />
              <Route path="messages" element={<MessagesListPage />} />
              <Route path="messages/:conversationId" element={<ChatDetailPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="/creator/dashboard" element={<DashboardLayout navItems={creatorNavItems} />}>
              <Route index element={<CreatorDashboard />} />
            </Route>
          </Route>

          {/* Brand */}
          <Route element={<ProtectedRoute requireMode="brand" />}>
            <Route path="/brand" element={<BrandMobileLayout />}>
              <Route path="home" element={<BrandHome />} />
              <Route path="campaigns" element={<BrandCampaignList />} />
              <Route path="campaigns/create" element={<CreateCampaign />} />
              <Route path="campaigns/:id/edit" element={<EditCampaign />} />
              <Route path="campaigns/:id/applicants" element={<ApplicantList />} />
              <Route path="applicants/:id" element={<ApplicantDetail />} />
              <Route path="profile" element={<BrandProfile />} />
              <Route path="profile/create" element={<EditBrandProfile />} />
              <Route path="profile/edit" element={<EditBrandProfile />} />
              <Route path="notifications" element={<Navigate to="/notifications" replace />} />
              <Route path="messages" element={<MessagesListPage />} />
              <Route path="messages/:conversationId" element={<ChatDetailPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="/brand/dashboard" element={<DashboardLayout navItems={brandNavItems} />}>
              <Route index element={<BrandDashboard />} />
            </Route>
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/:userId" element={<AdminUserDetailPage />} />
              <Route path="creators" element={<AdminCreatorsPage />} />
              <Route path="brands" element={<AdminBrandsPage />} />
              <Route path="campaigns" element={<AdminCampaignsPage />} />
              <Route path="applications" element={<AdminApplicationsPage />} />
              <Route path="collaborations" element={<AdminCollaborationsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="search" element={<AdminSearchPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
