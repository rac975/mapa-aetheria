import { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlus, FaEye, FaEyeSlash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { combatService } from '../../services/combatService';
import { useToast } from '../../contexts/ToastContext';
import ClockWidget from '../ClockWidget/ClockWidget';
import styles from './ClockManager.module.css';

export default function ClockManager({ isMestre }) {
  const [relogios, setRelogios] = useState([]);
  const [tituloRelogio, setTituloRelogio] = useState('');
  const [fatiasTotal, setFatiasTotal] = useState(4);
  const [visivel, setVisivel] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { coldDelete } = useToast();

  const sliderRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDragged = useRef(false);

  const carregarRelogios = useCallback(async () => {
    const { data, error } = await combatService.getRelogios();
    if (!error && data) {
      setRelogios(data);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    async function fetchRelogios() {
      const { data, error } = await combatService.getRelogios();
      if (ativo && !error && data) {
        setRelogios(data);
      }
    }

    fetchRelogios();
    const subscription = combatService.subscribeRelogios(carregarRelogios);
    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, [carregarRelogios]);

  const handlePointerDown = (e) => {
    if (window.innerWidth > 800) return;
    if (e.target.closest('button, [data-clock-slice="true"]')) return;

    const slider = sliderRef.current;
    if (!slider) return;

    isDown.current = true;
    hasDragged.current = false;
    startX.current = e.clientX;
    scrollLeft.current = slider.scrollLeft;
  };

  const handlePointerUpOrCancel = (e) => {
    if (!isDown.current) return;
    isDown.current = false;
    const slider = sliderRef.current;
    if (slider && slider.hasPointerCapture(e.pointerId)) {
      slider.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDown.current || window.innerWidth > 800) return;
    const slider = sliderRef.current;
    if (!slider) return;

    const deltaX = e.clientX - startX.current;
    if (Math.abs(deltaX) > 6 && !hasDragged.current) {
      hasDragged.current = true;
      slider.setPointerCapture(e.pointerId);
    }
    if (hasDragged.current) {
      slider.scrollLeft = scrollLeft.current - deltaX * 1.4;
    }
  };

  const handleClickCapture = (e) => {
    if (hasDragged.current) {
      e.stopPropagation();
      hasDragged.current = false;
    }
  };

  const criarRelogio = async (e) => {
    e.preventDefault();
    if (!tituloRelogio.trim()) return;

    const { data, error } = await combatService.criarRelogio({
      titulo: tituloRelogio.trim(),
      fatias_total: Number(fatiasTotal),
      fatias_atuais: 0,
      visivel
    });

    if (!error && data?.[0]) {
      setRelogios((prev) => [...prev, data[0]]);
      setTituloRelogio('');
    }
  };

  const atualizarRelogio = async (id, novasFatias) => {
    const { error } = await combatService.atualizarRelogio(id, { fatias_atuais: novasFatias });
    if (!error) {
      setRelogios((prev) => prev.map((r) => (r.id === id ? { ...r, fatias_atuais: novasFatias } : r)));
    }
  };

  const iniciarExclusao = (r) => {
    if (!isMestre) return;

    coldDelete({
      item: r,
      message: <>Relógio <strong>{r.titulo}</strong> foi removido.</>,
      onRemove: (it) => {
        setRelogios((prev) => prev.filter((item) => item.id !== it.id));
      },
      onCommit: async (it) => {
        try {
          await combatService.excluirRelogio(it.id);
        } catch (err) {
          console.error('Erro ao deletar relógio:', err);
        }
      },
      onRollback: (it) => {
        setRelogios((prev) => [...prev, it]);
      },
      duration: 6000
    });
  };

  const relogiosExibidos = relogios.filter((r) => isMestre || r.visivel);

  return (
    <section className={`${styles.combatBox} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.boxHeader} onClick={() => setIsCollapsed((prev) => !prev)}>
        <h2 className={styles.boxTitle}>Relógios de Perigo & Eventos</h2>
        <button
          type="button"
          className={styles.collapseBtn}
          title={isCollapsed ? 'Expandir' : 'Retrair'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
        </button>
      </div>

      <div className={styles.combatContentBody}>
        <p className={styles.boxHint}>
          {isMestre
            ? 'Crie e controle a progressão de perigos e eventos na cena.'
            : 'Acompanhe os relógios ativos na aventura.'}
        </p>

        {isMestre && (
          <form onSubmit={criarRelogio} className={styles.formCreateClock}>
            <div className={styles.formMainRow}>
              <input
                type="text"
                placeholder="Nome do Perigo (ex: Ritual Arcano)"
                value={tituloRelogio}
                onChange={(e) => setTituloRelogio(e.target.value)}
                required
              />
              <select value={fatiasTotal} onChange={(e) => setFatiasTotal(Number(e.target.value))}>
                <option value={4}>4 Fatias (Simples)</option>
                <option value={6}>6 Fatias (Médio)</option>
                <option value={8}>8 Fatias (Complexo)</option>
                <option value={12}>12 Fatias (Épico)</option>
              </select>

              <button
                type="button"
                className={`${styles.visibilityToggleBtn} ${visivel ? styles.isVisible : ''}`}
                onClick={() => setVisivel((prev) => !prev)}
                title={visivel ? 'Visível para os jogadores' : 'Oculto dos jogadores'}
              >
                {visivel ? <FaEye /> : <FaEyeSlash />}
                <span>{visivel ? 'Visível' : 'Oculto'}</span>
              </button>

              <button type="submit" className={styles.btnSubmitClock}>
                <FaPlus /> Adicionar Relógio
              </button>
            </div>
          </form>
        )}

        <div
          ref={sliderRef}
          className={styles.clocksContainerWrapper}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          onPointerMove={handlePointerMove}
          onClickCapture={handleClickCapture}
        >
          <div className={styles.clocksGrid}>
            {relogiosExibidos.length === 0 ? (
              <p className={styles.emptyText}>Nenhum relógio ativo na cena.</p>
            ) : (
              relogiosExibidos.map((r) => (
                <ClockWidget
                  key={r.id}
                  titulo={r.titulo}
                  fatiasTotal={r.fatias_total}
                  fatiasAtuais={r.fatias_atuais}
                  visivel={r.visivel}
                  isMestre={isMestre}
                  onUpdate={(val) => atualizarRelogio(r.id, val)}
                  onDelete={() => iniciarExclusao(r)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
