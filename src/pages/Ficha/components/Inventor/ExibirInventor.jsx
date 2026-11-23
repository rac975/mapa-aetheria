import React, { useState } from 'react';
import { FaCogs } from 'react-icons/fa';
import { fichaService } from '../../../../services/fichaService';
import { Badge } from '../../../../components/ui';
import CustomAlert from '../../../../components/CustomAlert/CustomAlert';
import InventorRamosResumo from './InventorRamosResumo';
import InventorAlquimiaSecao from './InventorAlquimiaSecao';
import InventorInfusoesSecao from './InventorInfusoesSecao';
import InventorTecnomagiaSecao from './InventorTecnomagiaSecao';
import styles from './ExibirInventor.module.css';

const rolarDado = (faces) => Math.floor(Math.random() * faces) + 1;

export default function ExibirInventor({ classes, ficha, classe, fichaId, handleAjustarRecurso }) {
  const [tipoMistura, setTipoMistura] = useState('basica');
  const [resultadoAlquimia, setResultadoAlquimia] = useState(null);
  const [infusaoSelecionada, setInfusaoSelecionada] = useState(null);
  const [criandoCanhao, setCriandoCanhao] = useState(false);
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'alert' });

  const classeInventor = classe || classes?.find((c) => (c.nome_classe || '').toLowerCase().includes('inventor'));
  const nivelInventor = classeInventor ? (parseInt(classeInventor.nivel, 10) || 1) : 0;
  if (nivelInventor <= 0) return null;

  const habEngenhocas = (classeInventor?.habilidades || []).find((h) => (h.nome || '').toLowerCase().includes('engenhocas'));
  const nivelEngenhocas = habEngenhocas ? (parseInt(habEngenhocas.nivel, 10) || 0) : 0;
  if (nivelEngenhocas <= 0) return null;

  const ramos = habEngenhocas?.ramos || {};
  const ramoAlquimia = ramos.alquimia;
  const ramoInfusoes = ramos.infusoes;
  const ramoTecnomagia = ramos.tecnomagia;

  const temBasicoAlquimia = !!ramoAlquimia;
  const temAvancadoAlquimia = ramoAlquimia === 'avancado' || ramoAlquimia === 'superior';
  const temSuperiorAlquimia = ramoAlquimia === 'superior';

  const temBasicoInfusoes = !!ramoInfusoes;
  const temAvancadoInfusoes = ramoInfusoes === 'avancado' || ramoInfusoes === 'superior';
  const temSuperiorInfusoes = ramoInfusoes === 'superior';

  const temBasicoTecnomagia = !!ramoTecnomagia;
  const temAvancadoTecnomagia = ramoTecnomagia === 'avancado' || ramoTecnomagia === 'superior';
  const temSuperiorTecnomagia = ramoTecnomagia === 'superior';

  const tabelaAlvo = [
    { min: 1, max: 6, desc: 'Você ou um aliado que possa ver e esteja presente na cena.' },
    { min: 7, max: 11, desc: 'Um inimigo que você possa ver e esteja presente na cena.' },
    { min: 12, max: 16, desc: 'Você e todos os aliados presentes na cena.' },
    { min: 17, max: 20, desc: 'Todos os inimigos presentes na cena.' }
  ];

  const tabelaEfeito = {
    'Q': 'Recupera 30 PV ou Sofre 20 pontos de dano de veneno (aumenta para 30 no Nv. 20 e 40 no Nv. 40).',
    1: 'Considera Destreza e Vigor como de um passo maior (máx d12) até o fim do próximo turno.',
    2: 'Considera Astúcia e Vontade como de um passo maior (máx d12) até o fim do próximo turno.',
    3: 'Sofre 20 pontos de dano de ar (aumenta para 30 no Nv. 20 e 40 no Nv. 40).',
    4: 'Sofre 20 pontos de dano de raio (aumenta para 30 no Nv. 20 e 40 no Nv. 40).',
    5: 'Sofre 20 pontos de dano de trevas (aumenta para 30 no Nv. 20 e 40 no Nv. 40).',
    6: 'Sofre 20-40 de dano de terra.',
    7: 'Sofre 20-40 de dano de fogo.',
    8: 'Sofre 20-40 de dano de gelo.',
    9: 'Torna-se Resistente a dano de ar e de fogo até o fim da cena.',
    10: 'Torna-se Resistente a dano de gelo e de raio até o fim da cena.',
    11: 'Torna-se Resistente a dano de terra e de trevas até o fim da cena.',
    12: 'Fica enfurecida.',
    13: 'Fica envenenada.',
    14: 'Fica abalada, atordoada, lenta e fraca.',
    15: 'Recupera-se de todas as condições.',
    16: 'Recupera 50 PV e 50 PM.',
    17: 'Recupera 50 PV e 50 PM.',
    18: 'Recupera 100 PV.',
    19: 'Recupera 100 PM.',
    20: 'Recupera 100 PV e 100 PM.'
  };

  const executarAlquimia = () => {
    let custoPI = 3;
    let qtdDados = 2;

    if (tipoMistura === 'avancada') {
      custoPI = 4;
      qtdDados = 3;
    } else if (tipoMistura === 'superior') {
      custoPI = 5;
      qtdDados = 4;
    }

    const dadosRolados = Array.from({ length: qtdDados }, () => rolarDado(20));

    setResultadoAlquimia({
      tipo: tipoMistura,
      custoPI,
      dadosRolados
    });
  };

  const descreverAlvo = (valor) => {
    const item = tabelaAlvo.find(t => valor >= t.min && valor <= t.max);
    return item ? item.desc : 'Alvo personalizado';
  };

  const criarMagicanhão = async () => {
    const idPersonagem = fichaId || ficha?.id;

    if (!idPersonagem) {
      setAlerta({ isOpen: true, type: 'error', title: 'Erro', message: 'ID da ficha de personagem não encontrado!' });
      return;
    }

    setCriandoCanhao(true);

    try {
      const itensEquipados = await fichaService.getItensByFichaId(idPersonagem);
      const ocupado = (itensEquipados || []).some((i) => {
        const slot = i.stats_personalizados?.slot;
        return slot === 'mao_dominante' || slot === 'mao_secundaria';
      });

      if (ocupado) {
        setAlerta({ isOpen: true, type: 'warning', title: 'Mãos Ocupadas', message: 'Regra do Magicanhão: seus dois espaços de mão precisam estar vazios para criar e equipar o magicanhão!' });
        setCriandoCanhao(false);
        return;
      }

      const idsParaRemover = (itensEquipados || [])
        .filter((i) => (i.nome || '').toLowerCase().includes('magicanhão'))
        .map((i) => i.id);

      if (idsParaRemover.length > 0) {
        await fichaService.deletarItensPersonagemPorIds(idsParaRemover);
      }

      const novoCanhao = {
        ficha_id: idPersonagem,
        nome: 'Magicanhão',
        tipo: 'Arma de Fogo',
        stats_personalizados: {
          slot: 'mao_dominante',
          tipo_ataque: 'distancia',
          attr1: 'destreza',
          attr2: 'astucia',
          dano: 'RA + 10',
          defesa: 0,
          duas_maos: true
        }
      };

      const { error: erroInsercao } = await fichaService.addItemPersonagem(novoCanhao);
      if (erroInsercao) throw erroInsercao;

      setAlerta({ isOpen: true, type: 'success', title: 'Magicanhão Criado', message: 'Magicanhão criado, equipado nas mãos vazias e pronto para disparar!' });
    } catch (err) {
      console.error('Erro ao criar magicanhão:', err.message);
      setAlerta({ isOpen: true, type: 'error', title: 'Erro', message: 'Erro ao criar o magicanhão: ' + err.message });
    } finally {
      setCriandoCanhao(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>
          <FaCogs /> Laboratório de Inventor (Nível {nivelInventor})
        </span>
        <Badge variant="ether" size="sm">
          PI Máx: +2 Ativo • Projetos Liberados
        </Badge>
      </div>

      <InventorRamosResumo
        ramoAlquimia={ramoAlquimia}
        ramoInfusoes={ramoInfusoes}
        ramoTecnomagia={ramoTecnomagia}
      />

      {temBasicoAlquimia && (
        <InventorAlquimiaSecao
          tipoMistura={tipoMistura}
          setTipoMistura={setTipoMistura}
          temAvancadoAlquimia={temAvancadoAlquimia}
          temSuperiorAlquimia={temSuperiorAlquimia}
          onExecutarAlquimia={executarAlquimia}
          resultadoAlquimia={resultadoAlquimia}
          tabelaEfeito={tabelaEfeito}
          descreverAlvo={descreverAlvo}
        />
      )}

      {temBasicoInfusoes && (
        <InventorInfusoesSecao
          temAvancadoInfusoes={temAvancadoInfusoes}
          temSuperiorInfusoes={temSuperiorInfusoes}
          infusaoSelecionada={infusaoSelecionada}
          setInfusaoSelecionada={setInfusaoSelecionada}
        />
      )}

      {temBasicoTecnomagia && (
        <InventorTecnomagiaSecao
          ficha={ficha}
          handleAjustarRecurso={handleAjustarRecurso}
          temAvancadoTecnomagia={temAvancadoTecnomagia}
          temSuperiorTecnomagia={temSuperiorTecnomagia}
          onCriarMagicanhao={criarMagicanhão}
          criandoCanhao={criandoCanhao}
          classes={classes}
          fichaId={fichaId || ficha?.id}
        />
      )}

      <CustomAlert
        isOpen={alerta.isOpen}
        type={alerta.type}
        title={alerta.title}
        message={alerta.message}
        onClose={() => setAlerta((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}