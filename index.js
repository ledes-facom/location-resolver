/**
 * Author: Hudson Silva Borges
 */
const fs = require("fs");
const path = require("path");
const { get, shuffle, isNil } = require("lodash");
const axios = require("axios");
const csv = require("fast-csv");
const consola = require("consola");
const Promise = require("bluebird");
const { program } = require("commander");
const Keyv = require("keyv");
const cliProgress = require("cli-progress");

/**
 * Função responsável pela leitura do arquivo CSV.
 * É necessário que tenha duas colunas: 'count' e 'location'
 *
 * @param {String} file Caminho do arquivo .csv
 * @returns {Promise<[{ count: number; location: string }]>} Uma lista de strings com os locais
 *
 */
async function readCSV(file) {
  const result = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => reject(error))
      .on("data", (row) =>
        result.push({ count: parseInt(row.count, 10), location: row.location })
      )
      .on("end", () => resolve(result));
  });
}

/**
 * Função para resolver uma localização qualquer usando do HereAPI.
 *
 * @param {String} location Um texto que represente a localização que desejamos resolver
 * @param {String} apiKey Chave de acesso fornecida pela HereAPI
 * @returns {Promise<Object>} retorna um objeto contendo os dados da localização ou 'undefined' se não encontrado
 */
async function resolveLocation(location, apiKey) {
  return axios
    .get("https://geocode.search.hereapi.com/v1/geocode", {
      params: { q: location, apiKey, lang: "en-US" },
    })
    .then((response) => get(response, "data.items[0].address", undefined));
}

program
  .argument("<input_file>", "File containing the locations (.csv)")
  .option("-o, --output [string]", "Output file to save results")
  .option("--api-key [string]", "HereAPI key to make the requests")
  .option("--shuffle", "Shuffle location entries before execution", false)
  .addHelpText(
    "after",
    "\nYou need to provide the HereAPI through HEREAPI_KEY environment variable or --api-key option"
  )
  .action((inputFile) => {
    // Obtem as opções passadas pela linha de comando
    const options = program.opts();

    // Pega a chave das variáveis de ambiente ou pelas opções
    const apiKey = process.env.HEREAPI_KEY || options.apiKey;
    if (!apiKey) return program.help({ error: true });

    // Faz a leitura do arquivo csv com os dados
    consola.debug(`Reading csv file (${inputFile}) ...`);
    readCSV(path.resolve(__dirname, inputFile))
      .then((locations) => locations.map((l) => l.location.trim())) // Faz a limpeza da localicações (e.g., remove espaços dos cantos)
      .then((locations) => (options.shuffle ? shuffle(locations) : locations))
      .then(async (locations) => {
        consola.debug(`Preparing to resolve ${locations.length} locales ...`);

        // Cria um cache local para evitar refazer chamadas à HereAPI
        consola.debug("Creating locales caching ...");
        const keyv = new Keyv("sqlite://.cache.sqlite");

        // Cria o csv stream
        const csvStream = csv.format({
          headers: [
            "location",
            "label",
            "countryCode",
            "countryName",
            "stateCode",
            "state",
            "county",
            "city",
          ],
          quoteColumns: true,
        });

        consola.debug(
          `Piping output to ${options.output ? "file" : "stdout"} ...`
        );
        csvStream
          .pipe(
            options.output
              ? fs.createWriteStream(path.resolve(__dirname, options.output))
              : process.stdout
          )
          .on("end", () => process.exit());

        const bar = new cliProgress.SingleBar(
          {
            format:
              'Progress [{bar}] {percentage}% | ETA: {eta_formatted} | {value}/{total} | "{location}"',
          },
          cliProgress.Presets.shades_classic
        );

        bar.start(locations.length, 0);

        // Itera sobre cada localização esperando cada Promise ser resolvida
        return Promise.each(locations, async (location) => {
          // Recupera a localização do cache
          const cachedLocation = await keyv.get(location);

          // Se não tiver, busca na HereAPI
          const locationPromise = isNil(cachedLocation)
            ? resolveLocation(location, apiKey)
            : Promise.resolve(cachedLocation);

          // Ao resolver a Promise, escreve o dado csv e adiciona nova localização no cache
          return locationPromise
            .catch((error) => {
              if (error.response.status === 400) return null;
              throw error;
            })
            .then(async (response) => {
              csvStream.write({ location, ...response });
              if (cachedLocation) return;
              await keyv.set(location, response || "");
            })
            .finally(() => bar.increment({ location }));
        })
          .then(() => csvStream.end())
          .then(() => consola.debug("Done."))
          .finally(() => bar.stop());
      });
  })
  .parse(process.argv);
