import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaDragon, FaShieldAlt, FaArrowRight, FaSkull } from 'react-icons/fa';
import { npcService } from '../../../services/npcService';
import { Card, Button, Badge, ResourceBar } from '../../../components/ui';
import styles from './ListaNPCsPage.module.css';

export default function ListaNPCsPage() {
  const [npcs, setNpcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      alert('Você precisa estar logado como Mestre para criar NPCs.');
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
      feiticos: []
    };

    const { data, error } = await npcService.createNpc(novoNpc);

    if (error) {
      console.error('Erro ao criar NPC:', error);
      alert('Erro ao criar NPC.');
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

      {loading ? (
        <p className={styles.loadingText}>Carregando bestiário da mesa...</p>
      ) : npcs.length === 0 ? (
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
