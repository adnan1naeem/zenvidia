import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { ServiceId } from '../../../database/enums/service-id.enum';

export class ConfirmBookingDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;

  @IsEnum(ServiceId)
  serviceId: ServiceId;

  @IsOptional()
  @IsEmail()
  email?: string;
}
