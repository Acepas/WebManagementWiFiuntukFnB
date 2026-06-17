import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  // undefined (bukan '') agar tidak mengirim AUTH ke Redis tanpa password.
  password: process.env.REDIS_PASSWORD || undefined,
}));
