export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div 
        className="w-12 h-12 border-4 rounded-full animate-spin" 
        style={{ 
          borderColor: 'var(--surface)', 
          borderTopColor: 'var(--primary)' 
        }}
      ></div>
    </div>
  );
}
