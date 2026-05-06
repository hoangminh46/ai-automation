/**
 * Seed 4 default plans (idempotent — upsert by slug).
 *
 * Usage: npx ts-node --esm prisma/seed-plans.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PLANS = [
  {
    slug: 'free',
    name: 'Miễn phí',
    price: 0,
    maxAiResponses: 50,
    maxBots: 1,
    maxTeamMembers: 1,
    maxKnowledgeFiles: 3,
    maxKnowledgeSizeMb: 5,
    hasBrandingWatermark: true,
    displayOrder: 1,
  },
  {
    slug: 'basic',
    name: 'Cơ bản',
    price: 299000,
    maxAiResponses: 3000,
    maxBots: 3,
    maxTeamMembers: 3,
    maxKnowledgeFiles: 10,
    maxKnowledgeSizeMb: 30,
    hasBrandingWatermark: false,
    displayOrder: 2,
  },
  {
    slug: 'standard',
    name: 'Tiêu chuẩn',
    price: 599000,
    maxAiResponses: 8000,
    maxBots: 5,
    maxTeamMembers: 10,
    maxKnowledgeFiles: 30,
    maxKnowledgeSizeMb: 100,
    hasBrandingWatermark: false,
    displayOrder: 3,
  },
  {
    slug: 'premium',
    name: 'Cao cấp',
    price: 1199000,
    maxAiResponses: 20000,
    maxBots: 10,
    maxTeamMembers: -1,
    maxKnowledgeFiles: 100,
    maxKnowledgeSizeMb: 500,
    hasBrandingWatermark: false,
    displayOrder: 4,
  },
] as const;

async function main() {
  console.log('🌱 Seeding plans...');

  for (const plan of PLANS) {
    const result = await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        price: plan.price,
        maxAiResponses: plan.maxAiResponses,
        maxBots: plan.maxBots,
        maxTeamMembers: plan.maxTeamMembers,
        maxKnowledgeFiles: plan.maxKnowledgeFiles,
        maxKnowledgeSizeMb: plan.maxKnowledgeSizeMb,
        hasBrandingWatermark: plan.hasBrandingWatermark,
        displayOrder: plan.displayOrder,
      },
      create: plan,
    });
    const priceLabel =
      result.price === 0 ? 'Free' : `${result.price.toLocaleString()}đ/tháng`;
    console.log(`  ✅ ${result.slug} (${result.name}) — ${priceLabel}`);
  }

  console.log(`\n🎉 Done! ${PLANS.length} plans seeded.`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
