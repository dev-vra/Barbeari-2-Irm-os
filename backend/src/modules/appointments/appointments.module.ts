import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { SlotCalculatorService } from './slot-calculator.service';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, SlotCalculatorService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
