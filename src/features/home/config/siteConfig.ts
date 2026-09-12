/**
 * Configuração do site. O endpoint de contato é a URL do Web App do Google Apps Script
 * (ver `apps-script/README.md`). Pode vir do `.env` (VITE_CONTACT_ENDPOINT) ou ser colado aqui.
 */
export const siteConfig = {
  contactEndpoint: (import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined) ?? '',
  whatsapp: 'https://wa.me/5531993341543',
  /** Redes sociais: troque os endereços quando tiver os perfis. Vazio = ícone aparece desativado. */
  social: {
    instagram: 'https://www.instagram.com/abluezone/',
    tiktok: 'https://www.tiktok.com/@bluezon_e',
    facebook: 'https://www.facebook.com/people/Bluezone-Marketing-Vendas/61553804584166/',
    link: '',
    linkedin: 'https://www.linkedin.com/company/bluezone-marketing-vendas/posts/?feedView=all',
  },
  /** Link de compra do Blueprint (Kiwify). */
  blueprintCourse: 'https://pay.kiwify.com.br/B4TG5UJ',
  /** E-mail de suporte mostrado na página do Blueprint (mesma caixa que recebe o formulário). */
  supportEmail: 'dmarketingevendas@gmail.com',
  year: 2026,
} as const
