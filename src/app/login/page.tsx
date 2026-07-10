import { SignIn, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <ClerkLoading>
        <div className="clerk-spinner"></div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn 
          routing="hash" 
          signUpUrl="/signup" 
          appearance={{ 
            variables: {
              colorBackground: '#1f1f1f',
              colorForeground: '#eeeeee',
              colorPrimary: '#de4c4a',
              colorMutedForeground: '#808080'
            },
            elements: { 
              formButtonPrimary: { backgroundColor: 'var(--primary)', '&:hover': { backgroundColor: 'var(--primary-hover)' } },
              socialButtonsBlockButton: { border: '1px solid #333' },
              socialButtonsBlockButtonText: { color: '#eeeeee' }
            } 
          }} 
        />
      </ClerkLoaded>
    </div>
  );
}
