// quran_juz_amma_converter.js
// Converts quran_all_surahs.json to juzAmmaData.js for Juz Amma (Surahs 78-114)
// Usage: node quran_juz_amma_converter.js

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, 'quran_all_surahs.json');
const OUTPUT_PATH = path.join(__dirname, 'juzAmmaData.js');

function main() {
  const raw = fs.readFileSync(INPUT_PATH, 'utf8');
  const allSurahs = JSON.parse(raw);

  // Juz Amma: Surahs 78-114
  const juzAmma = allSurahs.filter(surah => surah.number >= 78 && surah.number <= 114)
    .map(surah => ({
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      verses: surah.ayahs.map((ayah, idx) => ({
        numberInSurah: ayah.numberInSurah || ayah.number || (idx + 1),
        text: ayah.text,
        translation: ayah.translation // Add translation field
      }))
    }));

  const jsExport = `// This file is auto-generated from quran_all_surahs.json\n// Contains Juz Amma (Surahs 78-114)\n\nexport const juzAmmaData = ${JSON.stringify(juzAmma, null, 2)};\n`;

  fs.writeFileSync(OUTPUT_PATH, jsExport, 'utf8');
  console.log('juzAmmaData.js has been generated.');
}

main();
