import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { isCpfIdentifier } from '../../common/utils/cpf.util';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(identifier: string, password: string) {
    const isCpf = isCpfIdentifier(identifier);

    const user = await this.prisma.user.findFirst({
      where: isCpf
        ? { cpf: identifier.replace(/\D/g, '') }
        : { email: identifier.toLowerCase() },
    });

    if (!user || !user.isActive) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
    });

    const refreshTokenValue = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    await this.prisma.refreshToken.create({
      data: {
        token: await bcrypt.hash(refreshTokenValue, 10),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken: refreshTokenValue, user };
  }

  async register(dto: RegisterDto) {
    const cpfClean = dto.cpf.replace(/\D/g, '');

    const emailExists = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (emailExists) throw new ConflictException('E-mail já cadastrado');

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
        role: 'CLIENT',
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    return this.login(safeUser);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const cpfClean = dto.cpf.replace(/\D/g, '');

    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        cpf: cpfClean,
        isActive: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Dados não conferem. Verifique e-mail, CPF e data de nascimento.');
    }

    // Validate birthdate
    if (!user.birthdate) {
      throw new BadRequestException('Não há data de nascimento cadastrada para esta conta. Entre em contato com a barbearia.');
    }

    const provided = new Date(dto.birthdate);
    const stored = new Date(user.birthdate);

    const sameDate =
      provided.getUTCFullYear() === stored.getUTCFullYear() &&
      provided.getUTCMonth() === stored.getUTCMonth() &&
      provided.getUTCDate() === stored.getUTCDate();

    if (!sameDate) {
      throw new BadRequestException('Dados não conferem. Verifique e-mail, CPF e data de nascimento.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      // Revoke all existing refresh tokens for security
      this.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return { message: 'Senha redefinida com sucesso. Faça login com a nova senha.' };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
    });

    let matched: any = null;
    for (const t of tokens) {
      if (await bcrypt.compare(refreshToken, t.token)) {
        matched = t;
        break;
      }
    }

    if (!matched) throw new UnauthorizedException('Token inválido');

    await this.prisma.refreshToken.delete({ where: { id: matched.id } });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const { passwordHash, ...safeUser } = user;
    return this.login(safeUser);
  }

  async revokeAllTokens(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
