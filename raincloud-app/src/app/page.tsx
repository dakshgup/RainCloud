import Calculator from '../components/Calculator';

export default function Home() {
  return (
    <div>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '20px', 
        fontSize: '2rem',
        fontWeight: '300',
        color: 'var(--foreground)'
      }}>
        RainCloud Calculator
      </h1>
      <Calculator />
    </div>
  );
}
