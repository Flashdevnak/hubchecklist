import PlaceholderPage from '../components/PlaceholderPage';

export default function ExportPage() {
  return (
    <PlaceholderPage
      route="export"

      sample={
        <div>
          <h3>Backup ZIP ที่ต้องได้</h3>
          <pre className="code-block">backup.zip
├─ workbook.xlsx
├─ photos/
├─ flash-screenshots/
└─ backup-manifest.json</pre>
        </div>
      }
    />
  );
}
