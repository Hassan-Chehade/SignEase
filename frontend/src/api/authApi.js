import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export const login = (email, password) =>
  api.post('/login', { email, password })

export const register = (name, email, password, password_confirmation) =>
  api.post('/register', { name, email, password, password_confirmation })

export const logoutApi = (token) =>
  api.post('/logout', {}, { headers: { Authorization: `Bearer ${token}` } })

export const getMe = (token) =>
  api.get('/me', { headers: { Authorization: `Bearer ${token}` } })
