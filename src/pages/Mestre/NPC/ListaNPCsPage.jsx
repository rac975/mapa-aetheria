import React, { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import { useNavigate } from 'react-router-dom';

export default function ListaNPCsPage() {
  const [npcs, setNpcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function carregarNpcs() {
      // Filtrando apenas os NPCs criados pelo Mestre
      const { data, error } = await supabase
        .from('npcs_mestre')
        .select('*')
        .eq('tipo_registro', 'npc_mestre') // <-- Garante que não traz companheiros de jogadores aqui
        .order('created_at', { ascending: false });

      if (!active) return;

      if (error) {
        console.error('Erro ao buscar NPCs:', error);
      } else {
        setNpcs(data || []);
      }
      setLoading(false);
    }

    carregarNpcs();
    return () => {
      active = false;
    };
  }, []);

  async function criarNovoNpc() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return alert('Você precisa estar logado!');

    const novoNpc = {
      user_id: userData.user.id,
      tipo_registro: 'npc_mestre',
      personagem_id: null,
      nome: 'Novo NPC',
      especie: 'fera',
      nivel: 5,
      rank: 'soldado',
      pv_max: 50,
      pv_atual: 50,
      pm_max: 45,
      pm_atual: 45,
      defesa: 8,
      defesa_magica: 6,
      iniciativa: 7,
      atributos: { des: 'd8', ast: 'd6', vig: 'd10', von: 'd8' },
      afinidades: {},
      tracos: ['', '', '', ''],
      ataques_basicos: [],
      poderes: [],
      feiticos: []
    };

    const { data, error } = await supabase
      .from('npcs_mestre')
      .insert([novoNpc])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar NPC:', error);
      alert('Erro ao criar NPC.');
    } else if (data) {
      navigate(`/mestre/npcs/${data.id}`);
    }
  }

  return (
    <div className="lista-npcs-container">
      <div className="lista-npcs-header">
        <div>
          <h1>Criador de NPC (Mestre)</h1>
          <p>Gerencie seus monstros, lacaios e chefes de campanha.</p>
        </div>
        <button onClick={criarNovoNpc} className="btn-novo-npc">
          + Novo NPC
        </button>
      </div>

      {loading ? (
        <p className="loading-text">Carregando bestiário...</p>
      ) : npcs.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum NPC cadastrado ainda.</p>
          <button onClick={criarNovoNpc} className="link-criar">
            Criar seu primeiro NPC agora
          </button>
        </div>
      ) : (
        <div className="npcs-grid">
          {npcs.map((npc) => (
            <div
              key={npc.id}
              onClick={() => navigate(`/mestre/npcs/${npc.id}`)}
              className="npc-card"
            >
              <div>
                <div className="npc-card-header">
                  <h3>{npc.nome}</h3>
                  <span className="npc-rank-badge">
                    {npc.rank}
                  </span>
                </div>
                <p className="npc-card-info">
                  Espécie: <span>{npc.especie}</span> | Nível {npc.nivel}
                </p>
                <div className="npc-card-stats">
                  <span>PV: {npc.pv_atual}/{npc.pv_max}</span>
                  <span>PM: {npc.pm_atual}/{npc.pm_max}</span>
                  <span>Def: {npc.defesa}</span>
                </div>
              </div>
              <div className="npc-card-footer">
                Abrir Ficha →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}