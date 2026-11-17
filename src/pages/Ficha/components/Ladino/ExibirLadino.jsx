import React, { useState } from 'react';
import { FaUserSecret, FaRunning, FaShieldAlt, FaCrosshairs, FaGhost } from 'react-icons/fa';
import { fichaService } from '../../../../services/fichaService';
import { Button, Badge } from '../../../../components/ui';
import { useAlert } from '../../../../contexts/useAlert';
import styles from './ExibirLadino.module.css';

const rolarDado = (faces) => Math.floor(Math.random() * faces) + 1;

export default function ExibirLadino({ classes, ficha, fichaId, handleAjustarRecurso }) {
  const { showAlert } = useAlert();
  // Estado para resultados de Roubo de Alma ou interações
  const [resultadoRoubo, setResultadoRoubo] = useState(null);
  const [alvoNivel, setAlvoNivel] = useState(5);
  const [tipoAlvo, setTipoAlvo] = useState('soldado'); // soldado, elite, campeao, vilao

  // 1. Encontra a classe Ladino e suas habilidades
  const classeLadino = classes?.find(c => (c.nome_classe || '').toLowerCase().includes('ladino'));
  const nivelLadino = classeLadino ? (parseInt(classeLadino.nivel, 10) || 1) : 0;

  if (nivelLadino <= 0) return null;

  // 2. Extrai as habilidades e seus níveis
  const habilidades = classeLadino?.habilidades || [];
  const getHabNivel = (nome) => {
    const h = habilidades.find(item => (item.nome || '').toLowerCase().includes(nome.toLowerCase()));
    return h ? (parseInt(h.nivel, 10) || 0) : 0;
  };

  const nivelAltaVelocidade = getHabNivel('alta velocidade');
  const nivelEsquiva = getHabNivel('esquiva');
  const nivelGolpeBaixo = getHabNivel('golpe baixo');
  const nivelRouboAlma = getHabNivel('roubo de alma');
  const nivelVejoMaisTarde = getHabNivel('vejo você mais tarde');

  // Função para Alta Velocidade (Gasta 10 PM)
  const usarAltaVelocidade = () => {
    const mpAtual = ficha?.mp_atual ?? 0;
    if (mpAtual < 10) {
      showAlert("Você não tem MP suficiente (10 PM) para usar Alta Velocidade!");
      return;
    }
    handleAjustarRecurso('mp_atual', -10);
    showAlert(`⚡ Alta Velocidade ativada! 10 PM consumidos. Você ganha +${nivelAltaVelocidade} em testes da ação escolhida.`);
  };

  // Função para Roubo de Alma (Gasta Ação, Roda DES+VON)
  const executarRouboDeAlma = async () => {
    const idPersonagem = fichaId || ficha?.id;
    if (!idPersonagem) {
      showAlert("Erro: ID da ficha não encontrado.");
      return;
    }

    const bonusNp = nivelRouboAlma;
    const d1 = rolarDado(20);
    const d2 = rolarDado(20);
    const totalRolagem = d1 + d2 + bonusNp;

    let mensagemResultado = '';
    if (tipoAlvo === 'soldado') {
      mensagemResultado = `🎯 Sucesso contra Soldado! Você recuperou ${bonusNp} PI.`;
    } else {
      const multiplicador = tipoAlvo === 'vilao' ? 50 : 30;
      const valorZenites = alvoNivel * multiplicador;
      const nomeItem = `Tesouro da Alma (${tipoAlvo.toUpperCase()} Nv. ${alvoNivel})`;

      try {
        const { error } = await fichaService.addItemPersonagem({
          ficha_id: idPersonagem,
          nome: nomeItem,
          tipo: 'Tesouro / Valioso',
          stats_personalizados: {
            origem: 'Roubo de Alma',
            valor_zenites: valorZenites,
            descricao: `Tesouro no valor de ${valorZenites} zênites obtido de um ${tipoAlvo} de nível ${alvoNivel}.`
          }
        });

        if (error) throw error;
        mensagemResultado = `💎 Tesouro da Alma obtido! Um item no valor de ${valorZenites} zênites foi adicionado à sua mochila.`;
      } catch (err) {
        console.error("Erro ao inserir tesouro:", err.message);
        mensagemResultado = "Erro ao adicionar o tesouro na mochila.";
      }
    }

    setResultadoRoubo({
      rolagem: [d1, d2],
      bonus: bonusNp,
      total: totalRolagem,
      detalhe: mensagemResultado
    });
  };

  return (
    <div className={styles.container}>
      {/* Título do Painel */}
      <div className={styles.header}>
        <span className={styles.title}>
          <FaUserSecret /> Sombra do Ladino (Nível {nivelLadino})
        </span>
        <Badge variant="pv" size="sm">
          PI Máx: +2 Ativo
        </Badge>
      </div>

      {/* Resumo dos Poderes Ativos */}
      <div className={styles.powersGrid}>
        {/* Esquiva */}
        <div className={styles.powerCard}>
          <div className={styles.powerTitleBlue}>
            <FaShieldAlt /> Esquiva (Nv. {nivelEsquiva})
          </div>
          <div className={nivelEsquiva > 0 ? styles.powerDescActive : styles.powerDescInactive}>
            {nivelEsquiva > 0 ? `Defesa +${nivelEsquiva} (sem escudo/armadura marcial)` : 'Não Adquirido'}
          </div>
        </div>

        {/* Golpe Baixo */}
        <div className={styles.powerCard}>
          <div className={styles.powerTitleGold}>
            <FaCrosshairs /> Golpe Baixo (Nv. {nivelGolpeBaixo})
          </div>
          <div className={nivelGolpeBaixo > 0 ? styles.powerDescActive : styles.powerDescInactive}>
            {nivelGolpeBaixo > 0 ? `Dano extra: Nv + Condições` : 'Não Adquirido'}
          </div>
        </div>
      </div>

      {/* 1. ALTA VELOCIDADE */}
      {nivelAltaVelocidade > 0 && (
        <div className={styles.sectionBox}>
          <div className={styles.sectionTitleBlue}>
            <FaRunning /> Alta Velocidade (Início de Conflito)
          </div>
          <div className={styles.sectionSubtitle}>
            Gasta 10 PM para ataque livre ou ação de Impedimento/Objetivo com bônus de +${nivelAltaVelocidade} antes da 1ª rodada.
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth
            onClick={usarAltaVelocidade}
          >
            ⚡ Ativar Alta Velocidade (Gasta 10 PM)
          </Button>
        </div>
      )}

      {/* 2. ROUBO DE ALMA */}
      {nivelRouboAlma > 0 && (
        <div className={styles.sectionBox}>
          <div className={styles.sectionTitlePurple}>
            <FaGhost /> Roubo de Alma (Nv. {nivelRouboAlma})
          </div>
          <div className={styles.sectionSubtitle}>
            Teste de DES + VON (+{nivelRouboAlma} bônus) contra Defesa Mágica do alvo para recuperar PI ou gerar tesouro.
          </div>

          <div className={styles.inputsRow}>
            <select
              value={tipoAlvo}
              onChange={(e) => setTipoAlvo(e.target.value)}
              className={styles.selectAlvo}
            >
              <option value="soldado">Soldado (Recupera PI)</option>
              <option value="elite">Elite (Tesouro da Alma)</option>
              <option value="campeao">Campeão (Tesouro da Alma)</option>
              <option value="vilao">Vilão (Tesouro da Alma x50)</option>
            </select>

            <input
              type="number"
              value={alvoNivel}
              onChange={(e) => setAlvoNivel(parseInt(e.target.value, 10) || 1)}
              placeholder="Nível do Alvo"
              className={styles.inputNivel}
            />
          </div>

          <Button
            type="button"
            variant="core"
            size="sm"
            fullWidth
            onClick={executarRouboDeAlma}
          >
            👻 Executar Roubo de Alma
          </Button>

          {resultadoRoubo && (
            <div className={styles.resultadoRouboBox}>
              <div>🎲 Rolagem: [{resultadoRoubo.rolagem.join(', ')}] + Bônus ({resultadoRoubo.bonus}) = <strong>{resultadoRoubo.total}</strong></div>
              <div className={styles.resultadoRouboMsg}>{resultadoRoubo.detalhe}</div>
            </div>
          )}
        </div>
      )}

      {/* 3. VEJO VOCÊ MAIS TARDE */}
      {nivelVejoMaisTarde > 0 && (
        <div className={styles.vejoMaisTardeBox}>
          <strong>Vejo Você Mais Tarde:</strong> Gasta 1 Ponto de Fábula para sumir da cena atual e reaparecer em outra com outro PJ.
        </div>
      )}
    </div>
  );
}
