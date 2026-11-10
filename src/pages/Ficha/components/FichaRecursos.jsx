import { FaHeart, FaMagic, FaBoxOpen, FaPlus, FaMinus } from 'react-icons/fa';

export default function FichaRecursos({ ficha, handleAjustarRecurso }) {
  if (!ficha) return null;
  return (
    <div className="recursos-quick-bar">
      <div className="quick-card hp">
        <div className="card-title">HP Atual / Máximo</div>
        <div className="card-controls">
          <button onClick={() => handleAjustarRecurso('hp_atual', -1)}>-</button>
          <span className="valor">{ficha.hp_atual || 0} / {ficha.hp_max || 0}</span>
          <button onClick={() => handleAjustarRecurso('hp_atual', 1)}>+</button>
        </div>
      </div>

      <div className="quick-card mp">
        <div className="card-title"><FaMagic /> MP ({ficha.mp_atual} / {ficha.mp_max})</div>
        <div className="card-controls">
          <button type="button" onClick={() => handleAjustarRecurso('mp_atual', -1)}><FaMinus /></button>
          <span className="valor">{ficha.mp_atual} / {ficha.mp_max}</span>
          <button type="button" onClick={() => handleAjustarRecurso('mp_atual', 1)}><FaPlus /></button>
        </div>
      </div>

      <div className="quick-card ip">
        <div className="card-title"><FaBoxOpen /> IP ({ficha.ip_atual} / {ficha.ip_max})</div>
        <div className="card-controls">
          <button type="button" onClick={() => handleAjustarRecurso('ip_atual', -1)}><FaMinus /></button>
          <span className="valor">{ficha.ip_atual} / {ficha.ip_max}</span>
          <button type="button" onClick={() => handleAjustarRecurso('ip_atual', 1)}><FaPlus /></button>
        </div>
      </div>
    </div>
  );
}