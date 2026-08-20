"use client";

import { TRADING_PAIRS } from "@/lib/tokens/config";
import { Clock, Users, CreditCard, ExternalLink } from "lucide-react";

const cards = [
  {
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    title: "GCRM Airdrop Campaign",
    desc: "Complete tasks, verify your account, and claim free GCRM tokens. Join our Telegram and follow official channels to maximize your rewards.",
    link: "View Tasks & Claim",
    href: "#",
  },
  {
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    title: "Multilevel Referral Program",
    desc: "Invite friends using your personal link and earn multi-tier commissions on their trading fees. Track your network in real-time.",
    link: "Get Referral Link",
    href: "#",
  },
  {
    icon: CreditCard,
    color: "text-green-500",
    bg: "bg-green-500/10",
    title: "Secure Asset Wallet",
    desc: "Deposit, withdraw, and manage your crypto balances with QR codes and blockchain addresses. Protected by 2FA and advanced security protocols.",
    link: "Access Wallet",
    href: "#",
  },
];

export function Ecosystem() {
  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-extrabold text-center mb-2">
        The{" "}
        <span className="bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
          GCRM
        </span>{" "}
        Ecosystem
      </h2>
      <p className="text-gray-500 text-center text-sm mb-10">
        Real on-chain contracts • Ethereum & Polygon • Connected to CoinGecko & CoinMarketCap
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div
            key={c.title}
            className="bg-[#0d0f14] border border-[#1e2128] p-6 rounded-lg hover:border-yellow-500/50 transition-all group"
          >
            <div className={`h-12 w-12 ${c.bg} rounded-full flex items-center justify-center mb-4`}>
              <c.icon className={`w-6 h-6 ${c.color}`} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-white">{c.title}</h3>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">{c.desc}</p>
            <a
              href={c.href}
              className="text-yellow-500 font-semibold text-sm hover:underline inline-flex items-center space-x-1 group-hover:space-x-2 transition-all"
            >
              <span>{c.link}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
            </a>
          </div>
        ))}
      </div>

      {/* Token contracts info */}
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {TRADING_PAIRS.map((p) => (
          <a
            key={p.base.address}
            href={p.base.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#080a0e] border border-[#1e2128] rounded-lg p-4 hover:border-yellow-500/30 transition flex items-center justify-between"
          >
            <div>
              <p className="text-white font-bold text-sm">
                {p.base.symbol}<span className="text-gray-500">/{p.quote.symbol}</span>
              </p>
              <p className="text-gray-600 text-xs mt-0.5">
                {p.base.chainName} • {p.base.address.slice(0, 6)}...{p.base.address.slice(-4)}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-600" />
          </a>
        ))}
      </div>
    </section>
  );
}
