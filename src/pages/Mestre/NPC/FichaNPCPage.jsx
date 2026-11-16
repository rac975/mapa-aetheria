import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPen, FaPrint, FaArrowLeft, FaTrash } from 'react-icons/fa';
import { CiSaveDown2 } from 'react-icons/ci';
import NPCView from './components/NPCView';
import NPCEditor from './components/NPCEditor';
import { useNPCManager } from '../../../hooks/useNPCManager';
import { Button } from '../../../components/ui';
import styles from './FichaNPCPage.module.css';

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

  const handleImprimir = () => {
    window.print();
  };

  if (loading || !npc) {
    return <div className={styles.loadingContainer}>Carregando ficha do NPC...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      {/* Barra superior de navegação e controles */}
      <nav className={styles.navbar} aria-label="Controles da Ficha do NPC">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNavigateAway}
        >
          <FaArrowLeft /> Voltar para Lista
        </Button>

        <div className={styles.navActions}>
          {!modoEdicao && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImprimir}
              title="Imprimir ficha física do NPC"
            >
              <FaPrint /> Imprimir Ficha
            </Button>
          )}

          <Button
            variant={modoEdicao ? 'core' : 'primary'}
            size="sm"
            onClick={() => setModoEdicao(!modoEdicao)}
          >
            {modoEdicao ? <CiSaveDown2 /> : <FaPen />}{' '}
            {modoEdicao ? 'Salvar / Visualizar' : 'Editar Ficha'}
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => excluirNpc()}
          >
            <FaTrash /> Excluir
          </Button>
        </div>
      </nav>

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
