"use client";

import { UsersRound, Bot, Zap, MessageSquare, Monitor, Gift, Flame, CandlestickChart, ExternalLink, Shield } from "lucide-react";

interface TradeItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  badgeEmoji?: string;
  external?: boolean;
}

interface TradeSection {
  label: string;
  items: TradeItem[];
}

const SECTIONS: TradeSection[] = [
  {
    label: "Trading",
    items: [
      {
        id: "spot",
        icon: <CandlestickChart className="w-4 h-4" />,
        title: "Spot Trading",
        subtitle: "GCRM, QFS, ALARAB, NESG / USDT",
      },
    ],
  },
  {
    label: "Staking",
    items: [
      {
        id: "staking",
        icon: <Flame className="w-4 h-4" />,
        title: "Staking GCRM",
        subtitle: "Gana hasta 42% APY con tus tokens",
        badge: "HOT",
        badgeColor: "bg-[#F6465D] text-white text-[8px]",
      },
    ],
  },
  {
    label: "Airdrop",
    items: [
      {
        id: "airdrop",
        icon: <Gift className="w-4 h-4" />,
        title: "Airdrop GCRM",
        subtitle: "Gana hasta 16 GCRM gratis",
        badgeEmoji: "\uD83C\uDF81",
      },
    ],
  },
  {
    label: "",
    items: [
      {
        id: "copy-trading",
        icon: <UsersRound className="w-4 h-4" />,
        title: "Copy Trading",
        subtitle: "Copia las operaciones de los mejores traders",
        badgeEmoji: "\uD83D\uDD25",
      },
      {
        id: "tradegpt",
        icon: <MessageSquare className="w-4 h-4" />,
        title: "TradeGPT AI",
        subtitle: "Tu asistente de IA para trading",
        badge: "NEW",
        badgeColor: "bg-[#3B82F6] text-white text-[8px]",
      },
      {
        id: "tradingview",
        icon: <Monitor className="w-4 h-4" />,
        title: "TradingView",
        subtitle: "Herramientas avanzadas de analisis tecnico",
        badge: "NEW",
        badgeColor: "bg-[#3B82F6] text-white text-[8px]",
      },
      {
        id: "trading-bot",
        icon: <Bot className="w-4 h-4" />,
        title: "Trading Bot",
        subtitle: "Trades Inteligentes Simplificados",
      },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        id: "admin-panel",
        icon: <Shield className="w-4 h-4" />,
        title: "Admin Panel",
        subtitle: "Seguimiento de visitantes y airdrop",
      },
    ],
  },
];

interface TradeSidebarProps {
  activeMode: string;
  onModeChange: (mode: string) => void;
}

export function TradeSidebar({ activeMode, onModeChange }: TradeSidebarProps) {
  return (
    <div className="bg-[#1E2329] h-full overflow-y-auto flex flex-col">
      {/* Logo area */}
      <div className="px-4 pt-4 pb-3 border-b border-[#2B3139]">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">GCRM</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {SECTIONS.map((section, sIdx) => (
          <div key={section.label || `dash-${sIdx}`}>
            {section.label && (
              <div className="px-4 pt-3 pb-1.5">
                <span className="text-[10px] font-bold text-[#5E6673] uppercase tracking-widest">{section.label}</span>
              </div>
            )}
            {section.items.map((item) => {
              const isActive = activeMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onModeChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition group ${
                    isActive
                      ? "bg-[#2B3139] border-l-2 border-[#F0B90B]"
                      : "border-l-2 border-transparent hover:bg-[#2B3139]/50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                    isActive ? "bg-[#F0B90B]/10" : "bg-[#2B3139] group-hover:bg-[#363C45]"
                  }`}>
                    <span className={isActive ? "text-[#F0B90B]" : "text-[#848E9C] group-hover:text-white"}>{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className={`text-xs font-semibold transition ${
                        isActive ? "text-white" : "text-[#848E9C] group-hover:text-white"
                      }`}>{item.title}</p>
                      {item.badge && (
                        <span className={`px-1 py-px rounded font-bold ${item.badgeColor}`}>{item.badge}</span>
                      )}
                      {item.badgeEmoji && <span className="text-sm">{item.badgeEmoji}</span>}
                    </div>
                    {item.subtitle && (
                      <p className={`text-[10px] mt-0.5 leading-snug transition ${
                        isActive ? "text-[#848E9C]" : "text-[#5E6673] group-hover:text-[#848E9C]"
                      }`}>{item.subtitle}</p>
                    )}
                  </div>
                  {isActive && <ExternalLink className="w-3 h-3 text-[#F0B90B] shrink-0" />}
                </button>
              );
            })}
            {sIdx < SECTIONS.length - 1 && (
              <div className="border-t border-[#2B3139] mx-4 my-1" />
            )}
          </div>
        ))}
      </div>

      {/* Bottom branding */}
      <div className="border-t border-[#2B3139] p-3">
        <div className="bg-[#2B3139] rounded-lg px-3 py-2.5 text-center">
          <p className="text-[11px] text-[#848E9C]">Trade smarter with</p>
          <p className="text-xs font-bold text-[#F0B90B] mt-0.5">GCRM Exchange</p>
        </div>
      </div>
    </div>
  );
}
