import React, { useState } from 'react';
import { FaHammer, FaShieldAlt, FaCrosshairs, FaRing } from 'react-icons/fa';
import { lojaService } from '../../../services/lojaService';
import { useAlert } from '../../../contexts/useAlert';
import { Button, Card } from '../../../components/ui';
import CriadorArmas from './CriadorArmas';
import CriadorArmadurasEscudos from './CriadorArmadurasEscudos';
import CriadorAcessorios from './CriadorAcessorios';
import styles from './CriadorEquipamentoUnificado.module.css';

export default function CriadorEquipamentoUnificado({ ficha, onCriado }) {
    const [tipoEquipamento, setTipoEquipamento] = useState('arma');
    const { showAlert } = useAlert();

    const handleSalvarItem = async (novoItem) => {
        let erroBanco = null;

        if (ficha && ficha.id) {
            const { error } = await lojaService.adicionarItemPersonagem({
                fichaId: ficha.id,
                nomeItem: novoItem.nome,
                tipo: novoItem.tipo,
                statsPersonalizados: novoItem.stats
            });
            erroBanco = error;
        } else {
            const desc = (novoItem.stats?.efeitos && novoItem.stats.efeitos[0]) ||
                `${novoItem.tipo === 'escudo' ? 'Escudo' : novoItem.tipo === 'armadura' ? 'Armadura' : 'Equipamento'} raro forjado.`;

            const { error } = await lojaService.cadastrarItemCatalogo({
                nome: novoItem.nome,
                tipo: novoItem.tipo,
                custo: novoItem.custo,
                descricao: desc,
                stats: novoItem.stats
            });
            erroBanco = error;
        }

        if (erroBanco) {
            showAlert('Erro ao salvar equipamento: ' + erroBanco.message);
        } else {
            showAlert('✨ Equipamento forjado e salvo com sucesso!');
            if (onCriado) onCriado();
        }
    };

    return (
        <Card variant="default" className={styles.container}>
            <h2 className={styles.titulo}>
                <FaHammer /> Oficina Central de Equipamentos
            </h2>

            {/* Abas Superiores */}
            <nav className={styles.abasTipo} aria-label="Tipos de Equipamento para Forja">
                <Button
                    variant={tipoEquipamento === 'arma' ? 'primary' : 'ghost'}
                    size="md"
                    className={styles.abaBtn}
                    onClick={() => setTipoEquipamento('arma')}
                >
                    <FaCrosshairs /> Armas
                </Button>
                <Button
                    variant={tipoEquipamento === 'armadura' ? 'primary' : 'ghost'}
                    size="md"
                    className={styles.abaBtn}
                    onClick={() => setTipoEquipamento('armadura')}
                >
                    <FaShieldAlt /> Armaduras / Escudos
                </Button>
                <Button
                    variant={tipoEquipamento === 'acessorio' ? 'primary' : 'ghost'}
                    size="md"
                    className={styles.abaBtn}
                    onClick={() => setTipoEquipamento('acessorio')}
                >
                    <FaRing /> Acessórios
                </Button>
            </nav>

            {/* Renderização condicional do componente filho escolhido */}
            {tipoEquipamento === 'arma' && <CriadorArmas onSalvarItem={handleSalvarItem} />}
            {tipoEquipamento === 'armadura' && <CriadorArmadurasEscudos onSalvarItem={handleSalvarItem} />}
            {tipoEquipamento === 'acessorio' && <CriadorAcessorios onSalvarItem={handleSalvarItem} />}
        </Card>
    );
}
