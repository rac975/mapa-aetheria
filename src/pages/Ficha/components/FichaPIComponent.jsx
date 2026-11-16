import { FaBoxOpen, FaCoins, FaFlask, FaHeart } from 'react-icons/fa';
import { MdWaterDrop } from 'react-icons/md';
import { fichaService } from '../../../services/fichaService';
import { ResourceBar, Button, Badge } from '../../../components/ui';
import styles from './FichaPIComponent.module.css';

export default function FichaPIComponent({ ficha, setFicha, piMaxCalculado }) {
    if (!ficha) return null;

    const piAtual = ficha.pi_atual ?? ficha.ip_atual ?? 6;
    const piMax = piMaxCalculado ?? ficha.pi_max ?? ficha.ip_max ?? 6;
    const zenitAtual = ficha.zenit ?? 0;

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

        const custoTotal = piFaltando * 10;
        if (zenitAtual < custoTotal) {
            alert(`Você precisa de ${custoTotal}z para recuperar todos os PIs, mas só tem ${zenitAtual}z!`);
            return;
        }

        const novoZenit = zenitAtual - custoTotal;
        await atualizarFichaNoBanco({ pi_atual: piMax, ip_atual: piMax, zenit: novoZenit });
    };

    // ==========================================
    // USAR CONSUMÍVEL POR PI (Regras Oficiais)
    // ==========================================
    const usarConsumivel = async (custoPI, tipoEfeito) => {
        if (piAtual < custoPI) {
            alert(`Você precisa de ${custoPI} PIs disponíveis, mas só tem ${piAtual} na mochila!`);
            return;
        }

        const novoPiAtual = piAtual - custoPI;
        let novosDados = { pi_atual: novoPiAtual, ip_atual: novoPiAtual };

        if (tipoEfeito === 'remedio') {
            const hpMax = ficha.hp_max || 100;
            const hpAtual = ficha.hp_atual || 0;
            novosDados.hp_atual = Math.min(hpMax, hpAtual + 50);
        } 
        else if (tipoEfeito === 'elixir') {
            const mpMax = ficha.mp_max || 50;
            const mpAtual = ficha.mp_atual || 0;
            novosDados.mp_atual = Math.min(mpMax, mpAtual + 50);
        } 
        else if (tipoEfeito === 'tonico') {
            alert("✨ Tônico utilizado! Todas as condições foram removidas.");
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
                <div className={styles.consumiveisGrid}>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => usarConsumivel(3, 'remedio')}
                        className={styles.consumivelBtn}
                    >
                        <FaHeart /> Remédio (3 PI) <span className={styles.consumivelEfeito}>+50 PV</span>
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => usarConsumivel(3, 'elixir')}
                        className={styles.consumivelBtn}
                    >
                        <MdWaterDrop /> Elixir (3 PI) <span className={styles.consumivelEfeito}>+50 MP</span>
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => usarConsumivel(2, 'tonico')}
                        className={styles.consumivelBtn}
                    >
                        <FaFlask /> Tônico (2 PI) <span className={styles.consumivelEfeito}>Status</span>
                    </Button>
                </div>
            </div>

            {/* Controles Manuais e Reabastecimento */}
            <div className={styles.controlesRow}>
                <div className={styles.manualBtnGroup}>
                    <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => alterarPI(-1)}
                        disabled={piAtual <= 0}
                    >
                        -1 PI Manual
                    </Button>
                    <Button
                        type="button"
                        variant="core"
                        size="sm"
                        onClick={() => alterarPI(1)}
                        disabled={piAtual >= piMax}
                    >
                        +1 PI Manual
                    </Button>
                </div>

                <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={recarregarPIs}
                    title="Custa 10z por PI faltante"
                >
                    <FaCoins /> Reabastecer na Vila (10z/PI)
                </Button>
            </div>
        </div>
    );
}
