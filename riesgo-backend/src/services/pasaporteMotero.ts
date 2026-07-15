import { supabase } from '../supabase';
import { MODULOS_VIAL } from './certificado';

// Módulos que alimentan el Pasaporte de Movilidad Segura (perfil persistente por cédula,
// a diferencia del resto de RiesGO! donde cada PIN es de un solo uso). Es toda la familia
// RiesGO! Vial avalada por la Agencia Nacional de Seguridad Vial (ANSV), no solo Auteco.
export const MODULOS_CON_PASAPORTE = MODULOS_VIAL;

const PUNTOS_POR_ACIERTO = 50;

const NIVELES: { nombre: string; minimo: number }[] = [
  { nombre: 'Embajador', minimo: 3500 },
  { nombre: 'Experto', minimo: 2500 },
  { nombre: 'Avanzado', minimo: 1500 },
  { nombre: 'En Ruta', minimo: 500 },
  { nombre: 'Iniciando', minimo: 0 },
];

export const CATEGORIAS_INSIGNIA = ['equipamiento', 'normas', 'atencion', 'tumoto', 'condiciones', 'respeto'];

function calcularNivel(puntos: number): string {
  return NIVELES.find((n) => puntos >= n.minimo)?.nombre || 'Iniciando';
}

interface DetalleItem {
  pregunta_id?: string;
  correcta: boolean;
  categoria?: string | null;
}

interface ActualizarPasaporteParams {
  cedula: string;
  nombre: string;
  celular?: string | null;
  idEmpresa: string;
  detalle: DetalleItem[];
}

export async function actualizarPasaporte(params: ActualizarPasaporteParams) {
  const aciertos = params.detalle.filter((d) => d.correcta);
  const puntosGanados = aciertos.length * PUNTOS_POR_ACIERTO;

  const { data: existente, error: findError } = await supabase
    .from('pasaportes_motero')
    .select('*')
    .eq('cedula', params.cedula)
    .maybeSingle();

  if (findError) throw findError;

  const insigniasPrevias: Record<string, boolean> = existente?.insignias || {};
  const insigniasNuevas: string[] = [];

  for (const item of aciertos) {
    if (item.categoria && !insigniasPrevias[item.categoria]) {
      insigniasPrevias[item.categoria] = true;
      insigniasNuevas.push(item.categoria);
    }
  }

  const puntosTotal = (existente?.puntos_total || 0) + puntosGanados;
  const nivelAnterior = existente?.nivel || 'Iniciando';
  const nivelNuevo = calcularNivel(puntosTotal);

  const { data: actualizado, error: upsertError } = await supabase
    .from('pasaportes_motero')
    .upsert(
      {
        cedula: params.cedula,
        nombre: params.nombre,
        celular: params.celular || null,
        id_empresa: params.idEmpresa,
        puntos_total: puntosTotal,
        nivel: nivelNuevo,
        insignias: insigniasPrevias,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'cedula' }
    )
    .select()
    .single();

  if (upsertError) throw upsertError;

  return {
    puntosGanados,
    puntosTotal,
    nivel: nivelNuevo,
    subioDeNivel: nivelNuevo !== nivelAnterior,
    insignias: insigniasPrevias,
    insigniasNuevas,
  };
}

export async function obtenerPasaporte(cedula: string) {
  const { data, error } = await supabase.from('pasaportes_motero').select('*').eq('cedula', cedula).maybeSingle();

  if (error) throw error;
  return data;
}
