import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

const authHeader = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const detectSign = (imageBase64) =>
  api.post('/detect', { image: imageBase64 }, { headers: authHeader() })

export const getHistory = () =>
  api.get('/history', { headers: authHeader() })

export const clearHistory = () =>
  api.delete('/history', { headers: authHeader() })
