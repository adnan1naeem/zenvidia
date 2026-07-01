import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/enums/user-role.enum';

export interface FindOrCreateUserParams {
  phone: string;
  email?: string | null;
  name?: string | null;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findOrCreateByPhone(params: FindOrCreateUserParams): Promise<User> {
    const existing = await this.findByPhone(params.phone);
    if (existing) {
      let dirty = false;
      if (params.email && !existing.email) {
        existing.email = params.email;
        dirty = true;
      }
      if (params.name && !existing.name) {
        existing.name = params.name;
        dirty = true;
      }
      if (dirty) {
        return this.usersRepo.save(existing);
      }
      return existing;
    }

    const user = this.usersRepo.create({
      phone: params.phone,
      email: params.email ?? null,
      name: params.name ?? null,
      role: params.role ?? UserRole.Customer,
      passwordHash: null,
    });

    const saved = await this.usersRepo.save(user);
    this.logger.log(`Created customer user for ***${params.phone.slice(-4)}`);
    return saved;
  }

  async createStaffUser(params: {
    email: string;
    phone: string;
    password: string;
    role: UserRole.Admin | UserRole.Manager;
    name?: string;
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(params.password, 12);
    const user = this.usersRepo.create({
      email: params.email,
      phone: params.phone,
      passwordHash,
      role: params.role,
      name: params.name ?? null,
    });
    return this.usersRepo.save(user);
  }
}
