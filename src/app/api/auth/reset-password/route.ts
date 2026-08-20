import { NextRequest, NextResponse } from 'next/server';
import { resetPassword, AuthError } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();
    await resetPassword(email, code, newPassword);
    return NextResponse.json({ success: true, message: 'Contrasena actualizada exitosamente' });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
