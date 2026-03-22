import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const api = axios.create({ baseURL: BASE })

export const submitText = (texts, filters, jobName) =>
  api.post('/jobs/text', { texts, filters, job_name: jobName })

export const submitTopic = (topic, filters, jobName) =>
  api.post('/jobs/topic', { topic, filters, job_name: jobName })

export const submitPDFs = (files, filters, jobName) => {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  form.append('filters', filters.join(','))
  if (jobName) form.append('job_name', jobName)
  return api.post('/jobs/pdf', form)
}

export const getJob = (id) => api.get(`/jobs/${id}`)
export const getReport = (id) => api.get(`/jobs/${id}/report`)
export const cancelJob = (id) => api.post(`/jobs/${id}/cancel`)
export const getFindings = (kind, severity) =>
  api.get('/findings', { params: { kind, severity } })

export const pdfUrl = (id) => `${BASE}/jobs/${id}/report/pdf`
export const docxUrl = (id) => `${BASE}/jobs/${id}/report/docx`