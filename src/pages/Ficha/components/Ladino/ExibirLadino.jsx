import React, { useState } from 'react';
import { FaUserSecret, FaRunning, FaShieldAlt, FaCrosshairs, FaGhost } from 'react-icons/fa';
import { fichaService } from '../../../../services/fichaService';
import { calcularResultadoRouboDeAlma } from '../../../../domain/fabula/coreClassRules';
import { Button, Badge } from '../../../../components/ui';
import CustomAlert from '../../../../components/CustomAlert/CustomAlert';
import { useAlert } from '../../../../contexts/useAlert';
import styles from './ExibirLadino.module.css';

export default function ExibirLadino({ classes, ficha, classe, fichaId, atributosAtuais = {}, handleAjustarRecurso }) {
  const { showAlert } = useAlert();
  const [resultadoRoubo, setResultadoRoubo] = useState(null);
  const [alvoNivel, setAlvoNivel] = useState(5);
  const [tipoAlvo, setTipoAlvo] = useState('soldado');
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'alert' });

  const classeLadino = classe || classes?.find((c) => (c.nome_classe || '').toLowerCase().includes('ladino'));
  const nivelLadino = classeLadino ? (parseInt(classeLadino.nivel, 10) || 1) : 0;
  if (nivelLadino <= 0) return null;

  const habilidades = classeLadino?.habilidades || [];
  const getHabNivel = (nome) => {
    const h = habilidades.find((item) => (item.nome || '').toLowerCase().includes(nome.toLowerCase()));
    return h ? (parseInt(h.nivel, 10) || 0) : 0;
  };

  const nivelAltaVelocidade = getHabNivel('alta velocidade');
  const nivelEsquiva = getHabNivel('esquiva');
  const nivelGolpeBaixo = getHabNivel('golpe baixo');
  const nivelRouboAlma = getHabNivel('roubo de alma');
  const nivelVejoMaisTarde = getHabNivel('vejo você mais tarde');

  const usarAltaVelocidade = () => {
    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    if (mpAtual < 10) {
      showAlert("Você não tem MP suficiente (10 PM) para usar Alta Velocidade!");
      return;
    }
    handleAjustarRecurso('mp_atual', -10);
    showAlert(`⚡ Alta Velocidade ativada! 10 PM consumidos. Você ganha +${nivelAltaVelocidade} em testes da ação escolhida.`);
  };

  const executarRouboDeAlma = async () => {
    const idPersonagem = fichaId || ficha?.id;
    if (!idPersonagem) {
      showAlert("Erro: ID da ficha não encontrado.");
      return;
    }

    const dadoDes = atributosAtuais?.destreza || ficha?.destreza || 8;
    const dadoVon = atributosAtuais?.vontade || ficha?.vontade || 8;
    const roubo = calcularResultadoRouboDeAlma({
      nvRouboAlma: nivelRouboAlma,
      dadoDes,
      dadoVon,
      tipoAlvo,
      nivelAlvo: alvoNivel
    });

    let detalheFinal = roubo.detalhe;
    if (tipoAlvo !== 'soldado' && roubo.nomeTesouro) {
      try {
        const { error } = await fichaService.addItemPersonagem({
          ficha_id: idPersonagem,
          nome: roubo.nomeTesouro,
          tipo: 'Tesouro / Valioso',
          stats_personalizados: {
            origem: 'Roubo de Alma',
            valor_zenites: roubo.valorZenites,
            descricao: `Tesouro no valor de ${roubo.valorZenites} zênites obtido de um ${tipoAlvo} de nível ${alvoNivel}.`
          }
        });
        if (error) throw error;
        detalheFinal = `💎 ${roubo.nomeTesouro} (${roubo.valorZenites}z) adicionado à mochila em caso de acerto contra M.DEF!`;
      } catch (err) {
        console.error('Erro ao inserir tesouro:', err.message);
        detalheFinal = 'Rolagem concluída, mas houve erro ao registrar o tesouro na mochila.';
      }
    }

    setResultadoRoubo({
      rolagem: roubo.rolagem,
      faces: roubo.faces,
      bonus: roubo.bonus,
      total: roubo.total,
      detalhe: detalheFinal
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}><FaUserSecret /> Sombra do Ladino (Nível {nivelLadino})</span>
        <Badge variant="pv" size="sm">PI Máx: +2 Ativo</Badge>
      </div>

      <div className={styles.powersGrid}>
        <div className={styles.powerCard}>
          <div className={styles.powerTitleBlue}><FaShieldAlt /> Esquiva (Nv. {nivelEsquiva})</div>
          <div className={nivelEsquiva > 0 ? styles.powerDescActive : styles.powerDescInactive}>
            {nivelEsquiva > 0 ? `Defesa +${nivelEsquiva} (sem escudo/armadura marcial)` : 'Não Adquirido'}
          </div>
        </div>

        <div className={styles.powerCard}>
          <div className={styles.powerTitleGold}><FaCrosshairs /> Golpe Baixo (Nv. {nivelGolpeBaixo})</div>
          <div className={nivelGolpeBaixo > 0 ? styles.powerDescActive : styles.powerDescInactive}>
            {nivelGolpeBaixo > 0 ? `Dano extra: +(${nivelGolpeBaixo} + Condições do alvo único)` : 'Não Adquirido'}
          </div>
        </div>
      </div>

      {nivelAltaVelocidade > 0 && (
        <div className={styles.sectionBox}>
          <div className={styles.sectionTitleBlue}><FaRunning /> Alta Velocidade (Início de Conflito)</div>
          <div className={styles.sectionSubtitle}>
            Gasta 10 PM para ataque livre ou ação Impedimento/Objetivo com bônus de +{nivelAltaVelocidade} antes da 1ª rodada.
          </div>
          <Button type="button" variant="secondary" size="sm" fullWidth onClick={usarAltaVelocidade}>
            ⚡ Ativar Alta Velocidade (Gasta 10 PM)
          </Button>
        </div>
      )}

      {nivelRouboAlma > 0 && (
        <div className={styles.sectionBox}>
          <div className={styles.sectionTitlePurple}><FaGhost /> Roubo de Alma (Nv. {nivelRouboAlma})</div>
          <div className={styles.sectionSubtitle}>
            Teste de DES (d{atributosAtuais?.destreza || ficha?.destreza || 8}) + VON (d{atributosAtuais?.vontade || ficha?.vontade || 8}) + {nivelRouboAlma} contra M.DEF do alvo.
          </div>
          <div className={styles.inputsRow}>
            <select value={tipoAlvo} onChange={(e) => setTipoAlvo(e.target.value)} className={styles.selectAlvo}>
              <option value="soldado">Soldado (Recupera {nivelRouboAlma} PI)</option>
              <option value="elite">Elite (Tesouro da Alma)</option>
              <option value="campeao">Campeão (Tesouro da Alma)</option>
              <option value="vilao">Vilão (Tesouro da Alma x50)</option>
            </select>
            <input type="number" min="1" value={alvoNivel} onChange={(e) => setAlvoNivel(parseInt(e.target.value, 10) || 1)} placeholder="Nível" className={styles.inputNivel} />
          </div>
          <Button type="button" variant="core" size="sm" fullWidth onClick={executarRouboDeAlma}>
            👻 Executar Roubo de Alma (DES + VON)
          </Button>

          {resultadoRoubo && (
            <div className={styles.resultadoRouboBox}>
              <div>🎲 DES (d{resultadoRoubo.faces[0]}: {resultadoRoubo.rolagem[0]}) + VON (d{resultadoRoubo.faces[1]}: {resultadoRoubo.rolagem[1]}) + NP ({resultadoRoubo.bonus}) = <strong>{resultadoRoubo.total}</strong></div>
              <div className={styles.resultadoRouboMsg}>{resultadoRoubo.detalhe}</div>
            </div>
          )}
        </div>
      )}

      {nivelVejoMaisTarde > 0 && (
        <div className={styles.vejoMaisTardeBox}>
          <strong>Vejo Você Mais Tarde:</strong> Gasta 1 Ponto de Fábula para sumir da cena atual e reaparecer em outra com outro PJ.
        </div>
      )}

      <CustomAlert isOpen={alerta.isOpen} type={alerta.type} title={alerta.title} message={alerta.message} onClose={() => setAlerta((prev) => ({ ...prev, isOpen: false }))} />
    </div>
  );
}