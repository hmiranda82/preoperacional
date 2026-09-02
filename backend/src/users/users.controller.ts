import {
  Controller, Get, Post, Put, Delete,
  Body, Param, ParseIntPipe,
  UseGuards, HttpCode, HttpStatus, ForbiddenException,
} from '@nestjs/common'
import { UsersService }    from './users.service'
import { CreateUserDto }   from './dto/create-user.dto'
import { UpdateUserDto }   from './dto/update-user.dto'
import { JwtAuthGuard }    from '../common/guards/jwt-auth.guard'
import { RolesGuard }      from '../common/guards/roles.guard'
import { Roles }           from '../common/decorators/roles.decorator'
import { CurrentUser }     from '../common/decorators/current-user.decorator'
import type { CurrentUserData } from '../common/decorators/current-user.decorator'

/**
 * UsersController
 *
 * All routes require JWT authentication.
 * Write operations (POST / PUT / DELETE) additionally require ADMIN role.
 * GET routes are accessible to any authenticated user (needed by the driver app
 * to resolve user names when displaying history).
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ─── Read (any authenticated role) ───────────────────────
  @Get()
  findAll(@CurrentUser() user: CurrentUserData) {
    const companyId = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.usersService.findAll(companyId)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserData) {
    const companyId = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.usersService.findById(id, companyId)
  }

  // ─── Write (ADMIN only) ───────────────────────────────────
  @Post()
  @Roles('ADMIN', 'SUPER_ROOT')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: CurrentUserData) {
    if (user.role !== 'SUPER_ROOT' && dto.role === 'SUPER_ROOT') {
      throw new ForbiddenException('No tienes permisos para crear usuarios SUPER_ROOT')
    }
    const companyId =
      user.role === 'SUPER_ROOT' && dto.companyId
        ? dto.companyId
        : user.companyId
    return this.usersService.create(dto, companyId)
  }

  @Put(':id')
  @Roles('ADMIN', 'SUPER_ROOT')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (user.role !== 'SUPER_ROOT' && dto.role === 'SUPER_ROOT') {
      throw new ForbiddenException('No tienes permisos para asignar el rol SUPER_ROOT')
    }
    return this.usersService.update(id, dto, user)
  }

  /**
   * DELETE /users/:id
   * Smart delete: hard-deletes users with no inspection history,
   * soft-deletes (deactivates) those who have records to preserve audit trail.
   * Response includes _action: 'deleted' | 'deactivated'.
   */
  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ROOT')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id)
  }
}
