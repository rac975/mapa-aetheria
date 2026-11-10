import { FaShieldAlt } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';

export default function FichaAtributos({ ficha }) {
  if (!ficha) return null;
  return (
    <>
      <section className="ficha-card-section">
        <h3><FaShieldAlt /> Atributos, EXP e Pontos de Fábula</h3>
        <div className="atributos-mobile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
          <div className="atrib-box"><span>DES</span><strong>d{ficha.destreza || 8}</strong></div>
          <div className="atrib-box"><span>INS</span><strong>d{ficha.intuicao || 8}</strong></div>
          <div className="atrib-box"><span>VIG</span><strong>d{ficha.vigor || 8}</strong></div>
          <div className="atrib-box"><span>VON</span><strong>d{ficha.vontade || 8}</strong></div>
        </div>
        <div className="traco-row" style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '10px' }}>
          <span><strong>Defesa:</strong> {ficha.defesa || 10}</span>
          <span><strong>M. Defesa:</strong> {ficha.mdef || 10}</span>
          <span><strong>Iniciativa:</strong> {ficha.iniciativa || 0}</span>
          <span><strong>EXP:</strong> {ficha.exp || 0} / 10</span>
          <span><strong>Pontos de Fábula:</strong> {ficha.fabula || 3}</span>
        </div>
      </section>

      {/* Peculiaridade Exibição */}
      {ficha.titulo_pecularidade && (
        <section className="ficha-card-section peculiaridade-card">
          <h3><LuSparkles /> Peculiaridade: {ficha.titulo_pecularidade}</h3>
          <p style={{ margin: '6px 0 0 0', color: '#9da3af', fontSize: '0.95rem' }}>
            {ficha.descricao_peculiaridade || 'Nenhuma descrição registrada.'}
          </p>
        </section>
      )}
    </>
  );
}