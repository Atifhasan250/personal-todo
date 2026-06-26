import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container" style={{ maxWidth: '500px', margin: 'auto', textAlign: 'center', padding: '50px 30px' }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '10px' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px', lineHeight: '1.6' }}>
        Oops! The page you are looking for doesn't exist or has been moved.
      </p>
      
      <Link href="/">
        <button className="btn-primary" style={{ width: '100%', maxWidth: '200px' }}>
          Back to Tasks
        </button>
      </Link>
    </div>
  );
}
