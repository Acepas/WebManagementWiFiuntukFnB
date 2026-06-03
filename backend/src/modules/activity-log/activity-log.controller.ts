import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogAction } from '@prisma/client';

@ApiTags('Activity Logs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('activity-log')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar log aktivitas (history)' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'serverId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, enum: LogAction })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil data log.' })
  async getLogs(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('serverId') serverId?: string,
    @Query('action') action?: LogAction,
  ) {
    return this.activityLogService.getLogs({ skip, take, serverId, action });
  }
}
