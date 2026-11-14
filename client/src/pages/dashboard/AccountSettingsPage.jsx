import { useState } from 'react'
import { User, Lock, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import useAuthStore from '../../store/authStore'
import authService from '../../services/authService'

export default function AccountSettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingPassword, setSavingPassword] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await authService.updateProfile({ name, bio })
      updateUser(res.data)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.message || 'Could not update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwords.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      await authService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      toast.success('Password updated successfully!')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <SEO title="Account Settings — AIVORA" />

      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Account Settings</h1>
          <p className="text-sm text-slate-400">Manage your personal details and account security.</p>
        </div>

        {/* Profile Form */}
        <form
          onSubmit={handleProfileSave}
          className="glass rounded-2xl p-6 border border-white/10 space-y-5"
        >
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-aivora-indigo" />
            Profile Information
          </h2>

          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input label="Email Address" value={user?.email || ''} disabled />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your creative goals..."
              className="w-full rounded-xl bg-aivora-navy border border-white/10 p-3.5 text-sm text-white"
            />
          </div>

          <Button type="submit" loading={savingProfile} iconLeft={<Save className="w-4 h-4" />}>
            Save Profile
          </Button>
        </form>

        {/* Change Password Form */}
        <form
          onSubmit={handlePasswordChange}
          className="glass rounded-2xl p-6 border border-white/10 space-y-5"
        >
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-aivora-cyan" />
            Change Password
          </h2>

          <Input
            label="Current Password"
            type="password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            required
          />

          <Input
            label="New Password"
            type="password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
            required
          />

          <Button type="submit" loading={savingPassword}>
            Update Password
          </Button>
        </form>
      </div>
    </>
  )
}
