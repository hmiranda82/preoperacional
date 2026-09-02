import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { NotificationsService } from './notifications.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { CurrentUserData } from '../common/decorators/current-user.decorator'

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: CurrentUserData) {
    const companyId = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.notificationsService.findAll(user.id, companyId)
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id)
  }
}
