# Location Resolver

`location-resolver` é uma aplicação para resolução de endereços informados por desenvolvedores da plataforma GitHub.

Esse script é necessário uma vez que as localizações informadas são livres, ou seja, cada usuário informa um texto em formato próprio (e.g., Brasil, brazil, br, etc.).

Para isso usamos do [HERE API](https://developer.here.com) para resolver a localização provida em um local padronizado (país, estado, cidade, etc.).

## Como usar

Esta aplicação pode ser usada em modo `servidor` ou `script`. Em ambos os casos é necessário prover a chave de acesso do HERE API. Essa chave pode ser passada como argumento (`--key`) ou como variável de ambiente (`HEREAPI_KEY`). Também é possível passar um conjunto de chaves em um arquivo de texto com uma chave por linha (opção `--keys` ou env `HEREAPI_KEYS`).

### Modo servidor

O modo servidor cria um servidor local que permite a consulta por outros clients usando do protocolo REST.

```console
npx github:ledes-facom/location-resolver --server --port 3000 --key <sua_hereapi_key>
```

Após executar o servidor, você poderá consultar localizações fazendo requisições para `/locations?q=<localização>`. Por exemplo:

```console
curl http://localhost:3001/location?q=brazil
```

A resposta será:

```json
{ "label": "Brazil", "countryCode": "BRA", "countryName": "Brazil" }
```

### Modo script

No modo script é necessário prover um arquivo no formato `csv` contendo uma coluna de nome `location`. Por exemplo:

| location                   | count |
| -------------------------- | ----- |
| brasil                     | 100   |
| mato grosso do sul, brazil | 67    |
| campo grande, ms, br       | 68    |
| ...                        |

Feito isso, basta passar o caminho do arquivo como argumento para a aplicação.

```console
npx github:ledes-facom/location-resolver --key <sua_hereapi_key> locations.csv
```

O resultado será impresso no terminal seguindo a sintaxe de arquivos `csv`. Você também pode optar por informar um arquivo de saída para o resultado com a opção `--output`. Para mais opções use `--help`.

## Cache de resultados

Com intuito de otimizar o uso das requisições da HERE API, o script faz uso de um banco `sqlite` que armazena os resultados de consultas anteriores. Assim, antes de realizar a consulta aos serviços externos, o script verifica se a localização já foi resolvida anteriormente. Em caso positivo, ele reutiliza os resultados obtidos. Caso contrário, realiza a consulta ao HERE API. Essa abordagem permite acelerar o processo usando de resultados locais.

## Autores

- Hudson Silva Borges ([github](https://github.com/hsborges))
