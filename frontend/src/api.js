// api.js
// -------
// One axios instance shared by the whole app, pointed at the FastAPI backend.
// The interceptor automatically attaches the saved JWT (if any) to every
// outgoing request, so individual components never have to deal with headers.
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://food-ordering-app-6dq1.onrender.com',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
