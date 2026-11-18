/**
 * qrDownload.js
 * Utilitário responsável pelo download de QR Codes em formato vetorial SVG,
 * configurando dimensões físicas ampliadas e alto contraste para impressão física
 * de crachás e leitura facilitada por scanners de câmera.
 */

/**
 * Realiza o download de um elemento SVG de QR Code com dimensões físicas confortáveis
 * para impressão e leitura nítida por câmeras e scanners de QR Code.
 *
 * @param {string} personagemNome - Nome do personagem para nomear o arquivo baixado
 * @param {HTMLElement|SVGElement} containerOuSvg - Nó DOM do SVG ou container que o envolve
 * @param {Object} [opcoes={}] - Parâmetros opcionais de exportação
 * @param {number} [opcoes.tamanhoDesejado=512] - Dimensão (largura e altura) em pixels do SVG exportado
 * @returns {boolean} Retorna true se o download foi iniciado com sucesso
 */
export function baixarQRCodeSvg(personagemNome, containerOuSvg, opcoes = {}) {
  if (!containerOuSvg) {
    console.warn('[qrDownload] Nenhum elemento fornecido para exportação de QR Code.');
    return false;
  }

  const tamanho = opcoes.tamanhoDesejado || 512;

  try {
    // 1. Extrai o nó <svg> real, seja passado diretamente ou contido em um wrapper <div>
    const svgElement = containerOuSvg.tagName?.toLowerCase() === 'svg'
      ? containerOuSvg
      : containerOuSvg.querySelector('svg');

    if (!svgElement) {
      console.warn('[qrDownload] Nenhum elemento <svg> encontrado dentro do container fornecido.');
      return false;
    }

    // 2. Clona o elemento para não alterar as dimensões da interface visual (72px no card)
    const clone = svgElement.cloneNode(true);

    // 3. Define atributos essenciais de SVG autônomo
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(tamanho));
    clone.setAttribute('height', String(tamanho));

    // Se o SVG original não tiver viewBox, define a partir do tamanho original para preservar escala vetorial
    if (!clone.getAttribute('viewBox')) {
      const w = svgElement.getAttribute('width') || svgElement.clientWidth || 72;
      const h = svgElement.getAttribute('height') || svgElement.clientHeight || 72;
      clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }

    // 4. Converte o SVG para string XML
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clone);

    // 5. Garante o cabeçalho XML para compatibilidade universal com softwares gráficos e plotters
    if (!svgString.startsWith('<?xml')) {
      svgString = `<?xml version="1.0" encoding="UTF-8"?>\n${svgString}`;
    }

    // 6. Gera o Blob vetorial e dispara o link de download
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const safeNome = (personagemNome || 'Cracha')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `QRCode_${safeNome}.svg`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('[qrDownload] Erro ao gerar o arquivo SVG do QR Code:', error);
    return false;
  }
}
