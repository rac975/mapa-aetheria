import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import ClockWidget from '../ClockWidget/ClockWidget';
import './ClockManager.css';

export default function ClocksManager({ isMestre }) {
  const [relogios, setRelogios] = useState([]);
  const [tituloRelogio, setTituloRelogio] = useState('');
  const [fatiasTotal, setFatiasTotal] = useState(4);
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    async function fetchRelogios() {
      const { data, error } = await supabase.from('relogios').select('*');
      if (!error && data) setRelogios(data);
    }
    fetchRelogios();
  }, []);

  const criarRelogio = async (e) => {
    e.preventDefault();
    if (!tituloRelogio.trim()) return;

    const { data, error } = await supabase.from('relogios').insert([{
      titulo: tituloRelogio,
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

  const deletarRelogio = async (id) => {
    const { error } = await supabase.from('relogios').delete().eq('id', id);
    if (!error) {
      setRelogios(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="combat-box">
      <div className="box-header">
        <h2>Relógios de Perigo & Eventos</h2>
      </div>

      {isMestre && (
        <form onSubmit={criarRelogio} className="form-create-clock">
          <input 
            type="text" 
            placeholder="Nome do Perigo (ex: Ritual Arcano)" 
            value={tituloRelogio} 
            onChange={(e) => setTituloRelogio(e.target.value)} 
            required
          />
          <div className="form-row-inline">
            <select value={fatiasTotal} onChange={(e) => setFatiasTotal(e.target.value)}>
              <option value={4}>4 Fatias (Simples)</option>
              <option value={6}>6 Fatias (Médio)</option>
              <option value={8}>8 Fatias (Complexo)</option>
              <option value={12}>12 Fatias (Épico)</option>
            </select>
            <label className="checkbox-label">
              <input type="checkbox" checked={visivel} onChange={(e) => setVisivel(e.target.checked)} />
              Visível
            </label>
          </div>
          <button type="submit">Criar Relógio</button>
        </form>
      )}

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
                onDelete={() => deletarRelogio(r.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}