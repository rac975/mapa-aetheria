import { useState } from 'react';
import { fichaService } from '../../../../services/fichaService';
import { useAlert } from '../../../../contexts/useAlert';
import { Button, Modal, Input } from '../../../../components/ui';
import styles from '../FichaHeader.module.css';

/**
 * Modal para gerenciar acréscimo e retirada de Zênites da ficha do personagem.
 * Isola o formulário e as transações de moedas.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Object} props.ficha
 * @param {Function} [props.setFicha]
 */
export default function ModalZenit({ isOpen, onClose, ficha, setFicha }) {
  const { showAlert } = useAlert();
  const [tipoAjuste, setTipoAjuste] = useState('adicionar');
  const [valorZenit, setValorZenit] = useState('');
  const [motivoZenit, setMotivoZenit] = useState('');
  const [processandoZenit, setProcessandoZenit] = useState(false);

  if (!isOpen) return null;

  const lidarComTransacaoZenit = async (e) => {
    e.preventDefault();
    const qtd = parseInt(valorZenit, 10);
    if (isNaN(qtd) || qtd <= 0) {
      showAlert('Insira um valor válido maior que zero.');
      return;
    }

    const zenitAtual = ficha?.zenit || 0;
    const novoZenit = tipoAjuste === 'adicionar' ? zenitAtual + qtd : zenitAtual - qtd;

    if (novoZenit < 0) {
      showAlert('O personagem não tem zênites suficientes para essa retirada!');
      return;
    }

    setProcessandoZenit(true);
    try {
      await fichaService.atualizarZenit(ficha.id, novoZenit);

      if (setFicha) {
        setFicha((prev) => ({ ...prev, zenit: novoZenit }));
      }

      showAlert(
        `✨ Transação realizada! ${tipoAjuste === 'adicionar' ? `+${qtd}` : `-${qtd}`} zênites (${motivoZenit || 'Sem motivo especificado'}).`
      );
      onClose();
      setValorZenit('');
      setMotivoZenit('');
    } catch (err) {
      showAlert('Erro ao atualizar zênites: ' + err.message);
    } finally {
      setProcessandoZenit(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciar Zênites"
      size="sm"
    >
      <form onSubmit={lidarComTransacaoZenit} className={styles.zenitModalForm}>
        <div className={styles.zenitTypeSwitcher}>
          <button
            type="button"
            onClick={() => setTipoAjuste('adicionar')}
            className={`${styles.zenitTypeBtn} ${tipoAjuste === 'adicionar' ? styles.zenitTypeBtnActiveAdd : ''}`}
          >
            ➕ Adicionar
          </button>
          <button
            type="button"
            onClick={() => setTipoAjuste('remover')}
            className={`${styles.zenitTypeBtn} ${tipoAjuste === 'remover' ? styles.zenitTypeBtnActiveSub : ''}`}
          >
            ➖ Retirar
          </button>
        </div>

        <Input
          label="Quantidade de Zênites:"
          type="number"
          min="1"
          placeholder="Ex: 200"
          value={valorZenit}
          onChange={(e) => setValorZenit(e.target.value)}
          required
        />

        <Input
          label="Motivo / Descrição (Opcional):"
          type="text"
          placeholder="Ex: Recompensa de missão, Tesouro..."
          value={motivoZenit}
          onChange={(e) => setMotivoZenit(e.target.value)}
        />

        <div className={styles.modalFooterActions}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={tipoAjuste === 'adicionar' ? 'core' : 'danger'}
            size="sm"
            disabled={processandoZenit}
          >
            {processandoZenit ? 'Salvando...' : 'Confirmar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
