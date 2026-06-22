import { pages } from '../data/pages';
import type { AppRoute } from '../types';
import PrimaryButton from './PrimaryButton';
import StatusBadge from './StatusBadge';

interface PlaceholderPageProps {
  route: AppRoute;
  sample?: React.ReactNode;
}

export default function PlaceholderPage({ route, sample }: PlaceholderPageProps) {
  const page = pages.find((item) => item.route === route);
  const Icon = page?.icon;

  return (
    <div className="placeholder-grid">
      <article className="feature-card primary-card">
        <div className="card-heading-row">
          <div className="large-icon">{Icon ? <Icon size={30} /> : null}</div>
          <div>
            <StatusBadge label="Placeholder" tone="warning" />
            <h2>{page?.title}</h2>
          </div>
        </div>
        <p>{page?.description}</p>
        <div className="next-box">
          <strong>งานถัดไป:</strong>
          <span>{page?.nextMvp}</span>
        </div>
        <p className="muted-note">
          หน้านี้ยังไม่ใช่ฟีเจอร์ทำงานจริง เพื่อป้องกัน fake success ใน MVP-001
        </p>
      </article>

      <article className="feature-card">
        <h3>กติกาหลักของระบบ</h3>
        <ul className="check-list">
          <li>ไม่ต้องรู้จำนวนรถล่วงหน้า</li>
          <li>สร้างรายการรถจากการสแกนจริงหน้างาน</li>
          <li>Android WebView ใช้สำหรับ Auto ใส่เบอร์หน้า Flash ใน MVP หลัง</li>
          <li>Backup ต้องออก workbook.xlsx แบบชีท 21.6 และลิงก์รูปตรงคัน</li>
        </ul>
      </article>

      {sample ? <article className="feature-card wide-card">{sample}</article> : null}

      <article className="feature-card action-card">
        <h3>ปุ่มตัวอย่าง</h3>
        <PrimaryButton>ปุ่มหลัก</PrimaryButton>
        <PrimaryButton variant="secondary">ปุ่มรอง</PrimaryButton>
      </article>
    </div>
  );
}
