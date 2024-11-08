import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { CoreUser } from 'src/common/types/core';

@Injectable()
export class CoreService {
  private readonly coreApiUrl = process.env.CORE_API_URL || '';

  // Get User by URN
  async getUserByUrn(urn: string, accessToken: string): Promise<CoreUser> {
    try {
      const response = await axios.get(`${this.coreApiUrl}/api/users/${urn}`, {
        params: { access_token: accessToken },
      });

      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Send Notification to User
  async sendNotification(
    type: string,
    date: string,
    user: CoreUser,
    participantUrn: string,
  ): Promise<void> {
    try {
      await axios.post(
        `${this.coreApiUrl}/api/notifications`,
        {
          type,
          date,
          read: false,
          actor: user.urn,
          participantUrn,
        },
        {
          params: { access_token: user.accessToken },
        },
      );
      return;
    } catch (error) {
      console.log(error);

      throw new HttpException(
        'Failed to send notification',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get Group by URN
  async getGroupMembersByUrn(
    groupUrn: string,
    user: CoreUser,
  ): Promise<CoreUser[]> {
    try {
      const response = await axios.get(
        `${this.coreApiUrl}/api/groups/${groupUrn}/members`,
        {
          params: { access_token: user.accessToken },
        },
      );

      return response.data.flatMap(
        (member: { user: CoreUser }) => member.user,
      ) as CoreUser[];
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new HttpException(
        `Failed to retrieve group data: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
