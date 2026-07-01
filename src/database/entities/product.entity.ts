import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryId } from '../enums/category-id.enum';
import { ServiceId } from '../enums/service-id.enum';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'service_id',
    type: 'enum',
    enum: ServiceId,
    enumName: 'service_id',
    unique: true,
  })
  serviceId!: ServiceId;

  @Column({
    name: 'category_id',
    type: 'enum',
    enum: CategoryId,
    enumName: 'category_id',
  })
  categoryId!: CategoryId;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'price_cents', type: 'integer' })
  priceCents!: number;

  @Column({ name: 'deposit_cents', type: 'integer' })
  depositCents!: number;

  @Column({ name: 'duration_minutes', type: 'integer' })
  durationMinutes!: number;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ type: 'varchar', length: 3, default: 'usd' })
  currency!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
