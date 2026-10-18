# Fotografias dos produtos

Coloque aqui as fotos dos hambúrgueres, quando houver.

Para usar uma foto em vez da ilustração vetorial, preencha `imagePath` do
produto em `src/data/products.ts`:

```ts
imagePath: '/images/brasa-classico.jpg',
```

Enquanto `imagePath` for `null`, a aplicação exibe a ilustração vetorial em
camadas, gerada a partir da lista real de ingredientes e identificada como
ilustração.

A foto tem prioridade sobre a ilustração, mas **não** sobre o modelo 3D: se o
GLB do produto existir, ele continua sendo a visualização principal.
