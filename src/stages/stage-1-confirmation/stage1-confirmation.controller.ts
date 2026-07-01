import { Body, Controller, Post } from '@nestjs/common';
import { ConfirmBookingDto } from './dto/confirm-booking.dto';
import { Stage1ConfirmationService } from './stage1-confirmation.service';

@Controller('booking')
export class Stage1ConfirmationController {
  constructor(private readonly stage1: Stage1ConfirmationService) {}

  @Post('confirm')
  confirm(@Body() dto: ConfirmBookingDto) {
    return this.stage1.confirm(dto);
  }
}
