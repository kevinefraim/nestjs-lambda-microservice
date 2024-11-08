import { Prisma } from '@prisma/client';

export type MeetingExtended = Prisma.meetingsGetPayload<{
  include: {
    users: true;
  };
}>;
