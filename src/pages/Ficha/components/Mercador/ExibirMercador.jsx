import {
  FaCoins,
  FaCheck,
  FaExclamationTriangle,
  FaPlus,
  FaMinus,
  FaHandshake,
  FaBoxOpen,
  FaSearchPlus,
  FaCampground,
  FaCity
} from 'react-icons/fa';
import { Card, Button, Badge, Input } from '../../../../components/ui';
import { useMercador } from './useMercador';
import styles from './ExibirMercador.module.css';

export default function ExibirMercador(props) {
  const {
    nivelMercador,
    nvDataDeValidade, nvEstoquePessoal, nvJaOuviFalar, nvVentosDoComercio, nvVerdadeiroTesouro,
    parametros, pontosComercio, prosperidadeAssentamento,
    registrosComerciais, tipoVentos, setTipoVentos, textoVentos, setTextoVentos,
    temPorUmFuturoMelhor, temCochiloPoderoso, temDosagemPrecisa,
    feedback, erroMsg,
    handleAjustarPontosComercio, handleDescansoComercial, handleVerdadeiroTesouro,
    handleUsarEstoquePessoal, handleUsarJaOuviFalar, handleConverterEmFabula,
    handleExecutarVentosDoComercio
  } = useMercador(props);

  return (
    <Card variant="default" className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <FaCoins /> Rotas e Ventos do Comércio — Mercador
        </div>
        <div className={styles.headerActions}>
          {nvVentosDoComercio > 0 && (
            <Badge variant="gold" size="md">
              Pontos de Comércio: {pontosComercio} / {parametros.maxPontosComercio}
            </Badge>
          )}
          <Badge variant="pi" size="md">Nível {nivelMercador}</Badge>
        </div>
      </div>

      {/* Passivas e Poderes de Comércio */}
      <div className={styles.badgesRow}>
        {nvEstoquePessoal > 0 && (
          <Badge variant="pi" size="sm">Estoque Pessoal: Isenta ≤ {parametros.limitePiEstoquePessoal} PI (1 PC)</Badge>
        )}
        {nvJaOuviFalar > 0 && (
          <Badge variant="ether" size="sm">Já Ouvi Falar: +{parametros.bonusExaminarJaOuviFalar} Examinar (1 PC)</Badge>
        )}
        {nvDataDeValidade > 0 && (
          <Badge variant="crise" size="sm">
            Data de Validade: {parametros.danoDataValidadeUnico} Dano {parametros.tipoDanoDataValidade} ({parametros.danoDataValidadeMulti} em 2+ alvos)
          </Badge>
        )}
        {nvVentosDoComercio > 0 && (
          <Badge variant="gold" size="sm">Item Raro / Material ≤ {parametros.orcamentoMaxItemRaroZenit}z (2 PC)</Badge>
        )}
        {temPorUmFuturoMelhor && <Badge variant="core" size="sm">Por um Futuro Melhor (Prosperidade: {prosperidadeAssentamento})</Badge>}
        {temCochiloPoderoso && <Badge variant="pv" size="sm">Cochilo Poderoso</Badge>}
        {temDosagemPrecisa && <Badge variant="pv" size="sm">Dosagem Precisa (150%)</Badge>}
      </div>

      {/* Gestão de Pontos de Comércio */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <FaCoins /> Carteira de Pontos de Comércio ({pontosComercio}/{parametros.maxPontosComercio || 0})
          </span>
          <div className={styles.badgesRow}>
            <Button variant="ghost" size="sm" onClick={() => handleAjustarPontosComercio(-1)} disabled={pontosComercio <= 0}>
              <FaMinus /> -1 PC
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAjustarPontosComercio(1)}
              disabled={parametros.maxPontosComercio > 0 && pontosComercio >= parametros.maxPontosComercio}
            >
              <FaPlus /> +1 PC
            </Button>
            {nvVentosDoComercio > 0 && (
              <Button variant="secondary" size="sm" onClick={() => handleDescansoComercial(false)}>
                <FaCampground /> Descanso Comercial (+{parametros.ganhoDescansoComercio} PC)
              </Button>
            )}
            {nvVerdadeiroTesouro > 0 && nvVentosDoComercio > 0 && (
              <Button variant="core" size="sm" onClick={handleVerdadeiroTesouro}>
                <FaHandshake /> Verdadeiro Tesouro (+{parametros.ganhoVerdadeiroTesouro} PC)
              </Button>
            )}
          </div>
        </div>

        {/* Usos Rápidos de 1 Ponto de Comércio */}
        <div className={styles.selectsRow}>
          {nvEstoquePessoal > 0 && (
            <Button variant="primary" size="sm" onClick={handleUsarEstoquePessoal} disabled={pontosComercio < 1}>
              <FaBoxOpen /> Estoque Pessoal (-1 PC → Ignorar ≤ {parametros.limitePiEstoquePessoal} PI)
            </Button>
          )}
          {nvJaOuviFalar > 0 && (
            <Button variant="secondary" size="sm" onClick={handleUsarJaOuviFalar} disabled={pontosComercio < 1}>
              <FaSearchPlus /> Já Ouvi Falar (-1 PC → +{parametros.bonusExaminarJaOuviFalar} Examinar)
            </Button>
          )}
          {temPorUmFuturoMelhor && (
            <>
              <Button variant="core" size="sm" onClick={handleConverterEmFabula} disabled={pontosComercio < 1}>
                Substituir Ponto de Fábula (-1 PC → +1 PF)
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleDescansoComercial(true)}>
                <FaCity /> Investir em Prosperidade (+{parametros.aumentoProsperidadePorDescanso} Prosp.)
              </Button>
            </>
          )}
        </div>

        {temPorUmFuturoMelhor && (
          <div className={styles.prosperidadeBox}>
            <span><strong>Prosperidade Local ({prosperidadeAssentamento} pts):</strong></span>
            <Badge variant={parametros.prosperidade.descontoZenit50 ? 'core' : 'default'} size="sm">
              10+: -50% Custo em Zênites
            </Badge>
            <Badge variant={parametros.prosperidade.descansoGratuito ? 'core' : 'default'} size="sm">
              15+: Descanso Grátis & Viagem máx. d8
            </Badge>
            <Badge variant={parametros.prosperidade.ultimaViloesDobrado ? 'core' : 'default'} size="sm">
              20+: Vilões Gastam 2× Ultima
            </Badge>
          </div>
        )}
      </div>

      {/* Ventos do Comércio (2 PC fora de conflito) */}
      {nvVentosDoComercio > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <FaHandshake /> Ventos do Comércio (Cena sem Conflito — 2 PC)
            </span>
            <Badge variant="gold" size="sm">Orçamento Máx: {parametros.orcamentoMaxItemRaroZenit}z</Badge>
          </div>

          <div className={styles.selectsRow}>
            <select
              value={tipoVentos}
              onChange={(e) => setTipoVentos(e.target.value)}
              className={styles.selectCompact}
            >
              <option value="item_raro">Criar Item Raro / Material (≤ {parametros.orcamentoMaxItemRaroZenit}z)</option>
              <option value="npc_local">Criar Contato NPC Local</option>
            </select>

            <Input
              placeholder={
                tipoVentos === 'item_raro'
                  ? 'Nome do item raro ou material...'
                  : 'Nome do NPC, ofício e como se conheceram...'
              }
              value={textoVentos}
              onChange={(e) => setTextoVentos(e.target.value)}
            />

            <Button
              variant="primary"
              size="sm"
              onClick={handleExecutarVentosDoComercio}
              disabled={pontosComercio < 2}
            >
              <FaCoins /> Executar (-2 PC)
            </Button>
          </div>

          {registrosComerciais.length > 0 && (
            <div className={styles.registrosList}>
              {registrosComerciais.slice(0, 4).map((reg) => (
                <div key={reg.id} className={styles.registroItem}>
                  <Badge variant={reg.tipo === 'item_raro' ? 'gold' : 'ether'} size="sm">
                    {reg.tipo === 'item_raro' ? `Item ≤ ${reg.valorMaxZenit}z` : 'NPC Local'}
                  </Badge>
                  <span>{reg.descricao}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {erroMsg && <div className={styles.erroBox}><FaExclamationTriangle /> {erroMsg}</div>}
      {feedback && <div className={styles.feedbackBox}><FaCheck /> {feedback}</div>}

      <div className={styles.printOnly}>
        <div><strong>Pontos de Comércio:</strong> {pontosComercio} / {parametros.maxPontosComercio}</div>
        <div>
          <strong>Vantagens Ativas:</strong>{' '}
          Estoque Pessoal (≤ {parametros.limitePiEstoquePessoal} PI) • Já Ouvi Falar (+{parametros.bonusExaminarJaOuviFalar}) • Data de Validade ({parametros.danoDataValidadeUnico} dano {parametros.tipoDanoDataValidade})
        </div>
      </div>
    </Card>
  );
}
