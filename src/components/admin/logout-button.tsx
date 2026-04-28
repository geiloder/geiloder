'use client'

export function LogoutButton() {
  async function logout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    window.location.href = '/admin/login'
  }

  return (
    <button onClick={logout} className="text-xs text-zinc-500 hover:text-white">
      Logout
    </button>
  )
}
