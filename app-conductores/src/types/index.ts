export interface AuthUser {
  id:             number
  nombre:         string
  email:          string
  cedula:         string
  placa:          string
  telefono:       string
  ciudad:         string
  soatVigencia:   string | null
  tecniVigencia:  string | null
  rol:            'ADMIN' | 'CONDUCTOR'
  enVacaciones?:  boolean
  vacacion?:      { fechaInicio: string; fechaFin: string } | null
  enAusencia?:    boolean
  ausencia?:      { fecha: string; motivo: string | null } | null
}

export interface Question {
  id:     number
  texto:  string
  tipo:   'BOOLEAN' | 'SINO' | 'TEXTO' | 'NUMERO'
  orden:  number
}

export interface Form {
  id:        number
  nombre:    string
  activo:    boolean
  questions: Question[]
}

export type ValorRespuesta = 'OK' | 'NO' | 'OBSERVACION' | string

export interface AnswerPayload {
  questionId:   number
  valor?:       ValorRespuesta
  observacion?: string
  imagenUrl?:   string
}

export interface Answer {
  id:           number
  questionId:   number
  valor:        ValorRespuesta
  observacion?: string | null
  imagenUrl:    string | null
  question?:    Question
}

export interface InspeccionResumen {
  id:     number
  placa:  string
  ciudad: string
  fecha:  string
  form:   { nombre: string }
}

export interface Vacation {
  id: number
  driverId: number
  fechaInicio: string
  fechaFin: string
  motivo: string | null
  activo: boolean
  createdAt: string
  updatedAt: string | null
  driver?: {
    id: number
    nombre: string
    cedula: string
    placa: string | null
  }
}

export interface ResponseRecord {
  id:                number
  placa:             string
  ciudad:            string
  contrato:          string
  fecha:             string
  imagenVehiculoUrl: string | null   // foto general del vehículo
  user:              { nombre: string; cedula: string }
  form:              { nombre: string }
  answers:           Answer[]
}