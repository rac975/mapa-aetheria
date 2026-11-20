import { useRef } from 'react';
import {
  FaTrash,
  FaIdBadge,
  FaDownload,
  FaUser,
  FaEdit,
  FaSyncAlt
} from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import { Card, Button, Badge, ResourceBar } from '../../../components/ui';
import styles from '../MestreFichasPage.module.css';

export default function MestreFichaCard({
  ficha,
  onAbrirFicha,
  onBaixarQr,
  onRotacionarToken,
  onDeletarFicha
}) {
  const qrContainerRef = useRef(null);
  // Codifica puramente o token limpo do jogador no QR Code (redução radical de densidade para matriz 21x21)
  const tokenCracha = ficha.jogador_token || String(ficha.id);
  const hpMaxFinal = ficha.hp_max_real || ficha.hp_max || 30;
  const mpMaxFinal = ficha.mp_max_real || ficha.mp_max || 20;
  const piMaxFinal = ficha.pi_max_real || ficha.ip_max_real || ficha.pi_max || ficha.ip_max || 6;
  const piAtualFinal = ficha.pi_atual ?? ficha.ip_atual ?? piMaxFinal;

  return (
    <Card
      variant="interactive"
      className={styles.characterCard}
      onClick={() => onAbrirFicha(ficha.id)}
      title="Abrir ficha completa"
    >
      <div>
        <div className={styles.cardTop}>
          <div className={styles.cardAvatar}>
            {ficha.avatar_url ? (
              <img
                src={ficha.avatar_url}
                alt={ficha.nome_personagem}
                className={styles.avatarImage}
              />
            ) : (
              <FaUser className={styles.avatarIcon} />
            )}
          </div>
          <div className={styles.characterMeta}>
            <h3 className={styles.characterName}>{ficha.nome_personagem}</h3>
            <span className={styles.playerName}>
              Jogador: <strong>{ficha.nome_jogador || 'Não informado'}</strong>
            </span>
          </div>
          <Badge variant="gold" size="sm">
            <FaIdBadge /> #{ficha.jogador_token}
          </Badge>
        </div>

        <div className={styles.middleSection}>
          <p className={styles.identityText}>
            {ficha.identidade || 'Sem peculiaridade informada'}
          </p>

          <div className={styles.classesBox}>
            <span className={styles.classesLabel}>Classes:</span>
            <div className={styles.classesList}>
              {ficha.fichas_classes && ficha.fichas_classes.length > 0 ? (
                ficha.fichas_classes.map((c, idx) => (
                  <Badge key={idx} variant="gold" size="sm">
                    {c.nome_classe} ({c.nivel}v)
                  </Badge>
                ))
              ) : (
                <span className={styles.noClassesText}>Nenhuma classe informada</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.resourcesSection}>
          <ResourceBar
            type="pv"
            current={ficha.hp_atual}
            max={hpMaxFinal}
            label="PV"
          />
          <ResourceBar
            type="pm"
            current={ficha.mp_atual}
            max={mpMaxFinal}
            label="PM"
          />
          <ResourceBar
            type="pi"
            current={piAtualFinal}
            max={piMaxFinal}
            label="PI"
          />
          <div className={styles.badgesRow}>
            <Badge variant="ether" size="sm">
              ✨ Fábula: {ficha.fabula ?? 3}
            </Badge>
            <Badge variant="gold" size="sm">
              Nível {ficha.nivel || 1}
            </Badge>
          </div>
        </div>

        <div
          className={styles.qrSection}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.qrPreview}>
            <div className={styles.qrSvgBox}>
              <div ref={qrContainerRef}>
                <QRCodeSVG
                  value={tokenCracha}
                  size={72}
                  fgColor="#000000"
                  bgColor="#ffffff"
                  level="L"
                  includeMargin={true}
                  marginSize={2}
                />
              </div>
            </div>
            <div className={styles.qrTextInfo}>
              <span className={styles.qrTitle}>QR Crachá</span>
              <span className={styles.qrToken}>{ficha.jogador_token}</span>
            </div>
          </div>

          <div className={styles.qrActionsGroup}>
            {onRotacionarToken && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRotacionarToken(ficha, e);
                }}
                title="Gerar novo código de crachá e desconectar sessão antiga deste jogador"
              >
                <FaSyncAlt />
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onBaixarQr(ficha.nome_personagem, qrContainerRef.current, { token: tokenCracha });
              }}
              title="Baixar SVG do QR Code para crachá físico"
            >
              <FaDownload /> Baixar QR
            </Button>
          </div>
        </div>
      </div>

      <div
        className={styles.cardActions}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="core"
          size="sm"
          onClick={() => onAbrirFicha(ficha.id)}
        >
          <FaEdit /> Editar Ficha
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={(e) => onDeletarFicha(ficha, e)}
        >
          <FaTrash /> Excluir
        </Button>
      </div>
    </Card>
  );
}
