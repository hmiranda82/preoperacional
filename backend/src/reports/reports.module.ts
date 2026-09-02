import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { UsersModule } from '../users/users.module'
import { ResponsesModule } from '../responses/responses.module'
import { VacationsModule } from '../vacations/vacations.module'
import { AusenciasModule } from '../ausencias/ausencias.module'
import { ComplianceModule } from '../compliance/compliance.module'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'

@Module({
  imports: [PrismaModule, UsersModule, ResponsesModule, VacationsModule, AusenciasModule, ComplianceModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
