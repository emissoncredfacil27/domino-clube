# Dominó Clube — online entre amigos

Versão sem robôs. Publique index.html no GitHub Pages por HTTPS. PeerJS 1.5.5 está incorporado no HTML; a conexão usa o serviço de sinalização PeerJS Cloud e WebRTC.

## Como jogar

1. Dono: informar nome, escolher Clássico, Ponta de 5 ou Fechado e mesa de 2 ou 4 pessoas.
2. Enviar o link pelo WhatsApp, copiar link ou compartilhar o código de 12 caracteres.
3. Amigos: abrir link, informar nome e entrar. Ver regras completas e confirmar aceite.
4. Dono: aceitar as regras e tocar em Iniciar partida quando todos estiverem presentes e prontos.
5. Todos acompanham a mesma sequência de jogadas. Cada convidado recebe somente a própria mão e as contagens adversárias. Todas as pedras são mostradas no resultado.
6. Dono pode preparar outra rodada com os mesmos amigos; todos precisam aceitar novamente.

Mantenha a página aberta e o aparelho ativo. Trocar de app ou bloquear o iPhone pode suspender a conexão. Após copiar/enviar convite, volte ao jogo. Não há jogo contra o computador.

## Regras da casa

28 pedras, 7 por pessoa, 2 ou 4 participantes individuais (sem equipes), primeiro jogador aleatório, primeira pedra livre.

- Clássico: compra até encaixar ou acabar estoque; passa apenas sem encaixe e sem estoque. Mão vazia vence; trancamento usa menor soma na mão, igualdade empata.
- Fechado: sem compra. Todos passarem consecutivamente encerra a rodada. Mão vazia vence; trancamento usa menor soma, igualdade empata.
- Ponta de 5: compra como Clássico. Soma das duas pontas em múltiplo positivo de cinco rende essa quantidade de pontos. Sem ramificações; primeira pedra conta os dois lados. Ao bater/trancar, maior pontuação vence; menor soma na mão desempata; igualdade final empata. Uma rodada por partida.
- Desistência cancela rodada sem vencedor.
- Desconexão pausa as jogadas por até 120 segundos; retorno com o mesmo identificador de sessão recupera lugar e mão. Passado o prazo, cancelamento sem vencedor. Se o dono fechar/recarregar a página, o estado da mesa é perdido e é necessário criar outra.

As regras dos nomes Ponta de 5 e Fechado podem variar. Estas são as regras exibidas aos amigos para aceite nesta versão.

## Arquitetura e limites

Página estática + PeerJS Cloud para sinalização + canais WebRTC. O navegador do dono mantém e valida o estado da partida, distribui as mãos, verifica turno/encaixe/compra e envia visões individuais. Não há banco de partidas nem servidor autoritativo independente. O dono tecnicamente controla o estado completo; inadequado para apostas reais ou competição com adversários não confiáveis.

O histórico salvo é local. Nomes e mensagens de partida transitam pelos canais de dados entre os participantes. Os identificadores de conexão passam pelo serviço de sinalização; não inserir CPF, documentos, telefones ou dados financeiros. Compartilhe o convite apenas com seus amigos; quem tiver o link pode ocupar um lugar livre. Não há cadastro ou identidade verificada.

Conectividade depende das redes e do serviço de sinalização. Esta versão não configura um relay TURN dedicado; redes que impeçam WebRTC direto podem não conectar. Em erro de conexão, o app avisa para verificar a internet ou tentar outra rede. Para serviço profissional com disponibilidade e reconexão persistente, implementar servidor de salas/partidas e relay de rede adequado.

Pix, carteira, saque e apostas reais permanecem desativados. Pagamentos e identidade exigem serviços próprios e avaliação da operação antes de ativação.

## Verificação automatizada

120 partidas simulando ações humanas nas três modalidades, 2/4 participantes, verificando conservação/encaixe das pedras e conclusão. Testes adicionais para mãos individuais nos snapshots, aceites, início exclusivo pelo dono, turno, pausa e abandono. Simulações não substituem testes entre redes diferentes.

## Dependência

PeerJS 1.5.5 — https://github.com/peers/peerjs — licença MIT. Biblioteca incorporada ao index.html. Documentação: https://peerjs.com/client/getting-started e https://peerjs.com/server/cloud.
