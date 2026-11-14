import { FaScroll } from 'react-icons/fa';

export default function FichaClassesSecao({ classes }) {
  if (!classes) return null;
  return (
    <section className="ficha-card-section">
      <h3><FaScroll /> Classes e Habilidades</h3>
      {classes.length === 0 ? <p>Nenhuma classe cadastrada.</p> : classes.map((c, i) => (
        <div key={i} className="traco-row" style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #30363d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d4af37', fontWeight: 'bold' }}>
            <span>{c.nome_classe} (Nv. {c.nivel})</span>
          </div>
          {c.beneficios && <div style={{ fontSize: '0.9rem', color: '#c9d1d9', marginTop: '2px' }}>Benefícios: {c.beneficios}</div>}

          {(c.habilidades || []).length > 0 && (
            <div style={{ marginTop: '6px', paddingLeft: '10px', borderLeft: '2px solid #d4af37' }}>
              {c.habilidades.map((h, hIdx) => (
                <div key={hIdx} style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                  <strong>{h.nome} (Nv. {h.nivel}):</strong> <span style={{ color: '#9da3af' }}>{h.descricao}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}