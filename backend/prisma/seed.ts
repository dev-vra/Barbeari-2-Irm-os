import { PrismaClient, Role, ProductType, AppointmentStatus, PaymentMethod, PaymentStatus, CommissionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

// Standard PrismaClient — reads URL from prisma.config.ts (no adapter needed in Node.js)
const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function toDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

/** Returns YYYY-MM-DD strings for Mon–Sat days in [start, end] range */
function workingDays(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  while (cur <= end) {
    const dow = cur.getDay(); // 0=Sun, 6=Sat
    if (dow !== 0) {
      days.push(cur.toISOString().split('T')[0]);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

const MORNING_SLOTS_30 = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const AFTERNOON_SLOTS_30 = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
const SLOTS_30 = [...MORNING_SLOTS_30, ...AFTERNOON_SLOTS_30];

const SLOTS_60 = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

function slotsFor(durationMin: number): string[] {
  if (durationMin <= 30) return SLOTS_30;
  return SLOTS_60;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Barbearia 2 Irmãos...\n');

  // ── Guard: skip if already seeded ────────────────────────────────────────
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@barbearia2irmaos.com' },
  });
  if (existing) {
    console.log('⏭️  Banco já possui dados (admin encontrado). Seed ignorado.\n');
    return;
  }

  // ── Admin ────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@barbearia2irmaos.com' },
    update: {},
    create: {
      name: 'Admin Barbearia',
      cpf: '00000000001',
      email: 'admin@barbearia2irmaos.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: Role.ADMIN,
      phone: '65981143182',
    },
  });
  console.log(`✅ Admin: ${admin.email} / admin123`);

  // ── Services ─────────────────────────────────────────────────────────────
  const servicesData = [
    { id: 'svc-corte', name: 'Corte Masculino', description: 'Corte clássico ou moderno na tesoura e máquina', durationMin: 30, price: 50.0 },
    { id: 'svc-barba', name: 'Barba Completa', description: 'Modelagem e aparação da barba com navalha', durationMin: 30, price: 40.0 },
    { id: 'svc-combo', name: 'Corte + Barba', description: 'Combo completo com corte e barba', durationMin: 60, price: 80.0 },
    { id: 'svc-pigm', name: 'Pigmentação', description: 'Pigmentação capilar para disfarçar falhas', durationMin: 60, price: 90.0 },
    { id: 'svc-hidrat', name: 'Hidratação Capilar', description: 'Tratamento hidratante para cabelo e barba', durationMin: 45, price: 60.0 },
  ];

  const services = await Promise.all(
    servicesData.map(s =>
      prisma.service.upsert({
        where: { id: s.id },
        update: { name: s.name, description: s.description, durationMin: s.durationMin, price: s.price },
        create: s,
      }),
    ),
  );
  console.log(`✅ ${services.length} services`);

  // ── Professionals ─────────────────────────────────────────────────────────
  const weekdays = [1, 2, 3, 4, 5, 6];

  const gabriel = await prisma.professional.upsert({
    where: { id: 'prof-gabriel' },
    update: { name: 'Gabriel Souza', description: 'Sócio fundador. Especialista em cortes clássicos e modernos com 12 anos de experiência.' },
    create: {
      id: 'prof-gabriel',
      name: 'Gabriel Souza',
      description: 'Sócio fundador. Especialista em cortes clássicos e modernos com 12 anos de experiência.',
      serviceCommissionPct: 50,
      productCommissionPct: 20,
      schedules: {
        create: weekdays.map(d => ({ dayOfWeek: d, startTime: '08:00', endTime: '20:00' })),
      },
    },
  });

  const rafael = await prisma.professional.upsert({
    where: { id: 'prof-rafael' },
    update: { name: 'Rafael Souza', description: 'Sócio. Especialista em barba, degradê e pigmentação. Referência em estilo urbano.' },
    create: {
      id: 'prof-rafael',
      name: 'Rafael Souza',
      description: 'Sócio. Especialista em barba, degradê e pigmentação. Referência em estilo urbano.',
      serviceCommissionPct: 45,
      productCommissionPct: 15,
      schedules: {
        create: weekdays.map(d => ({ dayOfWeek: d, startTime: '09:00', endTime: '19:00' })),
      },
    },
  });

  const eduardo = await prisma.professional.upsert({
    where: { id: 'prof-eduardo' },
    update: { name: 'Eduardo Lima', description: 'Barbeiro com talento para cortes criativos e tratamentos capilares.' },
    create: {
      id: 'prof-eduardo',
      name: 'Eduardo Lima',
      description: 'Barbeiro com talento para cortes criativos e tratamentos capilares.',
      serviceCommissionPct: 40,
      productCommissionPct: 15,
      schedules: {
        create: weekdays.map(d => ({ dayOfWeek: d, startTime: '08:00', endTime: '18:00' })),
      },
    },
  });

  const allProfs = [gabriel, rafael, eduardo];
  console.log(`✅ ${allProfs.length} professionals`);

  // ── Professional <-> Service ──────────────────────────────────────────────
  for (const prof of allProfs) {
    for (const svc of services) {
      await prisma.professionalService.upsert({
        where: { professionalId_serviceId: { professionalId: prof.id, serviceId: svc.id } },
        update: {},
        create: { professionalId: prof.id, serviceId: svc.id, commissionPct: prof.serviceCommissionPct },
      });
    }
  }
  console.log('✅ Professional services assigned');

  // ── Products ─────────────────────────────────────────────────────────────
  const productsData = [
    // Retail
    { id: 'prod-pomada', name: 'Pomada Modeladora', type: ProductType.HAIRCARE, description: 'Fixação forte para modelagem do cabelo', stock: 20, cost: 15.0, salePrice: 45.0, commissionPct: 20, supplier: 'Barber Cosméticos' },
    { id: 'prod-oleo', name: 'Óleo para Barba', type: ProductType.BARBERING, description: 'Óleo nutritivo para hidratar e amaciar a barba', stock: 15, cost: 20.0, salePrice: 50.0, commissionPct: 20, supplier: 'Barber Cosméticos' },
    { id: 'prod-shampoo', name: 'Shampoo Masculino', type: ProductType.HAIRCARE, description: 'Shampoo específico para cabelos masculinos', stock: 25, cost: 12.0, salePrice: 35.0, commissionPct: 15, supplier: 'Barber Cosméticos' },
    // Beverages
    { id: 'prod-cerveja', name: 'Cerveja Gelada', type: ProductType.BEVERAGE, description: 'Cerveja long neck gelada', stock: 100, cost: 4.0, salePrice: 8.0, commissionPct: 0, supplier: 'Distribuidora Local' },
    { id: 'prod-cafe', name: 'Café Expresso', type: ProductType.BEVERAGE, description: 'Café expresso preparado na hora', stock: 200, cost: 1.5, salePrice: 5.0, commissionPct: 0, supplier: '' },
    { id: 'prod-refri', name: 'Refrigerante Lata', type: ProductType.BEVERAGE, description: 'Refrigerante gelado 350ml', stock: 80, cost: 2.5, salePrice: 6.0, commissionPct: 0, supplier: 'Distribuidora Local' },
    { id: 'prod-agua', name: 'Água Mineral', type: ProductType.BEVERAGE, description: 'Água mineral gelada 500ml', stock: 150, cost: 1.0, salePrice: 4.0, commissionPct: 0, supplier: '' },
    { id: 'prod-suco', name: 'Suco Natural', type: ProductType.BEVERAGE, description: 'Suco de fruta natural', stock: 50, cost: 4.0, salePrice: 9.0, commissionPct: 0, supplier: '' },
  ];

  const products = await Promise.all(
    productsData.map(p =>
      prisma.product.upsert({
        where: { id: p.id },
        update: { stock: p.stock, salePrice: p.salePrice },
        create: p,
      }),
    ),
  );
  console.log(`✅ ${products.length} products (retail + beverages)`);

  // ── Clients ───────────────────────────────────────────────────────────────
  const clientsData = [
    { name: 'João Silva', cpf: '70987654321', email: 'joao.silva@email.com', phone: '65991234567', birthdate: new Date('1990-05-15') },
    { name: 'Carlos Oliveira', cpf: '11144477735', email: 'carlos.oliveira@email.com', phone: '65992345678', birthdate: new Date('1985-08-22') },
    { name: 'Pedro Alves', cpf: '93123213200', email: 'pedro.alves@email.com', phone: '65993456789', birthdate: new Date('1995-03-10') },
    { name: 'Lucas Rocha', cpf: '14209527747', email: 'lucas.rocha@email.com', phone: '65994567890', birthdate: new Date('1992-11-28') },
    { name: 'Marcos Nascimento', cpf: '11387985795', email: 'marcos.nasc@email.com', phone: '65995678901', birthdate: new Date('1988-07-03') },
    { name: 'Rodrigo Martins', cpf: '89274321700', email: 'rodrigo.martins@email.com', phone: '65996789012', birthdate: new Date('1993-01-17') },
    { name: 'Felipe Santos', cpf: '32154698710', email: 'felipe.santos@email.com', phone: '65997890123', birthdate: new Date('1998-09-05') },
    { name: 'André Costa', cpf: '54654521389', email: 'andre.costa@email.com', phone: '65998901234', birthdate: new Date('1987-12-30') },
    { name: 'Bruno Ferreira', cpf: '27847738804', email: 'bruno.ferreira@email.com', phone: '65999012345', birthdate: new Date('1994-04-19') },
    { name: 'Thiago Pereira', cpf: '53371327605', email: 'thiago.pereira@email.com', phone: '65991123456', birthdate: new Date('1991-06-08') },
    { name: 'Rafael Lima', cpf: '74279265209', email: 'rafael.lima@email.com', phone: '65992234567', birthdate: new Date('1996-02-14') },
    { name: 'Daniel Souza', cpf: '91686746010', email: 'daniel.souza@email.com', phone: '65993345678', birthdate: new Date('1989-10-25') },
  ];

  const clientHash = await bcrypt.hash('cliente123', 10);
  const clients = await Promise.all(
    clientsData.map(c =>
      prisma.user.upsert({
        where: { email: c.email },
        update: {},
        create: {
          name: c.name,
          cpf: c.cpf,
          email: c.email,
          passwordHash: clientHash,
          role: Role.CLIENT,
          phone: c.phone,
          birthdate: c.birthdate,
        },
      }),
    ),
  );
  console.log(`✅ ${clients.length} clients`);

  // ── Appointments ──────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pastStart = new Date(today);
  pastStart.setDate(today.getDate() - 21);

  const pastEnd = new Date(today);
  pastEnd.setDate(today.getDate() - 1);

  const futureStart = new Date(today);
  futureStart.setDate(today.getDate() + 1);

  const futureEnd = new Date(today);
  futureEnd.setDate(today.getDate() + 14);

  const pastDays = workingDays(pastStart, pastEnd);
  const futureDays = workingDays(futureStart, futureEnd);

  console.log(`\n📅 Generating appointments...`);
  console.log(`   Past days: ${pastDays.length} | Future days: ${futureDays.length}`);

  let apptCount = 0;
  let saleCount = 0;

  const retailProducts = products.filter(p => p.type !== ProductType.BEVERAGE);
  const beverageProducts = products.filter(p => p.type === ProductType.BEVERAGE);

  // ── Past appointments ─────────────────────────────────────────────────────
  for (const day of pastDays) {
    for (const prof of allProfs) {
      // Pick 2-4 services (non-overlapping slots)
      const dayServices = pickN(services, pick([2, 3, 3, 4]));
      const usedSlots = new Set<string>();

      for (const svc of dayServices) {
        const availableSlots = slotsFor(svc.durationMin).filter(s => !usedSlots.has(s));
        if (availableSlots.length === 0) continue;

        const slot = pick(availableSlots);
        usedSlots.add(slot);

        const scheduledAt = toDateTime(day, slot);
        const endsAt = new Date(scheduledAt.getTime() + svc.durationMin * 60000);
        const client = pick(clients);

        // Status distribution: 78% COMPLETED, 12% CANCELLED, 10% NO_SHOW
        const rand = Math.random();
        let status: AppointmentStatus;
        if (rand < 0.78) status = AppointmentStatus.COMPLETED;
        else if (rand < 0.90) status = AppointmentStatus.CANCELLED;
        else status = AppointmentStatus.NO_SHOW;

        const appt = await prisma.appointment.create({
          data: {
            clientId: client.id,
            professionalId: prof.id,
            serviceId: svc.id,
            scheduledAt,
            endsAt,
            status,
          },
        });
        apptCount++;

        // Payment for COMPLETED
        if (status === AppointmentStatus.COMPLETED) {
          const method = pick([PaymentMethod.CASH, PaymentMethod.PIX, PaymentMethod.DEBIT_CARD]);
          await prisma.payment.create({
            data: {
              appointmentId: appt.id,
              amount: svc.price,
              method,
              status: PaymentStatus.APPROVED,
              expiresAt: new Date(scheduledAt.getTime() + 24 * 60 * 60000),
              paidAt: scheduledAt,
            },
          });

          // Commission for professional
          await prisma.commission.create({
            data: {
              professionalId: prof.id,
              type: CommissionType.SERVICE,
              appointmentId: appt.id,
              amount: Number(svc.price) * Number(prof.serviceCommissionPct) / 100,
            },
          });

          // 40% chance of retail product sale
          if (Math.random() < 0.4 && retailProducts.length > 0) {
            const prod = pick(retailProducts);
            const qty = pick([1, 1, 2]);
            const totalPrice = Number(prod.salePrice) * qty;

            const sale = await prisma.productSale.create({
              data: {
                clientId: client.id,
                professionalId: prof.id,
                productId: prod.id,
                quantity: qty,
                unitPrice: prod.salePrice,
                totalPrice,
                soldAt: scheduledAt,
              },
            });
            saleCount++;

            if (Number(prod.commissionPct) > 0) {
              await prisma.commission.create({
                data: {
                  professionalId: prof.id,
                  type: CommissionType.PRODUCT,
                  productSaleId: sale.id,
                  amount: totalPrice * Number(prod.commissionPct) / 100,
                },
              });
            }
          }

          // 35% chance of beverage sale
          if (Math.random() < 0.35 && beverageProducts.length > 0) {
            const bev = pick(beverageProducts);
            const qty = pick([1, 1, 2]);
            await prisma.productSale.create({
              data: {
                clientId: client.id,
                professionalId: prof.id,
                productId: bev.id,
                quantity: qty,
                unitPrice: bev.salePrice,
                totalPrice: Number(bev.salePrice) * qty,
                soldAt: scheduledAt,
              },
            });
            saleCount++;
          }
        }
      }
    }
  }

  // ── Future appointments ───────────────────────────────────────────────────
  for (const day of futureDays) {
    for (const prof of allProfs) {
      const dayServices = pickN(services, pick([2, 2, 3]));
      const usedSlots = new Set<string>();

      for (const svc of dayServices) {
        const availableSlots = slotsFor(svc.durationMin).filter(s => !usedSlots.has(s));
        if (availableSlots.length === 0) continue;

        const slot = pick(availableSlots);
        usedSlots.add(slot);

        const scheduledAt = toDateTime(day, slot);
        const endsAt = new Date(scheduledAt.getTime() + svc.durationMin * 60000);
        const client = pick(clients);

        await prisma.appointment.create({
          data: {
            clientId: client.id,
            professionalId: prof.id,
            serviceId: svc.id,
            scheduledAt,
            endsAt,
            status: AppointmentStatus.CONFIRMED,
          },
        });
        apptCount++;
      }
    }
  }

  console.log(`✅ ${apptCount} appointments (past + future)`);
  console.log(`✅ ${saleCount} product sales`);

  // ── Demo client (login) ──────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'cliente@exemplo.com' },
    update: {},
    create: {
      name: 'João Silva',
      cpf: '52998224726',
      email: 'cliente@exemplo.com',
      passwordHash: await bcrypt.hash('cliente123', 10),
      role: Role.CLIENT,
      phone: '65991234599',
      birthdate: new Date('1990-05-15'),
    },
  });

  console.log('\n✅ Seed completed!\n');
  console.log('─'.repeat(50));
  console.log('🔑 Admin:  admin@barbearia2irmaos.com / admin123');
  console.log('🔑 Client: cliente@exemplo.com / cliente123');
  console.log('─'.repeat(50));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
