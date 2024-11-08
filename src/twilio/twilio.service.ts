import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import { VideoGrant } from 'twilio/lib/jwt/AccessToken';
import AccessToken = require('twilio/lib/jwt/AccessToken');

@Injectable()
export class TwilioService {
  private twilioClient: Twilio;
  private readonly twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  private readonly twilioApiKeySid = process.env.TWILIO_API_KEY_SID;
  private readonly twilioApiKeySecret = process.env.TWILIO_API_KEY_SECRET;

  constructor() {
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  getRoomByTitle(title: string) {
    return this.twilioClient.video.v1.rooms.list({
      uniqueName: title,
      limit: 1,
    });
  }

  createRoom({
    title,
    maxParticipants,
  }: {
    title: string;
    maxParticipants: number;
  }) {
    return this.twilioClient.video.v1.rooms.create({
      uniqueName: title,
      type: 'group',
      maxParticipants: maxParticipants,
    });
  }

  async updateRoomStatus(roomSid: string, status: 'completed' | 'in-progress') {
    await this.twilioClient.video.v1.rooms(roomSid).update({ status });
  }

  async updateRecordingStatus(
    roomSid: string,
    rules: { type: string; all: boolean }[],
  ) {
    await this.twilioClient.video.v1
      .rooms(roomSid)
      .recordingRules.update({ rules });
  }

  generateRoomAccessToken(userUrn: string, roomSid: string): string {
    if (
      !this.twilioAccountSid ||
      !this.twilioApiKeySid ||
      !this.twilioApiKeySecret
    ) {
      throw new Error('Twilio credentials are missing');
    }

    const token = new AccessToken(
      this.twilioAccountSid,
      this.twilioApiKeySid,
      this.twilioApiKeySecret,
      { identity: 'user' },
    );

    const videoGrant = new VideoGrant({ room: roomSid });
    token.addGrant(videoGrant);

    token.identity = userUrn;

    return token.toJwt();
  }

  async getRoomStatus(roomSid: string): Promise<string> {
    try {
      const room = await this.twilioClient.video.v1.rooms(roomSid).fetch();
      return room.status;
    } catch (error) {
      console.error('Error fetching room status:', error);
      throw new HttpException(
        'Failed to fetch room status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
