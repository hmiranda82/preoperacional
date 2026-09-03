import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'

interface JwtPayload {
  sub: number
  email: string
  role: string
  companyId: number
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Fija el algoritmo esperado: evita confusión de algoritmos en la verificación
      algorithms: ['HS256'],
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    })
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role, companyId: payload.companyId ?? 1 }
  }
}
