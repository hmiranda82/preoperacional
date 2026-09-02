import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { FormsModule } from './forms/forms.module'
import { ResponsesModule } from './responses/responses.module'
import { UploadsModule } from './uploads/uploads.module'
import { QuestionsModule } from './questions/questions.module'
import { ComplianceModule } from './compliance/compliance.module'
import { HealthModule } from './health/health.module'
import { CompaniesModule } from './companies/companies.module'
import { AuditModule } from './audit/audit.module'
import { NotificationsModule } from './notifications/notifications.module'
import { VacationsModule } from './vacations/vacations.module'
import { AusenciasModule } from './ausencias/ausencias.module'
import { ReportsModule } from './reports/reports.module'
import { DashboardModule } from './dashboard/dashboard.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Rate limiting global: 30 req/60s por IP por defecto.
    // Los @Throttle() específicos (p. ej. /auth/login: 5/60s) lo sobreescriben.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    FormsModule,
    ResponsesModule,
    UploadsModule,
    QuestionsModule,
    ComplianceModule,
    HealthModule,
    CompaniesModule,
    AuditModule,
    NotificationsModule,
    VacationsModule,
    AusenciasModule,
    ReportsModule,
    DashboardModule,
  ],
  providers: [
    // Activa ThrottlerGuard globalmente (necesario para que @Throttle funcione)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
