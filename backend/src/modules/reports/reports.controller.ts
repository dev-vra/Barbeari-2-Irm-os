import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  getDashboard(
    @Query('professionalId') professionalId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getAdminDashboard({ professionalId, serviceId, startDate, endDate });
  }

  @Get('sales')
  @ApiOperation({ summary: 'Sales report' })
  async getSales(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();
    return this.reportsService.getSalesData(start, end);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Appointments report' })
  async getAppointments(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('professionalId') professionalId?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();
    return this.reportsService.getAppointmentsData(start, end, professionalId);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Inventory report' })
  getInventory() {
    return this.reportsService.getInventoryData();
  }

  @Get('clients')
  @ApiOperation({ summary: 'Clients report' })
  getClients() {
    return this.reportsService.getClientsData();
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Commissions report' })
  async getCommissions(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('professionalId') professionalId?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();
    return this.reportsService.getCommissionsData(start, end, professionalId);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Cash flow report' })
  async getCashFlow(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();
    return this.reportsService.getCashFlowData(start, end);
  }

  @Get('professionals')
  @ApiOperation({ summary: 'Professionals report' })
  getProfessionals() {
    return this.reportsService.getProfessionalsData();
  }
}
