import React, { useState } from 'react';
import { FaShieldAlt, FaBolt, FaHeart, FaFistRaised, FaDice } from 'react-icons/fa';
import { GiBroadsword } from 'react-icons/gi';
import { Button, Badge } from '../../../../components/ui';
import { rolarAtaqueModuloVeiculo } from '../../../../domain/fabula/technoFantasyRules';
import styles from './ExibirPiloto.module.css';

export default function PilotoStatsVeiculo({
  stats,
  atributos = {},
  customizacoes = {},
  onChangeCustomizacao,
  nvPulsoFirme = 0,
  nvCoracao = 0,
  onAtivarCoracao
}) {
  const [resultadosRolagem, setResultadosRolagem] = useState({});

  const defVeiculo = Number(stats?.defesaTotal) || 0;
  const mdefVeiculo = Number(stats?.mdefTotal) || 0;
  const iniVeiculo = Number(stats?.iniciativaBonus) || 0;
  const precVeiculo = Number(stats?.precisaoBonus) || 0;
  const armasLista = stats?.armasInstaladas || [];

  const temAntiElemento = (stats?.suportesAtivos || []).some(
    (s) => s.id === 'suporte_anti_elemento'
  );
  const elementoEscolhido = customizacoes?.elementoAntiElemento || 'fogo';
  const usarPulsoFirme = !!customizacoes?.usarPulsoFirme;

  const handleRolarArma = (arma) => {
    const res = rolarAtaqueModuloVeiculo({
      moduloArma: arma,
      atributos,
      usarPulsoFirme,
      bonusPrecisaoExtra: precVeiculo,
      bonusDanoExtra: 0
    });
    setResultadosRolagem((prev) => ({
      ...prev,
      [arma.id]: res
    }));
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>
          <FaShieldAlt /> Estatísticas de Combate do Veículo
        </span>
        {stats?.armaduraAtiva && (
          <Badge variant="core" size="sm">
            {stats.armaduraAtiva.nome}
          </Badge>
        )}
      </div>

      {/* Grid de Estatísticas Finais */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Defesa Total</span>
          <span className={styles.statValue}>{defVeiculo}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Defesa Mágica</span>
          <span className={styles.statValue}>{mdefVeiculo}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Mod. Iniciativa</span>
          <span className={styles.statValue}>
            {iniVeiculo >= 0 ? `+${iniVeiculo}` : iniVeiculo}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Bônus Precisão</span>
          <span className={styles.statValue}>+{precVeiculo}</span>
        </div>
      </div>

      {/* Habilidade: Pulso Firme (NP 1) */}
      {nvPulsoFirme > 0 && (
        <div className={styles.antiElementConfig}>
          <FaFistRaised />
          <span><strong>Pulso Firme:</strong> Substitui um atributo por Vigor (VIG) nos Testes de Precisão.</span>
          <Button
            variant={usarPulsoFirme ? 'core' : 'ghost'}
            size="sm"
            onClick={() => onChangeCustomizacao('usarPulsoFirme', !usarPulsoFirme)}
          >
            {usarPulsoFirme ? 'Vigor Ativo' : 'Ativar Vigor'}
          </Button>
        </div>
      )}

      {/* Habilidade: Coração no Motor (NP 3) - Gasto fixo 10 PM */}
      {nvCoracao > 0 && onAtivarCoracao && (
        <div className={styles.antiElementConfig}>
          <FaHeart />
          <span><strong>Coração no Motor Nv. {nvCoracao} (10 PM):</strong></span>
          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAtivarCoracao('ataque')}
              title={`+${nvCoracao * 2} de dano no próximo ataque neste turno`}
            >
              +{nvCoracao * 2} Dano
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAtivarCoracao('defesa')}
              title={`Reduz o próximo dano sofrido em ${nvCoracao * 2}`}
            >
              -{nvCoracao * 2} Dano Sofrido
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAtivarCoracao('cura')}
              title="Cura as condições Lento e Fraco imediatamente"
            >
              Curar Lento/Fraco
            </Button>
          </div>
        </div>
      )}

      {/* Configuração Elemental do Módulo Anti-Elemento */}
      {temAntiElemento && (
        <div className={styles.antiElementConfig}>
          <FaBolt />
          <span><strong>Resistência Elemental (Módulo Anti-Elemento):</strong></span>
          <select
            className={styles.selectElemento}
            value={elementoEscolhido}
            onChange={(e) => onChangeCustomizacao('elementoAntiElemento', e.target.value)}
          >
            <option value="fogo">Fogo</option>
            <option value="gelo">Gelo</option>
            <option value="raio">Raio</option>
            <option value="ar">Ar</option>
            <option value="terra">Terra</option>
          </select>
          <Badge variant="ether" size="sm">
            Resistente a {elementoEscolhido.toUpperCase()}
          </Badge>
        </div>
      )}

      {/* Armas Acopladas */}
      <div className={styles.sectionTitle}>
        <GiBroadsword /> Armamentos Acoplados ({armasLista.length})
      </div>

      {armasLista.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhum módulo de arma ativo no momento. Ative uma arma na reserva para combater montado.
        </div>
      ) : (
        <div className={styles.weaponsList}>
          {armasLista.map((arma) => (
            <div key={arma.id} className={styles.weaponCard}>
              <div className={styles.weaponHeader}>
                <span className={styles.weaponName}>{arma.nome}</span>
                <div className={styles.weaponMetaRow}>
                  <Badge variant="default" size="sm">
                    {arma.alcanceFormatado}
                  </Badge>
                  <Badge variant="gold" size="sm">
                    {arma.categoria?.toUpperCase()}
                  </Badge>
                  <Badge variant={arma.maos === 2 ? 'crise' : 'secondary'} size="sm">
                    {arma.maos === 2 ? 'Duas Mãos' : 'Uma Mão'}
                  </Badge>
                </div>
              </div>

              <div className={styles.weaponMetaRow}>
                <div className={styles.weaponStat}>
                  Precisão: <span className={styles.weaponStatHighlight}>{arma.formulaPrecisaoFormatada}</span>
                  {arma.pulsoFirmeAtivo && ' (Pulso Firme)'}
                </div>
                <div className={styles.weaponStat}>
                  Dano: <span className={styles.weaponStatHighlight}>{arma.danoFormatado}</span> [{arma.tipoDanoFormatado}]
                </div>
              </div>

              <div className={styles.weaponDesc}>{arma.descricao}</div>
              {arma.propriedades && (
                <div className={styles.weaponProperty}>
                  ★ {arma.propriedades}
                </div>
              )}
              {arma.restricoes && (
                <div className={styles.weaponProperty}>
                  ⚠ {arma.restricoes}
                </div>
              )}

              <div className={styles.weaponActionsRow}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRolarArma(arma)}
                  title="Rolar Teste de Precisão e Dano"
                >
                  <FaDice /> Rolar Ataque
                </Button>
              </div>

              {resultadosRolagem[arma.id] && (
                <div className={styles.resultadoAtaqueBox}>
                  <div className={styles.resumoLinha}>
                    <span>
                      Precisão: <strong>{Number(resultadosRolagem[arma.id].testeAtaque) || 0}</strong>
                      {' '}({resultadosRolagem[arma.id].atr1Nome}: {Number(resultadosRolagem[arma.id].d1) || 0} + {resultadosRolagem[arma.id].atr2Nome}: {Number(resultadosRolagem[arma.id].d2) || 0}
                      {(Number(resultadosRolagem[arma.id].bonusPrecisaoTotal) || 0) > 0 ? ` +${Number(resultadosRolagem[arma.id].bonusPrecisaoTotal) || 0}` : ''})
                    </span>
                    {resultadosRolagem[arma.id].statusCritico && (
                      <Badge variant={resultadosRolagem[arma.id].statusCritico.includes('Erro') ? 'crise' : 'core'} size="sm">
                        {resultadosRolagem[arma.id].statusCritico}
                      </Badge>
                    )}
                  </div>
                  <div className={styles.resumoLinha}>
                    <span>
                      Dano [{resultadosRolagem[arma.id].tipoDano.toUpperCase()}]: <strong>{Number(resultadosRolagem[arma.id].danoTotal) || 0}</strong>
                      {' '}(TM: {Number(resultadosRolagem[arma.id].dadoMaisAlto) || 0} + {Number(resultadosRolagem[arma.id].bonusDanoTotal) || 0})
                    </span>
                    {resultadosRolagem[arma.id].pulsoFirmeAtivo && (
                      <Badge variant="ether" size="sm">Pulso Firme (VIG)</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={styles.printOnly}>
        <strong>DEF Final:</strong> {defVeiculo} | <strong>M.DEF Final:</strong> {mdefVeiculo} |{' '}
        <strong>Iniciativa:</strong> {iniVeiculo} | <strong>Precisão:</strong> +{precVeiculo}
        {armasLista.length > 0 && (
          <div>
            <strong>Armas:</strong>{' '}
            {armasLista.map(a => `${a.nome} (${a.formulaPrecisaoFormatada}, ${a.danoFormatado} ${a.tipoDanoFormatado})`).join('; ')}
          </div>
        )}
      </div>
    </div>
  );
}
