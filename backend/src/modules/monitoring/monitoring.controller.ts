import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MonitoringService } from './monitoring.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Monitoring')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('snapshot/:serverId')
  @ApiOperation({
    summary:
      'Snapshot monitoring (active users + resource + traffic) dalam SATU koneksi',
    description:
      'Optimasi beban router: 1 login + 3 perintah, menggantikan 3 endpoint terpisah. Dipakai auto-refresh dashboard.',
  })
  @ApiResponse({ status: 200, description: 'Snapshot monitoring berhasil diambil.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Router tidak ditemukan.' })
  async getSnapshot(@Param('serverId') serverId: string) {
    return this.monitoringService.getSnapshot(serverId);
  }

  @Get('active/:serverId')
  @ApiOperation({
    summary:
      'Mendapatkan daftar sesi pengguna hotspot aktif di router secara real-time',
    description:
      'Menarik data langsung dari MikroTik untuk memantau siapa saja yang sedang menggunakan WiFi.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar user aktif berhasil diambil secara real-time.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Router tidak ditemukan.' })
  async getActiveUsers(@Param('serverId') serverId: string) {
    return this.monitoringService.getActiveUsers(serverId);
  }

  @Get('resources/:serverId')
  @ApiOperation({
    summary:
      'Mendapatkan data statistik performa hardware (CPU, RAM, HDD, Uptime) router',
    description:
      'Mengambil data performa CPU Load, Memori RAM, dan kapasitas penyimpanan harddisk langsung dari CHR.',
  })
  @ApiResponse({
    status: 200,
    description: 'Data statistik hardware berhasil diambil secara real-time.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Router tidak ditemukan.' })
  async getRouterResources(@Param('serverId') serverId: string) {
    return this.monitoringService.getRouterResources(serverId);
  }

  @Get('traffic/:serverId')
  @ApiOperation({
    summary:
      'Mendapatkan data statistik traffic (RX/TX bytes) dari seluruh interface router',
    description:
      'Mengambil data jumlah data masuk dan keluar pada masing-masing interface / outlet secara real-time dari CHR.',
  })
  @ApiResponse({
    status: 200,
    description: 'Data statistik traffic berhasil diambil secara real-time.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Router tidak ditemukan.' })
  async getRouterTraffic(@Param('serverId') serverId: string) {
    return this.monitoringService.getRouterTraffic(serverId);
  }
}
