import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as any } : {},
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        birthdate: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        birthdate: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(dto: CreateUserDto) {
    const emailExists = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (emailExists) throw new ConflictException('E-mail já cadastrado');

    const cpfClean = dto.cpf.replace(/\D/g, '');
    const cpfExists = await this.prisma.user.findUnique({
      where: { cpf: cpfClean },
    });
    if (cpfExists) throw new ConflictException('CPF já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        cpf: cpfClean,
        passwordHash,
        phone: dto.phone,
        birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined,
        role: dto.role ?? 'CLIENT',
      },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const conflict = await this.prisma.user.findFirst({
        where: { email: dto.email.toLowerCase(), NOT: { id } },
      });
      if (conflict) throw new ConflictException('E-mail já cadastrado');
    }

    if (dto.cpf) {
      const cpfClean = dto.cpf.replace(/\D/g, '');
      const conflict = await this.prisma.user.findFirst({
        where: { cpf: cpfClean, NOT: { id } },
      });
      if (conflict) throw new ConflictException('CPF já cadastrado');
      dto.cpf = cpfClean;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email?.toLowerCase(),
        cpf: dto.cpf,
        phone: dto.phone,
        birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined,
      },
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Usuário desativado' };
  }

  async updateMe(id: string, dto: UpdateUserDto) {
    return this.update(id, dto);
  }
}
