import { FaMagic } from 'react-icons/fa';

export default function FichaMagiasSecao({ magias }) {
  if (!magias || magias.length === 0) return null;

  return (
    <section className="ficha-card-section">
      <h3><FaMagic /> Magias</h3>
      {magias.map((m, i) => (
        <div key={i} className="traco-row" style={{ marginBottom: '8px' }}>
          <strong>{m.nome}</strong> (MP: {m.custo_mp} | Alvos: {m.alvos} | Duração: {m.duracao})
          {m.descricao && <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#9da3af' }}>{m.descricao}</p>}
        </div>
      ))}
    </section>
  );
}