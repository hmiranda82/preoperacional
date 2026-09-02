import { Module } from '@nestjs/common'
import { AusenciasService } from './ausencias.service'
import { AusenciasController } from './ausencias.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [AusenciasController],
  providers: [AusenciasService],
  exports: [AusenciasService],
})
export class AusenciasModule {}
