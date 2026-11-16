import { useState, useEffect, useCallback } from 'react';
import { FaShieldAlt, FaHandHolding, FaRing, FaTimes, FaExchangeAlt, FaBoxOpen, FaDice, FaBolt, FaSkull } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { rolarAtaqueEDanoArma } from '../../../utils/calculosFicha'; // Ajuste o caminho correto para o seu utils

export default function FichaEquipamentosSecao({ 
  fichaId, 
  atributosAtuais = {}, 
  classes = [], 
  opcoesGolpeAtivo = null, 
  limparGolpeAtivo = null,
  emCriseGlobal = false
}) {
  const [itensInventario, setItensInventario] = useState([]);
  const [modalSlotAberto, setModalSlotAberto] = useState(null);
  const [itemParaEquiparDireto, setItemParaEquiparDireto] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [modoAtaqueState, setModoAtaqueState] = useState({
    mao_dominante: 'normal',
    mao_secundaria: 'normal'
  });

  const [resultadosRolagem, setResultadosRolagem] = useState({});

  const carregarItens = useCallback(async () => {
    if (!fichaId) {
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from('itens_personagem')
      .select('*')
      .eq('ficha_id', fichaId);

    if (error) {
      console.error("❌ Erro ao carregar itens_personagem:", error.message);
    } else {
      setItensInventario(data || []);
    }
    setCarregando(false);
  }, [fichaId]);

  useEffect(() => {
    let ativo = true;

    const sincronizarItens = async () => {
      if (!fichaId) {
        if (ativo) setCarregando(false);
        return;
      }
      await carregarItens();
    };

    sincronizarItens();

    if (!fichaId) return;

    const channel = supabase
      .channel(`realtime_equip_${fichaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'itens_personagem', filter: `ficha_id=eq.${fichaId}` },
        () => {
          carregarItens();
        }
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(channel);
    };
  }, [fichaId, carregarItens]);

  const getItemNoSlot = (slotName) => {
    return itensInventario.find(i => i.stats_personalizados?.slot === slotName);
  };

  const itensMochila = itensInventario.filter(i => !i.stats_personalizados?.slot);

  const desequiparItem = async (item) => {
    const novosStats = { ...(item.stats_personalizados || {}) };
    delete novosStats.slot;

    const { error } = await supabase
      .from('itens_personagem')
      .update({
        equipado: false,
        stats_personalizados: novosStats
      })
      .eq('id', item.id);

    if (!error) carregarItens();
  };

  const equiparItemNoSlot = async (item, slotAlvo) => {
    const tipoItem = (item.tipo || '').toLowerCase();
    const nomeItem = (item.nome || '').toLowerCase();
    const ehEscudo = tipoItem.includes('escudo');

    if ((slotAlvo === 'mao_dominante' || slotAlvo === 'mao_secundaria') && (tipoItem.includes('armadura') || tipoItem.includes('acessorio'))) {
      alert("Este item não pode ser empunhado nas mãos!");
      return;
    }
    if (slotAlvo === 'armadura' && !tipoItem.includes('armadura')) {
      alert("Apenas armaduras podem ser vestidas neste slot!");
      return;
    }
    if (slotAlvo === 'acessorio' && !tipoItem.includes('acessorio')) {
      alert("Apenas acessórios podem ser equipados neste slot!");
      return;
    }

    const ehMarcialOuPesado = tipoItem.includes('marcial') ||
      tipoItem.includes('pesada') ||
      tipoItem.includes('escudo') ||
      nomeItem.includes('nodachi') ||
      nomeItem.includes('martelo de guerra');

    const temDuploEscudeiro = classes.some(c =>
      (c.habilidades || []).some(h =>
        (h.nome || '').toLowerCase().includes('duplo escudeiro') && (parseInt(h.nivel) || 0) > 0
      )
    );

    if (slotAlvo === 'mao_dominante') {
      if (tipoItem.includes('armadura') || tipoItem.includes('acessorio')) {
        alert("Este item não pode ser empunhado nas mãos!");
        return;
      }
      if (ehEscudo && !temDuploEscudeiro) {
        alert("⛔ Apenas personagens com a habilidade 'Duplo Escudeiro' podem equipar escudos na mão dominante!");
        return;
      }
    }

    if (ehMarcialOuPesado) {
      const temProficiencia = classes.some(c => {
        const ben = (c.beneficios || '').toLowerCase();
        return ben.includes('marcial') ||
          ben.includes('pesada') ||
          ben.includes('escudos') ||
          ben.includes('todos') ||
          ben.includes('armas corpo a corpo');
      });

      if (!temProficiencia) {
        alert("⛔ Bloqueado pelas regras de Fabula Ultima: Seu personagem não possui a proficiência necessária nas classes ativas para equipar este tipo de equipamento marcial/pesado!");
        return;
      }
    }

    const itemAtualNoSlot = getItemNoSlot(slotAlvo);
    if (itemAtualNoSlot) {
      await desequiparItem(itemAtualNoSlot);
    }

    const slotParaSalvar = tipoItem.includes('2h') ? 'mao_dominante' : slotAlvo;
    const novosStats = { ...(item.stats_personalizados || {}), slot: slotParaSalvar };

    const { error } = await supabase
      .from('itens_personagem')
      .update({
        equipado: true,
        stats_personalizados: novosStats
      })
      .eq('id', item.id);

    if (!error) {
      if (tipoItem.includes('2h')) {
        const outraMao = getItemNoSlot('mao_secundaria');
        if (outraMao) await desequiparItem(outraMao);
      }
      setModalSlotAberto(null);
      setItemParaEquiparDireto(null);
      carregarItens();
    } else {
      alert("Erro ao equipar item: " + error.message);
    }
  };

  const lidarComCliqueEquipar = (item) => {
    const tipoItem = (item.tipo || '').toLowerCase();
    if (tipoItem.includes('armadura')) {
      equiparItemNoSlot(item, 'armadura');
      return;
    }
    if (tipoItem.includes('acessorio') || tipoItem.includes('acessório')) {
      equiparItemNoSlot(item, 'acessorio');
      return;
    }
    if (tipoItem.includes('escudo')) {
      equiparItemNoSlot(item, 'mao_secundaria');
      return;
    }
    setItemParaEquiparDireto(item);
  };

  const deletarItem = async (itemId) => {
    if (!window.confirm("Deseja realmente descartar este item do inventário?")) return;

    const { error } = await supabase
      .from('itens_personagem')
      .delete()
      .eq('id', itemId);

    if (!error) carregarItens();
  };

  const executarRolagemArma = (itemArma, slotId) => {
    const isMulti = modoAtaqueState[slotId] === 'multi';

    // Delega o cálculo completo (incluindo Adrenalina, Frenesi e Golpe das Sombras) para o utilitário
    const resultadoCalculado = rolarAtaqueEDanoArma(
      itemArma,
      atributosAtuais,
      isMulti,
      classes,
      itensInventario,
      opcoesGolpeAtivo || {},
      emCriseGlobal
    );

    const usandoGolpe = !!(opcoesGolpeAtivo && opcoesGolpeAtivo.usandoGolpeDasSombras);

    setResultadosRolagem(prev => ({
      ...prev,
      [slotId]: {
        ...resultadoCalculado,
        usandoGolpe,
        danoExtraGolpe: resultadoCalculado.danoExtraHabilidade || 0
      }
    }));

    // Consome o golpe ativo após rolar o ataque
    if (usandoGolpe && limparGolpeAtivo) {
      limparGolpeAtivo();
    }
  };

  if (carregando) return <div style={{ color: '#8b949e', padding: '10px' }}>Carregando equipamentos...</div>;

  const slotConfig = [
    { id: 'mao_dominante', label: 'Mão Dominante', icone: <FaHandHolding /> },
    { id: 'mao_secundaria', label: 'Mão Não Dominante / Escudo', icone: <FaHandHolding /> },
    { id: 'armadura', label: 'Armadura', icone: <FaShieldAlt /> },
    { id: 'acessorio', label: 'Acessório', icone: <FaRing /> }
  ];

  return (
    <div>
      <section className="ficha-card-section" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🛡️ Itens Equipados</h3>
          {opcoesGolpeAtivo && (
            <span style={{ fontSize: '0.75rem', background: 'rgba(188, 140, 255, 0.2)', border: '1px solid #bc8cff', color: '#bc8cff', padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FaSkull size={10} /> Golpe das Sombras Armado (Dano de Trevas)
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '12px' }}>
          {slotConfig.map(slot => {
            const itemEquipado = getItemNoSlot(slot.id);
            const tipoItemEquipado = (itemEquipado?.tipo || '').toLowerCase();
            const temDuploEscudeiro = classes.some(c =>
              (c.habilidades || []).some(h =>
                (h.nome || '').toLowerCase().includes('duplo escudeiro') && (parseInt(h.nivel) || 0) > 0
              )
            );
            const ultimaRolagem = resultadosRolagem[slot.id];
            const modoAtual = modoAtaqueState[slot.id] || 'normal';
            const ehArmaOuEscudoAtacavel = slot.id.includes('mao') && itemEquipado && (
              tipoItemEquipado.includes('arma') ||
              (slot.id === 'mao_dominante' && tipoItemEquipado.includes('escudo') && temDuploEscudeiro)
            );

            return (
              <div key={slot.id} style={{ background: '#0d0f18', border: '1px solid #30363d', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {slot.icone} {slot.label}
                  </span>
                </div>

                {itemEquipado ? (
                  <div style={{ background: '#161b22', padding: '10px', borderRadius: '6px', border: '1px solid #21262d', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#f0f6fc', fontSize: '0.95rem' }}>{itemEquipado.nome}</div>
                      <div style={{ fontSize: '0.75rem', color: '#d4af37', textTransform: 'uppercase', marginTop: '2px' }}>{itemEquipado.tipo}</div>
                    </div>

                    {ehArmaOuEscudoAtacavel && (
                      <div style={{ borderTop: '1px solid #30363d', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>

                        <div style={{ display: 'flex', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', padding: '2px' }}>
                          <button
                            type="button"
                            onClick={() => setModoAtaqueState(prev => ({ ...prev, [slot.id]: 'normal' }))}
                            style={{
                              flex: 1, background: modoAtual === 'normal' ? '#21262d' : 'transparent',
                              color: modoAtual === 'normal' ? '#f0f6fc' : '#8b949e', border: 'none',
                              padding: '4px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer'
                            }}
                          >
                            Ataque Único
                          </button>
                          <button
                            type="button"
                            onClick={() => setModoAtaqueState(prev => ({ ...prev, [slot.id]: 'multi' }))}
                            style={{
                              flex: 1, background: modoAtual === 'multi' ? '#da3633' : 'transparent',
                              color: modoAtual === 'multi' ? '#fff' : '#8b949e', border: 'none',
                              padding: '4px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer'
                            }}
                          >
                            Multiataque / 2ª Arma
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => executarRolagemArma(itemEquipado, slot.id)}
                          style={{ background: '#238636', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                        >
                          <FaDice /> Rolar Ataque e Dano
                        </button>

                        {/* 📊 EXIBIÇÃO DETALHADA E DISCRIMINADA DA PRECISÃO E DANO */}
                        {ultimaRolagem && (
                          <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '8px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>

                            {ultimaRolagem.statusCritico && (
                              <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: ultimaRolagem.statusCritico.includes('Sucesso') ? '#3fb950' : '#f85149', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3px' }}>
                                <FaBolt /> {ultimaRolagem.statusCritico}
                              </div>
                            )}

                            <div style={{ fontSize: '0.75rem', color: '#f0f6fc', display: 'flex', justifyContent: 'space-between' }}>
                              <span>Precisão Final:</span>
                              <strong style={{ color: '#d4af37' }}>{ultimaRolagem.testeAtaque}</strong>
                            </div>

                            <div style={{ fontSize: '0.65rem', color: '#8b949e', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '3px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div>🧩 Atributos: {ultimaRolagem.attr1} e {ultimaRolagem.attr2} (Rolados: {ultimaRolagem.res1}, {ultimaRolagem.res2})</div>
                              <div>⚔️ Bônus de Precisão Total: +{ultimaRolagem.bonusPrecisaoTotal}</div>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#bc8cff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '2px', paddingTop: '2px' }}>
                              <span>Dano Final ({ultimaRolagem.usandoGolpe ? 'Trevas 🖤' : 'Normal'}):</span>
                              <strong style={{ fontSize: '0.85rem' }}>{ultimaRolagem.danoTotal}</strong>
                            </div>

                            <div style={{ fontSize: '0.65rem', color: '#8b949e', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '3px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div>Dado Mais Alto: {ultimaRolagem.dadoMaisAlto}</div>
                              {ultimaRolagem.bonusDanoFixo > 0 && <div>Bônus Fixo Total: +{ultimaRolagem.bonusDanoFixo}</div>}
                              {ultimaRolagem.danoAdrenalinaFurioso > 0 && (
                                <div style={{ color: '#f85149' }}>⚡ Adrenalina (Crise): +{ultimaRolagem.danoAdrenalinaFurioso}</div>
                              )}
                              {ultimaRolagem.danoExtraHabilidade > 0 && (
                                <div style={{ color: '#bc8cff' }}>🖤 Golpe das Sombras: +{ultimaRolagem.danoExtraHabilidade}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setModalSlotAberto(slot.id)}
                        style={{ background: '#21262d', color: '#58a6ff', border: '1px solid #30363d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        <FaExchangeAlt /> Trocar
                      </button>
                      <button
                        type="button"
                        onClick={() => desequiparItem(itemEquipado)}
                        style={{ background: '#da3633', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Desequipar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ border: '2px dashed #30363d', borderRadius: '6px', padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#6e7681', fontStyle: 'italic' }}>Vazio</span>
                    <button
                      type="button"
                      onClick={() => setModalSlotAberto(slot.id)}
                      style={{ background: '#238636', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      + Equipar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. SEÇÃO DE MOCHILA & INVENTÁRIO */}
      <section className="ficha-card-section">
        <h3><FaBoxOpen /> Mochila & Inventário ({itensInventario.length})</h3>
        {itensInventario.length === 0 ? (
          <p style={{ color: '#8b949e', fontSize: '0.85rem', textAlign: 'center', padding: '15px 0', fontStyle: 'italic' }}>
            Sua mochila está vazia.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {itensInventario.map((item) => {
              const estaEquipado = !!item.stats_personalizados?.slot;
              return (
                <div key={item.id} style={{ background: '#0d0f18', border: '1px solid #30363d', padding: '12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '70%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#f0f6fc', fontWeight: 'bold' }}>{item.nome}</span>
                      {item.tipo && (
                        <span style={{ fontSize: '0.75rem', color: '#d4af37', background: 'rgba(212, 175, 55, 0.1)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          {item.tipo}
                        </span>
                      )}
                      {estaEquipado ? (
                        <span style={{ fontSize: '0.70rem', color: '#3fb950', background: 'rgba(63, 185, 80, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          Equipado ({item.stats_personalizados.slot.replace('_', ' ')})
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.70rem', color: '#8b949e', background: 'rgba(139, 148, 158, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          Na Mochila
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {estaEquipado ? (
                      <button type="button" onClick={() => desequiparItem(item)} style={{ background: '#da3633', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>
                        Desequipar
                      </button>
                    ) : (
                      <button type="button" onClick={() => lidarComCliqueEquipar(item)} style={{ background: '#238636', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>
                        Equipar
                      </button>
                    )}
                    <button type="button" onClick={() => deletarItem(item.id)} style={{ background: 'transparent', border: '1px solid #30363d', color: '#f85149', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }} title="Descartar item">
                      <FaTimes size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAIS */}
      {modalSlotAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: '#f0f6fc' }}>Escolher item da Mochila</h4>
              <button type="button" onClick={() => setModalSlotAberto(null)} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer' }}><FaTimes size={16} /></button>
            </div>
            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {itensMochila.length === 0 ? (
                <p style={{ color: '#8b949e', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>Sua mochila está sem itens disponíveis.</p>
              ) : (
                itensMochila.map(item => (
                  <div key={item.id} style={{ background: '#0d1117', border: '1px solid #30363d', padding: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#c9d1d9', fontSize: '0.9rem' }}>{item.nome}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>Tipo: {item.tipo}</div>
                    </div>
                    <button type="button" onClick={() => equiparItemNoSlot(item, modalSlotAberto)} style={{ background: '#238636', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                      Equipar Aqui
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {itemParaEquiparDireto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: '#f0f6fc' }}>Escolher Mão para {itemParaEquiparDireto.nome}</h4>
              <button type="button" onClick={() => setItemParaEquiparDireto(null)} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer' }}><FaTimes size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button type="button" onClick={() => equiparItemNoSlot(itemParaEquiparDireto, 'mao_dominante')} style={{ background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '10px', borderRadius: '6px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer' }}>
                ⚔️ Mão Dominante
              </button>
              <button type="button" onClick={() => equiparItemNoSlot(itemParaEquiparDireto, 'mao_secundaria')} style={{ background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '10px', borderRadius: '6px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer' }}>
                🛡️ Mão Não Dominante / Escudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}