import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { mainnet, polygon } from "viem/chains";
import { ERC20_ABI } from "@/lib/tokens/config";

function getClient(chainId: number) {
  if (chainId === 137) {
    return createPublicClient({
      chain: polygon,
      transport: http(process.env.NEXT_PUBLIC_RPC_POLYGON || "https://polygon-rpc.com"),
    });
  }
  return createPublicClient({
    chain: mainnet,
    transport: http(process.env.NEXT_PUBLIC_RPC_ETHEREUM || "https://eth.llamarpc.com"),
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const address = searchParams.get("address") as `0x${string}` | null;
  const chainId = Number(searchParams.get("chainId") || "1");
  const walletAddress = searchParams.get("wallet") as `0x${string}` | null;

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  try {
    const client = getClient(chainId);

    const [decimals, symbol, name, totalSupply] = await Promise.all([
      client.readContract({ address, abi: ERC20_ABI, functionName: "decimals" }),
      client.readContract({ address, abi: ERC20_ABI, functionName: "symbol" }).catch(() => "???"),
      client.readContract({ address, abi: ERC20_ABI, functionName: "name" }).catch(() => "Unknown"),
      client.readContract({ address, abi: ERC20_ABI, functionName: "totalSupply" }).catch(() => 0n),
    ]);

    let balance: bigint | null = null;
    if (walletAddress) {
      balance = await client
        .readContract({ address, abi: ERC20_ABI, functionName: "balanceOf", args: [walletAddress] })
        .catch(() => null);
    }

    return NextResponse.json({
      address,
      chainId,
      symbol,
      name,
      decimals,
      totalSupply: totalSupply.toString(),
      balance: balance ? balance.toString() : null,
    });
  } catch (err) {
    console.error("Token info error:", err);
    return NextResponse.json({ error: "Failed to read contract" }, { status: 500 });
  }
}
