import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <SignIn routing="hash" signUpUrl="/signup" />
    </div>
  );
}
