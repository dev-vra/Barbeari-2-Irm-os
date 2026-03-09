import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AssignServiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  commissionPct?: number;
}
