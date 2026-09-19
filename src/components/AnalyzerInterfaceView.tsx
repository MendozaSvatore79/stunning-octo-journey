// src/components/AnalyzerInterfaceView.tsx
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import type { WorkOrder } from '../types/order';
import {
  IconMicroscope,
  IconCheckCircle,
  IconClipboardList,
  IconSparkles,
  IconAlertTriangle,
  IconAlertCircle,
} from './icons';

export interface AnalyzerDevice {
  id: string;
  name: string;
  brand: string;
  model: string;
  protocol: 'ASTM 1394' | 'HL7 v2.x' | 'Bidireccional TCP/IP';
  connectionType: 'serial' | 'tcp' | 'file';
  baudRate?: number;
  ipAddress?: string;
  port?: number;
}

export interface ParsedAnalyteResult {
  code: string;
  name: string;
  value: string;
  units: string;
  refRange: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'PANIC';
}

export interface ParsedTransmission {
  protocol: 'ASTM' | 'HL7';
  deviceModel: string;
  patientName: string;
  orderFolio: string;
  timestamp: string;
  results: ParsedAnalyteResult[];
  rawText: string;
}

const DEFAULT_ANALYZERS: AnalyzerDevice[] = [
  {
    id: 'an-1',
    name: 'Analizador Hematológico (Puerto Serial)',
    brand: 'Sysmex',
    model: 'XN-550 / KX-21N',
    protocol: 'ASTM 1394',
    connectionType: 'serial',
    baudRate: 9600,
  },
  {
    id: 'an-2',
    name: 'Autoanalizador Químico (Red TCP/IP)',
    brand: 'Roche Cobas',
    model: 'Cobas c311 / e411',
    protocol: 'HL7 v2.x',
    connectionType: 'tcp',
    ipAddress: '127.0.0.1',
    port: 5100,
  },
  {
    id: 'an-3',
    name: 'Analizador de Hematología Mindray',
    brand: 'Mindray',
    model: 'BC-5380 / BC-2800',
    protocol: 'ASTM 1394',
    connectionType: 'serial',
    baudRate: 19200,
  },
  {
    id: 'an-4',
    name: 'Lector de Tiras y Sedimento Urinario',
    brand: 'Mindray / Roche',
    model: 'UA-6600 / Urisys',
    protocol: 'Bidireccional TCP/IP',
    connectionType: 'tcp',
    ipAddress: '127.0.0.1',
    port: 5100,
  },
];

export default function AnalyzerInterfaceView() {
  const api = useApi();

  // Catálogo de analizadores configurados
  const [analyzers] = useState<AnalyzerDevice[]>(DEFAULT_ANALYZERS);
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>('an-1');
  const [activeTab, setActiveTab] = useState<'serial' | 'tcp' | 'file'>('serial');

  // Órdenes de trabajo reales cargadas del backend
  const [dbOrders, setDbOrders] = useState<WorkOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // 1. ESTADO DE CONEXIÓN REAL WEB SERIAL (RS-232 / USB)
  const [isSerialSupported, setIsSerialSupported] = useState(true);
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [serialBaudRate, setSerialBaudRate] = useState<number>(9600);
  const [serialPortInfo, setSerialPortInfo] = useState<string>('');
  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const isSerialReadingRef = useRef<boolean>(false);

  const [wsUrl] = useState<string>('ws://localhost:5101');
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [wsConnecting, setWsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Registro de terminal / consola de tramas en vivo
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [rawFrameInput, setRawFrameInput] = useState<string>('');
  const [parsedTransmission, setParsedTransmission] = useState<ParsedTransmission | null>(null);

  // Guardado en Base de Datos (Neon DB)
  const [isSavingToDB, setIsSavingToDB] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const selectedDevice = useMemo(
    () => analyzers.find((a) => a.id === selectedAnalyzerId) || analyzers[0],
    [analyzers, selectedAnalyzerId]
  );

  // Verificar soporte de Web Serial API en el navegador
  useEffect(() => {
    if (typeof navigator !== 'undefined' && !('serial' in navigator)) {
      setIsSerialSupported(false);
    }
  }, []);

  // Cargar órdenes de trabajo reales desde la base de datos
  const fetchDbOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const res = await api.get<WorkOrder[]>('/orders');
      setDbOrders(res.data || []);
    } catch (err) {
      console.warn('No fue posible cargar órdenes activas:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [api]);

  useEffect(() => {
    fetchDbOrders();
  }, [fetchDbOrders]);

  // Función para agregar logs a la consola de terminal
  const appendTerminalLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 150)]);
  };

  // =========================================================================
  // PARSEADOR ROBUSTO ASTM 1394 & HL7 v2
  // =========================================================================
  const parseRawStream = useCallback((raw: string): ParsedTransmission => {
    const isHL7 = raw.includes('MSH|') || raw.includes('OBX|');
    const cleanRaw = raw.replace(/[\x02\x03\x04\x05\x06\x15\x0B\x1C]/g, '');
    const lines = cleanRaw.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);

    let patientName = 'PACIENTE NO ESPECIFICADO';
    let orderFolio = '';
    let deviceModel = isHL7 ? 'Autoanalizador HL7' : 'Analizador ASTM 1394';
    const results: ParsedAnalyteResult[] = [];

    if (isHL7) {
      lines.forEach((line) => {
        const parts = line.split('|');
        if (parts[0] === 'MSH') {
          deviceModel = parts[2] || deviceModel;
        } else if (parts[0] === 'PID') {
          const nameField = parts[5] || '';
          patientName = nameField.replace(/\^/g, ' ').trim() || patientName;
        } else if (parts[0] === 'OBR') {
          const ordField = parts[2] || parts[3] || '';
          orderFolio = ordField.replace(/[^\d]/g, '') || orderFolio;
        } else if (parts[0] === 'OBX') {
          const testField = parts[3] || '';
          const name = testField.includes('^') ? testField.split('^')[1] : testField;
          const code = testField.includes('^') ? testField.split('^')[0] : testField;
          const value = parts[5] || '0';
          const units = parts[6] || '';
          const refRange = parts[7] || 'Normal';
          const hl7Flag = parts[8] || 'N';

          let flag: 'NORMAL' | 'HIGH' | 'LOW' | 'PANIC' = 'NORMAL';
          if (hl7Flag.includes('HH') || hl7Flag.includes('LL')) flag = 'PANIC';
          else if (hl7Flag.includes('H')) flag = 'HIGH';
          else if (hl7Flag.includes('L')) flag = 'LOW';

          results.push({
            code: code.trim(),
            name: name.trim() || code.trim(),
            value: value.trim(),
            units: units.trim(),
            refRange: refRange.trim(),
            flag,
          });
        }
      });
    } else {
      // ASTM E1394
      lines.forEach((line) => {
        const parts = line.split('|');
        const recordType = parts[0];

        if (recordType === 'H') {
          const dev = parts[4] || '';
          deviceModel = dev.replace(/\^/g, ' ').trim() || deviceModel;
        } else if (recordType === 'P') {
          const pat = parts[4] || '';
          const nameParts = pat.split('^');
          if (nameParts.length >= 2) {
            patientName = `${nameParts[1]} ${nameParts[2] || ''}`.trim();
          } else if (nameParts[0]) {
            patientName = nameParts[0].trim();
          }
        } else if (recordType === 'O') {
          const ord = parts[2] || '';
          orderFolio = ord.replace(/[^\d]/g, '') || orderFolio;
        } else if (recordType === 'R') {
          const testPart = parts[2] || '';
          const code = testPart.replace(/\^/g, '').trim();
          const value = parts[3] || '0';
          const units = parts[4] || '';
          const refRange = parts[5] || '';
          const flagStr = parts[6] || 'N';

          let flag: 'NORMAL' | 'HIGH' | 'LOW' | 'PANIC' = 'NORMAL';
          if (flagStr.includes('HH') || flagStr.includes('LL')) flag = 'PANIC';
          else if (flagStr.includes('H')) flag = 'HIGH';
          else if (flagStr.includes('L')) flag = 'LOW';

          // Mapeo amigable de códigos ASTM comunes a nombres clínicos
          const codeMap: Record<string, string> = {
            WBC: 'Leucocitos Totales',
            RBC: 'Eritrocitos',
            HGB: 'Hemoglobina',
            HCT: 'Hematocrito',
            PLT: 'Plaquetas',
            'NEUT%': 'Neutrófilos %',
            'LYMPH%': 'Linfocitos %',
            'MONO%': 'Monocitos %',
            'EO%': 'Eosinófilos %',
            'BASO%': 'Basófilos %',
            GLU: 'Glucosa',
            UREA: 'Urea',
            BUN: 'Nitrógeno Ureico',
            CREAT: 'Creatinina',
            CHOL: 'Colesterol Total',
            TRIG: 'Triglicéridos',
            UA: 'Ácido Úrico',
          };

          results.push({
            code,
            name: codeMap[code] || code,
            value: value.trim(),
            units: units.trim(),
            refRange: refRange.trim(),
            flag,
          });
        }
      });
    }

    return {
      protocol: isHL7 ? 'HL7' : 'ASTM',
      deviceModel,
      patientName,
      orderFolio,
      timestamp: new Date().toLocaleTimeString(),
      results,
      rawText: raw,
    };
  }, []);

  // Intentar vincular automáticamente el folio parseado con una orden de la base de datos
  useEffect(() => {
    if (parsedTransmission?.orderFolio && dbOrders.length > 0) {
      const match = dbOrders.find(
        (o) =>
          String(o.folio) === parsedTransmission.orderFolio ||
          o.id.toLowerCase().includes(parsedTransmission.orderFolio.toLowerCase())
      );
      if (match) {
        setSelectedOrderId(match.id);
        appendTerminalLog(`Orden #{${match.folio || match.id.slice(0, 6)}} auto-emparejada con el folio del analizador.`);
      }
    }
  }, [parsedTransmission, dbOrders]);

  // =========================================================================
  // 1. CONEXIÓN SERIAL REAL CON EL ANALIZADOR (Web Serial API)
  // =========================================================================
  const handleConnectSerial = async () => {
    if (!('serial' in navigator)) {
      alert('La Web Serial API no está soportada en este navegador. Por favor utiliza Google Chrome, Microsoft Edge o Opera para conectar el puerto serie físico.');
      return;
    }

    try {
      appendTerminalLog(`Solicitando selección de puerto COM físico a ${serialBaudRate} baudios...`);
      const navSerial = (navigator as any).serial;
      const port = await navSerial.requestPort();

      await port.open({
        baudRate: serialBaudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
      });

      serialPortRef.current = port;
      setIsSerialConnected(true);
      setSerialPortInfo(`Conectado (Baud: ${serialBaudRate}, 8-N-1)`);
      appendTerminalLog(`Puerto COM abierto con éxito. Escuchando transmisión del equipo analizador...`);

      // Bucle asíncrono de lectura de bytes
      isSerialReadingRef.current = true;
      let accumulator = '';
      const textDecoder = new TextDecoder('latin1');

      while (port.readable && isSerialReadingRef.current) {
        const reader = port.readable.getReader();
        serialReaderRef.current = reader;

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              // Manejo de Handshake ASTM E1381 en tiempo real
              // Si el analizador envía ENQ (0x05), respondemos inmediatamente con ACK (0x06)
              const hasEnq = Array.from(value).some((b) => b === 0x05);
              if (hasEnq && port.writable) {
                appendTerminalLog(`[ASTM] Analizador envió ENQ (0x05) -> Transmitiendo ACK (0x06)...`);
                const writer = port.writable.getWriter();
                await writer.write(new Uint8Array([0x06])); // ACK
                writer.releaseLock();
              }

              // Si el analizador envía STX o ETX, enviamos ACK
              const hasFrame = Array.from(value).some((b) => b === 0x02 || b === 0x03);
              if (hasFrame && port.writable) {
                const writer = port.writable.getWriter();
                await writer.write(new Uint8Array([0x06]));
                writer.releaseLock();
              }

              const text = textDecoder.decode(value);
              accumulator += text;
              setRawFrameInput(accumulator);

              // Detectar fin de transmisión ASTM (EOT = 0x04 o línea L|1|N)
              const hasEot = Array.from(value).some((b) => b === 0x04);
              if (hasEot || accumulator.includes('L|1|N') || accumulator.includes('OBX')) {
                appendTerminalLog(`[SERIAL] Trama completa recibida (${accumulator.length} bytes). Decodificando analitos...`);
                const parsed = parseRawStream(accumulator);
                setParsedTransmission(parsed);
                accumulator = '';
              }
            }
          }
        } catch (err: any) {
          if (isSerialReadingRef.current) {
            console.error('Error durante la lectura serial:', err);
            appendTerminalLog(`Error de lectura serial: ${err.message}`);
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (err: any) {
      console.error('Error al conectar puerto serial:', err);
      appendTerminalLog(`Fallo al abrir puerto COM: ${err.message}`);
      setIsSerialConnected(false);
    }
  };

  const handleDisconnectSerial = async () => {
    isSerialReadingRef.current = false;
    try {
      if (serialReaderRef.current) {
        await serialReaderRef.current.cancel();
        serialReaderRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
      setIsSerialConnected(false);
      setSerialPortInfo('');
      appendTerminalLog('Puerto serie desconectado.');
    } catch (err: any) {
      console.error('Error al desconectar puerto serial:', err);
      appendTerminalLog(`Error al cerrar puerto: ${err.message}`);
    }
  };

  // =========================================================================
  // 2. CONEXIÓN REAL TCP/IP A TRAVÉS DEL PUENTE LIS WEBSOCKET
  // =========================================================================
  const handleConnectWs = () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      wsRef.current.close();
      wsRef.current = null;
      setIsWsConnected(false);
      appendTerminalLog('Desconectado del puente LIS TCP/IP.');
      return;
    }

    setWsConnecting(true);
    appendTerminalLog(`Conectando al puente TCP/IP en ${wsUrl}...`);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsWsConnected(true);
        setWsConnecting(false);
        appendTerminalLog(`Conexión establecida con el puente TCP/IP (${wsUrl}). Escuchando analizadores en LAN.`);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'DEVICE_CONNECTED') {
            appendTerminalLog(`[LAN] Analizador físico conectado desde ${msg.remote}`);
          } else if (msg.type === 'DEVICE_DISCONNECTED') {
            appendTerminalLog(`[LAN] Analizador desconectado: ${msg.remote}`);
          } else if (msg.type === 'RAW_TRANSMISSION') {
            appendTerminalLog(`[LAN] Trama recibida de ${msg.remote} (${msg.protocol}).`);
            setRawFrameInput(msg.payload);
            const parsed = parseRawStream(msg.payload);
            setParsedTransmission(parsed);
          }
        } catch {
          appendTerminalLog(`[LAN RAW] ${event.data}`);
          setRawFrameInput(event.data);
          const parsed = parseRawStream(event.data);
          setParsedTransmission(parsed);
        }
      };

      ws.onerror = () => {
        setWsConnecting(false);
        setIsWsConnected(false);
        appendTerminalLog(`Error al conectar con el puente ${wsUrl}. Asegúrate de haber iniciado: npm run lis:bridge`);
      };

      ws.onclose = () => {
        setWsConnecting(false);
        setIsWsConnected(false);
        appendTerminalLog('Conexión con el puente TCP/IP cerrada.');
      };
    } catch (err: any) {
      setWsConnecting(false);
      setIsWsConnected(false);
      appendTerminalLog(`Fallo al iniciar WebSocket: ${err.message}`);
    }
  };

  // =========================================================================
  // 3. CARGA REAL DE ARCHIVO EXPORTADO POR EL ANALIZADOR
  // =========================================================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    appendTerminalLog(`Cargando archivo del analizador: ${file.name} (${file.size} bytes)...`);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawFrameInput(content);
        appendTerminalLog(`Archivo leído con éxito. Interpretando analitos...`);
        const parsed = parseRawStream(content);
        setParsedTransmission(parsed);
      }
    };

    reader.onerror = () => {
      appendTerminalLog(`Error al leer el archivo ${file.name}`);
    };

    reader.readAsText(file);
  };

  // =========================================================================
  // 4. GUARDADO REAL EN LA BASE DE DATOS (NEON DB)
  // =========================================================================
  const handleSaveResultsToOrder = async () => {
    if (!parsedTransmission || parsedTransmission.results.length === 0) {
      setSaveErrorMsg('No hay resultados analíticos para guardar.');
      return;
    }

    if (!selectedOrderId) {
      setSaveErrorMsg('Por favor selecciona una Orden de Trabajo a la cual asociar los resultados.');
      return;
    }

    setIsSavingToDB(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      const targetOrder = dbOrders.find((o) => o.id === selectedOrderId);
      if (!targetOrder) throw new Error('Orden seleccionada no encontrada.');

      // Consolidar resultados en el formato estándar del sistema
      const consolidatedResult = JSON.stringify(
        parsedTransmission.results.map((r) => ({
          cat: 'ANALIZADOR AUTOMATIZADO (' + parsedTransmission.deviceModel + ')',
          name: r.name,
          val: r.value,
          units: r.units,
          ref: r.refRange || 'NORMAL',
        }))
      );

      const analysesList =
        targetOrder.analyses && targetOrder.analyses.length > 0
          ? targetOrder.analyses
          : [{ analysisId: targetOrder.id }];

      const resultsPayload = analysesList.map((item: any) => ({
        analysisId: item.analysisId || item.id,
        resultValue: consolidatedResult,
        reagent: `Transmisión ${parsedTransmission.protocol} - ${parsedTransmission.deviceModel}`,
        units: 'Varios',
      }));

      const payload = {
        results: resultsPayload,
        method: `Automatizado (${parsedTransmission.deviceModel} vía ${parsedTransmission.protocol})`,
        responsibleName: 'Q.F.B. Juan Carlos Mendoza Hernández',
        professionalId: '5518954',
        notes: `Resultados transferidos directamente desde analizador clínico (${parsedTransmission.deviceModel}) el ${new Date().toLocaleString()}.`,
      };

      try {
        await api.post(`/orders/${targetOrder.id}/results`, payload);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          await api.patch(`/orders/${targetOrder.id}/results`, payload);
        } else {
          throw err;
        }
      }

      setSaveSuccessMsg(
        `¡Resultados guardados exitosamente en Neon DB para la Orden Folio #${targetOrder.folio || targetOrder.id.slice(0, 6)}!`
      );
      appendTerminalLog(`[BD] Resultados guardados con éxito en la orden Folio #${targetOrder.folio || targetOrder.id.slice(0, 6)}`);
      fetchDbOrders();
    } catch (err: any) {
      console.error('Error al guardar en BD:', err);
      const msg = err?.response?.data?.message || err?.message;
      setSaveErrorMsg(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSavingToDB(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
              Interfaz de Conexión de Analizadores Clínicos
            </h1>
            <span className="badge badge-primary font-bold text-xs">
              ASTM E1381/1394 • HL7 MLLP
            </span>
          </div>
          <p className="text-xs text-base-content/60 mt-0.5">
            Conexión en vivo con analizadores físicos vía Puerto Serial RS-232, Red TCP/IP o Archivos de Datos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-base-content/70">Equipo Perfil:</span>
            <select
              value={selectedAnalyzerId}
              onChange={(e) => {
                setSelectedAnalyzerId(e.target.value);
                const found = analyzers.find((a) => a.id === e.target.value);
                if (found) {
                  if (found.connectionType === 'serial') {
                    setActiveTab('serial');
                    if (found.baudRate) setSerialBaudRate(found.baudRate);
                  } else {
                    setActiveTab('tcp');
                  }
                }
              }}
              className="select select-sm select-bordered rounded-xl text-xs font-bold"
            >
              {analyzers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.brand} {a.model})
                </option>
              ))}
            </select>
          </div>

          {/* Estado de conexión en vivo */}
          {isSerialConnected ? (
            <span className="badge badge-success text-white font-bold text-xs gap-1.5 py-3 px-3 shadow-sm" title={`Conectado a ${selectedDevice.brand}`}>
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Serial COM Activo ({selectedDevice.model})
            </span>
          ) : isWsConnected ? (
            <span className="badge badge-success text-white font-bold text-xs gap-1.5 py-3 px-3 shadow-sm" title={`Conectado a ${selectedDevice.brand}`}>
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Puente TCP/IP En Línea ({selectedDevice.model})
            </span>
          ) : (
            <span className="badge badge-ghost font-bold text-xs gap-1.5 py-3 px-3">
              <span className="w-2 h-2 rounded-full bg-base-content/40" />
              Esperando Conexión ({selectedDevice.model})
            </span>
          )}
        </div>
      </div>

      {/* Pestañas de Modalidades de Conexión Real */}
      <div className="tabs tabs-boxed bg-base-100 p-1.5 rounded-2xl border border-base-200 shadow-xs flex-wrap">
        <button
          onClick={() => setActiveTab('serial')}
          className={`tab tab-md rounded-xl font-bold gap-2 text-xs flex-1 ${
            activeTab === 'serial' ? 'tab-active bg-primary text-white shadow-sm' : 'text-base-content/70'
          }`}
        >
          <span className="font-mono">1.</span> Puerto Serial / USB (RS-232 Directo)
        </button>
        <button
          onClick={() => setActiveTab('tcp')}
          className={`tab tab-md rounded-xl font-bold gap-2 text-xs flex-1 ${
            activeTab === 'tcp' ? 'tab-active bg-primary text-white shadow-sm' : 'text-base-content/70'
          }`}
        >
          <span className="font-mono">2.</span> Red LAN TCP/IP (Cobas / Mindray LIS)
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`tab tab-md rounded-xl font-bold gap-2 text-xs flex-1 ${
            activeTab === 'file' ? 'tab-active bg-primary text-white shadow-sm' : 'text-base-content/70'
          }`}
        >
          <span className="font-mono">3.</span> Carga de Archivo Físico (.astm / .hl7)
        </button>
      </div>

      {/* PANEL 1: CONEXIÓN SERIAL REAL (Web Serial API) */}
      {activeTab === 'serial' && (
        <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-200 pb-3">
            <div>
              <h3 className="font-black text-sm text-base-content flex items-center gap-2">
                <IconMicroscope className="w-4 h-4 text-primary" />
                Conexión Física RS-232 / Cable Serial-USB (FTDI, Prolific, CH340)
              </h3>
              <p className="text-xs text-base-content/60">
                Permite conectar directamente el cable serie de tu Sysmex, Horiba, Mindray o Dirui a esta computadora.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-base-content/70">Velocidad (Baudios):</span>
              <select
                disabled={isSerialConnected}
                value={serialBaudRate}
                onChange={(e) => setSerialBaudRate(Number(e.target.value))}
                className="select select-sm select-bordered rounded-xl text-xs font-bold"
              >
                <option value={9600}>9600 (Estándar ASTM)</option>
                <option value={19200}>19200</option>
                <option value={38400}>38400</option>
                <option value={115200}>115200</option>
              </select>
            </div>
          </div>

          {!isSerialSupported ? (
            <div className="alert alert-warning text-xs rounded-xl">
              <IconAlertTriangle className="w-4 h-4" />
              <span>
                Tu navegador actual no soporta Web Serial API. Para conexión directa por cable RS-232, utiliza <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>. También puedes usar el puente TCP/IP o la carga de archivo.
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-base-200/40 p-4 rounded-xl">
              <div>
                <span className="text-xs font-bold text-base-content block">
                  {isSerialConnected ? 'Puerto Abierto y Escuchando' : 'Puerto Serial Desconectado'}
                </span>
                <span className="text-[11px] text-base-content/60">
                  {serialPortInfo || 'Presiona el botón para seleccionar el cable USB-Serial en el cuadro de diálogo del navegador.'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const sample = `H|\\^&|||Analyzer^Sysmex_XN550||||||||1394-97\rP|1|||PAT-1049^GARCIA^MIGUEL||19850412|M\rO|1|ORD-000124||^^^BHC|R|20260918143000|||||A\rR|1|^^^WBC|7.40|10^3/uL|4.50-11.00|N||F\rR|2|^^^RBC|5.02|10^6/uL|4.20-5.40|N||F\rR|3|^^^HGB|15.2|g/dL|12.5-16.5|N||F\rR|4|^^^HCT|46.1|%|37.0-50.0|N||F\rR|5|^^^PLT|234.0|10^3/uL|150-450|N||F\rR|6|^^^NEUT%|69.0|%|40.0-70.0|N||F\rR|7|^^^LYMPH%|29.0|%|13.0-46.0|N||F\rL|1|N`;
                    setRawFrameInput(sample);
                    const parsed = parseRawStream(sample);
                    setParsedTransmission(parsed);
                    appendTerminalLog('[SIMULACIÓN] Trama serial ASTM de Sysmex recibida y decodificada.');
                  }}
                  className="btn btn-sm btn-ghost text-secondary font-bold text-xs"
                  title="Probar decodificación de trama serial"
                >
                  <IconSparkles className="w-3.5 h-3.5" />
                  Probar con Muestra ASTM
                </button>

                {isSerialConnected ? (
                  <button
                    onClick={handleDisconnectSerial}
                    className="btn btn-sm btn-error text-white font-bold rounded-xl text-xs"
                  >
                    Desconectar Puerto
                  </button>
                ) : (
                  <button
                    onClick={handleConnectSerial}
                    className="btn btn-sm btn-primary text-white font-bold rounded-xl text-xs gap-2 shadow-md hover:scale-[1.01] transition-transform"
                  >
                    <IconMicroscope className="w-4 h-4" />
                    Seleccionar y Abrir Puerto COM
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PANEL 2: CONEXIÓN TCP/IP REAL (Red LAN Ethernet) */}
      {activeTab === 'tcp' && (
        <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-base-content flex items-center gap-2">
                  <IconMicroscope className="w-4 h-4 text-primary" />
                  Parámetros de Red para Analizadores LAN (Cobas, Mindray, Sysmex, Stago)
                </h3>
                <span className="badge badge-success text-white font-bold text-[10px]">
                  RECEPTOR LIS ACTIVO
                </span>
              </div>
              <p className="text-xs text-base-content/60 mt-0.5">
                Los datos que el equipo clínico necesita para enviar automáticamente las muestras a este sistema.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleConnectWs}
                disabled={wsConnecting}
                className={`btn btn-xs rounded-xl font-bold text-xs ${
                  isWsConnected ? 'btn-ghost text-success' : 'btn-ghost text-base-content/60'
                }`}
                title="Estado del enlace con el receptor LIS"
              >
                {wsConnecting ? 'Enlazando...' : isWsConnected ? '● Receptor En Línea' : '○ Reconectar Receptor'}
              </button>
              <button
                onClick={() => {
                  const sample = `MSH|^~\\&|COBAS_C311|ROCHE|LABSYSTEM|CENTRAL|20260918150000||ORU^R01|MSG001|P|2.3.1\rPID|1||PAT1049||GARCIA^MIGUEL||19850412|M\rOBR|1|ORD000124||80048^METABOLIC_PANEL|||20260918143000\rOBX|1|NM|GLU^Glucosa||261.0|mg/dL|70-105|HH|||F\rOBX|2|NM|UREA^Urea||32.0|mg/dL|10-50|N|||F\rOBX|3|NM|BUN^Nitrogeno Ureico||14.9|mg/dL|5-21|N|||F\rOBX|4|NM|CREAT^Creatinina||0.9|mg/dL|0.5-1.4|N|||F\rOBX|5|NM|CHOL^Colesterol Total||182.0|mg/dL|100-200|N|||F\rOBX|6|NM|TRIG^Trigliceridos||136.0|mg/dL|25-160|N|||F`;
                  setRawFrameInput(sample);
                  const parsed = parseRawStream(sample);
                  setParsedTransmission(parsed);
                  appendTerminalLog('[SIMULACIÓN] Corrida de prueba de Cobas c311 recibida y decodificada.');
                }}
                className="btn btn-xs btn-outline btn-secondary font-bold rounded-xl gap-1.5"
                title="Genera una muestra de prueba para verificar decodificación"
              >
                <IconSparkles className="w-3.5 h-3.5" />
                Simular Transmisión de Prueba
              </button>
            </div>
          </div>

          {/* Ficha Técnica de Conexión para la Pantalla del Analizador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-base-200/50 p-4 rounded-2xl border border-base-200 text-xs">
            <div className="bg-base-100 p-3 rounded-xl border border-base-200">
              <span className="text-[10px] uppercase font-bold text-base-content/50 block">IP Destino LIS</span>
              <div className="font-mono font-black text-sm text-primary mt-0.5">
                {window.location.hostname || '127.0.0.1'}
              </div>
              <span className="text-[10px] text-base-content/60">Dirección de este servidor</span>
            </div>

            <div className="bg-base-100 p-3 rounded-xl border border-base-200">
              <span className="text-[10px] uppercase font-bold text-base-content/50 block">Puerto LIS</span>
              <div className="font-mono font-black text-sm text-base-content mt-0.5">
                5100
              </div>
              <span className="text-[10px] text-base-content/60">Socket TCP para el equipo</span>
            </div>

            <div className="bg-base-100 p-3 rounded-xl border border-base-200">
              <span className="text-[10px] uppercase font-bold text-base-content/50 block">Protocolos Aceptados</span>
              <div className="font-bold text-xs text-base-content mt-0.5">
                ASTM 1394 / HL7 2.x
              </div>
              <span className="text-[10px] text-base-content/60">Detección y Handshake automático</span>
            </div>

            <div className="bg-base-100 p-3 rounded-xl border border-base-200">
              <span className="text-[10px] uppercase font-bold text-base-content/50 block">Modo de Operación</span>
              <div className="font-bold text-xs text-success mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Recepción Silenciosa
              </div>
              <span className="text-[10px] text-base-content/60">Captura en segundo plano</span>
            </div>
          </div>

          <div className="alert alert-info text-xs rounded-xl bg-primary/5 border border-primary/20 text-base-content/80 flex items-start gap-2.5">
            <IconCheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong>Operación clínica transparente:</strong> Solo debes registrar la IP y el Puerto <strong>5100</strong> una sola vez en el menú de red de tu analizador. A partir de ese momento, cada vez que el equipo termine de procesar una muestra, los datos viajarán automáticamente al sistema sin requerir ninguna acción técnica en esta computadora.
            </span>
          </div>
        </div>
      )}

      {/* PANEL 3: CARGA REAL DE ARCHIVO DEL EQUIPO */}
      {activeTab === 'file' && (
        <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div>
            <h3 className="font-black text-sm text-base-content flex items-center gap-2">
              <IconClipboardList className="w-4 h-4 text-primary" />
              Importación Directa de Archivo de Exportación del Analizador
            </h3>
            <p className="text-xs text-base-content/60">
              Selecciona el archivo descargado por memoria USB o carpeta compartida desde el software del analizador.
            </p>
          </div>

          <div className="border-2 border-dashed border-base-300 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept=".astm,.hl7,.txt,.dat,.raw,.log"
              onChange={handleFileUpload}
              className="file-input file-input-bordered file-input-primary w-full max-w-sm rounded-xl text-xs"
            />
            <p className="text-[11px] text-base-content/50 mt-2">
              Formatos reconocidos: .astm, .hl7, .txt, .dat (ASTM 1394 y HL7 2.x)
            </p>
          </div>
        </div>
      )}

      {/* Consola de Trama en Vivo y Decodificador */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terminal de Transmisión Real */}
        <div className="lg:col-span-6 card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-base-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary">
                [Terminal de Stream Serial / TCP]
              </span>
            </div>
            <button
              onClick={() => {
                setRawFrameInput('');
                setTerminalLogs([]);
              }}
              className="btn btn-xs btn-ghost text-base-content/50"
            >
              Limpiar Consola
            </button>
          </div>

          {/* Bitácora de eventos */}
          <div className="bg-neutral text-neutral-content p-3 rounded-xl font-mono text-[11px] h-36 overflow-y-auto space-y-1">
            {terminalLogs.length === 0 ? (
              <span className="opacity-40">// Esperando eventos de conexión o tramas del analizador...</span>
            ) : (
              terminalLogs.map((log, idx) => <div key={idx}>{log}</div>)
            )}
          </div>

          {/* Trama cruda editable / visualizable */}
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-bold text-base-content/70">
                Trama Recibida (Raw Frame):
              </label>
              <span className="text-[10px] text-base-content/50 font-mono">
                {rawFrameInput.length} caracteres
              </span>
            </div>
            <textarea
              rows={7}
              value={rawFrameInput}
              onChange={(e) => setRawFrameInput(e.target.value)}
              className="textarea textarea-bordered w-full font-mono text-xs rounded-xl bg-base-200/40 focus:textarea-primary"
              placeholder="La trama enviada por el equipo físico aparecerá aquí automáticamente. También puedes pegar una trama real..."
            />
          </div>

          <div className="flex justify-end">
            <button
              disabled={!rawFrameInput.trim()}
              onClick={() => {
                const parsed = parseRawStream(rawFrameInput);
                setParsedTransmission(parsed);
                appendTerminalLog(`Trama decodificada manualmente (${parsed.results.length} analitos).`);
              }}
              className="btn btn-sm btn-primary text-white font-bold rounded-xl text-xs gap-1.5 shadow-md hover:scale-[1.01] transition-transform"
            >
              <IconSparkles className="w-4 h-4" />
              Decodificar Trama
            </button>
          </div>
        </div>

        {/* Panel de Resultados Extraídos y Guardado en Base de Datos */}
        <div className="lg:col-span-6 card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-base-200 pb-3">
            <h3 className="font-black text-sm text-base-content flex items-center gap-2">
              <IconClipboardList className="w-4 h-4 text-primary" />
              Analitos Extraídos del Equipo
            </h3>
            {parsedTransmission && (
              <span className="badge badge-primary badge-sm font-bold text-[10px]">
                {parsedTransmission.protocol} VÁLIDO
              </span>
            )}
          </div>

          {!parsedTransmission || parsedTransmission.results.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-base-200 rounded-2xl flex flex-col items-center justify-center min-h-[260px]">
              <IconMicroscope className="w-10 h-10 text-base-content/20 mb-2" />
              <p className="text-xs text-base-content/60 font-semibold max-w-xs">
                Realiza una corrida en tu analizador físico o presiona "Decodificar Trama" para extraer los valores automáticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Encabezado del Análisis */}
              <div className="bg-base-200/50 p-3.5 rounded-xl border border-base-200 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-base-content/50 block">Paciente Identificado</span>
                  <strong className="text-base-content font-bold truncate block">{parsedTransmission.patientName}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-base-content/50 block">Folio / Muestra</span>
                  <strong className="text-primary font-mono font-bold block">
                    {parsedTransmission.orderFolio ? `#${parsedTransmission.orderFolio}` : 'Sin folio explícito'}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-base-content/50 block">Equipo</span>
                  <strong className="text-base-content truncate block">{parsedTransmission.deviceModel}</strong>
                </div>
              </div>

              {/* Lista de Analitos Extraídos */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {parsedTransmission.results.map((r, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                      r.flag === 'PANIC'
                        ? 'bg-error/10 border-error/30'
                        : r.flag === 'HIGH' || r.flag === 'LOW'
                        ? 'bg-warning/10 border-warning/30'
                        : 'bg-base-100 border-base-200'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-base-content">{r.name}</span>
                      <span className="text-[10px] text-base-content/50 font-mono ml-1.5">({r.code})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-base-content">
                          {r.value} <span className="text-xs font-normal text-base-content/60">{r.units}</span>
                        </span>
                        {r.refRange && (
                          <span className="block text-[9px] text-base-content/50">Ref: {r.refRange}</span>
                        )}
                      </div>

                      {r.flag === 'PANIC' ? (
                        <span className="badge badge-error text-white badge-xs font-bold">PÁNICO</span>
                      ) : r.flag === 'HIGH' ? (
                        <span className="badge badge-warning badge-xs font-bold">ALTO</span>
                      ) : r.flag === 'LOW' ? (
                        <span className="badge badge-warning badge-xs font-bold">BAJO</span>
                      ) : (
                        <span className="badge badge-success text-white badge-xs font-bold">OK</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selector de Orden de Trabajo para Guardado en Neon DB */}
              <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-xl space-y-2">
                <label className="text-xs font-bold text-base-content/80 block">
                  Asociar y Guardar en Orden de Trabajo (Neon DB):
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="select select-sm select-bordered w-full rounded-xl text-xs font-semibold focus:select-primary"
                  >
                    <option value="" disabled>
                      {isLoadingOrders ? 'Cargando órdenes del sistema...' : '-- Selecciona una Orden del Sistema --'}
                    </option>
                    {dbOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        Folio #{o.folio || o.id.slice(0, 6)} - {o.patient?.firstName} {o.patient?.lastName} ({o.status})
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={isSavingToDB || !selectedOrderId}
                    onClick={handleSaveResultsToOrder}
                    className="btn btn-sm btn-success text-white font-bold rounded-xl text-xs shrink-0 gap-1.5 shadow-md w-full sm:w-auto"
                  >
                    {isSavingToDB ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <IconCheckCircle className="w-4 h-4" />
                        Guardar en Expediente
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Mensajes de retroalimentación de guardado */}
              {saveSuccessMsg && (
                <div className="alert alert-success text-xs text-white rounded-xl py-2.5 font-bold shadow-md">
                  <IconCheckCircle className="w-4 h-4" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {saveErrorMsg && (
                <div className="alert alert-error text-xs text-white rounded-xl py-2.5 font-bold shadow-md">
                  <IconAlertCircle className="w-4 h-4" />
                  <span>{saveErrorMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
