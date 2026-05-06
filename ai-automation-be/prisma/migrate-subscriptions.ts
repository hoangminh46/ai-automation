/**
 * Migrate existing sellers → Free plan subscription (idempotent).
 * Only creates subscriptions for sellers that don't have one yet.
 *
 * Usage: npx ts-node --esm prisma/migrate-subscriptions.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Migrating existing sellers to Free plan...');

  // Step 1: Tìm Free plan
  const freePlan = await prisma.plan.findUnique({
    where: { slug: 'free' },
  });
  if (!freePlan) {
    throw new Error('Free plan not found. Run seed-plans.ts first!');
  }

  // Step 2: Tìm sellers chưa có subscription
  const sellersWithoutSub = await prisma.seller.findMany({
    where: {
      subscription: null,
    },
    select: { id: true, email: true },
  });

  if (sellersWithoutSub.length === 0) {
    console.log('  ℹ️  All sellers already have subscriptions. Nothing to do.');
    return;
  }

  console.log(
    `  📋 Found ${sellersWithoutSub.length} sellers without subscription.`,
  );

  // Step 3: Tạo Free subscription cho mỗi seller (batch)
  let created = 0;
  for (const seller of sellersWithoutSub) {
    await prisma.sellerSubscription.create({
      data: {
        sellerId: seller.id,
        planId: freePlan.id,
        billingPeriod: 'MONTHLY',
        status: 'ACTIVE',
        aiResponsesUsed: 0,
        bonusResponsesRemaining: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
      },
    });
    created++;
    console.log(`  ✅ ${seller.email} → Free plan`);
  }

  console.log(`\n🎉 Done! ${created} sellers migrated to Free plan.`);
}

main()
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
