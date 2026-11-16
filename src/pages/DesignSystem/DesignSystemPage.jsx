import { useState } from 'react';
import {
  Button,
  Card,
  Badge,
  Input,
  Modal,
  ResourceBar
} from '../../components/ui';
import styles from './DesignSystemPage.module.css';

export default function DesignSystemPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const [pvAtual, setPvAtual] = useState(25);
  const [pvMax] = useState(60);
  const [pmAtual, setPmAtual] = useState(30);
  const [pmMax] = useState(40);
  const [piAtual, setPiAtual] = useState(4);
  const [piMax] = useState(6);
  const [inputText, setInputText] = useState('Rex / Pyra');

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className={styles.page}>
      {/* Topo / Barra de Ações */}
      <header className={styles.topBar}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Aetheria UI Design System</h1>
          <p className={styles.subtitle}>
            Inspirado em Fabula Ultima & Xenoblade Chronicles 2 — Suporte Híbrido (Tela & Impressão)
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleImprimir} className="no-print">
            🖨️ Simular / Imprimir Prévia
          </Button>
          <Button variant="primary" onClick={() => setModalAberto(true)} className="no-print">
            Abrir Modal de Teste
          </Button>
        </div>
      </header>

      {/* 1. Botões */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Buttons</h2>
        <div className={styles.row}>
          <Button variant="primary">Primary Ether</Button>
          <Button variant="secondary">Secondary Gold</Button>
          <Button variant="core">Core Crystal</Button>
          <Button variant="danger">Crisis Danger</Button>
          <Button variant="ghost">Ghost Action</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
        <div className={styles.row}>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </section>

      {/* 2. Badges */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Badges</h2>
        <div className={styles.row}>
          <Badge variant="default">Default</Badge>
          <Badge variant="gold">Relíquia Ouro</Badge>
          <Badge variant="ether">Éter Ciano</Badge>
          <Badge variant="core">Core Crystal</Badge>
          <Badge variant="pv">PV Normal</Badge>
          <Badge variant="pm">PM Magia</Badge>
          <Badge variant="pi">PI Inventário</Badge>
          <Badge variant="crise">Status de Crise</Badge>
        </div>
        <div className={styles.row}>
          <Badge variant="gold" size="sm">SM</Badge>
          <Badge variant="gold" size="md">MD</Badge>
          <Badge variant="gold" size="lg">LG</Badge>
        </div>
      </section>

      {/* 3. ResourceBars (PV, PM, PI + Crise Automática) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. ResourceBars & Fabula Ultima Crisis Logic</h2>
        <div className={styles.interactiveGrid}>
          <Card variant="default">
            <div className={styles.controlsPanel}>
              <h3 className={styles.cardTitle}>Simulador de Recursos</h3>
              <ResourceBar type="pv" current={pvAtual} max={pvMax} label="PV (Pontos de Vida)" />
              <ResourceBar type="pm" current={pmAtual} max={pmMax} label="PM (Pontos de Magia)" />
              <ResourceBar type="pi" current={piAtual} max={piMax} label="PI (Pontos de Inventário)" />

              <div className={`${styles.row} ${styles.simuladorButtons} no-print`}>
                <Button size="sm" variant="danger" onClick={() => setPvAtual((v) => Math.max(0, v - 10))}>
                  -10 PV
                </Button>
                <Button size="sm" variant="core" onClick={() => setPvAtual((v) => Math.min(pvMax, v + 10))}>
                  +10 PV
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setPvAtual(Math.floor(pvMax / 2))}>
                  Definir em Crise (30 PV)
                </Button>
              </div>
            </div>
          </Card>

          <Card variant="crise">
            <div className={styles.sampleCardContent}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Status do Personagem</h3>
                <Badge variant={pvAtual <= pvMax / 2 ? 'crise' : 'pv'}>
                  {pvAtual <= pvMax / 2 ? 'EM CRISE' : 'ESTÁVEL'}
                </Badge>
              </div>
              <p className={styles.cardDesc}>
                Quando os Pontos de Vida (PV) caem para metade do PV Máximo ou menos, a barra entra
                automaticamente em estado de <strong>CRISE</strong> com pulsos carmesins inspirados no sistema
                Fabula Ultima.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* 4. Cards Ornamentados JRPG */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Cards Ornamentados JRPG</h2>
        <div className={styles.grid}>
          <Card variant="default">
            <div className={styles.sampleCardContent}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Card Padrão</h4>
                <Badge variant="gold">Filigrana</Badge>
              </div>
              <p className={styles.cardDesc}>
                Bordas douradas filigranadas com cantos ornamentados JRPG e superfície translúcida no tom
                Mar de Nuvens.
              </p>
            </div>
          </Card>

          <Card variant="interactive">
            <div className={styles.sampleCardContent}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Card Interativo</h4>
                <Badge variant="ether">Hover Me</Badge>
              </div>
              <p className={styles.cardDesc}>
                Efeito hover com elevação suave e brilho dourado ressaltado nos quatro cantos ornamentados.
              </p>
            </div>
          </Card>

          <Card variant="ether">
            <div className={styles.sampleCardContent}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Card Éter Ciano</h4>
                <Badge variant="ether">Blade UI</Badge>
              </div>
              <p className={styles.cardDesc}>
                Inspirado nos elementos de interface etérea e Core Crystals de Alrest.
              </p>
            </div>
          </Card>

          <Card variant="crise">
            <div className={styles.sampleCardContent}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Card de Alerta / Crise</h4>
                <Badge variant="crise">Alerta</Badge>
              </div>
              <p className={styles.cardDesc}>
                Bordas carmesim com animação contínua de pulsação para situações de perigo ou batalha crítica.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* 5. Inputs */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Inputs</h2>
        <div className={styles.grid}>
          <Input
            label="Nome do Personagem"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            helperText="Ex: Piloto ou Lâmina de Xenoblade 2"
          />
          <Input
            label="Identificador do Cristal Núcleo"
            placeholder="Insira o código do núcleo..."
          />
          <Input
            label="Campo com Validação"
            defaultValue="Valor Inválido"
            error="O valor informado excede os Pontos de Inventário disponíveis."
          />
          <Input
            label="Campo Desabilitado"
            disabled
            value="Nível de Afinidade Máximo"
          />
        </div>
      </section>

      {/* Modal Reutilizável */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Ornamento de Comunhão de Lâminas"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button variant="core" onClick={() => setModalAberto(false)}>
              Despertar Cristal
            </Button>
          </>
        }
      >
        <div className={styles.modalBodyStack}>
          <p>
            Este é o componente modal reutilizável estilo JRPG com cantos filigranados e fundo
            translúcido com backdrop blur.
          </p>
          <ResourceBar type="pv" current={pvAtual} max={pvMax} label="PV do Piloto" />
          <Input
            label="Nome do Vínculo de Almas"
            placeholder="Digite o título da ressonância..."
          />
        </div>
      </Modal>
    </div>
  );
}
