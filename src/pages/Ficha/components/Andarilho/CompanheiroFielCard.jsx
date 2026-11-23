import { useState, useEffect } from 'react';
import { FaPaw, FaCog, FaPlusCircle } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { npcService } from '../../../../services/npcService';
import { normalizarNpcLeitura } from '../../../../domain/fabula/npcRules';
import {
  calcularPvMaximoCompanheiro,
  extrairNivelCompanheiroFiel,
  gerarMoldePadraoCompanheiro
} from '../../../../domain/fabula/classRules';
import { calcularNivelTotal } from '../../../../domain/fabula/characterProgression';
import NPCEditor from '../../../Mestre/NPC/components/NPCEditor';
import { Button } from '../../../../components/ui';
import { useAlert } from '../../../../contexts/useAlert';
import styles from './CompanheiroFielCard.module.css';

export default function CompanheiroFielCard({
  fichaId,
  classes = [],
  isMestre = false,
  podeEditar = true,
  onCompanheiroAtualizado = null,
  companheiroInicial = null
}) {
  const { showAlert } = useAlert();
  const { id: idUrl } = useParams();
  const realFichaId = fichaId || idUrl;

  const [companheiro, setCompanheiro] = useState(companheiroInicial);
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

      const { data: userData } = await npcService.getAuthUser();
      const currentUserId = userData?.user?.id || null;

      const { data: compData, error: errComp } = await npcService.getCompanheiroFielPorPersonagemId(
        realFichaId,
        { userId: currentUserId }
      );

      if (errComp) {
        console.error("❌ [CompanheiroFiel] Erro ao buscar:", {
          status: errComp.status, code: errComp.code, message: errComp.message, details: errComp.details
        });
      }

      const [poderesRes, feiticosRes] = await Promise.all([
        npcService.getCatalogoPoderesNpc(),
        npcService.getCatalogoFeiticos()
      ]);

      if (!active) return;
      if (poderesRes.data) setCatalogoPoderes(poderesRes.data);
      if (feiticosRes.data) setCatalogoFeiticos(feiticosRes.data);

      if (compData) {
        setCompanheiro(compData);
        onCompanheiroAtualizado?.(compData);
      } else if (!companheiroInicial) {
        setCompanheiro(null);
      }
    }

    carregarDados();

    const sub = npcService.subscribeCompanheiroFiel(realFichaId, (payload) => {
      if (!active) return;
      if (payload?.eventType === 'DELETE') {
        setCompanheiro(null);
        onCompanheiroAtualizado?.(null);
      } else if (payload?.new) {
        const norm = normalizarNpcLeitura(payload.new);
        setCompanheiro(norm);
        onCompanheiroAtualizado?.(norm);
      }
    });

    return () => {
      active = false;
      if (sub?.unsubscribe) sub.unsubscribe();
    };
  }, [realFichaId, nivelNP, nivelPersonagem, companheiroInicial, onCompanheiroAtualizado]);

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

    // 1. Antes de criar, verifica se já existe companheiro salvo para evitar duplicata ou sobrescrita
    const existente = await npcService.getCompanheiroFielPorPersonagemId(realFichaId);
    if (existente?.data?.id) {
      setCompanheiro(existente.data);
      setEditando(true);
      onCompanheiroAtualizado?.(existente.data);
      setSalvando(false);
      return;
    }

    const { data: userData } = await npcService.getAuthUser();
    const pvInicial = calcularPvMaximoCompanheiro(nivelNP, 'd8', nivelPersonagem);
    const novoMolde = gerarMoldePadraoCompanheiro({
      personagemId: realFichaId,
      userId: userData?.user?.id || null,
      pvInicial
    });

    const { data, error } = await npcService.createCompanheiroFiel(novoMolde);
    if (!error && data) {
      setCompanheiro(data);
      setEditando(true);
      onCompanheiroAtualizado?.(data);
    } else {
      console.error("❌ Erro detalhado ao criar companheiro no Supabase:", {
        status: error?.status, code: error?.code, message: error?.message, details: error?.details, hint: error?.hint
      });
      const detalheMsg = [
        error?.message,
        error?.code ? `(Código: ${error.code})` : null,
        error?.status ? `(HTTP ${error.status})` : null,
        error?.details ? `Detalhes: ${error.details}` : null
      ].filter(Boolean).join(' ');

      showAlert({
        title: 'Erro ao Criar Companheiro',
        type: 'error',
        message: detalheMsg || 'Erro ao registrar companheiro no banco. Verifique permissões RLS.'
      });
    }
    setSalvando(false);
  };

  const salvarNoBanco = async (novoEstado) => {
    const maxPv = Math.max(1, parseInt(novoEstado.pv_max, 10) || 1);
    const atualPv = Math.max(0, Math.min(maxPv, parseInt(novoEstado.pv_atual !== undefined ? novoEstado.pv_atual : maxPv, 10)));
    const estadoAtualizado = { ...novoEstado, pv_max: maxPv, pv_atual: atualPv };

    setCompanheiro(estadoAtualizado);
    setSalvando(true);

    const { id, quantidade_soldados: _q, ...dadosAtualizacao } = estadoAtualizado;
    const payload = { ...dadosAtualizacao, personagem_id: realFichaId, tipo_registro: 'companheiro' };

    if (id) {
      const { error } = await npcService.updateNpc(id, payload);
      if (error) {
        console.error("❌ [CompanheiroFiel] Erro ao atualizar no Supabase:", {
          status: error?.status, code: error?.code, message: error?.message, details: error?.details
        });
      } else {
        onCompanheiroAtualizado?.(estadoAtualizado);
      }
    }
    setSalvando(false);
  };

  const temPermissaoEdicao = podeEditar || isMestre;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>
          <FaPaw /> Companheiro Fiel (NP {nivelNP})
        </span>

        {companheiro && temPermissaoEdicao && (
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
          {temPermissaoEdicao && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={criarCompanheiroNoBanco}
              disabled={salvando}
            >
              <FaPlusCircle /> {salvando ? 'Criando...' : 'Criar Ficha do Companheiro Fiel'}
            </Button>
          )}
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
