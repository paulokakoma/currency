Calculadora de Câmbio Online
Este projeto é uma calculadora de compras online que ajuda os utilizadores a estimar o custo total de um produto em Kwanzas (AOA), com base numa taxa de câmbio que é obtida dinamicamente de um banco de dados Supabase.

Configuração
Siga estes passos para configurar e executar o projeto localmente.

1. Pré-requisitos
Node.js (versão 16 ou superior)

Uma conta gratuita no Supabase

2. Configurar o Supabase
Crie um novo projeto no seu painel do Supabase.

No menu à esquerda, vá para Table Editor e clique em New table.

Crie uma tabela com o nome config e as seguintes colunas:

id (int8, chave primária, gerado automaticamente)

key (varchar, deve ser único)

value (varchar)

Adicione uma nova linha a esta tabela:

Na coluna key, escreva exchange_rate.

Na coluna value, escreva a taxa de câmbio do dia (ex: 850).

3. Configurar as Variáveis de Ambiente
Renomeie o ficheiro .env.example para .env (se existir) ou crie um novo ficheiro .env na raiz do projeto.

Abra o ficheiro .env e adicione as suas credenciais do Supabase:

SUPABASE_URL=SUA_URL_AQUI
SUPABASE_ANON_KEY=SUA_CHAVE_ANON_AQUI

Pode encontrar a sua URL e a sua Chave Anon (pública) no painel do Supabase, em Settings > API.

4. Instalar as Dependências
Abra o terminal na pasta principal do projeto e execute o seguinte comando para instalar o Express, o Supabase e as outras dependências necessárias:

npm install

5. Executar o Projeto
Depois de a instalação estar completa, execute o seguinte comando para iniciar o servidor:

npm start

O terminal deverá mostrar a mensagem "Servidor a correr em https://www.google.com/search?q=http://localhost:3000".

6. Aceder à Aplicação
Abra o seu navegador e vá para o seguinte endereço:

http://localhost:3000

A calculadora deverá carregar e ir buscar a taxa de câmbio diretamente do seu banco de dados Supabase.# currency
