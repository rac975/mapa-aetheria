import { useState, useEffect } from 'react';
import { FaStore, FaBoxOpen, FaHammer, FaTools } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { Button } from '../../../components/ui';
import GerenciarEstabelecimentos from '../mestre/GerenciarEstabelecimentos';
import GerenciarEstoqueLoja from '../mestre/GerenciarEstoqueLoja';
import GerenciarForja from '../mestre/GerenciarForja';
import GerenciarCatalogoRaros from '../mestre/GerenciarCatalogosRaros';
import styles from '../LojaPage.module.css';

export default function LojaMestreTab({ itensCatalogo, lojas, recarregarDados, ficha }) {
    // Sub-aba interna do Mestre: 'lojas', 'estoque', 'forja', 'catalogo'
    const [subAbaMestre, setSubAbaMestre] = useState('lojas');

    useEffect(() => {
        const canalRealtime = supabase
            .channel('tabelas-mestre-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'itens_catalogo' }, () => {
                if (recarregarDados) recarregarDados();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lojas' }, () => {
                if (recarregarDados) recarregarDados();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(canalRealtime);
        };
    }, [recarregarDados]);

    return (
        <div className={styles.mestreContainer}>
            {/* Menu de Sub-Abas do Mestre (Design Limpo e Organizado com Button UI) */}
            <nav className={styles.mestreSubAbas} aria-label="Sub-abas de administração do Mestre">
                <Button
                    variant={subAbaMestre === 'lojas' ? 'secondary' : 'ghost'}
                    size="md"
                    className={styles.mestreSubAbaBtn}
                    onClick={() => setSubAbaMestre('lojas')}
                >
                    <FaStore /> Estabelecimentos
                </Button>
                <Button
                    variant={subAbaMestre === 'estoque' ? 'secondary' : 'ghost'}
                    size="md"
                    className={styles.mestreSubAbaBtn}
                    onClick={() => setSubAbaMestre('estoque')}
                >
                    <FaBoxOpen /> Estoque das Lojas
                </Button>
                <Button
                    variant={subAbaMestre === 'forja' ? 'secondary' : 'ghost'}
                    size="md"
                    className={styles.mestreSubAbaBtn}
                    onClick={() => setSubAbaMestre('forja')}
                >
                    <FaHammer /> Oficina / Forja
                </Button>
                <Button
                    variant={subAbaMestre === 'catalogo' ? 'secondary' : 'ghost'}
                    size="md"
                    className={styles.mestreSubAbaBtn}
                    onClick={() => setSubAbaMestre('catalogo')}
                >
                    <FaTools /> Catálogo de Raros
                </Button>
            </nav>

            {/* Conteúdo dinâmico baseado na sub-aba escolhida */}
            <div className={styles.mestrePainelConteudo}>
                {subAbaMestre === 'lojas' && (
                    <GerenciarEstabelecimentos lojas={lojas} recarregarDados={recarregarDados} />
                )}

                {subAbaMestre === 'estoque' && (
                    <GerenciarEstoqueLoja lojas={lojas} itensCatalogo={itensCatalogo} />
                )}

                {subAbaMestre === 'forja' && (
                    <GerenciarForja ficha={ficha} recarregarDados={recarregarDados} />
                )}

                {subAbaMestre === 'catalogo' && (
                    <GerenciarCatalogoRaros itensCatalogo={itensCatalogo} recarregarDados={recarregarDados} />
                )}
            </div>
        </div>
    );
}
