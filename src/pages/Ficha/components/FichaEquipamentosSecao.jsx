import { FaShieldVirus } from 'react-icons/fa';

export default function FichaEquipamentosSecao({ equipamentos }) {
  if (!equipamentos || equipamentos.length === 0) return null;

  return (
    <section className="ficha-card-section">
      <h3><FaShieldVirus /> Equipamentos</h3>
      {equipamentos.map((eq, i) => (
        <div key={i} className="traco-row" style={{ marginBottom: '8px' }}>
          <strong>{eq.nome}</strong>
          {eq.descricao && <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#9da3af' }}>{eq.descricao}</p>}
        </div>
      ))}
    </section>
  );
}