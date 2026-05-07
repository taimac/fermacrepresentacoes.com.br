/**
 * Fermac Representações — Bilingual Translations
 * PT is the default (ground state). EN is the progressive layer.
 * Keys must exist in both languages.
 */

const FERMAC_TRANSLATIONS = {
    pt: {
        /* ===== NAV ===== */
        'nav.home':         'Início',
        'nav.about':        'Sobre',
        'nav.products':     'Produtos',
        'nav.contact':      'Contato',
        'nav.whatsapp':     'Contato',

        /* ===== HOME HERO ===== */
        'hero.eyebrow':     'Representação Comercial Industrial',
        'hero.tagline':     'Conectamos fabricantes ao mercado industrial com experiência e relacionamento.',
        'hero.subhead':     'A Fermac atua em toda Serra Gaúcha como escritório de representação comercial, hoje com linha Panatlântica e está aberta para novos portfólios industriais tanto nacionais como internacionais que buscam presença qualificada no mercado industrial.',
        'hero.cta.whatsapp':'Fale com a Fermac',
        'hero.cta.products':'Ver Produtos',

        /* ===== STATS BAR ===== */
        'stats.years.number':   '20+',
        'stats.years.label':    'Anos de mercado',
        'stats.clients.number': 'Aberta',
        'stats.clients.label':  'a novas representadas',
        'stats.products.number':'9',
        'stats.products.label': 'Linhas industriais',
        'stats.regions.number': 'B2B',
        'stats.regions.label':  'Atendimento industrial',

        /* ===== HOW IT WORKS ===== */
        'hiw.section.eyebrow':  'Como trabalhamos',
        'hiw.section.title':    'Simples, direto e confiável',
        'hiw.section.subtitle': 'Apoiamos clientes e representadas com clareza técnica, negociação objetiva e acompanhamento comercial.',
        'hiw.step1.title':      'Entendemos sua necessidade',
        'hiw.step1.description':'Ouvimos o que você precisa: produto, prazo, volume e condições. Nada de propostas genéricas.',
        'hiw.step2.title':      'Orientamos a linha adequada',
        'hiw.step2.description':'Relacionamos a aplicação do cliente com o produto adequado, a representada correta e as condições comerciais do momento.',
        'hiw.step3.title':      'Acompanhamos até a entrega',
        'hiw.step3.description':'Monitoramos pedidos, sinalizamos riscos e mantemos você informado a cada etapa.',

        /* ===== PRODUCTS TEASER ===== */
        'products.section.eyebrow':     'Portfólio representado',
        'products.section.title':       'Linhas representadas pela Fermac',
        'products.section.subtitle':    'Nove linhas de produtos siderúrgicos hoje representadas pela Fermac, com abertura para ampliar o portfólio industrial.',
        'products.teaser.cta':          'Ver todos os produtos →',

        /* ===== ABOUT TEASER ===== */
        'about.teaser.eyebrow':         'Sobre a Fermac',
        'about.teaser.title':           'Trajetória comercial como diferencial',
        'about.teaser.description':     'A Fermac carrega mais de 20 anos de presença comercial no mercado industrial. Sua história acompanha a trajetória de Tailor Maciel como representante: relacionamento, leitura prática de necessidade, acompanhamento próximo e evolução tecnológica aplicada ao negócio.',
        'about.teaser.cta':             'Conheça nossa história →',

        /* ===== FINAL CTA ===== */
        'cta.title':        'Pronto para negociar?',
        'cta.subtitle':     'Fale com a Fermac para confirmar produto, aplicação, disponibilidade e condição comercial.',
        'cta.whatsapp':     'Solicitar atendimento',

        /* ===== ABOUT PAGE ===== */
        'about.hero.title':         'Sobre a Fermac',
        'about.hero.subtitle':      'Mais de 20 anos de relacionamento, presença comercial e confiança no setor industrial.',
        'about.story.eyebrow':      'Nossa história',
        'about.story.title':        'De onde viemos e para onde vamos',
        'about.story.p1':           'A Fermac Representações nasceu da trajetória comercial construída por Tailor Maciel no mercado industrial, com foco em relacionamento, confiança e compreensão prática das necessidades de compra das empresas.',
        'about.story.p2':           'A empresa atua em toda Serra Gaúcha e região Sul do Brasil e acompanha a evolução dessa presença comercial: atendimento direto, leitura de aplicação, negociação objetiva, acompanhamento de pedidos e proximidade com compradores industriais.',
        'about.story.p3':           'Hoje, a Fermac representa a Panatlântica S.A e segue aberta a novas representações nacionais e internacionais alinhadas ao mercado industrial, usando tecnologia para organizar informação, acelerar retornos e melhorar o acompanhamento comercial.',
        'about.operation.eyebrow':  'Modo de operação',
        'about.operation.title':    'Experiência comercial com acompanhamento estruturado',
        'about.operation.description': 'A Fermac está modernizando sua rotina comercial com organização de histórico, acompanhamento de pedidos e uso de informações para tornar cada negociação mais clara, rápida e segura.',
        'about.operation.item1.title': 'Histórico organizado',
        'about.operation.item1.description': 'Pedidos, cotações e retornos acompanhados para reduzir perda de contexto.',
        'about.operation.item2.title': 'Follow-up comercial',
        'about.operation.item2.description': 'Rotinas de retorno para prazos, disponibilidade, pendências e oportunidades.',
        'about.operation.item3.title': 'Leitura de prioridade',
        'about.operation.item3.description': 'Atenção a volume, urgência, risco de prazo e condição comercial.',
        'about.operation.item4.title': 'Informação aplicada',
        'about.operation.item4.description': 'Dados e tecnologia apoiam o atendimento, sem substituir relacionamento e responsabilidade.',
        'about.values.eyebrow':     'Nossos valores',
        'about.values.title':       'O que nos guia',
        'about.value1.title':       'Relacionamento',
        'about.value1.description': 'Construímos relações de longo prazo com clientes e representadas, com atendimento próximo e responsabilidade comercial.',
        'about.value2.title':       'Confiabilidade',
        'about.value2.description': 'Cumprimos o que prometemos. Informações precisas, prazos respeitados, transparência em cada etapa.',
        'about.value3.title':       'Comprometimento',
        'about.value3.description': 'Acompanhamos cada pedido do início ao fim. Não vendemos e sumimos — estamos junto até a entrega.',
        'about.differentials.eyebrow':  'Por que a Fermac',
        'about.differentials.title':    'Nossos diferenciais',
        'about.diff1':  'Mais de 20 anos de presença ativa no mercado siderúrgico',
        'about.diff2':  'Representação atual da linha Panatlântica S.A e abertura para novas representadas',
        'about.diff3':  'Apoio na leitura de aplicação, produto, prazo, volume e condição comercial',
        'about.diff4':  'Respostas rápidas, cotações objetivas e acompanhamento próximo',
        'about.diff5':  'Abertura para novas representações alinhadas ao mercado industrial',
        'about.diff6':  'Monitoramento estruturado de potenciais compradores: histórico de compras, curvas ABC, atividade por período e potencial por produto.',

        /* ===== PRODUCTS PAGE ===== */
        'products.hero.title':      'Produtos',
        'products.hero.subtitle':   'Linhas industriais atualmente representadas pela Fermac.',
        'products.intro.eyebrow':   'Portfólio atual',
        'products.intro.title':     'Produtos representados',
        'products.intro.description': 'A Fermac representa comercialmente estas linhas industriais e está aberta a ampliar seu portfólio com fabricantes nacionais e internacionais. Disponibilidade, medidas, especificações, volumes e condições comerciais devem ser consultados caso a caso.',
        'products.card.cta':        'Solicitar cotação',
        'products.cta.title':       'Precisa confirmar especificação ou disponibilidade?',
        'products.cta.description': 'Fale com a Fermac para avaliar aplicação, medida, volume, prazo e condição comercial das linhas representadas.',
        'products.cta.whatsapp':    'Solicitar cotação',

        /* Product families */
        'product.p1.name':          'Bobinas e chapas laminadas a quente',
        'product.p1.description':   'Aços planos para aplicações estruturais, componentes industriais e demandas de transformação metalmecânica.',
        'product.p2.name':          'Bobinas e chapas laminadas a frio',
        'product.p2.description':   'Produtos com melhor acabamento superficial e controle dimensional para peças, componentes e processos industriais.',
        'product.p3.name':          'Chapas decapadas',
        'product.p3.description':   'Materiais laminados a quente com remoção de carepa, indicados quando a aplicação pede superfície mais limpa.',
        'product.p4.name':          'Chapas grossas',
        'product.p4.description':   'Chapas para estruturas, equipamentos, implementos, caldeiraria e aplicações industriais de maior solicitação.',
        'product.p5.name':          'Zincados, galvalume e pré-pintados',
        'product.p5.description':   'Produtos revestidos para aplicações que exigem proteção contra corrosão, acabamento ou exposição externa.',
        'product.p6.name':          'Telhas metálicas e acessórios',
        'product.p6.description':   'Telhas trapezoidais, onduladas e acessórios para coberturas, fechamentos e construções industriais ou comerciais.',
        'product.p7.name':          'Bobinas slitter (corte longitudinal)',
        'product.p7.description':   'Bobinas estreitas obtidas por corte longitudinal, com largura processada para alimentação direta em linhas de conformação e estampagem.',
        'product.p8.name':          'Perfis U e cantoneiras',
        'product.p8.description':   'Perfis conformados e galvanizados para estruturas metálicas leves, drywall, sistemas de fixação e aplicações construtivas.',
        'product.p9.name':          'Vigas e perfis W (laminados)',
        'product.p9.description':   'Perfis estruturais laminados para galpões, pontes, máquinas, equipamentos industriais e aplicações que exigem maior solicitação mecânica.',

        /* ===== CONTACT PAGE ===== */
        'contact.hero.title':       'Contato',
        'contact.hero.subtitle':    'Fale com a Fermac.',
        'contact.info.eyebrow':     'Como falar com a gente',
        'contact.info.title':       'Estamos disponíveis',
        'contact.whatsapp.label':   'Contato comercial',
        'contact.email.label':      'E-mail',
        'contact.location.label':   'Localização',
        'contact.hours.label':      'Atendimento',
        'contact.hours.value':      'Atendimento em horário comercial',
        'contact.form.title':       'Envie uma mensagem',
        'contact.form.name':        'Seu nome',
        'contact.form.email':       'E-mail ou telefone',
        'contact.form.subject':     'Assunto',
        'contact.form.message':     'Mensagem',
        'contact.form.submit':      'Enviar mensagem',

        /* ===== FOOTER ===== */
        'footer.tagline':       'Representação comercial industrial com relacionamento, experiência e acompanhamento próximo.',
        'footer.location':      'Caxias do Sul, RS',
        'footer.links.title':   'Links',
        'footer.contact.title': 'Contato',
        'footer.copy':          '© 2026 Fermac Representações.',
        'footer.cnpj':          'Representação comercial industrial',

        /* ===== SHARED ===== */
        'whatsapp.aria':        'Contato com a Fermac',
        'lang.toggle.aria':     'Mudar idioma',
        'skip.link':            'Ir para o conteúdo',
    },

    en: {
        /* ===== NAV ===== */
        'nav.home':         'Home',
        'nav.about':        'About',
        'nav.products':     'Products',
        'nav.contact':      'Contact',
        'nav.whatsapp':     'Contact',

        /* ===== HOME HERO ===== */
        'hero.eyebrow':     'Industrial Commercial Representation',
        'hero.tagline':     'Connecting manufacturers to the industrial market with experience and relationships.',
        'hero.subhead':     'Fermac operates across Serra Gaúcha as a commercial representation office, currently with the Panatlântica line and open to new domestic and international industrial portfolios seeking qualified market presence.',
        'hero.cta.whatsapp':'Contact Fermac',
        'hero.cta.products':'See Products',

        /* ===== STATS BAR ===== */
        'stats.years.number':   '20+',
        'stats.years.label':    'Years in the market',
        'stats.clients.number': 'Open',
        'stats.clients.label':  'to new suppliers',
        'stats.products.number':'9',
        'stats.products.label': 'Industrial lines',
        'stats.regions.number': 'B2B',
        'stats.regions.label':  'Industrial service',

        /* ===== HOW IT WORKS ===== */
        'hiw.section.eyebrow':  'How we work',
        'hiw.section.title':    'Simple, direct, and reliable',
        'hiw.section.subtitle': 'We support clients and represented suppliers with technical clarity, objective negotiation, and commercial follow-up.',
        'hiw.step1.title':      'We understand your need',
        'hiw.step1.description':'We listen to what you need: product, deadline, volume, and terms. No generic proposals.',
        'hiw.step2.title':      'We guide the right line',
        'hiw.step2.description':'We connect the client application to the right product, represented supplier, and current commercial conditions.',
        'hiw.step3.title':      'We follow up through delivery',
        'hiw.step3.description':'We monitor orders, flag risks, and keep you informed at every step.',

        /* ===== PRODUCTS TEASER ===== */
        'products.section.eyebrow':     'Represented portfolio',
        'products.section.title':       'Lines represented by Fermac',
        'products.section.subtitle':    'Nine steel product lines currently represented by Fermac, with room to expand the industrial portfolio.',
        'products.teaser.cta':          'See all products →',

        /* ===== ABOUT TEASER ===== */
        'about.teaser.eyebrow':         'About Fermac',
        'about.teaser.title':           'Commercial trajectory as a differentiator',
        'about.teaser.description':     'Fermac carries over 20 years of commercial presence in the industrial market. Its history follows Tailor Maciel\'s path as a representative: relationships, practical needs reading, close follow-up, and technology applied to business.',
        'about.teaser.cta':             'Our story →',

        /* ===== FINAL CTA ===== */
        'cta.title':        'Ready to talk business?',
        'cta.subtitle':     'Contact Fermac to confirm product, application, availability, and commercial conditions.',
        'cta.whatsapp':     'Request assistance',

        /* ===== ABOUT PAGE ===== */
        'about.hero.title':         'About Fermac',
        'about.hero.subtitle':      'Over 20 years of relationships, commercial presence, and trust in the industrial sector.',
        'about.story.eyebrow':      'Our story',
        'about.story.title':        'Where we came from and where we are going',
        'about.story.p1':           'Fermac Representações grew from the commercial path built by Tailor Maciel in the industrial market, with a focus on relationships, trust, and practical understanding of companies\' purchasing needs.',
        'about.story.p2':           'The company operates across Serra Gaúcha and Brazil’s southern region, reflecting the evolution of that commercial presence: direct service, application reading, objective negotiation, order follow-up, and proximity to industrial buyers.',
        'about.story.p3':           'Today, Fermac represents Panatlântica S.A and remains open to new domestic and international representation partnerships aligned with the industrial market, using technology to organize information, accelerate responses, and improve commercial follow-up.',
        'about.operation.eyebrow':  'Operating model',
        'about.operation.title':    'Commercial experience with structured follow-up',
        'about.operation.description': 'Fermac is modernizing its commercial routine with organized history, order follow-up, and practical information use to make each negotiation clearer, faster, and safer.',
        'about.operation.item1.title': 'Organized history',
        'about.operation.item1.description': 'Orders, quotes, and returns tracked to reduce loss of context.',
        'about.operation.item2.title': 'Commercial follow-up',
        'about.operation.item2.description': 'Return routines for deadlines, availability, pending items, and opportunities.',
        'about.operation.item3.title': 'Priority reading',
        'about.operation.item3.description': 'Attention to volume, urgency, deadline risk, and commercial condition.',
        'about.operation.item4.title': 'Applied information',
        'about.operation.item4.description': 'Data and technology support service without replacing relationship and responsibility.',
        'about.values.eyebrow':     'Our values',
        'about.values.title':       'What guides us',
        'about.value1.title':       'Relationship',
        'about.value1.description': 'We build long-term relationships with clients and represented suppliers, with close service and commercial responsibility.',
        'about.value2.title':       'Reliability',
        'about.value2.description': 'We deliver on our promises. Accurate information, respected timelines, transparency at every step.',
        'about.value3.title':       'Commitment',
        'about.value3.description': 'We follow every order from start to finish. We don\'t sell and disappear — we stay until delivery.',
        'about.differentials.eyebrow':  'Why Fermac',
        'about.differentials.title':    'Our differentials',
        'about.diff1':  'Over 20 years of active presence in the steel market',
        'about.diff2':  'Current representation of the Panatlântica S.A line and open to new represented suppliers',
        'about.diff3':  'Support in understanding application, product, deadline, volume, and commercial conditions',
        'about.diff4':  'Fast responses, objective quotations, and close follow-up',
        'about.diff5':  'Open to new representation partnerships aligned with the industrial market',
        'about.diff6':  'Structured monitoring of potential buyers: purchase history, ABC curves, activity by period, and potential by product.',

        /* ===== PRODUCTS PAGE ===== */
        'products.hero.title':      'Products',
        'products.hero.subtitle':   'Industrial lines currently represented by Fermac.',
        'products.intro.eyebrow':   'Current portfolio',
        'products.intro.title':     'Represented products',
        'products.intro.description': 'Fermac commercially represents these industrial lines and is open to expanding its portfolio with domestic and international manufacturers. Availability, dimensions, specifications, volumes, and commercial conditions must be checked case by case.',
        'products.card.cta':        'Request a quote',
        'products.cta.title':       'Need to confirm specification or availability?',
        'products.cta.description': 'Talk to Fermac to evaluate application, dimensions, volume, deadline, and commercial conditions for the represented lines.',
        'products.cta.whatsapp':    'Request a quote',

        /* Product families */
        'product.p1.name':          'Hot-rolled coils and sheets',
        'product.p1.description':   'Flat steel products for structural applications, industrial components, and metal-mechanical transformation demands.',
        'product.p2.name':          'Cold-rolled coils and sheets',
        'product.p2.description':   'Products with improved surface finish and dimensional control for parts, components, and industrial processes.',
        'product.p3.name':          'Pickled sheets',
        'product.p3.description':   'Hot-rolled materials with scale removal, useful when the application requires a cleaner surface.',
        'product.p4.name':          'Heavy plates',
        'product.p4.description':   'Plates for structures, equipment, implements, boilerwork, and heavier industrial applications.',
        'product.p5.name':          'Galvanized, galvalume, and pre-painted products',
        'product.p5.description':   'Coated products for applications requiring corrosion protection, finishing, or external exposure.',
        'product.p6.name':          'Metal roofing and accessories',
        'product.p6.description':   'Trapezoidal and corrugated roofing sheets and accessories for roofing, enclosures, and industrial or commercial construction.',
        'product.p7.name':          'Slit coils',
        'product.p7.description':   'Narrow coils produced by longitudinal slitting, processed to specified widths for direct feeding into roll forming and stamping lines.',
        'product.p8.name':          'U profiles and angles',
        'product.p8.description':   'Formed and galvanized profiles for light steel structures, drywall systems, fastening applications, and construction.',
        'product.p9.name':          'W beams and structural profiles',
        'product.p9.description':   'Rolled structural profiles for warehouses, bridges, machinery, industrial equipment, and applications requiring greater mechanical demand.',

        /* ===== CONTACT PAGE ===== */
        'contact.hero.title':       'Contact',
        'contact.hero.subtitle':    'Get in touch with Fermac.',
        'contact.info.eyebrow':     'How to reach us',
        'contact.info.title':       'We\'re available',
        'contact.whatsapp.label':   'Commercial contact',
        'contact.email.label':      'Email',
        'contact.location.label':   'Location',
        'contact.hours.label':      'Business hours',
        'contact.hours.value':      'Business-hours service',
        'contact.form.title':       'Send a message',
        'contact.form.name':        'Your name',
        'contact.form.email':       'Email or phone',
        'contact.form.subject':     'Subject',
        'contact.form.message':     'Message',
        'contact.form.submit':      'Send message',

        /* ===== FOOTER ===== */
        'footer.tagline':       'Industrial commercial representation with relationships, experience, and close follow-up.',
        'footer.location':      'Caxias do Sul, RS',
        'footer.links.title':   'Links',
        'footer.contact.title': 'Contact',
        'footer.copy':          '© 2026 Fermac Representações.',
        'footer.cnpj':          'Industrial commercial representation',

        /* ===== SHARED ===== */
        'whatsapp.aria':        'Contact Fermac',
        'lang.toggle.aria':     'Switch language',
        'skip.link':            'Skip to content',
    }
};
