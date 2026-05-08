/**
 * Data Migration: Bot-Channel-Knowledge Binding
 *
 * Script gán dữ liệu hiện tại theo kiến trúc mới:
 * - Bot đầu tiên của mỗi tenant → isDefault = true
 * - Tất cả channels của tenant → agentId = defaultBot.id
 * - Tất cả knowledge của tenant → AgentKnowledge link tới defaultBot
 *
 * Chạy: npx ts-node prisma/migrations/seed-bot-channel-binding.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Starting Bot-Channel-Knowledge binding migration...\n');

  const tenants = await prisma.tenant.findMany({
    include: {
      agents: { orderBy: { createdAt: 'asc' } },
      channelConnections: true,
      knowledgeDocuments: true,
    },
  });

  console.log(`Found ${tenants.length} tenant(s) to process.\n`);

  for (const tenant of tenants) {
    console.log(`--- Tenant: "${tenant.name}" (${tenant.id}) ---`);

    // Step 1: Xác định hoặc tạo bot mặc định
    let defaultBot = tenant.agents[0];

    if (!defaultBot) {
      console.log('  ⚠️  No agents found. Creating default bot...');
      defaultBot = await prisma.agent.create({
        data: {
          tenantId: tenant.id,
          name: 'Bot Mặc Định',
          persona:
            'Bạn là một nhân viên tư vấn bán hàng chuyên nghiệp. Trả lời ngắn gọn, thân thiện, và nhiệt tình bằng tiếng Việt.',
          greeting: 'Xin chào! Tôi có thể giúp gì cho bạn?',
          isActive: true,
          isDefault: true,
        },
      });
      console.log(`  ✅ Created default bot: "${defaultBot.name}"`);
    } else {
      await prisma.agent.update({
        where: { id: defaultBot.id },
        data: { isDefault: true },
      });
      console.log(
        `  ✅ Set isDefault=true for: "${defaultBot.name}" (${defaultBot.id})`,
      );
    }

    // Step 2: Gán tất cả channels cho bot mặc định
    const channelCount = tenant.channelConnections.length;
    if (channelCount > 0) {
      await prisma.channelConnection.updateMany({
        where: { tenantId: tenant.id },
        data: { agentId: defaultBot.id },
      });
      console.log(`  ✅ Assigned ${channelCount} channel(s) to default bot`);
    } else {
      console.log('  ℹ️  No channels to assign');
    }

    // Step 3: Tạo AgentKnowledge links cho bot mặc định
    const knowledgeDocs = tenant.knowledgeDocuments;
    if (knowledgeDocs.length > 0) {
      const agentKnowledgeData = knowledgeDocs.map((doc) => ({
        agentId: defaultBot.id,
        knowledgeId: doc.id,
      }));

      // skipDuplicates để chạy lại an toàn (idempotent)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await prisma.agentKnowledge.createMany({
        data: agentKnowledgeData,
        skipDuplicates: true,
      });
      console.log(
        `  ✅ Linked ${knowledgeDocs.length} knowledge doc(s) to default bot`,
      );
    } else {
      console.log('  ℹ️  No knowledge documents to link');
    }

    console.log('');
  }

  console.log('🎉 Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
