import PlaceholderPage from '../components/PlaceholderPage';

export default function ScanPreviewPage() {
  return (
    <PlaceholderPage
      route="scan-preview"

      sample={
        <p className="muted-note">Preview จะให้แก้ barcode / phone ก่อนค้นหา Flash</p>
      }
    />
  );
}
