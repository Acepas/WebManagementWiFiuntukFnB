import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { LogAction } from '@prisma/client';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Merekam aktivitas baru ke database
   */
  async logAction(data: {
    action: LogAction;
    adminId?: string;
    serverId?: string;
    entity?: string;
    entityId?: string;
    detail?: string;
    ipAddress?: string;
  }) {
    try {
      await this.prisma.activityLog.create({
        data: {
          action: data.action,
          adminId: data.adminId,
          serverId: data.serverId,
          entity: data.entity,
          entityId: data.entityId,
          detail: data.detail,
          ipAddress: data.ipAddress,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to write activity log for ${data.action}: ${error.message}`);
    }
  }

  /**
   * Mengambil daftar log aktivitas dengan pagination dan filter
   */
  async getLogs(params: {
    skip?: number;
    take?: number;
    serverId?: string;
    action?: LogAction;
  }) {
    const { skip = 0, take = 50, serverId, action } = params;

    const whereClause: any = {};
    if (serverId) whereClause.serverId = serverId;
    if (action) whereClause.action = action;

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: whereClause,
        include: {
          admin: { select: { id: true, name: true, email: true } },
          server: { select: { id: true, name: true, host: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(take),
      }),
      this.prisma.activityLog.count({ where: whereClause }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        skip: Number(skip),
        take: Number(take),
      },
    };
  }
}
