import { FaBoxOpen } from 'react-icons/fa';

export default function FichaMochilaSecao({ mochila, notas }) {
  if (!mochila && !notas) return null;

  return (
    <>
      {mochila && (
        <section className="ficha-card-section">
          <h3><FaBoxOpen /> Mochila</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{mochila}</p>
        </section>
      )}
      {notas && (
        <section className="ficha-card-section">
          <h3>Notas</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{notas}</p>
        </section>
      )}
    </>
  );
}