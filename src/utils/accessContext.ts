/**
 * Contexto de acesso ao cardápio (QR Code, NFC ou link direto).
 *
 * Uma placa de mesa com QR Code ou etiqueta NFC aponta para a aplicação com
 * parâmetros na URL, por exemplo:
 *
 *     https://.../?mesa=12&origem=qr
 *
 * O cardápio abre direto no navegador do celular, sem instalar nada.
 *
 * IMPORTANTE: identificar a mesa é só isso — identificação. Não confirma
 * pedido, não avisa a cozinha e não cria comanda. Enquanto não houver canal de
 * pedidos configurado (`data/store.ts`), o checkout continua demonstrativo, e
 * a interface diz isso. O dado da mesa apenas acompanha o resumo do pedido,
 * pronto para quando existir uma integração de verdade.
 */

export type AccessOrigin = 'qr' | 'nfc' | 'link'

export interface AccessContext {
  /** Identificador da mesa, quando veio na URL. */
  table: string | null
  /** Como o cliente chegou: etiqueta, QR ou link comum. */
  origin: AccessOrigin
}

/** Aceita apenas rótulos curtos e simples, para não ecoar lixo na interface. */
const TABLE_PATTERN = /^[A-Za-z0-9-]{1,12}$/

function parseOrigin(value: string | null): AccessOrigin {
  if (value === 'qr' || value === 'nfc') return value
  return 'link'
}

/** Lê o contexto de acesso da URL atual. */
export function readAccessContext(search: string = typeof window === 'undefined' ? '' : window.location.search): AccessContext {
  const params = new URLSearchParams(search)
  const rawTable = params.get('mesa') ?? params.get('table')
  const table = rawTable && TABLE_PATTERN.test(rawTable) ? rawTable : null
  // Vir com mesa na URL já indica placa física, mesmo sem `origem` declarada.
  const origin = parseOrigin(params.get('origem') ?? params.get('origin'))
  return { table, origin: origin === 'link' && table ? 'qr' : origin }
}
