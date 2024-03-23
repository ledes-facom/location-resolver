import { readCSV, readLines, readTXT } from './files';
import { writeFileSync } from 'fs';
import { withFile } from 'tmp-promise';

describe('helpers', () => {
  it('readCSV', () => {
    withFile(async ({ path, fd }) => {
      const locales = [
        ['count', 'location'],
        [0, 'São Paulo'],
        [1, 'Rio de Janeiro'],
        [2, 'Belo Horizonte'],
      ];

      writeFileSync(
        fd,
        locales
          .map(
            ([count, location]) =>
              `${typeof count === 'number' ? count : `"${count}"`},"${location}"`,
          )
          .join('\n'),
      );

      await expect(readCSV(path)).resolves.toEqual([
        { count: 0, location: 'São Paulo' },
        { count: 1, location: 'Rio de Janeiro' },
        { count: 2, location: 'Belo Horizonte' },
      ]);
    });
  });

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
