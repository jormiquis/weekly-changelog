import { Resvg } from '@resvg/resvg-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { howItWorksSvg } from './howItWorks.js';
import { darkPalette } from './DiagramPalette.js';

const fontsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fonts')

/** Rasterises the diagram at 2x for use outside the dashboard (LinkedIn, README). */
export function renderHowItWorksPng(): Buffer {
  const svg = howItWorksSvg(darkPalette)
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: 2400 },
    font: { fontDirs: [fontsDir], defaultFontFamily: 'Poppins', loadSystemFonts: false },
  }).render().asPng()
}
