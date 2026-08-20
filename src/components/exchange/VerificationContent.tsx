"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield, ShieldCheck, ShieldX, ShieldAlert, Upload, Camera,
  CheckCircle2, AlertCircle, Loader2, ChevronRight, User, FileText,
  Home, Mail, Clock, IdCard, CreditCard, Globe, Check, X, Eye,
  Image as ImageIcon, RefreshCw, BadgeCheck, Star, Award, Lock, Unlock,
} from "lucide-react";

const DOC_TYPES = [
  { value: "passport", label: "Pasaporte", icon: <Globe className="w-5 h-5" /> },
  { value: "dni", label: "DNI / Cédula", icon: <IdCard className="w-5 h-5" /> },
  { value: "driver_license", label: "Licencia de Conducir", icon: <CreditCard className="w-5 h-5" /> },
];

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica",
  "Cuba", "Ecuador", "El Salvador", "España", "Estados Unidos",
  "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay",
  "Perú", "Puerto Rico", "Uruguay", "Venezuela", "Otro",
];

interface LevelInfo {
  level: number;
  name: string;
  description: string;
  status: string;
  currentLevel: boolean;
  documentType?: string | null;
  rejectReason?: string | null;
}

interface SubmissionInfo {
  id: string;
  level: number;
  status: string;
  documentType?: string | null;
  documentNumber?: string | null;
  fullName?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  rejectReason?: string | null;
}

interface VerificationData {
  kycLevel: number;
  levels: LevelInfo[];
  submissions: SubmissionInfo[];
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function VerificationContent() {
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Level 2 form
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  // Level 3 form
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [addressProofPreview, setAddressProofPreview] = useState<string | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const proofRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/verification");
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error("Verification fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function showMsg(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, target: "front" | "back" | "selfie" | "proof") {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return showMsg("err", "El archivo no debe superar 10MB");
    const b64 = await fileToBase64(file);
    if (target === "front") { setFrontFile(file); setFrontPreview(b64); }
    else if (target === "back") { setBackFile(file); setBackPreview(b64); }
    else if (target === "selfie") { setSelfieFile(file); setSelfiePreview(b64); }
    else { setAddressProofFile(file); setAddressProofPreview(b64); }
  }

  async function submitLevel1() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/verification", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 1 }),
      });
      const d = await res.json();
      if (res.ok) { showMsg("ok", d.message); fetchData(); }
      else showMsg("err", d.error);
    } catch { showMsg("err", "Error de conexión"); }
    finally { setSubmitting(false); }
  }

  async function submitLevel2() {
    if (!docType || !docNumber || !fullName || !dob || !frontFile || !selfieFile) {
      return showMsg("err", "Completa todos los campos requeridos");
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        level: 2, documentType: docType, documentNumber: docNumber,
        fullName, dob,
        documentFront: frontPreview,
        documentBack: backPreview,
        selfieWithId: selfiePreview,
      };
      const res = await fetch("/api/verification", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const d = await res.json();
      if (res.ok) { showMsg("ok", d.message); setActiveLevel(null); fetchData(); }
      else showMsg("err", d.error);
    } catch { showMsg("err", "Error de conexión"); }
    finally { setSubmitting(false); }
  }

  async function submitLevel3() {
    if (!address || !city || !addressProofFile) {
      return showMsg("err", "Completa todos los campos requeridos");
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/verification", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: 3, address, city, addressProof: addressProofPreview,
        }),
      });
      const d = await res.json();
      if (res.ok) { showMsg("ok", d.message); setActiveLevel(null); fetchData(); }
      else showMsg("err", d.error);
    } catch { showMsg("err", "Error de conexión"); }
    finally { setSubmitting(false); }
  }

  function resetForm() {
    setActiveLevel(null);
    setDocType(""); setDocNumber(""); setFullName(""); setDob("");
    setFrontPreview(null); setBackPreview(null); setSelfiePreview(null);
    setFrontFile(null); setBackFile(null); setSelfieFile(null);
    setAddress(""); setCity(""); setAddressProofPreview(null); setAddressProofFile(null);
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

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#848E9C]">
        <Shield className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">Inicia sesión para ver la verificación</p>
      </div>
    );
  }

  const kyc = data.kycLevel;
  const levelInfo = (lvl: number) => data.levels.find((l) => l.level === lvl);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-[#F0B90B]" />
          <h1 className="text-xl font-bold text-white">Verificación de Identidad (KYC)</h1>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${kyc >= 2 ? "bg-[#02C076]/10" : kyc >= 1 ? "bg-[#F0B90B]/10" : "bg-[#2B3139]"}`}>
          {kyc >= 2 ? <ShieldCheck className="w-4 h-4 text-[#02C076]" /> : kyc >= 1 ? <Shield className="w-4 h-4 text-[#F0B90B]" /> : <ShieldX className="w-4 h-4 text-[#848E9C]" />}
          <span className={`text-sm font-bold ${kyc >= 2 ? "text-[#02C076]" : kyc >= 1 ? "text-[#F0B90B]" : "text-[#848E9C]"}`}>
            Nivel {kyc}/3
          </span>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center space-x-2 rounded-lg px-4 py-3 ${msg.type === "ok" ? "bg-[#02C076]/10 border border-[#02C076]/30 text-[#02C076]" : "bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D]"}`}>
          {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="text-sm">{msg.text}</span>
        </div>
      )}

      {/* Benefits Banner */}
      <div className="bg-gradient-to-r from-[#F0B90B]/10 to-[#F8D12F]/5 border border-[#F0B90B]/20 rounded-xl p-5">
        <div className="flex items-start space-x-3">
          <Award className="w-6 h-6 text-[#F0B90B] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-white">Beneficios de Verificar tu Cuenta</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {[
                { icon: <Unlock className="w-4 h-4" />, text: "Retiros ilimitados" },
                { icon: <Star className="w-4 h-4" />, text: "Acceso a programas VIP" },
                { icon: <Lock className="w-4 h-4" />, text: "Mayor seguridad" },
              ].map((b, i) => (
                <div key={i} className="flex items-center space-x-2 text-xs text-[#848E9C]">
                  <span className="text-[#F0B90B]">{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#1E2329] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-white">Progreso de Verificación</span>
          <span className="text-xs text-[#5E6673]">{kyc}/3 niveles completados</span>
        </div>
        <div className="flex items-center space-x-2">
          {[1, 2, 3].map((lvl) => {
            const info = levelInfo(lvl);
            const done = info?.currentLevel || info?.status === "approved";
            const active = !done;
            return (
              <div key={lvl} className="flex-1 flex items-center space-x-2">
                <div className={`w-full flex items-center space-x-2 px-3 py-3 rounded-lg transition ${done ? "bg-[#02C076]/10 border border-[#02C076]/30" : active ? "bg-[#2B3139] border border-[#363C45]" : "bg-[#1E2329] border border-[#2B3139] opacity-60"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-[#02C076]" : active ? "bg-[#363C45]" : "bg-[#2B3139]"}`}>
                    {done ? <Check className="w-4 h-4 text-white" /> : <span className="text-xs font-bold text-[#848E9C]">{lvl}</span>}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${done ? "text-[#02C076]" : active ? "text-white" : "text-[#5E6673]"}`}>{info?.name}</p>
                    <p className="text-[10px] text-[#5E6673] truncate">{info?.description}</p>
                  </div>
                </div>
                {lvl < 3 && <ChevronRight className="w-4 h-4 text-[#363C45] shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Level Cards */}
      <div className="space-y-4">
        {/* Level 1 */}
        {(() => {
          const info = levelInfo(1);
          const done = info?.currentLevel || false;
          return (
            <div className="bg-[#1E2329] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B3139]">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done ? "bg-[#02C076]" : "bg-[#F0B90B]/10"}`}>
                    <Mail className={`w-5 h-5 ${done ? "text-white" : "text-[#F0B90B]"}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-bold text-white">Nivel 1: Verificación de Email</p>
                      {done && <BadgeCheck className="w-4 h-4 text-[#02C076]" />}
                    </div>
                    <p className="text-xs text-[#5E6673]">Confirma tu dirección de email registrada</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${done ? "bg-[#02C076]/10 text-[#02C076]" : "bg-[#F0B90B]/10 text-[#F0B90B]"}`}>
                    {done ? "COMPLETADO" : "PENDIENTE"}
                  </span>
                </div>
              </div>
              {!done && activeLevel !== 1 && (
                <div className="px-5 py-4 flex items-center justify-between">
                  <p className="text-xs text-[#848E9C]">Verifica tu email para acceder a más funciones del exchange</p>
                  <button onClick={() => setActiveLevel(1)} className="flex items-center space-x-2 px-4 py-2 bg-[#F0B90B] text-black font-bold text-xs rounded-lg hover:bg-[#F8D12F] transition">
                    <Check className="w-3.5 h-3.5" /><span>Verificar Email</span>
                  </button>
                </div>
              )}
              {activeLevel === 1 && !done && (
                <div className="px-5 py-4 bg-[#181A20] space-y-3 border-b border-[#2B3139]">
                  <div className="flex items-start space-x-2 bg-[#F0B90B]/10 border border-[#F0B90B]/30 rounded-lg p-3">
                    <Shield className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#848E9C]">Al confirmar, certificas que este email te pertenece y aceptas los términos de GCRM Exchange.</p>
                  </div>
                  <button onClick={submitLevel1} disabled={submitting} className="w-full py-2.5 bg-[#F0B90B] text-black font-bold text-sm rounded-lg hover:bg-[#F8D12F] transition disabled:opacity-60 flex items-center justify-center space-x-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{submitting ? "Verificando..." : "Confirmar Verificación de Email"}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Level 2 */}
        {(() => {
          const info = levelInfo(2);
          const locked = data.kycLevel < 1;
          const done = info?.currentLevel || false;
          const pending = info?.status === "pending" || info?.status === "review";
          const rejected = info?.status === "rejected";
          return (
            <div className={`bg-[#1E2329] rounded-xl overflow-hidden ${locked ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B3139]">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done ? "bg-[#02C076]" : pending ? "bg-[#F0B90B]/10" : locked ? "bg-[#2B3139]" : "bg-[#F0B90B]/10"}`}>
                    {done ? <ShieldCheck className="w-5 h-5 text-white" /> : pending ? <Clock className="w-5 h-5 text-[#F0B90B]" /> : <FileText className={`w-5 h-5 ${locked ? "text-[#5E6673]" : "text-[#F0B90B]"}`} />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-bold text-white">Nivel 2: Verificación de Identidad</p>
                      {done && <BadgeCheck className="w-4 h-4 text-[#02C076]" />}
                    </div>
                    <p className="text-xs text-[#5E6673]">Sube tu documento de identidad y una selfie</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {pending && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F0B90B]/10 text-[#F0B90B]">EN REVISIÓN</span>}
                  {rejected && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F6465D]/10 text-[#F6465D]">RECHAZADO</span>}
                  {done && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#02C076]/10 text-[#02C076]">COMPLETADO</span>}
                  {!done && !pending && !rejected && !locked && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F0B90B]/10 text-[#F0B90B]">DISPONIBLE</span>}
                  {locked && <Lock className="w-4 h-4 text-[#5E6673]" />}
                </div>
              </div>
              {rejected && info?.rejectReason && (
                <div className="mx-5 mt-3 flex items-start space-x-2 bg-[#F6465D]/10 border border-[#F6465D]/30 rounded-lg p-3">
                  <ShieldAlert className="w-4 h-4 text-[#F6465D] shrink-0 mt-0.5" />
                  <div><p className="text-xs text-[#F6465D] font-semibold">Razón del rechazo</p><p className="text-xs text-[#848E9C] mt-0.5">{info.rejectReason}</p></div>
                </div>
              )}
              {!done && !pending && !locked && activeLevel !== 2 && (
                <div className="px-5 py-4 flex items-center justify-between">
                  <p className="text-xs text-[#848E9C]">Verifica tu identidad para aumentar tus límites de retiro</p>
                  <button onClick={() => setActiveLevel(2)} className="flex items-center space-x-2 px-4 py-2 bg-[#F0B90B] text-black font-bold text-xs rounded-lg hover:bg-[#F8D12F] transition">
                    <Upload className="w-3.5 h-3.5" /><span>Comenzar</span>
                  </button>
                </div>
              )}
              {activeLevel === 2 && !done && !pending && (
                <div className="px-5 py-4 bg-[#181A20] space-y-4 border-b border-[#2B3139]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">Datos del Documento</p>
                    <button onClick={resetForm} className="text-xs text-[#848E9C] hover:text-white">Cancelar</button>
                  </div>
                  {/* Document Type */}
                  <div>
                    <label className="text-xs text-[#5E6673] mb-1.5 block">Tipo de Documento *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {DOC_TYPES.map((dt) => (
                        <button key={dt.value} onClick={() => setDocType(dt.value)} className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition ${docType === dt.value ? "border-[#F0B90B] bg-[#F0B90B]/10 text-[#F0B90B]" : "border-[#363C45] text-[#848E9C] hover:border-[#5E6673]"}`}>
                          {dt.icon}<span>{dt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#5E6673] mb-1 block">Nombre Completo *</label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Como aparece en tu documento" className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F0B90B]" />
                    </div>
                    <div>
                      <label className="text-xs text-[#5E6673] mb-1 block">Número de Documento *</label>
                      <input type="text" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="Ej: 12345678" className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F0B90B]" />
                    </div>
                    <div>
                      <label className="text-xs text-[#5E6673] mb-1 block">Fecha de Nacimiento *</label>
                      <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F0B90B]" />
                    </div>
                  </div>
                  {/* Upload Sections */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Front */}
                    <div>
                      <label className="text-xs text-[#5E6673] mb-1.5 block">Frente del Documento *</label>
                      <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "front")} />
                      {frontPreview ? (
                        <div className="relative rounded-lg overflow-hidden border border-[#02C076]/30">
                          <img src={frontPreview} alt="Front" className="w-full h-40 object-cover" />
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <button onClick={() => frontRef.current?.click()} className="w-6 h-6 rounded bg-black/60 flex items-center justify-center"><RefreshCw className="w-3 h-3 text-white" /></button>
                            <button onClick={() => { setFrontPreview(null); setFrontFile(null); }} className="w-6 h-6 rounded bg-black/60 flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-[#02C076]/80 text-white text-[10px] px-2 py-0.5 rounded font-semibold flex items-center space-x-1"><Check className="w-3 h-3" />Subido</div>
                        </div>
                      ) : (
                        <button onClick={() => frontRef.current?.click()} className="w-full h-40 rounded-lg border-2 border-dashed border-[#363C45] hover:border-[#F0B90B] flex flex-col items-center justify-center transition text-[#5E6673] hover:text-[#F0B90B]">
                          <Upload className="w-6 h-6 mb-1" /><span className="text-xs">Subir frente</span>
                        </button>
                      )}
                    </div>
                    {/* Back */}
                    <div>
                      <label className="text-xs text-[#5E6673] mb-1.5 block">Dorso del Documento</label>
                      <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "back")} />
                      {backPreview ? (
                        <div className="relative rounded-lg overflow-hidden border border-[#02C076]/30">
                          <img src={backPreview} alt="Back" className="w-full h-40 object-cover" />
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <button onClick={() => backRef.current?.click()} className="w-6 h-6 rounded bg-black/60 flex items-center justify-center"><RefreshCw className="w-3 h-3 text-white" /></button>
                            <button onClick={() => { setBackPreview(null); setBackFile(null); }} className="w-6 h-6 rounded bg-black/60 flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-[#02C076]/80 text-white text-[10px] px-2 py-0.5 rounded font-semibold flex items-center space-x-1"><Check className="w-3 h-3" />Subido</div>
                        </div>
                      ) : (
                        <button onClick={() => backRef.current?.click()} className="w-full h-40 rounded-lg border-2 border-dashed border-[#363C45] hover:border-[#F0B90B] flex flex-col items-center justify-center transition text-[#5E6673] hover:text-[#F0B90B]">
                          <Upload className="w-6 h-6 mb-1" /><span className="text-xs">Subir dorso (opcional)</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Selfie */}
                  <div>
                    <label className="text-xs text-[#5E6673] mb-1.5 block">Selfie con Documento *</label>
                    <input ref={selfieRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "selfie")} />
                    {selfiePreview ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[#02C076]/30">
                        <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 flex space-x-1">
                          <button onClick={() => selfieRef.current?.click()} className="w-5 h-5 rounded bg-black/60 flex items-center justify-center"><RefreshCw className="w-2.5 h-2.5 text-white" /></button>
                          <button onClick={() => { setSelfiePreview(null); setSelfieFile(null); }} className="w-5 h-5 rounded bg-black/60 flex items-center justify-center"><X className="w-2.5 h-2.5 text-white" /></button>
                        </div>
                        <div className="absolute bottom-1 left-1 bg-[#02C076]/80 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold">OK</div>
                      </div>
                    ) : (
                      <button onClick={() => selfieRef.current?.click()} className="w-32 h-32 rounded-lg border-2 border-dashed border-[#363C45] hover:border-[#F0B90B] flex flex-col items-center justify-center transition text-[#5E6673] hover:text-[#F0B90B]">
                        <Camera className="w-6 h-6 mb-1" /><span className="text-[10px]">Selfie</span>
                      </button>
                    )}
                    <p className="text-[10px] text-[#5E6673] mt-1">Toma una foto sosteniendo tu documento junto a tu rostro</p>
                  </div>
                  <button onClick={submitLevel2} disabled={submitting || !docType || !docNumber || !fullName || !dob || !frontFile || !selfieFile} className="w-full py-2.5 bg-[#F0B90B] text-black font-bold text-sm rounded-lg hover:bg-[#F8D12F] transition disabled:opacity-60 flex items-center justify-center space-x-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{submitting ? "Enviando..." : "Enviar Verificación de Identidad"}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Level 3 */}
        {(() => {
          const info = levelInfo(3);
          const locked = data.kycLevel < 2;
          const done = info?.currentLevel || false;
          const pending = info?.status === "pending" || info?.status === "review";
          const rejected = info?.status === "rejected";
          return (
            <div className={`bg-[#1E2329] rounded-xl overflow-hidden ${locked ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B3139]">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done ? "bg-[#02C076]" : pending ? "bg-[#F0B90B]/10" : locked ? "bg-[#2B3139]" : "bg-[#F0B90B]/10"}`}>
                    {done ? <ShieldCheck className="w-5 h-5 text-white" /> : pending ? <Clock className="w-5 h-5 text-[#F0B90B]" /> : <Home className={`w-5 h-5 ${locked ? "text-[#5E6673]" : "text-[#F0B90B]"}`} />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-bold text-white">Nivel 3: Verificación de Dirección</p>
                      {done && <BadgeCheck className="w-4 h-4 text-[#02C076]" />}
                    </div>
                    <p className="text-xs text-[#5E6673]">Confirma tu dirección con un comprobante de residencia</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {pending && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F0B90B]/10 text-[#F0B90B]">EN REVISIÓN</span>}
                  {rejected && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F6465D]/10 text-[#F6465D]">RECHAZADO</span>}
                  {done && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#02C076]/10 text-[#02C076]">COMPLETADO</span>}
                  {!done && !pending && !rejected && !locked && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F0B90B]/10 text-[#F0B90B]">DISPONIBLE</span>}
                  {locked && <Lock className="w-4 h-4 text-[#5E6673]" />}
                </div>
              </div>
              {rejected && info?.rejectReason && (
                <div className="mx-5 mt-3 flex items-start space-x-2 bg-[#F6465D]/10 border border-[#F6465D]/30 rounded-lg p-3">
                  <ShieldAlert className="w-4 h-4 text-[#F6465D] shrink-0 mt-0.5" />
                  <div><p className="text-xs text-[#F6465D] font-semibold">Razón del rechazo</p><p className="text-xs text-[#848E9C] mt-0.5">{info.rejectReason}</p></div>
                </div>
              )}
              {!done && !pending && !locked && activeLevel !== 3 && (
                <div className="px-5 py-4 flex items-center justify-between">
                  <p className="text-xs text-[#848E9C]">Sube un comprobante para verificar tu dirección de residencia</p>
                  <button onClick={() => setActiveLevel(3)} className="flex items-center space-x-2 px-4 py-2 bg-[#F0B90B] text-black font-bold text-xs rounded-lg hover:bg-[#F8D12F] transition">
                    <Upload className="w-3.5 h-3.5" /><span>Comenzar</span>
                  </button>
                </div>
              )}
              {activeLevel === 3 && !done && !pending && (
                <div className="px-5 py-4 bg-[#181A20] space-y-4 border-b border-[#2B3139]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">Datos de Dirección</p>
                    <button onClick={resetForm} className="text-xs text-[#848E9C] hover:text-white">Cancelar</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#5E6673] mb-1 block">Dirección Completa *</label>
                      <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, número, apartamento" className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F0B90B]" />
                    </div>
                    <div>
                      <label className="text-xs text-[#5E6673] mb-1 block">Ciudad *</label>
                      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tu ciudad" className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F0B90B]" />
                    </div>
                  </div>
                  {/* Address Proof Upload */}
                  <div>
                    <label className="text-xs text-[#5E6673] mb-1.5 block">Comprobante de Dirección *</label>
                    <p className="text-[10px] text-[#5E6673] mb-2">Recibo de luz, agua, gas, o extracto bancario (no mayor a 3 meses)</p>
                    <input ref={proofRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileSelect(e, "proof")} />
                    {addressProofPreview ? (
                      <div className="relative w-full max-w-xs rounded-lg overflow-hidden border border-[#02C076]/30">
                        {addressProofPreview.startsWith("data:application/pdf") ? (
                          <div className="w-full h-40 bg-[#2B3139] flex flex-col items-center justify-center">
                            <FileText className="w-8 h-8 text-[#F0B90B]" /><span className="text-xs text-[#848E9C] mt-1">PDF cargado</span>
                          </div>
                        ) : (
                          <img src={addressProofPreview} alt="Proof" className="w-full h-40 object-cover" />
                        )}
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <button onClick={() => proofRef.current?.click()} className="w-6 h-6 rounded bg-black/60 flex items-center justify-center"><RefreshCw className="w-3 h-3 text-white" /></button>
                          <button onClick={() => { setAddressProofPreview(null); setAddressProofFile(null); }} className="w-6 h-6 rounded bg-black/60 flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-[#02C076]/80 text-white text-[10px] px-2 py-0.5 rounded font-semibold flex items-center space-x-1"><Check className="w-3 h-3" />Subido</div>
                      </div>
                    ) : (
                      <button onClick={() => proofRef.current?.click()} className="w-full max-w-xs h-40 rounded-lg border-2 border-dashed border-[#363C45] hover:border-[#F0B90B] flex flex-col items-center justify-center transition text-[#5E6673] hover:text-[#F0B90B]">
                        <Upload className="w-6 h-6 mb-1" /><span className="text-xs">Subir comprobante</span>
                      </button>
                    )}
                  </div>
                  <button onClick={submitLevel3} disabled={submitting || !address || !city || !addressProofFile} className="w-full py-2.5 bg-[#F0B90B] text-black font-bold text-sm rounded-lg hover:bg-[#F8D12F] transition disabled:opacity-60 flex items-center justify-center space-x-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{submitting ? "Enviando..." : "Enviar Verificación de Dirección"}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Submission History */}
      {data.submissions.length > 0 && (
        <div className="bg-[#1E2329] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2B3139]">
            <p className="text-sm font-bold text-white">Historial de Verificaciones</p>
          </div>
          <div className="divide-y divide-[#2B3139] max-h-60 overflow-y-auto">
            {data.submissions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sub.status === "approved" ? "bg-[#02C076]/10" : sub.status === "rejected" ? "bg-[#F6465D]/10" : "bg-[#F0B90B]/10"}`}>
                    {sub.status === "approved" ? <CheckCircle2 className="w-4 h-4 text-[#02C076]" /> : sub.status === "rejected" ? <X className="w-4 h-4 text-[#F6465D]" /> : <Clock className="w-4 h-4 text-[#F0B90B]" />}
                  </div>
                  <div>
                    <p className="text-xs text-white font-medium">Nivel {sub.level} - {sub.status === "approved" ? "Aprobado" : sub.status === "rejected" ? "Rechazado" : "En revisión"}</p>
                    <p className="text-[10px] text-[#5E6673]">{formatDate(sub.createdAt)}</p>
                  </div>
                </div>
                {sub.rejectReason && <span className="text-[10px] text-[#F6465D] max-w-[200px] truncate">{sub.rejectReason}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
