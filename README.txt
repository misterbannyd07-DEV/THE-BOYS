THE BOYS — PROJECTO INICIAL
===========================

Conteúdo:
- index.html       Página inicial
- eventos.html     Calendário e cards de eventos
- galeria.html     Cards dos eventos realizados e visualizador de fotografias/vídeos
- sobre.html       Organizações integrantes e parceiros
- admin.html       Ferramenta local de gestão, importação e exportação JSON
- css/style.css    Estilos organizados e responsivos
- js/site.js       Comportamento das páginas públicas
- js/admin.js      Comportamento da ferramenta administrativa
- dados/eventos.json  Dados de exemplo editáveis

COMO ABRIR NO VS CODE
1. Extrai a pasta the-boys-site.
2. Abre o VS Code e escolhe File > Open Folder.
3. Selecciona a pasta the-boys-site.
4. Para testar, usa uma extensão de servidor local (por exemplo, Live Server) ou inicia um servidor local.
   Exemplo com Python instalado, no terminal do VS Code, dentro da pasta:
   python -m http.server 8000
5. Abre http://localhost:8000 no navegador.
6. A página administrativa local é admin.html. Não existe link para ela no menu público.

COMO GERIR EVENTOS
1. Abre http://localhost:8000/admin.html.
2. Podes importar um ficheiro JSON existente, criar eventos, editar ou apagar.
3. Exporta o ficheiro eventos.json.
4. Substitui dados/eventos.json pelo JSON exportado.
5. Faz novo deploy do site público.

IMPORTANTE SOBRE A ADMINISTRAÇÃO
Esta é uma ferramenta local sem autenticação e não deve ser publicada como painel seguro.
A página admin.html não aparece na navegação pública, mas a ausência de um link não é controlo de acesso.
O rascunho é guardado no localStorage do navegador; exporta frequentemente para evitar perda de dados.

IMAGENS E VÍDEOS
- Para imagens locais, coloca os ficheiros em imagens/flyers/ ou imagens/galeria/ e escreve o caminho relativo no JSON.
- Os caminhos e URLs das imagens têm de existir no projecto publicado.
- YouTube pode ser incorporado por iframe quando o link é reconhecido.
- TikTok, nesta versão inicial, aparece como link externo; incorporar TikTok requer um mecanismo próprio e poderá ser acrescentado numa fase posterior.
- As imagens da galeria só são solicitadas quando a área do evento é aberta; as miniaturas usam carregamento diferido.
- Os exemplos do JSON devem ser substituídos pelos dados reais antes de publicar.

NOTA
Este é um protótipo inicial funcional, com conteúdo demonstrativo. Revê todos os dados, links, imagens e comportamento no navegador antes de publicar.

ACTUALIZAÇÃO — versão de revisão

1. SOBRE: as quatro organizações e os quatro parceiros estão escritos directamente em sobre.html. Edita os nomes, descrições, caminhos de logótipos/fotografias e links sociais nessa página. Estes dados já não dependem de dados/eventos.json.
2. NAVEGAÇÃO: em telemóveis é usado o dock flutuante inferior; o botão de menu hambúrguer foi removido.
3. TEMA: o botão de lua/sol alterna entre modo diurno e nocturno e guarda a preferência neste navegador.
4. EVENTOS: a página Eventos permite escolher os anos de 2023 a 2027. Os eventos continuam a ser lidos de dados/eventos.json e aparecem no ano correspondente à data.
5. VÍDEOS NA ADMINISTRAÇÃO: os campos YouTube e TikTok estão separados. No YouTube podes colar o link completo ou apenas o ID do vídeo. No TikTok cola o link partilhado completo; o sistema tenta extrair o ID numérico. Depois exporta o JSON e substitui dados/eventos.json.
6. A administração continua a ser uma ferramenta local de preparação de dados, sem autenticação. Não a publiques como painel seguro.

Para editar o conteúdo de Sobre, abre sobre.html e procura os comentários “Edita estes quatro cards directamente neste HTML”.
