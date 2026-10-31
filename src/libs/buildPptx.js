// Builds a short, branded .pptx from an AI slide outline.
// `pptx` is a fresh `new PptxGenJS()` instance (passed in so the library can be lazy-loaded).
// Colors are hex without "#", as pptxgenjs requires.
const C = {
  ink: '0B0A14',
  panel: '161227',
  violet: '7C3AED',
  violetSoft: 'A78BFA',
  magenta: 'D946EF',
  ember: 'FF7A3D',
  gold: 'FBBF24',
  text: 'FFFFFF',
  muted: 'B8B2D6',
};
const FONT = 'Calibri';

function stripDataPrefix(dataUrl) {
  return dataUrl.replace(/^data:/, '');
}

function decorativeCircles(slide, { x, y }) {
  // Visual element used when a slide has no picture: layered translucent circles.
  slide.addShape('ellipse', { x, y, w: 3.2, h: 3.2, fill: { color: C.violet, transparency: 55 }, line: { color: C.violet, transparency: 100 } });
  slide.addShape('ellipse', { x: x + 1.5, y: y + 1.3, w: 2.2, h: 2.2, fill: { color: C.ember, transparency: 45 }, line: { color: C.ember, transparency: 100 } });
  slide.addShape('ellipse', { x: x + 0.6, y: y + 0.5, w: 1.1, h: 1.1, fill: { color: C.gold, transparency: 30 }, line: { color: C.gold, transparency: 100 } });
}

export function buildPptx(pptx, outline, images = {}) {
  pptx.layout = 'LAYOUT_16x9'; // 10in x 5.625in
  pptx.title = outline.title;
  pptx.author = 'StudyForge';
  pptx.company = 'StudyForge';

  // Title slide
  const title = pptx.addSlide();
  title.background = { color: C.ink };
  decorativeCircles(title, { x: 6.3, y: 1.4 });
  title.addText(outline.title, {
    x: 0.6, y: 1.5, w: 5.6, h: 1.9, fontFace: FONT, fontSize: 38, bold: true,
    color: C.text, valign: 'top', isTextBox: true, fit: 'shrink', margin: 0,
  });
  if (outline.subtitle) {
    title.addText(outline.subtitle, {
      x: 0.6, y: 3.5, w: 5.4, h: 0.8, fontFace: FONT, fontSize: 18, color: C.muted,
      valign: 'top', isTextBox: true, margin: 0,
    });
  }
  title.addText('Made with StudyForge', {
    x: 0.6, y: 4.95, w: 4, h: 0.3, fontFace: FONT, fontSize: 11, color: C.violetSoft,
    isTextBox: true, margin: 0,
  });

  // Content slides
  outline.slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: C.ink };
    const image = images[i];
    const hasImage = Boolean(image);
    const textWidth = hasImage ? 4.9 : 5.6;

    // Number badge motif
    slide.addShape('ellipse', { x: 0.6, y: 0.5, w: 0.55, h: 0.55, fill: { color: C.violet }, line: { color: C.violet } });
    slide.addText(String(i + 1), {
      x: 0.6, y: 0.5, w: 0.55, h: 0.55, fontFace: FONT, fontSize: 16, bold: true, color: C.text,
      align: 'center', valign: 'middle', isTextBox: true, margin: 0,
    });
    slide.addText(s.title, {
      x: 1.35, y: 0.4, w: 8, h: 0.75, fontFace: FONT, fontSize: 28, bold: true, color: C.text,
      valign: 'middle', isTextBox: true, fit: 'shrink', margin: 0,
    });

    const runs = s.bullets.map((b, bi) => ({
      text: b,
      options: { bullet: { indent: 18 }, breakLine: bi < s.bullets.length - 1, paraSpaceAfter: 12 },
    }));
    slide.addText(runs, {
      x: 0.6, y: 1.5, w: textWidth, h: 3.5, fontFace: FONT, fontSize: 20, color: C.text,
      valign: 'top', isTextBox: true, fit: 'shrink', margin: 0,
    });

    if (hasImage) {
      slide.addShape('roundRect', {
        x: 5.75, y: 1.45, w: 3.75, h: 3.75, rectRadius: 0.15,
        fill: { color: C.panel }, line: { color: C.violet, width: 1.5 },
      });
      slide.addImage({
        data: stripDataPrefix(image), x: 5.85, y: 2.15, w: 3.55, h: 2.0,
        altText: s.imagePrompt || s.title, sizing: { type: 'contain', w: 3.55, h: 2.0 },
      });
      slide.addText(s.title, {
        x: 5.9, y: 4.3, w: 3.45, h: 0.7, fontFace: FONT, fontSize: 12, color: C.muted,
        align: 'center', valign: 'middle', isTextBox: true, margin: 0,
      });
    } else {
      decorativeCircles(slide, { x: 6.2, y: 1.7 });
    }

    slide.addText(outline.title, {
      x: 0.6, y: 5.2, w: 6, h: 0.3, fontFace: FONT, fontSize: 10, color: C.violetSoft,
      isTextBox: true, margin: 0,
    });
    if (s.notes) slide.addNotes(s.notes);
  });

  return pptx;
}

export function slugify(name) {
  return (name || 'study-notes').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'study-notes';
}
