import PlaceholderPage from '../components/PlaceholderPage';

export default function LoginPage() {
  return (
    <PlaceholderPage
      route="login"

      sample={
        <p className="muted-note">ตัวอย่าง Login ภายหลังจะเชื่อม Supabase Auth / role access</p>
      }
    />
  );
}
