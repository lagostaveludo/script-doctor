

\## Script Doctor - V2 ##





fluxo de trabalho



\+ usuario começa com rascunho



\+ usa IA para expandir do rascunho para sinopse, logline, premissa, encontrar estilo, etc)



\+ com os documentos todos preparadso no projeto, quebra em capitulos ou partes



\+ cada capitulo tem uma lista de items de escaleta, que depois vão virar paragrafos de fato



\+ varias ferramentas de IA dentro do app para transformar quaisquer tipo de documentos que se tenha em docs formais de roteiro e para quebrar em capitulos e items de escaleta



\+ com os items de escaleta preparados e todos os demais documentos, cada item de escaleta pode ser trabalhado individualmente até que se tenha paragrafos (com ajuda da IA)



\+ cada paragrafo escrito pela IA pode ser rejeitado ou aprovado, semelhante ao que ocorre em uma IDE para programação como Cursor.



\+ para cada item de escaleta, se observa os paragrafos já aprovados e a qualquer momento podem ser reescritos



\+ o app fornece formas ricas de visualizar e até editar documentos do projeto (geralmente como arquivos .md)



\+ a visualização do projeto permite também a qualquer momento gerar o pdf, configurar arte de capa, epilogo, prologo, etc. Inclusive criar versões para revisão, que são enviadas para uma lista de emails dos revisores cadastrados no projeto.



\+ um revisor pode ter um email formal e um email kindle



\+ ao gerar uma versão de revisão, geramos o pdf e podemos enviar para os testadores junto com orientações para revisão (texto cadastrado na versão de revisão)



\+ ao enviar revisão para os revisadores, o pdf é enviado para o email kindle e as orientações são enviadas para o email normal.







projeto



\+ exibir separadamente lista de documentos formais globais (padronizar nomes em ingles - logline, premissa, sinopse-curta, sinopse-expandida, argumento, estilo-livro, estilo-screenplay) e documentos formais por capitulo ou parte (escaleta, roteiro-screenplay, roteiro-producao, roteiro-livro)



\+ funcionalidade de extrair documentos formais a partir dos documentos anexos no projeto (os que forem possíveis)



\+ editor estilo notion (talvez ver um plugin q tb funcione no mobile)



\+ permitir editar todos os documentos, editando no estilo notion ou com botão "ajustar com IA" (dai abre uma janela onde ditamos verbalmente o q queremos e ele ajusta e salva o doc)



\+ todo documento vira texto direto dentro do banco, o que pode permitir edição pelo app







edição via escaleta



\+ adicionar e remover items de escaleta (cada item é uma batida de roteiro com um rascunho de como pode ser escrita, o que é importate e tudo o mais)



\+ um item de escaleta pode ter um ou varios paragrafos



\+ em cada paragrafo podemos rejeitar ou aceitar







UI



\+ interface deve ser limpa, mas deve oferecer as funcionalidades q precisamos no dinamismo projeto > capitulo (ou parte, não importa como o usuario quiser chamar) > escaleta > paragrafo



\+ estilo visual tipo Ulysses (branco e preto, simples, com areas colapsáveis)



* botões elegantes
* sem mtas boxes, navegação fluida como uma IDE para escrita







banco de dados



\+ no banco de dados, as entidades devem respeitar a seguinte relação

projeto tem varios capitulos, que tem varios items de escaleta, que tem varios paragrafos 







projeto



\+ tem lista de documentos formais e documentos livres



\+ tem arte de capa, indice (gerado automatiamente), prologo, agradecimentos, epilogo opcionalmente



\+ tem revisores (para cada um nome, email pessoal, email kindle)



\+ funcionalidade de gerar versão de revisão



\+ para cada versão de revisão, funcionalidade de gerar pdf e enviar para revisores. 







editor estilo notion



\+ imagino todo texto usando algum tipo de editor facil onde cada bloco tem ações possiveis associadas a ele



\+ botões em cada bloco de texto (simplificar com IA, encurtar, expandir)







extra



\+ context menu em todas as entidades (jogar para chat)



\+ janela de chat colapsavel sempre disponivel



\+ poder dar instruções genericas em um chat com a IA, mencionando arquivos do projeto assim como fazemos no Cursor, pedindo ações diversas como 'use este arquivo para quebrar em items de escaleta no capitulo X' ... ou 'revise a sequencia de escaleta do capitulo 9 e me diga como está a progressão de suspense e tensão'

