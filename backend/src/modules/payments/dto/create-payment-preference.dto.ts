import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentPreferenceDto {
  @ApiProperty({ description: 'Appointment ID to create payment for' })
  @IsString()
  @IsNotEmpty()
  appointmentId: string;
}
