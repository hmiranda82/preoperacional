const sharp = require('C:/Users/HUGO MIRANDA/Desktop/PROYECTO REVISION/VERSION-12/node_modules/.pnpm/sharp@0.35.3_@types+node@22.19.19/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const BG = '#1a2540';
const LOGO = 'C:/Users/HUGO MIRANDA/Desktop/PROYECTO REVISION/VERSION-12/app-conductores/src/assets/icono_app.png';
const RES = 'C:/Users/HUGO MIRANDA/Desktop/PROYECTO REVISION/VERSION-12/app-conductores/android/app/src/main/res';

const DENSITIES = {
  'mipmap-mdpi':    48,
  'mipmap-hdpi':    72,
  'mipmap-xhdpi':   96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

const FG_VIEWPORT = 108;
const FG_SAFE_ZONE = 66;
const FG_OFFSET = (FG_VIEWPORT - FG_SAFE_ZONE) / 2;

function writeFileSync(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
  console.log('  wrote ' + path.basename(p));
}

async function genForegroundPNG(density, size) {
  const pad = Math.round(size * 0.15);
  const inner = size - pad * 2;
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="transparent"/>
    <image href="file:///${LOGO}" x="${pad}" y="${pad}" width="${inner}" height="${inner}"/>
  </svg>`;
  const outDir = path.join(RES, density);
  fs.mkdirSync(outDir, { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, 'ic_launcher_foreground.png'));
}

async function genLegacyIcon(density, size) {
  const pad = Math.round(size * 0.15);
  const inner = size - pad * 2;
  const rx = Math.round(size * 0.22);
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${rx}" fill="${BG}"/>
    <image href="file:///${LOGO}" x="${pad}" y="${pad}" width="${inner}" height="${inner}"/>
  </svg>`;
  const outDir = path.join(RES, density);
  fs.mkdirSync(outDir, { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, 'ic_launcher.png'));
}

async function genLegacyRound(density, size) {
  const pad = Math.round(size * 0.15);
  const inner = size - pad * 2;
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="c"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></clipPath></defs>
    <rect width="${size}" height="${size}" fill="${BG}"/>
    <image href="file:///${LOGO}" x="${pad}" y="${pad}" width="${inner}" height="${inner}" clip-path="url(#c)"/>
  </svg>`;
  const outDir = path.join(RES, density);
  fs.mkdirSync(outDir, { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, 'ic_launcher_round.png'));
}

function writeXMLFiles() {
  console.log('\n--- XML adaptive icon files ---');

  // ic_launcher.xml (adaptive icon)
  writeFileSync(path.join(RES, 'mipmap-anydpi-v26', 'ic_launcher.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`);

  // ic_launcher_round.xml (adaptive icon round)
  writeFileSync(path.join(RES, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`);

  // ic_launcher_foreground.xml (vector drawable - transparent, just the logo area)
  writeFileSync(path.join(RES, 'drawable', 'ic_launcher_foreground.xml'),
`<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path
        android:fillColor="#00000000"
        android:pathData="M0,0h108v108h-108z" />
</vector>`);

  // ic_launcher_background.xml (solid color vector)
  writeFileSync(path.join(RES, 'drawable', 'ic_launcher_background.xml'),
`<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path
        android:fillColor="${BG}"
        android:pathData="M0,0h108v108h-108z" />
</vector>`);

  // ic_launcher_monochrome.xml (Android 13+ themed icons - uses logo as monochrome mask)
  writeFileSync(path.join(RES, 'drawable', 'ic_launcher_monochrome.xml'),
`<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path
        android:fillColor="#000000"
        android:pathData="M${FG_OFFSET + 10},${FG_OFFSET + 10} h${FG_SAFE_ZONE - 20} v${FG_SAFE_ZONE - 20} h-${FG_SAFE_ZONE - 20} z"
        android:fillType="evenOdd" />
</vector>`);

  // colors.xml - fix ic_launcher_background color
  writeFileSync(path.join(RES, 'values', 'colors.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">${BG}</color>
    <color name="colorPrimaryDark">#E5E7EB</color>
    <color name="colorAccent">#1a2540</color>

    <color name="ic_launcher_background">${BG}</color>
</resources>`);
}

async function main() {
  console.log('=== Generating adaptive icon package ===\n');
  console.log('Source: ' + LOGO);
  console.log('Background: ' + BG + '\n');

  writeXMLFiles();

  console.log('\n--- PNG icons (legacy + foreground) ---');
  for (const [density, size] of Object.entries(DENSITIES)) {
    console.log('\n[' + density + ' ' + size + 'px]');
    await genForegroundPNG(density, size);
    console.log('  ic_launcher_foreground.png OK');
    await genLegacyIcon(density, size);
    console.log('  ic_launcher.png OK');
    await genLegacyRound(density, size);
    console.log('  ic_launcher_round.png OK');
  }

  console.log('\n=== ALL DONE ===');
  console.log('Files generated:');
  console.log('  XML: mipmap-anydpi-v26/ic_launcher.xml, ic_launcher_round.xml');
  console.log('  XML: drawable/ic_launcher_foreground.xml, ic_launcher_background.xml, ic_launcher_monochrome.xml');
  console.log('  XML: values/colors.xml (ic_launcher_background=' + BG + ')');
  for (const [density, size] of Object.entries(DENSITIES)) {
    console.log('  PNG: ' + density + '/ (ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png)');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
