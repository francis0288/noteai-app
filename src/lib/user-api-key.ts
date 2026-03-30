import { prisma } from "@/lib/db";

export async function getUserApiKey(userId: string): Promise<string | null> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { anthropicApiKey: true },
  });
  return settings?.anthropicApiKey ?? null;
}
