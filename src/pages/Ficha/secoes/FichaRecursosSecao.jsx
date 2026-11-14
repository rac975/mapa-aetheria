import { FaHeart, FaMagic, FaPlus, FaMinus } from 'react-icons/fa';

export default function FichaRecursos({ ficha, statusFicha, handleAjustarRecurso }) {
  if (!ficha || !statusFicha) return null;

  // Usa os valores calculados automaticamente pelo sistema de regras
  const hpMaxCalculado = statusFicha.pvMax;
  const mpMaxCalculado = statusFicha.mpMax;

  return (
    <div className="recursos-quick-bar">
      <div className="quick-card hp">
        <div className="card-title">
          <FaHeart/> HP Atual / Máximo 
          <span className="badge-crise" style={{ display: Math.round(ficha.hp_atual < hpMaxCalculado / 2) ? 'block' : 'none' }}>
            crise
          </span>
        </div>
        <div className="card-controls">
          <button type="button" onClick={() => handleAjustarRecurso('hp_atual', -1)}><FaMinus /></button>
          <span className="valor">{ficha.hp_atual || 0} / {hpMaxCalculado}</span>
          <button type="button" onClick={() => handleAjustarRecurso('hp_atual', 1)}><FaPlus /></button>
        </div>
      </div>

      <div className="quick-card mp">
        <div className="card-title">
          <FaMagic /> MP ({ficha.mp_atual} / {mpMaxCalculado})
        </div>
        <div className="card-controls">
          <button type="button" onClick={() => handleAjustarRecurso('mp_atual', -1)}><FaMinus /></button>
          <span className="valor">{ficha.mp_atual} / {mpMaxCalculado}</span>
          <button type="button" onClick={() => handleAjustarRecurso('mp_atual', 1)}><FaPlus /></button>
        </div>
      </div>
    </div>
  );
}