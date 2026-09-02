export type Rol = 'ADMIN' | 'CONDUCTOR' | 'SUPER_ROOT' | 'DRIVER';

export interface User {
  id: number;
  cedula: string;
  nombre: string;
  email: string;
  telefono?: string;
  placa?: string;
  ciudad?: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
  diasLaborales?: string;
  soatVigencia?: string | null;
  tecniVigencia?: string | null;
  companyId?: number | null;
  empresa?: { id: number; nombre: string } | null;
  enVacaciones?: boolean;
}

export interface Ausencia {
  id: number;
  driverId: number;
  fecha: string;
  motivo: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string | null;
  driver?: {
    id: number;
    nombre: string;
    cedula: string;
    placa: string | null;
  } | null;
}

export interface Question {
  id: number;
  texto: string;
  tipo: string;
  categoria?: string;
  orden: number;
  activo: boolean;
  formId?: number;
  opciones?: string[];
}

export interface Answer {
  id: number;
  valor: string;
  observacion?: string | null;
  imagenUrl: string | null;
  question?: Partial<Question>;
}

/**
 * CORRECCIÓN: driverId en lugar de userId.
 * El modelo Response en BD usa driver_id (FK a drivers.id).
 * El campo "user" es el objeto serializado que devuelve el backend
 * para mantener compatibilidad con el frontend.
 */
export interface Response {
  id: number;
  driverId: number;
  formId: number;
  placa: string;
  ciudad: string;
  contrato: string;
  fecha: string;
  imagenVehiculoUrl?: string | null;
  /** Datos del conductor — serializado desde driver.nombre, driver.cedula, driver.user.email */
  user?: {
    id: number | null;
    nombre: string | null;
    cedula: string | null;
    email: string | null;
    role: string | null;
  };
  form?: { nombre: string };
  answers: Answer[];
}
