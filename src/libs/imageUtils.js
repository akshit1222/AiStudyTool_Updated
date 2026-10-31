// Helpers for AI pictures: SVG illustrations are converted to PNG for download and PowerPoint.

function decodeSvg(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  return decodeURIComponent(escape(atob(base64)));
}

function ensureSvgSize(svg, width, height) {
  return svg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
    let next = attrs.replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*')/gi, '');
    next += ` width="${width}" height="${height}"`;
    if (!/xmlns=/.test(next)) next += ' xmlns="http://www.w3.org/2000/svg"';
    return `<svg${next}>`;
  });
}

export async function toPngDataUrl(dataUrl, width = 1280, height = 720) {
  if (!dataUrl.startsWith('data:image/svg')) return dataUrl;

  const svg = ensureSvgSize(decodeSvg(dataUrl), width, height);
  const url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('Could not read the illustration'));
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function extensionFor(dataUrl) {
  if (dataUrl.startsWith('data:image/jpeg')) return 'jpg';
  if (dataUrl.startsWith('data:image/webp')) return 'webp';
  return 'png';
}
