import { useState, useEffect } from 'react';
import { FaPaw, FaCog, FaPlusCircle } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { npcService } from '../../../../services/npcService';
import { calcularPvMaximoCompanheiro, extrairNivelCompanheiroFiel } from '../../../../domain/fabula/classRules';
import { calcularNivelTotal } from '../../../../domain/fabula/characterProgression';
import NPCEditor from '../../../Mestre/NPC/components/NPCEditor';
import { Button } from '../../../../components/ui';
import { useAlert } from '../../../../contexts/useAlert';
import styles from './CompanheiroFielCard.module.css';

export default function CompanheiroFielCard({ fichaId, classes = [] }) {
  const { showAlert } = useAlert();
  const { id: idUrl } = useParams();
  const realFichaId = fichaId || idUrl;

  const [companheiro, setCompanheiro] = useState(null);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [catalogoPoderes, setCatalogoPoderes] = useState([]);
  const [catalogoFeiticos, setCatalogoFeiticos] = useState([]);

  const nivelNP = extrairNivelCompanheiroFiel(classes);
  const nivelPersonagem = calcularNivelTotal(classes);

  useEffect(() => {
    let active = true;

    async function carregarDados() {
      if (!realFichaId || nivelNP <= 0) return;

      const { data: compData, error: errComp } = await npcService.getCompanheiroFielPorPersonagemId(realFichaId);

      if (errComp) {
        console.error("❌ [CompanheiroFiel] Erro ao buscar:", errComp.message);
      }

      const { data: poderesData } = await npcService.getCatalogoPoderesNpc();
      const { data: feiticosData } = await npcService.getCatalogoFeiticos();

      if (!active) return;

      if (poderesData) setCatalogoPoderes(poderesData);
      if (feiticosData) setCatalogoFeiticos(feiticosData);

      if (compData) {
        setCompanheiro(compData);
      } else {
        setCompanheiro(null);
      }
    };

    carregarDados();
    return () => { active = false; };
  }, [realFichaId, nivelNP, nivelPersonagem]);

  if (nivelNP <= 0) return null;

  if (!realFichaId) {
    return (
      <div className={styles.errorBox}>
        <span className={styles.errorText}>⚠️ Erro: Ficha ID ausente. Salve a ficha principal primeiro para gerar um ID.</span>
      </div>
    );
  }

  const criarCompanheiroNoBanco = async () => {
    setSalvando(true);
    const { data: userData } = await npcService.getAuthUser();
    const pvInicial = calcularPvMaximoCompanheiro(nivelNP, 'd8', nivelPersonagem);

    const novoMolde = {
      user_id: userData?.user?.id || null,
      nome: 'Meu Companheiro',
      especie: 'fera',
      nivel: 5,
      rank: 'soldado',
      atributos: { des: 'd8', ast: 'd8', vig: 'd8', von: 'd8' },
      pv_max: pvInicial,
      pv_atual: pvInicial,
      pm_max: 20,
      pm_atual: 20,
      defesa: 8,
      defesa_magica: 6,
      iniciativa: 0,
      afinidades: { veneno: 'vul' },
      tracos: ['', '', '', ''],
      ataques_basicos: [],
      poderes: [],
      feiticos: [],
      personagem_id: realFichaId,
      tipo_registro: 'companheiro'
    };

    const { data, error } = await npcService.createCompanheiroFiel(novoMolde);
    if (!error && data) {
      setCompanheiro(data);
      setEditando(true);
    } else {
      console.error("❌ Erro ao criar companheiro:", error);
      showAlert("Erro ao criar o companheiro no banco. Verifique o console (F12).");
    }
    setSalvando(false);
  };

  const salvarNoBanco = async (novoEstado) => {
    const maxPv = Math.max(1, parseInt(novoEstado.pv_max, 10) || 1);
    const atualPv = Math.max(0, Math.min(maxPv, parseInt(novoEstado.pv_atual !== undefined ? novoEstado.pv_atual : maxPv, 10)));
    const estadoAtualizado = {
      ...novoEstado,
      pv_max: maxPv,
      pv_atual: atualPv
    };

    setCompanheiro(estadoAtualizado);
    setSalvando(true);

    const { id, quantidade_soldados: _q, ...dadosAtualizacao } = estadoAtualizado;
    const payload = {
      ...dadosAtualizacao,
      personagem_id: realFichaId,
      tipo_registro: 'companheiro'
    };

    if (id) {
      const { error } = await npcService.updateNpc(id, payload);

      if (error) {
        console.error("❌ [CompanheiroFiel] Erro ao atualizar:", error.message);
      }
    }
    setSalvando(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>
          <FaPaw /> Companheiro Fiel (NP {nivelNP})
        </span>

        {companheiro && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setEditando(!editando)}
          >
            <FaCog /> {editando ? 'Fechar Editor' : 'Configurar / Editar NPC'}
          </Button>
        )}
      </div>

      {!companheiro ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyText}>
            Você possui a habilidade Companheiro Fiel, mas ainda não gerou a ficha do seu animal/construto.
          </p>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={criarCompanheiroNoBanco}
            disabled={salvando}
          >
            <FaPlusCircle /> {salvando ? 'Criando...' : 'Criar Ficha do Companheiro Fiel'}
          </Button>
        </div>
      ) : editando ? (
        <div>
          <NPCEditor
            npc={companheiro}
            onUpdate={(novoEstado) => salvarNoBanco(novoEstado)}
            catalogoPoderes={catalogoPoderes}
            catalogoFeiticos={catalogoFeiticos}
            isCompanheiro={true}  
            nivelNP={nivelNP}     
            nivelPersonagem={nivelPersonagem}
          />
        </div>
      ) : (
        <div className={styles.summaryBox}>
          <div><strong>Nome:</strong> {companheiro.nome || 'Não definido'}</div>
          <div><strong>Espécie:</strong> {companheiro.especie?.toUpperCase()} | <strong>PV Máx:</strong> {companheiro.pv_max}</div>
          <div className={styles.summaryHint}>
            Clique em "Configurar / Editar NPC" acima para abrir o motor completo de atributos, ataques e poderes do seu companheiro.
          </div>
        </div>
      )}

      {salvando && <div className={styles.savingIndicator}>A salvar alterações...</div>}
    </div>
  );
}
