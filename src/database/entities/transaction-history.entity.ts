import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { User } from './user.entity';

@Entity('transaction_history')
export class TransactionHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'stripe_event_id', type: 'text', unique: true })
  stripeEventId!: string;

  @Column({ name: 'stripe_payment_intent_id', type: 'text', nullable: true })
  stripePaymentIntentId!: string | null;

  @Column({ name: 'stripe_checkout_session_id', type: 'text', nullable: true })
  stripeCheckoutSessionId!: string | null;

  @Column({ name: 'stripe_customer_id', type: 'text', nullable: true })
  stripeCustomerId!: string | null;

  @Column({ name: 'stripe_charge_id', type: 'text', nullable: true })
  stripeChargeId!: string | null;

  @Column({ type: 'integer', nullable: true })
  amount!: number | null;

  @Column({ type: 'varchar', length: 3, nullable: true })
  currency!: string | null;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId!: string | null;

  @ManyToOne(() => Appointment, (appointment) => appointment.transactions, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment!: Appointment | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ type: 'text', nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  phone!: string | null;

  @Column({ name: 'payment_status', type: 'text', nullable: true })
  paymentStatus!: string | null;

  @Column({ name: 'webhook_event_type', type: 'text' })
  webhookEventType!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
