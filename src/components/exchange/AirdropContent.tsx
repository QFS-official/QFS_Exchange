"use client";

import { useState, useEffect, useCallback } from "react";
import { Gift, ExternalLink, Copy, Check, User, Mail, Lock, Wallet, ChevronRight, Clock, Users, Trophy, Share2, Heart, AlertTriangle } from "lucide-react";

const SOCIAL_TASKS = [
  { id: "twitter", name: "X (Twitter)", action: "Follow @GCRM_official", reward: 3, url: "https://x.com/GCRM_official", icon: "\u{1D54F}", color: "from-[#1DA1F2] to-[#0D8BD9]" },
  { id: "telegram", name: "Telegram", action: "Join @GCRM_official", reward: 2, url: "https://t.me/GCRM_official", icon: "\u2708", color: "from-[#0088CC] to-[#006699]" },
  { id: "facebook", name: "Facebook", action: "Follow GCRM.Org", reward: 1, url: "https://facebook.com/GCRM.0rg", icon: "f", color: "from-[#1877F2] to-[#1565C0]" },
  { id: "instagram", name: "Instagram", action: "Follow @gcrm_official", reward: 1, url: "https://instagram.com/gcrm_official", icon: "\u{1D54C}", color: "from-[#E4405F] to-[#C13584]" },
  { id: "tiktok", name: "TikTok", action: "Follow @gcr.nesara.gesara", reward: 1, url: "https://tiktok.com/@gcr.nesara.gesara", icon: "T", color: "from-[#000000] to-[#333333]" },
  { id: "youtube", name: "YouTube", action: "Subscribe @GCRM_Official", reward: 1, url: "https://youtube.com/@GCRM_Official", icon: "\u25B6", color: "from-[#FF0000] to-[#CC0000]" },
  { id: "discord", name: "Discord", action: "Join GCRM Server", reward: 1, url: "https://discord.gg/gcrm", icon: "D", color: "from-[#5865F2] to-[#4752C4]" },
  { id: "whatsapp", name: "WhatsApp", action: "Join WhatsApp Group", reward: 1, url: "https://chat.whatsapp.com/gcrm", icon: "\u260E", color: "from-[#25D366] to-[#128C7E]" },
  { id: "reddit", name: "Reddit", action: "Follow u/GCRM_Official", reward: 1, url: "https://reddit.com/user/GCRM_Official", icon: "R", color: "from-[#FF4500] to-[#CC3700]" },
  { id: "github", name: "GitHub", action: "Follow GCRMaster", reward: 1, url: "https://github.com/GCRMaster", icon: "G", color: "from-[#333333] to-[#24292E]" },
  { id: "medium", name: "Medium", action: "Follow GCRM Publications", reward: 1, url: "https://medium.com/@gcrm_official", icon: "M", color: "from-[#12100E] to-[#1A1A1A]" },
];

const MAX_BASE_REWARD = 16;
const REFERRAL_REWARD = 2;

interface AirdropUser {
  username: string;
  email: string;
  wallet: string;
  completedTasks: string[];
  referralCode: string;
  referredBy?: string;
}

// Countdown to Aug 21, 2026 (11 days from Aug 10)
const TARGET_DATE = new Date("2026-08-21T00:00:00Z").getTime();

export function AirdropContent() {
  const [view, setView] = useState<"landing" | "register" | "login" | "dashboard">("landing");
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [showCopied, setShowCopied] = useState(false);
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "", wallet: "", referral: "" });
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [user, setUser] = useState<AirdropUser | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(158);
  const [registerError, setRegisterError] = useState("");
  const [registering, setRegistering] = useState(false);

  // Countdown timer
  useEffect(() => {
    function tick() {
      const now = Date.now();
      const diff = Math.max(0, TARGET_DATE - now);
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const earnedReward = completedTasks.reduce((sum, id) => {
    const task = SOCIAL_TASKS.find((t) => t.id === id);
    return sum + (task?.reward || 0);
  }, 0);

  function toggleTask(taskId: string) {
    setCompletedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  }

  function handleRegister() {
    if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.wallet) return;
    setRegistering(true);
    setRegisterError("");
    fetch("/api/airdrop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: registerForm.username,
        email: registerForm.email,
        wallet: registerForm.wallet,
        completedTasks,
        referral: registerForm.referral,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) { setRegisterError(data.error); setRegistering(false); return; }
        const newUser: AirdropUser = {
          username: registerForm.username,
          email: registerForm.email,
          wallet: registerForm.wallet,
          completedTasks,
          referralCode: registerForm.username.toLowerCase().replace(/\s+/g, ""),
          referredBy: registerForm.referral || undefined,
        };
        setUser(newUser);
        setView("dashboard");
      })
      .catch(() => { setRegisterError("Error de conexion"); setRegistering(false); });
  }

  function handleLogin() {
    if (!loginForm.username || !loginForm.password) return;
    setUser({
      username: loginForm.username,
      email: `${loginForm.username}@gcrm.community`,
      wallet: "0x...connected",
      completedTasks: [],
      referralCode: loginForm.username.toLowerCase().replace(/\s+/g, ""),
    });
    setView("dashboard");
  }

  function copyReferral() {
    if (!user) return;
    const link = `https://gcrmaster.org/airdrop-gcrm/?ref=${user.username}`;
    navigator.clipboard.writeText(link);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }

  // ============ LANDING VIEW ============
  if (view === "landing") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {/* Humanitarian Aid Countdown */}
          <div className="bg-[#1E2329] rounded-2xl p-6 md:p-8 border border-[#F0B90B]/20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#F0B90B]/5 via-transparent to-[#F0B90B]/5 pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 mb-4 rounded-full bg-[#F6465D]/10 border border-[#F6465D]/30 text-xs font-medium text-[#F6465D] tracking-wider uppercase">
                <Heart className="w-3.5 h-3.5" />
                <span>Active Campaign</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#F0B90B] to-[#F8D12F]">
                GCRM Humanitarian Aid
              </h2>
              <p className="text-[#848E9C] text-sm mb-8 max-w-xl mx-auto">
                The GCRM Humanitarian Aid countdown starts on <span className="text-white font-bold">August 10th</span> and
                will last for <span className="text-white font-bold">11 days</span>. Participate before it concludes!
              </p>
              <div className="flex justify-center space-x-3 md:space-x-5">
                {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                  <div key={unit} className="flex flex-col items-center bg-[#0B0E11]/60 rounded-xl p-3 md:p-4 min-w-[70px] md:min-w-[90px] border border-[#2B3139]">
                    <span className="text-3xl md:text-4xl font-extrabold text-white tabular-nums">{String(countdown[unit]).padStart(2, "0")}</span>
                    <span className="text-[10px] md:text-xs text-[#5E6673] uppercase tracking-wider mt-1.5">{unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hero + Airdrop Card */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: Hero text */}
            <div className="pt-4">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 mb-5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#848E9C] tracking-wider">
                <Gift className="w-3.5 h-3.5 text-[#F0B90B]" />
                <span>SECURED WEB3 AIRDROP</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-5">
                <span className="text-white">JOIN THE</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F0B90B] to-[#F8D12F]">GLOBAL GCRM</span>
                <br />
                <span className="text-white">AIRDROP</span>
              </h1>
              <p className="text-base text-[#848E9C] mb-8 max-w-md leading-relaxed">
                Register, complete social tasks, and earn up to <span className="text-[#F0B90B] font-bold">16 GCRM</span> in rewards.
                Become part of the GCRMaster ecosystem today.
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setView("register")}
                  className="px-8 py-3.5 bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] text-black font-bold rounded-lg hover:brightness-110 transition flex items-center justify-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>REGISTER NOW</span>
                </button>
                <button
                  onClick={() => setView("login")}
                  className="px-8 py-3.5 bg-[#2B3139] border border-[#F0B90B]/20 text-[#F0B90B] font-bold rounded-lg hover:bg-[#363C45] transition flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>LOGIN</span>
                </button>
              </div>
            </div>

            {/* Right: Airdrop Card */}
            <div className="bg-[#1E2329] rounded-2xl p-1 border border-[#F0B90B]/20 shadow-lg shadow-[#F0B90B]/5">
              <div className="bg-[#0B0E11]/40 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#F0B90B]/10 rounded-full blur-3xl" />
                <div className="flex justify-between items-start mb-6 relative">
                  <span className="text-xs bg-[#F0B90B]/10 text-[#F0B90B] px-3 py-1 rounded-full font-medium uppercase tracking-wider">Limited Event</span>
                  <img
                    src="https://z-cdn-media.chatglm.cn/files/79566bdc-6a04-48b8-be22-18e69ebd3f2d.png?auth_key=1886203865-ec0975e4b85042be80b52023bec8e47d-0-64860ccb488ada6a09ff6665e3b355d9"
                    alt="GCRM"
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-[#F0B90B]/30"
                  />
                </div>
                <h3 className="text-xl font-bold mb-4">GCRM COMMUNITY AIRDROP</h3>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-6">
                  <div className="text-xs text-[#5E6673] uppercase tracking-wider mb-1">Total Reward Pool</div>
                  <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#F0B90B] to-[#F8D12F]">
                    16 GCRM <span className="text-sm text-[#5E6673] font-normal">FREE</span>
                  </div>
                  <div className="text-xs text-[#5E6673] mt-1">+ 2 GCRM per successful referral</div>
                </div>
                <div className="flex items-center justify-between text-xs text-[#5E6673] mb-4">
                  <span className="flex items-center space-x-1"><Users className="w-3.5 h-3.5" /> {totalParticipants} participants</span>
                  <span className="flex items-center space-x-1"><Clock className="w-3.5 h-3.5" /> Ends Aug 21</span>
                </div>
                <button
                  onClick={() => setView("register")}
                  className="w-full py-3.5 bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] text-black font-bold rounded-xl hover:brightness-110 transition"
                >
                  PARTICIPATE NOW
                </button>
              </div>
            </div>
          </div>

          {/* Social Tasks Showcase */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Follow & Earn Rewards</h2>
              <p className="text-[#848E9C] text-sm">Complete each social task to earn GCRM tokens. Every follow counts toward your total reward.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {SOCIAL_TASKS.map((task) => (
                <a
                  key={task.id}
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1E2329] rounded-xl p-4 border border-[#2B3139] hover:border-[#F0B90B]/30 transition group cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${task.color} flex items-center justify-center text-white font-bold text-sm mb-3`}>
                    {task.icon}
                  </div>
                  <p className="text-sm font-semibold text-white group-hover:text-[#F0B90B] transition">{task.name}</p>
                  <p className="text-[11px] text-[#5E6673] mt-0.5">{task.action}</p>
                  <p className="text-xs font-bold text-[#02C076] mt-2">+{task.reward} GCRM</p>
                </a>
              ))}
            </div>
            <div className="mt-6 bg-[#1E2329] rounded-xl p-5 border border-[#2B3139] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#848E9C]">Maximum Total Reward</p>
                <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F0B90B] to-[#F8D12F]">16 GCRM <span className="text-sm text-[#5E6673] font-normal">(+2 per referral)</span></p>
              </div>
              <button
                onClick={() => setView("register")}
                className="px-6 py-3 bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] text-black font-bold rounded-lg hover:brightness-110 transition whitespace-nowrap"
              >
                CREATE ACCOUNT
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ REGISTER VIEW ============
  if (view === "register") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <button onClick={() => setView("landing")} className="flex items-center space-x-1 text-xs text-[#848E9C] hover:text-white transition mb-6">
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            <span>Back to Airdrop</span>
          </button>
          <div className="bg-[#1E2329] rounded-2xl p-6 md:p-8 border border-[#2B3139]">
            <h2 className="text-xl font-bold text-white mb-1">Create Your Airdrop Account</h2>
            <p className="text-sm text-[#848E9C] mb-6">Complete all steps to earn your GCRM rewards</p>

            {/* Account Info */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[#5E6673] uppercase tracking-wider mb-3">Account Information</h3>
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                  <input
                    type="text" placeholder="Username"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    className="w-full bg-[#2B3139] rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:ring-1 focus:ring-[#F0B90B]/50 transition"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                  <input
                    type="email" placeholder="Email Address"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full bg-[#2B3139] rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:ring-1 focus:ring-[#F0B90B]/50 transition"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                  <input
                    type="password" placeholder="Password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full bg-[#2B3139] rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:ring-1 focus:ring-[#F0B90B]/50 transition"
                  />
                </div>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                  <input
                    type="text" placeholder="GCRM Wallet Address (ERC-20)"
                    value={registerForm.wallet}
                    onChange={(e) => setRegisterForm({ ...registerForm, wallet: e.target.value })}
                    className="w-full bg-[#2B3139] rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:ring-1 focus:ring-[#F0B90B]/50 transition"
                  />
                </div>
              </div>
            </div>

            {/* Social Tasks */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[#5E6673] uppercase tracking-wider mb-3">Complete Social Tasks</h3>
              <p className="text-xs text-[#5E6673] mb-3">Click each task to open the link, then check to confirm completion.</p>
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {SOCIAL_TASKS.map((task) => {
                  const done = completedTasks.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition ${
                        done ? "bg-[#02C076]/5 border-[#02C076]/20" : "bg-[#2B3139]/50 border-[#2B3139]"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <button onClick={() => toggleTask(task.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                          done ? "bg-[#02C076] border-[#02C076]" : "border-[#5E6673] hover:border-[#848E9C]"
                        }`}>
                          {done && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <div>
                          <p className={`text-sm font-medium ${done ? "text-[#02C076]" : "text-white"}`}>{task.name}</p>
                          <p className="text-[11px] text-[#5E6673]">{task.action}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#02C076]">+{task.reward} GCRM</span>
                        <a href={task.url} target="_blank" rel="noopener noreferrer" className="p-1 text-[#5E6673] hover:text-[#F0B90B] transition">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Referral */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[#5E6673] uppercase tracking-wider mb-3">
                <Share2 className="w-3.5 h-3.5 inline mr-1" /> Referral Program (+2 GCRM each)
              </h3>
              <input
                type="text" placeholder="Referral Username (Optional)"
                value={registerForm.referral}
                onChange={(e) => setRegisterForm({ ...registerForm, referral: e.target.value })}
                className="w-full bg-[#2B3139] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:ring-1 focus:ring-[#F0B90B]/50 transition"
              />
            </div>

            {/* Current reward + Submit */}
            <div className="bg-[#2B3139] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#5E6673]">Your Current Reward</p>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F0B90B] to-[#F8D12F]">{earnedReward} GCRM</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#5E6673]">Tasks Completed</p>
                  <p className="text-lg font-bold text-white">{completedTasks.length} / {SOCIAL_TASKS.length}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.wallet}
              className="w-full py-3.5 bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] text-black font-bold rounded-xl hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              SUBMIT REGISTRATION
            </button>

            <p className="text-center text-xs text-[#5E6673] mt-4">
              Already have an account?{" "}
              <button onClick={() => setView("login")} className="text-[#F0B90B] hover:underline">Login here</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============ LOGIN VIEW ============
  if (view === "login") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-8">
          <button onClick={() => setView("landing")} className="flex items-center space-x-1 text-xs text-[#848E9C] hover:text-white transition mb-6">
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            <span>Back to Airdrop</span>
          </button>
          <div className="bg-[#1E2329] rounded-2xl p-6 md:p-8 border border-[#2B3139]">
            <h2 className="text-xl font-bold text-white mb-1">Login to Your Account</h2>
            <p className="text-sm text-[#848E9C] mb-6">Access your airdrop dashboard</p>
            <div className="space-y-3 mb-6">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                <input
                  type="text" placeholder="Username or Email"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full bg-[#2B3139] rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:ring-1 focus:ring-[#F0B90B]/50 transition"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                <input
                  type="password" placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full bg-[#2B3139] rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:ring-1 focus:ring-[#F0B90B]/50 transition"
                />
              </div>
            </div>
            <button
              onClick={handleLogin}
              disabled={!loginForm.username || !loginForm.password}
              className="w-full py-3.5 bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] text-black font-bold rounded-xl hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              LOGIN
            </button>
            <p className="text-center text-xs text-[#5E6673] mt-4">
              Don&apos;t have an account?{" "}
              <button onClick={() => setView("register")} className="text-[#F0B90B] hover:underline">Register here</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============ DASHBOARD VIEW ============
  if (view === "dashboard" && user) {
    const userEarned = user.completedTasks.reduce((sum, id) => {
      const task = SOCIAL_TASKS.find((t) => t.id === id);
      return sum + (task?.reward || 0);
    }, 0);

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#848E9C]">Welcome, <span className="text-white font-semibold">{user.username}</span></p>
              <p className="text-xs text-[#5E6673]">Track your airdrop status and rewards.</p>
            </div>
            <button
              onClick={() => { setUser(null); setView("landing"); }}
              className="text-xs text-[#848E9C] hover:text-[#F6465D] transition"
            >
              Logout
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#1E2329] rounded-xl p-4 border border-[#2B3139]">
              <p className="text-xs text-[#5E6673]">Total GCRM Earned</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F0B90B] to-[#F8D12F]">{userEarned} GCRM</p>
            </div>
            <div className="bg-[#1E2329] rounded-xl p-4 border border-[#2B3139]">
              <p className="text-xs text-[#5E6673]">Tasks Completed</p>
              <p className="text-2xl font-bold text-white">{user.completedTasks.length} / {SOCIAL_TASKS.length}</p>
            </div>
            <div className="bg-[#1E2329] rounded-xl p-4 border border-[#2B3139]">
              <p className="text-xs text-[#5E6673]">Distribution Status</p>
              <p className="text-sm font-bold text-yellow-400 mt-1">Pending</p>
            </div>
            <div className="bg-[#1E2329] rounded-xl p-4 border border-[#2B3139]">
              <p className="text-xs text-[#5E6673]">Participants</p>
              <p className="text-2xl font-bold text-white">{totalParticipants}</p>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-[#1E2329] rounded-xl p-5 border border-[#F0B90B]/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-1 flex items-center space-x-1">
                  <Share2 className="w-4 h-4 text-[#F0B90B]" />
                  <span>Your Referral Link</span>
                </p>
                <p className="text-xs text-[#5E6673] mb-3">Share this link with friends. You will earn 2 GCRM for every friend who registers using your link!</p>
                <div className="bg-[#2B3139] rounded-lg px-3 py-2 flex items-center space-x-2">
                  <p className="text-xs text-[#848E9C] truncate flex-1 font-mono">
                    https://gcrmaster.org/airdrop-gcrm/?ref={user.username}
                  </p>
                  <button
                    onClick={copyReferral}
                    className="shrink-0 flex items-center space-x-1 text-xs text-[#F0B90B] hover:text-[#F8D12F] transition"
                  >
                    {showCopied ? <><Check className="w-3.5 h-3.5" /><span>Copied!</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copy Link</span></>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="bg-[#1E2329] rounded-xl p-5 border border-[#2B3139]">
            <p className="text-sm font-semibold text-white mb-1 flex items-center space-x-1">
              <Wallet className="w-4 h-4 text-[#F0B90B]" />
              <span>Your Wallet Address</span>
            </p>
            <p className="text-xs text-[#848E9C] font-mono mt-2 bg-[#2B3139] rounded-lg px-3 py-2 truncate">{user.wallet}</p>
          </div>

          {/* Task Status */}
          <div className="bg-[#1E2329] rounded-xl p-5 border border-[#2B3139]">
            <h3 className="text-sm font-bold text-[#5E6673] uppercase tracking-wider mb-4">Task Status</h3>
            <div className="space-y-2">
              {SOCIAL_TASKS.map((task) => {
                const done = user.completedTasks.includes(task.id);
                return (
                  <div key={task.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#2B3139]/50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        done ? "bg-[#02C076] border-[#02C076]" : "border-[#5E6673]"
                      }`}>
                        {done && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${done ? "text-[#02C076]" : "text-white"}`}>{task.name}</p>
                        <p className="text-[11px] text-[#5E6673]">{task.action}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#02C076]">+{task.reward} GCRM</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}