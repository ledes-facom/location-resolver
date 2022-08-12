
# Location Resolver

Location resolver é um script para resolução de endereços informados por desenvolvedores da plataforma GitHub.

Esse script é necessário uma vez que as localizações informadas são livres, ou seja, cada usuário informa um texto em formato próprio (e.g., Brasil, brazil, br, etc.).

Para isso usamos do [HERE API](https://developer.here.com) para resolver a localização provida em um local padronizado (país, estado, cidade, etc.).

## Como usar

Para usar esse script, é necessário prover um arquivo no formato `csv` contendo uma coluna de nome `location`. Por exemplo:

|location  | count |
|--|--|
| brasil | 100 |
| mato grosso do sul, brazil | 67 |
| campo grande, ms, br | 68 |
| ... |

Além disso, é necessário prover a chave de acesso do HERE API. Essa chave pode ser passada como argumento (`--api-key`) ou como variável de ambiente (`HEREAPI_KEY`).

## Cache de resultados

Com intuito de otimizar o uso das requisições da HERE API, o script faz uso de um banco `sqlite` que armazena os resultados de consultas anteriores. Assim, antes de realizar a consulta aos serviços externos, o script verifica se a localização já foi resolvida anteriormente. Em caso positivo, ele reutiliza os resultados obtidos. Caso contrário, realiza a consulta ao HERE API. Essa abordagem permite acelerar o processo usando de resultados locais.

## Autores

 - Hudson Silva Borges ([github](https://github.com/hsborges)) 
