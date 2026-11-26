import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
export const directory = process.env.STATE_DIR || '/state';

export async function settings(portal, department) {
  let stored = {};
  try { stored = JSON.parse(await readFile(directory + '/portal.json', 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const url = new URL(portal || process.env.PLANDAY_PORTAL || stored.origin);
  const selected = department || process.env.PLANDAY_DEPARTMENT || stored.department;
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.planday\.com$/.test(url.hostname) ||
      url.port || url.username || url.password || !/^\d+$/.test(selected)) {
    throw new Error('Set a Planday portal and a numeric department ID.');
  }
  return {origin:url.origin, department:selected};
}

export async function save(file, object) {
  await mkdir(directory, {recursive:true, mode:0o700});
  await writeFile(directory + '/' + file + '.new', JSON.stringify(object), {mode:0o600});
  await rename(directory + '/' + file + '.new', directory + '/' + file);
}
