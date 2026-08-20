"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  User, Mail, Phone, Globe, Copy, Check, Camera, Save, Loader2,
  Shield, Calendar, Users, Award, Edit3, CheckCircle2, X, Upload,
} from "lucide-react";

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica",
  "Cuba", "Dominicana", "Ecuador", "El Salvador", "España", "Estados Unidos",
  "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay",
  "Perú", "Puerto Rico", "Uruguay", "Venezuela", "Otro",
];

const KYC_LABELS: Record<number, { label: string; color: string; desc: string }> = {
  0: { label: "No verificado", color: "text-[#848E9C]", desc: "Completa la verificación para acceder a todas las funciones" },
  1: { label: "Email verificado", color: "text-[#F0B90B]", desc: "Tu email ha sido verificado" },
  2: { label: "Identidad verificada", color: "text-[#02C076]", desc: "Tu identidad ha sido verificada completamente" },
  3: { label: "Dirección verificada", color: "text-[#02C076]", desc: "Tu cuenta está completamente verificada" },
};

interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  country: string | null;
  avatar: string | null;
  role: string;
  kycLevel: number;
  referralCode: string | null;
  antiPhishingCode: string | null;
  createdAt: string;
  activeSessions: number;
}

export default function ProfileContent() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCountry, setFormCountry] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setFormName(data.profile.name || "");
        setFormPhone(data.profile.phone || "");
        setFormCountry(data.profile.country || "");
        if (data.profile.avatar) setAvatarPreview(data.profile.avatar);
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const payload: Record<string, string> = { name: formName, phone: formPhone, country: formCountry };
      if (avatarPreview && avatarPreview !== profile?.avatar) payload.avatar = avatarPreview;
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaved(true);
        setEditing(false);
        fetchProfile();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error("Profile save error:", e);
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarClick() {
    if (editing) fileInputRef.current?.click();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)");
      return;
    }
    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen no debe superar los 2MB");
      return;
    }

    setAvatarUploading(true);
    try {
      // Resize and convert to base64
      const base64 = await compressImage(file, 200, 200, 0.8);
      setAvatarPreview(base64);
      // Auto-save avatar immediately
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: base64 }),
      });
      if (res.ok) {
        setSaved(true);
        fetchProfile();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
      alert("Error al subir la imagen");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function compressImage(file: File, maxW: number, maxH: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width, h = img.height;
          if (w > maxW || h > maxH) {
            if (w > h) { h = (h * maxW) / w; w = maxW; }
            else { w = (w * maxH) / h; h = maxH; }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("No canvas context")); return; }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function copyReferral() {
    if (!profile?.referralCode) return;
    navigator.clipboard.writeText(profile.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#F0B90B] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#848E9C]">
        <User className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">Inicia sesión para ver tu perfil</p>
      </div>
    );
  }

  const kyc = KYC_LABELS[profile.kycLevel] || KYC_LABELS[0];
  const initial = (profile.name || profile.email)[0].toUpperCase();
  const displayAvatar = avatarPreview || profile.avatar;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Perfil</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#F0B90B] text-black font-bold text-sm rounded hover:bg-[#F8D12F] transition"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setEditing(false); setFormName(profile.name || ""); setFormPhone(profile.phone || ""); setFormCountry(profile.country || ""); setAvatarPreview(profile.avatar); }}
              className="px-4 py-2 text-sm text-[#848E9C] hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-[#F0B90B] text-black font-bold text-sm rounded hover:bg-[#F8D12F] transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Guardando..." : "Guardar"}</span>
            </button>
          </div>
        )}
      </div>

      {saved && (
        <div className="flex items-center space-x-2 bg-[#02C076]/10 border border-[#02C076]/30 text-[#02C076] rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="text-sm">Perfil actualizado correctamente</span>
        </div>
      )}

      {/* Avatar + Basic Info Card */}
      <div className="bg-[#1E2329] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Avatar */}
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center text-black text-3xl font-bold overflow-hidden border-2 border-[#F0B90B]/30">
              {displayAvatar ? (
                <img src={displayAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            {editing && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                {avatarUploading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-white mb-0.5" />
                    <span className="text-[9px] text-white font-medium">Cambiar</span>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Name + Email + Role */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <h2 className="text-lg font-bold text-white">{profile.name || "GCRM User"}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${profile.role === "vip" ? "bg-[#F0B90B]/20 text-[#F0B90B]" : "bg-[#363C45] text-[#848E9C]"}`}>
                {profile.role.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-[#848E9C] mt-1">{profile.email}</p>
            <div className="flex items-center justify-center sm:justify-start space-x-3 mt-2">
              <span className={`text-xs font-semibold ${kyc.color}`}>{kyc.label}</span>
              <span className="text-xs text-[#5E6673]">|</span>
              <span className="flex items-center space-x-1 text-xs text-[#5E6673]">
                <Calendar className="w-3 h-3" />
                <span>Miembro desde {formatDate(profile.createdAt)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-[#1E2329] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2B3139]">
          <h3 className="text-sm font-bold text-white">Información del Perfil</h3>
        </div>
        <div className="divide-y divide-[#2B3139]">
          {/* Name */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-3">
              <User className="w-4 h-4 text-[#5E6673]" />
              <span className="text-sm text-[#848E9C]">Nombre</span>
            </div>
            {editing ? (
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Tu nombre"
                className="bg-[#2B3139] border border-[#363C45] rounded px-3 py-1.5 text-sm text-white w-60 focus:outline-none focus:border-[#F0B90B]"
              />
            ) : (
              <span className="text-sm text-white">{profile.name || "—"}</span>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-[#5E6673]" />
              <span className="text-sm text-[#848E9C]">Email</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-white">{profile.email}</span>
              <Check className="w-3.5 h-3.5 text-[#02C076]" />
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-[#5E6673]" />
              <span className="text-sm text-[#848E9C]">Teléfono</span>
            </div>
            {editing ? (
              <input
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+1 234 567 890"
                className="bg-[#2B3139] border border-[#363C45] rounded px-3 py-1.5 text-sm text-white w-60 focus:outline-none focus:border-[#F0B90B]"
              />
            ) : (
              <span className="text-sm text-white">{profile.phone || "—"}</span>
            )}
          </div>

          {/* Country */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-[#5E6673]" />
              <span className="text-sm text-[#848E9C]">País / Región</span>
            </div>
            {editing ? (
              <select
                value={formCountry}
                onChange={(e) => setFormCountry(e.target.value)}
                className="bg-[#2B3139] border border-[#363C45] rounded px-3 py-1.5 text-sm text-white w-60 focus:outline-none focus:border-[#F0B90B]"
              >
                <option value="">Seleccionar país</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-white">{profile.country || "—"}</span>
            )}
          </div>

          {/* KYC Level */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-4 h-4 text-[#5E6673]" />
              <span className="text-sm text-[#848E9C]">Nivel KYC</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-semibold ${kyc.color}`}>{kyc.label}</span>
              {profile.kycLevel < 2 && (
                <button onClick={() => window.dispatchEvent(new CustomEvent('gcrm-navigate', { detail: 'verification' }))} className="text-xs text-[#F0B90B] hover:underline">Verificar</button>
              )}
            </div>
          </div>

          {/* Referral Code */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-3">
              <Users className="w-4 h-4 text-[#5E6673]" />
              <span className="text-sm text-[#848E9C]">Código de Referido</span>
            </div>
            {profile.referralCode ? (
              <button
                onClick={copyReferral}
                className="flex items-center space-x-2 hover:bg-[#363C45] rounded px-2 py-1 transition"
              >
                <span className="text-sm text-[#F0B90B] font-mono font-semibold">{profile.referralCode}</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#02C076]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#848E9C]" />
                )}
              </button>
            ) : (
              <span className="text-sm text-[#5E6673]">—</span>
            )}
          </div>

          {/* Active Sessions */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-3">
              <Award className="w-4 h-4 text-[#5E6673]" />
              <span className="text-sm text-[#848E9C]">Sesiones Activas</span>
            </div>
            <span className="text-sm text-white">{profile.activeSessions}</span>
          </div>
        </div>
      </div>

      {/* Account Stats Card */}
      <div className="bg-[#1E2329] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2B3139]">
          <h3 className="text-sm font-bold text-white">Estadísticas de la Cuenta</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#2B3139]">
          <div className="px-6 py-4 text-center">
            <p className="text-2xl font-bold text-[#F0B90B]">{profile.role === "vip" ? "VIP" : "Standard"}</p>
            <p className="text-xs text-[#5E6673] mt-1">Tipo de Cuenta</p>
          </div>
          <div className="px-6 py-4 text-center">
            <p className="text-2xl font-bold text-white">{kyc.label}</p>
            <p className="text-xs text-[#5E6673] mt-1">Nivel de Verificación</p>
          </div>
          <div className="px-6 py-4 text-center">
            <p className="text-2xl font-bold text-white">{Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))}</p>
            <p className="text-xs text-[#5E6673] mt-1">Días como miembro</p>
          </div>
        </div>
      </div>
    </div>
  );
}
