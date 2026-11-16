import React from 'react';
import { FaCar, FaCompressAlt, FaExpandAlt, FaSave, FaCheck } from 'react-icons/fa';
import { Button, Badge } from '../../../../components/ui';
import { COMPRESSION_TECH_IP_COST } from '../../../../domain/fabula/technoFantasyRules';
import styles from './ExibirPiloto.module.css';

export default function PilotoHeader({
  nomeVeiculo,
  onChangeNome,
  nivelPiloto,
  veiculoInvocado,
  custoCompressao = 0,
  onAlternarCompressao,
  onSalvar,
  salvando,
  salvoSucesso
}) {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.title}>
          <FaCar /> Veículo Pessoal — Piloto Nv. {nivelPiloto}
        </div>
        <div className={styles.nomeVeiculoWrapper}>
          <input
            type="text"
            className={styles.inputNomeVeiculo}
            value={nomeVeiculo || ''}
            onChange={(e) => onChangeNome(e.target.value)}
            placeholder="Nome do Veículo (ex: Titã de Éter)"
            maxLength={40}
          />
          <Badge variant={veiculoInvocado ? 'core' : 'pi'} size="sm">
            {veiculoInvocado ? 'Operacional' : 'Comprimido'}
          </Badge>
        </div>
      </div>

      <div className={styles.headerActions}>
        <Button
          variant="secondary"
          size="sm"
          onClick={onAlternarCompressao}
          title={`Comprimir ou Invocar Veículo (${custoCompressao > 0 ? `${custoCompressao} PI` : '0 PI'})`}
        >
          {veiculoInvocado ? <FaCompressAlt /> : <FaExpandAlt />}
          {veiculoInvocado ? ' Comprimir' : ' Invocar'} ({custoCompressao > 0 ? `-${custoCompressao} PI` : '0 PI'})
        </Button>

        <Button
          variant={salvoSucesso ? 'core' : 'primary'}
          size="sm"
          onClick={onSalvar}
          disabled={salvando}
        >
          {salvoSucesso ? <FaCheck /> : <FaSave />}
          {salvando ? ' Salvando...' : salvoSucesso ? ' Salvo!' : ' Salvar Veículo'}
        </Button>
      </div>

      <div className={styles.printOnly}>
        <strong>Veículo:</strong> {nomeVeiculo || 'Veículo Pessoal'} |{' '}
        <strong>Status:</strong> {veiculoInvocado ? 'Operacional' : 'Comprimido'} |{' '}
        <strong>Piloto Nv:</strong> {nivelPiloto}
      </div>
    </div>
  );
}
