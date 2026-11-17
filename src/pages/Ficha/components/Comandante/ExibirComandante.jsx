import {
  FaChessKnight,
  FaChessBishop,
  FaChessKing,
  FaChessQueen,
  FaChessRook,
  FaBullhorn,
  FaCheck,
  FaTimes,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Card, Button, Badge } from '../../../../components/ui';
import { useComandante } from './useComandante';
import styles from './ExibirComandante.module.css';

export default function ExibirComandante(props) {
  const {
    nivelComandante, nvCarga, nvCarruagem, nvDecreto, nvGambito, nvRoque,
    custoOrdemPadrao, temBatalhaIncessante, temTabulaRasa, emCriseGlobal, nivelTotal,
    opcaoDecreto, setOpcaoDecreto, opcaoRoque, setOpcaoRoque,
    ordemAtiva, feedback, erroMsg, handleExecutarOrdem, handleLimparOrdemAtiva
  } = useComandante(props);

  const danoTabula = nivelTotal >= 40 ? 30 : nivelTotal >= 20 ? 20 : 10;

  return (
    <Card variant="default" className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <FaBullhorn /> Comando Tático — Comandante
        </div>
        <div className={styles.badgesRow}>
          {nvCarruagem > 0 && (
            <Badge variant="ether" size="sm">
              <FaChessRook /> Carruagem Devastadora
            </Badge>
          )}
          {temBatalhaIncessante && (
            <Badge variant="gold" size="sm">Batalha Incessante (-50% PM)</Badge>
          )}
          {temTabulaRasa && emCriseGlobal && (
            <Badge variant="crise" size="sm">Tabula Rasa ({danoTabula} PV)</Badge>
          )}
          <Badge variant="gold" size="md">Nível {nivelComandante}</Badge>
        </div>
      </div>

      {ordemAtiva && (
        <div className={styles.ordemAtivaBox}>
          <div className={styles.ordemAtivaInfo}>
            <div className={styles.ordemAtivaTitulo}>Ordem em Vigor: {ordemAtiva.titulo}</div>
            <div className={styles.ordemAtivaDesc}>{ordemAtiva.efeito}</div>
            {ordemAtiva.extras?.map((ex, idx) => (
              <div key={idx} className={styles.ordemExtra}>• {ex}</div>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLimparOrdemAtiva}>
            <FaTimes /> Encerrar
          </Button>
        </div>
      )}

      <div className={styles.ordersGrid}>
        {nvCarga > 0 && (
          <div className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <span className={styles.orderName}><FaChessKnight /> Carga de Cavalaria</span>
              <Badge variant="pm" size="sm">NP {nvCarga} • {custoOrdemPadrao} PM</Badge>
            </div>
            <p className={styles.orderDesc}>
              Aliado que possa ouvi-lo faz ataque livre imediato com <strong>+{nvCarga} em Precisão</strong> (RA = 0 no dano).
            </p>
            <Button variant="primary" size="sm" fullWidth onClick={() => handleExecutarOrdem('carga_cavalaria', nvCarga)}>
              Ordenar Carga (-{custoOrdemPadrao} PM)
            </Button>
          </div>
        )}

        {nvDecreto > 0 && (
          <div className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <span className={styles.orderName}><FaChessBishop /> Decreto do Bispo</span>
              <Badge variant="pm" size="sm">NP {nvDecreto} • {custoOrdemPadrao} PM</Badge>
            </div>
            <select value={opcaoDecreto} onChange={(e) => setOpcaoDecreto(Number(e.target.value))} className={styles.select}>
              <option value={0}>Todos os custos em PM são dobrados</option>
              <option value={1}>Todas as fontes causam +{nvDecreto * 3} de dano adicional</option>
            </select>
            <Button variant="primary" size="sm" fullWidth onClick={() => handleExecutarOrdem('decreto_bispo', nvDecreto, opcaoDecreto)}>
              Proclamar Decreto (-{custoOrdemPadrao} PM)
            </Button>
          </div>
        )}

        {nvRoque > 0 && (
          <div className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <span className={styles.orderName}><FaChessKing /> Roque do Rei</span>
              <Badge variant="pm" size="sm">NP {nvRoque} • {custoOrdemPadrao} PM</Badge>
            </div>
            <select value={opcaoRoque} onChange={(e) => setOpcaoRoque(Number(e.target.value))} className={styles.select}>
              <option value={0}>Nenhuma criatura pode recuperar PV ou PM</option>
              <option value={1}>Restaurações de PM recuperam +{nvRoque * 5} PM</option>
            </select>
            <Button variant="primary" size="sm" fullWidth onClick={() => handleExecutarOrdem('roque_rei', nvRoque, opcaoRoque)}>
              Executar Roque (-{custoOrdemPadrao} PM)
            </Button>
          </div>
        )}

        {nvGambito > 0 && (
          <div className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <span className={styles.orderName}><FaChessQueen /> Gambito da Dama</span>
              <Badge variant="pv" size="sm">NP {nvGambito} • +{5 + nvGambito * 5} PV</Badge>
            </div>
            <p className={styles.orderDesc}>
              Ataque livre (RA = 0) e então: encadeia Ordem sem usar ação (paga PM) ou aliado recupera <strong>{5 + nvGambito * 5} PV</strong>.
            </p>
            <div className={styles.gambitoActions}>
              <Button variant="core" size="sm" onClick={() => handleExecutarOrdem('gambito_dama', nvGambito, 1)}>
                Ataque + Curar {5 + nvGambito * 5} PV
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleExecutarOrdem('gambito_dama', nvGambito, 0)}>
                Ataque + Encadear Ordem
              </Button>
            </div>
          </div>
        )}
      </div>

      {nvCarga + nvDecreto + nvRoque + nvGambito === 0 && (
        <div className={styles.emptyBox}>
          Adquira poderes ativos de Comandante (Carga, Decreto, Roque ou Gambito) para gerenciar ordens táticas aqui.
        </div>
      )}

      {erroMsg && <div className={styles.erroBox}><FaExclamationTriangle /> {erroMsg}</div>}
      {feedback && <div className={styles.feedbackBox}><FaCheck /> {feedback}</div>}

      <div className={styles.printOnly}>
        <strong>Ordens Disponíveis:</strong>
        {nvCarga > 0 && ` Carga de Cavalaria (+${nvCarga} Precisão, ${custoOrdemPadrao} PM) |`}
        {nvDecreto > 0 && ` Decreto do Bispo (+${nvDecreto * 3} Dano ou ×2 PM, ${custoOrdemPadrao} PM) |`}
        {nvRoque > 0 && ` Roque do Rei (Bloqueia cura ou +${nvRoque * 5} PM, ${custoOrdemPadrao} PM) |`}
        {nvGambito > 0 && ` Gambito da Dama (Cura ${5 + nvGambito * 5} PV ou encadeia)`}
      </div>
    </Card>
  );
}
