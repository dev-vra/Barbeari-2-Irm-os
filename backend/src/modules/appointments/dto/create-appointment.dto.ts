import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  professionalId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiProperty({ description: 'Time slot start in HH:MM format' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'slotStart must be HH:MM' })
  slotStart: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  /** Admin only: override the client to book for */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;
}
