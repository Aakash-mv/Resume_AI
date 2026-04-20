import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const api = axios.create({ baseURL: BASE, timeout: 60000 })

export async function uploadResume(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/upload', form)
  return data
}

export async function analyzeResume(resumeText, jobDescription) {
  const { data } = await api.post('/analyze', {
    resume_text: resumeText,
    job_description: jobDescription,
  })
  return data
}

export async function sendChatMessage(message, history, analysisContext, jobDescription) {
  const payload = {
    message: message || "",
    history: history || [],
    analysis_context: analysisContext || {},
    job_description: jobDescription || ""
  }

  const { data } = await api.post('/chat', payload)
  return data.reply
}

export default api
