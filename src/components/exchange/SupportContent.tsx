"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ChevronRight,
  ChevronDown,
  Headphones,
  MessageSquare,
  Shield,
  Wallet,
  ArrowRightLeft,
  CreditCard,
  User,
  Lock,
  Globe,
  BookOpen,
  AlertCircle,
  Zap,
  TrendingUp,
  HelpCircle,
  ExternalLink,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA — FAQ categories & articles (all in English)                 */
/* ------------------------------------------------------------------ */

interface FAQ {
  id: string;
  q: string;
  a: string;
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  faqs: FAQ[];
}

const CATEGORIES: Category[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: <Zap className="w-4 h-4" />,
    faqs: [
      {
        id: "gs-1",
        q: "How do I create an account on GCRM Exchange?",
        a: "Click the 'Sign Up' button on the top right of the homepage. Enter your email, set a strong password, and verify your email address. You can start trading immediately after email verification.",
      },
      {
        id: "gs-2",
        q: "What is GCRM token and how do I get it?",
        a: "GCRM is the native utility token of the GCRM Exchange ecosystem. You can obtain GCRM by participating in our Airdrop campaign, trading on the platform, or purchasing it on the spot market against USDT.",
      },
      {
        id: "gs-3",
        q: "Which blockchain networks are supported?",
        a: "GCRM Exchange currently supports Ethereum (ERC-20), BNB Smart Chain (BEP-20), and additional EVM-compatible networks. Always verify the network before making a deposit to avoid asset loss.",
      },
      {
        id: "gs-4",
        q: "Is GCRM Exchange available in my country?",
        a: "GCRM Exchange serves users globally. However, residents of certain restricted jurisdictions may not be able to access all features. Check our Terms of Service for the full list of restricted regions.",
      },
    ],
  },
  {
    id: "account-security",
    label: "Account & Security",
    icon: <Shield className="w-4 h-4" />,
    faqs: [
      {
        id: "as-1",
        q: "How do I enable two-factor authentication (2FA)?",
        a: "Go to your Profile Settings, click on 'Security', and select 'Enable 2FA'. You can use Google Authenticator or any compatible TOTP app. Scan the QR code, enter the verification code, and save your backup keys in a secure location.",
      },
      {
        id: "as-2",
        q: "I forgot my password. How do I reset it?",
        a: "Click 'Forgot Password' on the login page. Enter your registered email address and we'll send you a password reset link. The link is valid for 30 minutes. For security, previous sessions will be automatically logged out.",
      },
      {
        id: "as-3",
        q: "How do I complete KYC verification?",
        a: "Navigate to your Profile and select 'KYC Verification'. Upload a valid government-issued ID (passport, driver's license, or national ID) and a selfie. Verification typically completes within 24 hours.",
      },
      {
        id: "as-4",
        q: "My account was locked. What should I do?",
        a: "Account locks may occur due to multiple failed login attempts or suspicious activity. Wait 30 minutes and try again, or contact our support team for immediate assistance through the live chat.",
      },
      {
        id: "as-5",
        q: "How do I change my registered email?",
        a: "Go to Profile Settings > Account > Email. You'll need to verify your current email and then set a new one. For security, this change requires 2FA confirmation and has a 24-hour cooldown period.",
      },
    ],
  },
  {
    id: "deposit-withdrawal",
    label: "Deposit & Withdrawal",
    icon: <Wallet className="w-4 h-4" />,
    faqs: [
      {
        id: "dw-1",
        q: "How do I deposit crypto to GCRM Exchange?",
        a: "Go to Wallet > Deposit, select the cryptocurrency you want to deposit, and copy the deposit address. Make sure to send funds only on the supported network. Deposits typically require a certain number of network confirmations before being credited.",
      },
      {
        id: "dw-2",
        q: "How long do deposits take to arrive?",
        a: "Deposit times depend on the blockchain network. Most deposits are credited after 12-30 network confirmations (approximately 10-30 minutes). During periods of network congestion, it may take longer.",
      },
      {
        id: "dw-3",
        q: "What is the minimum withdrawal amount?",
        a: "Minimum withdrawal amounts vary by cryptocurrency. You can check the specific minimum for each token on the Withdrawal page. GCRM Exchange also charges a small network fee that fluctuates based on blockchain conditions.",
      },
      {
        id: "dw-4",
        q: "My deposit is missing. What should I do?",
        a: "First, verify the transaction on the blockchain explorer using your TXID. Ensure you sent funds to the correct network and address. If the transaction is confirmed but not credited, submit a support ticket with your TXID and we'll investigate.",
      },
      {
        id: "dw-5",
        q: "How do I withdraw funds from my account?",
        a: "Go to Wallet > Withdraw, select the cryptocurrency, enter your external wallet address, and the amount. Complete 2FA verification and confirm the withdrawal. You can track the status in your withdrawal history.",
      },
    ],
  },
  {
    id: "spot-trading",
    label: "Spot Trading",
    icon: <TrendingUp className="w-4 h-4" />,
    faqs: [
      {
        id: "st-1",
        q: "What is spot trading and how does it work?",
        a: "Spot trading involves buying and selling cryptocurrencies at current market prices. You place buy or sell orders on the order book. When your order matches with another user's order, the trade is executed immediately and the assets are settled.",
      },
      {
        id: "st-2",
        q: "What is the difference between a limit order and a market order?",
        a: "A limit order lets you set a specific price at which you want to buy or sell. The order only executes when the market reaches your price. A market order executes immediately at the best available current price.",
      },
      {
        id: "st-3",
        q: "What trading pairs are available on GCRM?",
        a: "GCRM Exchange offers multiple trading pairs including GCRM/USDT, QFS/USDT, ALARAB/USDT, and NESG/USDT. We also display information-only prices for major assets like BTC, ETH, and more from CoinGecko.",
      },
      {
        id: "st-4",
        q: "What are the trading fees?",
        a: "GCRM Exchange charges competitive trading fees. Maker orders (orders that add liquidity) typically have lower fees than taker orders (orders that remove liquidity). Check the Fee Schedule page for detailed information on all fee tiers.",
      },
      {
        id: "st-5",
        q: "How do I read the order book?",
        a: "The order book shows all pending buy orders (bids) on the left and sell orders (asks) on the right. Each row displays the price, amount, and total. The spread is the difference between the highest bid and the lowest ask price.",
      },
    ],
  },
  {
    id: "earn-staking",
    label: "Earn & Staking",
    icon: <CreditCard className="w-4 h-4" />,
    faqs: [
      {
        id: "es-1",
        q: "What is staking on GCRM Exchange?",
        a: "Staking allows you to earn passive income by locking your crypto assets for a specified period. GCRM Exchange offers flexible and fixed-term staking pools with different APY rates. Your rewards are calculated daily and distributed to your staking balance.",
      },
      {
        id: "es-2",
        q: "What is the difference between flexible and fixed staking?",
        a: "Flexible staking allows you to stake and unstake at any time with lower APY. Fixed-term staking locks your funds for a set period (30, 60, or 90 days) but offers significantly higher APY rates.",
      },
      {
        id: "es-3",
        q: "Can I unstake my tokens before the lock period ends?",
        a: "For flexible staking, yes — you can unstake at any time. For fixed-term staking, early unstaking is not supported. You must wait until the lock period expires to withdraw both your principal and earned rewards.",
      },
      {
        id: "es-4",
        q: "How are staking rewards calculated?",
        a: "Staking rewards are calculated based on the APY of the pool, your staked amount, and the duration. Rewards accrue daily and compound over time. The APY is variable and may be adjusted based on market conditions and platform performance.",
      },
    ],
  },
  {
    id: "airdrop",
    label: "Airdrop Program",
    icon: <Gift className="w-4 h-4" />,
    faqs: [
      {
        id: "ad-1",
        q: "How does the GCRM Airdrop work?",
        a: "The GCRM Airdrop rewards community members with free GCRM tokens. Register with your email and wallet address, complete social media tasks, and refer friends to earn more. Verified participants receive their tokens after the distribution event.",
      },
      {
        id: "ad-2",
        q: "How do I check my airdrop status?",
        a: "Go to the Airdrop page and enter your registered email or wallet address. You'll see your current status, completed tasks, referral count, and estimated GCRM earnings. Status updates from 'pending' to 'validated' and finally 'completed'.",
      },
      {
        id: "ad-3",
        q: "When will I receive my airdrop tokens?",
        a: "Token distribution occurs after the airdrop campaign concludes. You must complete all required tasks and pass validation (3-hour and 72-hour checks). Tokens are distributed to your registered wallet address automatically.",
      },
      {
        id: "ad-4",
        q: "How does the referral program work?",
        a: "Share your unique referral link with friends. When they register using your link and complete the required tasks, both you and your referral earn bonus GCRM tokens. There is no limit to the number of referrals you can make.",
      },
    ],
  },
];

/* Quick-link cards shown at top */
const QUICK_LINKS = [
  {
    title: "Account Verification",
    subtitle: "KYC",
    icon: <User className="w-5 h-5" />,
    status: "Verify your identity to unlock all features",
    action: "Complete Verification",
    mode: "verification" as const,
  },
  {
    title: "Deposit Funds",
    subtitle: "Wallet",
    icon: <ArrowRightLeft className="w-5 h-5" />,
    status: "Transfer crypto to start trading",
    action: "Go to Wallet",
    mode: "wallet-overview" as const,
  },
  {
    title: "Start Trading",
    subtitle: "Spot Market",
    icon: <TrendingUp className="w-5 h-5" />,
    status: "Trade GCRM, QFS, ALARAB, NESG pairs",
    action: "Open Exchange",
    mode: "spot" as const,
  },
];

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

interface SupportContentProps {
  onTradeModeChange?: (mode: string) => void;
}

export default function SupportContent({
  onTradeModeChange,
}: SupportContentProps) {
  const [activeCategory, setActiveCategory] = useState<string>(
    CATEGORIES[0].id
  );
  const [openFAQs, setOpenFAQs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  /* Toggle a single FAQ open/closed */
  const toggleFAQ = (id: string) => {
    setOpenFAQs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* Filter FAQs across all categories based on search */
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results: { category: Category; faq: FAQ }[] = [];
    for (const cat of CATEGORIES) {
      for (const faq of cat.faqs) {
        if (
          faq.q.toLowerCase().includes(q) ||
          faq.a.toLowerCase().includes(q)
        ) {
          results.push({ category: cat, faq });
        }
      }
    }
    return results;
  }, [searchQuery]);

  const activeCat = CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0E11]">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
        {/* ---- Header ---- */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#F0B90B] flex items-center justify-center">
            <Headphones className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              GCRM Support Center
            </h1>
            <p className="text-[13px] text-[#848E9C]">
              24/7 Customer Support — We're here to help
            </p>
          </div>
        </div>

        {/* ---- Search Bar ---- */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help... (e.g. deposit, KYC, trading fees)"
            className="w-full h-11 pl-10 pr-10 bg-[#1E2329] border border-[#2B3139] rounded-lg text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E6673] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ---- Search Results ---- */}
        {searchQuery.trim() && searchResults !== null && (
          <div className="mb-6">
            {searchResults.length === 0 ? (
              <div className="bg-[#1E2329] rounded-xl p-8 text-center">
                <HelpCircle className="w-10 h-10 text-[#5E6673] mx-auto mb-3" />
                <p className="text-[#848E9C] text-sm">
                  No results found for &quot;{searchQuery}&quot;
                </p>
                <p className="text-[#5E6673] text-xs mt-1">
                  Try different keywords or browse categories below
                </p>
              </div>
            ) : (
              <div className="bg-[#1E2329] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2B3139] flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    Search Results
                  </span>
                  <span className="text-xs text-[#848E9C]">
                    {searchResults.length} article{searchResults.length !== 1 && "s"}{" "}
                    found
                  </span>
                </div>
                <div className="divide-y divide-[#2B3139]">
                  {searchResults.slice(0, 8).map(({ category, faq }) => (
                    <button
                      key={faq.id}
                      onClick={() => {
                        setSearchQuery("");
                        setActiveCategory(category.id);
                        setOpenFAQs(new Set([faq.id]));
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-[#2B3139]/50 transition"
                    >
                      <p className="text-sm text-white">{faq.q}</p>
                      <p className="text-xs text-[#848E9C] mt-0.5">
                        in {category.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- Quick Action Cards ---- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.title}
              onClick={() => onTradeModeChange?.(link.mode)}
              className="bg-[#1E2329] rounded-xl p-4 text-left hover:bg-[#2B3139] transition group border border-transparent hover:border-[#2B3139]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center text-[#F0B90B]">
                    {link.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {link.title}
                    </p>
                    <p className="text-[11px] text-[#5E6673]">
                      {link.subtitle}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5E6673] group-hover:text-[#F0B90B] transition" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#848E9C]">Status</span>
                  <span className="text-white">{link.status}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#848E9C]">Action</span>
                  <span className="text-[#F0B90B]">
                    {link.action}
                    <ExternalLink className="inline w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ---- Main Content: Sidebar + FAQ ---- */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Category Sidebar */}
          <div className="md:w-60 flex-shrink-0">
            <div className="bg-[#1E2329] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2B3139]">
                <p className="text-xs font-semibold text-[#848E9C] uppercase tracking-wider">
                  Browse Topics
                </p>
              </div>
              <nav className="py-1">
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setSearchQuery("");
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition text-left ${
                        isActive
                          ? "text-[#F0B90B] bg-[#F0B90B]/5 border-l-2 border-[#F0B90B]"
                          : "text-[#848E9C] hover:text-white hover:bg-[#2B3139]/50 border-l-2 border-transparent"
                      }`}
                    >
                      {cat.icon}
                      <span className="truncate">{cat.label}</span>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* FAQ Panel */}
          <div className="flex-1 min-w-0">
            {activeCat && (
              <div className="bg-[#1E2329] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2B3139] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#F0B90B]">{activeCat.icon}</span>
                    <h2 className="text-sm font-semibold text-white">
                      {activeCat.label}
                    </h2>
                    <span className="text-xs text-[#5E6673]">
                      {activeCat.faqs.length} article{activeCat.faqs.length !== 1 && "s"}
                    </span>
                  </div>
                  <button className="text-xs text-[#F0B90B] hover:underline flex items-center gap-0.5">
                    View All <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-[#2B3139]">
                  {activeCat.faqs.map((faq) => {
                    const isOpen = openFAQs.has(faq.id);
                    return (
                      <div key={faq.id}>
                        <button
                          onClick={() => toggleFAQ(faq.id)}
                          className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[#2B3139]/30 transition"
                        >
                          <span className="text-[13px] text-white pr-4">
                            {faq.q}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-[#5E6673] flex-shrink-0 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4">
                            <div className="bg-[#0B0E11] rounded-lg p-3.5">
                              <p className="text-[13px] text-[#848E9C] leading-relaxed">
                                {faq.a}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---- Bottom CTA ---- */}
        <div className="mt-6">
          <button
            onClick={() => {
              /* Scroll to search & focus */
              const input = document.querySelector(
                'input[placeholder*="Search for help"]'
              ) as HTMLInputElement;
              input?.focus();
            }}
            className="w-full h-12 bg-[#F0B90B] hover:bg-[#F8D12F] text-black font-semibold rounded-lg flex items-center justify-center gap-2 transition text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Start Asking
          </button>
          <p className="text-center text-[11px] text-[#5E6673] mt-3">
            Can't find what you're looking for? Our support team is available 24/7.
          </p>
        </div>

        {/* ---- Contact Channels ---- */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#1E2329] rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F0B90B]/10 flex items-center justify-center text-[#F0B90B] flex-shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Live Chat</p>
              <p className="text-[11px] text-[#5E6673]">
                Average response &lt; 2 min
              </p>
            </div>
          </div>
          <div className="bg-[#1E2329] rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F0B90B]/10 flex items-center justify-center text-[#F0B90B] flex-shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Email Support</p>
              <p className="text-[11px] text-[#5E6673]">
                support@gcrm.exchange
              </p>
            </div>
          </div>
          <div className="bg-[#1E2329] rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F0B90B]/10 flex items-center justify-center text-[#F0B90B] flex-shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Help Center
              </p>
              <p className="text-[11px] text-[#5E6673]">
                Browse all articles
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Need Mail icon — not in the import list above */
function Mail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

/* Gift icon (not from lucide) */
function Gift(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}