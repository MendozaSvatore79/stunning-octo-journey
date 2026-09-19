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
  IconSearch,
  IconMicroscope,
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

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMsg('Ingresa un precio válido (mayor o igual a 0).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (editingStudy) {
        // Editar estudio existente
        const res = await api.patch<ClinicalAnalysis>(`/analysis/${editingStudy.id}`, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          price: priceNum,
          referenceValues: formData.referenceValues.trim() || undefined,
        });

        setStudies((prev) =>
          prev.map((s) => (s.id === editingStudy.id ? res.data : s))
        );
        setSuccessMsg('¡Estudio clínico actualizado exitosamente!');
      } else {
        // Crear nuevo estudio
        const res = await api.post<ClinicalAnalysis>('/analysis', {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          price: priceNum,
          referenceValues: formData.referenceValues.trim() || undefined,
        });

        setStudies((prev) => [res.data, ...prev]);
        setSuccessMsg('¡Estudio clínico registrado exitosamente!');
      }

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
      {/* Encabezado del Catálogo de Servicios con DaisyUI */}
      <section className="card bg-base-100 border border-base-200 p-5 sm:p-6 shadow-xs rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-sm badge-outline text-primary border-primary/30 font-semibold gap-1.5 py-2.5 px-3">
                <IconFlask className="w-3.5 h-3.5" />
                Catálogo de Estudios
              </span>
              <span className="badge badge-sm badge-ghost text-base-content/60 font-medium">
                {filteredStudies.length} {filteredStudies.length === 1 ? 'estudio registrado' : 'estudios registrados'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
              Catálogo de Servicios Clínicos
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 max-w-2xl leading-relaxed">
              Administra los estudios de laboratorio, descripciones, tarifas y valores de referencia analítica.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="btn btn-primary btn-sm sm:btn-md gap-2 font-semibold rounded-xl shadow-xs shrink-0"
          >
            <IconPlus className="w-4 h-4" />
            Nuevo Estudio
          </button>
        </div>
      </section>

      {/* Barra de Búsqueda */}
      <section className="card bg-base-100 border border-base-200 shadow-xs p-3.5 sm:p-4 rounded-2xl">
        <label className="input input-bordered input-sm sm:input-md flex items-center gap-2.5 rounded-xl w-full focus-within:input-primary text-xs sm:text-sm font-medium">
          <IconSearch className="w-4 h-4 text-base-content/40 shrink-0" />
          <input
            type="text"
            placeholder="Buscar estudio clínico por nombre, descripción o valores de referencia..."
            className="grow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
      </section>

      {/* Listado de Estudios en Tabla */}
      <section className="space-y-4">
        {isLoading ? (
          <div className="skeleton h-60 w-full rounded-2xl"></div>
        ) : filteredStudies.length === 0 ? (
          <div className="card bg-base-100 border border-dashed border-base-200 p-8 sm:p-12 text-center rounded-2xl">
            <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
              <IconMicroscope className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-base-content mb-1">
              No se encontraron estudios clínicos
            </h3>
            <p className="text-xs text-base-content/60 max-w-sm mx-auto mb-4">
              {searchTerm
                ? `No hay coincidencias para "${searchTerm}".`
                : 'Aún no hay análisis clínicos registrados en el catálogo.'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="btn btn-primary btn-sm font-semibold rounded-xl gap-2 mx-auto shadow-xs"
            >
              <IconPlus className="w-4 h-4" />
              Crear Primer Estudio
            </button>
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-200 shadow-xs rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-base-200/60 text-base-content/70 uppercase text-[11px] tracking-wider">
                    <th className="font-bold">Estudio Clínico</th>
                    <th className="font-bold">Descripción / Indicaciones</th>
                    <th className="font-bold">Valores de Referencia</th>
                    <th className="font-bold">Precio</th>
                    <th className="font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudies.map((study) => (
                    <tr key={study.id} className="hover:bg-base-200/40">
                      <td className="font-semibold text-base-content">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            <IconFlask className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block font-bold">{study.name}</span>
                            <span className="text-[10px] text-base-content/50 font-mono">
                              ID: {study.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="max-w-xs text-xs text-base-content/70">
                        {study.description || (
                          <span className="italic text-base-content/40">Sin descripción</span>
                        )}
                      </td>

                      <td className="max-w-xs font-mono text-[11px] text-base-content/80">
                        {study.referenceValues || (
                          <span className="italic font-sans text-base-content/40">No especificado</span>
                        )}
                      </td>

                      <td>
                        <span className="badge badge-ghost font-bold text-xs text-base-content">
                          ${study.price.toFixed(2)} MXN
                        </span>
                      </td>

                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(study)}
                            className="btn btn-xs btn-ghost text-primary hover:bg-primary/10 rounded-lg font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteStudy(study.id, study.name)}
                            className="btn btn-xs btn-ghost text-error hover:bg-error/10 rounded-lg"
                            title="Eliminar estudio"
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
          <div className="modal-box max-w-lg rounded-2xl p-6 border border-base-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-base-200 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <IconFlask className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-base-content">
                    {editingStudy ? 'Editar Estudio Clínico' : 'Nuevo Estudio Clínico'}
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Configuración de parámetros analíticos y tarifas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Alertas */}
            {successMsg && (
              <div className="alert alert-success text-white shadow-xs rounded-xl py-2 mb-3 text-xs">
                <IconCheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="alert alert-error text-white shadow-xs rounded-xl py-2 mb-3 text-xs">
                <IconAlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">
                    Nombre del Estudio Clínico <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Química Sanguínea (6 Elementos)"
                  className="input input-bordered input-sm sm:input-md w-full rounded-xl focus:input-primary text-xs sm:text-sm font-medium"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">
                    Precio al Público ($ MXN) <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej. 350.00"
                  className="input input-bordered input-sm sm:input-md w-full rounded-xl focus:input-primary text-xs sm:text-sm font-mono font-bold"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Descripción / Indicaciones</span>
                </label>
                <textarea
                  placeholder="Ej. Ayuno obligatorio de 8 a 12 horas. Incluye Glucosa, Urea, Creatinina..."
                  className="textarea textarea-bordered w-full rounded-xl focus:textarea-primary text-xs h-20"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Valores de Referencia Médicos</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Glucosa 70-99 mg/dL, Urea 15-45 mg/dL"
                  className="input input-bordered input-sm sm:input-md w-full rounded-xl focus:input-primary text-xs font-mono"
                  value={formData.referenceValues}
                  onChange={(e) => setFormData((prev) => ({ ...prev, referenceValues: e.target.value }))}
                />
              </div>

              <div className="modal-action border-t border-base-200 pt-3.5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-sm btn-ghost rounded-xl text-xs"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary rounded-xl gap-2 font-semibold text-xs shadow-xs"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <IconPlus className="w-4 h-4" />
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
