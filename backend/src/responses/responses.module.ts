import { Module }           from '@nestjs/common'
import { ResponsesService }  from './responses.service'
import { ResponsesController } from './responses.controller'
import { PrismaModule }      from '../prisma/prisma.module'
import { ComplianceModule }  from '../compliance/compliance.module'
import { VacationsModule }   from '../vacations/vacations.module'
import { AusenciasModule }   from '../ausencias/ausencias.module'

@Module({
  imports:     [PrismaModule, ComplianceModule, VacationsModule, AusenciasModule],
  controllers: [ResponsesController],
  providers:   [ResponsesService],
  exports:     [ResponsesService],
})
export class ResponsesModule {}