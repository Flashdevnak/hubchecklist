import { Camera, CheckCircle2, ClipboardList, Home, Lock, Plus, QrCode, RefreshCcw, Search, Settings, Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type ActiveContext,
  type BootstrapData,
  type DropType,
  type Hub,
  type ProofRecord,
  type ResponsibleStaff,
  buildDuplicateKey,
  canClearLocalCache,
  capturePhoto,
  changeDropType,
  clearSafeLocalCache,
  createDraftRecord,
  deactivateHubCentral,
  deactivateResponsibleCentral,
  findExistingWork,
  formatBangkok,
  getActiveContext,
  getAdminAuthStatus,
  getCentralUrlStatus,
  getHistory,
  getMissingPhotoSlots,
  getPendingPhotoCount,
  getPendingSyncCount,
  getRecord,
  getRecordByDuplicateKey,
  isActiveWork,
  isCentralConfigured,
  listHubs,
  listRecords,
  listResponsibleStaff,
  normalizeVehicleBarcode,
  pullCentralData,
  retryPendingSync,
  saveActiveContext,
  setCentralAdminPin,
  statusText,
  submitRecord,
  testCentralHealth,
  todayBangkok,
  updateSettingsCentral,
  upsertHubCentral,
  upsertResponsibleCentral,
  verifyAdminPin,
} from './services/reset003';

type FrontTab = 'today' | 'scan' | 'photos' | 'work';
type AdminTab = 'overview' | 'hubs' | 'staff' | 'records' | 'photos' | 'history' | 'export' | 'settings' | 'central';
type BarcodeDetectorShape = new (options?: { formats?: string[] }) => { detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>> };

export default function App() {
  const [frontTab, setFrontTab] = useState<FrontTab>('today');
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [adminOpen, setAdminOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [banner, setBanner] = useState('กำลังดึงข้อมูล');
  const hiddenPressRef = useRef<number | null>(null);
  const scannerOpen = !adminOpen && frontTab === 'scan';

  const reload = () => setRefreshKey((value) => value + 1);
  const records = useMemo(() => listRecords(), [refreshKey]);
  const activeRecord = activeRecordId ? getRecord(activeRecordId) : null;

  useEffect(() => {
    void refreshCentral('เปิดแอป');
  }, []);

  useEffect(() => {
    const online = () => { void refreshCentral('กลับมาออนไลน์'); };
    window.addEventListener('online', online);
    return () => window.removeEventListener('online', online);
  }, []);

  const refreshCentral = async (_source: string) => {
    const result = await pullCentralData();
    setBootstrap(result.bootstrap);
    setBanner(result.ok ? 'ดึงข้อมูลล่าสุดแล้ว' : result.message);
    reload();
  };

  const unlockAdmin = () => {
    setAdminOpen(true);
    setPinOpen(false);
    setAdminTab('overview');
  };

  const openHiddenAdmin = () => {
    if (hiddenPressRef.current) window.clearTimeout(hiddenPressRef.current);
    hiddenPressRef.current = window.setTimeout(() => setPinOpen(true), 1400);
  };

  const cancelHiddenAdmin = () => {
    if (!hiddenPressRef.current) return;
    window.clearTimeout(hiddenPressRef.current);
    hiddenPressRef.current = null;
  };

  return (
    <div className={scannerOpen ? 'app scanner-live' : 'app'}>
      {!scannerOpen ? (
        <header className="topbar">
          <button
            className="brand-button"
            onDoubleClick={() => setPinOpen(true)}
            onPointerCancel={cancelHiddenAdmin}
            onPointerDown={openHiddenAdmin}
            onPointerLeave={cancelHiddenAdmin}
            onPointerUp={cancelHiddenAdmin}
            type="button"
          >
            <strong>Hub Photo Proof</strong>
            <span>{adminOpen ? 'หลังบ้าน' : 'หน้างาน'}</span>
          </button>
          <div className="topbar-actions">
            <StatusBadge tone={isCentralConfigured() ? 'good' : 'warn'}>{isCentralConfigured() ? 'ระบบกลาง' : 'ยังไม่ได้ตั้งค่าระบบกลาง'}</StatusBadge>
            {adminOpen ? (
              <button className="soft-button" onClick={() => setAdminOpen(false)} type="button"><Lock size={18} /> ล็อก</button>
            ) : (
              <button className="icon-button" onClick={() => setPinOpen(true)} type="button" aria-label="หลังบ้าน"><Settings size={19} /></button>
            )}
          </div>
        </header>
      ) : null}

      <main className="main">
        {adminOpen ? (
          <AdminArea
            activeTab={adminTab}
            bootstrap={bootstrap}
            onRefresh={() => { void refreshCentral('หลังบ้าน'); }}
            onReload={reload}
            onSelectTab={setAdminTab}
            records={records}
          />
        ) : (
          <FrontlineArea
            activeRecord={activeRecord}
            banner={banner}
            onOpenRecord={(recordId) => {
              setActiveRecordId(recordId);
              setFrontTab('photos');
            }}
            onRefresh={() => { void refreshCentral('หน้างาน'); }}
            onReload={reload}
            onSelectTab={setFrontTab}
            records={records}
            tab={frontTab}
          />
        )}
      </main>

      {pinOpen ? <AdminPinPanel onCancel={() => setPinOpen(false)} onSuccess={unlockAdmin} /> : null}

      {!adminOpen && !scannerOpen ? (
        <BottomNav>
          <NavButton active={frontTab === 'today'} icon={<Home size={20} />} label="วันนี้" onClick={() => setFrontTab('today')} />
          <NavButton active={frontTab === 'scan'} icon={<QrCode size={20} />} label="สแกน" onClick={() => setFrontTab('scan')} />
          <NavButton active={frontTab === 'photos'} icon={<Camera size={20} />} label="รูป" onClick={() => setFrontTab('photos')} />
          <NavButton active={frontTab === 'work'} icon={<ClipboardList size={20} />} label="งานของฉัน" onClick={() => setFrontTab('work')} />
        </BottomNav>
      ) : null}
    </div>
  );
}

function FrontlineArea(props: {
  activeRecord: ProofRecord | null;
  banner: string;
  onOpenRecord: (recordId: string) => void;
  onRefresh: () => void;
  onReload: () => void;
  onSelectTab: (tab: FrontTab) => void;
  records: ProofRecord[];
  tab: FrontTab;
}) {
  if (props.tab === 'scan') {
    return <ScannerScreen onClose={() => props.onSelectTab('today')} onCreated={(record) => { props.onReload(); props.onOpenRecord(record.recordId); }} />;
  }
  if (props.tab === 'photos') {
    return <PhotoScreen record={props.activeRecord} onDone={() => { props.onReload(); props.onSelectTab('work'); }} onReload={props.onReload} />;
  }
  if (props.tab === 'work') {
    return <MyWorkScreen onOpenRecord={props.onOpenRecord} onRefresh={props.onRefresh} records={props.records} />;
  }
  return <TodayScreen banner={props.banner} onRefresh={props.onRefresh} onScan={() => props.onSelectTab('scan')} records={props.records} />;
}

function TodayScreen({ banner, onRefresh, onScan, records }: { banner: string; onRefresh: () => void; onScan: () => void; records: ProofRecord[] }) {
  const hubs = listHubs();
  const staff = listResponsibleStaff();
  const saved = getActiveContext();
  const [hubCode, setHubCode] = useState(saved?.hubCode || hubs[0]?.hubCode || '');
  const filteredStaff = staff.filter((item) => item.hubCode === hubCode);
  const [employeeCode, setEmployeeCode] = useState(saved?.employeeCode || filteredStaff[0]?.employeeCode || '');
  const selectedHub = hubs.find((hub) => hub.hubCode === hubCode);
  const selectedStaff = filteredStaff.find((item) => item.employeeCode === employeeCode);
  const today = todayBangkok();
  const contextRecords = records.filter((record) => record.date === today && record.hubCode === hubCode && record.responsibleEmployeeCode === employeeCode);

  useEffect(() => {
    if (!filteredStaff.some((item) => item.employeeCode === employeeCode)) {
      setEmployeeCode(filteredStaff[0]?.employeeCode || '');
    }
  }, [hubCode, employeeCode, filteredStaff]);

  const saveContext = () => {
    if (!selectedHub || !selectedStaff) return;
    saveActiveContext({ hubCode: selectedHub.hubCode, employeeCode: selectedStaff.employeeCode });
    onScan();
  };

  return (
    <section className="stack">
      <article className="hero">
        <div>
          <h1>Hub Photo Proof</h1>
          <p>เลือกฮับและผู้รับผิดชอบก่อนเริ่มงาน</p>
        </div>
        <StatusBadge tone={isCentralConfigured() ? 'good' : 'warn'}>{banner}</StatusBadge>
      </article>

      <article className="panel">
        <label>
          <span>ฮับ</span>
          <select value={hubCode} onChange={(event) => setHubCode(event.target.value)}>
            {hubs.map((hub) => <option key={hub.hubCode} value={hub.hubCode}>{hub.hubCode} - {hub.hubName}</option>)}
          </select>
        </label>
        <label>
          <span>ผู้รับผิดชอบ</span>
          <select value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)}>
            {filteredStaff.map((item) => <option key={`${item.employeeCode}-${item.hubCode}`} value={item.employeeCode}>{item.employeeCode} {item.employeeName}</option>)}
          </select>
        </label>
        <button className="primary-button" disabled={!selectedHub || !selectedStaff} onClick={saveContext} type="button">บันทึกและเริ่มงาน</button>
        <button className="soft-button" onClick={onRefresh} type="button"><RefreshCcw size={18} /> รีเฟรชข้อมูล</button>
      </article>

      <div className="stats">
        <Stat label="งานวันนี้" value={contextRecords.length} />
        <Stat label="รอซิงก์" value={contextRecords.filter((item) => item.status === 'PENDING_SYNC' || item.status === 'SYNC_FAILED').length} />
        <Stat label="ซิงก์แล้ว" value={contextRecords.filter((item) => item.status === 'SYNCED').length} />
      </div>
    </section>
  );
}

function ScannerScreen({ onClose, onCreated }: { onClose: () => void; onCreated: (record: ProofRecord) => void }) {
  const context = getActiveContext();
  const hub = listHubs().find((item) => item.hubCode === context?.hubCode) ?? null;
  const staff = listResponsibleStaff().find((item) => item.employeeCode === context?.employeeCode && item.hubCode === context?.hubCode) ?? null;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [dropType, setDropType] = useState<DropType>('NO_DROP');
  const [dropCount, setDropCount] = useState(2);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let stopped = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setMessage('เปิดกล้องไม่สำเร็จ กรุณากรอกเอง');
      }
    };
    void start();
    return () => {
      stopped = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const detectorCtor = (window as Window & { BarcodeDetector?: BarcodeDetectorShape }).BarcodeDetector;
    if (!detectorCtor || !videoRef.current) return () => { cancelled = true; };
    const detector = new detectorCtor({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13'] });
    const scan = async () => {
      if (cancelled || !videoRef.current) return;
      try {
        const results = await detector.detect(videoRef.current);
        const value = results[0]?.rawValue;
        if (value) await useBarcode(value);
      } catch {
        window.setTimeout(scan, 600);
        return;
      }
      if (!cancelled) window.setTimeout(scan, 600);
    };
    const timer = window.setTimeout(scan, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  });

  const useBarcode = async (raw: string) => {
    if (!hub || !staff) {
      setMessage('กรุณาเลือกฮับและผู้รับผิดชอบก่อน');
      return;
    }
    const clean = normalizeVehicleBarcode(raw);
    if (!clean) {
      setMessage('ไม่พบบาร์โค้ดรถ');
      return;
    }
    navigator.vibrate?.(80);
    const duplicateKey = buildDuplicateKey(todayBangkok(), hub.hubCode, staff.employeeCode, clean);
    const localExisting = getRecordByDuplicateKey(duplicateKey);
    const centralExisting = await findExistingWork({ hubCode: hub.hubCode, responsibleEmployeeCode: staff.employeeCode, vehicleBarcode: clean });
    const existing = centralExisting ?? localExisting;
    if (existing) {
      if (['COMPLETE', 'SYNCED'].includes(existing.status)) {
        setMessage('งานนี้ส่งแล้ว กดงานของฉันเพื่อดูรายการที่ส่งแล้ว');
        return;
      }
      onCreated(existing);
      return;
    }
    const record = createDraftRecord({ hub, responsible: staff, vehicleBarcode: clean, dropType, dropCount });
    onCreated(record);
  };

  return (
    <section className="scanner">
      <video ref={videoRef} muted playsInline />
      <div className="scan-overlay">
        <div className="scan-top">
          <button className="round-button" onClick={onClose} type="button" aria-label="ปิด"><X size={24} /></button>
          <strong>สแกนบาร์รถ</strong>
          <span>{hub?.hubCode ?? '-'}</span>
        </div>
        <div className="scan-frame"><span>เล็งบาร์โค้ดหรือ QR</span></div>
        <div className="scan-bottom">
          <div className="drop-toggle">
            <button className={dropType === 'NO_DROP' ? 'active' : ''} onClick={() => setDropType('NO_DROP')} type="button">ไม่พ่วงดรอป</button>
            <button className={dropType === 'DROP' ? 'active' : ''} onClick={() => setDropType('DROP')} type="button">พ่วงดรอป</button>
          </div>
          {dropType === 'DROP' ? (
            <label>
              <span>จำนวนดรอป</span>
              <input min={2} inputMode="numeric" type="number" value={dropCount} onChange={(event) => setDropCount(Number(event.target.value) || 2)} />
            </label>
          ) : null}
          <div className="scan-actions">
            <button className="soft-button" onClick={() => setManualOpen(true)} type="button">กรอกเอง</button>
            <button className="soft-button" onClick={() => setMessage('ไฟฉายยังไม่รองรับบนอุปกรณ์นี้')} type="button">เปิดไฟฉาย</button>
            <button className="primary-button" onClick={() => setMessage('พร้อมสแกนใหม่')} type="button">สแกนใหม่</button>
          </div>
          {message ? <p className="message dark">{message}</p> : null}
        </div>
      </div>
      {manualOpen ? (
        <div className="sheet">
          <article>
            <h2>กรอกบาร์รถ</h2>
            <label>
              <span>บาร์โค้ดรถ</span>
              <input autoFocus value={barcode} onChange={(event) => setBarcode(event.target.value)} />
            </label>
            <div className="two-actions">
              <button className="soft-button" onClick={() => setManualOpen(false)} type="button">ยกเลิก</button>
              <button className="primary-button" onClick={() => { void useBarcode(barcode); }} type="button">ใช้บาร์โค้ดนี้</button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}

function PhotoScreen({ onDone, onReload, record }: { onDone: () => void; onReload: () => void; record: ProofRecord | null }) {
  const [current, setCurrent] = useState(record);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setCurrent(record), [record]);

  if (!current) {
    return (
      <section className="stack">
        <article className="panel empty">
          <Camera size={42} />
          <h1>ยังไม่มีงานถ่ายรูป</h1>
          <p>เริ่มจากแท็บสแกนก่อน</p>
        </article>
      </section>
    );
  }

  const updateDrop = (dropType: DropType) => {
    const next = changeDropType(current, dropType, current.dropCount);
    setCurrent(next);
    onReload();
  };

  const pickPhoto = async (slotId: string, file?: File) => {
    if (!file) return;
    setMessage('กำลังใส่ลายน้ำรูป');
    const next = await capturePhoto(current, slotId, file);
    setCurrent(next);
    setMessage('ถ่ายแล้ว');
    onReload();
  };

  const submit = async () => {
    const missing = getMissingPhotoSlots(current);
    if (missing.length && !window.confirm('ยังมีรูปที่ขาด ต้องการส่งเพื่อให้ตรวจสอบหรือไม่?')) return;
    setSaving(true);
    const result = await submitRecord(current, missing.length > 0);
    setCurrent(result.record);
    setMessage(result.message);
    setSaving(false);
    onReload();
    if (result.record.status === 'SYNCED' || result.record.status === 'PENDING_SYNC' || result.record.status === 'SYNC_FAILED') onDone();
  };

  const missing = getMissingPhotoSlots(current);

  return (
    <section className="stack photo-page">
      <article className="hero compact">
        <div>
          <h1>{current.vehicleBarcode}</h1>
          <p>{current.hubCode} / {current.responsibleEmployeeCode} {current.responsibleName}</p>
        </div>
        <StatusBadge tone={current.status === 'SYNCED' ? 'good' : current.status === 'SYNC_FAILED' ? 'bad' : 'warn'}>{statusText(current.status)}</StatusBadge>
      </article>

      <article className="panel">
        <div className="drop-toggle">
          <button className={current.dropType === 'NO_DROP' ? 'active' : ''} onClick={() => updateDrop('NO_DROP')} type="button">ไม่พ่วงดรอป</button>
          <button className={current.dropType === 'DROP' ? 'active' : ''} onClick={() => updateDrop('DROP')} type="button">พ่วงดรอป</button>
        </div>
      </article>

      <div className="photo-grid">
        {current.photoSlots.map((slot) => (
          <article className="photo-card" key={slot.slotId}>
            <div className="photo-head">
              <strong>{slot.label}</strong>
              <StatusBadge tone={slot.captured ? 'good' : 'warn'}>{slot.captured ? 'ถ่ายแล้ว' : 'ยังไม่ถ่าย'}</StatusBadge>
            </div>
            {slot.imageLocalData ? <img alt={slot.label} src={slot.imageLocalData} /> : <div className="photo-placeholder">ต้องถ่ายเพิ่ม</div>}
            <div className="photo-meta">
              <span>{slot.capturedAt ? formatBangkok(slot.capturedAt) : '-'}</span>
              <span>{slot.latitude && slot.longitude ? `${slot.latitude.toFixed(6)}, ${slot.longitude.toFixed(6)}` : 'พิกัด: ไม่พบตำแหน่ง'}</span>
              <span>สถานที่: {slot.addressText || 'ไม่พบชื่อสถานที่'}</span>
            </div>
            <label className="capture-button">
              <input accept="image/*" capture="environment" type="file" onChange={(event) => { void pickPhoto(slot.slotId, event.target.files?.[0]); event.target.value = ''; }} />
              <Camera size={18} /> {slot.captured ? 'ถ่ายใหม่' : 'ถ่ายรูป'}
            </label>
          </article>
        ))}
      </div>

      <div className="sticky-submit">
        <span>{missing.length ? `รูปที่ขาด ${missing.length} รูป` : 'รูปครบแล้ว'}</span>
        <button className="primary-button" disabled={saving} onClick={() => { void submit(); }} type="button">{saving ? 'กำลังส่ง' : 'ส่งงาน'}</button>
      </div>
      {message ? <p className="message">{message}</p> : null}
    </section>
  );
}

function MyWorkScreen({ onOpenRecord, onRefresh, records }: { onOpenRecord: (recordId: string) => void; onRefresh: () => void; records: ProofRecord[] }) {
  const [showSubmitted, setShowSubmitted] = useState(localStorage.getItem('reset011.showSubmitted') === 'true');
  const today = todayBangkok();
  const visible = records
    .filter((record) => record.date === today)
    .filter((record) => showSubmitted ? ['COMPLETE', 'SYNCED'].includes(record.status) : isActiveWork(record));

  const toggle = () => {
    const next = !showSubmitted;
    setShowSubmitted(next);
    localStorage.setItem('reset011.showSubmitted', next ? 'true' : 'false');
  };

  return (
    <section className="stack">
      <article className="hero compact">
        <div>
          <h1>งานของฉัน</h1>
          <p>รายการจะรวมงานซ้ำตามบาร์โค้ด ฮับ และผู้รับผิดชอบ</p>
        </div>
      </article>
      <div className="toolbar">
        <button className="soft-button" onClick={toggle} type="button">{showSubmitted ? 'ซ่อนงานที่ส่งแล้ว' : 'ดูงานที่ส่งแล้ว'}</button>
        <button className="soft-button" onClick={onRefresh} type="button"><RefreshCcw size={18} /> รีเฟรชข้อมูล</button>
      </div>
      <RecordList empty="ยังไม่มีงาน" onOpen={onOpenRecord} records={visible} />
    </section>
  );
}

function AdminPinPanel({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('สำหรับผู้ดูแลเท่านั้น');

  useEffect(() => {
    void getAdminAuthStatus().then((result) => {
      if (!result.ok || !result.data?.adminPinSet) setMessage('ยังไม่ได้ตั้งค่า PIN หลังบ้าน กรุณาติดต่อผู้ดูแล');
    });
  }, []);

  const submit = async () => {
    const result = await verifyAdminPin(pin);
    if (!result.ok) {
      setMessage(result.message || 'PIN ไม่ถูกต้อง');
      return;
    }
    onSuccess();
  };

  return (
    <div className="modal">
      <article className="pin-panel">
        <h2>เข้าสู่หลังบ้าน</h2>
        <p>{message}</p>
        <label>
          <span>Admin PIN</span>
          <input autoFocus inputMode="numeric" type="password" value={pin} onChange={(event) => setPin(event.target.value)} />
        </label>
        <div className="two-actions">
          <button className="soft-button" onClick={onCancel} type="button">ยกเลิก</button>
          <button className="primary-button" onClick={() => { void submit(); }} type="button">เข้าใช้งาน</button>
        </div>
      </article>
    </div>
  );
}

function AdminArea({ activeTab, bootstrap, onRefresh, onReload, onSelectTab, records }: {
  activeTab: AdminTab;
  bootstrap: BootstrapData | null;
  onRefresh: () => void;
  onReload: () => void;
  onSelectTab: (tab: AdminTab) => void;
  records: ProofRecord[];
}) {
  return (
    <section className="admin-layout">
      <aside className="admin-nav">
        {[
          ['overview', 'ภาพรวม'],
          ['hubs', 'ฮับ'],
          ['staff', 'ผู้รับผิดชอบ'],
          ['records', 'รายการ'],
          ['photos', 'รูปภาพ'],
          ['history', 'ประวัติ'],
          ['export', 'ส่งออก'],
          ['settings', 'ตั้งค่า'],
          ['central', 'ระบบกลาง'],
        ].map(([key, label]) => (
          <button className={activeTab === key ? 'active' : ''} key={key} onClick={() => onSelectTab(key as AdminTab)} type="button">{label}</button>
        ))}
      </aside>
      <div className="admin-content">
        {activeTab === 'overview' ? <AdminOverview records={records} /> : null}
        {activeTab === 'hubs' ? <HubAdmin onReload={onReload} /> : null}
        {activeTab === 'staff' ? <StaffAdmin onReload={onReload} /> : null}
        {activeTab === 'records' ? <AdminRecords records={records} /> : null}
        {activeTab === 'photos' ? <AdminPhotos records={records} /> : null}
        {activeTab === 'history' ? <AdminHistory /> : null}
        {activeTab === 'export' ? <ExportPanel /> : null}
        {activeTab === 'settings' ? <SettingsPanel /> : null}
        {activeTab === 'central' ? <CentralPanel bootstrap={bootstrap} onRefresh={onRefresh} onReload={onReload} /> : null}
      </div>
    </section>
  );
}

function AdminOverview({ records }: { records: ProofRecord[] }) {
  return (
    <section className="stack">
      <h1>ภาพรวม</h1>
      <div className="stats">
        <Stat label="รายการทั้งหมด" value={records.length} />
        <Stat label="ซิงก์แล้ว" value={records.filter((item) => item.status === 'SYNCED').length} />
        <Stat label="รอซิงก์" value={getPendingSyncCount()} />
        <Stat label="รูปค้างซิงก์" value={getPendingPhotoCount()} />
      </div>
    </section>
  );
}

function HubAdmin({ onReload }: { onReload: () => void }) {
  const [hubCode, setHubCode] = useState('');
  const [hubName, setHubName] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const hubs = listHubs();

  const save = async () => {
    if (!isCentralConfigured()) {
      setMessage('ต้องเชื่อมต่อระบบกลางก่อนจึงจะบันทึกได้');
      return;
    }
    const result = await upsertHubCentral({ hubCode, hubName, active: true, note });
    setMessage(result.ok ? 'บันทึกลงระบบกลางแล้ว' : 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    setHubCode('');
    setHubName('');
    setNote('');
    onReload();
  };

  const deactivate = async (code: string) => {
    const result = await deactivateHubCentral(code);
    setMessage(result.ok ? 'บันทึกลงระบบกลางแล้ว' : 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    onReload();
  };

  return (
    <section className="stack">
      <h1>ฮับ</h1>
      <article className="panel form-grid">
        <label><span>รหัสฮับ</span><input value={hubCode} onChange={(event) => setHubCode(event.target.value.toUpperCase())} /></label>
        <label><span>ชื่อฮับ</span><input value={hubName} onChange={(event) => setHubName(event.target.value)} /></label>
        <label><span>หมายเหตุ</span><input value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <button className="primary-button" onClick={() => { void save(); }} type="button"><Plus size={18} /> เพิ่มฮับ</button>
      </article>
      <div className="list">
        {hubs.map((hub) => (
          <article className="row" key={hub.hubCode}>
            <div><strong>{hub.hubCode}</strong><span>{hub.hubName}</span></div>
            <div className="row-actions">
              <button className="soft-button" onClick={() => { setHubCode(hub.hubCode); setHubName(hub.hubName); setNote(hub.note ?? ''); }} type="button">แก้ไขฮับ</button>
              <button className="danger-button" onClick={() => { void deactivate(hub.hubCode); }} type="button"><Trash2 size={17} /> ปิดใช้งานฮับ</button>
            </div>
          </article>
        ))}
      </div>
      {message ? <p className="message">{message}</p> : null}
    </section>
  );
}

function StaffAdmin({ onReload }: { onReload: () => void }) {
  const hubs = listHubs();
  const staff = listResponsibleStaff();
  const [employeeCode, setEmployeeCode] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [hubCode, setHubCode] = useState(hubs[0]?.hubCode || '');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  const save = async () => {
    if (!isCentralConfigured()) {
      setMessage('ต้องเชื่อมต่อระบบกลางก่อนจึงจะบันทึกได้');
      return;
    }
    const result = await upsertResponsibleCentral({ employeeCode, employeeName, hubCode, active: true, note });
    setMessage(result.ok ? 'บันทึกลงระบบกลางแล้ว' : 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    setEmployeeCode('');
    setEmployeeName('');
    setNote('');
    onReload();
  };

  const deactivate = async (code: string, staffHubCode: string) => {
    const result = await deactivateResponsibleCentral(code, staffHubCode);
    setMessage(result.ok ? 'บันทึกลงระบบกลางแล้ว' : 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    onReload();
  };

  return (
    <section className="stack">
      <h1>ผู้รับผิดชอบ</h1>
      <article className="panel form-grid">
        <label><span>รหัสพนักงาน</span><input value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)} /></label>
        <label><span>ชื่อ</span><input value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} /></label>
        <label><span>ฮับ</span><select value={hubCode} onChange={(event) => setHubCode(event.target.value)}>{hubs.map((hub) => <option key={hub.hubCode} value={hub.hubCode}>{hub.hubCode}</option>)}</select></label>
        <label><span>หมายเหตุ</span><input value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <button className="primary-button" onClick={() => { void save(); }} type="button"><Plus size={18} /> เพิ่มผู้รับผิดชอบ</button>
      </article>
      <div className="list">
        {staff.map((item) => (
          <article className="row" key={`${item.employeeCode}-${item.hubCode}`}>
            <div><strong>{item.employeeCode} {item.employeeName}</strong><span>{item.hubCode}</span></div>
            <div className="row-actions">
              <button className="soft-button" onClick={() => { setEmployeeCode(item.employeeCode); setEmployeeName(item.employeeName); setHubCode(item.hubCode); setNote(item.note ?? ''); }} type="button">แก้ไขผู้รับผิดชอบ</button>
              <button className="danger-button" onClick={() => { void deactivate(item.employeeCode, item.hubCode); }} type="button">ปิดใช้งานผู้รับผิดชอบ</button>
            </div>
          </article>
        ))}
      </div>
      {message ? <p className="message">{message}</p> : null}
    </section>
  );
}

function AdminRecords({ records }: { records: ProofRecord[] }) {
  return <section className="stack"><h1>รายการ</h1><RecordList empty="ยังไม่มีรายการ" records={records} /></section>;
}

function AdminPhotos({ records }: { records: ProofRecord[] }) {
  const photos = records.flatMap((record) => record.photoSlots.filter((slot) => slot.captured).map((slot) => ({ record, slot })));
  return (
    <section className="stack">
      <h1>รูปภาพ</h1>
      <div className="photo-grid">
        {photos.map(({ record, slot }) => (
          <article className="photo-card" key={`${record.recordId}-${slot.slotId}`}>
            {slot.imageLocalData ? <img alt={slot.label} src={slot.imageLocalData} /> : <div className="photo-placeholder">รูปอยู่ใน Drive</div>}
            <strong>{slot.label}</strong>
            <span>{record.vehicleBarcode}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminHistory() {
  const [filters, setFilters] = useState({ dateFrom: todayBangkok(), dateTo: todayBangkok(), hubCode: '', responsibleEmployeeCode: '', vehicleBarcode: '', status: '' });
  const [records, setRecords] = useState<ProofRecord[]>([]);
  const [message, setMessage] = useState('');

  const search = async () => {
    try {
      const result = await getHistory(filters);
      setRecords(result);
      setMessage(`พบ ${result.length} รายการ`);
    } catch {
      setMessage('ดึงประวัติไม่สำเร็จ');
    }
  };

  return (
    <section className="stack">
      <h1>ประวัติ</h1>
      <article className="panel form-grid">
        <label><span>วันที่เริ่ม</span><input type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} /></label>
        <label><span>วันที่สิ้นสุด</span><input type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} /></label>
        <label><span>ฮับ</span><input value={filters.hubCode} onChange={(event) => setFilters({ ...filters, hubCode: event.target.value })} /></label>
        <label><span>ผู้รับผิดชอบ</span><input value={filters.responsibleEmployeeCode} onChange={(event) => setFilters({ ...filters, responsibleEmployeeCode: event.target.value })} /></label>
        <label><span>บาร์โค้ดรถ</span><input value={filters.vehicleBarcode} onChange={(event) => setFilters({ ...filters, vehicleBarcode: event.target.value })} /></label>
        <label><span>สถานะ</span><input value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} /></label>
        <button className="primary-button" onClick={() => { void search(); }} type="button"><Search size={18} /> ค้นหา</button>
      </article>
      {message ? <p className="message">{message}</p> : null}
      <RecordList empty="ยังไม่มีประวัติ" records={records} />
    </section>
  );
}

function ExportPanel() {
  return (
    <section className="stack">
      <h1>ส่งออก</h1>
      <article className="panel">
        <p>หน้านี้เก็บไว้สำหรับส่งออกประวัติจากระบบกลางในงานถัดไป ยังไม่ลบข้อมูลกลางและยังไม่อ้างว่าส่งออกจริง</p>
      </article>
    </section>
  );
}

function SettingsPanel() {
  const [message, setMessage] = useState('');
  const [pin, setPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [settings, setSettings] = useState({
    GPS_REQUIRED: 'false',
    WATERMARK_ENABLED: 'true',
    REQUIRE_ADMIN_DEVICE_APPROVAL: 'false',
    MINIMUM_APP_VERSION: '0.1.0',
  });

  const saveSettings = async () => {
    try {
      await updateSettingsCentral({ ...settings, GPS_MANDATORY: settings.GPS_REQUIRED });
      setMessage('บันทึกลงระบบกลางแล้ว');
    } catch {
      setMessage('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  const savePin = async () => {
    const result = await setCentralAdminPin(pin, currentPin);
    setMessage(result.ok ? 'บันทึกลงระบบกลางแล้ว' : result.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
  };

  return (
    <section className="stack">
      <h1>ตั้งค่า</h1>
      <article className="panel form-grid">
        <label className="check"><input checked={settings.GPS_REQUIRED === 'true'} onChange={(event) => setSettings({ ...settings, GPS_REQUIRED: event.target.checked ? 'true' : 'false' })} type="checkbox" /> บังคับ GPS</label>
        <label className="check"><input checked={settings.WATERMARK_ENABLED === 'true'} onChange={(event) => setSettings({ ...settings, WATERMARK_ENABLED: event.target.checked ? 'true' : 'false' })} type="checkbox" /> เปิดลายน้ำ</label>
        <label className="check"><input checked={settings.REQUIRE_ADMIN_DEVICE_APPROVAL === 'true'} onChange={(event) => setSettings({ ...settings, REQUIRE_ADMIN_DEVICE_APPROVAL: event.target.checked ? 'true' : 'false' })} type="checkbox" /> ต้องอนุมัติเครื่องแอดมิน</label>
        <label><span>เวอร์ชันขั้นต่ำ</span><input value={settings.MINIMUM_APP_VERSION} onChange={(event) => setSettings({ ...settings, MINIMUM_APP_VERSION: event.target.value })} /></label>
        <button className="primary-button" onClick={() => { void saveSettings(); }} type="button">บันทึกตั้งค่า</button>
      </article>
      <article className="panel form-grid">
        <label><span>PIN ปัจจุบัน</span><input inputMode="numeric" type="password" value={currentPin} onChange={(event) => setCurrentPin(event.target.value)} /></label>
        <label><span>PIN ใหม่</span><input inputMode="numeric" type="password" value={pin} onChange={(event) => setPin(event.target.value)} /></label>
        <button className="soft-button" onClick={() => { void savePin(); }} type="button">บันทึก PIN</button>
      </article>
      {message ? <p className="message">{message}</p> : null}
    </section>
  );
}

function CentralPanel({ bootstrap, onRefresh, onReload }: { bootstrap: BootstrapData | null; onRefresh: () => void; onReload: () => void }) {
  const [message, setMessage] = useState('');
  const check = async () => {
    const result = await testCentralHealth();
    setMessage(result.ok ? 'ระบบกลางพร้อมใช้งาน' : result.message);
  };
  const retry = async () => {
    const result = await retryPendingSync();
    setMessage(result.message);
    onReload();
  };
  const clear = async () => {
    const allowed = canClearLocalCache();
    if (!allowed.ok) {
      setMessage(allowed.message);
      return;
    }
    if (!window.confirm('ล้างแคชเฉพาะเครื่องนี้ ข้อมูลในระบบกลางจะไม่ถูกลบ ต้องการดำเนินการต่อหรือไม่?')) return;
    const result = await clearSafeLocalCache();
    setMessage(result.message);
    onReload();
  };
  return (
    <section className="stack">
      <h1>ระบบกลาง</h1>
      <article className="panel info-list">
        <span>สถานะระบบกลาง: {getCentralUrlStatus() === 'configured' ? 'ตั้งค่าแล้ว' : 'ยังไม่ได้ตั้งค่า'}</span>
        <span>เวอร์ชัน API: {bootstrap?.apiVersion ?? '-'}</span>
        <span>เวลาระบบกลาง: {bootstrap?.serverTime ?? '-'}</span>
        <span>ดึงข้อมูลล่าสุดเมื่อ: {bootstrap?.pulledAt ? formatBangkok(bootstrap.pulledAt) : '-'}</span>
        <span>งานรอซิงก์ในเครื่อง: {getPendingSyncCount()}</span>
        <span>รูปรอซิงก์ในเครื่อง: {getPendingPhotoCount()}</span>
      </article>
      <div className="toolbar">
        <button className="soft-button" onClick={() => { void check(); }} type="button">ตรวจระบบกลาง</button>
        <button className="soft-button" onClick={onRefresh} type="button">ดึงข้อมูลล่าสุดจากระบบกลาง</button>
        <button className="soft-button" onClick={() => { void retry(); }} type="button">ซิงก์งานค้างตอนนี้</button>
        <button className="danger-button" onClick={() => { void clear(); }} type="button">ล้างแคชเครื่องนี้</button>
      </div>
      {message ? <p className="message">{message}</p> : null}
    </section>
  );
}

function RecordList({ empty, onOpen, records }: { empty: string; onOpen?: (recordId: string) => void; records: ProofRecord[] }) {
  if (!records.length) return <article className="panel empty"><p>{empty}</p></article>;
  return (
    <div className="list">
      {records.map((record) => (
        <button className="record-row" key={record.recordId} onClick={() => onOpen?.(record.recordId)} type="button">
          <div>
            <strong>{record.vehicleBarcode}</strong>
            <span>{record.date} / {record.hubCode} / {record.responsibleEmployeeCode} {record.responsibleName}</span>
          </div>
          <StatusBadge tone={record.status === 'SYNCED' ? 'good' : record.status === 'SYNC_FAILED' ? 'bad' : 'warn'}>{statusText(record.status)}</StatusBadge>
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <article className="stat"><strong>{value}</strong><span>{label}</span></article>;
}

function StatusBadge({ children, tone }: { children: ReactNode; tone: 'good' | 'warn' | 'bad' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function BottomNav({ children }: { children: ReactNode }) {
  return <nav className="bottom-nav">{children}</nav>;
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return <button className={active ? 'nav active' : 'nav'} onClick={onClick} type="button">{icon}<span>{label}</span></button>;
}
