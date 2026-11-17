import { useState } from 'react';
import { FaBoxOpen, FaCoins, FaFlask, FaHeart, FaSkullCrossbones } from 'react-icons/fa';
import { MdWaterDrop } from 'react-icons/md';
import { fichaService } from '../../../services/fichaService';
import { ehClasseMercador, normalizarTextoNF } from '../../../domain/fabula/naturalFantasyRules';
import { ResourceBar, Button, Badge } from '../../../components/ui';
import styles from './FichaPIComponent.module.css';

export default function FichaPIComponent({
    ficha,
    setFicha,
    piMaxCalculado,
    statusFicha = null,
    classes = [],
    onAtualizarDadosClasse = null
}) {
    const [usarEstoquePessoal, setUsarEstoquePessoal] = useState(false);
    const [feedbackPi, setFeedbackPi] = useState('');

    if (!ficha) return null;

    const piAtual = ficha.pi_atual ?? ficha.ip_atual ?? 6;
    const piMax = piMaxCalculado ?? ficha.pi_max ?? ficha.ip_max ?? 6;
    const zenitAtual = ficha.zenit ?? 0;

    const nf = statusFicha?.naturalFantasy || null;
    const mercadorInfo = nf?.mercador || {};
    const temDosagemPrecisa = Boolean(nf?.temDosagemPrecisa);
    const reducaoBolsosFundos = Number(statusFicha?.reducaoCustoPi) || 0;
    const descontoProsperidade = Boolean(mercadorInfo?.prosperidade?.descontoZenit50);
    const custoPorPiVila = descontoProsperidade ? 5 : 10;

    const podeUsarEstoquePessoal = Boolean(
        mercadorInfo.ativo &&
        mercadorInfo.nvEstoquePessoal > 0 &&
        mercadorInfo.pontosComercioAtuais >= 1
    );

    const descontarPontoComercioMercador = async () => {
        const novoPc = Math.max(0, (mercadorInfo.pontosComercioAtuais || 0) - 1);
        const mercadorCls = (classes || []).find((c) => ehClasseMercador(c.nome_classe));
        const dadosAntigos = mercadorCls?.dados_mercador || {};
        const payload = { ...dadosAntigos, pontosComercio: novoPc };

        if (ficha.id) {
            await fichaService.salvarDadosMercador(ficha.id, payload, classes);
        }
        if (onAtualizarDadosClasse) {
            onAtualizarDadosClasse(
                (c) => ehClasseMercador(c.nome_classe),
                (c) => ({
                    ...c,
                    dados_mercador: payload,
                    habilidades: (c.habilidades || []).map((h) =>
                        normalizarTextoNF(h?.nome).includes('ventos do comercio')
                            ? { ...h, dados_mercador: payload }
                            : h
                    )
                })
            );
        }
    };

    // Função genérica para atualizar PIs e outros recursos no Supabase e estado local
    const atualizarFichaNoBanco = async (novosDados) => {
        const dadosAtualizados = { ...ficha, ...novosDados };
        setFicha(dadosAtualizados);

        try {
            await fichaService.atualizarFicha(ficha.id, novosDados);
        } catch (error) {
            console.error('Erro ao atualizar ficha:', error);
        }
    };

    const alterarPI = async (quantidade) => {
        const novoPiAtual = Math.max(0, Math.min(piMax, piAtual + quantidade));
        await atualizarFichaNoBanco({ pi_atual: novoPiAtual, ip_atual: novoPiAtual });
    };

    const recarregarPIs = async () => {
        const piFaltando = piMax - piAtual;
        if (piFaltando <= 0) return;

        const custoTotal = piFaltando * custoPorPiVila;
        if (zenitAtual < custoTotal) {
            alert(`Você precisa de ${custoTotal}z para recuperar todos os PIs, mas só tem ${zenitAtual}z!`);
            return;
        }

        const novoZenit = zenitAtual - custoTotal;
        await atualizarFichaNoBanco({ pi_atual: piMax, ip_atual: piMax, zenit: novoZenit });
    };

    // ==========================================
    // USAR CONSUMÍVEL POR PI (Regras Oficiais + Estoque Pessoal + Data de Validade + Dosagem Precisa)
    // ==========================================
    const usarConsumivel = async (custoBasePI, tipoEfeito) => {
        setFeedbackPi('');
        const custoComBolsos = Math.max(1, custoBasePI - reducaoBolsosFundos);
        const isentoPorEstoque = Boolean(
            usarEstoquePessoal &&
            podeUsarEstoquePessoal &&
            custoComBolsos <= (mercadorInfo.limitePiEstoquePessoal || 0)
        );
        const custoFinalPI = isentoPorEstoque ? 0 : custoComBolsos;

        if (piAtual < custoFinalPI) {
            alert(`Você precisa de ${custoFinalPI} PIs disponíveis, mas só tem ${piAtual} na mochila!`);
            return;
        }

        if (isentoPorEstoque) {
            await descontarPontoComercioMercador();
        }

        const novoPiAtual = piAtual - custoFinalPI;
        const novosDados = { pi_atual: novoPiAtual, ip_atual: novoPiAtual };
        const multiplicadorMax = temDosagemPrecisa ? 1.5 : 1;

        if (tipoEfeito === 'remedio') {
            const hpMax = Math.floor((statusFicha?.pvMax || ficha.hp_max || 100) * multiplicadorMax);
            const hpAtual = ficha.hp_atual || 0;
            novosDados.hp_atual = Math.min(hpMax, hpAtual + 50);
            setFeedbackPi(`Remédio usado (+50 PV)${isentoPorEstoque ? ' [0 PI via Estoque Pessoal]' : ''}!`);
        } else if (tipoEfeito === 'elixir') {
            const mpMax = Math.floor((statusFicha?.mpMax || ficha.mp_max || 50) * multiplicadorMax);
            const mpAtual = ficha.mp_atual || 0;
            novosDados.mp_atual = Math.min(mpMax, mpAtual + 50);
            setFeedbackPi(`Elixir usado (+50 PM)${isentoPorEstoque ? ' [0 PI via Estoque Pessoal]' : ''}!`);
        } else if (tipoEfeito === 'tonico') {
            setFeedbackPi(`✨ Tônico utilizado! Uma condição foi removida${isentoPorEstoque ? ' [0 PI via Estoque Pessoal]' : ''}.`);
        } else if (tipoEfeito === 'data_validade') {
            setFeedbackPi(
                `☠️ Data de Validade: Poção convertida em ${mercadorInfo.danoDataValidadeUnico} de dano de ${mercadorInfo.tipoDanoDataValidade || 'veneno'} (${mercadorInfo.danoDataValidadeMulti} se 2+ alvos)!`
            );
        }

        await atualizarFichaNoBanco(novosDados);
    };

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <h3 className={styles.title}>
                    <FaBoxOpen /> Pontos de Inventário (PI)
                </h3>
                <Badge variant="gold" size="md">
                    {piAtual} / {piMax} PI
                </Badge>
            </div>

            {/* Barra Visual de PIs */}
            <ResourceBar
                type="pi"
                current={piAtual}
                max={piMax}
                label="Pontos de Inventário (Mochila)"
                showValues={true}
            />

            {/* BOTÕES DE USO RÁPIDO DE CONSUMÍVEIS */}
            <div className={styles.consumiveisSection}>
                <span className={styles.consumiveisLabel}>
                    Criar e usar consumível imediatamente:
                </span>
                {podeUsarEstoquePessoal && (
                    <Button
                        type="button"
                        variant={usarEstoquePessoal ? 'core' : 'ghost'}
                        size="sm"
                        onClick={() => setUsarEstoquePessoal((p) => !p)}
                    >
                        {usarEstoquePessoal
                            ? `✓ Estoque Pessoal Ativo (-1 PC → Isenta ≤ ${mercadorInfo.limitePiEstoquePessoal} PI)`
                            : `Usar Estoque Pessoal (${mercadorInfo.pontosComercioAtuais} PC disp.)`}
                    </Button>
                )}
                <div className={styles.consumiveisGrid}>
                    <Button type="button" variant="secondary" size="sm" onClick={() => usarConsumivel(3, 'remedio')} className={styles.consumivelBtn}>
                        <FaHeart /> Remédio ({Math.max(1, 3 - reducaoBolsosFundos)} PI) <span className={styles.consumivelEfeito}>+50 PV</span>
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => usarConsumivel(3, 'elixir')} className={styles.consumivelBtn}>
                        <MdWaterDrop /> Elixir ({Math.max(1, 3 - reducaoBolsosFundos)} PI) <span className={styles.consumivelEfeito}>+50 MP</span>
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => usarConsumivel(2, 'tonico')} className={styles.consumivelBtn}>
                        <FaFlask /> Tônico ({Math.max(1, 2 - reducaoBolsosFundos)} PI) <span className={styles.consumivelEfeito}>Status</span>
                    </Button>
                    {mercadorInfo.nvDataDeValidade > 0 && (
                        <Button type="button" variant="danger" size="sm" onClick={() => usarConsumivel(3, 'data_validade')} className={styles.consumivelBtn}>
                            <FaSkullCrossbones /> Data de Validade ({Math.max(1, 3 - reducaoBolsosFundos)} PI) <span className={styles.consumivelEfeito}>{mercadorInfo.danoDataValidadeUnico} Veneno</span>
                        </Button>
                    )}
                </div>
                {feedbackPi && <Badge variant="core" size="sm">{feedbackPi}</Badge>}
            </div>

            {/* Controles Manuais e Reabastecimento */}
            <div className={styles.controlesRow}>
                <div className={styles.manualBtnGroup}>
                    <Button type="button" variant="danger" size="sm" onClick={() => alterarPI(-1)} disabled={piAtual <= 0}>
                        -1 PI Manual
                    </Button>
                    <Button type="button" variant="core" size="sm" onClick={() => alterarPI(1)} disabled={piAtual >= piMax}>
                        +1 PI Manual
                    </Button>
                </div>
                <Button type="button" variant="primary" size="sm" onClick={recarregarPIs} title={`Custa ${custoPorPiVila}z por PI faltante`}>
                    <FaCoins /> Reabastecer na Vila ({custoPorPiVila}z/PI{descontoProsperidade ? ' -50% Prosp.' : ''})
                </Button>
            </div>
        </div>
    );
}
