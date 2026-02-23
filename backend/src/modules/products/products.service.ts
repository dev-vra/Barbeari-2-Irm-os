import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSaleDto } from './dto/product-sale.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto as any });
  }

  async findAll(includeInactive = false) {
    return this.prisma.product.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produto nao encontrado');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Produto nao encontrado');
    return this.prisma.product.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.prisma.product.update({ where: { id }, data: { isActive: false } });
    return { message: 'Produto desativado' };
  }

  async recordSale(productId: string, dto: ProductSaleDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produto nao encontrado');
    if (product.stock < dto.quantity) throw new BadRequestException('Estoque insuficiente');

    const unitPrice = Number(product.salePrice);
    const totalPrice = unitPrice * dto.quantity;
    const commissionAmount = totalPrice * (Number(product.commissionPct) / 100);

    const [sale] = await this.prisma.([
      this.prisma.productSale.create({
        data: {
          clientId: dto.clientId,
          professionalId: dto.professionalId,
          productId,
          quantity: dto.quantity,
          unitPrice,
          totalPrice,
        },
      }),
      this.prisma.product.update({
        where: { id: productId },
        data: { stock: { decrement: dto.quantity } },
      }),
    ]);

    if (commissionAmount > 0) {
      await this.prisma.commission.create({
        data: {
          professionalId: dto.professionalId,
          type: 'PRODUCT',
          productSaleId: sale.id,
          amount: commissionAmount,
        },
      });
    }

    return sale;
  }
}
