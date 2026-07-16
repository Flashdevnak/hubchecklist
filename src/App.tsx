import { Camera, CheckCircle2, ClipboardList, Download, FileText, Home, Lock, MapPin, Plus, QrCode, RefreshCcw, Save, Settings, Shield, Trash2, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type ActiveWorkContext,
  type AppMode,
  type Hub,
  type ProofPhotoSlot,
  type ProofRecord,
  type ResponsibleStaff,
  addAudit,
  capturePhotoForSlot,
  createDraftRecord,
  DEFAULT_HUB,
  DEFAULT_STAFF,
  downloadBlob,
  ensureSeedData,
  generateExportZip,
  getActiveContext,
  getLocalDateString,
  getMissingPhotoSlots,
  getRecordById,
  getSettings,
  getPendingSyncCount,
  changeAdminPin,
  hasAdminPin,
  listAudit,
  listHubs,
  listRecords,
  listResponsibleStaff,
  normalizeVehicleBarcode,
  retryPendingSync,
  saveActiveContext,
  saveHubs,
  saveRecords,
  saveResponsibleStaff,
  saveSettings,
  setAdminPin,
  submitRecordWithGoogleSync,
  testGoogleConnection,
  verifyAdminPin,
  resetLocalTestData,
  updatePhotoSlotsForDropCount,
  upsertRecord,
} from './services/reset003';

type FrontlineStep = 'home' | 'scan' | 'photos' | 'done' | 'my-work';
type AdminStep = 'dashboard' | 'hubs' | 'staff' | 'records' | 'photos' | 'export' | 'backup' | 'settings' | 'audit';

type BarcodeDetectorShape = new (options?: { formats?: string[] }) => {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

export default function App() {
  const [mode, setMode] = useState<AppMode>('frontline');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPinPanel, setAdminPinPanel] = useState<'unlock' | 'setup' | null>(null);
  const [frontlineStep, setFrontlineStep] = useState<FrontlineStep>('home');
  const [adminStep, setAdminStep] = useState<AdminStep>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeRecordId, setActiveRecordId] = useState('');

  useEffect(() => {
    ensureSeedData();
    setRefreshKey((value) => value + 1);
  }, []);

  const openBackoffice = () => {
    setAdminPinPanel(hasAdminPin() ? 'unlock' : 'setup');
  };

  const unlockBackoffice = () => {
    setAdminUnlocked(true);
    setMode('admin');
    setAdminStep('dashboard');
    setAdminPinPanel(null);
  };

  const lockBackoffice = () => {
    setAdminUnlocked(false);
    setMode('frontline');
    setAdminPinPanel(null);
  };

  const reload = () => setRefreshKey((value) => value + 1);
  const records = useMemo(() => listRecords(), [refreshKey]);
  const activeRecord = activeRecordId ? getRecordById(activeRecordId) : null;

  return (
    <div className="reset-app">
      <header className="reset-topbar">
        <div>
          <strong>Hub Photo Proof</strong>
          <span>{mode === 'admin' && adminUnlocked ? 'Admin Backoffice' : 'Employee Frontline'}</span>
        </div>
        <div className="header-actions">
          {mode === 'admin' && adminUnlocked ? (
            <button className="secondary-action compact-action" onClick={lockBackoffice} type="button"><Lock size={17} /> ล็อกหลังบ้าน</button>
          ) : (
            <button className="icon-button neutral" aria-label="หลังบ้าน" onClick={openBackoffice} type="button"><Settings size={18} /></button>
          )}
        </div>
      </header>

      <main className="reset-main">
        {mode === 'frontline' || !adminUnlocked ? (
          <FrontlineApp
            activeRecord={activeRecord}
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

      {mode === 'frontline' || !adminUnlocked ? (
        <nav className="reset-bottom-nav">
          <NavButton active={frontlineStep === 'home'} icon={<Home size={20} />} label="วันนี้" onClick={() => setFrontlineStep('home')} />
          <NavButton active={frontlineStep === 'scan'} icon={<QrCode size={20} />} label="สแกน" onClick={() => setFrontlineStep('scan')} />
          <NavButton active={frontlineStep === 'photos'} icon={<Camera size={20} />} label="รูป/งานค้าง" onClick={() => setFrontlineStep('photos')} />
          <NavButton active={frontlineStep === 'my-work'} icon={<ClipboardList size={20} />} label="งานของฉัน" onClick={() => setFrontlineStep('my-work')} />
        </nav>
      ) : null}
    </div>
  );
}

function AdminPinPanel({ mode, onCancel, onSuccess }: { mode: 'unlock' | 'setup'; onCancel: () => void; onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');
  const isSetup = mode === 'setup';

  const submit = () => {
    if (isSetup) {
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
        <h2>{isSetup ? 'ตั้งค่า PIN แอดมินครั้งแรก' : 'ใส่ PIN แอดมิน'}</h2>
        <p>การป้องกันนี้เป็น PIN ภายในเครื่องเท่านั้น ไม่ใช่ระบบความปลอดภัยระดับองค์กร</p>
        <label>
          <span>Admin PIN</span>
          <input autoFocus inputMode="numeric" type="password" value={pin} onChange={(event) => setPin(event.target.value)} />
        </label>
        {isSetup ? (
          <label>
            <span>ยืนยัน PIN</span>
            <input inputMode="numeric" type="password" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value)} />
          </label>
        ) : null}
        {message ? <p className="simple-message">{message}</p> : null}
        <div className="admin-form">
          <button className="secondary-action" onClick={onCancel} type="button">ยกเลิก</button>
          <button className="primary-action" onClick={submit} type="button">{isSetup ? 'ตั้งค่าและเข้าหลังบ้าน' : 'เข้าหลังบ้าน'}</button>
        </div>
      </article>
    </div>
  );
}

function FrontlineApp({ activeRecord, onOpenRecord, onReload, onStepChange, records, step }: {
  activeRecord: ProofRecord | null;
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
    return <ScanScreen activeHub={activeHub} activeStaff={activeStaff} onCreated={(record) => { onReload(); onOpenRecord(record.id); }} />;
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
  return <FrontlineHome onOpenRecord={onOpenRecord} onReload={onReload} onScan={() => onStepChange('scan')} records={records} />;
}

function FrontlineHome({ onOpenRecord, onReload, onScan, records }: {
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
        <h1>งานวันนี้</h1>
        <p>เลือกฮับและผู้รับผิดชอบครั้งเดียว จากนั้นสแกนรถและถ่ายรูปหลักฐาน</p>
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
      </div>

      <div className="frontline-actions">
        <button className="primary-action jumbo" onClick={onScan} type="button">สแกนใบรถ</button>
        <button className="secondary-action jumbo" disabled={pending.length === 0} onClick={() => pending[0] && onOpenRecord(pending[0].id)} type="button">งานที่ต้องถ่ายรูป</button>
      </div>
    </section>
  );
}

function ScanScreen({ activeHub, activeStaff, onCreated }: {
  activeHub: Hub | null;
  activeStaff: ResponsibleStaff | null;
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

  useEffect(() => () => stopCamera(), []);

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
      setMessage('เปิดกล้องแล้ว วาง Barcode หรือ QR ให้อยู่ในกรอบ');
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

  const createRecord = () => {
    if (!activeHub || !activeStaff || !barcode.trim()) return;
    const record = createDraftRecord({ hub: activeHub, responsible: activeStaff, vehicleBarcode: barcode, hasDropTransfer });
    upsertRecord(record);
    addAudit({ recordId: record.id, action: 'record_created', detail: `created from barcode ${record.vehicleBarcode}`, actor: activeStaff.employeeCode });
    onCreated(record);
  };

  return (
    <section className="scan-screen">
      <article className="scan-camera">
        <video ref={videoRef} muted playsInline />
        {!cameraOn ? (
          <div className="scan-empty">
            <QrCode size={72} />
            <strong>สแกน Barcode / QR</strong>
            <span>ใช้กล้องหรือกรอกบาร์โค้ดรถเอง</span>
          </div>
        ) : null}
        <div className="scan-frame-box" />
      </article>
      <div className="scan-control-panel">
        <button className="primary-action" onClick={startCamera} type="button"><Camera size={20} /> เปิดกล้องสแกน</button>
        <label>
          <span>บาร์โค้ดรถ</span>
          <input value={barcode} onChange={(event) => setBarcode(normalizeVehicleBarcode(event.target.value))} placeholder="NAK..." />
        </label>
        <p className="locked-date">วันที่: {getLocalDateString()}</p>
        <div className="drop-choice">
          <button className={!hasDropTransfer ? 'active' : ''} onClick={() => setHasDropTransfer(false)} type="button">ไม่พ่วงดรอป</button>
          <button className={hasDropTransfer ? 'active' : ''} onClick={() => setHasDropTransfer(true)} type="button">พ่วงดรอป</button>
        </div>
        {message ? <p className="simple-message">{message}</p> : null}
        <button className="primary-action jumbo" disabled={!activeHub || !activeStaff || !barcode} onClick={createRecord} type="button">ไปถ่ายรูป</button>
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
      const text = workingRecord.hasDropTransfer
        ? `คุณยังไม่ได้ถ่าย ${missing.map((slot) => slot.labelThai).join(', ')} หากไม่มีรูปนี้ อาจไม่สามารถร้องเรียนหรือยืนยันงานได้ และพนักงานอาจถูกตรวจสอบ/ถูกลงโทษตามระเบียบ ต้องการส่งต่อหรือไม่?`
        : 'ยังถ่ายรูปไม่ครบ หากส่งข้อมูลไม่ครบ อาจไม่สามารถใช้เป็นหลักฐานร้องเรียนได้ และอาจมีผลต่อการตรวจสอบงานของพนักงาน ยืนยันจะส่งต่อหรือไม่?';
      if (!window.confirm(text)) return;
    }
    setMessage('กำลังบันทึกข้อมูล');
    const result = await submitRecordWithGoogleSync(workingRecord, missing.length > 0);
    setWorkingRecord(result.record);
    setMessage(result.sync.message);
    onReload();
    if (result.sync.queued) window.alert('บันทึกแล้ว ระบบจะซิงก์ให้อัตโนมัติ');
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
        <p>เงื่อนไข: {workingRecord.hasDropTransfer ? `พ่วงดรอป ${workingRecord.dropCount} จุด` : 'ไม่พ่วงดรอป'}</p>
      </article>
      {workingRecord.hasDropTransfer ? <button className="secondary-action" onClick={addDrop} type="button"><Plus size={18} /> เพิ่มดรอปอีก 1</button> : null}
      <div className="photo-grid">
        {workingRecord.photoSlots.map((slot) => (
          <article className="photo-proof-card" key={slot.slotId}>
            <div className="photo-card-head">
              <strong>{slot.labelThai}</strong>
              <StatusPill tone={slot.captured ? 'success' : 'warning'} text={slot.captured ? 'ถ่ายแล้ว' : 'ยังไม่ได้ถ่าย'} />
            </div>
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
        <span>รูปครบ {workingRecord.photoSlots.length - missing.length}/{workingRecord.photoSlots.length}</span>
        <button className="primary-action" onClick={submit} type="button">ส่งข้อมูล</button>
      </div>
    </section>
  );
}

function DoneScreen({ onMyWork, onScanNext }: { onMyWork: () => void; onScanNext: () => void }) {
  return (
    <article className="done-card">
      <CheckCircle2 size={70} />
      <h1>ส่งข้อมูลสำเร็จ</h1>
      <button className="primary-action jumbo" onClick={onScanNext} type="button">สแกนคันถัดไป</button>
      <button className="secondary-action jumbo" onClick={onMyWork} type="button">ไปงานของฉัน</button>
    </article>
  );
}

function MyWorkScreen({ onOpenRecord, records }: { onOpenRecord: (recordId: string) => void; records: ProofRecord[] }) {
  return (
    <section className="frontline-stack">
      <h1>งานของฉัน</h1>
      <RecordList records={records} onOpenRecord={onOpenRecord} />
    </section>
  );
}

function AdminApp({ activeRecord, onLock, onOpenRecord, onReload, onStepChange, records, step }: {
  activeRecord: ProofRecord | null;
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
        <NavButton active={step === 'dashboard'} icon={<Home size={18} />} label="Dashboard" onClick={() => onStepChange('dashboard')} />
        <NavButton active={step === 'hubs'} icon={<MapPin size={18} />} label="Hubs" onClick={() => onStepChange('hubs')} />
        <NavButton active={step === 'staff'} icon={<UserRound size={18} />} label="Responsible" onClick={() => onStepChange('staff')} />
        <NavButton active={step === 'records'} icon={<ClipboardList size={18} />} label="Records" onClick={() => onStepChange('records')} />
        <NavButton active={step === 'photos'} icon={<Camera size={18} />} label="Photos" onClick={() => onStepChange('photos')} />
        <NavButton active={step === 'export'} icon={<Download size={18} />} label="Export" onClick={() => onStepChange('export')} />
        <NavButton active={step === 'backup'} icon={<Shield size={18} />} label="Backup" onClick={() => onStepChange('backup')} />
        <NavButton active={step === 'settings'} icon={<Settings size={18} />} label="Settings" onClick={() => onStepChange('settings')} />
        <NavButton active={step === 'audit'} icon={<FileText size={18} />} label="Audit" onClick={() => onStepChange('audit')} />
      </aside>
      <div className="admin-content">
        {step === 'dashboard' ? <AdminDashboard records={records} /> : null}
        {step === 'hubs' ? <HubManager onReload={onReload} /> : null}
        {step === 'staff' ? <StaffManager onReload={onReload} /> : null}
        {step === 'records' ? <AdminRecords activeRecord={activeRecord} onOpenRecord={onOpenRecord} onReload={onReload} records={records} /> : null}
        {step === 'photos' ? <AdminPhotos records={records} /> : null}
        {step === 'export' ? <ExportPanel records={records} /> : null}
        {step === 'backup' ? <BackupPanel /> : null}
        {step === 'settings' ? <SettingsPanel onLock={onLock} onReload={onReload} /> : null}
        {step === 'audit' ? <AuditPanel /> : null}
      </div>
    </section>
  );
}

function AdminDashboard({ records }: { records: ProofRecord[] }) {
  const today = getLocalDateString();
  const todayRecords = records.filter((record) => record.date === today);
  return (
    <section className="admin-stack">
      <h1>Dashboard</h1>
      <div className="summary-grid">
        <StatCard label="วันนี้" value={todayRecords.length} />
        <StatCard label="Complete" value={records.filter((record) => record.status === 'COMPLETE').length} />
        <StatCard label="Need review" value={records.filter((record) => record.status === 'NEED_REVIEW').length} />
        <StatCard label="Missing photos" value={records.filter((record) => record.missingPhotoWarnings.length > 0).length} />
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
      <h1>Hubs</h1>
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
      <h1>Responsible Staff</h1>
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
      <h1>Records</h1>
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
      <h1>Photos</h1>
      {records.map((record) => (
        <article className="admin-detail-card" key={record.id}>
          <h2>{record.vehicleBarcode}</h2>
          <div className="mini-photo-row">
            {record.photoSlots.map((slot) => (
              <div key={slot.slotId}>
                {slot.imageLocalData ? <img src={slot.imageLocalData} alt={slot.labelThai} /> : <div className="photo-placeholder small">ยังไม่ได้ถ่าย</div>}
                <span>{slot.labelThai}</span>
                <small>{slot.displayTimestamp ?? '-'} / {slot.gpsStatus}</small>
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
      <h1>Export</h1>
      <p>Export เฉพาะหลังบ้าน: workbook.xlsx, photos/, manifest.json</p>
      <button className="primary-action" onClick={exportZip} type="button"><Download size={18} /> Export ZIP</button>
      {message ? <p className="simple-message">{message}</p> : null}
    </section>
  );
}

function BackupPanel() {
  return (
    <section className="admin-stack">
      <h1>Backup / Cleanup</h1>
      <p className="simple-message">ยังเป็น local-first guard: ต้อง export/backup ก่อน cleanup และไม่ลบ records โดยไม่มีการยืนยัน</p>
    </section>
  );
}

function SettingsPanel({ onLock, onReload }: { onLock: () => void; onReload: () => void }) {
  const [settings, setSettings] = useState(getSettings());
  const [pendingSyncCount, setPendingSyncCount] = useState(getPendingSyncCount());
  const [syncMessage, setSyncMessage] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [nextPin, setNextPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');
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
  const saveNewPin = () => {
    if (nextPin.trim().length < 4) {
      setPinMessage('PIN ใหม่ต้องมีอย่างน้อย 4 ตัว');
      return;
    }
    if (!changeAdminPin(currentPin, nextPin)) {
      setPinMessage('PIN ปัจจุบันไม่ถูกต้อง');
      return;
    }
    setCurrentPin('');
    setNextPin('');
    setPinMessage('เปลี่ยน PIN แอดมินแล้ว');
  };
  const resetData = () => {
    if (!window.confirm('ยืนยันล้างข้อมูลทดสอบในเครื่อง? Records, audit และคิวซิงก์จะถูกลบจากเครื่องนี้')) return;
    resetLocalTestData();
    setPendingSyncCount(0);
    onReload();
  };
  return (
    <section className="admin-stack">
      <h1>Settings</h1>
      <label className="checkbox-row">
        <input checked={settings.gpsMandatory} onChange={(event) => setSettings({ ...settings, gpsMandatory: event.target.checked })} type="checkbox" />
        GPS บังคับ (ตอนนี้ยังเป็นโหมดเตือน ไม่ปลอม GPS)
      </label>
      <label className="checkbox-row">
        <input checked={settings.watermarkEnabled} onChange={(event) => setSettings({ ...settings, watermarkEnabled: event.target.checked })} type="checkbox" />
        เปิด watermark บนรูป
      </label>
      <article className="admin-detail-card">
        <h2>Google Sheets Sync</h2>
        <div className="admin-form">
          <label>
            <span>Sync mode</span>
            <select value={settings.googleSyncMode} onChange={(event) => setSettings({ ...settings, googleSyncMode: event.target.value === 'google_sheets' ? 'google_sheets' : 'local_only' })}>
              <option value="local_only">Local only</option>
              <option value="google_sheets">Google Sheets sync</option>
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
        <div className="sync-status-row">
          <StatusPill tone={settings.googleSyncMode === 'google_sheets' ? 'warning' : 'success'} text={settings.googleSyncMode === 'google_sheets' ? 'Google Sheets sync' : 'Local only'} />
          <span>Pending sync queue: {pendingSyncCount}</span>
        </div>
        <div className="admin-form">
          <button className="secondary-action" onClick={testConnection} type="button"><RefreshCcw size={18} /> Test connection</button>
          <button className="secondary-action" disabled={pendingSyncCount === 0} onClick={retrySync} type="button"><RefreshCcw size={18} /> Retry sync</button>
        </div>
        {syncMessage ? <p className="simple-message">{syncMessage}</p> : null}
      </article>
      <article className="admin-detail-card">
        <h2>Admin PIN</h2>
        <p>PIN นี้ป้องกันหลังบ้านเฉพาะในเครื่องนี้เท่านั้น</p>
        <div className="admin-form">
          <input type="password" inputMode="numeric" value={currentPin} onChange={(event) => setCurrentPin(event.target.value)} placeholder="PIN ปัจจุบัน" />
          <input type="password" inputMode="numeric" value={nextPin} onChange={(event) => setNextPin(event.target.value)} placeholder="PIN ใหม่" />
          <button className="secondary-action" onClick={saveNewPin} type="button">เปลี่ยน PIN แอดมิน</button>
          <button className="secondary-action" onClick={onLock} type="button"><Lock size={18} /> ล็อกหลังบ้าน</button>
        </div>
        {pinMessage ? <p className="simple-message">{pinMessage}</p> : null}
      </article>
      <article className="admin-detail-card">
        <h2>Local Test Data</h2>
        <p>ใช้สำหรับล้างข้อมูลทดสอบในเครื่องนี้เท่านั้น ไม่ลบข้อมูลใน Google Sheets หรือ Google Drive</p>
        <button className="danger-action" onClick={resetData} type="button">Reset local test data</button>
      </article>
      <button className="primary-action" onClick={save} type="button">บันทึก Settings</button>
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

function RecordList({ onOpenRecord, records }: { onOpenRecord?: (recordId: string) => void; records: ProofRecord[] }) {
  return (
    <div className="record-list">
      {records.map((record) => (
        <button className="record-row" key={record.id} onClick={() => onOpenRecord?.(record.id)} type="button">
          <strong>{record.vehicleBarcode}</strong>
          <span>{record.date} / {record.hubCode} / {record.responsibleEmployeeCode} {record.responsibleName}</span>
          <StatusPill tone={record.status === 'COMPLETE' ? 'success' : record.status === 'NEED_REVIEW' ? 'danger' : 'warning'} text={record.status} />
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

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={active ? 'nav-button active' : 'nav-button'} onClick={onClick} type="button">
      {icon}
      <span>{label}</span>
    </button>
  );
}
