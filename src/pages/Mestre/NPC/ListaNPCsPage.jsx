import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaDragon, FaShieldAlt, FaArrowRight, FaSkull, FaTrash, FaCrown, FaBolt, FaFire } from 'react-icons/fa';
import { npcService } from '../../../services/npcService';
import { TIPOS_VILAO, normalizarTipoVilao } from '../../../domain/fabula/npcRules';
import { useToast } from '../../../contexts/ToastContext';
import { useAlert } from '../../../contexts/useAlert';
import { Card, Button, Badge, ResourceBar, LoadingScreen } from '../../../components/ui';
import styles from './ListaNPCsPage.module.css';

export default function ListaNPCsPage() {
  const [npcs, setNpcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { coldDelete } = useToast();
  const { showAlert } = useAlert();

  const handleExcluirNpc = (npcParaExcluir) => {
    coldDelete({
      item: npcParaExcluir,
      message: (
        <>
          NPC <strong>{npcParaExcluir.nome}</strong> foi removido do Bestiário.
        </>
      ),
      onRemove: (it) => {
        setNpcs(prev => prev.filter(n => n.id !== it.id));
      },
      onCommit: async (it) => {
        const { error } = await npcService.deleteNpc(it.id);
        if (error) console.error('Erro ao deletar NPC:', error);
      },
      onRollback: (it) => {
        setNpcs(prev => [...prev, it]);
      },
      duration: 6000
    });
  };

  useEffect(() => {
    let active = true;

    async function carregarNpcs() {
      const { data, error } = await npcService.getNpcsMestre();

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
    const { data: userData } = await npcService.getAuthUser();
    if (!userData?.user) {
      showAlert('Você precisa estar logado como Mestre para criar NPCs.');
      return;
    }

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
      feiticos: [],
      tipo_vilao: 'padrao',
      pontos_vilao: 0,
      fases_chefao: [],
      acoes_por_turno: 1,
      fase_atual: 1
    };

    const { data, error } = await npcService.createNpc(novoNpc);

    if (error) {
      console.error('Erro ao criar NPC:', error);
      showAlert('Erro ao criar NPC.');
    } else if (data) {
      navigate(`/mestre/npcs/${data.id}`);
    }
  }

  const getRankBadgeVariant = (rank) => {
    switch (rank?.toLowerCase()) {
      case 'elite':
        return 'ether';
      case 'campeao':
        return 'crise';
      default:
        return 'gold';
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <LoadingScreen
          mensagem="Carregando bestiário de adversários da mesa..."
          subtitulo="Bestiário de NPCs"
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <h1><FaDragon /> Bestiário de NPCs (Mestre)</h1>
          <p>Gerencie monstros, lacaios e chefes para as sessões de Fabula Ultima.</p>
        </div>
        <Button variant="primary" onClick={criarNovoNpc}>
          <FaPlus /> Novo NPC
        </Button>
      </header>

      {npcs.length === 0 ? (
        <div className={styles.emptyState}>
          <FaSkull className={styles.emptyIcon} />
          <p>Nenhum NPC ou adversário cadastrado ainda.</p>
          <Button variant="secondary" onClick={criarNovoNpc}>
            Criar Primeiro NPC
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {npcs.map((npc) => (
            <Card
              key={npc.id}
              variant="interactive"
              className={styles.npcCard}
              onClick={() => navigate(`/mestre/npcs/${npc.id}`)}
              title="Abrir ficha completa"
            >
              <div>
                <div className={styles.cardHeader}>
                  <h3 className={styles.npcTitle}>{npc.nome}</h3>
                  <Badge variant={getRankBadgeVariant(npc.rank)} size="sm">
                    {npc.rank?.toUpperCase() || 'SOLDADO'}
                  </Badge>
                </div>

                <div className={styles.cardMeta}>
                  <Badge variant="default" size="sm">
                    {npc.especie?.toUpperCase() || 'FERA'}
                  </Badge>
                  <Badge variant="ether" size="sm">
                    Nível {npc.nivel}
                  </Badge>
                  {normalizarTipoVilao(npc.tipo_vilao) !== 'padrao' && (
                    <Badge variant="villain" size="sm">
                      <FaCrown /> {TIPOS_VILAO[normalizarTipoVilao(npc.tipo_vilao)]?.badgeLabel}
                    </Badge>
                  )}
                  {(Number(npc.pontos_vilao) || 0) > 0 && (
                    <Badge variant="villain" size="sm">
                      <FaSkull /> {npc.pontos_vilao} PVilão
                    </Badge>
                  )}
                  {(Number(npc.acoes_por_turno) || 1) > 1 && (
                    <Badge variant="gold" size="sm">
                      <FaBolt /> {npc.acoes_por_turno}x Ações
                    </Badge>
                  )}
                  {Array.isArray(npc.fases_chefao) && npc.fases_chefao.length > 0 && (
                    <Badge variant="crise" size="sm">
                      <FaFire /> {npc.fases_chefao.length} Fases
                    </Badge>
                  )}
                </div>
              </div>

              <div className={styles.resourcesBox}>
                <ResourceBar
                  type="pv"
                  current={npc.pv_atual}
                  max={npc.pv_max}
                  label="PV"
                />
                <ResourceBar
                  type="pm"
                  current={npc.pm_atual}
                  max={npc.pm_max}
                  label="PM"
                />
                <div className={styles.statsRow}>
                  <span className={styles.statItem}>
                    <FaShieldAlt /> Def: <strong className={styles.statValue}>{npc.defesa}</strong>
                  </span>
                  <span className={styles.statItem}>
                    Def. Mág: <strong className={styles.statValue}>{npc.defesa_magica}</strong>
                  </span>
                  <span className={styles.statItem}>
                    Inic: <strong className={styles.statValue}>{npc.iniciativa}</strong>
                  </span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.openFichaText}>
                  Abrir Ficha <FaArrowRight />
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExcluirNpc(npc);
                  }}
                  title="Excluir NPC"
                >
                  <FaTrash />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
