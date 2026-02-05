/*
  Generate an inspector parameter registry from TypeScript schema (types/cms.ts)
  - Extracts all Block interfaces (…Block) and ThemeConfig
  - Flattens nested objects (e.g., style.backgroundColor)
  - Infers basic type info and suggests Inspector Tab and Control type
  - Compares against docs/inspector/param-matrix.csv (if present)
  - Writes:
      docs/inspector/param-registry.json
      docs/inspector/param-matrix.generated.csv
      docs/inspector/audit-report.md
*/

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

type EnumInfo = { kind: 'enum'; values: string[] };
type TypeInfo = { kind: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'unknown' } | EnumInfo;

type ParamRow = {
  BlockType: string;
  ParameterPath: string; // e.g., style.backgroundColor
  Type: string; // human-friendly description or enum values
  Optional: boolean;
  SuggestedTab: 'content' | 'settings' | 'styles' | 'theme';
  SuggestedControl: string; // e.g., color, toggle, number, slider+number, media, select, segmented
};

const ROOT = process.cwd();
const TYPES_FILE = path.join(ROOT, 'types', 'cms.ts');
const DOCS_DIR = path.join(ROOT, 'docs', 'inspector');
const CSV_EXISTING = path.join(DOCS_DIR, 'param-matrix.csv');
const CSV_OUT = path.join(DOCS_DIR, 'param-matrix.generated.csv');
const JSON_OUT = path.join(DOCS_DIR, 'param-registry.json');
const PUBLIC_DIR = path.join(ROOT, 'public', 'inspector');
const REPORT_OUT = path.join(DOCS_DIR, 'audit-report.md');

function ensureDocsDir() {
  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
}

function createProgram() {
  const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, 'tsconfig.json');
  const config = configPath
    ? ts.parseJsonConfigFileContent(
        ts.readConfigFile(configPath, ts.sys.readFile).config,
        ts.sys,
        ROOT
      )
    : { options: { strictNullChecks: true } };
  return ts.createProgram([TYPES_FILE], config.options);
}

function getInterfaceMap(checker: ts.TypeChecker, sf: ts.SourceFile) {
  const interfaces = new Map<string, ts.InterfaceDeclaration>();
  sf.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node)) {
      interfaces.set(node.name.text, node);
    }
  });
  return interfaces;
}

function getPropTypeInfo(checker: ts.TypeChecker, symbol: ts.Symbol, node: ts.Node): TypeInfo {
  const type = checker.getTypeOfSymbolAtLocation(symbol, node);

  if (type.isUnion()) {
    const types = type.types.filter(
      (t) => (t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)) === 0
    );
    const values: string[] = [];
    let allStringLiterals = true;
    let allStringLike = true;
    let allNumberLike = true;
    let allBooleanLike = true;
    for (const t of types) {
      if ((t.flags & ts.TypeFlags.StringLiteral) !== 0) {
        values.push((t as ts.StringLiteralType).value);
      } else {
        allStringLiterals = false;
      }
      if ((t.flags & ts.TypeFlags.StringLike) === 0) allStringLike = false;
      if ((t.flags & ts.TypeFlags.NumberLike) === 0) allNumberLike = false;
      if ((t.flags & ts.TypeFlags.BooleanLike) === 0) allBooleanLike = false;
    }
    if (allStringLiterals && values.length) return { kind: 'enum', values };
    if (allStringLike) return { kind: 'string' };
    if (allNumberLike) return { kind: 'number' };
    if (allBooleanLike) return { kind: 'boolean' };
    return { kind: 'unknown' };
  }

  if (type.getCallSignatures().length > 0) return { kind: 'unknown' };

  if (type.flags & ts.TypeFlags.BooleanLike) return { kind: 'boolean' };
  if (type.flags & ts.TypeFlags.NumberLike) return { kind: 'number' };
  if (type.flags & ts.TypeFlags.StringLike) return { kind: 'string' };
  if (checker.isArrayType(type)) return { kind: 'array' };

  if (type.flags & ts.TypeFlags.Object) return { kind: 'object' };
  return { kind: 'unknown' };
}

function flattenType(
  checker: ts.TypeChecker,
  type: ts.Type,
  pathPrefix: string,
  target: { name: string; optional: boolean; type: TypeInfo }[],
  nodeForLoc: ts.Node
) {
  const props = type.getProperties();
  for (const prop of props) {
    const name = prop.getName();
    const declarations = prop.getDeclarations();
    const decl = declarations && declarations[0];
    const optional = !!((prop.getFlags() & ts.SymbolFlags.Optional) || (decl && ts.isPropertySignature(decl) && !!decl.questionToken));
    const typeInfo = getPropTypeInfo(checker, prop, decl || nodeForLoc);

    const fq = pathPrefix ? `${pathPrefix}.${name}` : name;

    // If object literal type (inline), recurse to flatten regardless of inferred kind
    if (decl && ts.isPropertySignature(decl) && decl.type && ts.isTypeLiteralNode(decl.type)) {
      const childType = checker.getTypeFromTypeNode(decl.type);
      flattenType(checker, childType, fq, target, decl.type);
      continue;
    }

    target.push({ name: fq, optional, type: typeInfo });
  }
}

function suggestTab(block: string, paramPath: string): ParamRow['SuggestedTab'] {
  if (block === 'ThemeConfig') return 'theme';
  const p = paramPath.toLowerCase();
  if (p.startsWith('style.') || p.includes('color') || p.includes('font') || p.includes('shadow') || p.includes('border') || p.includes('background') || p.includes('opacity')) return 'styles';
  if (p.includes('content') || p.endsWith('.src') || p.endsWith('.url') || p.includes('caption') || p.includes('label') || p.includes('images') || p.includes('artworks') || p.includes('query')) return 'content';
  return 'settings';
}

function suggestControl(paramPath: string, type: TypeInfo): string {
  const p = paramPath.toLowerCase();
  if ('kind' in type && type.kind === 'enum') {
    return type.values.length <= 5 ? 'segmented' : 'select';
  }
  if ((type as any).kind === 'boolean') return 'toggle';
  if ((type as any).kind === 'number') {
    if (p.includes('opacity')) return 'slider+number(0..1,0.01)';
    if (p.includes('gap') || p.includes('thickness') || p.includes('columns') || p.includes('scale')) return 'slider+number';
    return 'number';
  }
  if ((type as any).kind === 'string') {
    if (p.includes('color')) return 'color';
    if (p.endsWith('.url') || p.includes('image') || p.endsWith('src') || p.includes('backgroundimage')) return 'media';
    if (p.includes('font') || p.includes('family')) return 'text';
    if (p.includes('size') || p.includes('height') || p.includes('width') || p.includes('radius') || p.includes('position')) return 'text (CSS)';
    return 'text';
  }
  if ((type as any).kind === 'array') {
    if (p.includes('images')) return 'media-multi';
    if (p.includes('artworks') || p.includes('selection')) return 'entity-multi';
    return 'list';
  }
  return 'text';
}

function toHumanType(t: TypeInfo): string {
  if ('kind' in t && t.kind === 'enum') return `enum<${t.values.join('|')}>`;
  return (t as any).kind;
}

function readExistingCsv(): ParamRow[] {
  if (!fs.existsSync(CSV_EXISTING)) return [];
  const raw = fs.readFileSync(CSV_EXISTING, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];
  const header = lines[0].split(',');
  const hMap = new Map(header.map((h, i) => [h.trim(), i] as const));
  const rows: ParamRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const get = (k: string) => cols[hMap.get(k) ?? -1]?.trim();
    const BlockType = (get('BlockType') || '').trim();
    const ParameterPath = (get('Parameter') || get('ParameterPath') || '').trim();
    if (!BlockType || !ParameterPath) continue;
    rows.push({
      BlockType,
      ParameterPath,
      Type: get('Type') || '',
      Optional: (get('Optional') || '').toLowerCase() === 'true',
      SuggestedTab: (get('Tab') as any) || 'settings',
      SuggestedControl: get('ControlType') || ''
    });
  }
  return rows;
}

function writeCsv(rows: ParamRow[]) {
  const header = ['BlockType', 'ParameterPath', 'Type', 'Optional', 'SuggestedTab', 'SuggestedControl'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      r.BlockType,
      r.ParameterPath,
      r.Type,
      String(r.Optional),
      r.SuggestedTab,
      r.SuggestedControl
    ].join(','));
  }
  fs.writeFileSync(CSV_OUT, lines.join('\n'), 'utf8');
}

function writeJson(rows: ParamRow[]) {
  const byBlock: Record<string, ParamRow[]> = {};
  for (const r of rows) {
    if (!byBlock[r.BlockType]) byBlock[r.BlockType] = [];
    byBlock[r.BlockType].push(r);
  }
  fs.writeFileSync(JSON_OUT, JSON.stringify(byBlock, null, 2), 'utf8');
  // Also export to public for client-side consumption
  try {
    if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(path.join(PUBLIC_DIR, 'param-registry.json'), JSON.stringify(byBlock, null, 2), 'utf8');
  } catch {}
}

function writeReport(generated: ParamRow[], existing: ParamRow[]) {
  const byKey = new Set(generated.map(r => `${r.BlockType}::${r.ParameterPath}`));
  const existingKeys = new Set(existing.map(r => `${r.BlockType}::${r.ParameterPath}`));

  const missingInCsv = generated.filter(r => !existingKeys.has(`${r.BlockType}::${r.ParameterPath}`));
  const obsoleteInCsv = existing.filter(r => !byKey.has(`${r.BlockType}::${r.ParameterPath}`));

  // Duplicates within a block (same leaf name appearing multiple times)
  const duplicates: { block: string; name: string; count: number }[] = [];
  const grouped = new Map<string, Map<string, number>>();
  for (const r of generated) {
    const leaf = r.ParameterPath.split('.').pop() || r.ParameterPath;
    const m = grouped.get(r.BlockType) || new Map<string, number>();
    m.set(leaf, (m.get(leaf) || 0) + 1);
    grouped.set(r.BlockType, m);
  }
  for (const [block, m] of grouped) {
    for (const [leaf, count] of m) {
      if (count > 1) duplicates.push({ block, name: leaf, count });
    }
  }

  const lines: string[] = [];
  lines.push('# Audit Inspector');
  lines.push('');
  lines.push('## Résumé');
  lines.push(`- Paramètres générés: ${generated.length}`);
  lines.push(`- Paramètres manquants dans docs/inspector/param-matrix.csv: ${missingInCsv.length}`);
  lines.push(`- Paramètres obsolètes listés dans le CSV: ${obsoleteInCsv.length}`);
  lines.push(`- Doublons (même nom de champ final dans un même bloc): ${duplicates.length}`);
  lines.push('');
  lines.push('## Manquants dans le CSV');
  for (const r of missingInCsv.slice(0, 200)) {
    lines.push(`- ${r.BlockType} :: ${r.ParameterPath} (${r.Type}) → ${r.SuggestedTab}/${r.SuggestedControl}`);
  }
  if (missingInCsv.length > 200) lines.push(`… (${missingInCsv.length - 200} de plus)`);
  lines.push('');
  if (obsoleteInCsv.length) {
    lines.push('## Obsolètes (présents dans CSV, absents du schéma)');
    for (const r of obsoleteInCsv) lines.push(`- ${r.BlockType} :: ${r.ParameterPath}`);
    lines.push('');
  }
  if (duplicates.length) {
    lines.push('## Doublons par bloc');
    for (const d of duplicates) lines.push(`- ${d.block}: ${d.name} ×${d.count}`);
    lines.push('');
  }
  fs.writeFileSync(REPORT_OUT, lines.join('\n'), 'utf8');
}

function main() {
  ensureDocsDir();
  if (!fs.existsSync(TYPES_FILE)) {
    console.error('Schema file not found:', TYPES_FILE);
    process.exit(1);
  }

  const program = createProgram();
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(TYPES_FILE);
  if (!sf) throw new Error('Unable to read source file');

  const ifaceMap = getInterfaceMap(checker, sf);
  const blockNames = Array.from(ifaceMap.keys()).filter((n) => n.endsWith('Block'));
  const targetBlocks = [...blockNames, 'ThemeConfig'];

  const rows: ParamRow[] = [];

  for (const name of targetBlocks) {
    const iface = ifaceMap.get(name);
    if (!iface) continue;
    // Resolve interface type, including extension (heritage) for BaseBlock
    const symbol = checker.getSymbolAtLocation(iface.name);
    if (!symbol) continue;
    const type = checker.getDeclaredTypeOfSymbol(symbol);

    // Compose with extended interfaces
    let toProcess: ts.Type[] = [type];
    if (iface.heritageClauses) {
      for (const h of iface.heritageClauses) {
        for (const t of h.types) {
          const baseType = checker.getTypeAtLocation(t.expression);
          toProcess.push(baseType);
        }
      }
    }

    const fields: { name: string; optional: boolean; type: TypeInfo }[] = [];
    for (const t of toProcess.reverse()) {
      flattenType(checker, t, '', fields, iface);
    }

    // Deduplicate fields by name (last one wins - child overrides base)
    const seen = new Map<string, { optional: boolean; type: TypeInfo }>();
    for (const f of fields) seen.set(f.name, { optional: f.optional, type: f.type });

    for (const [paramName, meta] of seen) {
      // Skip core identifiers when not user-editable
      if (paramName === 'id' || paramName === 'type') continue;

      const tab = suggestTab(name, paramName);
      const control = suggestControl(paramName, meta.type);
      rows.push({
        BlockType: name,
        ParameterPath: paramName,
        Type: toHumanType(meta.type),
        Optional: meta.optional,
        SuggestedTab: tab,
        SuggestedControl: control,
      });
    }
  }

  // Sort
  rows.sort((a, b) => (a.BlockType === b.BlockType ? a.ParameterPath.localeCompare(b.ParameterPath) : a.BlockType.localeCompare(b.BlockType)));

  const existing = readExistingCsv();
  writeCsv(rows);
  writeJson(rows);
  writeReport(rows, existing);

  console.log(`Generated ${rows.length} parameters.`);
  console.log(`- ${path.relative(ROOT, CSV_OUT)}`);
  console.log(`- ${path.relative(ROOT, JSON_OUT)}`);
  console.log(`- ${path.relative(ROOT, REPORT_OUT)}`);
}

main();
