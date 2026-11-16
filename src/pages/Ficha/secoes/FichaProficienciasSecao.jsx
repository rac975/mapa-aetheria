import { FaShieldAlt, FaCheckCircle } from 'react-icons/fa';

export default function FichaProficienciasSecao({ classes }) {
  if (!classes || classes.length === 0) return null;

  // Extrai e consolida todas as proficiências listadas nos benefícios das classes
  const proficienciasList = classes
    .map(c => c.beneficios)
    .filter(Boolean);

  if (proficienciasList.length === 0) return null;

  return (
    <section className="ficha-card-section" style={{ marginBottom: '20px' }}>
      <h3><FaShieldAlt /> Proficiências & Equipamentos Permitidos</h3>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
        {proficienciasList.map((beneficio, index) => (
          <div 
            key={index} 
            style={{ 
              background: '#161b22', 
              border: '1px solid #30363d', 
              borderRadius: '6px', 
              padding: '8px 12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '0.85rem',
              color: '#3fb950'
            }}
          >
            <FaCheckCircle size={14} style={{ color: '#3fb950', flexShrink: 0 }} />
            <span>{beneficio}</span>
          </div>
        ))}
      </div>
    </section>
  );
}