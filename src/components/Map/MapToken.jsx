import { memo, useRef, useState, useCallback } from 'react';
import { FaShip, FaUsers, FaSkull, FaCompass } from 'react-icons/fa';
import './MapToken.css';

const ICON_MAP = {
  navio: FaShip,
  party: FaUsers,
  monstro: FaSkull,
  marcador: FaCompass
};

/**
 * Token interativo de alta performance.
 * Utiliza Pointer Capture e requestAnimationFrame para movimentação fluida a 60fps
 * sem disparar re-renderizações no loop de arraste.
 */
function MapToken({
  token,
  mapContainerRef,
  onMoveEnd,
  onDragStart,
  onDragEnd,
  onSelect
}) {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const deltaRef = useRef({ dx: 0, dy: 0 });
  const rafIdRef = useRef(null);
  const tokenRef = useRef(null);

  const getIcon = () => {
    const Component = ICON_MAP[token.tipo] || ICON_MAP[token.icone] || FaCompass;
    return <Component />;
  };

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return; // Apenas botão esquerdo/toque principal
    e.stopPropagation();

    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    deltaRef.current = { dx: 0, dy: 0 };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignora caso pointer capture não seja suportado no ambiente
    }

    setIsDragging(true);
    if (onDragStart) onDragStart(token.id);
  }, [token.id, onDragStart]);

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();

    const container = mapContainerRef?.current;
    let scale = 1;
    if (container) {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && container.offsetWidth > 0) {
        scale = rect.width / container.offsetWidth;
      }
    }

    const dx = (e.clientX - startPosRef.current.x) / (scale || 1);
    const dy = (e.clientY - startPosRef.current.y) / (scale || 1);
    deltaRef.current = { dx, dy };

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      if (tokenRef.current && isDraggingRef.current) {
        tokenRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      }
    });
  }, [mapContainerRef]);

  const handlePointerUp = useCallback((e) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();

    isDraggingRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignora erro de releasePointerCapture
    }

    if (tokenRef.current) {
      tokenRef.current.style.transform = '';
    }
    setIsDragging(false);

    const container = mapContainerRef?.current;
    const mapW = container?.offsetWidth || 1;
    const mapH = container?.offsetHeight || 1;

    const deltaPercentX = (deltaRef.current.dx / mapW) * 100;
    const deltaPercentY = (deltaRef.current.dy / mapH) * 100;

    const finalX = Math.max(0, Math.min(100, token.x + deltaPercentX));
    const finalY = Math.max(0, Math.min(100, token.y + deltaPercentY));

    if (onMoveEnd) {
      onMoveEnd(token.id, finalX, finalY);
    }

    if (onDragEnd) {
      onDragEnd(token.id);
    }
  }, [token, mapContainerRef, onMoveEnd, onDragEnd]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (onSelect) onSelect(token);
  }, [token, onSelect]);

  return (
    <div
      ref={tokenRef}
      className={`map-token tipo-${token.tipo || 'navio'} ${isDragging ? 'arrastando' : ''}`}
      style={{
        '--token-x': `${token.x}%`,
        '--token-y': `${token.y}%`
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Token: ${token.nome}`}
    >
      {getIcon()}
      <span className="token-label">{token.nome}</span>
    </div>
  );
}

function areEqual(prev, next) {
  return (
    prev.token.id === next.token.id &&
    prev.token.x === next.token.x &&
    prev.token.y === next.token.y &&
    prev.token.nome === next.token.nome &&
    prev.token.tipo === next.token.tipo &&
    prev.onMoveEnd === next.onMoveEnd &&
    prev.onDragStart === next.onDragStart &&
    prev.onDragEnd === next.onDragEnd &&
    prev.mapContainerRef === next.mapContainerRef
  );
}

export default memo(MapToken, areEqual);
