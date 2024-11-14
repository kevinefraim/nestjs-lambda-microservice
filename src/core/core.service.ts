import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axiosInstance from './axios-instance';
import { CoreUser } from 'src/common/types/core';

@Injectable()
export class CoreService {
  // Get User by URN
  async getUserByUrn(
    urn: string,
    accessToken: string,
  ): Promise<CoreUser | null> {
    try {
      const response = await axiosInstance.get(`/api/users/${urn}`, {
        params: { access_token: accessToken },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user by URN:', error.message);
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
      await axiosInstance.post(
        `/api/notifications`,
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
    } catch (error) {
      console.error(
        'Error sending notification:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to send notification',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get Group Members by URN
  async getGroupMembersByUrn(
    groupUrn: string,
    user: CoreUser,
  ): Promise<CoreUser[]> {
    try {
      const response = await axiosInstance.get(
        `/api/groups/${groupUrn}/members`,
        {
          params: { access_token: user.accessToken },
        },
      );

      return response.data.flatMap(
        (member: { user: CoreUser }) => member.user,
      ) as CoreUser[];
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error fetching group members:', errorMessage);
      throw new HttpException(
        `Failed to retrieve group data: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
