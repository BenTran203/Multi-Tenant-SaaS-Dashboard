import * as cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { generateUniqueServerCode } from '../utils/serverCodeGenerator.js';

const prisma = new PrismaClient();

export async function regenerateExpiredCodes() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const expiredServers = await prisma.server.findMany({
      where: { codeGeneratedAt: { lt: oneHourAgo } },
    });

    console.log(
      `[CRON] Found ${expiredServers.length} servers with expired codes`
    );

    for (const server of expiredServers) {
      const newCode = await generateUniqueServerCode();
      await prisma.server.update({
        where: { id: server.id },
        data: {
          serverCode: newCode,
          codeGeneratedAt: new Date(),
        },
      });
      console.log(
        `[CRON] Regenerated code for server ${server.name}: ${newCode}`
      );
    }
  } catch (error) {
    console.error("[CRON] Error regenerating server codes:", error);
  }
}
export function startServerCodeCron() {
  cron.schedule('0 * * * *', regenerateExpiredCodes);
  console.log('[CRON] Server code regeneration scheduled (hourly)');
}