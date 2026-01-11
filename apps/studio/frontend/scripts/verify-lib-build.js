#!/usr/bin/env node
/**
 * Verify Library Build Output
 *
 * This script checks that the library build includes all expected exports
 * and CSS. Run after `pnpm build` to verify the npm package contents.
 *
 * Usage: node scripts/verify-lib-build.js
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');

const errors = [];
const warnings = [];

console.log('🔍 Verifying library build output...\n');

// Check dist files exist
const requiredFiles = ['index.js', 'index.d.ts', 'styles.css'];
for (const file of requiredFiles) {
  const filePath = resolve(distDir, file);
  if (!existsSync(filePath)) {
    errors.push(`Missing required file: dist/${file}`);
  }
}

// Check JS exports
const jsContent = readFileSync(resolve(distDir, 'index.js'), 'utf-8');
const requiredExports = [
  'WorkflowEditor',
  'NodePalette',
  'NodeInspector',
  'Toolbar',
  'Gallery',
  'useWorkflowStore',
  'useSettingsStore',
  'CommandPalette',
  'KeyboardShortcutsModal',
  'useKeyboardShortcuts',
];

console.log('Checking JS exports:');
for (const exp of requiredExports) {
  if (jsContent.includes(exp)) {
    console.log(`  ✓ ${exp}`);
  } else {
    errors.push(`Missing export: ${exp}`);
    console.log(`  ✗ ${exp} - MISSING`);
  }
}

// Check CSS classes
const cssContent = readFileSync(resolve(distDir, 'styles.css'), 'utf-8');
const requiredCssPatterns = [
  'floimg-studio',      // Main container
  'floimg-toolbar',     // Toolbar styling
  'floimg-node',        // Node styling
  'floimg-palette',     // Palette styling
  'react-flow__',       // React Flow overrides
];

console.log('\nChecking CSS patterns:');
for (const pattern of requiredCssPatterns) {
  if (cssContent.includes(pattern)) {
    console.log(`  ✓ ${pattern}`);
  } else {
    errors.push(`Missing CSS pattern: ${pattern}`);
    console.log(`  ✗ ${pattern} - MISSING`);
  }
}

// Check CSS size (should be > 50KB with Tailwind + theme)
const cssSize = Buffer.byteLength(cssContent, 'utf8');
console.log(`\nCSS size: ${(cssSize / 1024).toFixed(1)} KB`);
if (cssSize < 50000) {
  warnings.push(`CSS file seems small (${(cssSize / 1024).toFixed(1)} KB) - check if theme is included`);
}

// Summary
console.log('\n' + '='.repeat(50));
if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ Library build verification passed!\n');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(e => console.log(`   - ${e}`));
  }
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(w => console.log(`   - ${w}`));
  }
  console.log('');
  process.exit(errors.length > 0 ? 1 : 0);
}
