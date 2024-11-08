import { Module } from '@nestjs/common';
import { MeetingService } from './services/meeting.service';
import { MeetingController } from './meeting.controller';
import { MeetingHelperService } from 'src/meeting/services/helper.service';

@Module({
  providers: [MeetingService, MeetingHelperService],
  controllers: [MeetingController],
})
export class MeetingModule {}
