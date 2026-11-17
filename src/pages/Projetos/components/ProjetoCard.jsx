import {
  FaCoins,
  FaFlask,
  FaExclamationTriangle,
  FaPlus,
  FaMinus,
  FaDiceD20,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaUserCog,
  FaCheckCircle
} from 'react-icons/fa';
import { Card, Badge, Button, ResourceBar } from '../../../components/ui';
import {
  POTENCIAS_PROJETO,
  AREAS_PROJETO,
  USOS_PROJETO,
  STATUS_PROJETO,
  calcularFatiasPreenchidas
} from '../../../domain/fabula/projetoRules';
import ProjetoRelogioSvg from './ProjetoRelogioSvg';
import styles from './ProjetoCard.module.css';

/**
 * Cartão modular de exibição e controle de um Projeto (Visão Jogador + CRUD Mestre).
 */
export default function ProjetoCard({
  projeto,
  isMestre,
  onAvancarProgresso,
  onAbrirTeste,
  onEditar,
  onAlternarVisibilidade,
  onExcluir
}) {
  const potenciaInfo = POTENCIAS_PROJETO[projeto.potencia] || POTENCIAS_PROJETO.menor;
  const areaInfo = AREAS_PROJETO[projeto.area] || AREAS_PROJETO.individual;
  const usosInfo = USOS_PROJETO[projeto.usos] || USOS_PROJETO.consumivel;
  const statusInfo = STATUS_PROJETO[projeto.status] || STATUS_PROJETO.em_andamento;

  const progressoAtual = Math.max(0, Number(projeto.progresso_atual) || 0);
  const progressoTotal = Math.max(1, Number(projeto.progresso_total) || 1);
  const fatiasRelogio = Math.max(2, Number(projeto.fatias_relogio) || 4);
  const fatiasPreenchidas = calcularFatiasPreenchidas(progressoAtual, progressoTotal, fatiasRelogio);
  const concluido = projeto.status === 'concluido' || progressoAtual >= progressoTotal;
  const percentual = Math.min(100, Math.round((progressoAtual / progressoTotal) * 100));

  return (
    <Card
      variant={concluido ? 'ether' : 'default'}
      className={`${styles.card} ${!projeto.visivel ? styles.ocultoCard : ''}`}
    >
      <div className={styles.topRow}>
        <div className={styles.titleBlock}>
          <div className={styles.badgesRow}>
            <Badge variant={statusInfo.variant} size="sm">
              {concluido && <FaCheckCircle />} {statusInfo.nome}
            </Badge>
            <Badge variant="gold" size="sm">
              {potenciaInfo.nome}
            </Badge>
            <Badge variant="default" size="sm">
              {areaInfo.nome}
            </Badge>
            <Badge variant={projeto.usos === 'permanente' ? 'pm' : 'pi'} size="sm">
              {projeto.usos === 'permanente' ? 'Permanente' : 'Consumível'}
            </Badge>
            {!projeto.visivel && (
              <Badge variant="crise" size="sm">
                <FaEyeSlash /> Oculto
              </Badge>
            )}
          </div>
          <h3 className={styles.title}>{projeto.titulo}</h3>
          {projeto.responsavel_nome && (
            <span className={styles.responsavel}>
              <FaUserCog /> {projeto.responsavel_nome}
            </span>
          )}
        </div>

        <div className={styles.clockArea}>
          <ProjetoRelogioSvg
            fatiasTotal={fatiasRelogio}
            fatiasPreenchidas={fatiasPreenchidas}
            concluido={concluido}
            size="md"
          />
          <span className={styles.clockLabel}>
            {fatiasPreenchidas}/{fatiasRelogio} fatias ({percentual}%)
          </span>
        </div>
      </div>

      {projeto.descricao && (
        <p className={styles.descricao}>{projeto.descricao}</p>
      )}

      <div className={styles.progressSection}>
        <ResourceBar
          type={concluido ? 'pv' : 'pm'}
          label="Progresso do Projeto"
          current={progressoAtual}
          max={progressoTotal}
        />
      </div>

      <div className={styles.specsGrid}>
        <div className={styles.specItem}>
          <span className={styles.specLabel}><FaCoins /> Custo de Materiais</span>
          <strong className={styles.specValue}>{projeto.custo_zenit} zênites</strong>
        </div>
        <div className={styles.specItem}>
          <span className={styles.specLabel}><FaDiceD20 /> Teste de Oficina</span>
          <strong className={styles.specValue}>
            [{projeto.atributos_teste}] • ND {projeto.nd_teste}
          </strong>
        </div>
      </div>

      {projeto.ingrediente_raro && (
        <div className={`${styles.callout} ${projeto.ingrediente_obtido ? styles.calloutOk : styles.calloutWarn}`}>
          <FaFlask />
          <div>
            <strong>Ingrediente Especial:</strong> {projeto.ingrediente_raro}{' '}
            <span className={styles.calloutStatus}>
              ({projeto.ingrediente_obtido ? 'Obtido' : 'Pendente'})
            </span>
          </div>
        </div>
      )}

      {projeto.possui_defeito && (
        <div className={`${styles.callout} ${styles.calloutFlaw}`}>
          <FaExclamationTriangle />
          <div>
            <strong>Defeito Terrível (-25% custo):</strong>{' '}
            {projeto.descricao_defeito || 'Defeito mecânico/narrativo acordado com o Mestre.'}
          </div>
        </div>
      )}

      {isMestre && projeto.notas_mestre && (
        <div className={`${styles.callout} ${styles.calloutMaster} ${styles.noPrint}`}>
          <strong>Notas do Mestre:</strong> {projeto.notas_mestre}
        </div>
      )}

      <div className={`${styles.actionsBar} ${styles.noPrint}`}>
        <div className={styles.actionGroup}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onAbrirTeste(projeto)}
            title="Realizar ou simular Teste de Projeto / Progresso Diário"
          >
            <FaDiceD20 /> {isMestre ? 'Testar / Dia' : 'Simular Teste'}
          </Button>
        </div>

        {isMestre && (
          <div className={styles.actionGroup}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAvancarProgresso(projeto, -1)}
              disabled={progressoAtual <= 0}
              title="Reduzir 1 ponto de progresso"
              aria-label="Reduzir progresso"
            >
              <FaMinus />
            </Button>
            <Button
              variant="core"
              size="sm"
              onClick={() => onAvancarProgresso(projeto, 1)}
              disabled={progressoAtual >= progressoTotal}
              title="Avançar 1 ponto de progresso"
              aria-label="Avançar progresso"
            >
              <FaPlus /> 1 Prog
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAlternarVisibilidade(projeto)}
              title={projeto.visivel ? 'Ocultar dos jogadores' : 'Tornar visível aos jogadores'}
              aria-label="Alternar visibilidade"
            >
              {projeto.visivel ? <FaEye /> : <FaEyeSlash />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditar(projeto)}
              title="Editar Projeto"
              aria-label="Editar Projeto"
            >
              <FaEdit />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onExcluir(projeto)}
              title="Excluir Projeto"
              aria-label="Excluir Projeto"
            >
              <FaTrash />
            </Button>
          </div>
        )}
      </div>

      <div className={styles.printFooter}>
        Escopo: {potenciaInfo.nome} • {areaInfo.nome} • {usosInfo.nome}
      </div>
    </Card>
  );
}
