import PlaceholderPage from '../components/PlaceholderPage';

export default function ResponsibleProfilePage() {
  return (
    <PlaceholderPage
      route="responsible-profile"

      sample={
        <div>
          <h3>ตัวอย่างข้อมูลที่จะบันทึก</h3>
          <div className="data-preview">
            <span>รหัสพนักงาน</span><strong>25845</strong>
            <span>ชื่อแสดงผล</span><strong>Tui</strong>
            <span>สาขา</span><strong>BNAK</strong>
          </div>
        </div>
      }
    />
  );
}
