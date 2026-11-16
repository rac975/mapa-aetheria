import { FaHeart, FaMagic, FaPlus, FaMinus } from 'react-icons/fa';

export default function FichaRecursos({ ficha, statusFicha, handleAjustarRecurso }) {
  if (!ficha) return null;

  // Garante que puxa o teto real calculado pelo statusPersonagem, com fallbacks seguros baseados na ficha
  const hpMaxCalculado = statusFicha?.pvMax || ficha.hp_max || ficha.pv_max || 30;
  const mpMaxCalculado = statusFicha?.mpMax || ficha.mp_max || ficha.pm_max || 30;

  // Garante que o valor atual respeite os limites de 0 até o máximo calculado
  const hpAtualSeguro = Math.min(Math.max(ficha.hp_atual ?? hpMaxCalculado, 0), hpMaxCalculado);
  const mpAtualSeguro = Math.min(Math.max(ficha.mp_atual ?? mpMaxCalculado, 0), mpMaxCalculado);

  return (
    <div className="recursos-quick-bar">
      <div className="quick-card hp">
        <div className="card-title">
          <FaHeart/> HP Atual / Máximo 
          <span className="badge-crise" style={{ display: hpAtualSeguro <= hpMaxCalculado / 2 ? 'block' : 'none' }}>
            crise
          </span>
        </div>
        <div className="card-controls">
          <button type="button" onClick={() => handleAjustarRecurso('hp_atual', -1)}><FaMinus /></button>
          <span className="valor">{hpAtualSeguro} / {hpMaxCalculado}</span>
          <button type="button" onClick={() => handleAjustarRecurso('hp_atual', 1)}><FaPlus /></button>
        </div>
      </div>

      <div className="quick-card mp">
        <div className="card-title">
          <FaMagic /> MP ({mpAtualSeguro} / {mpMaxCalculado})
        </div>
        <div className="card-controls">
          <button type="button" onClick={() => handleAjustarRecurso('mp_atual', -1)}><FaMinus /></button>
          <span className="valor">{mpAtualSeguro} / {mpMaxCalculado}</span>
          <button type="button" onClick={() => handleAjustarRecurso('mp_atual', 1)}><FaPlus /></button>
        </div>
      </div>
    </div>
  );
}