import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private service: AppointmentsService) {}

  @Get('slots')
  @ApiOperation({ summary: 'Get available slots' })
  getSlots(
    @Query('professionalId') professionalId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    return this.service.getSlots(professionalId, serviceId, date);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my appointments (client)' })
  findMy(@CurrentUser() user: any) {
    return this.service.findMyAppointments(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create appointment' })
  create(@CurrentUser() user: any, @Body() dto: CreateAppointmentDto) {
    // Admin can pass clientId to book for a specific client
    const clientId = user.role === 'ADMIN' && dto.clientId ? dto.clientId : user.id;
    return this.service.create(clientId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List appointments (admin)' })
  findAll(
    @Query('professionalId') professionalId?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findAll({ professionalId, date, status, search, page, limit });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateStatus(id, body.status);
  }
}
