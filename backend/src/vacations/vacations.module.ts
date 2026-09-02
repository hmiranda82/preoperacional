import { Module } from '@nestjs/common'
import { VacationsService } from './vacations.service'
import { VacationsController } from './vacations.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [VacationsController],
  providers: [VacationsService],
  exports: [VacationsService],
})
export class VacationsModule {}
