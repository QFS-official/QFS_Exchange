"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Eye, EyeOff, Loader2, Shield, UserPlus, QrCode, Smartphone, Mail, ArrowRight, Globe, Zap, Lock, BarChart3, Wallet, ArrowLeft, CheckCircle2, RotateCcw, Info } from "lucide-react";
import { useConnect } from "wagmi";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  referralCode: string | null;
  role: string;
  kycLevel: number;
  twoFactor: boolean;
}

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
  initialTab?: "login" | "register";
}

export function AuthModal({ open, onClose, onLogin, initialTab = "login" }: AuthModalProps) {
  const { connect, connectors } = useConnect();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone" | "qr">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+51");
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<0 | 1 | 2 | 3>(0);
  // 0 = not active, 1 = enter email, 2 = enter code, 3 = enter new password, success
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotCodeSent, setForgotCodeSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const resetForm = useCallback(() => {
    setEmail(""); setPassword(""); setConfirmPassword(""); setName("");
    setReferralCode(""); setError(""); setLoading(false);
    setShowPassword(false); setAgreeTerms(false); setPhone("");
    setVerificationSent(false); setVerificationCode(""); setLoginMethod("email");
    setForgotStep(0); setForgotEmail(""); setForgotCode("");
    setForgotNewPassword(""); setForgotConfirmPassword("");
    setShowForgotPassword(false); setForgotCodeSent(false); setResetSuccess(false);
    setCountdown(0);
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  useEffect(() => {
    if (open) { setTab(initialTab); resetForm(); }
  }, [open, initialTab, resetForm]);

  // Countdown timer for resend code
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }
  }, [countdown]);

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape" && open) onClose(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (tab === "register" && !agreeTerms) { setError("Debes aceptar los Terminos de Servicio"); return; }
    if (tab === "register" && password !== confirmPassword) { setError("Las contrasenas no coinciden"); return; }
    if (password.length < 8) { setError("La contrasena debe tener al menos 8 caracteres"); return; }
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const body: Record<string, string> = { email, password };
      if (tab === "register") { if (name) body.name = name; if (referralCode) body.referralCode = referralCode; }
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Algo salio mal"); return; }
      onLogin(data.user); onClose();
    } catch { setError("Error de red. Intenta de nuevo."); }
    finally { setLoading(false); }
  }

  function handleSendVerification() { if (!phone) return; setVerificationSent(true); }

  // Wallet connect via wagmi
  function handleWalletConnect() {
    const injectedConnector = connectors.find(c => c.id === "injected" || c.id === "metaMask");
    if (injectedConnector) {
      connect({ connector: injectedConnector });
      onClose();
    } else if (connectors.length > 0) {
      connect({ connector: connectors[0] });
      onClose();
    }
  }

  // Social login handlers (Google, Apple, Twitter)
  async function handleSocialLogin(provider: "google" | "apple" | "twitter") {
    // Check if OAuth credentials are configured
    const hasGoogle = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const hasApple = !!process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    const hasTwitter = !!process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;

    if (provider === "google" && !hasGoogle) {
      setSocialNotice("Google OAuth estara disponible pronto. Se requiere configuracion en el servidor.");
      setTimeout(() => setSocialNotice(null), 4000);
      return;
    }
    if (provider === "apple" && !hasApple) {
      setSocialNotice("Apple Sign In estara disponible pronto. Se requiere configuracion en el servidor.");
      setTimeout(() => setSocialNotice(null), 4000);
      return;
    }
    if (provider === "twitter" && !hasTwitter) {
      setSocialNotice("Twitter/X OAuth estara disponible pronto. Se requiere configuracion en el servidor.");
      setTimeout(() => setSocialNotice(null), 4000);
      return;
    }

    // If configured, redirect to OAuth provider
    setSocialLoading(provider);
    setError("");
    try {
      window.location.href = `/api/auth/${provider}/authorize`;
    } catch {
      setSocialNotice(`Error al conectar con ${provider}. Intenta de nuevo.`);
      setSocialLoading(null);
      setTimeout(() => setSocialNotice(null), 4000);
    }
  }

  async function handleForgotSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) { setError("Ingresa tu email"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Algo salio mal"); return; }
      setForgotCodeSent(true);
      setForgotStep(2);
      setCountdown(60);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally { setLoading(false); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (forgotCode.length !== 6) { setError("El codigo debe tener 6 digitos"); return; }
    if (forgotNewPassword.length < 8) { setError("La contrasena debe tener al menos 8 caracteres"); return; }
    if (forgotNewPassword !== forgotConfirmPassword) { setError("Las contrasenas no coinciden"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, code: forgotCode, newPassword: forgotNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Algo salio mal"); return; }
      setResetSuccess(true);
      setForgotStep(3);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally { setLoading(false); }
  }

  function handleBackToLogin() {
    setForgotStep(0); setShowForgotPassword(false); setForgotCodeSent(false);
    setResetSuccess(false); setForgotEmail(""); setForgotCode("");
    setForgotNewPassword(""); setForgotConfirmPassword(""); setError("");
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(0);
  }

  const inputClass = "w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F0B90B]/50 focus:ring-1 focus:ring-[#F0B90B]/20 transition placeholder:text-[#5E6673]";

  const LEFT_FEATURES = [
    { icon: <Zap className="w-5 h-5" />, title: "Lightning Fast", desc: "Ejecucion de ordenes en microsegundos" },
    { icon: <Shield className="w-5 h-5" />, title: "Seguro", desc: "Proteccion de activos a nivel institucional" },
    { icon: <BarChart3 className="w-5 h-5" />, title: "Liquidez Profunda", desc: "Order book con alta profundidad de mercado" },
    { icon: <Globe className="w-5 h-5" />, title: "Multi-Chain", desc: "Ethereum, Polygon, Base y mas redes" },
  ];

  // ====== FORGOT PASSWORD UI ======
  if (showForgotPassword && forgotStep > 0) {
    return (
      <div className="fixed inset-0 z-[100] flex">
        <div className="absolute inset-0 bg-[#0B0E11]" />
        <button onClick={onClose} className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-[#2B3139]/50 hover:bg-[#2B3139] flex items-center justify-center text-[#848E9C] hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
        <div className="relative w-[480px] shrink-0 hidden lg:flex flex-col overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F0B90B]/10 via-[#0B0E11] to-[#0B0E11]" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F0B90B]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#02C076]/5 rounded-full blur-[100px]" />
          <div className="relative z-10 flex flex-col h-full p-10">
            <div className="mb-12">
              <img src="https://z-cdn-media.chatglm.cn/files/183aca72-652a-4fb0-8148-26b55cfb4f89.png?auth_key=1886312091-670fa9ca9dd04b1cb8bb02406b13d51e-0-7545d0569b9830c4db90f76509462881" alt="GCRM" className="h-9 w-auto object-contain" />
            </div>
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-white leading-tight mb-3">Recupera tu acceso</h2>
              <p className="text-[#848E9C] text-sm leading-relaxed">Restablece tu contrasena de forma segura en pocos pasos.</p>
            </div>
            <div className="space-y-5 flex-1">
              <div className="flex items-start space-x-3.5 group">
                <div className="w-10 h-10 rounded-xl bg-[#F0B90B]/10 group-hover:bg-[#F0B90B]/20 flex items-center justify-center shrink-0 transition text-[#F0B90B]"><Mail className="w-5 h-5" /></div>
                <div><p className="text-sm font-semibold text-white">Verificacion por email</p><p className="text-xs text-[#5E6673] mt-0.5">Recibiras un codigo de 6 digitos</p></div>
              </div>
              <div className="flex items-start space-x-3.5 group">
                <div className="w-10 h-10 rounded-xl bg-[#F0B90B]/10 group-hover:bg-[#F0B90B]/20 flex items-center justify-center shrink-0 transition text-[#F0B90B]"><Shield className="w-5 h-5" /></div>
                <div><p className="text-sm font-semibold text-white">Codigo seguro</p><p className="text-xs text-[#5E6673] mt-0.5">Valido por 15 minutos, un solo uso</p></div>
              </div>
              <div className="flex items-start space-x-3.5 group">
                <div className="w-10 h-10 rounded-xl bg-[#F0B90B]/10 group-hover:bg-[#F0B90B]/20 flex items-center justify-center shrink-0 transition text-[#F0B90B]"><Zap className="w-5 h-5" /></div>
                <div><p className="text-sm font-semibold text-white">Recuperacion rapida</p><p className="text-xs text-[#5E6673] mt-0.5">Nueva contrasena en menos de 1 minuto</p></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#2B3139]/50">
              <div><p className="text-lg font-bold text-white">256-bit</p><p className="text-[10px] text-[#5E6673] mt-0.5">Cifrado SSL</p></div>
              <div><p className="text-lg font-bold text-white">15 min</p><p className="text-[10px] text-[#5E6673] mt-0.5">Validez codigo</p></div>
              <div><p className="text-lg font-bold text-white">24/7</p><p className="text-[10px] text-[#5E6673] mt-0.5">Soporte</p></div>
            </div>
          </div>
        </div>
        <div className="relative flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-[420px]">
            <button type="button" onClick={handleBackToLogin} className="flex items-center space-x-1.5 text-[#848E9C] hover:text-white transition mb-8 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm">Volver al inicio de sesion</span>
            </button>
            <div className="flex items-center space-x-2 mb-8">
              {["Email", "Codigo", "Nueva contrasena"].map((step, idx) => {
                const stepNum = idx + 1;
                const isActive = forgotStep === stepNum;
                const isDone = forgotStep > stepNum || resetSuccess;
                return (
                  <div key={idx} className="flex items-center space-x-2">
                    {idx > 0 && <div className={"w-8 h-0.5 " + (isDone || isActive ? "bg-[#F0B90B]" : "bg-[#2B3139]")} />}
                    <div className="flex items-center space-x-1.5">
                      <div className={"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition " + (isDone ? "bg-[#02C076] text-white" : isActive ? "bg-[#F0B90B] text-black" : "bg-[#2B3139] text-[#5E6673]")}>
                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : stepNum}
                      </div>
                      <span className={"text-xs font-medium hidden sm:inline " + (isActive ? "text-white" : isDone ? "text-[#02C076]" : "text-[#5E6673]")}>{step}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {forgotStep === 1 && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">Recuperar contrasena</h2>
                  <p className="text-[#848E9C] text-sm mt-1.5">Ingresa el email asociado a tu cuenta</p>
                </div>
                <form onSubmit={handleForgotSendCode} className="space-y-4">
                  <div>
                    <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Email</label>
                    <input type="email" placeholder="Ingresa tu email" value={forgotEmail} onChange={(e) => { setForgotEmail(e.target.value); setError(""); }} required className={inputClass} />
                  </div>
                  {error && <div className="bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] text-xs rounded-lg px-4 py-3">{error}</div>}
                  <button type="submit" disabled={loading} className={"w-full py-3.5 rounded-lg font-bold text-sm transition flex items-center justify-center space-x-2 " + (loading ? "bg-[#F0B90B]/50 text-black/50" : "bg-[#F0B90B] text-black hover:bg-[#F8D12F]")}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Enviando...</span></> : <><Mail className="w-4 h-4" /><span>Enviar codigo de verificacion</span></>}
                  </button>
                </form>
              </>
            )}
            {forgotStep === 2 && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">Verificar codigo</h2>
                  <p className="text-[#848E9C] text-sm mt-1.5">Ingresa el codigo de 6 digitos enviado a <span className="text-[#F0B90B] font-medium">{forgotEmail}</span></p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Codigo de verificacion</label>
                    <input type="text" placeholder="000000" value={forgotCode} onChange={(e) => { setForgotCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} maxLength={6} className={inputClass + " tracking-[0.3em] text-center font-mono text-lg"} />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[10px] text-[#5E6673]">El codigo expira en 15 minutos</p>
                      <button type="button" onClick={handleForgotSendCode} disabled={countdown > 0 || loading} className={"text-xs font-medium transition " + (countdown > 0 ? "text-[#5E6673] cursor-not-allowed" : "text-[#F0B90B] hover:underline")}>
                        {countdown > 0 ? `Reenviar en ${countdown}s` : "Reenviar codigo"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Nueva contrasena</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} placeholder="Minimo 8 caracteres" value={forgotNewPassword} onChange={(e) => { setForgotNewPassword(e.target.value); setError(""); }} required minLength={8} className={inputClass + " pr-10"} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E6673] hover:text-[#848E9C] transition">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Confirmar contrasena</label>
                    <input type="password" placeholder="Reingresa tu nueva contrasena" value={forgotConfirmPassword} onChange={(e) => { setForgotConfirmPassword(e.target.value); setError(""); }} required className={inputClass} />
                  </div>
                  {error && <div className="bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] text-xs rounded-lg px-4 py-3">{error}</div>}
                  <button type="submit" disabled={loading} className={"w-full py-3.5 rounded-lg font-bold text-sm transition flex items-center justify-center space-x-2 " + (loading ? "bg-[#F0B90B]/50 text-black/50" : "bg-[#F0B90B] text-black hover:bg-[#F8D12F]")}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Restableciendo...</span></> : <><RotateCcw className="w-4 h-4" /><span>Restablecer contrasena</span></>}
                  </button>
                </form>
              </>
            )}
            {forgotStep === 3 && resetSuccess && (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 rounded-full bg-[#02C076]/10 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-[#02C076]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Contrasena actualizada</h2>
                <p className="text-[#848E9C] text-sm mb-8 max-w-[300px]">Tu contrasena ha sido restablecida exitosamente. Ya puedes iniciar sesion con tu nueva contrasena.</p>
                <button type="button" onClick={handleBackToLogin} className="w-full py-3.5 rounded-lg font-bold text-sm bg-[#F0B90B] text-black hover:bg-[#F8D12F] transition flex items-center justify-center space-x-2">
                  <Lock className="w-4 h-4" /><span>Iniciar sesion ahora</span>
                </button>
              </div>
            )}
            <div className="flex items-center justify-center space-x-1.5 pt-4">
              <Lock className="w-3 h-3 text-[#5E6673]" />
              <span className="text-[10px] text-[#5E6673]">Protegido con cifrado de 256-bit SSL</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-[#0B0E11]" />

      <button onClick={onClose} className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-[#2B3139]/50 hover:bg-[#2B3139] flex items-center justify-center text-[#848E9C] hover:text-white transition">
        <X className="w-5 h-5" />
      </button>

      <div className="relative w-[480px] shrink-0 hidden lg:flex flex-col overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F0B90B]/10 via-[#0B0E11] to-[#0B0E11]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F0B90B]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#02C076]/5 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col h-full p-10">
          <div className="mb-12">
            <img src="https://z-cdn-media.chatglm.cn/files/183aca72-652a-4fb0-8148-26b55cfb4f89.png?auth_key=1886312091-670fa9ca9dd04b1cb8bb02406b13d51e-0-7545d0569b9830c4db90f76509462881" alt="GCRM" className="h-9 w-auto object-contain" />
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Tu puerta de entrada al{" "}
              <span className="text-[#F0B90B]">futuro del trading</span>
            </h2>
            <p className="text-[#848E9C] text-sm leading-relaxed">
              Unete a miles de traders que confian en GCRM Exchange para operar con los mejores activos digitales del mercado.
            </p>
          </div>

          <div className="space-y-5 flex-1">
            {LEFT_FEATURES.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-3.5 group">
                <div className="w-10 h-10 rounded-xl bg-[#F0B90B]/10 group-hover:bg-[#F0B90B]/20 flex items-center justify-center shrink-0 transition text-[#F0B90B]">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-[#5E6673] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#2B3139]/50">
            <div>
              <p className="text-lg font-bold text-white">$2.4B+</p>
              <p className="text-[10px] text-[#5E6673] mt-0.5">Volumen 24h</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">150K+</p>
              <p className="text-[10px] text-[#5E6673] mt-0.5">Traders activos</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">99.99%</p>
              <p className="text-[10px] text-[#5E6673] mt-0.5">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center justify-end mb-8">
            {tab === "login" ? (
              <p className="text-sm text-[#848E9C]">
                {"No tienes una cuenta? "}
                <button type="button" onClick={() => { setTab("register"); resetForm(); }} className="text-[#F0B90B] font-semibold hover:underline">
                  Registrate
                </button>
              </p>
            ) : (
              <p className="text-sm text-[#848E9C]">
                {"Ya tienes una cuenta? "}
                <button type="button" onClick={() => { setTab("login"); resetForm(); }} className="text-[#F0B90B] font-semibold hover:underline">
                  Inicia sesion
                </button>
              </p>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              {tab === "login" ? "Inicia sesion" : "Crea tu cuenta"}
            </h2>
            <p className="text-[#848E9C] text-sm mt-1.5">
              {tab === "login" ? "Bienvenido de vuelta a GCRM Exchange" : "Comienza a operar en minutos"}
            </p>
          </div>

          {tab === "login" && (
            <div className="flex items-center space-x-1 mb-6 bg-[#2B3139] rounded-lg p-1">
              <button onClick={() => setLoginMethod("email")} className={"flex items-center space-x-1.5 flex-1 py-2.5 rounded-md text-xs font-semibold transition " + (loginMethod === "email" ? "bg-[#363C45] text-white" : "text-[#5E6673] hover:text-[#848E9C]")}>
                <Mail className="w-3.5 h-3.5" /><span>Email</span>
              </button>
              <button onClick={() => setLoginMethod("phone")} className={"flex items-center space-x-1.5 flex-1 py-2.5 rounded-md text-xs font-semibold transition " + (loginMethod === "phone" ? "bg-[#363C45] text-white" : "text-[#5E6673] hover:text-[#848E9C]")}>
                <Smartphone className="w-3.5 h-3.5" /><span>Telefono</span>
              </button>
              <button onClick={() => setLoginMethod("qr")} className={"flex items-center space-x-1.5 flex-1 py-2.5 rounded-md text-xs font-semibold transition " + (loginMethod === "qr" ? "bg-[#363C45] text-white" : "text-[#5E6673] hover:text-[#848E9C]")}>
                <QrCode className="w-3.5 h-3.5" /><span>QR Code</span>
              </button>
            </div>
          )}

          {tab === "login" && loginMethod === "qr" && (
            <div className="flex flex-col items-center py-8">
              <div className="w-[180px] h-[180px] bg-white rounded-2xl p-4 mb-5">
                <div className="w-full h-full bg-[#0B0E11] rounded-xl flex items-center justify-center">
                  <QrCode className="w-28 h-28 text-[#F0B90B]" />
                </div>
              </div>
              <p className="text-sm text-white font-semibold mb-1">Escanea con la app de GCRM</p>
              <p className="text-xs text-[#5E6673]">Abre la app GCRM &gt; Escanea QR &gt; Confirmar</p>
            </div>
          )}

          {(tab === "register" || loginMethod !== "qr") && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "register" && (
                <div>
                  <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Nombre (Opcional)</label>
                  <input type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
              )}

              {tab === "login" && loginMethod === "phone" && !verificationSent && (
                <div>
                  <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Numero de telefono</label>
                  <div className="flex space-x-2">
                    <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="bg-[#0B0E11] border border-[#2B3139] rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-[#F0B90B]/50 transition w-24">
                      <option value="+51">+51 Peru</option>
                      <option value="+1">+1 USA</option>
                      <option value="+34">+34 Espana</option>
                      <option value="+52">+52 Mexico</option>
                      <option value="+55">+55 Brasil</option>
                      <option value="+57">+57 Colombia</option>
                    </select>
                    <input type="tel" placeholder="Numero de telefono" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass + " flex-1"} />
                  </div>
                </div>
              )}

              {tab === "login" && loginMethod === "phone" && verificationSent && (
                <div>
                  <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Codigo de verificacion</label>
                  <div className="flex space-x-2">
                    <input type="text" placeholder="Ingresa el codigo de 6 digitos" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} maxLength={6} className={inputClass + " flex-1 tracking-[0.3em] text-center font-mono text-lg"} />
                    <button type="button" onClick={handleSendVerification} className="shrink-0 text-xs text-[#F0B90B] font-semibold hover:underline whitespace-nowrap px-2">Reenviar</button>
                  </div>
                </div>
              )}

              {(tab === "register" || loginMethod === "email") && (
                <div>
                  <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Email</label>
                  <input type="email" placeholder="Ingresa tu email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                </div>
              )}

              {(tab === "register" || loginMethod === "email") && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Contrasena</label>
                    {tab === "login" && (
                      <button type="button" onClick={() => { setShowForgotPassword(true); setForgotStep(1); setError(""); }} className="text-xs text-[#F0B90B] hover:underline">
                        Olvidaste tu contrasena?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder={tab === "login" ? "Ingresa tu contrasena" : "Crea una contrasena (min. 8 caracteres)"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className={inputClass + " pr-10"} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E6673] hover:text-[#848E9C] transition">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {tab === "login" && loginMethod === "phone" && !verificationSent && (
                <button type="button" onClick={handleSendVerification} className="w-full py-3.5 rounded-lg font-bold text-sm bg-[#F0B90B] text-black hover:bg-[#F8D12F] transition flex items-center justify-center space-x-2">
                  <span>Enviar codigo de verificacion</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {tab === "register" && (
                <div>
                  <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Confirmar contrasena</label>
                  <input type="password" placeholder="Reingresa tu contrasena" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClass} />
                </div>
              )}

              {tab === "register" && (
                <div>
                  <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Codigo de referido (Opcional)</label>
                  <input type="text" placeholder="Ingresa codigo de referido" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className={inputClass + " uppercase tracking-wider"} />
                </div>
              )}

              {error && (
                <div className="bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] text-xs rounded-lg px-4 py-3">{error}</div>
              )}

              {tab === "register" && (
                <label className="flex items-start space-x-2.5 cursor-pointer group">
                  <div className="mt-0.5">
                    <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="w-4 h-4 rounded border-[#2B3139] bg-[#0B0E11] accent-[#F0B90B]" />
                  </div>
                  <span className="text-xs text-[#5E6673] leading-relaxed group-hover:text-[#848E9C] transition">
                    {"Acepto los "}<button type="button" onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent('gcrm-navigate', { detail: 'terms' })), 100); }} className="text-[#F0B90B] hover:underline">Terminos de Servicio</button>{" y la "}<button type="button" onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent('gcrm-navigate', { detail: 'terms' })), 100); }} className="text-[#F0B90B] hover:underline">Politica de Privacidad</button>
                  </span>
                </label>
              )}

              {(tab === "register" || (loginMethod === "email" || (loginMethod === "phone" && verificationSent))) && (
                <button type="submit" disabled={loading} className={"w-full py-3.5 rounded-lg font-bold text-sm transition flex items-center justify-center space-x-2 " + (loading ? "bg-[#F0B90B]/50 text-black/50" : "bg-[#F0B90B] text-black hover:bg-[#F8D12F]")}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>{tab === "login" ? "Ingresando..." : "Creando cuenta..."}</span></>
                  ) : tab === "login" ? (
                    <><Lock className="w-4 h-4" /><span>Inicia sesion</span></>
                  ) : (
                    <><UserPlus className="w-4 h-4" /><span>Crear cuenta</span></>
                  )}
                </button>
              )}

              {socialNotice && (
                <div className="flex items-center gap-2 bg-[#F0B90B]/10 border border-[#F0B90B]/20 rounded-lg px-4 py-3 animate-in fade-in">
                  <Info className="w-4 h-4 text-[#F0B90B] shrink-0" />
                  <p className="text-xs text-[#F0B90B]">{socialNotice}</p>
                </div>
              )}

              {tab === "login" && loginMethod === "email" && (
                <div>
                  <div className="relative flex items-center my-2">
                    <div className="flex-1 border-t border-[#2B3139]" />
                    <span className="px-3 text-[10px] text-[#5E6673] uppercase">o continua con</span>
                    <div className="flex-1 border-t border-[#2B3139]" />
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <button type="button" onClick={() => handleSocialLogin("google")} disabled={socialLoading === "google"} className="w-11 h-11 rounded-full bg-[#2B3139] hover:bg-[#363C45] flex items-center justify-center transition disabled:opacity-50">
                      {socialLoading === "google" ? <Loader2 className="w-5 h-5 text-[#4285F4] animate-spin" /> : <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
                    </button>
                    <button type="button" onClick={() => handleSocialLogin("apple")} disabled={socialLoading === "apple"} className="w-11 h-11 rounded-full bg-[#2B3139] hover:bg-[#363C45] flex items-center justify-center transition disabled:opacity-50">
                      {socialLoading === "apple" ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>}
                    </button>
                    <button type="button" onClick={() => handleSocialLogin("twitter")} disabled={socialLoading === "twitter"} className="w-11 h-11 rounded-full bg-[#2B3139] hover:bg-[#363C45] flex items-center justify-center transition disabled:opacity-50">
                      {socialLoading === "twitter" ? <Loader2 className="w-5 h-5 text-[#26A5E4] animate-spin" /> : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#26A5E4"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>}
                    </button>
                    <button type="button" onClick={handleWalletConnect} className="w-11 h-11 rounded-full bg-[#2B3139] hover:bg-[#363C45] flex items-center justify-center transition group/wallet">
                      <Wallet className="w-5 h-5 text-[#848E9C] group-hover/wallet:text-[#F0B90B] transition" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center space-x-1.5 pt-2">
                <Lock className="w-3 h-3 text-[#5E6673]" />
                <span className="text-[10px] text-[#5E6673]">Protegido con cifrado de 256-bit SSL</span>
              </div>
            </form>
          )}

          <div className="lg:hidden mt-8 flex justify-center">
            <img src="https://z-cdn-media.chatglm.cn/files/183aca72-652a-4fb0-8148-26b55cfb4f89.png?auth_key=1886312091-670fa9ca9dd04b1cb8bb02406b13d51e-0-7545d0569b9830c4db90f76509462881" alt="GCRM" className="h-7 w-auto object-contain opacity-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
