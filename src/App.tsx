import { Camera, CheckCircle2, ClipboardList, Download, FileText, Home, Lock, MapPin, Plus, QrCode, RefreshCcw, Save, Settings, Shield, Trash2, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type ActiveWorkContext,
  type AdminDevice,
  type AppMode,
  type Hub,
  type ProofPhotoSlot,
  type ProofRecord,
  type ResponsibleStaff,
  addAudit,
  approveAdminDevice,
  bootstrapCentralConfig,
  capturePhotoForSlot,
  clearAdminSession,
  createDraftRecord,
  DEFAULT_HUB,
  DEFAULT_STAFF,
  downloadBlob,
  ensureSeedData,
  generateExportZip,
  getActiveContext,
  getCentralBackendStatus,
  getCentralBackendUrl,
  getLocalDateString,
  findCentralRecordByKey,
  initOrRepairCentralStorage,
  getMissingPhotoSlots,
  getRecordById,
  getSettings,
  getPendingSyncCount,
  changeAdminPin,
  hasAdminPin,
  isEmployeeDeviceMode,
  listAdminDevices,
  listAudit,
  listHubs,
  listRecords,
  listResponsibleStaff,
  normalizeVehicleBarcode,
  retryPendingSync,
  revokeAdminDevice,
  saveActiveContext,
  saveHubs,
  saveRecords,
  saveResponsibleStaff,
  saveSettings,
  setAdminPin,
  setCentralAdminDeviceApprovalRequired,
  setCentralAdminPin,
  setEmployeeDeviceMode,
  submitRecordWithGoogleSync,
  testGoogleConnection,
  verifyCentralAdminAccess,
  verifyAdminPin,
  resetLocalTestData,
  updatePhotoSlotsForDropCount,
  upsertRecord,
} from './services/reset003';

type FrontlineStep = 'home' | 'scan' | 'photos' | 'done' | 'my-work';
type AdminStep = 'dashboard' | 'hubs' | 'staff' | 'records' | 'photos' | 'export' | 'backup' | 'settings' | 'audit' | 'admin-devices';

type BarcodeDetectorShape = new (options?: { formats?: string[] }) => {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

export default function App() {
  const [mode, setMode] = useState<AppMode>('frontline');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPinPanel, setAdminPinPanel] = useState<'unlock' | 'central-unlock' | 'backend-missing' | 'notice' | 'setup-token' | null>(null);
  const [employeeMode, setEmployeeMode] = useState(isEmployeeDeviceMode());
  const [bootstrapMessage, setBootstrapMessage] = useState('รอซิงก์');
  const [frontlineStep, setFrontlineStep] = useState<FrontlineStep>('home');
  const [adminStep, setAdminStep] = useState<AdminStep>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeRecordId, setActiveRecordId] = useState('');
  const hiddenAdminTimerRef = useRef<number | null>(null);

  useEffect(() => {
    ensureSeedData();
    bootstrapCentralConfig().then((result) => {
      if (getCentralBackendStatus() === 'missing') {
        setBootstrapMessage('ออฟไลน์');
      } else if (result.source === 'online') {
        setBootstrapMessage('ออนไลน์');
      } else {
        setBootstrapMessage('ออฟไลน์');
      }
      setRefreshKey((value) => value + 1);
    }).catch(() => {
      setBootstrapMessage('ออฟไลน์');
      setRefreshKey((value) => value + 1);
    });
  }, []);

  const openBackoffice = () => {
    if (employeeMode) return;
    if (getCentralBackendStatus() === 'missing') {
      setAdminPinPanel('backend-missing');
      return;
    }
    if (getCentralBackendUrl()) {
      setAdminPinPanel('central-unlock');
      return;
    }
    setAdminPinPanel(hasAdminPin() ? 'unlock' : 'notice');
  };

  const hiddenAdminEntry = () => {
    if (getCentralBackendUrl()) {
      setAdminPinPanel('central-unlock');
      return;
    }
    if (hasAdminPin()) {
      setAdminPinPanel('unlock');
      return;
    }
    if (!employeeMode) setAdminPinPanel('setup-token');
  };

  const startHiddenAdminPress = () => {
    if (hiddenAdminTimerRef.current) window.clearTimeout(hiddenAdminTimerRef.current);
    hiddenAdminTimerRef.current = window.setTimeout(hiddenAdminEntry, 1800);
  };

  const cancelHiddenAdminPress = () => {
    if (!hiddenAdminTimerRef.current) return;
    window.clearTimeout(hiddenAdminTimerRef.current);
    hiddenAdminTimerRef.current = null;
  };

  const unlockBackoffice = () => {
    setAdminUnlocked(true);
    setMode('admin');
    setAdminStep('dashboard');
    setAdminPinPanel(null);
  };

  const lockBackoffice = () => {
    clearAdminSession();
    setAdminUnlocked(false);
    setMode('frontline');
    setAdminPinPanel(null);
    setEmployeeMode(isEmployeeDeviceMode());
  };

  const reload = () => setRefreshKey((value) => value + 1);
  const records = useMemo(() => listRecords(), [refreshKey]);
  const activeRecord = activeRecordId ? getRecordById(activeRecordId) : null;

  return (
    <div className="reset-app">
      <header className="reset-topbar">
        <div>
          <strong
            onDoubleClick={hiddenAdminEntry}
            onPointerCancel={cancelHiddenAdminPress}
            onPointerDown={startHiddenAdminPress}
            onPointerLeave={cancelHiddenAdminPress}
            onPointerUp={cancelHiddenAdminPress}
          >
            Hub Photo Proof
          </strong>
          <span>{mode === 'admin' && adminUnlocked ? 'หลังบ้าน' : 'หน้างาน'}</span>
        </div>
        <div className="header-actions">
          {mode === 'admin' && adminUnlocked ? (
            <button className="secondary-action compact-action" onClick={lockBackoffice} type="button"><Lock size={17} /> ล็อกหลังบ้าน</button>
          ) : employeeMode ? null : (
            <button className="icon-button neutral" aria-label="หลังบ้าน" onClick={openBackoffice} type="button"><Settings size={18} /></button>
          )}
        </div>
      </header>

      <main className="reset-main">
        {mode === 'frontline' || !adminUnlocked ? (
          <FrontlineApp
            activeRecord={activeRecord}
            bootstrapMessage={bootstrapMessage}
            onOpenRecord={(recordId) => {
              setActiveRecordId(recordId);
              setFrontlineStep('photos');
            }}
            onReload={reload}
            onStepChange={setFrontlineStep}
            records={records}
            step={frontlineStep}
          />
        ) : (
          <AdminApp
            activeRecord={activeRecord}
            onEmployeeModeChange={() => setEmployeeMode(isEmployeeDeviceMode())}
            onLock={lockBackoffice}
            onOpenRecord={(recordId) => setActiveRecordId(recordId)}
            onReload={reload}
            onStepChange={setAdminStep}
            records={records}
            step={adminStep}
          />
        )}
      </main>

      {adminPinPanel ? <AdminPinPanel mode={adminPinPanel} onCancel={() => setAdminPinPanel(null)} onSuccess={unlockBackoffice} /> : null}

      {(mode === 'frontline' || !adminUnlocked) && frontlineStep !== 'scan' ? (
        <nav className="reset-bottom-nav">
          <NavButton active={frontlineStep === 'home'} icon={<Home size={20} />} label="วันนี้" onClick={() => setFrontlineStep('home')} />
          <NavButton active={false} icon={<QrCode size={20} />} label="สแกน" onClick={() => setFrontlineStep('scan')} />
          <NavButton active={frontlineStep === 'photos'} icon={<Camera size={20} />} label="รูป" onClick={() => setFrontlineStep('photos')} />
          <NavButton active={frontlineStep === 'my-work'} icon={<ClipboardList size={20} />} label="งานของฉัน" onClick={() => setFrontlineStep('my-work')} />
        </nav>
      ) : null}
    </div>
  );
}

function AdminPinPanel({ mode, onCancel, onSuccess }: { mode: 'unlock' | 'central-unlock' | 'backend-missing' | 'notice' | 'setup-token'; onCancel: () => void; onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [message, setMessage] = useState('');
  const isSetup = mode === 'setup-token';
  const isNotice = mode === 'notice';
  const isCentral = mode === 'central-unlock';
  const isBackendMissing = mode === 'backend-missing';

  const submit = async () => {
    if (isBackendMissing) return;
    if (isCentral) {
      const result = await verifyCentralAdminAccess(pin);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setMessage(result.message);
      onSuccess();
      return;
    }
    if (isSetup) {
      if (!verifyAdminSetupToken(setupToken)) {
        setMessage('โทเคนตั้งค่าผู้ดูแลไม่ถูกต้อง');
        return;
      }
      if (pin.trim().length < 4) {
        setMessage('PIN ต้องมีอย่างน้อย 4 ตัว');
        return;
      }
      if (pin !== confirmPin) {
        setMessage('PIN ไม่ตรงกัน');
        return;
      }
      if (!setAdminPin(pin)) {
        setMessage('ตั้ง PIN ไม่สำเร็จ');
        return;
      }
      onSuccess();
      return;
    }
    if (!verifyAdminPin(pin)) {
      setMessage('PIN ไม่ถูกต้อง');
      return;
    }
    onSuccess();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <article className="pin-panel">
        <h2>{isSetup ? 'ตั้งค่า PIN หลังบ้านสำหรับผู้ดูแล' : isNotice || isBackendMissing ? 'หลังบ้านถูกล็อก' : isCentral ? 'เข้าสู่หลังบ้าน' : 'ใส่ PIN แอดมิน'}</h2>
        <p>
          {isBackendMissing
            ? 'ยังไม่ได้ตั้งค่าระบบกลาง กรุณาติดต่อผู้ดูแล'
            : isNotice
              ? 'ยังไม่ได้ตั้งค่า PIN หลังบ้าน กรุณาติดต่อผู้ดูแลระบบ'
              : isCentral
                ? 'สำหรับผู้ดูแลระบบเท่านั้น'
                : 'การป้องกันนี้เป็น PIN ภายในเครื่องเท่านั้น ไม่ใช่ระบบความปลอดภัยระดับองค์กร'}
        </p>
        {isNotice || isBackendMissing ? null : (
          <>
            {isSetup ? (
              <label>
                <span>Admin setup token</span>
                <input autoFocus type="password" value={setupToken} onChange={(event) => setSetupToken(event.target.value)} />
              </label>
            ) : null}
            <label>
              <span>Admin PIN</span>
              <input autoFocus={!isSetup} inputMode="numeric" type="password" value={pin} onChange={(event) => setPin(event.target.value)} />
            </label>
            {isSetup ? (
              <label>
                <span>ยืนยัน PIN</span>
                <input inputMode="numeric" type="password" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value)} />
              </label>
            ) : null}
            {isCentral ? <p className="backend-status">ลืม PIN กรุณาติดต่อเจ้าของระบบ</p> : null}
          </>
        )}
        {message ? <p className="simple-message">{message}</p> : null}
        <div className="admin-form">
          <button className="secondary-action" onClick={onCancel} type="button">ยกเลิก</button>
          {isNotice || isBackendMissing ? null : <button className="primary-action" onClick={() => { void submit(); }} type="button">{isSetup ? 'ตั้งค่าและเข้าหลังบ้าน' : 'เข้าหลังบ้าน'}</button>}
        </div>
      </article>
    </div>
  );
}

function verifyAdminSetupToken(token: string): boolean {
  const configured = import.meta.env.VITE_ADMIN_SETUP_TOKEN as string | undefined;
  return Boolean(configured && token && token === configured);
}

function FrontlineApp({ activeRecord, bootstrapMessage, onOpenRecord, onReload, onStepChange, records, step }: {
  activeRecord: ProofRecord | null;
  bootstrapMessage: string;
  onOpenRecord: (recordId: string) => void;
  onReload: () => void;
  onStepChange: (step: FrontlineStep) => void;
  records: ProofRecord[];
  step: FrontlineStep;
}) {
  const activeContext = getActiveContext();
  const activeHub = listHubs().find((hub) => hub.hubCode === activeContext?.hubCode && hub.active) ?? null;
  const activeStaff = listResponsibleStaff().find((staff) => staff.employeeCode === activeContext?.employeeCode && staff.active) ?? null;

  if (step === 'scan') {
    return <ScanScreen activeHub={activeHub} activeStaff={activeStaff} onClose={() => onStepChange('home')} onCreated={(record) => { onReload(); onOpenRecord(record.id); }} />;
  }
  if (step === 'photos') {
    return <PhotoCaptureScreen record={activeRecord} onDone={() => { onReload(); onStepChange('done'); }} onReload={onReload} />;
  }
  if (step === 'done') {
    return <DoneScreen onMyWork={() => onStepChange('my-work')} onScanNext={() => onStepChange('scan')} />;
  }
  if (step === 'my-work') {
    return <MyWorkScreen onOpenRecord={onOpenRecord} records={records} />;
  }
  return <FrontlineHome bootstrapMessage={bootstrapMessage} onOpenRecord={onOpenRecord} onReload={onReload} onScan={() => onStepChange('scan')} records={records} />;
}

function FrontlineHome({ bootstrapMessage, onOpenRecord, onReload, onScan, records }: {
  bootstrapMessage: string;
  onOpenRecord: (recordId: string) => void;
  onReload: () => void;
  onScan: () => void;
  records: ProofRecord[];
}) {
  const hubs = listHubs().filter((hub) => hub.active);
  const staff = listResponsibleStaff().filter((item) => item.active);
  const [hubCode, setHubCode] = useState(getActiveContext()?.hubCode || hubs[0]?.hubCode || '');
  const visibleStaff = staff.filter((item) => item.hubCode === hubCode);
  const [employeeCode, setEmployeeCode] = useState(getActiveContext()?.employeeCode || visibleStaff[0]?.employeeCode || '');
  const selectedHub = hubs.find((hub) => hub.hubCode === hubCode);
  const selectedStaff = visibleStaff.find((item) => item.employeeCode === employeeCode);
  const today = getLocalDateString();
  const todayRecords = records.filter((record) => record.date === today && record.responsibleEmployeeCode === employeeCode);
  const pending = todayRecords.filter((record) => record.status !== 'COMPLETE' && record.status !== 'VOIDED');

  useEffect(() => {
    if (visibleStaff.length === 1) setEmployeeCode(visibleStaff[0].employeeCode);
  }, [hubCode]);

  const saveContext = () => {
    if (!selectedHub || !selectedStaff) return;
    saveActiveContext({ hubCode: selectedHub.hubCode, employeeCode: selectedStaff.employeeCode });
    onReload();
  };

  return (
    <section className="frontline-stack">
      <article className="hero-card">
        <div className="hero-title-row">
          <div>
            <h1>Hub Photo Proof</h1>
            <p>หน้างาน</p>
          </div>
          <StatusPill tone={bootstrapMessage === 'ออนไลน์' ? 'success' : 'warning'} text={bootstrapMessage} />
        </div>
        <div className="context-card">
          <label>
            <span>ฮับ</span>
            <select value={hubCode} onChange={(event) => setHubCode(event.target.value)}>
              {hubs.map((hub) => <option key={hub.hubCode} value={hub.hubCode}>{hub.hubCode}-{hub.hubName}</option>)}
            </select>
          </label>
          <label>
            <span>ผู้รับผิดชอบ</span>
            <select value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)}>
              {visibleStaff.map((item) => <option key={item.employeeCode} value={item.employeeCode}>{item.employeeCode} {item.displayName}</option>)}
            </select>
          </label>
          <button className="primary-action" onClick={saveContext} type="button">บันทึกและเริ่มงาน</button>
        </div>
        {selectedHub && selectedStaff ? (
          <div className="active-context">
            <span>ฮับ: {selectedHub.hubCode}-{selectedHub.hubName}</span>
            <span>ผู้รับผิดชอบ: {selectedStaff.employeeCode} {selectedStaff.displayName}</span>
          </div>
        ) : null}
      </article>

      <div className="summary-grid">
        <StatCard label="งานวันนี้" value={todayRecords.length} />
        <StatCard label="รอถ่ายรูป" value={pending.length} />
        <StatCard label="เสร็จแล้ว" value={todayRecords.filter((record) => record.status === 'COMPLETE').length} />
        <StatCard label="รอซิงก์" value={todayRecords.filter((record) => record.syncStatus === 'PENDING_SYNC').length} />
      </div>

      <div className="frontline-actions">
        <button className="primary-action jumbo" onClick={onScan} type="button">สแกนบาร์รถ</button>
        <button className="secondary-action jumbo" disabled={pending.length === 0} onClick={() => pending[0] && onOpenRecord(pending[0].id)} type="button">งานที่ต้องถ่ายรูป</button>
      </div>
    </section>
  );
}

function ScanScreen({ activeHub, activeStaff, onClose, onCreated }: {
  activeHub: Hub | null;
  activeStaff: ResponsibleStaff | null;
  onClose: () => void;
  onCreated: (record: ProofRecord) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const detectorRef = useRef<{ detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } | null>(null);
  const [barcode, setBarcode] = useState('');
  const [message, setMessage] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [hasDropTransfer, setHasDropTransfer] = useState(false);

  const startCamera = async () => {
    if (!activeHub || !activeStaff) {
      setMessage('กรุณาเลือกฮับและผู้รับผิดชอบก่อนสแกน');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage('อุปกรณ์นี้เปิดกล้องไม่ได้ กรุณากรอกบาร์โค้ดรถเอง');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const BarcodeDetectorCtor = (window as typeof window & { BarcodeDetector?: BarcodeDetectorShape }).BarcodeDetector;
      if (BarcodeDetectorCtor) {
        try {
          detectorRef.current = new BarcodeDetectorCtor({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8'] });
        } catch {
          detectorRef.current = new BarcodeDetectorCtor({ formats: ['qr_code'] });
        }
        scanFrame();
      }
      setCameraOn(true);
      setMessage('เล็งบาร์โค้ดหรือ QR');
    } catch {
      setMessage('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตกล้อง หรือกรอกบาร์โค้ดรถเอง');
    }
  };

  const scanFrame = async () => {
    if (!videoRef.current || !detectorRef.current) {
      frameRef.current = window.requestAnimationFrame(scanFrame);
      return;
    }
    try {
      const results = await detectorRef.current.detect(videoRef.current);
      const raw = results.find((item) => item.rawValue)?.rawValue;
      const normalized = raw ? normalizeVehicleBarcode(raw) : '';
      if (normalized) {
        setBarcode(normalized);
        setMessage('อ่านบาร์โค้ดรถสำเร็จ');
        navigator.vibrate?.(80);
        stopCamera();
        return;
      }
    } catch {
      // Keep scanning; camera frames can fail transiently.
    }
    frameRef.current = window.requestAnimationFrame(scanFrame);
  };

  const stopCamera = () => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const createRecord = async () => {
    if (!activeHub || !activeStaff || !barcode.trim()) return;
    const normalizedBarcode = normalizeVehicleBarcode(barcode);
    const existing = listRecords().find((record) => (
      record.status !== 'VOIDED'
      && record.date === getLocalDateString()
      && record.hubCode === activeHub.hubCode
      && record.responsibleEmployeeCode === activeStaff.employeeCode
      && record.vehicleBarcode === normalizedBarcode
    ));
    if (existing) {
      const isSubmitted = existing.status === 'COMPLETE' || existing.status === 'NEED_REVIEW';
      const continueExisting = window.confirm(isSubmitted
        ? 'บาร์นี้ส่งข้อมูลแล้ว ต้องการเปิดงานเดิมหรือทำซ้ำ?\n\nกด OK เพื่อเปิดงานเดิม'
        : 'พบงานเดิม ต้องการถ่ายรูปต่อหรือเริ่มใหม่?\n\nกด OK เพื่อถ่ายรูปต่อ');
      if (continueExisting) {
        onCreated(existing);
        return;
      }
      const reason = window.prompt('กรุณาระบุเหตุผลที่ต้องทำซ้ำ');
      if (!reason?.trim()) return;
      const duplicate = createDraftRecord({ hub: activeHub, responsible: activeStaff, vehicleBarcode: normalizedBarcode, hasDropTransfer });
      const next = { ...duplicate, duplicateOfRecordId: existing.id, duplicateReason: reason.trim(), forceCreateNew: true, notes: `ทำซ้ำ: ${reason.trim()}` };
      upsertRecord(next);
      addAudit({ recordId: next.id, action: 'force_create_duplicate', detail: reason.trim(), actor: activeStaff.employeeCode });
      onCreated(next);
      return;
    }

    const central = await findCentralRecordByKey({
      date: getLocalDateString(),
      hubCode: activeHub.hubCode,
      responsibleEmployeeCode: activeStaff.employeeCode,
      vehicleBarcode: normalizedBarcode,
    });
    if (central.found) {
      const submitted = central.status === 'COMPLETE' || central.status === 'NEED_REVIEW';
      const continueExisting = window.confirm(submitted
        ? `บาร์นี้มีข้อมูลในระบบกลางแล้ว (${central.statusText || 'ส่งแล้ว'})\n\nกด OK เพื่อเปิดงานเดิม`
        : 'พบงานเดิมในระบบกลาง ต้องการถ่ายรูปต่อหรือไม่?');
      if (continueExisting) {
        const resumed = createDraftRecord({ hub: activeHub, responsible: activeStaff, vehicleBarcode: normalizedBarcode, hasDropTransfer });
        const record = {
          ...resumed,
          id: central.recordId || resumed.id,
          status: central.status || resumed.status,
          syncStatus: 'SYNCED' as const,
          notes: 'ดึงงานเดิมจากระบบกลาง',
        };
        upsertRecord(record);
        addAudit({ recordId: record.id, action: 'resume_existing_record', detail: 'central duplicate key', actor: activeStaff.employeeCode });
        onCreated(record);
        return;
      }
      const reason = window.prompt('กรุณาระบุเหตุผลที่ต้องทำซ้ำ');
      if (!reason?.trim()) return;
      const duplicate = createDraftRecord({ hub: activeHub, responsible: activeStaff, vehicleBarcode: normalizedBarcode, hasDropTransfer });
      const next = { ...duplicate, duplicateOfRecordId: central.recordId, duplicateReason: reason.trim(), forceCreateNew: true, notes: `ทำซ้ำ: ${reason.trim()}` };
      upsertRecord(next);
      addAudit({ recordId: next.id, action: 'force_create_duplicate', detail: reason.trim(), actor: activeStaff.employeeCode });
      onCreated(next);
      return;
    }
    if (!central.ok) {
      setMessage(central.message);
    }
    const record = createDraftRecord({ hub: activeHub, responsible: activeStaff, vehicleBarcode: normalizedBarcode, hasDropTransfer });
    upsertRecord(record);
    addAudit({ recordId: record.id, action: 'record_created', detail: `created from barcode ${record.vehicleBarcode}`, actor: activeStaff.employeeCode });
    onCreated(record);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void startCamera(); }, 120);
    return () => {
      window.clearTimeout(timer);
      stopCamera();
    };
  }, [activeHub?.hubCode, activeStaff?.employeeCode]);

  return (
    <section className="scan-screen fullscreen-scan">
      <article className="scan-camera">
        <div className="scan-topline">
          <button className="scan-close-button" onClick={() => { stopCamera(); onClose(); }} type="button" aria-label="ปิด">×</button>
          <strong>สแกนบาร์รถ</strong>
          <span>{activeHub ? `${activeHub.hubCode}` : 'เลือกฮับก่อน'}</span>
        </div>
        <video ref={videoRef} muted playsInline />
        {!cameraOn ? (
          <div className="scan-empty">
            <QrCode size={72} />
            <strong>สแกนบาร์รถ</strong>
            <span>เล็งบาร์โค้ดหรือ QR</span>
          </div>
        ) : null}
        <div className="scan-frame-box" />
      </article>
      <div className="scan-control-panel">
        <button className="primary-action" onClick={startCamera} type="button"><Camera size={20} /> สแกนใหม่</button>
        <label>
          <span>กรอกบาร์รถ</span>
          <input value={barcode} onChange={(event) => setBarcode(normalizeVehicleBarcode(event.target.value))} placeholder="NAK..." />
        </label>
        <p className="locked-date">วันที่: {getLocalDateString()}</p>
        <div className="drop-choice">
          <button className={!hasDropTransfer ? 'active' : ''} onClick={() => setHasDropTransfer(false)} type="button">ไม่พ่วงดรอป</button>
          <button className={hasDropTransfer ? 'active' : ''} onClick={() => setHasDropTransfer(true)} type="button">พ่วงดรอป</button>
        </div>
        {message ? <p className="simple-message">{message}</p> : null}
        <button className="primary-action jumbo" disabled={!activeHub || !activeStaff || !barcode} onClick={() => { void createRecord(); }} type="button">ใช้บาร์โค้ดนี้</button>
      </div>
    </section>
  );
}

function PhotoCaptureScreen({ record, onDone, onReload }: { record: ProofRecord | null; onDone: () => void; onReload: () => void }) {
  const [workingRecord, setWorkingRecord] = useState(record);
  const [message, setMessage] = useState('');

  useEffect(() => setWorkingRecord(record), [record?.id]);

  if (!workingRecord) {
    return (
      <article className="hero-card">
        <h1>ยังไม่มีงานที่เลือก</h1>
        <p>กรุณาสแกนรถก่อนเข้าหน้าถ่ายรูป</p>
      </article>
    );
  }

  const missing = getMissingPhotoSlots(workingRecord);
  const addDrop = () => {
    const updated = updatePhotoSlotsForDropCount(workingRecord, workingRecord.dropCount + 1);
    upsertRecord(updated);
    setWorkingRecord(updated);
    onReload();
  };

  const submit = async () => {
    if (missing.length > 0) {
      const text = `รูปยังไม่ครบ อาจมีผลต่อการตรวจสอบงาน ต้องการส่งข้อมูลต่อหรือไม่?\n\nรูปที่ขาด: ${missing.map((slot) => slot.labelThai).join(', ')}`;
      if (!window.confirm(text)) return;
    }
    setMessage('กำลังบันทึกข้อมูล');
    const result = await submitRecordWithGoogleSync(workingRecord, missing.length > 0);
    setWorkingRecord(result.record);
    setMessage(result.sync.message || 'บันทึกข้อมูลแล้ว');
    onReload();
    onDone();
  };

  const capture = async (slot: ProofPhotoSlot, file: File | undefined) => {
    if (!file) return;
    setMessage('กำลังบันทึกรูปและขอตำแหน่ง GPS');
    const updated = await capturePhotoForSlot(workingRecord, slot.slotId, file);
    setWorkingRecord(updated);
    onReload();
    setMessage('บันทึกรูปแล้ว');
  };

  return (
    <section className="frontline-stack">
      <article className="hero-card compact">
        <h1>{workingRecord.vehicleBarcode}</h1>
        <p>ฮับ: {workingRecord.hubCode}-{workingRecord.hubName}</p>
        <p>ผู้รับผิดชอบ: {workingRecord.responsibleEmployeeCode} {workingRecord.responsibleName}</p>
        <p>วันที่: {workingRecord.date}</p>
        <p>{workingRecord.hasDropTransfer ? `พ่วงดรอป ${workingRecord.dropCount} จุด` : 'ไม่พ่วงดรอป'} · รูปครบ {workingRecord.photoSlots.length - missing.length}/{workingRecord.photoSlots.length}</p>
      </article>
      {workingRecord.hasDropTransfer ? <button className="secondary-action" onClick={addDrop} type="button"><Plus size={18} /> เพิ่มดรอปอีก 1</button> : null}
      <div className="photo-grid">
        {workingRecord.photoSlots.map((slot) => (
          <article className="photo-proof-card" key={slot.slotId}>
            <div className="photo-card-head">
              <strong>{slot.labelThai}</strong>
              <StatusPill tone={slot.captured ? 'success' : 'warning'} text={slot.captured ? 'ถ่ายแล้ว' : 'ยังไม่ได้ถ่าย'} />
            </div>
            {slot.captured ? <StatusPill tone={slot.gpsStatus === 'granted' ? 'success' : 'warning'} text={slot.gpsStatus === 'granted' ? 'GPS พร้อม' : 'GPS ไม่พบ'} /> : null}
            {slot.imageLocalData ? <img src={slot.imageLocalData} alt={slot.labelThai} /> : <div className="photo-placeholder">ยังไม่ได้ถ่าย</div>}
            <div className="photo-meta">
              <span>เวลา: {slot.displayTimestamp ?? '-'}</span>
              <span>GPS: {slot.gpsLat && slot.gpsLng ? `${slot.gpsLat.toFixed(6)}, ${slot.gpsLng.toFixed(6)}` : 'ไม่พบ GPS / ไม่ได้รับอนุญาตตำแหน่ง'}</span>
              {slot.gpsStatus !== 'granted' && slot.captured ? <b>GPS ไม่พบ</b> : null}
            </div>
            <label className="capture-button">
              <Camera size={18} />
              <span>{slot.captured ? 'ถ่ายใหม่' : 'ถ่ายรูป'}</span>
              <input accept="image/*" capture="environment" type="file" onChange={(event) => { void capture(slot, event.target.files?.[0]); event.currentTarget.value = ''; }} />
            </label>
          </article>
        ))}
      </div>
      {message ? <p className="simple-message">{message}</p> : null}
      <div className="sticky-submit">
        <span>{missing.length ? `ต้องถ่ายเพิ่ม ${missing.length} รูป` : `รูปครบ ${workingRecord.photoSlots.length}/${workingRecord.photoSlots.length}`}</span>
        <button className="primary-action" onClick={submit} type="button">ส่งข้อมูล</button>
      </div>
    </section>
  );
}

function DoneScreen({ onMyWork, onScanNext }: { onMyWork: () => void; onScanNext: () => void }) {
  return (
    <article className="done-card">
      <CheckCircle2 size={70} />
      <h1>บันทึกข้อมูลแล้ว</h1>
      <button className="primary-action jumbo" onClick={onScanNext} type="button">สแกนคันถัดไป</button>
      <button className="secondary-action jumbo" onClick={onMyWork} type="button">ดูงานของฉัน</button>
    </article>
  );
}

function MyWorkScreen({ onOpenRecord, records }: { onOpenRecord: (recordId: string) => void; records: ProofRecord[] }) {
  const activeContext = getActiveContext();
  const today = getLocalDateString();
  const mine = records
    .filter((record) => (
      record.status !== 'VOIDED'
      && record.date === today
      && (!activeContext?.employeeCode || record.responsibleEmployeeCode === activeContext.employeeCode)
      && (!activeContext?.hubCode || record.hubCode === activeContext.hubCode)
    ))
    .sort((a, b) => a.vehicleBarcode.localeCompare(b.vehicleBarcode));
  const openItems = mine.filter((record) => record.status !== 'COMPLETE' || record.syncStatus === 'PENDING_SYNC' || getMissingPhotoSlots(record).length > 0);
  return (
    <section className="frontline-stack">
      <article className="hero-card compact">
        <h1>งานค้างถ่ายรูปของฉัน</h1>
        <p>{activeContext ? `${activeContext.hubCode} · ${activeContext.employeeCode}` : 'เลือกผู้รับผิดชอบก่อนเริ่มงาน'}</p>
      </article>
      <RecordList records={openItems} onOpenRecord={onOpenRecord} actionLabel="ถ่ายรูปต่อ" />
    </section>
  );
}

function AdminApp({ activeRecord, onEmployeeModeChange, onLock, onOpenRecord, onReload, onStepChange, records, step }: {
  activeRecord: ProofRecord | null;
  onEmployeeModeChange: () => void;
  onLock: () => void;
  onOpenRecord: (recordId: string) => void;
  onReload: () => void;
  onStepChange: (step: AdminStep) => void;
  records: ProofRecord[];
  step: AdminStep;
}) {
  return (
    <section className="admin-layout">
      <aside className="admin-sidebar">
        <NavButton active={step === 'dashboard'} icon={<Home size={18} />} label="ภาพรวม" onClick={() => onStepChange('dashboard')} />
        <NavButton active={step === 'hubs'} icon={<MapPin size={18} />} label="ฮับ" onClick={() => onStepChange('hubs')} />
        <NavButton active={step === 'staff'} icon={<UserRound size={18} />} label="ผู้รับผิดชอบ" onClick={() => onStepChange('staff')} />
        <NavButton active={step === 'records'} icon={<ClipboardList size={18} />} label="รายการ" onClick={() => onStepChange('records')} />
        <NavButton active={step === 'photos'} icon={<Camera size={18} />} label="รูปภาพ" onClick={() => onStepChange('photos')} />
        <NavButton active={step === 'export'} icon={<Download size={18} />} label="ส่งออก" onClick={() => onStepChange('export')} />
        <NavButton active={step === 'backup'} icon={<Shield size={18} />} label="สำรองข้อมูล" onClick={() => onStepChange('backup')} />
        <NavButton active={step === 'settings'} icon={<Settings size={18} />} label="ตั้งค่า" onClick={() => onStepChange('settings')} />
        <NavButton active={step === 'audit'} icon={<FileText size={18} />} label="ประวัติ" onClick={() => onStepChange('audit')} />
        <NavButton active={step === 'admin-devices'} icon={<Shield size={18} />} label="อุปกรณ์แอดมิน" onClick={() => onStepChange('admin-devices')} />
      </aside>
      <div className="admin-content">
        {step === 'dashboard' ? <AdminDashboard records={records} /> : null}
        {step === 'hubs' ? <HubManager onReload={onReload} /> : null}
        {step === 'staff' ? <StaffManager onReload={onReload} /> : null}
        {step === 'records' ? <AdminRecords activeRecord={activeRecord} onOpenRecord={onOpenRecord} onReload={onReload} records={records} /> : null}
        {step === 'photos' ? <AdminPhotos records={records} /> : null}
        {step === 'export' ? <ExportPanel records={records} /> : null}
        {step === 'backup' ? <BackupPanel /> : null}
        {step === 'settings' ? <SettingsPanel onEmployeeModeChange={onEmployeeModeChange} onLock={onLock} onReload={onReload} /> : null}
        {step === 'audit' ? <AuditPanel /> : null}
        {step === 'admin-devices' ? <AdminDevicesPanel /> : null}
      </div>
    </section>
  );
}

function AdminDashboard({ records }: { records: ProofRecord[] }) {
  const today = getLocalDateString();
  const todayRecords = records.filter((record) => record.date === today);
  return (
    <section className="admin-stack">
      <h1>ภาพรวม</h1>
      <div className="summary-grid">
        <StatCard label="วันนี้" value={todayRecords.length} />
        <StatCard label="เสร็จแล้ว" value={records.filter((record) => record.status === 'COMPLETE').length} />
        <StatCard label="รอตรวจสอบ" value={records.filter((record) => record.status === 'NEED_REVIEW').length} />
        <StatCard label="รูปไม่ครบ" value={records.filter((record) => record.missingPhotoWarnings.length > 0).length} />
      </div>
      <RecordList records={records.slice(0, 8)} />
    </section>
  );
}

function HubManager({ onReload }: { onReload: () => void }) {
  const [hubs, setHubs] = useState(listHubs());
  const [hubCode, setHubCode] = useState(DEFAULT_HUB.hubCode);
  const [hubName, setHubName] = useState(DEFAULT_HUB.hubName);
  const save = () => {
    const next = [...hubs.filter((hub) => hub.hubCode !== hubCode), { hubCode, hubName, active: true }];
    saveHubs(next);
    setHubs(next);
    onReload();
  };
  const remove = (code: string) => {
    const next = hubs.filter((hub) => hub.hubCode !== code);
    saveHubs(next);
    setHubs(next);
    onReload();
  };
  return (
    <section className="admin-stack">
      <h1>ฮับ</h1>
      <div className="admin-form">
        <input value={hubCode} onChange={(event) => setHubCode(event.target.value)} placeholder="26NAK_BHUB" />
        <input value={hubName} onChange={(event) => setHubName(event.target.value)} placeholder="นครราชสีมา" />
        <button className="primary-action" onClick={save} type="button"><Save size={18} /> บันทึกฮับ</button>
      </div>
      {hubs.map((hub) => <AdminRow key={hub.hubCode} title={`${hub.hubCode}-${hub.hubName}`} onDelete={() => remove(hub.hubCode)} />)}
    </section>
  );
}

function StaffManager({ onReload }: { onReload: () => void }) {
  const [staff, setStaff] = useState(listResponsibleStaff());
  const hubs = listHubs();
  const [employeeCode, setEmployeeCode] = useState(DEFAULT_STAFF.employeeCode);
  const [displayName, setDisplayName] = useState(DEFAULT_STAFF.displayName);
  const [hubCode, setHubCode] = useState(hubs[0]?.hubCode ?? DEFAULT_HUB.hubCode);
  const save = () => {
    const next = [...staff.filter((item) => item.employeeCode !== employeeCode), { employeeCode, displayName, hubCode, active: true }];
    saveResponsibleStaff(next);
    setStaff(next);
    onReload();
  };
  const remove = (code: string) => {
    const next = staff.filter((item) => item.employeeCode !== code);
    saveResponsibleStaff(next);
    setStaff(next);
    onReload();
  };
  return (
    <section className="admin-stack">
      <h1>ผู้รับผิดชอบ</h1>
      <div className="admin-form">
        <input value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)} placeholder="25845" />
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value.toUpperCase())} placeholder="TUI" />
        <select value={hubCode} onChange={(event) => setHubCode(event.target.value)}>
          {hubs.map((hub) => <option key={hub.hubCode} value={hub.hubCode}>{hub.hubCode}-{hub.hubName}</option>)}
        </select>
        <button className="primary-action" onClick={save} type="button"><Save size={18} /> บันทึกผู้รับผิดชอบ</button>
      </div>
      {staff.map((item) => <AdminRow key={item.employeeCode} title={`${item.employeeCode} ${item.displayName} / ${item.hubCode}`} onDelete={() => remove(item.employeeCode)} />)}
    </section>
  );
}

function AdminRecords({ activeRecord, onOpenRecord, onReload, records }: { activeRecord: ProofRecord | null; onOpenRecord: (recordId: string) => void; onReload: () => void; records: ProofRecord[] }) {
  const [editDate, setEditDate] = useState(activeRecord?.date ?? '');
  const [voidReason, setVoidReason] = useState('');
  useEffect(() => setEditDate(activeRecord?.date ?? ''), [activeRecord?.id]);
  const saveDate = () => {
    if (!activeRecord || !editDate) return;
    const updated = { ...activeRecord, date: editDate, updatedAt: new Date().toISOString() };
    upsertRecord(updated);
    addAudit({ recordId: updated.id, action: 'admin_date_edit', detail: `date changed to ${editDate}`, actor: 'admin' });
    onReload();
  };
  const voidRecord = () => {
    if (!activeRecord || !voidReason.trim()) return;
    const updated = { ...activeRecord, status: 'VOIDED' as const, voidReason, updatedAt: new Date().toISOString() };
    upsertRecord(updated);
    addAudit({ recordId: updated.id, action: 'record_voided', detail: voidReason, actor: 'admin' });
    onReload();
  };
  return (
    <section className="admin-stack">
      <h1>รายการ</h1>
      <RecordList records={records} onOpenRecord={onOpenRecord} />
      {activeRecord ? (
        <article className="admin-detail-card">
          <h2>{activeRecord.vehicleBarcode}</h2>
          <div className="admin-form">
            <input type="date" value={editDate} onChange={(event) => setEditDate(event.target.value)} />
            <button className="secondary-action" onClick={saveDate} type="button">แก้วันที่</button>
            <input value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="เหตุผล void/restore/admin edit" />
            <button className="danger-action" onClick={voidRecord} type="button">Void</button>
          </div>
        </article>
      ) : null}
    </section>
  );
}

function AdminPhotos({ records }: { records: ProofRecord[] }) {
  return (
    <section className="admin-stack">
      <h1>รูปภาพ</h1>
      {records.map((record) => (
        <article className="admin-detail-card" key={record.id}>
          <h2>{record.vehicleBarcode}</h2>
          <div className="mini-photo-row">
            {record.photoSlots.map((slot) => (
              <div key={slot.slotId}>
                {slot.imageLocalData ? <img src={slot.imageLocalData} alt={slot.labelThai} /> : <div className="photo-placeholder small">ยังไม่ได้ถ่าย</div>}
                <span>{slot.labelThai}</span>
                <small>{slot.displayTimestamp ?? '-'} / {slot.gpsStatus === 'granted' ? 'GPS พร้อม' : 'GPS ไม่พบ'}</small>
                <small>{slot.watermarkText ?? 'ยังไม่มีข้อมูลรูป'}</small>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function ExportPanel({ records }: { records: ProofRecord[] }) {
  const [message, setMessage] = useState('');
  const exportZip = async () => {
    setMessage('กำลังสร้าง ZIP');
    const blob = await generateExportZip(records.filter((record) => record.status !== 'DRAFT'));
    downloadBlob(blob, `hub-photo-proof-${getLocalDateString()}.zip`);
    addAudit({ action: 'export_generated', detail: `${records.length} records`, actor: 'admin' });
    setMessage('สร้าง export แล้ว');
  };
  return (
    <section className="admin-stack">
      <h1>ส่งออก</h1>
      <p>ไฟล์หลังบ้าน: workbook.xlsx, photos/, manifest.json</p>
      <p>วันที่ เวลา และ GPS อยู่บนลายน้ำในรูปภาพแล้ว Excel จึงใช้คอลัมน์แบบสั้น</p>
      <button className="primary-action" onClick={exportZip} type="button"><Download size={18} /> ส่งออก ZIP</button>
      {message ? <p className="simple-message">{message}</p> : null}
    </section>
  );
}

function BackupPanel() {
  return (
    <section className="admin-stack">
      <h1>สำรองข้อมูล</h1>
      <p className="simple-message">ยังเป็น local-first guard: ต้อง export/backup ก่อน cleanup และไม่ลบ records โดยไม่มีการยืนยัน</p>
    </section>
  );
}

function SettingsPanel({ onEmployeeModeChange, onLock, onReload }: { onEmployeeModeChange: () => void; onLock: () => void; onReload: () => void }) {
  const [settings, setSettings] = useState(getSettings());
  const [pendingSyncCount, setPendingSyncCount] = useState(getPendingSyncCount());
  const [syncMessage, setSyncMessage] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [nextPin, setNextPin] = useState('');
  const [confirmNextPin, setConfirmNextPin] = useState('');
  const [pinSetupToken, setPinSetupToken] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [deviceApprovalRequired, setDeviceApprovalRequiredState] = useState(false);
  const [deviceApprovalPin, setDeviceApprovalPin] = useState('');
  const [deviceApprovalMessage, setDeviceApprovalMessage] = useState('');
  const [repairMessage, setRepairMessage] = useState('');
  const [employeeDeviceMode, setEmployeeDeviceModeState] = useState(isEmployeeDeviceMode());
  const save = () => {
    saveSettings(settings);
    setPendingSyncCount(getPendingSyncCount());
    onReload();
  };
  const testConnection = async () => {
    saveSettings(settings);
    setSyncMessage('กำลังทดสอบการเชื่อมต่อ');
    const result = await testGoogleConnection();
    setSyncMessage(result.message);
    setPendingSyncCount(getPendingSyncCount());
    onReload();
  };
  const retrySync = async () => {
    saveSettings(settings);
    setSyncMessage('กำลังซิงก์รายการที่ค้าง');
    const result = await retryPendingSync();
    setSyncMessage(result.message);
    setPendingSyncCount(getPendingSyncCount());
    onReload();
  };
  const saveNewPin = async () => {
    if (nextPin.trim().length < 4) {
      setPinMessage('PIN ใหม่ต้องมีอย่างน้อย 4 ตัว');
      return;
    }
    if (nextPin !== confirmNextPin) {
      setPinMessage('PIN ใหม่ไม่ตรงกัน');
      return;
    }
    if (getCentralBackendUrl()) {
      setPinMessage('กำลังบันทึก PIN หลังบ้าน');
      const result = await setCentralAdminPin({
        currentPin,
        setupToken: pinSetupToken,
        newPin: nextPin,
      });
      setPinMessage(result.message);
      if (result.ok) {
        setCurrentPin('');
        setNextPin('');
        setConfirmNextPin('');
        setPinSetupToken('');
      }
      return;
    }
    if (!changeAdminPin(currentPin, nextPin)) {
      setPinMessage('PIN ปัจจุบันไม่ถูกต้อง');
      return;
    }
    setCurrentPin('');
    setNextPin('');
    setConfirmNextPin('');
    setPinMessage('เปลี่ยน PIN แอดมินแล้ว');
  };
  const resetData = () => {
    if (!window.confirm('ยืนยันล้างข้อมูลทดสอบในเครื่อง? Records, audit และคิวซิงก์จะถูกลบจากเครื่องนี้')) return;
    resetLocalTestData();
    setPendingSyncCount(0);
    onReload();
  };
  const toggleEmployeeDeviceMode = (enabled: boolean) => {
    if (enabled && !window.confirm('ล็อกเครื่องนี้เป็นเครื่องพนักงาน? หลังบ้านจะถูกซ่อนและต้องให้ผู้ดูแลปลดล็อกจากเครื่องแอดมินหรือรีเซ็ตข้อมูลเครื่องนี้')) return;
    setEmployeeDeviceMode(enabled);
    setEmployeeDeviceModeState(enabled);
    onEmployeeModeChange();
    onReload();
    if (enabled) onLock();
  };
  const toggleDeviceApproval = async (enabled: boolean) => {
    if (!getCentralBackendUrl()) return;
    if (!deviceApprovalPin.trim()) {
      setDeviceApprovalMessage('กรุณาใส่ Admin PIN ก่อนเปลี่ยนโหมดนี้');
      return;
    }
    const result = await setCentralAdminDeviceApprovalRequired({ adminPin: deviceApprovalPin, enabled });
    setDeviceApprovalMessage(result.message);
    if (result.ok) setDeviceApprovalRequiredState(enabled);
  };
  const repairStorage = async () => {
    setRepairMessage('กำลังตรวจสอบชีท');
    const result = await initOrRepairCentralStorage();
    setRepairMessage(result.message);
  };
  return (
    <section className="admin-stack">
      <h1>ตั้งค่า</h1>
      <label className="checkbox-row">
        <input checked={settings.gpsMandatory} onChange={(event) => setSettings({ ...settings, gpsMandatory: event.target.checked })} type="checkbox" />
        GPS บังคับ (ตอนนี้ยังเป็นโหมดเตือน ไม่ปลอม GPS)
      </label>
      <label className="checkbox-row">
        <input checked={settings.watermarkEnabled} onChange={(event) => setSettings({ ...settings, watermarkEnabled: event.target.checked })} type="checkbox" />
        เปิดลายน้ำบนรูป
      </label>
      <article className="admin-detail-card">
        <h2>โหมดเครื่องพนักงาน</h2>
        <p>เปิดก่อนส่งเครื่องให้พนักงาน เพื่อซ่อนปุ่มหลังบ้านและปิดการตั้งค่า PIN ครั้งแรกบนเครื่องพนักงาน</p>
        <label className="checkbox-row">
          <input checked={employeeDeviceMode} onChange={(event) => toggleEmployeeDeviceMode(event.target.checked)} type="checkbox" />
          ล็อกเครื่องนี้เป็นเครื่องพนักงาน
        </label>
      </article>
      <article className="admin-detail-card">
        <h2>ซิงก์ Google Sheets</h2>
        {getCentralBackendUrl() ? (
          <p>ระบบกลางถูกตั้งค่าจาก environment แล้ว พนักงานและเครื่องทั่วไปไม่ต้องกรอก URL/token</p>
        ) : (
          <div className="admin-form">
            <label>
              <span>โหมดซิงก์</span>
              <select value={settings.googleSyncMode} onChange={(event) => setSettings({ ...settings, googleSyncMode: event.target.value === 'google_sheets' ? 'google_sheets' : 'local_only' })}>
                <option value="local_only">บันทึกในเครื่อง</option>
                <option value="google_sheets">ซิงก์ Google Sheets</option>
              </select>
            </label>
            <label>
              <span>Google Apps Script Web App URL</span>
              <input value={settings.googleAppsScriptUrl} onChange={(event) => setSettings({ ...settings, googleAppsScriptUrl: event.target.value })} placeholder="https://script.google.com/macros/s/..." />
            </label>
            <label>
              <span>APP_SHARED_SECRET</span>
              <input type="password" value={settings.googleSharedSecret} onChange={(event) => setSettings({ ...settings, googleSharedSecret: event.target.value })} placeholder="stored locally only" />
            </label>
          </div>
        )}
        <div className="sync-status-row">
          <StatusPill tone={settings.googleSyncMode === 'google_sheets' ? 'success' : 'warning'} text={getCentralBackendUrl() ? 'ระบบกลาง' : settings.googleSyncMode === 'google_sheets' ? 'ซิงก์ Google Sheets' : 'บันทึกในเครื่อง'} />
          <span>รอซิงก์: {pendingSyncCount}</span>
        </div>
        <p>ระบบจะบันทึกลง Records_All และแยกชีทตามฮับให้อัตโนมัติ</p>
        <div className="admin-form">
          <button className="secondary-action" onClick={testConnection} type="button"><RefreshCcw size={18} /> ทดสอบการเชื่อมต่อ</button>
          <button className="secondary-action" disabled={pendingSyncCount === 0} onClick={retrySync} type="button"><RefreshCcw size={18} /> ซิงก์อีกครั้ง</button>
        </div>
        {syncMessage ? <p className="simple-message">{syncMessage}</p> : null}
      </article>
      <article className="admin-detail-card">
        <h2>ตั้งค่า PIN หลังบ้าน</h2>
        <p>{getCentralBackendUrl() ? 'PIN นี้บันทึกที่ Apps Script ส่วนกลาง ผู้ดูแลไม่ต้องแก้ Google Sheet เอง' : 'PIN นี้ป้องกันหลังบ้านเฉพาะในเครื่องนี้เท่านั้น'}</p>
        <div className="admin-form">
          <input type="password" inputMode="numeric" value={currentPin} onChange={(event) => setCurrentPin(event.target.value)} placeholder="PIN ปัจจุบัน" />
          {getCentralBackendUrl() ? <input type="password" value={pinSetupToken} onChange={(event) => setPinSetupToken(event.target.value)} placeholder="Setup token เฉพาะครั้งแรก" /> : null}
          <input type="password" inputMode="numeric" value={nextPin} onChange={(event) => setNextPin(event.target.value)} placeholder="PIN ใหม่" />
          <input type="password" inputMode="numeric" value={confirmNextPin} onChange={(event) => setConfirmNextPin(event.target.value)} placeholder="ยืนยัน PIN ใหม่" />
          <button className="secondary-action" onClick={() => { void saveNewPin(); }} type="button">บันทึก PIN</button>
          <button className="secondary-action" onClick={onLock} type="button"><Lock size={18} /> ล็อกหลังบ้าน</button>
        </div>
        {pinMessage ? <p className="simple-message">{pinMessage}</p> : null}
      </article>
      {getCentralBackendUrl() ? (
        <article className="admin-detail-card">
          <h2>ตรวจสอบชีท</h2>
          <p>สร้างชีทที่ขาดและเติมหัวตารางที่หายไป โดยไม่ลบข้อมูลเดิม</p>
          <button className="secondary-action" onClick={() => { void repairStorage(); }} type="button"><RefreshCcw size={18} /> ตรวจสอบและซ่อมชีท</button>
          {repairMessage ? <p className="simple-message">{repairMessage}</p> : null}
        </article>
      ) : null}
      {getCentralBackendUrl() ? (
        <article className="admin-detail-card">
          <h2>โหมดจำกัดเครื่องแอดมิน</h2>
          <p>ค่าเริ่มต้นปิดอยู่: ผู้ดูแลเข้า Backoffice ด้วย Admin PIN อย่างเดียว เปิดเฉพาะเมื่อต้องการให้เครื่องแอดมินต้องอยู่ใน AdminDevices ด้วย</p>
          <div className="admin-form">
            <input type="password" inputMode="numeric" value={deviceApprovalPin} onChange={(event) => setDeviceApprovalPin(event.target.value)} placeholder="Admin PIN" />
            <label className="checkbox-row">
              <input checked={deviceApprovalRequired} onChange={(event) => { void toggleDeviceApproval(event.target.checked); }} type="checkbox" />
              เปิดจำกัดเครื่องแอดมิน
            </label>
          </div>
          {deviceApprovalMessage ? <p className="simple-message">{deviceApprovalMessage}</p> : null}
        </article>
      ) : null}
      <article className="admin-detail-card">
        <h2>ข้อมูลทดสอบในเครื่อง</h2>
        <p>ใช้สำหรับล้างข้อมูลทดสอบในเครื่องนี้เท่านั้น ไม่ลบข้อมูลใน Google Sheets หรือ Google Drive</p>
        <button className="danger-action" onClick={resetData} type="button">ล้างข้อมูลทดสอบในเครื่อง</button>
      </article>
      <button className="primary-action" onClick={save} type="button">บันทึกตั้งค่า</button>
    </section>
  );
}

function AuditPanel() {
  return (
    <section className="admin-stack">
      <h1>Audit</h1>
      {listAudit().map((entry) => (
        <article className="admin-row" key={entry.id}>
          <strong>{entry.action}</strong>
          <span>{entry.detail}</span>
          <small>{new Date(entry.createdAt).toLocaleString('th-TH')} / {entry.actor}</small>
        </article>
      ))}
    </section>
  );
}

function AdminDevicesPanel() {
  const [pin, setPin] = useState('');
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const next = await listAdminDevices(pin);
      setDevices(next);
      setMessage(`โหลดอุปกรณ์แอดมิน ${next.length} รายการ`);
    } catch {
      setMessage('โหลดรายการอุปกรณ์ไม่สำเร็จ กรุณาตรวจสอบ PIN และสิทธิ์ส่วนกลาง');
    }
  };

  const approve = async (device: AdminDevice) => {
    try {
      await approveAdminDevice(device.deviceId, 'ADMIN', pin);
      setMessage(`อนุมัติ ${device.deviceName || device.deviceId} แล้ว`);
      await load();
    } catch {
      setMessage('อนุมัติอุปกรณ์ไม่สำเร็จ');
    }
  };

  const revoke = async (device: AdminDevice) => {
    try {
      await revokeAdminDevice(device.deviceId, pin);
      setMessage(`ยกเลิกสิทธิ์ ${device.deviceName || device.deviceId} แล้ว`);
      await load();
    } catch {
      setMessage('ยกเลิกสิทธิ์อุปกรณ์ไม่สำเร็จ');
    }
  };

  return (
    <section className="admin-stack">
      <h1>AdminDevices</h1>
      <article className="admin-detail-card">
        <p>อุปกรณ์ต้องอยู่สถานะ APPROVED และ role OWNER/ADMIN จึงเข้า Backoffice ได้ พนักงานไม่สามารถอนุมัติตัวเองได้</p>
        <div className="admin-form">
          <label>
            <span>Central Admin PIN</span>
            <input type="password" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} />
          </label>
          <button className="secondary-action" onClick={() => { void load(); }} type="button">โหลดอุปกรณ์</button>
        </div>
      </article>
      {devices.map((device) => (
        <article className="admin-row device-row" key={device.deviceId}>
          <div>
            <strong>{device.deviceName || 'Unknown device'}</strong>
            <span>{device.ownerName || '-'} / {device.role} / {device.status}</span>
            <small>{device.deviceId}</small>
          </div>
          <div className="row-actions">
            <button className="secondary-action compact-action" disabled={device.status === 'APPROVED'} onClick={() => { void approve(device); }} type="button">Approve</button>
            <button className="danger-action compact-action" disabled={device.status === 'REVOKED'} onClick={() => { void revoke(device); }} type="button">Revoke</button>
          </div>
        </article>
      ))}
      {message ? <p className="simple-message">{message}</p> : null}
    </section>
  );
}

function RecordList({ actionLabel, onOpenRecord, records }: { actionLabel?: string; onOpenRecord?: (recordId: string) => void; records: ProofRecord[] }) {
  return (
    <div className="record-list">
      {records.map((record) => (
        <button className="record-row" key={record.id} onClick={() => onOpenRecord?.(record.id)} type="button">
          <strong>{record.vehicleBarcode}</strong>
          <span>{record.date} / {record.hubCode} / {record.responsibleEmployeeCode} {record.responsibleName}</span>
          <span>{getMissingPhotoSlots(record).length ? `รูปไม่ครบ ${getMissingPhotoSlots(record).length} รูป` : actionLabel ?? ''}</span>
          <StatusPill tone={record.status === 'COMPLETE' ? 'success' : record.status === 'NEED_REVIEW' ? 'danger' : 'warning'} text={statusText(record.status)} />
        </button>
      ))}
      {records.length === 0 ? <p className="simple-message">ยังไม่มีข้อมูล</p> : null}
    </div>
  );
}

function AdminRow({ onDelete, title }: { onDelete: () => void; title: string }) {
  return (
    <article className="admin-row">
      <strong>{title}</strong>
      <button className="icon-button" onClick={onDelete} type="button"><Trash2 size={18} /></button>
    </article>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function StatusPill({ text, tone }: { text: string; tone: 'success' | 'warning' | 'danger' }) {
  return <span className={`status-pill ${tone}`}>{text}</span>;
}

function statusText(status: ProofRecord['status']): string {
  if (status === 'COMPLETE') return 'ส่งครบแล้ว';
  if (status === 'NEED_REVIEW') return 'ส่งแล้วแต่รูปไม่ครบ';
  if (status === 'VOIDED') return 'ยกเลิก';
  return 'เริ่มทำแต่ยังไม่ส่ง';
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={active ? 'nav-button active' : 'nav-button'} onClick={onClick} type="button">
      {icon}
      <span>{label}</span>
    </button>
  );
}
