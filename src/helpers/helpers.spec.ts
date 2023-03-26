import { readLines, readTXT } from './helpers';
import { writeFileSync } from 'fs';
import { withFile } from 'tmp-promise';

describe('helpers', () => {
  it('readLines', async () => {
    await withFile(async ({ path, fd }) => {
      const locales = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'];

      writeFileSync(fd, locales.join('\n'));

      const locations = await readLines(path);
      expect(locations).toEqual(locales);
    });
  });

  it('readTXT', async () => {
    await withFile(async ({ path, fd }) => {
      const locales = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'];

      writeFileSync(fd, locales.join('\n'));

      const locations = await readTXT(path);
      expect(locations.map((l) => l.location)).toEqual(locales);
    });
  });
});
