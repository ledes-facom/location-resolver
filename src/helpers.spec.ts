import { readTXT } from './helpers';
import { writeFileSync } from 'fs';
import { withFile } from 'tmp-promise';

describe('Location', () => {
  it('should return the current location', async () => {
    await withFile(async ({ path, fd }) => {
      const locales = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'];

      writeFileSync(fd, locales.join('\n'));

      const locations = await readTXT(path);
      expect(locations.map((l) => l.location)).toEqual(locales);
    });
  });
});
