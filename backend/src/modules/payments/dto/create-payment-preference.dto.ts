import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentPreferenceDto {
  @ApiProperty({ description: 'Appointment ID to create payment for' })
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  @ApiPropertyOptional({ enum: ['card', 'pix'], default: 'card' })
  @IsOptional()
  @IsIn(['card', 'pix'])
  paymentMethod?: 'card' | 'pix';
}
