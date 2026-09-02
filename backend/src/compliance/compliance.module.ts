import { Module }            from '@nestjs/common'
import { ComplianceService }    from './compliance.service'
import { ComplianceController } from './compliance.controller'
import { PrismaModule }         from '../prisma/prisma.module'
import { VacationsModule }      from '../vacations/vacations.module'
import { AusenciasModule }      from '../ausencias/ausencias.module'

@Module({
  imports:     [PrismaModule, VacationsModule, AusenciasModule],
  controllers: [ComplianceController],
  providers:   [ComplianceService],
  exports:     [ComplianceService],
})
export class ComplianceModule {}