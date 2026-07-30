// src/utils/locationService.ts

export interface StateItem {
  name: string;
  code?: string;
}

// Lista estática completa de los 32 Estados de México (para respuesta instantánea 0ms)
export const MEXICO_STATES: string[] = [
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'Ciudad de México (CDMX)',
  'Coahuila',
  'Colima',
  'Durango',
  'Estado de México',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'Michoacán',
  'Morelos',
  'Nayarit',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'San Luis Potosí',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatán',
  'Zacatecas',
];

// Mapa estático de ciudades para estados principales de México
export const MEXICO_CITIES_MAP: Record<string, string[]> = {
  'Ciudad de México (CDMX)': [
    'Álvaro Obregón',
    'Azcapotzalco',
    'Benito Juárez',
    'Coyoacán',
    'Cuajimalpa de Morelos',
    'Cuauhtémoc',
    'Gustavo A. Madero',
    'Iztacalco',
    'Iztapalapa',
    'Magdalena Contreras',
    'Miguel Hidalgo',
    'Milpa Alta',
    'Tláhuac',
    'Tlalpan',
    'Venustiano Carranza',
    'Xochimilco',
  ],
  Jalisco: [
    'Guadalajara',
    'Zapopan',
    'San Pedro Tlaquepaque',
    'Tonalá',
    'Tlajomulco de Zúñiga',
    'Puerto Vallarta',
    'Ciudad Guzmán',
    'Lagos de Moreno',
    'Tepatitlán de Morelos',
    'Ocotlán',
    'Arandas',
    'Autlán de Navarro',
    'Tequila',
  ],
  'Nuevo León': [
    'Monterrey',
    'San Pedro Garza García',
    'Guadalupe',
    'Apodaca',
    'San Nicolás de los Garza',
    'Santa Catarina',
    'General Escobedo',
    'Juárez',
    'Cadereyta Jiménez',
    'García',
    'Linares',
  ],
  'Estado de México': [
    'Toluca',
    'Metepec',
    'Ecatepec de Morelos',
    'Naucalpan de Juárez',
    'Tlalnepantla de Baz',
    'Nezahualcóyotl',
    'Cuautitlán Izcalli',
    'Huixquilucan',
    'Atizapán de Zaragoza',
    'Coacalco',
    'Texcoco',
    'Chimalhuacán',
    'Ixtapaluca',
  ],
  Puebla: [
    'Puebla de Zaragoza',
    'San Andrés Cholula',
    'San Pedro Cholula',
    'Tehuacán',
    'Atlixco',
    'San Martín Texmelucan',
    'Huauchinango',
    'Amozoc',
    'Teziutlán',
  ],
  Guanajuato: [
    'León',
    'Irapuato',
    'Celaya',
    'Guanajuato',
    'San Miguel de Allende',
    'Salamanca',
    'Silao',
    'Pénjamo',
    'San Luis de la Paz',
  ],
  Querétaro: [
    'Santiago de Querétaro',
    'San Juan del Río',
    'El Marqués',
    'Corregidora',
    'Tequisquiapan',
    'Huimilpan',
    'Pedro Escobedo',
  ],
  Veracruz: [
    'Veracruz',
    'Xalapa',
    'Coatzacoalcos',
    'Córdoba',
    'Orizaba',
    'Poza Rica',
    'Boca del Río',
    'Minatitlán',
    'Tuxpan',
  ],
  Yucatán: [
    'Mérida',
    'Valladolid',
    'Tizimín',
    'Progreso',
    'Kanasín',
    'Umán',
    'Motul',
  ],
  'Nuevo León (CDMX)': ['Monterrey', 'San Pedro Garza García'],
  'Baja California': [
    'Tijuana',
    'Mexicali',
    'Ensenada',
    'Tecate',
    'Playas de Rosarito',
    'San Quintín',
  ],
  Chihuahua: [
    'Chihuahua',
    'Ciudad Juárez',
    'Delicias',
    'Cuauhtémoc',
    'Hidalgo del Parral',
    'Nuevo Casas Grandes',
  ],
  Sonora: [
    'Hermosillo',
    'Ciudad Obregón',
    'Nogales',
    'San Luis Río Colorado',
    'Navojoa',
    'Guaymas',
    'Puerto Peñasco',
  ],
  Coahuila: [
    'Saltillo',
    'Torreón',
    'Monclova',
    'Piedras Negras',
    'Acuña',
    'Ramos Arizpe',
  ],
  Michoacán: [
    'Morelia',
    'Uruapan',
    'Zamora',
    'Lázaro Cárdenas',
    'Zitácuaro',
    'Apatzingán',
    'Pátzcuaro',
  ],
  'Quintana Roo': [
    'Cancún',
    'Playa del Carmen',
    'Chetumal',
    'Cozumel',
    'Tulum',
    'Isla Mujeres',
  ],
  Sinaloa: [
    'Culiacán',
    'Mazatlán',
    'Los Mochis',
    'Guasave',
    'Guamúchil',
    'Navolato',
  ],
  Tamaulipas: [
    'Reynosa',
    'Heroica Matamoros',
    'Nuevo Laredo',
    'Tampico',
    'Ciudad Victoria',
    'Ciudad Madero',
    'Altamira',
  ],
  Aguascalientes: ['Aguascalientes', 'Jesús María', 'Calvillo'],
  SanLuisPotosi: ['San Luis Potosí', 'Soledad de Graciano Sánchez', 'Ciudad Valles', 'Matehuala'],
  'San Luis Potosí': ['San Luis Potosí', 'Soledad de Graciano Sánchez', 'Ciudad Valles', 'Matehuala'],
};

// Países principales por defecto
export const POPULAR_COUNTRIES: string[] = [
  'México',
  'Estados Unidos',
  'Colombia',
  'España',
  'Argentina',
  'Chile',
  'Perú',
  'Ecuador',
  'Guatemala',
  'Costa Rica',
  'Panamá',
  'Uruguay',
  'Venezuela',
];

/**
 * Obtener estados/provincias por país usando API gratuita https://countriesnow.space con fallback local
 */
export async function getStatesByCountry(country: string): Promise<string[]> {
  const normalized = country.trim().toLowerCase();
  
  if (normalized === 'mexico' || normalized === 'méxico' || normalized === 'mx') {
    return MEXICO_STATES;
  }

  try {
    const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country }),
    });
    const data = await res.json();
    if (!data.error && data.data?.states) {
      return data.data.states.map((s: { name: string }) => s.name);
    }
  } catch (err) {
    console.warn('Fallback a estados locales o vacíos por error de red:', err);
  }

  return [];
}

/**
 * Obtener ciudades por estado y país usando API gratuita https://countriesnow.space con fallback local
 */
export async function getCitiesByState(country: string, state: string): Promise<string[]> {
  if (!state) return [];

  // Chequeo en mapa local de México primero
  if (MEXICO_CITIES_MAP[state]) {
    return MEXICO_CITIES_MAP[state];
  }

  // Normalizar nombre de México si viene en inglés o sin tilde
  let countryParam = country;
  if (country.toLowerCase() === 'méxico' || country.toLowerCase() === 'mexico') {
    countryParam = 'Mexico';
  }

  try {
    const res = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryParam, state }),
    });
    const data = await res.json();
    if (!data.error && Array.isArray(data.data) && data.data.length > 0) {
      return data.data;
    }
  } catch (err) {
    console.warn('Error al obtener ciudades de la API:', err);
  }

  return [];
}
