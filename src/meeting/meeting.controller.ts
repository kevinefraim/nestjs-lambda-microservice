import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { MeetingService } from './services/meeting.service';
import { CreateMeetingDto } from 'src/meeting/dto/create-meeting.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { GetUser } from 'src/auth/decorator/user.decorator';
import { CoreUser } from 'src/common/types/core';
import { ApiToken } from 'src/common/decorators/api-token.decorator';
import {
  MEETINGS_BASE_ROUTE,
  MEETING_NEXT_ROUTE,
  MEETING_GET_ONE_ROUTE,
  MEETING_ID_ROUTE,
  MEETING_INVITE_ROUTE,
  MEETING_TOGGLE_ROUTE,
  MEETING_RECORDING_ROUTE,
} from 'src/common/consts/routes';

@ApiTags(MEETINGS_BASE_ROUTE)
@Controller(MEETINGS_BASE_ROUTE)
@UseGuards(AuthGuard)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Get()
  @ApiOperation({ summary: 'List all meetings' })
  @ApiToken()
  @ApiResponse({ status: 200, description: 'Meetings listed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async listMeetings(@GetUser() user: CoreUser) {
    return this.meetingService.listMeetings(user);
  }

  @Get(MEETING_NEXT_ROUTE)
  @ApiOperation({ summary: 'List upcoming meetings for a user' })
  @ApiToken()
  @ApiResponse({
    status: 200,
    description: 'Upcoming meetings listed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async listMeetingsByUser(@GetUser() user: CoreUser) {
    return this.meetingService.listMeetingsByUser(user);
  }

  @Get(MEETING_GET_ONE_ROUTE)
  @ApiOperation({ summary: 'Get a meeting by ID' })
  @ApiToken()
  @ApiParam({ name: 'id', type: String, description: 'Meeting ID' })
  @ApiResponse({ status: 200, description: 'Meeting retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async getMeetingById(@Param('id') id: string, @GetUser() user: CoreUser) {
    return this.meetingService.getMeetingById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new meeting' })
  @ApiToken()
  @ApiBody({ type: CreateMeetingDto, description: 'Meeting data' })
  @ApiResponse({ status: 201, description: 'Meeting created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createMeeting(
    @GetUser() user: CoreUser,
    @Body() data: CreateMeetingDto,
  ) {
    return this.meetingService.createMeeting(user, data);
  }

  @Post(MEETING_INVITE_ROUTE)
  @ApiOperation({ summary: 'Invite a user to a meeting' })
  @ApiToken()
  @ApiParam({ name: 'id', type: String, description: 'Meeting ID' })
  @ApiBody({ schema: { example: { userUrn: 'urn:user:sample-user-id' } } })
  @ApiResponse({ status: 200, description: 'User invited successfully' })
  @ApiResponse({ status: 403, description: 'User already in meeting' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async inviteUser(
    @GetUser() user: CoreUser,
    @Param('id') id: string,
    @Body('userUrn') userUrn: string,
  ) {
    return this.meetingService.addUserToMeeting(user, id, userUrn);
  }

  @Put(MEETING_TOGGLE_ROUTE)
  @ApiOperation({ summary: 'Start or stop a meeting' })
  @ApiToken()
  @ApiParam({ name: 'id', type: String, description: 'Meeting ID' })
  @ApiParam({
    name: 'action',
    enum: ['start', 'stop'],
    description: 'Action to perform',
  })
  @ApiResponse({
    status: 200,
    description: 'Meeting started/stopped successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid action' })
  async toggleMeeting(
    @GetUser() user: CoreUser,
    @Param('id') id: string,
    @Param('action') action: 'start' | 'stop',
  ) {
    return this.meetingService.toggleMeeting(id, user, action);
  }

  @Put(MEETING_RECORDING_ROUTE)
  @ApiOperation({ summary: 'Start or stop meeting recording' })
  @ApiToken()
  @ApiParam({ name: 'id', type: String, description: 'Meeting ID' })
  @ApiParam({
    name: 'action',
    enum: ['start', 'stop'],
    description: 'Recording action',
  })
  @ApiResponse({
    status: 200,
    description: 'Recording started/stopped successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid action' })
  async toggleRecording(
    @GetUser() user: CoreUser,
    @Param('id') id: string,
    @Param('action') action: 'start' | 'stop',
  ) {
    return this.meetingService.toggleRecording(id, user, action);
  }

  @Delete(MEETING_ID_ROUTE)
  @ApiOperation({ summary: 'Delete a meeting' })
  @ApiToken()
  @ApiParam({ name: 'id', type: String, description: 'Meeting ID' })
  @ApiResponse({ status: 200, description: 'Meeting deleted successfully' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async deleteMeeting(@Param('id') id: string) {
    return this.meetingService.deleteMeeting(id);
  }
}
