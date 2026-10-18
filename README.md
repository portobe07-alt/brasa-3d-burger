# Módulo 3D

Geometria, materiais e cena dos hambúrgueres. **Nenhum arquivo externo é
necessário**: toda a geometria é gerada proceduralmente em three.js quando o
produto é aberto.

## Arquivos

| Arquivo               | Responsabilidade                                                        |
| --------------------- | ----------------------------------------------------------------------- |
| `noise.ts`            | Ruído determinístico e PRNG. Mesma semente → mesma peça, sempre.         |
| `ingredientSpecs.ts`  | Espessura, raio, cor e material de cada tipo de ingrediente.             |
| `builders.ts`         | Constrói a malha de cada tipo.                                           |
| `BurgerScene.tsx`     | Canvas R3F: luzes, câmera, controles e animação da pilha.                |

A pilha em si não é montada aqui: ela vem de `src/utils/composition.ts`, que
converte produto + personalização em peças posicionadas.

## Escala da cena

O raio do pão vale **1.0** e um hambúrguer montado tem pouco mais de **1.3** de
altura. A câmera e os limites de zoom em `BurgerScene.tsx` partem dessa escala —
ao mexer em `thickness` ou `radius` em `ingredientSpecs.ts`, confira o
enquadramento.

## Zoom e separação das camadas

Três coisas são mantidas separadas de propósito:

- **Zoom da câmera** — distância ao centro, entre `MIN_DISTANCE` e
  `MAX_DISTANCE`. Vem do OrbitControls (scroll, pinça ou botões).
- **Expansão** — parâmetro normalizado `t` em `[0, 1]`, **derivado** da
  distância por `expansionFromDistance()`. Não acumula por evento: é sempre
  recalculado da distância atual, então scroll errático não desloca nada
  permanentemente.
- **Rotação** — ângulos do OrbitControls, independentes do resto.

A posição original de cada peça vem da composição e nunca é alterada; a
expansão é um deslocamento somado a ela.

`FIT_MARGIN` garante que a pilha separada nunca saia do quadro: o grupo é
reduzido conforme cresce, de modo que aproximar a câmera nunca corta um
ingrediente.

## Adicionar um ingrediente novo

1. Acrescente o tipo em `IngredientKind` (`src/types/product.ts`).
2. Defina espessura, raio, cor e rugosidade em `ingredientSpecs.ts`.
3. Escreva o construtor em `builders.ts` e registre-o no `switch` de
   `buildIngredientObject`.
4. Use o tipo em `src/data/products.ts`.

Para que um **adicional** apareça no modelo, preencha `visual` em
`src/data/addons.ts`: o tipo da peça, quantas inserir e acima de que camadas
ela entra. Um adicional com `visual: null` altera só o preço, e a interface
avisa o cliente que o modelo não muda.

## Desempenho

- O módulo inteiro (incluindo three.js) fica em um chunk separado, carregado
  só quando o visualizador aparece.
- Os cards do cardápio usam a ilustração vetorial, não WebGL: cinco cenas
  simultâneas na grade pesariam no celular sem necessidade.
- `frameloop="demand"` — nada é renderizado enquanto nada muda.
- Geometrias e materiais são descartados quando uma peça sai da composição e
  quando o visualizador é desmontado.
- O mapa de ambiente vem de `RoomEnvironment`, gerado em memória pelo próprio
  three.js. Nenhum HDR é baixado de uma CDN.

## Limites conhecidos

A geometria é procedural, não escultura de artista. Ela acerta silhueta,
proporção, cor e material, mas não alcança o nível de um modelo esculpido com
mapas de normal e textura fotográfica. O ponto de extensão para isso é o
`switch` de `buildIngredientObject`: trocar um construtor por um GLB carregado
mantém todo o resto (empilhamento, expansão, adicionais) funcionando sem
alteração.
