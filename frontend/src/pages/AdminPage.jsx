import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const api = (token) =>
  axios.create({
    baseURL: '/api/admin',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })

export default function AdminPage() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]             = useState('users')
  const [users, setUsers]         = useState([])
  const [detections, setDetections] = useState([])
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const a = api(token)
      const [s, u, d] = await Promise.all([a.get('/stats'), a.get('/users'), a.get('/detections')])
      setStats(s.data)
      setUsers(u.data)
      setDetections(d.data)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const changeRole = async (userId, newRole) => {
    try {
      await api(token).patch(`/users/${userId}/role`, { role: newRole })
      setUsers((u) => u.map((x) => x.id === userId ? { ...x, role: newRole } : x))
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to update role')
    }
  }

  const deleteUser = async (userId, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    try {
      await api(token).delete(`/users/${userId}`)
      setUsers((u) => u.filter((x) => x.id !== userId))
      setStats((s) => s ? { ...s, total_users: s.total_users - 1 } : s)
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to delete user')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white text-sm">
            ← Back
          </button>
          <h1 className="text-lg font-bold">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user?.email}</span>
          <button onClick={logout} className="btn-danger text-sm py-1 px-3">Logout</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Users',        value: stats.total_users },
              { label: 'Total Detections',   value: stats.total_detections },
              { label: 'Admins',             value: stats.admins },
              { label: 'Detections Today',   value: stats.detections_today },
            ].map(({ label, value }) => (
              <div key={label} className="card text-center">
                <div className="text-3xl font-bold text-indigo-400">{value}</div>
                <div className="text-sm text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {['users', 'detections'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button onClick={load} className="ml-auto btn-secondary text-sm py-1 px-3">
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 pr-4">Name</th>
                  <th className="text-left py-2 pr-4">Email</th>
                  <th className="text-left py-2 pr-4">Role</th>
                  <th className="text-right py-2 pr-4">Detections</th>
                  <th className="text-left py-2 pr-4">Joined</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                    <td className="py-2 pr-4 font-medium">{u.name}</td>
                    <td className="py-2 pr-4 text-gray-400">{u.email}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-700 text-gray-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-400">{u.detections_count}</td>
                    <td className="py-2 pr-4 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-right">
                      {u.id !== user?.id && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => changeRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                          >
                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                          </button>
                          <button
                            onClick={() => deleteUser(u.id, u.name)}
                            className="text-xs bg-red-900/60 hover:bg-red-800 text-red-300 px-2 py-1 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-600">No users yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Detections tab */}
        {tab === 'detections' && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 pr-4">Sign</th>
                  <th className="text-right py-2 pr-4">Confidence</th>
                  <th className="text-left py-2 pr-4">User</th>
                  <th className="text-left py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((d) => (
                  <tr key={d.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                    <td className="py-2 pr-4 text-2xl font-bold text-indigo-300">{d.sign}</td>
                    <td className="py-2 pr-4 text-right text-gray-400">
                      {(d.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 pr-4 text-gray-400">
                      {d.user?.name || <span className="text-gray-600">anonymous</span>}
                    </td>
                    <td className="py-2 text-gray-500">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {detections.length === 0 && !loading && (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-600">No detections yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
