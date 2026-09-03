import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const command = process.argv.slice(2);
const astroCli = fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url));
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const result = spawnSync(process.execPath, [astroCli, ...command], {
  cwd: projectRoot,
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
