import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Appointment } from '../database/entities/appointment.entity';
import {
  ACTIVE_APPOINTMENT_STATUSES,
  AppointmentStatus,
} from '../database/enums/appointment-status.enum';

export interface CreateAppointmentParams {
  userId: string;
  productUuid: string;
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepo: Repository<Appointment>,
  ) {}

  async findById(id: string): Promise<Appointment | null> {
    return this.appointmentsRepo.findOne({
      where: { id },
      relations: { product: true, user: true },
    });
  }

  async findActiveForUserAndProduct(
    userId: string,
    productUuid: string,
  ): Promise<Appointment | null> {
    return this.appointmentsRepo.findOne({
      where: {
        user: { id: userId },
        product: { id: productUuid },
        status: In(ACTIVE_APPOINTMENT_STATUSES),
      },
      relations: { product: true, user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async create(params: CreateAppointmentParams): Promise<Appointment> {
    const appointment = this.appointmentsRepo.create({
      user: { id: params.userId },
      product: { id: params.productUuid },
      status: AppointmentStatus.Pending,
    });
    const saved = await this.appointmentsRepo.save(appointment);
    const loaded = await this.findById(saved.id);
    if (!loaded) {
      throw new NotFoundException(`Appointment not found: ${saved.id}`);
    }
    this.logger.log('Appointment created', {
      appointmentId: loaded.id,
      productUuid: params.productUuid,
      status: AppointmentStatus.Pending,
    });
    return loaded;
  }

  async updateStatus(
    appointmentId: string,
    status: AppointmentStatus,
  ): Promise<Appointment> {
    const appointment = await this.requireById(appointmentId);
    appointment.status = status;
    return this.appointmentsRepo.save(appointment);
  }

  async expireActiveForUser(userId: string): Promise<number> {
    const result = await this.appointmentsRepo.update(
      {
        user: { id: userId },
        status: In(ACTIVE_APPOINTMENT_STATUSES),
      },
      { status: AppointmentStatus.Expired },
    );
    return result.affected ?? 0;
  }

  private async requireById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepo.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException(`Appointment not found: ${id}`);
    }
    return appointment;
  }
}
