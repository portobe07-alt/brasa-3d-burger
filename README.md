# BRASA 3D BURGER — cardápio digital interativo

Cardápio digital para uma hamburgueria artesanal fictícia: cinco hambúrgueres
com **visualizador 3D interativo**, rotação de 360°, zoom que separa
progressivamente as camadas, **escolha do ponto da carne com corte em 3D**,
batatas fritas em três tamanhos, bebidas, montagem de combos, personalização
que altera o modelo em tempo real e carrinho com cálculo automático.

A arquitetura foi pensada para virar a base de um SaaS multi-restaurante: os
dados do cardápio, os preços dos adicionais e as configurações da loja estão
separados da interface, em arquivos tipados.

---

## Como executar

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # verificação de tipos + build de produção
npm run preview  # serve o build de produção
npm run lint
```

O servidor de desenvolvimento sobe em `http://localhost:5173`.

---

## Visualizador 3D

A geometria dos hambúrgueres é **gerada proceduralmente em three.js**. Não há
arquivo GLB, nem dependência de modelo externo: ao abrir um produto, cada
ingrediente vira uma malha própria — perfis de revolução para pães e carnes,
superfícies onduladas para folhas e molhos, fatias que escorrem para o queijo,
tiras torcidas para o bacon. A irregularidade vem de ruído determinístico, então
o mesmo hambúrguer é sempre idêntico, mas duas carnes do mesmo prato têm bordas
diferentes.

Detalhes em [`src/three/README.md`](src/three/README.md).

### Rotação de 360°

Arraste com o mouse ou um dedo para girar em qualquer direção — frente, costas,
laterais, topo e base. O eixo horizontal é livre; o vertical vai de quase
diretamente acima a quase diretamente abaixo.

Girar, aproximar e separar as camadas são independentes e combináveis: dá para
separar os ingredientes e então girar para observar a composição de outro
ângulo. Nenhum deles altera ingredientes, preços ou carrinho.

No celular, o toque sobre o palco pertence ao visualizador (`touch-action:
none`): um dedo gira, dois dedos controlam o zoom. A página continua rolável
por qualquer área fora do palco, e o painel de detalhes tem rolagem própria.

### Zoom controla a separação das camadas

Aproximar o zoom afasta os ingredientes uns dos outros; afastar remonta o
hambúrguer. Funciona com scroll do mouse, pinça de dois dedos no celular e os
botões da interface.

Três coisas são mantidas separadas: a **distância da câmera**, a **expansão**
(parâmetro normalizado derivado dessa distância) e a **rotação**. Como a
expansão é recalculada da distância atual e não acumulada por evento, scroll
errático não desloca nada permanentemente. A pilha também se reduz conforme se
separa, de modo que aproximar a câmera nunca corta um ingrediente.

### Adicionais entram no modelo

Escolher um adicional insere a peça correspondente na posição correta e empurra
para cima tudo o que está acima dela; remover tira a peça. A ordem de montagem
é recalculada do zero a cada mudança, nunca fixada no código.

`src/utils/composition.ts` é a fonte única: a cena 3D, a lista de ingredientes,
o preço e o carrinho saem todos dela, então é impossível a tela mostrar uma
composição diferente da que foi pedida.

Um adicional sem geometria correspondente (`visual: null` em
`src/data/addons.ts`) altera preço e descrição, e a interface avisa que o modelo
não muda — em vez de inserir uma peça qualquer.

## Ponto da carne

Os hambúrgueres bovinos permitem escolher entre **mal passado**, **ao ponto** e
**bem passado**. O Crispy Chicken não oferece a opção, porque filé de frango
empanado não tem ponto.

Ao escolher, o visualizador troca para uma vista **exclusiva da carne**: meio
disco cortado, com a face do corte voltada para quem olha. Nenhum outro
ingrediente aparece. O botão "Ver o hambúrguer" devolve a montagem completa, e
a escolha é preservada.

A diferença entre os pontos é geométrica, não um rótulo trocado: a face do
corte é colorida por vértice conforme a distância até a superfície mais
próxima, e o que muda entre os pontos é a **espessura da faixa cozida**. O mal
passado tem faixa fina e centro avermelhado; o bem passado tem faixa larga e
quase nenhum rosado. Mesma geometria, mesma escala, mesmo enquadramento — só a
seção muda.

O ponto **não altera o preço** e fica registrado no item do carrinho e na
revisão do pedido. A interface avisa que a imagem é ilustrativa e que o
resultado real varia conforme o preparo.

## Acompanhamentos, bebidas e combos

**Batatas fritas** — três receitas em três tamanhos. O preço sai de duas
tabelas em `src/data/sides.ts`: o valor da tradicional por tamanho mais um
acréscimo por variação (R$ 2,00 para as versões com queijo). Mudar um tamanho
propaga corretamente para as três receitas.

| | P | M | G |
|---|---:|---:|---:|
| Tradicional | R$ 7,00 | R$ 10,00 | R$ 12,00 |
| Com queijo | R$ 9,00 | R$ 12,00 | R$ 14,00 |
| Com queijo e bacon | R$ 9,00 | R$ 12,00 | R$ 14,00 |

**Bebidas** — água R$ 3,50; Coca-Cola, Coca-Cola Zero, Guaraná Antarctica e
Fanta Laranja a R$ 5,50; sucos de laranja e de uva a R$ 7,50. Os preços seguem
a categoria, em `src/data/drinks.ts`.

As ilustrações das bebidas são **genéricas** — garrafa, lata ou copo com a cor
da bebida. Não reproduzem rótulos, logotipos nem embalagens de marca: desenhar
algo parecido com a embalagem de um fabricante confundiria o cliente. Para
mostrar as embalagens reais, use fotografias próprias.

**Combos** — um hambúrguer (com ponto da carne), uma batata com tipo e tamanho,
e uma bebida. Trocar qualquer componente atualiza o resumo e o total na hora.

O combo custa a **soma dos itens**. Nenhum desconto foi informado, então nenhum
é inventado, e a interface diz isso em palavras. Para configurar um preço
promocional, altere `COMBO_DISCOUNT` em `src/utils/pricing.ts`: a economia
passa a aparecer automaticamente.

## Acesso por QR Code ou NFC

Uma placa de mesa com QR Code ou etiqueta NFC aponta para a aplicação com
parâmetros na URL:

```
https://.../?mesa=12&origem=qr
```

O cardápio abre direto no navegador do celular, sem instalar nada. A mesa
aparece no cabeçalho e acompanha o resumo do pedido.

**Identificar a mesa é só identificação.** Não abre comanda, não avisa a
cozinha e não confirma pedido — e a revisão diz isso em palavras. Valores fora
do padrão esperado (até 12 caracteres alfanuméricos) são ignorados. O fluxo de
compra funciona igual com ou sem o parâmetro.

## O que a aplicação não finge

- **Sem WebGL, não há 3D falso.** O dispositivo que não consegue iniciar a
  renderização recebe a ilustração vetorial em camadas, identificada como
  ilustração e **sem** controles de rotação ou zoom.
- **A miniatura dos cards é ilustração, não 3D.** Montar cinco cenas WebGL na
  grade pesaria no celular sem necessidade; a etiqueta do card anuncia o que o
  botão abre, não o que a imagem é.
- **Nada de dados inventados.** Endereço, horário, telefone, taxa de entrega e
  formas de pagamento começam vazios em `src/data/store.ts`. Enquanto estiverem
  vazios, a interface diz "não informado".
- **O pedido não é enviado a lugar nenhum** enquanto não houver canal
  configurado, e o checkout declara isso.

## Estrutura

```
src/
  components/
    Header, Hero, HowItWorks, About, Footer
    ProductGrid, ProductCard, ProductDetails
    FriesSection, DrinksSection        acompanhamentos e bebidas
    ComboCallout, ComboBuilder         montagem de combo
    Burger3DViewer      decide 3D × ilustração e monta os controles
    BurgerIllustration  ilustração vetorial (cards, carrinho, fallback)
    FriesIllustration, DrinkIllustration, ProductThumb
    IngredientList, BurgerCustomizer   personalização e ponto da carne
    CartDrawer, CartItem, CartFab, Checkout
    Overlay, Toast, ui  primitivas compartilhadas
  three/
    BurgerScene.tsx     canvas R3F: luzes, câmera, zoom → expansão
    builders.ts         geometria procedural, incluindo o corte da carne
    ingredientSpecs.ts  espessura, raio, cor e material por tipo
    noise.ts            ruído determinístico
  data/
    products.ts  catálogo dos cinco hambúrgueres
    addons.ts    adicionais: preço e como entram no modelo
    sides.ts     batatas: preço por tamanho e acréscimo por variação
    drinks.ts    bebidas: preço por categoria
    store.ts     configuração da loja (vazia por padrão)
  hooks/
    useCart.tsx       carrinho multi-tipo + persistência local
    useEnvironment.ts WebGL, media queries, movimento reduzido
  types/      product.ts, catalog.ts, cart.ts, composition.ts
  utils/      composition.ts, currency.ts, pricing.ts, order.ts
public/
  images/     fotografias dos produtos, quando houver
```

### Onde mexer

| Para alterar              | Arquivo                      |
| ------------------------- | ---------------------------- |
| Produtos, preços, receitas| `src/data/products.ts`       |
| Preço dos adicionais      | `src/data/addons.ts`         |
| Loja, WhatsApp, API       | `src/data/store.ts`          |
| Cores e tipografia        | `src/index.css` (bloco `@theme`) |
| Batatas: preços e tamanhos | `src/data/sides.ts`          |
| Bebidas: preços            | `src/data/drinks.ts`         |
| Desconto de combo          | `COMBO_DISCOUNT` em `src/utils/pricing.ts` |
| Aparência 3D dos ingredientes | `src/three/ingredientSpecs.ts` |
| Geometria de um ingrediente | `src/three/builders.ts`    |
| Regras de preço           | `src/utils/pricing.ts`       |

---

## Preços

Todos os valores são guardados em **centavos**, como inteiros, e formatados em
reais apenas na borda da interface (`src/utils/currency.ts`). Isso evita erros
de arredondamento de ponto flutuante.

Todo cálculo sai de `src/utils/pricing.ts`, a partir dos dados estruturados do
item — nenhum componente calcula preço por conta própria e nenhum valor é
escrito direto no JSX.

Adicionais desta versão: bacon extra R$ 5,00 · cheddar extra R$ 3,00 · carne
bovina extra de 100 g R$ 8,00.

Retirar ingredientes **não** gera desconto: é preferência de montagem.

---

## Carrinho e persistência

O carrinho funciona inteiramente no navegador, com `useReducer` e contexto
(`src/hooks/useCart.tsx`).

Ele é salvo em `localStorage`, na chave `brasa3d.cart.v2`, e guarda apenas
identificadores de produto, adicional, ingrediente retirado, tamanho de batata,
bebida, ponto da carne e quantidades. **Nenhum
dado pessoal é armazenado.** O carrinho não é compartilhado entre dispositivos,
não é enviado a nenhum servidor e some ao limpar os dados do site.

Na leitura, o conteúdo salvo é validado contra o catálogo atual: produtos e
adicionais que não existem mais são descartados em silêncio, em vez de gerar
preços errados. Dados corrompidos resultam em carrinho vazio, nunca em erro.

O carrinho carrega quatro tipos de linha — hambúrguer, batata, bebida e combo —
como união discriminada, sem que nenhum precise fingir ser outro.

Itens iguais em tudo se somam; qualquer diferença de personalização, ponto da
carne, tamanho ou componente de combo cria uma linha separada. A chave é
derivada de todo o conteúdo da linha.

A chave mudou para `v2` nesta versão: a estrutura anterior só sabia descrever
hambúrgueres. Carrinhos gravados antes são descartados em silêncio.

---

## Finalização do pedido

A revisão mostra itens, quantidades, adicionais, ingredientes retirados, escolha
entre retirada e entrega, campo de observações e o total.

**A finalização está em modo demonstrativo e a interface diz isso.** Como
`src/data/store.ts` não tem WhatsApp nem API de pedidos configurados, nada é
enviado a ninguém. A ação disponível é copiar o resumo do pedido, anunciada como
tal.

Para habilitar o envio de verdade, preencha em `src/data/store.ts`:

```ts
whatsappNumber: '5511999999999',  // formato internacional, só dígitos
// ou
orderApiUrl: 'https://…/pedidos',
```

Com o WhatsApp preenchido, o botão passa a abrir a conversa com o resumo já
montado. `src/utils/order.ts` produz um payload versionado e estável
(`OrderPayload`), pronto para ser enviado a uma API.

---

## Acessibilidade e desempenho

- Navegação completa por teclado; o visualizador 3D aceita setas para girar,
  `+`/`−` para zoom (que também separa as camadas) e `0` para restaurar.
- Painéis sobrepostos com `aria-modal`, foco preso enquanto abertos, `Escape`
  para fechar e foco devolvido ao elemento de origem.
- `prefers-reduced-motion` é respeitado: as animações são neutralizadas e a
  separação de camadas acontece sem transição.
- Sem suporte a WebGL, a ilustração é exibida com a explicação do motivo.
- three.js fica em um chunk separado, carregado só quando o visualizador
  aparece — o pacote inicial não o inclui.
- Uma única cena WebGL por vez; os cards usam ilustração vetorial.
- O canvas renderiza por demanda (`frameloop="demand"`), poupando bateria no
  celular.
- Geometrias e materiais são descartados quando uma peça sai da composição e
  quando o visualizador é desmontado.
- No celular, um dedo gira e dois dedos controlam o zoom — a página continua
  rolável quando o toque começa fora do visualizador.

---

## Ainda não implementado

Dois itens do escopo ficaram de fora, de propósito, para não entregar meia
funcionalidade:

- **Painel administrativo.** Editar produtos, preços e disponibilidade sem
  mexer no código exige persistência e autenticação de verdade. Fazer uma
  versão só no navegador criaria a impressão falsa de um painel real: as
  mudanças sumiriam ao limpar os dados do site e não chegariam a nenhum outro
  dispositivo. Hoje a edição é feita nos arquivos de `src/data/`.
- **Envio real do pedido.** Depende de preencher `whatsappNumber` ou
  `orderApiUrl` em `src/data/store.ts` — o payload já está pronto.

## Limites do visualizador

A geometria é procedural, não escultura de artista. Ela acerta silhueta,
proporção, cor, material e comportamento, mas não alcança um modelo esculpido
com mapas de normal e textura fotográfica. O ponto de extensão é o `switch` de
`buildIngredientObject` em `src/three/builders.ts`: trocar o construtor de um
ingrediente por um GLB carregado mantém empilhamento, expansão e adicionais
funcionando sem alteração.

## Aviso

BRASA 3D BURGER é uma hamburgueria **fictícia**, criada para demonstrar o
cardápio digital interativo. Produtos, preços e informações existem apenas para
fins de demonstração.
