"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Lock, Smartphone, Key, Eye, EyeOff, Trash2, Loader2,
  CheckCircle2, AlertTriangle, Monitor, Clock, Fingerprint, Globe,
  Check, X, RefreshCw, Copy, QrCode, Info,
} from "lucide-react";

interface SessionInfo {
  id: string;
  token: string;
  isCurrent: boolean;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
}

interface SecurityData {
  twoFactor: boolean;
  antiPhishingCode: string | null;
  email: string;
  phone: string | null;
  kycLevel: number;
  createdAt: string;
  sessions: SessionInfo[];
}

export default function SecurityContent() {
  const [security, setSecurity] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password change form
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Anti-phishing
  const [showAntiPhishing, setShowAntiPhishing] = useState(false);
  const [antiPhishingInput, setAntiPhishingInput] = useState("");

  // 2FA Google Authenticator
  const [show2FA, setShow2FA] = useState(false);
  const [twoFaStep, setTwoFaStep] = useState<"password" | "qr" | "verify" | "disable">("password");
  const [twoFaPassword, setTwoFaPassword] = useState("");
  const [qrCode, setQrCode] = useState<string>("");
  const [totpSecret, setTotpSecret] = useState<string>("");
  const [totpInput, setTotpInput] = useState("");
  const [disableTotpInput, setDisableTotpInput] = useState("");
  const [secretCopied, setSecretCopied] = useState(false);

  const showMsg = (type: "ok" | "err", text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  const fetchSecurity = useCallback(async () => {
    try {
      const res = await fetch("/api/security");
      if (res.ok) {
        const data = await res.json();
        setSecurity(data.security);
      }
    } catch (e) {
      console.error("Security fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSecurity(); }, [fetchSecurity]);

  async function handleChangePassword() {
    if (newPwd !== confirmPwd) return showMsg("err", "Las contraseñas no coinciden");
    if (newPwd.length < 8) return showMsg("err", "Mínimo 8 caracteres");
    setSaving(true);
    try {
      const res = await fetch("/api/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_password", currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) { showMsg("ok", data.message); setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); setShowPwdForm(false); }
      else showMsg("err", data.error);
    } catch { showMsg("err", "Error de conexión"); } finally { setSaving(false); }
  }

  // Step 1: Verify password to start 2FA setup
  async function handleSetup2FA() {
    setSaving(true);
    try {
      const res = await fetch("/api/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup_2fa", currentPassword: twoFaPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setQrCode(data.qrCode);
        setTotpSecret(data.secret);
        setTwoFaStep("qr");
        setTwoFaPassword("");
      } else {
        showMsg("err", data.error);
      }
    } catch { showMsg("err", "Error de conexión"); } finally { setSaving(false); }
  }

  // Step 2: Verify TOTP code to complete setup
  async function handleEnable2FA() {
    if (totpInput.length !== 6) return showMsg("err", "Ingresa el código de 6 dígitos");
    setSaving(true);
    try {
      const res = await fetch("/api/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable_2fa", totpCode: totpInput }),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg("ok", data.message);
        setShow2FA(false); setTwoFaStep("password"); setTotpInput(""); setQrCode(""); setTotpSecret("");
        fetchSecurity();
      } else {
        showMsg("err", data.error);
      }
    } catch { showMsg("err", "Error de conexión"); } finally { setSaving(false); }
  }

  // Disable 2FA with password + TOTP
  async function handleDisable2FA() {
    setSaving(true);
    try {
      const res = await fetch("/api/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable_2fa", currentPassword: twoFaPassword, totpCode: disableTotpInput }),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg("ok", data.message);
        setShow2FA(false); setTwoFaStep("password"); setTwoFaPassword(""); setDisableTotpInput("");
        fetchSecurity();
      } else {
        showMsg("err", data.error);
      }
    } catch { showMsg("err", "Error de conexión"); } finally { setSaving(false); }
  }

  async function handleSaveAntiPhishing() {
    if (!antiPhishingInput || antiPhishingInput.length < 3) return showMsg("err", "El código debe tener al menos 3 caracteres");
    setSaving(true);
    try {
      const res = await fetch("/api/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_anti_phishing", code: antiPhishingInput }),
      });
      const data = await res.json();
      if (res.ok) { showMsg("ok", data.message); setShowAntiPhishing(false); fetchSecurity(); }
      else showMsg("err", data.error);
    } catch { showMsg("err", "Error de conexión"); } finally { setSaving(false); }
  }

  async function handleRevokeSession(sessionId: string) {
    try {
      const res = await fetch("/api/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_session", sessionId }),
      });
      if (res.ok) { showMsg("ok", "Sesión revocada"); fetchSecurity(); }
    } catch { showMsg("err", "Error al revocar sesión"); }
  }

  async function handleRevokeAll() {
    try {
      const res = await fetch("/api/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_all_sessions" }),
      });
      if (res.ok) { showMsg("ok", "Todas las demás sesiones han sido cerradas"); fetchSecurity(); }
    } catch { showMsg("err", "Error al cerrar sesiones"); }
  }

  function parseUA(ua: string | null): { device: string; browser: string } {
    if (!ua) return { device: "Desconocido", browser: "Desconocido" };
    const isMobile = /Mobile|Android|iPhone/i.test(ua);
    const device = isMobile ? "Móvil" : "Desktop";
    let browser = "Navegador";
    if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = "Chrome";
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
    else if (/Firefox/i.test(ua)) browser = "Firefox";
    else if (/Edge/i.test(ua)) browser = "Edge";
    else if (/OPR/i.test(ua)) browser = "Opera";
    else if (/MetaMask/i.test(ua)) browser = "MetaMask";
    return { device, browser };
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("es-ES", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#F0B90B] animate-spin" />
      </div>
    );
  }

  if (!security) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#848E9C]">
        <Shield className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">Inicia sesión para ver la seguridad</p>
      </div>
    );
  }

  const securityScore = [true, security.kycLevel >= 1, security.twoFactor, !!security.antiPhishingCode].filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-[#F0B90B]" />
          <h1 className="text-xl font-bold text-white">Seguridad</h1>
        </div>
        <button onClick={handleRevokeAll} disabled={security.sessions.length <= 1}
          className="flex items-center space-x-2 px-4 py-2 text-sm text-[#F6465D] hover:bg-[#F6465D]/10 rounded transition disabled:opacity-40 disabled:cursor-not-allowed">
          <Trash2 className="w-4 h-4" /><span>Cerrar otras sesiones</span>
        </button>
      </div>

      {msg && (
        <div className={`flex items-center space-x-2 rounded-lg px-4 py-3 ${msg.type === "ok" ? "bg-[#02C076]/10 border border-[#02C076]/30 text-[#02C076]" : "bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D]"}`}>
          {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span className="text-sm">{msg.text}</span>
        </div>
      )}

      {/* Security Score */}
      <div className="bg-[#1E2329] rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full border-4 border-[#F0B90B] flex items-center justify-center">
            <span className="text-lg font-bold text-[#F0B90B]">{securityScore}/4</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Nivel de Seguridad</p>
            <p className="text-xs text-[#848E9C] mt-0.5">
              {securityScore >= 3 ? "Tu cuenta está bien protegida." : "Mejora tu seguridad activando más protecciones."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: "Contraseña", ok: true },
            { label: "Email verificado", ok: security.kycLevel >= 1 },
            { label: "Google Auth", ok: security.twoFactor },
            { label: "Anti-Phishing", ok: !!security.antiPhishingCode },
          ].map((item) => (
            <div key={item.label} className={`rounded-lg p-2 text-center ${item.ok ? "bg-[#02C076]/10" : "bg-[#2B3139]"}`}>
              {item.ok ? <Check className="w-4 h-4 text-[#02C076] mx-auto" /> : <X className="w-4 h-4 text-[#5E6673] mx-auto" />}
              <p className={`text-[10px] mt-1 ${item.ok ? "text-[#02C076]" : "text-[#5E6673]"}`}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Google Authenticator 2FA */}
      <div className="bg-[#1E2329] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2B3139]">
          <div className="flex items-center space-x-3">
            <Smartphone className={`w-4 h-4 ${security.twoFactor ? "text-[#02C076]" : "text-[#F0B90B]"}`} />
            <div>
              <p className="text-sm font-bold text-white">Google Authenticator</p>
              <p className="text-xs text-[#5E6673]">Autenticación de dos factores con TOTP</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${security.twoFactor ? "bg-[#02C076]/10 text-[#02C076]" : "bg-[#2B3139] text-[#848E9C]"}`}>
              {security.twoFactor ? "ACTIVADO" : "DESACTIVADO"}
            </span>
            <button onClick={() => { setShow2FA(!show2FA); if (!show2FA) setTwoFaStep(security.twoFactor ? "disable" : "password"); }}
              className={`text-xs px-3 py-1 rounded font-semibold transition ${security.twoFactor ? "text-[#F6465D] hover:bg-[#F6465D]/10" : "text-[#F0B90B] hover:bg-[#F0B90B]/10"}`}>
              {security.twoFactor ? "Desactivar" : "Activar"}
            </button>
          </div>
        </div>

        {show2FA && (
          <div className="px-6 py-4 space-y-4 border-b border-[#2B3139] bg-[#181A20]">
            {/* STEP: Enter password to begin setup */}
            {twoFaStep === "password" && !security.twoFactor && (
              <>
                <div className="flex items-start space-x-2 bg-[#F0B90B]/10 border border-[#F0B90B]/30 rounded-lg p-3">
                  <Shield className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-[#F0B90B] font-semibold">Recomendado</p>
                    <p className="text-xs text-[#848E9C] mt-0.5">Google Authenticator añade una capa extra de seguridad. Necesitarás ingresar un código además de tu contraseña al iniciar sesión.</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#5E6673] mb-1 block">Confirma tu contraseña para continuar</label>
                  <input type="password" value={twoFaPassword} onChange={(e) => setTwoFaPassword(e.target.value)} placeholder="Tu contraseña"
                    className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F0B90B]" />
                </div>
                <button onClick={handleSetup2FA} disabled={saving || !twoFaPassword}
                  className="w-full py-2.5 bg-[#F0B90B] text-black font-bold text-sm rounded-lg hover:bg-[#F8D12F] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                  <span>{saving ? "Generando..." : "Generar Código QR"}</span>
                </button>
              </>
            )}

            {/* STEP: Show QR Code + manual key */}
            {twoFaStep === "qr" && (
              <>
                <div className="text-center">
                  <p className="text-sm text-white font-semibold mb-1">Escanea con Google Authenticator</p>
                  <p className="text-xs text-[#848E9C] mb-4">Descarga Google Authenticator desde tu App Store y escanea este código QR</p>
                  <div className="inline-block bg-white rounded-xl p-3 mb-4">
                    {qrCode && <img src={qrCode} alt="QR Code" className="w-52 h-52" />}
                  </div>
                </div>
                <div className="bg-[#2B3139] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-[#848E9C]">Clave manual (si no puedes escanear):</p>
                    <button onClick={() => { navigator.clipboard.writeText(totpSecret); setSecretCopied(true); setTimeout(() => setSecretCopied(false), 2000); }}
                      className="flex items-center space-x-1 text-xs text-[#F0B90B] hover:underline">
                      {secretCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{secretCopied ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>
                  <p className="text-sm text-[#F0B90B] font-mono bg-[#1E2329] rounded px-3 py-2 tracking-widest select-all">{totpSecret}</p>
                </div>
                <button onClick={() => setTwoFaStep("verify")}
                  className="w-full py-2.5 bg-[#02C076] text-white font-bold text-sm rounded-lg hover:bg-[#02C076]/80 transition flex items-center justify-center space-x-2">
                  <Check className="w-4 h-4" /><span>Ya escaneé el código, continuar</span>
                </button>
              </>
            )}

            {/* STEP: Verify TOTP code */}
            {twoFaStep === "verify" && (
              <>
                <div className="flex items-start space-x-2 bg-[#02C076]/10 border border-[#02C076]/30 rounded-lg p-3">
                  <Info className="w-4 h-4 text-[#02C076] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#848E9C]">Ingresa el código de 6 dígitos que muestra Google Authenticator para verificar la configuración.</p>
                </div>
                <div>
                  <label className="text-xs text-[#5E6673] mb-1 block">Código de verificación</label>
                  <input type="text" value={totpInput} onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000" maxLength={6}
                    className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2.5 text-sm text-white text-center font-mono text-xl tracking-[0.3em] focus:outline-none focus:border-[#F0B90B]" />
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => setTwoFaStep("qr")}
                    className="flex-1 py-2.5 text-sm text-[#848E9C] hover:text-white border border-[#363C45] rounded-lg transition">
                    Atrás
                  </button>
                  <button onClick={handleEnable2FA} disabled={saving || totpInput.length !== 6}
                    className="flex-1 py-2.5 bg-[#F0B90B] text-black font-bold text-sm rounded-lg hover:bg-[#F8D12F] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{saving ? "Verificando..." : "Activar"}</span>
                  </button>
                </div>
              </>
            )}

            {/* DISABLE 2FA */}
            {twoFaStep === "disable" && security.twoFactor && (
              <>
                <div className="flex items-start space-x-2 bg-[#F6465D]/10 border border-[#F6465D]/30 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-[#F6465D] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-[#F6465D] font-semibold">Advertencia</p>
                    <p className="text-xs text-[#848E9C] mt-0.5">Desactivar Google Authenticator reduce la seguridad de tu cuenta.</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#5E6673] mb-1 block">Confirma tu contraseña</label>
                  <input type="password" value={twoFaPassword} onChange={(e) => setTwoFaPassword(e.target.value)} placeholder="Tu contraseña"
                    className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F0B90B]" />
                </div>
                <div>
                  <label className="text-xs text-[#5E6673] mb-1 block">Código de Google Authenticator</label>
                  <input type="text" value={disableTotpInput} onChange={(e) => setDisableTotpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000" maxLength={6}
                    className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2.5 text-sm text-white text-center font-mono text-xl tracking-[0.3em] focus:outline-none focus:border-[#F0B90B]" />
                </div>
                <button onClick={handleDisable2FA} disabled={saving || !twoFaPassword || disableTotpInput.length !== 6}
                  className="w-full py-2.5 bg-[#F6465D] text-white font-bold text-sm rounded-lg hover:bg-[#F6465D]/80 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  <span>{saving ? "Procesando..." : "Desactivar Google Authenticator"}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-[#1E2329] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2B3139]">
          <div className="flex items-center space-x-3">
            <Lock className="w-4 h-4 text-[#F0B90B]" />
            <div>
              <p className="text-sm font-bold text-white">Contraseña de Inicio de Sesión</p>
              <p className="text-xs text-[#5E6673]">Cambia tu contraseña regularmente para mayor seguridad</p>
            </div>
          </div>
          <button onClick={() => setShowPwdForm(!showPwdForm)} className="text-xs text-[#F0B90B] hover:underline">
            {showPwdForm ? "Cancelar" : "Cambiar"}
          </button>
        </div>
        {showPwdForm && (
          <div className="px-6 py-4 space-y-3 border-b border-[#2B3139] bg-[#181A20]">
            <div className="relative">
              <label className="text-xs text-[#5E6673] mb-1 block">Contraseña actual</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="Ingresa tu contraseña actual"
                  className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-[#F0B90B]" />
                <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E6673] hover:text-white">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="relative">
              <label className="text-xs text-[#5E6673] mb-1 block">Nueva contraseña</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Mínimo 8 caracteres"
                  className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-[#F0B90B]" />
                <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E6673] hover:text-white">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-[#5E6673] mb-1 block">Confirmar nueva contraseña</label>
              <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Repite la nueva contraseña"
                className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F0B90B]" />
              {confirmPwd && newPwd !== confirmPwd && <p className="text-xs text-[#F6465D] mt-1">Las contraseñas no coinciden</p>}
            </div>
            <button onClick={handleChangePassword} disabled={saving || !currentPwd || !newPwd || newPwd !== confirmPwd}
              className="w-full py-2.5 bg-[#F0B90B] text-black font-bold text-sm rounded-lg hover:bg-[#F8D12F] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{saving ? "Actualizando..." : "Confirmar cambio de contraseña"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Anti-Phishing Code */}
      <div className="bg-[#1E2329] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2B3139]">
          <div className="flex items-center space-x-3">
            <Fingerprint className={`w-4 h-4 ${security.antiPhishingCode ? "text-[#02C076]" : "text-[#848E9C]"}`} />
            <div>
              <p className="text-sm font-bold text-white">Código Anti-Phishing</p>
              <p className="text-xs text-[#5E6673]">Verifica que los emails de GCRM son auténticos</p>
            </div>
          </div>
          <button onClick={() => setShowAntiPhishing(!showAntiPhishing)} className="text-xs text-[#F0B90B] hover:underline">
            {security.antiPhishingCode ? "Modificar" : "Configurar"}
          </button>
        </div>
        {showAntiPhishing && (
          <div className="px-6 py-4 space-y-3 border-b border-[#2B3139] bg-[#181A20]">
            <p className="text-xs text-[#848E9C] leading-relaxed">
              El código anti-phishing se incluirá en todos los emails legítimos de GCRM Exchange. Si no ves este código en un email, podría ser un intento de phishing.
            </p>
            <div>
              <label className="text-xs text-[#5E6673] mb-1 block">Código Anti-Phishing (3-20 caracteres)</label>
              <input type="text" value={antiPhishingInput} onChange={(e) => setAntiPhishingInput(e.target.value.slice(0, 20))} placeholder="Ej: MiCodigo123"
                className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F0B90B]" />
            </div>
            <button onClick={handleSaveAntiPhishing} disabled={saving || !antiPhishingInput || antiPhishingInput.length < 3}
              className="w-full py-2.5 bg-[#F0B90B] text-black font-bold text-sm rounded-lg hover:bg-[#F8D12F] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{saving ? "Guardando..." : "Guardar código"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Device Management */}
      <div className="bg-[#1E2329] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2B3139]">
          <div className="flex items-center space-x-3">
            <Monitor className="w-4 h-4 text-[#F0B90B]" />
            <div>
              <p className="text-sm font-bold text-white">Gestión de Dispositivos</p>
              <p className="text-xs text-[#5E6673]">Administra las sesiones activas en tu cuenta</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-[#2B3139] max-h-80 overflow-y-auto">
          {security.sessions.length === 0 ? (
            <div className="px-6 py-8 text-center text-[#5E6673] text-sm">No hay sesiones activas</div>
          ) : (
            security.sessions.map((session) => {
              const { device, browser } = parseUA(session.userAgent);
              return (
                <div key={session.id} className="flex items-center justify-between px-6 py-3 hover:bg-[#2B3139]/50 transition">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${session.isCurrent ? "bg-[#02C076]/10" : "bg-[#2B3139]"}`}>
                      {device === "Móvil" ? <Smartphone className={`w-4 h-4 ${session.isCurrent ? "text-[#02C076]" : "text-[#848E9C]"}`} /> : <Monitor className={`w-4 h-4 ${session.isCurrent ? "text-[#02C076]" : "text-[#848E9C]"}`} />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-white font-medium">{browser} - {device}</p>
                        {session.isCurrent && <span className="text-[10px] bg-[#02C076]/10 text-[#02C076] px-1.5 py-0.5 rounded font-semibold">Actual</span>}
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <Clock className="w-3 h-3 text-[#5E6673]" />
                        <span className="text-xs text-[#5E6673]">{formatDate(session.createdAt)}</span>
                        {session.ip && (<><span className="text-xs text-[#363C45]">|</span><Globe className="w-3 h-3 text-[#5E6673]" /><span className="text-xs text-[#5E6673]">{session.ip}</span></>)}
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button onClick={() => handleRevokeSession(session.id)} className="flex items-center space-x-1 text-xs text-[#F6465D] hover:bg-[#F6465D]/10 px-2 py-1 rounded transition">
                      <X className="w-3 h-3" /><span>Cerrar</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
