import { NextRequest, NextResponse } from "next/server";
import { placeOrder, cancelOrder, getUserOrders } from "@/lib/order-engine";

// POST: Place a new order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, pair, side, type, price, stopPrice, amount, chainId, baseSymbol, quoteSymbol } = body;

    // Validate
    if (!walletAddress || !pair || !side || !type || !amount || amount <= 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (type === "limit" && (!price || price <= 0)) {
      return NextResponse.json({ error: "Limit orders require a valid price" }, { status: 400 });
    }
    if (type === "stop" && (!stopPrice || stopPrice <= 0)) {
      return NextResponse.json({ error: "Stop orders require a valid stop price" }, { status: 400 });
    }
    if (!["buy", "sell"].includes(side)) {
      return NextResponse.json({ error: "Invalid side" }, { status: 400 });
    }
    if (!["limit", "market", "stop"].includes(type)) {
      return NextResponse.json({ error: "Invalid order type" }, { status: 400 });
    }

    const result = await placeOrder({
      walletAddress,
      pair,
      side,
      type,
      price: price || 0,
      stopPrice,
      amount: parseFloat(amount),
      chainId: chainId || 1,
      baseSymbol: baseSymbol || pair.split("_")[0],
      quoteSymbol: quoteSymbol || pair.split("_")[1],
    });

    if (result.orderStatus === "rejected") {
      return NextResponse.json({ error: "Saldo insuficiente en el exchange", ...result }, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Orders POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Get user's open orders
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");
    const pair = searchParams.get("pair");

    if (!wallet) {
      return NextResponse.json({ error: "wallet parameter required" }, { status: 400 });
    }

    const orders = await getUserOrders(wallet, pair ?? undefined);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[Orders GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Cancel an order
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const wallet = searchParams.get("wallet");

    if (!orderId || !wallet) {
      return NextResponse.json({ error: "orderId and wallet required" }, { status: 400 });
    }

    const success = await cancelOrder(orderId, wallet);
    if (!success) {
      return NextResponse.json({ error: "Order not found or cannot be cancelled" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Orders DELETE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
