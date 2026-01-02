#!/usr/bin/env node
/**
 * Changelog to JSON converter
 *
 * Parses CHANGELOG.md and outputs structured JSON for programmatic use.
 *
 * Usage:
 *   node scripts/changelog-to-json.js                    # Output to stdout
 *   node scripts/changelog-to-json.js --output changelog.json
 *   node scripts/changelog-to-json.js --pretty           # Pretty print
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Detects the category of a release based on its content
 */
function detectCategory(packages, sections) {
  const hasStudio = packages.some(p =>
    p.name.includes('studio') ||
    p.name.includes('floimg-studio')
  );

  const hasCloud = packages.some(p =>
    p.name.includes('cloud') ||
    p.name.includes('fsc')
  );

  if (hasCloud) return 'Cloud';
  if (hasStudio) return 'Studio';
  return 'SDK';
}

/**
 * Detects change type from description
 */
function detectChangeType(description) {
  const lower = description.toLowerCase();

  if (lower.startsWith('breaking:') || lower.includes('breaking change')) {
    return 'breaking';
  }
  if (lower.startsWith('feat:') || lower.startsWith('feat(') || lower.startsWith('add ') || lower.includes('new ')) {
    return 'feat';
  }
  if (lower.startsWith('fix:') || lower.startsWith('fix(') || lower.includes('fixed')) {
    return 'fix';
  }
  if (lower.startsWith('docs:') || lower.startsWith('doc:') || lower.includes('documentation')) {
    return 'docs';
  }
  if (lower.startsWith('chore:') || lower.startsWith('refactor:') || lower.startsWith('style:')) {
    return 'chore';
  }

  return 'other';
}

/**
 * Parses CHANGELOG.md content into structured JSON
 */
function parseChangelog(content) {
  const releases = [];
  const lines = content.split('\n');

  let currentRelease = null;
  let currentPackage = null;
  let currentSection = null;

  for (const line of lines) {
    // Match version header: ## [v0.8.3] - 2026-01-01 or ## [0.7.1] - 2025-12-31
    const versionMatch = line.match(/^## \[v?(\d+\.\d+\.\d+)\]\s*-?\s*(\d{4}-\d{2}-\d{2})?/);
    if (versionMatch) {
      // Save previous release
      if (currentRelease) {
        if (currentPackage && currentPackage.changes.length > 0) {
          currentRelease.packages.push(currentPackage);
        }
        if (currentSection && currentSection.items.length > 0) {
          currentRelease.sections.push(currentSection);
        }
        currentRelease.category = detectCategory(currentRelease.packages, currentRelease.sections);
        releases.push(currentRelease);
      }

      const version = versionMatch[1].startsWith('v') ? versionMatch[1] : `v${versionMatch[1]}`;
      currentRelease = {
        version,
        date: versionMatch[2] || '',
        packages: [],
        sections: [],
        category: 'SDK',
      };
      currentPackage = null;
      currentSection = null;
      continue;
    }

    // Skip unreleased section
    if (line.match(/^## \[Unreleased\]/i)) {
      currentRelease = null;
      continue;
    }

    if (!currentRelease) continue;

    // Match package header: ### @teamflojo/floimg (0.7.2)
    const packageMatch = line.match(/^### (@teamflojo\/[\w-]+)\s*\((\d+\.\d+\.\d+)\)/);
    if (packageMatch) {
      // Save previous package
      if (currentPackage && currentPackage.changes.length > 0) {
        currentRelease.packages.push(currentPackage);
      }
      currentPackage = {
        name: packageMatch[1],
        version: packageMatch[2],
        changes: [],
      };
      currentSection = null;
      continue;
    }

    // Match section header: ### Added, ### Fixed, ### Repository
    const sectionMatch = line.match(/^### (Added|Fixed|Changed|Deprecated|Removed|Security|Repository|Breaking)/i);
    if (sectionMatch) {
      // Save current package if any
      if (currentPackage && currentPackage.changes.length > 0) {
        currentRelease.packages.push(currentPackage);
        currentPackage = null;
      }
      // Save previous section
      if (currentSection && currentSection.items.length > 0) {
        currentRelease.sections.push(currentSection);
      }
      currentSection = {
        name: sectionMatch[1],
        items: [],
      };
      continue;
    }

    // Match change item: - description
    const changeMatch = line.match(/^- (.+)$/);
    if (changeMatch) {
      const description = changeMatch[1].trim();
      const type = detectChangeType(description);

      if (currentPackage) {
        currentPackage.changes.push({ type, description });
      } else if (currentSection) {
        currentSection.items.push({ type, description });
      }
      continue;
    }

    // Match sub-items: #### Category or **Item**
    const subHeaderMatch = line.match(/^####\s+(.+)$/) || line.match(/^\*\*(.+)\*\*/);
    if (subHeaderMatch && currentSection) {
      // Add as a section item
      currentSection.items.push({
        type: 'feat',
        description: subHeaderMatch[1].trim(),
      });
    }
  }

  // Don't forget the last release
  if (currentRelease) {
    if (currentPackage && currentPackage.changes.length > 0) {
      currentRelease.packages.push(currentPackage);
    }
    if (currentSection && currentSection.items.length > 0) {
      currentRelease.sections.push(currentSection);
    }
    currentRelease.category = detectCategory(currentRelease.packages, currentRelease.sections);
    releases.push(currentRelease);
  }

  return releases;
}

// Main execution
const args = process.argv.slice(2);
const pretty = args.includes('--pretty');
const outputIndex = args.indexOf('--output');
const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;

const changelogPath = resolve(__dirname, '../CHANGELOG.md');
const content = readFileSync(changelogPath, 'utf-8');
const releases = parseChangelog(content);

const json = pretty ? JSON.stringify(releases, null, 2) : JSON.stringify(releases);

if (outputPath) {
  writeFileSync(resolve(process.cwd(), outputPath), json);
  console.log(`Wrote ${releases.length} releases to ${outputPath}`);
} else {
  console.log(json);
}
