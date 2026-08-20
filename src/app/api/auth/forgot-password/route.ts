import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset, AuthError } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const result = await requestPasswordReset(email);
    return NextResponse.json({ success: true, message: 'Codigo enviado exitosamente', code: result.code });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
