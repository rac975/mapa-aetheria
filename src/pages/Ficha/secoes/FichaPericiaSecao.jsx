import { useState } from 'react';
import { FaDice } from 'react-icons/fa';
import { Card, Button, Badge } from '../../../components/ui';
import styles from './FichaPericiaSecao.module.css';

const rolarDado = (faces) => Math.floor(Math.random() * faces) + 1;

export default function FichaPericiasSecao({ atributos = {} }) {
    const periciasComuns = [
        { categoria: 'Destreza', itens: [
            { nome: 'Mover-se em silêncio / Esconder-se', attrs: ['destreza', 'destreza'], sigla: 'DES + DES' },
            { nome: 'Evitar armadilha / Fugir de desabamento', attrs: ['destreza', 'astucia'], sigla: 'DES + AST' },
            { nome: 'Prever movimentos / Pegar de surpresa', attrs: ['destreza', 'astucia'], sigla: 'DES + AST' },
            { nome: 'Concluir obra artesanal / Consertar', attrs: ['destreza', 'astucia'], sigla: 'DES + AST' },
            { nome: 'Mover-se com graça / Evitar detecção', attrs: ['destreza', 'vontade'], sigla: 'DES + VON' }
        ]},
        { categoria: 'Astúcia', itens: [
            { nome: 'Examinar ou investigar algo/alguém', attrs: ['astucia', 'astucia'], sigla: 'AST + AST' },
            { nome: 'Lembrar-se de informações úteis', attrs: ['astucia', 'astucia'], sigla: 'AST + AST' },
            { nome: 'Conseguir informações em conversa', attrs: ['astucia', 'vontade'], sigla: 'AST + VON' },
            { nome: 'Convencer por autoridade/diplomacia', attrs: ['astucia', 'vontade'], sigla: 'AST + VON' }
        ]},
        { categoria: 'Vigor / Vontade', itens: [
            { nome: 'Trabalho pesado (erguer grades, empurrar)', attrs: ['vigor', 'vigor'], sigla: 'VIG + VIG' },
            { nome: 'Resistir a intensa dor ou fadiga', attrs: ['vigor', 'vontade'], sigla: 'VIG + VON' },
            { nome: 'Intimidar com força ou presença', attrs: ['vigor', 'vontade'], sigla: 'VIG + VON' }
        ]}
    ];

    const [periciaSelecionada, setPericiaSelecionada] = useState('');
    const [ultimaRolagem, setUltimaRolagem] = useState(null);

    const executarRolagem = () => {
        if (!periciaSelecionada) return;
        const [gIdx, iIdx] = periciaSelecionada.split('-');
        const item = periciasComuns[gIdx].itens[iIdx];

        const extrairFaces = (valorAttr) => {
            if (!valorAttr) return 8;
            const str = String(valorAttr).trim().toLowerCase();
            if (str.startsWith('d')) {
                const faces = parseInt(str.substring(1), 10);
                return isNaN(faces) ? 8 : faces;
            }
            const num = parseInt(str, 10);
            return isNaN(num) ? 8 : num;
        };

        const faces1 = extrairFaces(atributos[item.attrs[0]]);
        const faces2 = extrairFaces(atributos[item.attrs[1]]);

        const resultado1 = rolarDado(faces1);
        const resultado2 = rolarDado(faces2);
        const total = resultado1 + resultado2;

        setUltimaRolagem({
            titulo: item.nome,
            sigla: item.sigla,
            res1: resultado1,
            res2: resultado2,
            total
        });
    };

    return (
        <Card variant="default" className={styles.container}>
            <div className={styles.innerFlex}>
                {/* Cabeçalho Consolidado com Badge */}
                <div className={styles.headerRow}>
                    <h3 className={styles.title}>
                        <FaDice className={styles.titleIcon} /> Perícias Táticas & Testes
                    </h3>
                    <Badge variant="gold" size="md">
                        Regra Oficial
                    </Badge>
                </div>

                {/* Combobox + Botão de Rolar */}
                <div className={styles.controlsWrapper}>
                    <select
                        value={periciaSelecionada}
                        onChange={(e) => setPericiaSelecionada(e.target.value)}
                        className={styles.selectCircunstancia}
                        aria-label="Selecionar circunstância para teste de perícia"
                    >
                        <option value="">Selecione uma circunstância...</option>
                        {periciasComuns.map((grupo, gIdx) => (
                            <optgroup key={gIdx} label={grupo.categoria}>
                                {grupo.itens.map((item, iIdx) => (
                                    <option key={iIdx} value={`${gIdx}-${iIdx}`}>
                                        {item.nome} ({item.sigla})
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>

                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={executarRolagem}
                        disabled={!periciaSelecionada}
                    >
                        <FaDice /> Rolar
                    </Button>
                </div>

                {/* Resultado Inline ou Placeholder */}
                {ultimaRolagem ? (
                    <div className={styles.resultadoBox}>
                        <span className={styles.resultadoTitulo} title={ultimaRolagem.titulo}>
                            {ultimaRolagem.titulo}
                        </span>
                        <span className={styles.resultadoValores}>
                            {ultimaRolagem.sigla}: {ultimaRolagem.res1} + {ultimaRolagem.res2} ={' '}
                            <strong className={styles.resultadoTotal}>{ultimaRolagem.total}</strong>
                        </span>
                    </div>
                ) : (
                    <div className={styles.resultadoVazio}>
                        Selecione uma circunstância acima para rolar teste combinado
                    </div>
                )}
            </div>
        </Card>
    );
}
