import { Controller, Get } from '@nestjs/common';
import { HEALTH_BASE_ROUTE } from 'src/common/consts/routes';
import { Public } from 'src/common/decorators/public-auth.decorator';

@Controller(HEALTH_BASE_ROUTE)
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'OK' };
  }
}
