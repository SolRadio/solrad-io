import fs from 'fs';

import path from 'path';
const file = path.join(process.cwd(), 'components', 'token-detail-drawer.tsx');
const content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');

// Find the markers
const markerAIdx = lines.findIndex(l => l.includes('{/* FULL MINT ADDRESS */}'));
const markerBIdx = lines.findIndex(l => l.includes('SPLIT_MARKER_B'));

console.log(`Marker A (start of junk) at line ${markerAIdx + 1}`);
console.log(`Marker B (end of junk) at line ${markerBIdx + 1}`);
console.log(`Will remove ${markerBIdx - markerAIdx + 1} lines`);

if (markerAIdx === -1 || markerBIdx === -1) {
  console.error('Markers not found! Aborting.');
  process.exit(1);
}

// Keep: lines 0..markerAIdx-1 (good code ending at </Accordion>)
// Remove: lines markerAIdx..markerBIdx (old orphaned sections + markers)
// Keep: lines markerBIdx+1..end (mint address div + footer)
const before = lines.slice(0, markerAIdx);
const after = lines.slice(markerBIdx + 1);

const result = [...before, '', ...after].join('\n');
fs.writeFileSync(file, result);
console.log(`Done! File was ${lines.length} lines, now ${before.length + 1 + after.length} lines.`);
