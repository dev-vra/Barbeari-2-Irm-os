import { PrismaClient, Role, ProductType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // ── Admin user ──────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@barbeariadogustavo.com' },
    update: {},
    create: {
      name: 'Gustavo',
      cpf: '00000000000',
      email: 'admin@barbeariadogustavo.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: Role.ADMIN,
      phone: '65981143182',
    },
  });
  console.log(`Admin created: ${admin.email}`);

  // ── Demo client ─────────────────────────────────────────────────────────
  const client = await prisma.user.upsert({
    where: { email: 'cliente@exemplo.com' },
    update: {},
    create: {
      name: 'João Silva',
      cpf: '52998224725',
      email: 'cliente@exemplo.com',
      passwordHash: await bcrypt.hash('cliente123', 10),
      role: Role.CLIENT,
      phone: '65991234567',
      birthdate: new Date('1990-05-15'),
    },
  });
  console.log(`Demo client created: ${client.email}`);

  // ── Services ────────────────────────────────────────────────────────────
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 'svc-corte' },
      update: {},
      create: {
        id: 'svc-corte',
        name: 'Corte de Cabelo',
        description: 'Corte masculino clássico ou moderno',
        durationMin: 30,
        price: 45.0,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-barba' },
      update: {},
      create: {
        id: 'svc-barba',
        name: 'Barba',
        description: 'Aparar e modelar a barba com navalha',
        durationMin: 30,
        price: 35.0,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-corte-barba' },
      update: {},
      create: {
        id: 'svc-corte-barba',
        name: 'Corte + Barba',
        description: 'Combo completo corte e barba',
        durationMin: 60,
        price: 70.0,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-pigmentacao' },
      update: {},
      create: {
        id: 'svc-pigmentacao',
        name: 'Pigmentação',
        description: 'Pigmentação capilar para disfarçar falhas',
        durationMin: 60,
        price: 80.0,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-hidratacao' },
      update: {},
      create: {
        id: 'svc-hidratacao',
        name: 'Hidratação',
        description: 'Tratamento hidratante para cabelo e barba',
        durationMin: 45,
        price: 55.0,
      },
    }),
  ]);
  console.log(`${services.length} services created`);

  // ── Professionals ───────────────────────────────────────────────────────
  const weekdays = [1, 2, 3, 4, 5, 6]; // Mon–Sat

  const barber1 = await prisma.professional.upsert({
    where: { id: 'prof-gustavo' },
    update: {},
    create: {
      id: 'prof-gustavo',
      name: 'Gustavo Oliveira',
      description: 'Fundador da barbearia. Especialista em cortes clássicos e modernos com mais de 10 anos de experiência.',
      serviceCommissionPct: 50,
      productCommissionPct: 20,
      schedules: {
        create: weekdays.map((d) => ({
          dayOfWeek: d,
          startTime: '08:00',
          endTime: '20:00',
        })),
      },
    },
  });

  const barber2 = await prisma.professional.upsert({
    where: { id: 'prof-pedro' },
    update: {},
    create: {
      id: 'prof-pedro',
      name: 'Pedro Alves',
      description: 'Especialista em barba e pigmentação. Referência em estilo urbano e degradê.',
      serviceCommissionPct: 45,
      productCommissionPct: 15,
      schedules: {
        create: weekdays.map((d) => ({
          dayOfWeek: d,
          startTime: '08:00',
          endTime: '20:00',
        })),
      },
    },
  });

  const barber3 = await prisma.professional.upsert({
    where: { id: 'prof-lucas' },
    update: {},
    create: {
      id: 'prof-lucas',
      name: 'Lucas Mendes',
      description: 'Jovem barbeiro com talento para cortes criativos e tratamentos capilares.',
      serviceCommissionPct: 40,
      productCommissionPct: 15,
      schedules: {
        create: weekdays.map((d) => ({
          dayOfWeek: d,
          startTime: '09:00',
          endTime: '18:00',
        })),
      },
    },
  });

  console.log('3 professionals created');

  // ── Professional <-> Service assignments ────────────────────────────────
  const allProfessionals = [barber1, barber2, barber3];
  for (const prof of allProfessionals) {
    for (const svc of services) {
      await prisma.professionalService.upsert({
        where: {
          professionalId_serviceId: {
            professionalId: prof.id,
            serviceId: svc.id,
          },
        },
        update: {},
        create: {
          professionalId: prof.id,
          serviceId: svc.id,
          commissionPct: prof.serviceCommissionPct,
        },
      });
    }
  }
  console.log('Professional services assigned');

  // ── Products ────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.product.upsert({
      where: { id: 'prod-pomada' },
      update: {},
      create: {
        id: 'prod-pomada',
        name: 'Pomada Modeladora',
        type: ProductType.HAIRCARE,
        description: 'Pomada de fixação forte para modelagem do cabelo',
        stock: 20,
        cost: 15.0,
        salePrice: 35.0,
        commissionPct: 20,
        supplier: 'Barber Cosméticos',
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-oleo-barba' },
      update: {},
      create: {
        id: 'prod-oleo-barba',
        name: 'Óleo para Barba',
        type: ProductType.BARBERING,
        description: 'Óleo nutritivo para hidratar e amaciar a barba',
        stock: 15,
        cost: 18.0,
        salePrice: 45.0,
        commissionPct: 20,
        supplier: 'Barber Cosméticos',
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-shampoo' },
      update: {},
      create: {
        id: 'prod-shampoo',
        name: 'Shampoo Masculino',
        type: ProductType.HAIRCARE,
        description: 'Shampoo específico para cabelos masculinos',
        stock: 25,
        cost: 12.0,
        salePrice: 30.0,
        commissionPct: 15,
        supplier: 'Barber Cosméticos',
      },
    }),
  ]);
  console.log('Products created');

  console.log('\n✅ Seed completed successfully!');
  console.log('---');
  console.log('Admin login: admin@barbeariadogustavo.com / admin123');
  console.log('Client login: cliente@exemplo.com / cliente123 (CPF: 529.982.247-25)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
