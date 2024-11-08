import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import axios from 'axios';
import { Request } from 'express';
import { TOKEN_PARAM } from 'src/common/consts/config';
import { IS_PUBLC_KEY } from 'src/common/decorators/public-auth.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLC_KEY,
      context.getHandler(),
    );
    if (isPublic) {
      return true;
    }
    const coreUrlApi = process.env.CORE_API_URL;
    const request = context.switchToHttp().getRequest<Request>();

    const accessToken = request.query[TOKEN_PARAM] as string;

    if (!accessToken) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      const response = await axios.get(`${coreUrlApi}/api/user`, {
        params: {
          access_token: accessToken,
        },
      });

      const user = { ...response.data, accessToken };

      if (!user || !user.urn) {
        throw new UnauthorizedException('Invalid access token');
      }

      request['user'] = user;
      return true;
    } catch (error) {
      console.error('Error validating access token:', error.message);
      throw new UnauthorizedException('Failed to validate access token');
    }
  }
}
