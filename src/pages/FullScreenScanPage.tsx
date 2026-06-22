import PlaceholderPage from '../components/PlaceholderPage';

export default function FullScreenScanPage() {
  return (
    <PlaceholderPage
      route="scan"

      sample={
        <div>
          <h3>ตัวอย่าง QR URL</h3>
          <code className="code-block">https://api.flashexpress.com/gw/nws/web/proof/go/NAK1R7XJ45</code>
          <p className="muted-note">MVP ถัดไปต้อง extract barcode = NAK1R7XJ45</p>
        </div>
      }
    />
  );
}
