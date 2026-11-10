import { FaLink } from 'react-icons/fa';

export default function FichaLacosSecao({ lacos }) {
  return (
    <section className="ficha-card-section">
      <h3><FaLink /> Laços ({(lacos || []).length}/6)</h3>
      {(lacos || []).length === 0 ? <p>Nenhum laço registrado.</p> : (lacos || []).map((l, i) => {
        const emocoes = l.emocoes || [];
        const forca = emocoes.length;
        return (
          <div key={i} className="traco-row" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{l.nome || 'Laço sem nome'}</strong>
              <span style={{ color: '#d4af37', fontWeight: 'bold' }}>Força: {forca}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#9da3af', marginTop: '2px' }}>
              {emocoes.length > 0 ? emocoes.join(', ') : 'Nenhuma emoção definida'}
            </div>
          </div>
        );
      })}
    </section>
  );
}