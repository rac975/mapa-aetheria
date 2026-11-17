import { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlus, FaEye, FaEyeSlash, FaChevronDown, FaChevronUp, FaClock } from 'react-icons/fa';
import { Badge, Button } from '../ui';
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
  const [mostrarFormCriacao, setMostrarFormCriacao] = useState(false);

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
    if (!isDown.current) return;
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
      setMostrarFormCriacao(false);
    }
  };

  const atualizarRelogio = async (id, novasFatias) => {
    setRelogios((prev) => prev.map((r) => (r.id === id ? { ...r, fatias_atuais: novasFatias } : r)));
    await combatService.atualizarRelogio(id, { fatias_atuais: novasFatias });
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
    <section className={`${styles.clockBarContainer} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.clockBarTop}>
        <div
          className={styles.brandCluster}
          onClick={() => setIsCollapsed((prev) => !prev)}
          title={isCollapsed ? 'Expandir barra de relógios' : 'Recolher barra de relógios'}
        >
          <FaClock className={styles.clockIcon} />
          <h2 className={styles.barTitle}>Relógios</h2>
          <Badge variant="gold" size="sm">{relogiosExibidos.length}</Badge>
        </div>

        {!isCollapsed ? (
          <div
            ref={sliderRef}
            className={styles.clocksStripWrapper}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUpOrCancel}
            onPointerCancel={handlePointerUpOrCancel}
            onPointerMove={handlePointerMove}
            onClickCapture={handleClickCapture}
          >
            <div className={styles.clocksHorizontalStrip}>
              {relogiosExibidos.length === 0 ? (
                <span className={styles.emptyInlineText}>Nenhum relógio de perigo ativo na cena.</span>
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
        ) : (
          <div className={styles.collapsedSummaryStrip} onClick={() => setIsCollapsed(false)}>
            {relogiosExibidos.length === 0 ? (
              <span className={styles.emptyInlineText}>Sem relógios ativos</span>
            ) : (
              relogiosExibidos.map((r) => (
                <span key={r.id} className={styles.miniSummaryChip}>
                  {r.titulo}: <strong>{r.fatias_atuais}/{r.fatias_total}</strong>
                </span>
              ))
            )}
          </div>
        )}

        <div className={styles.barActions}>
          {isMestre && (
            <Button
              type="button"
              variant={mostrarFormCriacao ? 'core' : 'ghost'}
              size="sm"
              onClick={() => {
                setMostrarFormCriacao((v) => !v);
                if (isCollapsed) setIsCollapsed(false);
              }}
              title="Criar novo relógio de perigo ou evento"
            >
              <FaPlus /> <span className={styles.btnLabelDesktop}>Novo</span>
            </Button>
          )}
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={() => setIsCollapsed((prev) => !prev)}
            title={isCollapsed ? 'Expandir relógios' : 'Minimizar relógios'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
          </button>
        </div>
      </div>

      {isMestre && mostrarFormCriacao && !isCollapsed && (
        <form onSubmit={criarRelogio} className={styles.formCreateClock}>
          <div className={styles.formMainRow}>
            <input
              type="text"
              placeholder="Nome do Perigo (ex: Ritual Arcano, Colapso da Ruína)"
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

            <Button type="submit" variant="primary" size="sm">
              <FaPlus /> Criar
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
