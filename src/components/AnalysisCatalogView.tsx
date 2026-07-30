// src/components/AnalysisCatalogView.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import type { ClinicalAnalysis } from '../types/order';
import {
  IconFlask,
  IconPlus,
  IconTrash,
  IconCheckCircle,
  IconAlertCircle,
  IconX,
} from './icons';

interface AnalysisCatalogViewProps {
  onStudyCreatedOrUpdated?: () => void;
}

export default function AnalysisCatalogView({ onStudyCreatedOrUpdated }: AnalysisCatalogViewProps) {
  const api = useApi();
  const [studies, setStudies] = useState<ClinicalAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados del Modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<ClinicalAnalysis | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    referenceValues: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar lista de análisis desde GET /analysis
  const fetchStudies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<ClinicalAnalysis[]>('/analysis');
      setStudies(res.data || []);
    } catch (err) {
      console.error('Error al cargar catálogo de análisis:', err);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  // Filtrado de búsqueda
  const filteredStudies = useMemo(() => {
    return studies.filter((s) => {
      const query = searchTerm.toLowerCase();
      return (
        s.name.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query)) ||
        (s.referenceValues && s.referenceValues.toLowerCase().includes(query))
      );
    });
  }, [studies, searchTerm]);

  // Abrir modal en modo creación
  const handleOpenCreate = () => {
    setEditingStudy(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      referenceValues: '',
    });
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  // Abrir modal en modo edición
  const handleOpenEdit = (study: ClinicalAnalysis) => {
    setEditingStudy(study);
    setFormData({
      name: study.name,
      description: study.description || '',
      price: String(study.price),
      referenceValues: study.referenceValues || '',
    });
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  // Guardar (POST o PATCH /analysis)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('El nombre del estudio es obligatorio.');
      return;
    }
    if (!formData.price || Number(formData.price) < 0) {
      setErrorMsg('Ingresa un precio válido mayor o igual a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: Number(formData.price),
        referenceValues: formData.referenceValues.trim() || undefined,
      };

      if (editingStudy) {
        await api.patch(`/analysis/${editingStudy.id}`, payload);
        setSuccessMsg('¡Estudio clínico actualizado con éxito!');
      } else {
        await api.post('/analysis', payload);
        setSuccessMsg('¡Nuevo estudio registrado exitosamente en la base de datos!');
      }

      fetchStudies();
      if (onStudyCreatedOrUpdated) onStudyCreatedOrUpdated();

      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
    } catch (err: any) {
      console.error('Error al guardar estudio:', err);
      const rawMsg = err?.response?.data?.message || err?.message;
      setErrorMsg(Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar estudio (DELETE /analysis/:id)
  const handleDeleteStudy = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el estudio "${name}" del catálogo?`)) return;

    try {
      await api.delete(`/analysis/${id}`);
      setStudies((prev) => prev.filter((s) => s.id !== id));
      if (onStudyCreatedOrUpdated) onStudyCreatedOrUpdated();
    } catch (err) {
      console.error('Error al eliminar estudio:', err);
      alert('No se pudo eliminar el estudio. Intenta de nuevo.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Encabezado del Catálogo de Servicios */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm">
        <div>
          <div className="badge badge-primary badge-outline text-xs font-semibold mb-1">
            <IconFlask className="w-3.5 h-3.5 mr-1" />
            Catálogo General de Análisis
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight">
            Catálogo de Servicios Clínicos
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-0.5">
            Administra los estudios de laboratorio, descripciones, precios y valores de referencia guardados en la BD.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn btn-primary text-primary-content font-bold rounded-2xl gap-2 shadow-md hover:scale-[1.02] transition-all shrink-0"
        >
          <IconPlus className="w-5 h-5" />
          Crear Nuevo Estudio
        </button>
      </section>

      {/* Barra de Búsqueda */}
      <section className="card bg-base-100 border border-base-200 shadow-sm p-4 sm:p-5 rounded-3xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar estudio clínico por nombre, descripción o valores de referencia..."
            className="input input-bordered w-full rounded-2xl pl-11 focus:input-primary transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </section>

      {/* Listado de Estudios en Tabla */}
      <section className="space-y-4">
        {isLoading ? (
          <div className="skeleton h-64 w-full rounded-3xl"></div>
        ) : filteredStudies.length === 0 ? (
          <div className="card bg-base-100 border-2 border-dashed border-base-300 p-12 text-center rounded-3xl">
            <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
              <IconFlask className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-base-content mb-1">No se encontraron estudios clínicos</h3>
            <p className="text-xs text-base-content/60 max-w-md mx-auto mb-4">
              {searchTerm
                ? `No hay coincidencia para "${searchTerm}".`
                : 'Aún no hay análisis clínicos registrados en la base de datos.'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="btn btn-primary text-white font-bold rounded-xl gap-2 mx-auto"
            >
              <IconPlus className="w-4 h-4" />
              Crear Primer Estudio
            </button>
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-200 shadow-md rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-sm">
                <thead>
                  <tr className="bg-base-200/60 text-base-content/70">
                    <th className="font-bold">Estudio Clínico</th>
                    <th className="font-bold">Descripción</th>
                    <th className="font-bold">Valores de Referencia</th>
                    <th className="font-bold text-right">Precio ($)</th>
                    <th className="font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudies.map((study) => (
                    <tr key={study.id} className="hover:bg-base-200/40">
                      <td>
                        <div className="font-bold text-base-content text-base">{study.name}</div>
                        <span className="text-[11px] text-base-content/50 font-mono">
                          ID: {study.id.slice(0, 8)}...
                        </span>
                      </td>

                      <td>
                        <span className="text-xs text-base-content/80 max-w-xs block font-medium">
                          {study.description || 'Sin descripción'}
                        </span>
                      </td>

                      <td>
                        <span className="text-xs text-base-content/70 bg-base-200 px-2.5 py-1 rounded-lg inline-block font-mono">
                          {study.referenceValues || 'N/A'}
                        </span>
                      </td>

                      <td className="text-right">
                        <span className="font-mono font-extrabold text-primary text-base">
                          ${study.price.toFixed(2)}
                        </span>
                      </td>

                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(study)}
                            className="btn btn-xs btn-ghost text-primary hover:bg-primary/10 rounded-lg font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteStudy(study.id, study.name)}
                            className="btn btn-xs btn-ghost text-error hover:bg-error/10 rounded-lg"
                          >
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* MODAL DE CREAR / EDITAR ESTUDIO CLÍNICO */}
      {isModalOpen && (
        <dialog className="modal modal-open backdrop-blur-xs">
          <div className="modal-box max-w-lg rounded-3xl p-6 sm:p-8 border border-base-300 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-base-200 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                  <IconFlask className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-base-content">
                    {editingStudy ? 'Editar Estudio Clínico' : 'Crear Nuevo Estudio Clínico'}
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Se guardará directamente en la base de datos de servicios
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Alertas */}
            {successMsg && (
              <div className="alert alert-success text-white shadow-md rounded-2xl py-2.5 mb-3 text-sm">
                <IconCheckCircle className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="alert alert-error text-white shadow-md rounded-2xl py-2.5 mb-3 text-sm">
                <IconAlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Nombre del Estudio Clínico <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Química Sanguínea (6 Elementos)"
                  className="input input-bordered w-full rounded-xl focus:input-primary transition-all font-medium"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Precio Público ($ MXN) <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej. 350.00"
                  className="input input-bordered w-full rounded-xl focus:input-primary transition-all font-mono font-bold"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Descripción / Indicaciones</span>
                </label>
                <textarea
                  placeholder="Ej. Ayuno obligatorio de 8 a 12 horas. Incluye Glucosa, Urea, Creatinina..."
                  className="textarea textarea-bordered w-full rounded-xl focus:textarea-primary transition-all h-20 text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Valores de Referencia Médicos</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Glucosa 70-99 mg/dL, Urea 15-45 mg/dL"
                  className="input input-bordered w-full rounded-xl focus:input-primary transition-all text-xs font-mono"
                  value={formData.referenceValues}
                  onChange={(e) => setFormData((prev) => ({ ...prev, referenceValues: e.target.value }))}
                />
              </div>

              <div className="modal-action border-t border-base-200 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost rounded-xl"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-white font-bold rounded-xl gap-2 min-w-[140px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <IconPlus className="w-5 h-5" />
                      {editingStudy ? 'Actualizar Estudio' : 'Guardar Estudio'}
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setIsModalOpen(false)}>close</button>
          </form>
        </dialog>
      )}

    </div>
  );
}
