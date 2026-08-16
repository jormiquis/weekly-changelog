import { writeFileSync } from 'fs';
import { renderHowItWorksPng } from './renderHowItWorks.js';

const target = process.argv[2] || 'docs/how-it-works.png'
writeFileSync(target, renderHowItWorksPng())
console.log(`How-it-works diagram written to ${target}`)
