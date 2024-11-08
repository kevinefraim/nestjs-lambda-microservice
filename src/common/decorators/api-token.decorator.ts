import { ApiQuery } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { TOKEN_PARAM } from 'src/common/consts/config';

export function ApiToken() {
  return applyDecorators(
    ApiQuery({
      name: TOKEN_PARAM,
      type: String,
      required: true,
      description: 'Access token for authentication',
    }),
  );
}
