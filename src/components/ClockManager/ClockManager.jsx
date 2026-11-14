import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { FaPlus, FaEye, FaEyeSlash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ClockWidget from '../ClockWidget/ClockWidget';
import UndoToast from '../UndoToast/UndoToast';
import './ClockManager.css';

export default function ClocksManager({ isMestre }) {
  const [relogios, setRelogios] = useState([]);
  const [tituloRelogio, setTituloRelogio] = useState('');
  const [fatiasTotal, setFatiasTotal] = useState(4);
  const [visivel, setVisivel] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Estados de Delete Frio
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [progressoKey, setProgressoKey] = useState(0);

  // Refs para o Drag-to-Scroll (Mobile)
  const sliderRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDragged = useRef(false);

  useEffect(() => {
    async function fetchRelogios() {
      const { data, error } = await supabase.from('relogios').select('*');
      if (!error && data) setRelogios(data);
    }
    fetchRelogios();
  }, []);

  // =====================================================
  // LÓGICA DE DRAG-TO-SCROLL (MOUSE E TOQUE <= 800px)
  // =====================================================
  const handlePointerDown = (e) => {
    const slider = sliderRef.current;

    if (!slider) return;

    isDown.current = true;
    hasDragged.current = false;

    startX.current = e.clientX;
    scrollLeft.current = slider.scrollLeft;

    slider.setPointerCapture(e.pointerId);
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
    if (!isDown.current || window.innerWidth > 800)
      return;

    const slider = sliderRef.current;

    if (!slider) return;

    const walk =
      (e.clientX - startX.current) * 1.5;

    slider.scrollLeft =
      scrollLeft.current - walk;
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

    const { data, error } = await supabase.from('relogios').insert([{
      titulo: tituloRelogio.trim(),
      fatias_total: Number(fatiasTotal),
      fatias_atuais: 0,
      visivel: visivel
    }]).select();

    if (!error && data) {
      setRelogios(prev => [...prev, data[0]]);
      setTituloRelogio('');
    }
  };

  const atualizarRelogio = async (id, novasFatias) => {
    const { error } = await supabase.from('relogios').update({ fatias_atuais: novasFatias }).eq('id', id);
    if (!error) {
      setRelogios(prev => prev.map(r => r.id === id ? { ...r, fatias_atuais: novasFatias } : r));
    }
  };

  const iniciarExclusao = (r) => {
    if (!isMestre) return;
    if (timeoutId) clearTimeout(timeoutId);

    setRelogios(prev => prev.filter(item => item.id !== r.id));
    setItemParaExcluir(r);
    setMostrarToast(true);
    setProgressoKey(prev => prev + 1);

    const timer = setTimeout(async () => {
      await supabase.from('relogios').delete().eq('id', r.id);
      setMostrarToast(false);
      setItemParaExcluir(null);
    }, 6000);

    setTimeoutId(timer);
  };

  const desfazerExclusao = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (itemParaExcluir) {
      setRelogios(prev => [...prev, itemParaExcluir]);
    }
    setMostrarToast(false);
    setItemParaExcluir(null);
  };

  return (
    <div className={`combat-box ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="box-header" onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer' }}>
        <h2>Relógios de Perigo & Eventos</h2>
        <button className="collapse-btn" title={isCollapsed ? "Expandir" : "Retrair"}>
          {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
        </button>
      </div>

      <div className="combat-content-body">
        <p className="box-hint">
          {isMestre ? "Crie e controle a progressão de perigos e eventos na cena." : "Acompanhe os relógios ativos na aventura."}
        </p>

        {isMestre && (
          <form onSubmit={criarRelogio} className="form-create-clock">
            <div className="form-main-row">
              <input
                type="text"
                placeholder="Nome do Perigo (ex: Ritual Arcano)"
                value={tituloRelogio}
                onChange={(e) => setTituloRelogio(e.target.value)}
                required
              />
              <select value={fatiasTotal} onChange={(e) => setFatiasTotal(e.target.value)}>
                <option value={4}>4 Fatias (Simples)</option>
                <option value={6}>6 Fatias (Médio)</option>
                <option value={8}>8 Fatias (Complexo)</option>
                <option value={12}>12 Fatias (Épico)</option>
              </select>

              <button
                type="button"
                className={`visibility-toggle-btn ${visivel ? 'is-visible' : ''}`}
                onClick={() => setVisivel(!visivel)}
                title={visivel ? "Visível para os jogadores" : "Oculto dos jogadores"}
              >
                {visivel ? <FaEye /> : <FaEyeSlash />}
                <span>{visivel ? "Visível" : "Oculto"}</span>
              </button>

              <button type="submit" className="btn-submit-clock">
                <FaPlus /> Adicionar Relógio
              </button>
            </div>
          </form>
        )}

        <div
          ref={sliderRef}
          className="clocks-container-wrapper"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          onPointerMove={handlePointerMove}
          onClickCapture={handleClickCapture}
        >
          <div className="clocks-grid">
            {relogios.length === 0 ? (
              <p className="empty-text">Nenhum relógio ativo na cena.</p>
            ) : (
              relogios.map(r => {
                if (!isMestre && !r.visivel) return null;
                return (
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
                );
              })
            )}
          </div>
        </div>
      </div>

      <UndoToast
        mostrar={mostrarToast}
        mensagem={<>Relógio <strong>{itemParaExcluir?.titulo}</strong> foi removido.</>}
        progressoKey={progressoKey}
        onUndo={desfazerExclusao}
      />
    </div>
  );
}
