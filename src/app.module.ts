import { Module } from '@nestjs/common';
import { MeetingModule } from './meeting/meeting.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { TwilioModule } from './twilio/twilio.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    MeetingModule,
    ConfigModule.forRoot(),
    CoreModule,
    TwilioModule,
    HealthModule,
    PrismaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
