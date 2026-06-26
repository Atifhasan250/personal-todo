const sharp = require('sharp');
const fs = require('fs');

async function convert() {
  try {
    const svgBuffer = fs.readFileSync('public/icon.svg');
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile('public/favicon.png');
    console.log('Successfully generated public/favicon.png');
  } catch (error) {
    console.error('Error generating png:', error);
  }
}

convert();
