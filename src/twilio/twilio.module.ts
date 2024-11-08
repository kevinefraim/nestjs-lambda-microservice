import { Global, Module } from '@nestjs/common';
import { TwilioService } from './twilio.service';

@Global()
@Module({
  exports: [TwilioService],
  providers: [TwilioService],
})
export class TwilioModule {}
