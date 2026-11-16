import { useState } from 'react';
import { FaDice, FaClock, FaMagic } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import styles from './ExibirEntropista.module.css';

export default function ExibirEntropista({ classeObjeto }) {
  // Estado local para simular o "Sete da Sorte" (começa em 7)
  const [numeroSorte, setNumeroSorte] = useState(7);
  const [historicoUso, setHistoricoUso] = useState(false);

  const habilidades = classeObjeto?.habilidades || [];
  const nivelClasse = parseInt(classeObjeto?.nivel, 10) || 1;

  // Verifica se o personagem possui poderes específicos investidos
  const habSeteDaSorte = habilidades.find(h => (h.nome || '').toLowerCase().includes('sete da sorte'));
  const nivelSeteDaSorte = parseInt(habSeteDaSorte?.nivel, 10) || 0;

  const habTempoRoubado = habilidades.find(h => (h.nome || '').toLowerCase().includes('tempo roubado'));
  const nivelTempoRoubado = parseInt(habTempoRoubado?.nivel, 10) || 0;
  const maxPMRoubo = nivelTempoRoubado * 5;

  const simularSeteDaSorte = () => {
    // Gera um valor aleatório de dado (ex: d6 ou d12) para simular a troca pelo número da sorte
    const novoValor = Math.floor(Math.random() * 6) + 1;
    setNumeroSorte(novoValor);
    setHistoricoUso(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>
          <FaMagic /> Painel de Controle: Entropista (Nível {nivelClasse})
        </span>

        {nivelSeteDaSorte > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={simularSeteDaSorte}
            title="Substituir valor de um dado pelo Número da Sorte e atualizar o número"
          >
            <FaDice /> Sete da Sorte: <strong>[{numeroSorte}]</strong>
          </Button>
        )}
      </div>

      {/* Dica de Rituais e Benefícios Iniciais */}
      <div className={styles.infoBox}>
        💡 <strong>Benefícios Ativos:</strong> +5 PM máximos garantidos • Rituais da disciplina <i>Entropismo</i> liberados (Usa <b>AST + VON</b>).
      </div>

      {/* Seção interativa para Tempo Roubado */}
      {nivelTempoRoubado > 0 && (
        <div className={styles.tempoRoubadoBox}>
          <div className={styles.tempoRoubadoHeader}>
            <FaClock /> <strong>Tempo Roubado (Nv. {nivelTempoRoubado}):</strong> Gasto máximo de PM por uso: <strong>{maxPMRoubo} PM</strong> (5 PM por opção).
          </div>
          <div className={styles.tempoRoubadoDesc}>
            Opções disponíveis: Deixar/tirar lento, Ação Equipamento grátis, Dano necrose em lento <code>10 + ({nivelTempoRoubado}×5)</code> ou adiantar turno de aliado.
          </div>
        </div>
      )}

      {/* Alerta de Sete da Sorte usado */}
      {nivelSeteDaSorte > 0 && historicoUso && (
        <div className={styles.alertSucesso}>
          ✨ O seu "Número da Sorte" foi atualizado para <strong>{numeroSorte}</strong> após o uso nesta cena!
        </div>
      )}
    </div>
  );
}
