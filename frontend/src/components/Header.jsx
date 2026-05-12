import { Link, useLocation } from 'react-router-dom'

export default function Header({ user, onLogout }) {
  const { pathname } = useLocation()

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm px-3 py-1.5 rounded-lg transition-all ${
        pathname === to
          ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
        <Link to="/app" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-sm font-black animate-glow-pulse">
            S
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold tracking-tight leading-none">SignEase</h1>
            <p className="text-xs text-gray-500 leading-none mt-0.5">Arabic Sign Language</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 ml-4">
          {navLink('/app',        'Translate')}
          {navLink('/practice',   'Practice')}
          {navLink('/dictionary', 'Dictionary')}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            ArSL 97%
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 hidden md:block">{user.name}</span>
              {user.role === 'admin' && (
                <Link to="/admin" className="text-xs bg-indigo-700 hover:bg-indigo-600 text-white px-2 py-1 rounded-lg transition-colors">
                  Admin
                </Link>
              )}
              <button onClick={onLogout} className="text-xs text-gray-600 hover:text-white transition-colors">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
