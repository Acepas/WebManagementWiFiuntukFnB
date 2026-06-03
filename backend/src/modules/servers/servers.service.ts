/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MikrotikService } from '../mikrotik/mikrotik.service.js';
import { ActivityLogService } from '../activity-log/activity-log.service.js';
import { CreateServerDto } from './dto/create-server.dto.js';
import { UpdateServerDto } from './dto/update-server.dto.js';
import { TestConnectionDto } from './dto/test-connection.dto.js';

@Injectable()
export class ServersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mikrotikService: MikrotikService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async create(createServerDto: CreateServerDto) {
    const { name, host, port, username, password, useSSL } = createServerDto;

    // Check if host already registered
    const existingServer = await this.prisma.mikrotikServer.findFirst({
      where: { host },
    });
    if (existingServer) {
      throw new BadRequestException(
        `Router dengan IP/Host ${host} sudah terdaftar`,
      );
    }

    const defaultPort = port || (useSSL ? 443 : 80);

    const server = await this.prisma.mikrotikServer.create({
      data: {
        name,
        host,
        port: defaultPort,
        username,
        password,
        useSSL: useSSL ?? false,
      },
    });

    await this.activityLogService.logAction({
      action: 'SERVER_CREATED',
      serverId: server.id,
      entity: 'MikrotikServer',
      entityId: server.id,
      detail: `Router baru ditambahkan: ${name} (${host})`,
    });

    return server;
  }

  async findAll() {
    return this.prisma.mikrotikServer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const server = await this.prisma.mikrotikServer.findUnique({
      where: { id },
    });
    if (!server) {
      throw new NotFoundException(`Router dengan ID ${id} tidak ditemukan`);
    }
    return server;
  }

  async update(id: string, updateServerDto: UpdateServerDto) {
    await this.findOne(id);

    if (updateServerDto.host) {
      const existingServer = await this.prisma.mikrotikServer.findFirst({
        where: {
          host: updateServerDto.host,
          id: { not: id },
        },
      });
      if (existingServer) {
        throw new BadRequestException(
          `Router dengan IP/Host ${updateServerDto.host} sudah terdaftar`,
        );
      }
    }

    const updated = await this.prisma.mikrotikServer.update({
      where: { id },
      data: updateServerDto,
    });

    await this.activityLogService.logAction({
      action: 'SERVER_UPDATED',
      serverId: id,
      entity: 'MikrotikServer',
      entityId: id,
      detail: `Konfigurasi router diupdate: ${updated.name}`,
    });

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.mikrotikServer.delete({
      where: { id },
    });
  }

  async testConnection(id: string) {
    const server = await this.findOne(id);

    const result = await this.mikrotikService.testConnection(
      server.host,
      server.port,
      server.username,
      server.password,
      server.useSSL,
    );

    const lastStatus = result.success ? 'ONLINE' : 'OFFLINE';

    // Update status di database secara background
    await this.prisma.mikrotikServer.update({
      where: { id },
      data: {
        lastStatus,
        lastCheckedAt: new Date(),
      },
    });

    if (!result.success) {
      await this.activityLogService.logAction({
        action: 'ROUTER_CONNECTION_FAILED',
        serverId: id,
        entity: 'MikrotikServer',
        entityId: id,
        detail: `Test koneksi gagal: ${result.error}`,
      });
    }

    return {
      serverId: id,
      success: result.success,
      latency: result.latency,
      error: result.error,
      lastStatus,
    };
  }

  async testCustomConnection(testConnectionDto: TestConnectionDto) {
    const { host, port, username, password, useSSL } = testConnectionDto;
    const defaultPort = port || (useSSL ? 443 : 80);

    const result = await this.mikrotikService.testConnection(
      host,
      defaultPort,
      username,
      password,
      useSSL ?? false,
    );

    return {
      success: result.success,
      latency: result.latency,
      error: result.error,
    };
  }
}
