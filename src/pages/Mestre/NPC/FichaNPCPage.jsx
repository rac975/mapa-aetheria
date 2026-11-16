import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { FaPen } from 'react-icons/fa';
import { CiSaveDown2 } from "react-icons/ci";
import NPCView from './components/NPCView';
import NPCEditor from './components/NPCEditor';
import './FichaNPCPage.css';

export default function FichaNPCPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [npc, setNpc] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [loading, setLoading] = useState(true);

  // Catálogos do Supabase
  const [catalogoFeiticos, setCatalogoFeiticos] = useState([]);
  const [catalogoPoderes, setCatalogoPoderes] = useState([]);

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      // Buscar NPC
      const { data: npcData, error: npcErr } = await supabase
        .from('npcs_mestre')
        .select('*')
        .eq('id', id)
        .single();

      if (!ativo) return;

      if (npcErr) {
        console.error('Erro ao carregar NPC:', npcErr);
        navigate('/mestre/npcs');
        return;
      }

      setNpc(npcData);

      // Buscar Feitiços e Poderes do Catálogo
      const { data: fData } = await supabase.from('catalogo_feiticos').select('*');
      const { data: pData } = await supabase.from('catalogo_poderes_npc').select('*');

      if (!ativo) return;

      setCatalogoFeiticos(fData || []);
      setCatalogoPoderes(pData || []);
      setLoading(false);
    }

    void carregarDados();

    return () => {
      ativo = false;
    };
  }, [id, navigate]);

  async function salvarNpc(npcAtualizado) {
    setNpc(npcAtualizado);
    const { error } = await supabase
      .from('npcs_mestre')
      .update(npcAtualizado)
      .eq('id', id);

    if (error) console.error('Erro ao salvar NPC:', error);
  }

  async function excluirNpc() {
    if (!window.confirm('Tem certeza que deseja excluir este NPC do Bestiário?')) return;
    const { error } = await supabase.from('npcs_mestre').delete().eq('id', id);
    if (!error) navigate('/mestre/npcs');
  }

  if (loading || !npc) {
    return <div className="loading-container">Carregando ficha do NPC...</div>;
  }

  return (
    <div className="ficha-page-container">
      {/* Barra superior de navegação e controles */}
      <div className="ficha-navbar">
        <button
          onClick={() => navigate('/mestre/npcs')}
          className="btn-voltar"
        >
          ← Voltar para Lista
        </button>

        <div className="ficha-actions">
          <button
            onClick={() => setModoEdicao(!modoEdicao)}
            className={`btn-modo ${modoEdicao ? 'salvar' : 'editar'}`}
          >
            {modoEdicao ? <CiSaveDown2 /> : <FaPen />} {modoEdicao ? 'Salvar / Visualizar' : 'Editar Ficha'}
          </button>
          <button
            onClick={excluirNpc}
            className="btn-excluir"
          >
            Excluir
          </button>
        </div>
      </div>

      {/* Seção principal: Alterna entre View e Editor */}
      {!modoEdicao ? (
        <NPCView npc={npc} onUpdate={salvarNpc} />
      ) : (
        <NPCEditor
          npc={npc}
          onUpdate={salvarNpc}
          catalogoFeiticos={catalogoFeiticos}
          catalogoPoderes={catalogoPoderes}
        />
      )}
    </div>
  );
}