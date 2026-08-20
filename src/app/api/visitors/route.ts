import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_PW = 'GCRM2026Admin';

// POST — Track a visitor
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, walletAddress, page } = body;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const ua = req.headers.get('user-agent') || null;

    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    const existing = await db.visitor.findFirst({ where: { sessionId } });

    if (existing) {
      await db.visitor.update({
        where: { id: existing.id },
        data: {
          lastSeenAt: new Date(),
          page: page || existing.page,
          walletAddress: walletAddress || existing.walletAddress,
          ipAddress: existing.ipAddress === 'unknown' ? ip : existing.ipAddress,
        },
      });
      return NextResponse.json({ success: true, existing: true });
    }

    await db.visitor.create({
      data: {
        sessionId,
        walletAddress: walletAddress || null,
        ipAddress: ip,
        userAgent: ua ? ua.slice(0, 200) : null,
        page: page || 'spot',
      },
    });

    return NextResponse.json({ success: true, existing: false });
  } catch (e) {
    console.error('Visitor track error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET — Admin list
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pw = searchParams.get('pw');
    if (pw !== ADMIN_PW) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { sessionId: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const twentyFourHrsAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [visitors, total, onlineNow, todayVisitors] = await Promise.all([
      db.visitor.findMany({
        where,
        orderBy: { lastSeenAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.visitor.count({ where }),
      db.visitor.groupBy({ where: { lastSeenAt: { gte: thirtyMinAgo } }, by: ['sessionId'] }),
      db.visitor.groupBy({ where: { createdAt: { gte: twentyFourHrsAgo } }, by: ['sessionId'] }),
    ]);

    const uniqueWallets = await db.visitor.groupBy({
      where: { walletAddress: { not: null } },
      by: ['walletAddress'],
    });

    const allUnique = await db.visitor.groupBy({ by: ['sessionId'] });

    return NextResponse.json({
      visitors,
      total,
      stats: {
        onlineNow: onlineNow.length,
        todayVisitors: todayVisitors.length,
        totalUnique: allUnique.length,
        uniqueWallets: uniqueWallets.length,
      },
    });
  } catch (e) {
    console.error('Visitor list error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
