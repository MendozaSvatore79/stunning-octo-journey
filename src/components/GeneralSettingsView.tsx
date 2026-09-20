// src/components/GeneralSettingsView.tsx
import { useState, useEffect, useRef } from 'react';
import { useLabBranding } from '../context/LabBrandingContext';
import type { Laboratory } from '../types/lab';
import {
  IconSettings,
  IconBuilding,
  IconCheckCircle,
  IconAlertCircle,
  IconShield,
  IconSparkles,
  IconPrinter,
  IconPhone,
  IconMail,
} from './icons';

interface GeneralSettingsViewProps {
  labs: Laboratory[];
}

/**
 * Optimiza y comprime la imagen a través de HTML5 Canvas.
 * Garantiza un tamaño ultraligero (~20KB - 50KB) en WebP/JPEG,
 * lo que evita el límite HTTP 413 de Express y agiliza la persistencia en base de datos.
 */
const compressImage = (file: File, maxDim = 400, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // Fallback a JPEG / PNG
        }

        const isPng = file.type === 'image/png';
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function GeneralSettingsView({ labs }: GeneralSettingsViewProps) {
  const {
    activeBranding,
    selectedLabId,
    setSelectedLabId,
    updateBranding,
    resetToDefault,
    canEditBranding,
    labs: contextLabs,
  } = useLabBranding();

  const availableLabs = labs && labs.length > 0 ? labs : contextLabs || [];

  const [name, setName] = useState(activeBranding.name);
  const [subtitle, setSubtitle] = useState(activeBranding.subtitle || '');
  const [logoPreview, setLogoPreview] = useState(activeBranding.logo || '');
  const [phone, setPhone] = useState(activeBranding.phone || '');
  const [email, setEmail] = useState(activeBranding.email || '');
  const [address, setAddress] = useState(activeBranding.address || '');
  const [sanitaryLicense, setSanitaryLicense] = useState(activeBranding.sanitaryLicense || '');
  const [responsibleName, setResponsibleName] = useState(activeBranding.responsibleName || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Referencias para evitar que re-renders o peticiones en segundo plano borren la imagen subida
  const isDirtyLogoRef = useRef(false);
  const lastLoadedLabIdRef = useRef<string>(selectedLabId);

  // Sincronizar automáticamente selectedLabId si es 'default' pero ya existen laboratorios
  useEffect(() => {
    if (availableLabs.length > 0 && (!selectedLabId || selectedLabId === 'default')) {
      setSelectedLabId(availableLabs[0].id);
    }
  }, [availableLabs, selectedLabId, setSelectedLabId]);

  // Sincronizar campos cuando cambia el laboratorio seleccionado
  useEffect(() => {
    if (lastLoadedLabIdRef.current !== selectedLabId) {
      lastLoadedLabIdRef.current = selectedLabId;
      isDirtyLogoRef.current = false;
      setName(activeBranding.name || '');
      setSubtitle(activeBranding.subtitle || '');
      setLogoPreview(activeBranding.logo || '');
      setPhone(activeBranding.phone || '');
      setEmail(activeBranding.email || '');
      setAddress(activeBranding.address || '');
      setSanitaryLicense(activeBranding.sanitaryLicense || '');
      setResponsibleName(activeBranding.responsibleName || '');
      setSuccessMsg(null);
      setErrorMsg(null);
      return;
    }

    // Si seguimos en el mismo laboratorio y el usuario no ha subido una imagen nueva sin guardar
    if (!isDirtyLogoRef.current && activeBranding.logo && activeBranding.logo !== logoPreview) {
      setLogoPreview(activeBranding.logo);
    }
    if (!name && activeBranding.name) {
      setName(activeBranding.name);
    }
  }, [selectedLabId, activeBranding]);

  // Manejador de subida de imagen de logo con compresión automática
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('El archivo seleccionado debe ser una imagen válida (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('El archivo original no debe superar los 5 MB.');
      return;
    }

    try {
      setIsCompressingLogo(true);
      setErrorMsg(null);
      const compressed = await compressImage(file, 400, 0.85);
      setLogoPreview(compressed);
      isDirtyLogoRef.current = true; // Protegido contra sobreescrituras automáticas
    } catch (err) {
      console.error('Error al procesar la imagen:', err);
      setErrorMsg('No se pudo procesar la imagen seleccionada. Por favor prueba con otra imagen.');
    } finally {
      setIsCompressingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setLogoPreview('');
    isDirtyLogoRef.current = false;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const effectiveLabId =
      (!selectedLabId || selectedLabId === 'default') && availableLabs.length > 0
        ? availableLabs[0].id
        : selectedLabId;

    // Actualiza de inmediato en el contexto, sidebar y base de datos
    setIsSaving(true);
    try {
      const result = await updateBranding(effectiveLabId, {
        logo: '',
      });
      if (result.savedToDb) {
        setSuccessMsg('Logotipo eliminado con éxito de la base de datos y de la sede.');
      } else {
        setSuccessMsg('Logotipo removido localmente.');
      }
    } catch (err) {
      console.error('Error al eliminar logotipo:', err);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditBranding) {
      setErrorMsg('Solo el Administrador del laboratorio puede modificar la identidad y logotipo de esta sede.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('El nombre de la sede o laboratorio es obligatorio.');
      return;
    }

    const effectiveLabId =
      (!selectedLabId || selectedLabId === 'default') && availableLabs.length > 0
        ? availableLabs[0].id
        : selectedLabId;

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await updateBranding(effectiveLabId, {
        name: name.trim(),
        subtitle: subtitle.trim() || undefined,
        logo: logoPreview ? logoPreview : '',
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        sanitaryLicense: sanitaryLicense.trim() || undefined,
        responsibleName: responsibleName.trim() || undefined,
      });

      isDirtyLogoRef.current = false;

      if (result.savedToDb) {
        setSuccessMsg('¡Configuración de sede y logotipo guardados con éxito en la base de datos!');
      } else if (result.error) {
        setErrorMsg(`Guardado localmente, pero el servidor reportó: ${result.error}`);
      } else {
        setSuccessMsg('¡Configuración de identidad y logotipo actualizada con éxito!');
      }
    } catch (err: any) {
      console.error('Error al guardar branding:', err);
      setErrorMsg('Ocurrió un error inesperado al intentar guardar los cambios.');
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSuccessMsg(null);
      }, 5000);
    }
  };

  const handleReset = () => {
    if (confirm('¿Deseas restablecer la identidad y el logotipo de esta sede a sus valores iniciales?')) {
      const effectiveLabId =
        (!selectedLabId || selectedLabId === 'default') && availableLabs.length > 0
          ? availableLabs[0].id
          : selectedLabId;
      resetToDefault(effectiveLabId);
      isDirtyLogoRef.current = false;
      setSuccessMsg('Se restableció la identidad a los valores de catálogo.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Encabezado Principal */}
      <section className="card bg-base-100 border border-base-200 p-5 sm:p-6 shadow-xs rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-primary badge-outline text-xs font-semibold gap-1.5 py-2.5 px-3">
                <IconSettings className="w-3.5 h-3.5" />
                Configuración General
              </span>
              <span className="badge badge-ghost text-xs text-base-content/60 font-medium">
                Identidad Institucional
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
              Personalización de Sede y Logotipo
            </h1>
            <p className="text-xs text-base-content/60">
              Configura el logotipo oficial, nombre comercial y credenciales sanitarias específicas de cada laboratorio.
            </p>
          </div>

          {/* Selector de Laboratorio / Sede a Configurar */}
          <div className="flex items-center gap-2 bg-base-200/60 p-2 rounded-2xl border border-base-300/60">
            <IconBuilding className="w-4 h-4 text-primary shrink-0 ml-1" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">Laboratorio Activo</span>
              <select
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(e.target.value)}
                className="select select-xs select-bordered font-bold text-primary bg-base-100 rounded-xl focus:select-primary"
              >
                {availableLabs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} {l.city ? `(${l.city})` : ''}
                  </option>
                ))}
                {availableLabs.length === 0 && <option value="default">LabSystem Central</option>}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Alerta de Permisos y Rol */}
      {!canEditBranding && (
        <div className="alert alert-warning border border-warning/40 shadow-xs rounded-2xl text-xs font-semibold">
          <IconAlertCircle className="w-5 h-5 text-warning shrink-0" />
          <div>
            <span className="font-bold block text-sm">Modo de Solo Lectura</span>
            Solo el administrador asignado a esta sede tiene autorización para modificar el logotipo y nombre institucional.
          </div>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success border border-success/40 shadow-xs rounded-2xl text-xs font-semibold text-success-content animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconCheckCircle className="w-5 h-5 text-success-content shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="btn btn-xs btn-ghost text-success-content">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-error border border-error/40 shadow-xs rounded-2xl text-xs font-semibold text-error-content animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconAlertCircle className="w-5 h-5 text-error-content shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="btn btn-xs btn-ghost text-error-content">✕</button>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Vista Previa en Tiempo Real del Sidebar y PDF */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tarjeta de Previsualización en Barra Lateral (Sidebar) */}
          <div className="card bg-base-100 border border-base-200 shadow-xs rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-base-200/80 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5 min-w-0">
                <IconSparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">Vista Previa Lateral</span>
              </span>
              <span className="badge badge-sm badge-success text-success-content font-bold whitespace-nowrap shrink-0 px-2.5 py-0.5 text-[11px] shadow-xs">
                ● En Vivo
              </span>
            </div>

            {/* Simulación del Header del Sidebar */}
            <div className="p-4 rounded-xl bg-base-200/60 border border-base-300/80 flex items-center gap-3">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt={name}
                  className="w-11 h-11 rounded-2xl object-cover border border-base-300 shadow-xs shrink-0 bg-white"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-teal-500/20 shrink-0">
                  {name ? name.charAt(0).toUpperCase() : 'L'}
                </div>
              )}
              <div className="overflow-hidden min-w-0">
                <span className="text-lg font-black text-base-content tracking-tight block leading-tight truncate">
                  {name || 'Nombre del Lab'}
                </span>
                <span className="text-[10px] uppercase font-bold text-primary tracking-widest block mt-0.5 truncate">
                  {subtitle || 'Panel Administrador'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-base-content/60 leading-relaxed">
              Este encabezado se reflejará de inmediato en la barra izquierda para todos los químicos y personal adscrito a esta sede.
            </p>
          </div>

          {/* Tarjeta de Membrete Médico Oficial */}
          <div className="card bg-base-100 border border-base-200 shadow-xs rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-base-200 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
                <IconPrinter className="w-3.5 h-3.5 text-secondary" />
                Membrete en PDF Clínico
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-base-100 border border-base-300 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center gap-2.5">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white border border-base-200" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-black">
                    {name.charAt(0) || 'L'}
                  </div>
                )}
                <div>
                  <div className="font-bold text-base-content">{name}</div>
                  <div className="text-[10px] text-base-content/60 font-mono">{sanitaryLicense || 'Sin Licencia'}</div>
                </div>
              </div>
              <div className="text-[10.5px] text-base-content/70 border-t border-base-200 pt-1.5">
                <div>Resp: {responsibleName || 'Q.F.B. Responsable'}</div>
                <div className="truncate">{address || 'Dirección de la Sede'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Identidad */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 border border-base-200 shadow-xs rounded-2xl p-5 sm:p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-base-200 pb-3 flex items-center gap-2">
              <IconBuilding className="w-4 h-4" />
              1. Identidad Visual y Logotipo
            </h2>

            {/* Selector y Creador de Logotipo */}
            <div className="space-y-3">
              <label className="label py-0">
                <span className="label-text font-bold text-xs">Logotipo Oficial del Laboratorio</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-base-300 bg-base-200/30">
                {logoPreview ? (
                  <div className="relative group">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="w-24 h-24 rounded-2xl object-contain bg-white border border-base-300 p-1 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={!canEditBranding || isSaving || isCompressingLogo}
                      className="absolute -top-2 -right-2 btn btn-circle btn-error btn-xs text-white shadow-md"
                      title="Eliminar Logotipo"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-base-200 text-base-content/40 flex flex-col items-center justify-center text-xs font-semibold border border-base-300">
                    <IconBuilding className="w-7 h-7 mb-1" />
                    <span>Sin Logo</span>
                  </div>
                )}

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={!canEditBranding || isSaving || isCompressingLogo}
                      className="hidden"
                      id="logo-file-input"
                    />
                    <label
                      htmlFor="logo-file-input"
                      className={`btn btn-sm btn-primary text-primary-content font-bold rounded-xl gap-1.5 cursor-pointer shadow-xs ${
                        !canEditBranding || isSaving || isCompressingLogo ? 'btn-disabled opacity-50' : ''
                      }`}
                    >
                      {isCompressingLogo ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Optimizando...
                        </>
                      ) : (
                        <>
                          <IconSparkles className="w-3.5 h-3.5" />
                          Subir Imagen / Logo
                        </>
                      )}
                    </label>

                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={!canEditBranding || isSaving || isCompressingLogo}
                        className="btn btn-sm btn-ghost text-error rounded-xl font-semibold"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-base-content/60 leading-normal">
                    Formatos: <strong>PNG transparente, JPG, WebP o SVG</strong>. La imagen se optimiza automáticamente a alta definición (~30 KB) para máxima rapidez y compatibilidad con base de datos y reportes clínicos.
                  </p>
                </div>
              </div>
            </div>

            {/* Campos de Nombre y Subtítulo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">
                    Nombre del Laboratorio o Sede <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. LabSystem Central"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEditBranding || isSaving}
                  className="input input-bordered input-sm rounded-xl font-bold text-sm focus:input-primary"
                  required
                />
                <span className="text-[10px] text-base-content/50 mt-1">
                  Aparecerá en el encabezado principal y en todos los reportes clínicos.
                </span>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Subtítulo o Leyenda Operativa</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sede Matriz / Análisis Clínicos"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  disabled={!canEditBranding || isSaving}
                  className="input input-bordered input-sm rounded-xl font-semibold text-xs focus:input-primary"
                />
                <span className="text-[10px] text-base-content/50 mt-1">
                  Texto secundario en color primario bajo el nombre comercial.
                </span>
              </div>
            </div>

            {/* Sección 2: Credenciales Sanitarias y Contacto */}
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-t border-base-200 pt-4 flex items-center gap-2">
              <IconShield className="w-4 h-4" />
              2. Datos Sanitarios y Datos de Contacto
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Licencia Sanitaria / Registro COFEPRIS</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. SSA-24-COFEPRIS-00891"
                  value={sanitaryLicense}
                  onChange={(e) => setSanitaryLicense(e.target.value)}
                  disabled={!canEditBranding || isSaving}
                  className="input input-bordered input-sm rounded-xl font-mono text-xs focus:input-primary"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Químico Responsable Sanitario</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Q.F.B. Juan Carlos Mendoza"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  disabled={!canEditBranding || isSaving}
                  className="input input-bordered input-sm rounded-xl font-medium text-xs focus:input-primary"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs flex items-center gap-1">
                    <IconPhone className="w-3.5 h-3.5 text-primary" /> Teléfono de Atención
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="Ej. +52 921 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!canEditBranding || isSaving}
                  className="input input-bordered input-sm rounded-xl font-medium text-xs focus:input-primary"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs flex items-center gap-1">
                    <IconMail className="w-3.5 h-3.5 text-primary" /> Correo Institucional
                  </span>
                </label>
                <input
                  type="email"
                  placeholder="laboratorio@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!canEditBranding || isSaving}
                  className="input input-bordered input-sm rounded-xl font-medium text-xs focus:input-primary"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs">Dirección Completa de la Sede</span>
              </label>
              <textarea
                rows={2}
                placeholder="Calle, Número, Colonia, Ciudad, Estado, C.P."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!canEditBranding || isSaving}
                className="textarea textarea-bordered rounded-xl text-xs font-medium focus:textarea-primary"
              />
            </div>

            {/* Barra de Acciones */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-base-200">
              <button
                type="button"
                onClick={handleReset}
                disabled={!canEditBranding || isSaving}
                className="btn btn-sm btn-ghost text-xs text-base-content/60 hover:text-error"
              >
                Restablecer a Valores de Fábrica
              </button>

              <button
                type="submit"
                disabled={!canEditBranding || isSaving}
                className="btn btn-sm btn-primary text-primary-content font-bold rounded-xl gap-2 shadow-xs"
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Guardando en Base de Datos...
                  </>
                ) : (
                  <>
                    <IconCheckCircle className="w-4 h-4" />
                    Guardar Configuración de Sede
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
