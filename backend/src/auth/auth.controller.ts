import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RefreshDto } from './dto/refresh.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { GenerateResetDto } from './dto/generate-reset.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { CurrentUserData } from '../common/decorators/current-user.decorator'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password)
  }

  @Post('super-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  superLogin(@Body() dto: LoginDto) {
    return this.authService.superLogin(dto.email, dto.password)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  refresh(@Body() body: RefreshDto) {
    return this.authService.refreshToken(body.refresh_token)
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.authService.changePassword(user.id, dto.current_password, dto.new_password)
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.new_password)
  }

  @Post('generate-reset')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ROOT')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  generateReset(@Body() dto: GenerateResetDto, @CurrentUser() user: CurrentUserData) {
    return this.authService.generatePasswordResetToken(dto.userId, {
      id: user.id,
      role: user.role,
      companyId: user.companyId,
    })
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logoutAll(@CurrentUser() user: CurrentUserData) {
    return this.authService.logoutAllSessions(user.id)
  }
}
