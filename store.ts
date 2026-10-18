/**
 * Configuração da loja.
 *
 * Esta é uma hamburgueria fictícia de demonstração. Todos os campos que
 * dependem de dados reais começam como `null` de propósito: a interface
 * verifica cada um antes de exibir qualquer afirmação. Nada aqui foi
 * inventado — endereço, telefone, taxas e prazos devem ser preenchidos pelo
 * restaurante que for usar o sistema.
 */
export interface StoreConfig {
  name: string
  /** Texto curto de marca. */
  concept: string
  /**
   * Horário de funcionamento declarado. `null` enquanto não houver informação:
   * a interface então não afirma que a loja está aberta ou fechada.
   */
  openingHours: string | null
  /** Número no formato internacional (ex.: '5511999999999'), sem símbolos. */
  whatsappNumber: string | null
  address: string | null
  /** Endpoint de uma API de pedidos. Enquanto `null`, o checkout é demonstrativo. */
  orderApiUrl: string | null
  /** Taxa de entrega em centavos. `null` = não configurada. */
  deliveryFee: number | null
  /** Métodos de pagamento efetivamente habilitados. Vazio = nenhum. */
  paymentMethods: string[]
}

export const STORE: StoreConfig = {
  name: 'BRASA 3D BURGER',
  concept: 'Hamburgueria artesanal contemporânea',
  openingHours: null,
  whatsappNumber: null,
  address: null,
  orderApiUrl: null,
  deliveryFee: null,
  paymentMethods: [],
}

/** `true` quando existe algum canal real configurado para enviar o pedido. */
export function hasOrderChannel(store: StoreConfig = STORE): boolean {
  return store.whatsappNumber !== null || store.orderApiUrl !== null
}
