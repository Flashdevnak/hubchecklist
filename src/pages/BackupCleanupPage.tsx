import PlaceholderPage from '../components/PlaceholderPage';

export default function BackupCleanupPage() {
  return (
    <PlaceholderPage
      route="backup-cleanup"

      sample={
        <p className="muted-note">Cleanup ต้องถูกบล็อกถ้า backup ยังไม่สำเร็จ</p>
      }
    />
  );
}
