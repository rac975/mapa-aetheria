import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPen } from 'react-icons/fa';
import { CiSaveDown2 } from "react-icons/ci";
import NPCView from './components/NPCView';
import NPCEditor from './components/NPCEditor';
import { useNPCManager } from '../../../hooks/useNPCManager';
import './FichaNPCPage.css';

export default function FichaNPCPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleNavigateAway = useCallback(() => {
    navigate('/mestre/npcs');
  }, [navigate]);

  const {
    npc,
    modoEdicao,
    setModoEdicao,
    loading,
    catalogoFeiticos,
    catalogoPoderes,
    catalogoEspecies,
    salvarNpc,
    excluirNpc
  } = useNPCManager(id, {
    onNavigateAway: handleNavigateAway
  });

  if (loading || !npc) {
    return <div className="loading-container">Carregando ficha do NPC...</div>;
  }

  return (
    <div className="ficha-page-container">
      {/* Barra superior de navegação e controles */}
      <div className="ficha-navbar">
        <button
          onClick={handleNavigateAway}
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
            onClick={() => excluirNpc()}
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
          catalogoEspecies={catalogoEspecies}
        />
      )}
    </div>
  );
}
