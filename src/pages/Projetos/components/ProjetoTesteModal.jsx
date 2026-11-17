import { useState, useMemo } from 'react';
import { FaDiceD20, FaSun, FaCheck } from 'react-icons/fa';
import { Modal, Button, Badge, Input } from '../../../components/ui';
import {
  rolarTesteProjeto,
  calcularProgressoDiario,
  estimarDiasRestantes
} from '../../../domain/fabula/projetoRules';
import styles from './ProjetoTesteModal.module.css';

const DADOS_OPCOES = ['d6', 'd8', 'd10', 'd12'];

export default function ProjetoTesteModal({
  isOpen,
  onClose,
  projeto,
  isMestre,
  onAplicarProgresso
}) {
  const [dado1, setDado1] = useState('d8');
  const [dado2, setDado2] = useState('d8');
  const [bonus, setBonus] = useState(0);
  const [resultadoTeste, setResultadoTeste] = useState(null);

  const [pjsTrabalhando, setPjsTrabalhando] = useState(1);
  const [inventores, setInventores] = useState(0);
  const [nivelVisionario, setNivelVisionario] = useState(0);

  const calculoDiario = useMemo(
    () => calcularProgressoDiario({
      pjsTrabalhando,
      inventoresSemVisionario: inventores,
      niveisVisionario: nivelVisionario > 0 ? [nivelVisionario] : []
    }),
    [pjsTrabalhando, inventores, nivelVisionario]
  );

  if (!projeto) return null;

  const diasEstimados = estimarDiasRestantes(
    projeto.progresso_atual,
    projeto.progresso_total,
    calculoDiario.totalDiario
  );

  const handleRolar = () => {
    const res = rolarTesteProjeto(dado1, dado2, projeto.nd_teste, { bonus });
    setResultadoTeste(res);
  };

  const handleAplicar = async (delta) => {
    if (!isMestre || !onAplicarProgresso || delta <= 0) return;
    await onAplicarProgresso(projeto, delta);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Oficina: ${projeto.titulo}`}
      size="md"
    >
      <div className={styles.container}>
        <section className={styles.box}>
          <div className={styles.boxHeader}>
            <h4><FaSun /> Progresso Diário (Downtime)</h4>
            <Badge variant="gold" size="sm">
              +{calculoDiario.totalDiario} prog/dia
            </Badge>
          </div>
          <div className={styles.row3}>
            <Input
              label="PJs no Projeto"
              type="number"
              min={1}
              max={8}
              value={pjsTrabalhando}
              onChange={(e) => setPjsTrabalhando(Number(e.target.value))}
            />
            <Input
              label="Inventores (+1)"
              type="number"
              min={0}
              max={6}
              value={inventores}
              onChange={(e) => setInventores(Number(e.target.value))}
            />
            <Input
              label="Visionário (NP)"
              type="number"
              min={0}
              max={5}
              value={nivelVisionario}
              onChange={(e) => setNivelVisionario(Number(e.target.value))}
            />
          </div>
          <div className={styles.boxFooter}>
            <span className={styles.hint}>
              Restam ~<strong>{diasEstimados}</strong> {diasEstimados === 1 ? 'dia' : 'dias'} neste ritmo.
            </span>
            {isMestre && (
              <Button
                variant="core"
                size="sm"
                onClick={() => handleAplicar(calculoDiario.totalDiario)}
              >
                <FaCheck /> Aplicar Dia (+{calculoDiario.totalDiario})
              </Button>
            )}
          </div>
        </section>

        <section className={styles.box}>
          <div className={styles.boxHeader}>
            <h4><FaDiceD20 /> Teste de Projeto [{projeto.atributos_teste}]</h4>
            <Badge variant="ether" size="sm">ND {projeto.nd_teste}</Badge>
          </div>

          <div className={styles.row3}>
            <div className={styles.selectGroup}>
              <label className={styles.label}>Dado 1</label>
              <select className={styles.select} value={dado1} onChange={(e) => setDado1(e.target.value)}>
                {DADOS_OPCOES.map((d) => <option key={d} value={d}>{d.toUpperCase()}</option>)}
              </select>
            </div>
            <div className={styles.selectGroup}>
              <label className={styles.label}>Dado 2</label>
              <select className={styles.select} value={dado2} onChange={(e) => setDado2(e.target.value)}>
                {DADOS_OPCOES.map((d) => <option key={d} value={d}>{d.toUpperCase()}</option>)}
              </select>
            </div>
            <Input
              label="Bônus"
              type="number"
              min={-5}
              max={15}
              value={bonus}
              onChange={(e) => setBonus(Number(e.target.value))}
            />
          </div>

          <Button variant="primary" fullWidth onClick={handleRolar}>
            <FaDiceD20 /> Rolar Teste de Oficina
          </Button>

          {resultadoTeste && (
            <div className={`${styles.resultBox} ${resultadoTeste.sucesso ? styles.resultOk : styles.resultFail}`}>
              <div className={styles.resultTop}>
                <strong>
                  {resultadoTeste.critico && '✨ SUCESSO CRÍTICO!'}
                  {resultadoTeste.desastre && '💥 DESASTRE!'}
                  {!resultadoTeste.critico && !resultadoTeste.desastre && (resultadoTeste.sucesso ? '✅ SUCESSO' : '❌ FALHA')}
                </strong>
                <span className={styles.diceReadout}>
                  [{resultadoTeste.dado1} + {resultadoTeste.dado2}{resultadoTeste.bonus ? ` + ${resultadoTeste.bonus}` : ''}] = <strong>{resultadoTeste.total}</strong> vs ND {resultadoTeste.nd}
                </span>
              </div>
              <p className={styles.resultDesc}>
                Progresso gerado: <strong>+{resultadoTeste.progressoGerado}</strong>
                {resultadoTeste.desastre && ' — Complicação narrativa na oficina!'}
              </p>
              {isMestre && resultadoTeste.progressoGerado > 0 && (
                <Button
                  variant="core"
                  size="sm"
                  onClick={() => handleAplicar(resultadoTeste.progressoGerado)}
                >
                  <FaCheck /> Aplicar +{resultadoTeste.progressoGerado} ao Relógio
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
