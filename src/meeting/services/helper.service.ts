// src/meeting/helper.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CoreService } from 'src/core/core.service';
import { CoreUser } from 'src/common/types/core';
import { CreateMeetingDto } from 'src/meeting/dto/create-meeting.dto';

@Injectable()
export class MeetingHelperService {
  constructor(private coreService: CoreService) {}

  validateCreateMeetingData(data: CreateMeetingDto) {
    if (!data.group_urn && (!data.users || data.users.length === 0)) {
      throw new HttpException('No users provided', HttpStatus.BAD_REQUEST);
    }
  }

  async populateGroupMembers(data: CreateMeetingDto, user: CoreUser) {
    if (data.group_urn) {
      const groupMembers = await this.coreService.getGroupMembersByUrn(
        data.group_urn,
        user,
      );
      data.users = groupMembers.map((member) => member.urn);
    }
  }

  async sendMeetingNotifications(users: string[], user: CoreUser) {
    await Promise.all(
      users.map((participantUrn) =>
        this.coreService.sendNotification(
          'MEETING_JOIN',
          new Date().toISOString(),
          user,
          participantUrn,
        ),
      ),
    );
  }

  async sendMeetingNotification(user: CoreUser, userToInvite: string) {
    await this.coreService.sendNotification(
      'MEETING_JOIN',
      new Date().toISOString(),
      user,
      userToInvite,
    );
  }

  async getFormattedUsers(meetingUrns: string[], accessToken: string) {
    const users = await Promise.all(
      meetingUrns.map(async (urn) => this.getFormattedUser(urn, accessToken)),
    );
    return users.filter((user) => user !== null);
  }

async getFormattedUser(userId: string, accessToken: string) {
    const user = await this.coreService.getUserByUrn(userId, accessToken);
    return user
      ? {
          urn: user.urn,
          name: user.name,
          last_name: user.lastName,
          email: user.email,
        }
      : null;
  }
}
