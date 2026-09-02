import imageCompression from 'browser-image-compression'
import api from '../api'
import type { Form, InspeccionResumen, ResponseRecord } from '../types'

export interface CheckDuplicateResponse {
  realizada: boolean
  inspeccion: InspeccionResumen | null
  enVacaciones?: boolean
  enAusencia?: boolean
  ausencia?: { fecha: string; motivo: string | null } | null
}

export interface SubmitInspectionAnswer {
  questionId: number
  valor?: string
  observacion?: string
  imagenUrl?: string
}

export interface SubmitInspectionPayload {
  formId: number
  placa: string
  ciudad: string
  contrato: string
  imagenVehiculoUrl?: string
  answers: SubmitInspectionAnswer[]
}

export async function getActiveForms(): Promise<Form[]> {
  const { data } = await api.get<Form[]>('/forms')
  return data
}

export async function checkTodayInspection(): Promise<CheckDuplicateResponse> {
  const { data } = await api.get<CheckDuplicateResponse>('/responses/check')
  return data
}

export async function submitInspection(payload: SubmitInspectionPayload): Promise<void> {
  await api.post('/responses', payload)
}

export async function getUserResponses(userId: number): Promise<ResponseRecord[]> {
  const { data } = await api.get<ResponseRecord[]>(`/responses/user/${userId}`)
  return data
}

export async function checkVacationStatus(driverId: number): Promise<boolean> {
  try {
    const { data } = await api.get<boolean>(`/vacations/check/${driverId}`)
    return data
  } catch {
    return false
  }
}

export async function uploadImage(file: File, retries = 2): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.7,
  })

  const formData = new FormData()
  formData.append('file', compressed)

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data } = await api.post<{ url: string }>('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      })
      return data.url
    } catch (error) {
      if (attempt === retries) throw error
      // Wait 1.5s before retry
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  throw new Error('No fue posible subir la imagen')
}
