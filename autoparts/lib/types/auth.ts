// Типы для аутентификации, соответствующие Java DTO

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword?: string // для фронтенда
  clientName: string // name в форме
  country: string
  state: string // region в форме
  city: string // location в форме  
  officeAddress: string
  type: string // activity в форме
  surname: string
  name: string // firstName в форме
  fathername: string // fathersName в форме
  phone: string
}

export interface AuthResponse {
  jwt: string
}

export interface User {
  id: number
  email: string
  role: 'USER' | 'ADMIN'
  clientName: string
  country: string
  state: string
  city: string
  officeAddress: string
  type: string
  surname: string
  name: string
  fathername: string
  phone: string
  banned: boolean
}

// Типы ошибок API
export interface ApiError {
  message: string
  status: number
}
