import { useState, useEffect, useCallback } from 'react';
import { FaShieldAlt, FaHandHolding, FaRing, FaTimes, FaExchangeAlt, FaBoxOpen, FaDice, FaBolt } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';

const rolarDado = (faces) => Math.floor(Math.random() * faces) + 1;

export default function FichaEquipamentosSecao({ fichaId, atributosAtuais = {} }) {
  const [itensInventario, setItensInventario] = useState([]);
  const [modalSlotAberto, setModalSlotAberto] = useState(null);
  const [itemParaEquiparDireto, setItemParaEquiparDireto] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Estado do modo de ataque por slot: 'normal' ou 'multi' (substitui o checkbox feio)
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

  // 🎲 Lógica completa lendo a fórmula de precisão do banco (ex: '(AST + AST) + 1')
  const executarRolagemArma = (itemArma, slotId) => {
    const stats = itemArma.stats_personalizados || {};

    // 1. Extrai os atributos e o bônus de precisão da string do banco (ex: '(AST + AST) + 1')
    const formulaPrecisao = String(stats.precisao || '').toUpperCase();

    let attr1Nome = stats.attr1 || 'destreza';
    let attr2Nome = stats.attr2 || 'astucia';
    let bonusPrecisaoArma = 0;

    if (formulaPrecisao) {
      // Mapeamento das abreviações do Fabula Ultima para os nomes usados no estado de atributos
      const mapaAtributos = {
        'DEX': 'destreza',
        'INS': 'intuicao',
        'MIG': 'vigor',
        'WLP': 'vontade',
        'AST': 'astucia'
      };

      // Tenta extrair os dois atributos de dentro dos parênteses (ex: AST e AST)
      const matchAtributos = formulaPrecisao.match(/\(([A-Z]{3})\s*\+\s*([A-Z]{3})\)/);
      if (matchAtributos) {
        if (mapaAtributos[matchAtributos[1]]) attr1Nome = mapaAtributos[matchAtributos[1]];
        if (mapaAtributos[matchAtributos[2]]) attr2Nome = mapaAtributos[matchAtributos[2]];
      }

      // Tenta extrair o bônus fixo de precisão após o fechamento dos parênteses (ex: o '+ 1')
      const partes = formulaPrecisao.split(')');
      if (partes.length > 1) {
        const resto = partes[1]; // Ex: " + 1"
        const matchBonus = resto.match(/\+\s*(\d+)/);
        if (matchBonus) {
          bonusPrecisaoArma = parseInt(matchBonus[1], 10) || 0;
        } else {
          // Se tiver um número direto ou formato alternativo
          const numAlt = parseInt(resto.trim(), 10);
          if (!isNaN(numAlt)) bonusPrecisaoArma = numAlt;
        }
      }
    }

    const extrairFaces = (valorAttr) => {
      if (!valorAttr) return 8;
      const str = String(valorAttr).trim().toLowerCase();
      if (str.startsWith('d')) {
        const faces = parseInt(str.substring(1), 10);
        return isNaN(faces) ? 8 : faces;
      }
      const num = parseInt(str, 10);
      return isNaN(num) ? 8 : num;
    };

    const faces1 = extrairFaces(atributosAtuais[attr1Nome]);
    const faces2 = extrairFaces(atributosAtuais[attr2Nome]);

    const res1 = rolarDado(faces1);
    const res2 = rolarDado(faces2);

    // Teste de Precisão = Dado 1 + Dado 2 + Bônus fixo extraído da fórmula (ex: + 1)
    const testeAtaque = res1 + res2 + bonusPrecisaoArma;

    // Verificação de Crítico e Erro Crítico
    let statusCritico = null;
    if (res1 === 1 && res2 === 1) {
      statusCritico = 'Erro Crítico (Fumble)';
    } else if (res1 === res2 && res1 >= 6) {
      statusCritico = 'Sucesso Crítico!';
    }

    const dadoMaisAlto = Math.max(res1, res2);
    const isMulti = modoAtaqueState[slotId] === 'multi';

    // Extrai o bônus de dano numérico de strings como 'RA + 6' ou 'VIG + 4'
    const extrairBonusDano = (valorBruto) => {
      if (valorBruto === undefined || valorBruto === null) return 0;
      if (typeof valorBruto === 'number') return valorBruto;

      const str = String(valorBruto).trim();
      if (str.includes('+')) {
        const partes = str.split('+');
        const num = parseInt(partes[partes.length - 1].trim(), 10);
        return isNaN(num) ? 0 : num;
      }
      const numDireto = parseInt(str, 10);
      return isNaN(numDireto) ? 0 : numDireto;
    };

    const valorDanoBruto = stats.dano_fixo !== undefined ? stats.dano_fixo
      : stats.dano !== undefined ? stats.dano
        : stats.bonus_dano !== undefined ? stats.bonus_dano
          : 0;

    const bonusOriginal = extrairBonusDano(valorDanoBruto);
    const bonusDanoFixo = isMulti ? 0 : bonusOriginal;
    const danoTotal = dadoMaisAlto + bonusDanoFixo;

    setResultadosRolagem(prev => ({
      ...prev,
      [slotId]: {
        res1,
        res2,
        bonusPrecisaoArma,
        testeAtaque,
        statusCritico,
        dadoMaisAlto,
        bonusOriginal,
        bonusDanoFixo,
        danoTotal,
        isMulti
      }
    }));
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
      {/* 1. SEÇÃO DE ITENS EQUIPADOS */}
      <section className="ficha-card-section" style={{ marginBottom: '20px' }}>
        <h3>🛡️ Itens Equipados</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '12px' }}>
          {slotConfig.map(slot => {
            const itemEquipado = getItemNoSlot(slot.id);
            const isArma = slot.id.includes('mao') && itemEquipado && (itemEquipado.tipo || '').toLowerCase().includes('arma');
            const ultimaRolagem = resultadosRolagem[slot.id];
            const modoAtual = modoAtaqueState[slot.id] || 'normal';

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

                    {/* Controles de Ataque e Seletor de Modo (Substituindo o checkbox simples) */}
                    {isArma && (
                      <div style={{ borderTop: '1px solid #30363d', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>

                        {/* Seletor Estilizado de Modo de Ataque */}
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

                        {/* 📊 EXIBIÇÃO DETALHADA DIRETAMENTE NO CARD */}
                        {ultimaRolagem && (
                          <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '8px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>

                            {/* Alerta de Crítico se houver */}
                            {ultimaRolagem.statusCritico && (
                              <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: ultimaRolagem.statusCritico.includes('Sucesso') ? '#3fb950' : '#f85149', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3px' }}>
                                <FaBolt /> {ultimaRolagem.statusCritico}
                              </div>
                            )}

                            <div style={{ fontSize: '0.75rem', color: '#f0f6fc', display: 'flex', justifyContent: 'space-between' }}>
                              <span>Precisão:</span>
                              <strong>
                                {ultimaRolagem.res1} + {ultimaRolagem.res2}
                                {ultimaRolagem.bonusPrecisaoArma !== 0 ? ` ${ultimaRolagem.bonusPrecisaoArma > 0 ? '+' : ''} ${ultimaRolagem.bonusPrecisaoArma}` : ''}
                                = {ultimaRolagem.testeAtaque}
                              </strong>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#d4af37', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Dano Final:</span>
                              <strong style={{ fontSize: '0.85rem' }}>{ultimaRolagem.danoTotal}</strong>
                            </div>

                            {/* Detalhamento do cálculo do dano */}
                            <div style={{ fontSize: '0.65rem', color: '#8b949e', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '3px' }}>
                              Cálculo: Dado mais alto ({ultimaRolagem.dadoMaisAlto})
                              {ultimaRolagem.isMulti && ultimaRolagem.bonusOriginal > 0 ? (
                                <span style={{ color: '#f85149' }}> (Bônus de +{ultimaRolagem.bonusOriginal} zerado por Multiataque)</span>
                              ) : ultimaRolagem.bonusDanoFixo > 0 ? (
                                <span> + Bônus Fixo ({ultimaRolagem.bonusDanoFixo}) = {ultimaRolagem.danoTotal}</span>
                              ) : (
                                <span> (Sem bônus fixo)</span>
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

      {/* 2. SEÇÃO DE MOCHILA & INVENTÁRIO (Mantida igual) */}
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

      {/* MODAL 1 E MODAL 2 MANTIDOS */}
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