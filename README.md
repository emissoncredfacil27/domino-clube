# Dominó Clube

Jogar: https://emissoncredfacil27.github.io/domino-clube/

Modalidades Clássico, Ponta de 5 e Fechado; mesas de 2, 3 ou 4 amigos. Há também treino local contra robôs em três níveis. Partidas gratuitas: apostas, Pix e saques não estão ativos.

## Acesso em família

1. O dono cria a mesa no aparelho que usará nos próximos jogos.
2. Toca em **Enviar acesso fixo para meu pai** e envia esse convite uma única vez.
3. Ao abrir esse acesso, o convidado entra e confirma automaticamente, sem nome, código ou senha. Nos próximos acessos, usa o mesmo link ou o atalho salvo no celular.
4. O dono continua responsável por iniciar a partida e manter o jogo aberto.

O endereço fixo depende da chave salva no navegador do dono. Use o mesmo aparelho e navegador. Apagar os dados do navegador ou usar navegação privada pode exigir um novo convite. O convidado também mantém sua identificação neste aparelho para recuperar o mesmo lugar ao retornar.

## Conexão

A versão atual usa um retransmissor HTTPS no Render, eliminando a dependência de uma conexão WebRTC direta entre os celulares. Não é necessário abrir portas no roteador. O servidor retransmite mensagens de canais individuais; a autoridade e as regras continuam no jogo do dono. Ele não guarda as partidas em banco de dados. Um reinício do retransmissor recupera os canais enquanto o dono mantém a mesa aberta.

O plano Free do Render pode suspender o serviço após inatividade e levar cerca de um minuto para despertar. O jogo tenta reconectar. Os limites do plano gratuito continuam aplicáveis. Durante uma partida, o prazo original de dois minutos para retorno permanece valendo.

- Servidor: `relay-server.cjs`, sem dependências externas.
- Render: Node, plano Free, região Virginia, build `node --check relay-server.cjs`, start `node relay-server.cjs`.
- Origem permitida: `https://emissoncredfacil27.github.io`.
- Verificação: `GET /health`.
- Testes: `node --test relay-server.test.cjs`.
- Atualizações do servidor: deploy manual no Render, após os testes. A publicação do HTML continua pelo GitHub Pages.

O HTML continua autossuficiente para a interface, gráficos, sons e regras; o jogo on-line requer o servidor HTTPS. A biblioteca PeerJS incorporada permanece disponível como compatibilidade quando o endereço do retransmissor não está configurado. Sua licença está em PEERJS-LICENSE.txt.
