"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp, Shield, Users, AlertTriangle, Scale, Lock, Globe } from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
}

const SECTIONS: Section[] = [
  {
    id: "intro",
    title: "1. Aceptación de los Términos",
    icon: <FileText className="w-4 h-4" />,
    content: [
      "Al acceder o utilizar la plataforma GCRM Exchange (en adelante, \"la Plataforma\"), usted (en adelante, \"el Usuario\", \"usted\" o \"su\") acepta estar vinculado por estos Términos de Servicio (en adelante, \"Términos\"), junto con nuestra Política de Privacidad y todas las políticas y directrices adicionales que puedan publicarse periódicamente en la Plataforma.",
      "Si no está de acuerdo con estos Términos, debe abstenerse de utilizar la Plataforma. El uso continuado de la Plataforma después de la publicación de cualquier modificación constituirá su aceptación de dichos cambios.",
      "GCRM Exchange se reserva el derecho de modificar, actualizar o reemplazar estos Términos en cualquier momento. Las modificaciones significativas serán notificadas a los Usuarios a través de la Plataforma o por correo electrónico con al menos 30 días de antelación antes de que entren en vigencia.",
    ],
  },
  {
    id: "eligibility",
    title: "2. Elegibilidad del Usuario",
    icon: <Users className="w-4 h-4" />,
    content: [
      "Para utilizar la Plataforma, usted debe tener al menos 18 años de edad (o la edad mínima legal en su jurisdicción). Al registrarse, usted declara y garantiza que tiene la capacidad legal para vincularse a estos Términos.",
      "No podrá utilizar la Plataforma si: (a) está situado en una jurisdicción donde el acceso a o uso de la Plataforma sea ilegal; (b) ha sido previamente suspendido o prohibido de utilizar la Plataforma; (c) es un ciudadano o residente de cualquier país sujeto a sanciones económicas o embargos por parte de los Estados Unidos, la Unión Europea o la Organización de las Naciones Unidas.",
      "GCRM Exchange se reserva el derecho de solicitar verificación de identidad (KYC) en cualquier momento y de limitar o denegar el acceso a Usuarios que no cumplan con los requisitos de elegibilidad.",
    ],
  },
  {
    id: "account",
    title: "3. Cuentas y Seguridad",
    icon: <Lock className="w-4 h-4" />,
    content: [
      "Para acceder a ciertas funciones de la Plataforma, deberá crear una cuenta. Usted es responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran bajo su cuenta. Debe notificar inmediatamente a GCRM Exchange de cualquier uso no autorizado de su cuenta.",
      "Usted acepta proporcionar información de registro precisa, actual y completa, y mantener dicha información actualizada. GCRM Exchange no se hace responsable por pérdidas derivadas del uso no autorizado de su cuenta debido a su negligencia en la protección de sus credenciales.",
      "Se recomienda encarecidamente habilitar la autenticación de dos factores (2FA) mediante Google Authenticator. La activación de 2FA es responsabilidad del Usuario. En caso de pérdida del dispositivo con Google Authenticator, el Usuario deberá seguir el proceso de recuperación establecido por GCRM Exchange.",
      "GCRM Exchange no almacenará ni tendrá acceso a las contraseñas de Google Authenticator. La responsabilidad de respaldar y guardar de manera segura la clave secreta de TOTP recae exclusivamente en el Usuario.",
    ],
  },
  {
    id: "trading",
    title: "4. Actividades de Trading",
    icon: <Globe className="w-4 h-4" />,
    content: [
      "La Plataforma facilita el intercambio de activos digitales (criptomonedas). GCRM Exchange actúa como un intermediario tecnológico y no como asesor financiero. Las decisiones de inversión son responsabilidad exclusiva del Usuario.",
      "El Usuario reconoce y acepta que el mercado de criptomonedas es altamente volátil. Los precios de los activos digitales pueden fluctuar significativamente en cortos períodos de tiempo, lo que puede resultar en pérdidas sustanciales, incluyendo la pérdida total de la inversión.",
      "GCRM Exchange no garantiza la liquidez, precio o disponibilidad de ningún activo digital en la Plataforma. Las operaciones se ejecutan en base al mejor esfuerzo y pueden estar sujetas a retrasos, interrupciones o fallas técnicas.",
      "Queda estrictamente prohibido: (a) el uso de bots de trading no autorizados; (b) la manipulación del mercado (spoofing, wash trading, layering); (c) el uso de información privilegiada; (d) cualquier actividad fraudulenta o ilegal. GCRM Exchange se reserva el derecho de investigar, suspender o cerrar cuentas que violen estas disposiciones.",
    ],
  },
  {
    id: "fees",
    title: "5. Tarifas y Comisiones",
    icon: <Scale className="w-4 h-4" />,
    content: [
      "GCRM Exchange cobra comisiones por las operaciones de trading realizadas en la Plataforma. La estructura de comisiones actual está disponible en la página de Tarifas de la Plataforma y puede ser modificada con un preaviso de al menos 15 días.",
      "Los depósitos de criptomonedas no generan comisión. Los retiros de criptomonedas están sujetos a tarifas de red que son pagadas directamente a los mineros/validadores de la red blockchain correspondiente.",
      "GCRM Exchange se reserva el derecho de aplicar tarifas preferenciales a Usuarios VIP o a aquellos que participen en programas promocionales específicos. Las tarifas promocionales son temporales y están sujetas a las condiciones específicas de cada promoción.",
    ],
  },
  {
    id: "kyc",
    title: "6. Verificación de Identidad (KYC)",
    icon: <Shield className="w-4 h-4" />,
    content: [
      "De acuerdo con las regulaciones aplicables contra el lavado de dinero (AML) y el financiamiento del terrorismo (CFT), GCRM Exchange requiere que todos los Usuarios completen un proceso de verificación de identidad (Know Your Customer o KYC) antes de poder realizar ciertas operaciones.",
      "El proceso KYC incluye: (a) Verificación de Email (Nivel 1): Confirmación de la dirección de correo electrónico; (b) Verificación de Identidad (Nivel 2): Proporcionar documento de identidad válido (pasaporte, DNI, licencia de conducir) y una selfie; (c) Verificación de Dirección (Nivel 3): Proporcionar un comprobante de domicilio reciente.",
      "La información proporcionada durante el proceso KYC será tratada de acuerdo con nuestra Política de Privacidad. GCRM Exchange se reserva el derecho de rechazar solicitudes de verificación si la documentación presentada es insuficiente, ilegible o sospechosa.",
      "Los Usuarios con niveles de verificación más altos tendrán acceso a mayores límites de retiro y funcionalidades adicionales de la Plataforma.",
    ],
  },
  {
    id: "risks",
    title: "7. Riesgos y Advertencias",
    icon: <AlertTriangle className="w-4 h-4" />,
    content: [
      "EL USUARIO RECONOCE Y ACEPTA QUE LAS OPERACIONES CON ACTIVOS DIGITALES IMPLICAN RIESGOS SIGNIFICATIVOS. LOS ACTIVOS DIGITALES NO ESTÁN RESPALDADOS POR NINGÚN GOBIERNO, BANCO CENTRAL O INSTITUCIÓN FINANCIERA.",
      "Riesgos específicos incluyen pero no se limitan a: (a) Volatilidad extrema de precios; (b) Riesgo regulatorio y cambios en la legislación aplicable; (c) Riesgo tecnológico (fallas de software, ataques cibernéticos, vulnerabilidades de blockchain); (d) Riesgo de liquidez; (e) Riesgo de pérdida total del capital invertido.",
      "GCRM Exchange NO proporciona asesoramiento financiero, fiscal, legal o de inversión. Las decisiones de trading son tomadas bajo su propio riesgo y responsabilidad. El rendimiento pasado no es indicativo de resultados futuros.",
      "En ningún caso GCRM Exchange, sus directores, empleados, socios o afiliados serán responsables por cualquier pérdida directa, indirecta, incidental, especial o consecuencial que surja del uso de la Plataforma.",
    ],
  },
  {
    id: "suspension",
    title: "8. Suspensión y Terminación",
    icon: <AlertTriangle className="w-4 h-4" />,
    content: [
      "GCRM Exchange se reserva el derecho de suspender, restringir o terminar su acceso a la Plataforma, de manera temporal o permanente, con o sin causa, y con o sin aviso previo, en las siguientes circunstancias: (a) Violación de estos Términos; (b) Sospecha de actividad fraudulenta, de lavado de dinero o ilegal; (c) Requerimiento de autoridad regulatoria o judicial; (d) Necesidad técnica o de seguridad.",
      "En caso de suspensión o terminación, GCRM Exchange le proporcionará un período razonable para retirar sus activos, sujeto a la finalización del proceso de verificación de identidad y al cumplimiento de las regulaciones aplicables.",
      "Usted puede cerrar su cuenta en cualquier momento contactando a soporte, sujeto a la liquidación de cualquier operación pendiente y al retiro de sus activos.",
    ],
  },
  {
    id: "law",
    title: "9. Ley Aplicable y Resolución de Disputas",
    icon: <Scale className="w-4 h-4" />,
    content: [
      "Estos Términos se rigen por las leyes de la jurisdicción en la que GCRM Exchange opera, sin considerar sus principios de conflicto de leyes. Cualquier disputa derivada de estos Términos será resuelta a través de arbitraje vinculante, de conformidad con las reglas de arbitraje aplicables.",
      "El idioma del arbitraje será el español. La sede del arbitraje será determinada por GCRM Exchange. El laudo arbitral será definitivo y vinculante para ambas partes.",
      "Nada en estos Términos impedirá a GCRM Exchange de buscar medidas cautelares o de protección en cualquier jurisdicción cuando sea necesario para proteger sus derechos o propiedad.",
    ],
  },
];

export default function TermsContent() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setOpenSections(new Set(SECTIONS.map((s) => s.id)));
  }

  function collapseAll() {
    setOpenSections(new Set());
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center shrink-0 mt-0.5">
          <FileText className="w-5 h-5 text-[#F0B90B]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Términos de Servicio</h1>
          <p className="text-xs text-[#848E9C] mt-1">Última actualización: 15 de agosto de 2026 | Versión 1.0</p>
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-[#F6465D]/10 border border-[#F6465D]/30 rounded-xl p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-[#F6465D] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[#F6465D] font-semibold">Aviso Importante</p>
            <p className="text-xs text-[#848E9C] mt-1 leading-relaxed">
              La negociación de activos digitales conlleva un alto nivel de riesgo. Lea estos Términos cuidadosamente antes de utilizar la Plataforma. Al utilizar GCRM Exchange, usted acepta todos los términos y condiciones aquí descritos.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-3">
        <button onClick={expandAll} className="text-xs text-[#F0B90B] hover:underline">Expandir todo</button>
        <span className="text-xs text-[#363C45]">|</span>
        <button onClick={collapseAll} className="text-xs text-[#848E9C] hover:text-white">Contraer todo</button>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const isOpen = openSections.has(section.id);
          return (
            <div key={section.id} className="bg-[#1E2329] rounded-xl overflow-hidden">
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#2B3139]/50 transition"
              >
                <div className="flex items-center space-x-3">
                  <span className={`text-[#5E6673] ${isOpen ? "text-[#F0B90B]" : ""}`}>{section.icon}</span>
                  <span className={`text-sm font-semibold ${isOpen ? "text-[#F0B90B]" : "text-white"}`}>{section.title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-[#5E6673]" /> : <ChevronDown className="w-4 h-4 text-[#5E6673]" />}
              </button>
              {isOpen && (
                <div className="px-5 pb-4 space-y-3 border-t border-[#2B3139]">
                  {section.content.map((paragraph, i) => (
                    <p key={i} className="text-sm text-[#848E9C] leading-relaxed pt-3">{paragraph}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact */}
      <div className="bg-[#1E2329] rounded-xl p-5 text-center">
        <p className="text-sm text-white font-semibold">¿Tienes preguntas sobre estos Términos?</p>
        <p className="text-xs text-[#848E9C] mt-1">
          Contacta a nuestro equipo de soporte en{" "}
          <a href="mailto:soporte@gcrm.exchange" className="text-[#F0B90B] hover:underline">soporte@gcrm.exchange</a>
        </p>
      </div>
    </div>
  );
}
