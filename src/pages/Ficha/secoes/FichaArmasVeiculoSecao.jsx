import React, { useState } from 'react';
import { FaCar, FaDice, FaFistRaised } from 'react-icons/fa';
import { GiBroadsword } from 'react-icons/gi';
import { Card, Button, Badge } from '../../../components/ui';
import { rolarAtaqueModuloVeiculo } from '../../../domain/fabula/technoFantasyRules';
import styles from './FichaArmasVeiculoSecao.module.css';

export default function FichaArmasVeiculoSecao({
  dadosVeiculo,
  atributos = {},
  nvPulsoFirme = 0
}) {
  const [usarPulsoFirme, setUsarPulsoFirme] = useState(false);
  const [resultadosRolagem, setResultadosRolagem] = useState({});

  if (!dadosVeiculo || !dadosVeiculo.armasInstaladas || dadosVeiculo.armasInstaladas.length === 0) {
    return null;
  }

  const { nome, armasInstaladas, precisaoBonus = 0 } = dadosVeiculo;

  const handleRolar = (arma) => {
    const res = rolarAtaqueModuloVeiculo({
      moduloArma: arma,
      atributos,
      usarPulsoFirme,
      bonusPrecisaoExtra: precisaoBonus,
      bonusDanoExtra: 0
    });
    setResultadosRolagem((prev) => ({
      ...prev,
      [arma.id]: res
    }));
  };

  return (
    <Card variant="default" className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>
          <GiBroadsword /> Armamentos do Veículo ({nome})
        </h3>
        <Badge variant="core" size="sm">
          <FaCar /> Veículo Operacional
        </Badge>
      </div>

      {nvPulsoFirme > 0 && (
        <div className={styles.pulsoFirmeBar}>
          <FaFistRaised />
          <span>
            <strong>Pulso Firme:</strong> Substitui um dado de atributo por Vigor (VIG).
          </span>
          <Button
            variant={usarPulsoFirme ? 'core' : 'ghost'}
            size="sm"
            onClick={() => setUsarPulsoFirme((prev) => !prev)}
          >
            {usarPulsoFirme ? 'VIG Ativo' : 'Ativar VIG'}
          </Button>
        </div>
      )}

      <div className={styles.weaponsGrid}>
        {armasInstaladas.map((arma) => {
          const resultado = resultadosRolagem[arma.id];
          return (
            <div key={arma.id} className={styles.weaponCard}>
              <div className={styles.weaponHeader}>
                <span className={styles.weaponName}>{arma.nome}</span>
                <div className={styles.metaRow}>
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

              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  Precisão: <span className={styles.statHighlight}>{arma.formulaPrecisaoFormatada}</span>
                  {usarPulsoFirme && ' (VIG)'}
                </div>
                <div className={styles.statItem}>
                  Dano: <span className={styles.statHighlight}>{arma.danoFormatado}</span> [{arma.tipoDanoFormatado}]
                </div>
              </div>

              <div className={styles.desc}>{arma.descricao}</div>

              {arma.propriedades && (
                <div className={styles.propriedade}>★ {arma.propriedades}</div>
              )}
              {arma.restricoes && (
                <div className={styles.restricao}>⚠ {arma.restricoes}</div>
              )}

              <div className={styles.actionsRow}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRolar(arma)}
                  title="Rolar Teste de Precisão e Dano com esta arma veicular"
                >
                  <FaDice /> Rolar Ataque
                </Button>
              </div>

              {resultado && (
                <div className={styles.resultadoBox}>
                  <div className={styles.resultadoLinha}>
                    <span>
                      Precisão: <strong>{Number(resultado.testeAtaque) || 0}</strong>
                      {' '}({resultado.atr1Nome}: {Number(resultado.d1) || 0} + {resultado.atr2Nome}: {Number(resultado.d2) || 0}
                      {(Number(resultado.bonusPrecisaoTotal) || 0) > 0 ? ` +${Number(resultado.bonusPrecisaoTotal) || 0}` : ''})
                    </span>
                    {resultado.statusCritico && (
                      <Badge
                        variant={resultado.statusCritico.includes('Erro') ? 'crise' : 'core'}
                        size="sm"
                      >
                        {resultado.statusCritico}
                      </Badge>
                    )}
                  </div>
                  <div className={styles.resultadoLinha}>
                    <span>
                      Dano [{(resultado.tipoDano || 'fisico').toUpperCase()}]: <strong>{Number(resultado.danoTotal) || 0}</strong>
                      {' '}(TM: {Number(resultado.dadoMaisAlto) || 0} + {Number(resultado.bonusDanoTotal) || 0})
                    </span>
                    {resultado.pulsoFirmeAtivo && (
                      <Badge variant="ether" size="sm">Pulso Firme</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
