import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { meeting_user } from '@prisma/client';
import { CreateMeetingDto } from 'src/meeting/dto/create-meeting.dto';
import { CoreUser } from 'src/common/types/core';
import { MeetingExtended } from 'src/common/types/prisma';
import { TwilioService } from 'src/twilio/twilio.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MeetingHelperService } from 'src/meeting/services/helper.service';

@Injectable()
export class MeetingService {
  constructor(
    private prisma: PrismaService,
    private twilioService: TwilioService,
    private helper: MeetingHelperService,
  ) {}

  // ---- Create Meeting ----
  async createMeeting(user: CoreUser, data: CreateMeetingDto) {
    this.helper.validateCreateMeetingData(data);

    data.start_at = !!data.start_at ? new Date(data.start_at) : new Date();
    data.end_at =
      data.end_at || new Date(data.start_at.getTime() + 60 * 60 * 1000);

    await this.checkRoomExistence(data.title);
    await this.helper.populateGroupMembers(data, user);

    const room = await this.createTwilioRoom(data);
    const meeting = await this.createMeetingRecord(user, data, room.sid);

    await this.helper.sendMeetingNotifications(data.users, user);

    return meeting;
  }

  private async checkRoomExistence(title: string) {
    const rooms = await this.twilioService.getRoomByTitle(title);
    if (rooms.length > 0) {
      throw new HttpException('Room already exists', HttpStatus.FORBIDDEN);
    }
  }

  private async createTwilioRoom(data: CreateMeetingDto) {
    return this.twilioService.createRoom({
      title: data.title,
      maxParticipants: data.max_participants ?? 50,
    });
  }

  private async createMeetingRecord(
    user: CoreUser,
    data: CreateMeetingDto,
    sid: string,
  ) {
    const { max_participants, ...rest } = data;
    const start_at = data.start_at || new Date();
    return this.prisma.meetings.create({
      data: {
        ...rest,
        twilio_room_sid: sid,
        start_at,
        end_at: data.end_at
          ? data.end_at
          : new Date(start_at.getTime() + 60 * 60 * 1000),
        creator_id: user.urn,
        users: {
          createMany: {
            data: [...new Set([...data.users, user.urn])].map((userUrn) => ({
              user_id: userUrn,
            })),
            skipDuplicates: true,
          },
        },
      },
    });
  }

  // ---- Toggle Meeting ----
  async toggleMeeting(
    meetingId: string,
    user: CoreUser,
    action: 'start' | 'stop',
  ) {
    const meeting = await this.prisma.meetings.findFirst({
      where: { id: meetingId, users: { some: { user_id: user.urn } } },
    });
    if (!meeting || !meeting.twilio_room_sid) {
      throw new HttpException('Meeting not found', HttpStatus.NOT_FOUND);
    }

    const isCreator = meeting.creator_id === user.urn;

    if (action === 'start') {
      return this.startMeeting(user.urn, meeting.twilio_room_sid);
    }

    if (action === 'stop' && isCreator) {
      return this.stopMeeting(meeting.twilio_room_sid);
    }

    throw new HttpException(
      'Invalid action or permission denied',
      HttpStatus.BAD_REQUEST,
    );
  }

  private async startMeeting(userUrn: string, twilioRoomSid: string) {
    const currentStatus = await this.twilioService.getRoomStatus(twilioRoomSid);
    const accessToken = this.twilioService.generateRoomAccessToken(
      userUrn,
      twilioRoomSid,
    );
    if (currentStatus !== 'in-progress') {
      await this.twilioService.updateRoomStatus(twilioRoomSid, 'in-progress');
    }

    return { twilioRoomSid, accessToken };
  }

  private async stopMeeting(twilioRoomSid: string) {
    await this.twilioService.updateRoomStatus(twilioRoomSid, 'completed');
    return { message: 'Meeting completed' };
  }

  // ---- Toggle Recording ----
  async toggleRecording(
    meetingId: string,
    user: CoreUser,
    action: 'start' | 'stop',
  ) {
    const meeting = await this.getMeetingCreator(meetingId, user.urn);
    if (!meeting || !meeting.twilio_room_sid) {
      throw new HttpException('Meeting not found', HttpStatus.NOT_FOUND);
    }
    const rules =
      action === 'start'
        ? [{ type: 'include', all: true }]
        : [{ type: 'exclude', all: true }];

    try {
      const updatedRules = await this.twilioService.updateRecordingStatus(
        meeting.twilio_room_sid,
        rules,
      );
      return { message: `Recording ${action}ed`, updatedRules };
    } catch (error) {
      console.error(`Error ${action}ing recording:`, error);
      throw new HttpException(
        `Failed to ${action} recording`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getMeetingCreator(meetingId: string, creatorId: string) {
    const meeting = await this.prisma.meetings.findUnique({
      where: { id: meetingId, creator_id: creatorId },
    });
    if (meeting) {
      if (meeting.creator_id !== creatorId) {
        throw new HttpException(
          'Permission denied: not the meeting creator',
          HttpStatus.FORBIDDEN,
        );
      }
      return meeting;
    }
    return null;
  }

  async addUsersToMeeting(
    user: CoreUser,
    meetingId: string,
    usersToInvite: string[],
  ) {
    const meeting = await this.prisma.meetings.findUnique({
      where: { id: meetingId },
    });
    if (!meeting) {
      throw new HttpException('Meeting not found', HttpStatus.NOT_FOUND);
    }

    const meetingUsers = await this.prisma.meeting_user.createMany({
      skipDuplicates: true,
      data: usersToInvite.map((userUrn) => ({
        meeting_id: meetingId,
        user_id: userUrn,
      })),
    });

    await Promise.all(
      usersToInvite.map(
        async (userUrn) =>
          await this.helper.sendMeetingNotification(user, userUrn),
      ),
    );

    return { meeting_id: meetingId, users: usersToInvite };
  }

  async getNextUserMeetings(user: CoreUser) {
    const meetings = await this.prisma.meetings.findMany({
      orderBy: { start_at: 'asc' },
      include: { users: true },
      where: {
        users: { some: { user_id: user.urn } },
        start_at: { gt: new Date() },
      },
    });

    return Promise.all(
      meetings.map((meeting) => this.formatMeeting(meeting, user)),
    );
  }

  async getMeetingById(id: string, user: CoreUser) {
    const meeting = await this.prisma.meetings.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!meeting) {
      throw new HttpException('Meeting not found', HttpStatus.NOT_FOUND);
    }

    return this.formatMeeting(meeting, user);
  }

  // ---- Format Meeting ----
  private async formatMeeting(meeting: MeetingExtended, user: CoreUser) {
    const meetingUrns = meeting.users.map((user) => user.user_id);
    const [users, creator] = await Promise.all([
      this.helper.getFormattedUsers(meetingUrns, user.accessToken),
      this.helper.getFormattedUser(meeting.creator_id, user.accessToken),
    ]);

    return { ...meeting, creator, users };
  }

  // ---- Delete Meeting ----
  async deleteMeeting(id: string): Promise<void> {
    const meeting = await this.prisma.meetings.findUnique({ where: { id } });
    if (meeting?.twilio_room_sid) {
      try {
        await this.twilioService.updateRoomStatus(
          meeting.twilio_room_sid,
          'completed',
        );
      } catch (error) {
        console.error('Error ending Twilio room:', error);
      }
    }

    await this.prisma.meeting_user.deleteMany({ where: { meeting_id: id } });
    await this.prisma.meetings.delete({ where: { id } });
  }
}
