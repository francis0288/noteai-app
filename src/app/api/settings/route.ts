import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { userId, error } = await requireUser();
  if (error) return error;

  const settings = await prisma.userSettings.findUnique({ where: { userId: userId! } });
  return NextResponse.json(settings ?? {
    anthropicApiKey: null,
    syncProvider: null,
    syncInterval: "manual",
    theme: "system",
  });
}

export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const { anthropicApiKey, syncProvider, syncInterval, theme } = body;

  const settings = await prisma.userSettings.upsert({
    where: { userId: userId! },
    update: {
      ...(anthropicApiKey !== undefined && { anthropicApiKey: anthropicApiKey || null }),
      ...(syncProvider !== undefined && { syncProvider: syncProvider || null }),
      ...(syncInterval !== undefined && { syncInterval }),
      ...(theme !== undefined && { theme }),
    },
    create: {
      userId: userId!,
      anthropicApiKey: anthropicApiKey || null,
      syncProvider: syncProvider || null,
      syncInterval: syncInterval ?? "manual",
      theme: theme ?? "system",
    },
  });

  return NextResponse.json(settings);
}
