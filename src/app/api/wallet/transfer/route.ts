import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { debitBalance, creditBalance, getOrCreateBalance } from "@/app/api/balance/route";

/*
  Internal Transfer API
  Transfer tokens between GCRM Exchange internal wallets.
  Supported: GCRM, NESG, ALARAB, QFS (no USDT for internal transfers)
*/

const TRANSFERABLE_TOKENS = ["GCRM", "NESG", "ALARAB", "QFS"];

// POST /api/wallet/transfer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromWallet, toWallet, symbol, amount, memo } = body;

    // Validate required fields
    if (!fromWallet || !toWallet || !symbol || !amount) {
      return NextResponse.json({ error: "Todos los campos son requeridos: fromWallet, toWallet, symbol, amount" }, { status: 400 });
    }

    const sym = (symbol as string).toUpperCase();

    // Validate token is transferable
    if (!TRANSFERABLE_TOKENS.includes(sym)) {
      return NextResponse.json({ error: `Transferencia interna no disponible para ${sym}. Tokens habilitados: ${TRANSFERABLE_TOKENS.join(", ")}` }, { status: 400 });
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
    }

    // Normalize addresses
    const from = (fromWallet as string).toLowerCase().trim();
    const to = (toWallet as string).toLowerCase().trim();

    // Cannot transfer to self
    if (from === to) {
      return NextResponse.json({ error: "No puedes transferir a tu propia wallet" }, { status: 400 });
    }

    // Validate address format (basic check)
    const ethAddrRegex = /^0x[a-f0-9]{40}$/i;
    if (!ethAddrRegex.test(from) || !ethAddrRegex.test(to)) {
      return NextResponse.json({ error: "Direccion de wallet invalida. Debe ser una direccion Ethereum valida (0x...)" }, { status: 400 });
    }

    // Check sender balance
    const senderBal = await getOrCreateBalance(from, sym);
    if (senderBal < amt - 0.000001) {
      return NextResponse.json({ error: `Balance insuficiente de ${sym}. Disponible: ${senderBal.toFixed(6)} ${sym}` }, { status: 400 });
    }

    // Minimum transfer amount
    if (amt < 0.000001) {
      return NextResponse.json({ error: `Monto minimo de transferencia: 0.000001 ${sym}` }, { status: 400 });
    }

    // Perform transfer (debit from sender, credit to receiver)
    const debited = await debitBalance(from, sym, amt);
    if (!debited) {
      return NextResponse.json({ error: "Error al debitar fondos del remitente" }, { status: 500 });
    }

    await creditBalance(to, sym, amt);

    // Ensure receiver balance record exists
    await getOrCreateBalance(to, sym);

    // Record transactions for both parties
    await prisma.walletTransaction.createMany({
      data: [
        {
          walletAddress: from,
          type: "withdraw",
          symbol: sym,
          amount: amt,
          fee: 0,
          status: "completed",
          network: "GCRM Internal",
          toAddress: to,
          note: memo || `Transferencia interna de ${sym} a ${to.slice(0, 8)}...${to.slice(-6)}`,
        },
        {
          walletAddress: to,
          type: "deposit",
          symbol: sym,
          amount: amt,
          fee: 0,
          status: "completed",
          network: "GCRM Internal",
          fromAddress: from,
          note: memo || `Transferencia interna de ${sym} desde ${from.slice(0, 8)}...${from.slice(-6)}`,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `Se transfirieron ${amt.toFixed(6)} ${sym} exitosamente`,
      details: {
        from: from.slice(0, 8) + "..." + from.slice(-6),
        to: to.slice(0, 8) + "..." + to.slice(-6),
        symbol: sym,
        amount: amt,
        fee: 0,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Transfer] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
