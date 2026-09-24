// Plantillas de correo (variables: {{empresa}} {{nombre}} {{saludo}} {{asunto_original}}).
// Se agregan solas si faltan en la base de datos; nunca pisan las que ya editaste en el panel.
export interface Tpl { name: string; segment: string; step: number; subject: string; body: string; attach: string }
export const ALL_TEMPLATES: Tpl[] = [
  {
    "name": "Colegios y clubes - trofeos, medallas y uniformes",
    "segment": "colegios",
    "step": 1,
    "subject": "Trofeos, medallas y uniformes para {{empresa}}",
    "body": "Hola {{saludo}},\n\nLe escribo de Customania, taller de personalización e impresión en Bogotá. Trabajamos con colegios, ligas y clubes deportivos en:\n\n- Trofeos y medallas personalizados\n- Uniformes deportivos en sublimación (diseño propio, nombres y números)\n- Camisetas, gorras y botones para eventos y torneos\n\nSi {{empresa}} tiene un torneo, jornada deportiva o pedido de uniformes próximo, con gusto le envío una cotización sin compromiso. Solo necesito cantidades y fecha aproximada.\n\nCatálogo: https://customania.com.co\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": ""
  },
  {
    "name": "Empresas - uniformes y dotación personalizada",
    "segment": "uniformes",
    "step": 1,
    "subject": "Camisetas y uniformes personalizados para el equipo de {{empresa}}",
    "body": "Hola {{saludo}},\n\nSoy Jorge, de Customania (Bogotá). Personalizamos camisetas, buzos, gorras y uniformes con DTF textil y sublimación, con buen acabado y tiempos de entrega cortos, incluso en pedidos pequeños o por tallas.\n\nSi {{empresa}} necesita ropa de equipo, dotación con logo o prendas para una activación, le puedo enviar una propuesta con precios según cantidad.\n\nPuede ver lo que hacemos aquí: https://customania.com.co\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": ""
  },
  {
    "name": "Empresas - regalos corporativos y promocionales",
    "segment": "regalos",
    "step": 1,
    "subject": "Regalos corporativos personalizados para {{empresa}}",
    "body": "Hola {{saludo}},\n\nLe escribo de Customania, en Bogotá. Hacemos material promocional y regalos corporativos con su marca: mugs, botellas, llaveros, esferos, stickers, tarjetas, pendones y más, con impresión UV, DTF y sublimación.\n\nSi {{empresa}} tiene una fecha especial, evento o campaña de fin de año, le preparo una cotización con opciones y precios por volumen.\n\nEjemplos y servicios: https://customania.com.co\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": ""
  },
  {
    "name": "Eventos - alquiler y personalización",
    "segment": "eventos",
    "step": 1,
    "subject": "Crispetera, fuente de chocolate y detalles personalizados para sus eventos",
    "body": "Hola {{saludo}},\n\nSoy Jorge, de Customania (Bogotá). Además de personalizar productos, alquilamos crispetera y fuente de chocolate para eventos, y podemos preparar detalles con la marca del evento: botones, stickers, camisetas, pendones y recordatorios.\n\nSi en {{empresa}} manejan eventos donde esto pueda servir, con gusto les envío tarifas y disponibilidad. También trabajamos en alianza con organizadores.\n\nMás información: https://customania.com.co\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": ""
  },
  {
    "name": "Seguimiento (único) - todos los segmentos",
    "segment": "todos",
    "step": 2,
    "subject": "Re: {{asunto_original}}",
    "body": "Hola {{saludo}},\n\nLe escribo una sola vez más por si mi mensaje anterior se le pasó. Si en {{empresa}} hay algo de personalización o impresión en lo que pueda ayudar, quedo atento a sus cantidades y fecha para cotizar.\n\nSi no es de su interés, no se preocupe: basta con responder BAJA y no le escribiré más.\n\nGracias por su tiempo,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": ""
  },
  {
    "name": "Colegios y ligas - trofeos y medallas (con catálogo)",
    "segment": "colegios",
    "step": 1,
    "subject": "Trofeos y medallas para los torneos de {{empresa}}",
    "body": "Hola {{saludo}},\n\nLe escribo de Customania, taller de personalización e impresión en Bogotá. Fabricamos trofeos y medallas para premiaciones deportivas, con diseño y grabado personalizados.\n\nLe adjunto un catálogo con referencias y precios de referencia por unidad. Si {{empresa}} tiene un torneo, campeonato o jornada de premiación próxima, con gusto le preparo una cotización con la cantidad y las categorías que necesite.\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": "trofeos"
  },
  {
    "name": "Clubes y colegios - uniformes deportivos (con catálogo)",
    "segment": "colegios",
    "step": 1,
    "subject": "Uniformes deportivos personalizados para {{empresa}}",
    "body": "Hola {{saludo}},\n\nSoy Jorge, de Customania (Bogotá). Hacemos uniformes y ropa deportiva personalizada con sublimación y DTF textil: diseño propio, escudo, nombres y números.\n\nLe comparto un catálogo con algunas referencias. Si {{empresa}} está renovando uniformes o arma equipos para una nueva temporada, cuénteme cuántas prendas necesita y le envío una propuesta con diseño y precio. Antes de producir elaboramos una muestra física para su aprobación.\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": "uniformes"
  },
  {
    "name": "Universidades - bienestar y torneos internos (con catálogo)",
    "segment": "colegios",
    "step": 1,
    "subject": "Premiación y camisetas para los torneos deportivos de {{empresa}}",
    "body": "Hola {{saludo}},\n\nLe escribo de Customania, en Bogotá. Apoyamos a instituciones educativas con medallas, trofeos, camisetas y material personalizado para torneos internos, jornadas de bienestar y eventos deportivos.\n\nAdjunto un catálogo con referencias y precios de referencia. Si tienen actividades programadas para este semestre, con gusto le cotizo según cantidades y fechas.\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": "trofeos"
  },
  {
    "name": "Empresas - camisetas y buzos con su logo (con catálogo)",
    "segment": "uniformes",
    "step": 1,
    "subject": "Camisetas, buzos y gorras con el logo de {{empresa}}",
    "body": "Hola {{saludo}},\n\nSoy Jorge, de Customania (Bogotá). Personalizamos camisetas, buzos, gorras y ropa de equipo con DTF textil y sublimación, con el logo y los colores de su empresa.\n\nLe adjunto un catálogo con referencias. Si {{empresa}} necesita ropa para su equipo, una activación o un evento interno, cuénteme cantidades y fecha aproximada y le envío una propuesta. Elaboramos una muestra física antes de producir.\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": "uniformes"
  },
  {
    "name": "Empresas - ropa para eventos y activaciones (corta)",
    "segment": "uniformes",
    "step": 1,
    "subject": "¿Ropa personalizada para un evento de {{empresa}}?",
    "body": "Hola {{saludo}},\n\nUna pregunta rápida: ¿{{empresa}} tiene un evento, feria o activación próxima en la que el equipo necesite camisetas, gorras o buzos con la marca?\n\nEn Customania (Bogotá) los personalizamos y le puedo enviar una cotización con solo saber la cantidad y la fecha. Le dejo un catálogo adjunto para que vea referencias.\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": "uniformes"
  },
  {
    "name": "Regalos - fin de año 2026 (con catálogo)",
    "segment": "regalos",
    "step": 1,
    "subject": "Regalos de fin de año con la marca de {{empresa}}",
    "body": "Hola {{saludo}},\n\nSe acerca la temporada de fin de año y los pedidos personalizados se concentran en los últimos meses. Desde Customania (Bogotá) le sugiero ir adelantando los detalles para sus clientes y colaboradores: mugs, botellas, llaveros, camisetas, retablos y más, con la marca de {{empresa}}.\n\nLe adjunto un catálogo con referencias y precios de referencia por unidad. Si me cuenta cantidades y presupuesto aproximado, le preparo opciones.\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": "regalos"
  },
  {
    "name": "Regalos - detalles para colaboradores y clientes (con catálogo)",
    "segment": "regalos",
    "step": 1,
    "subject": "Detalles personalizados para el equipo y los clientes de {{empresa}}",
    "body": "Hola {{saludo}},\n\nLe escribo de Customania, en Bogotá. Hacemos regalos y material promocional personalizados para empresas: kits de bienvenida, detalles para clientes, reconocimientos al personal y obsequios para eventos.\n\nEn el catálogo adjunto encontrará algunas referencias. Si {{empresa}} tiene una fecha o campaña en mente, le envío una propuesta con opciones según cantidad.\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": "regalos"
  },
  {
    "name": "Agencias BTL y marketing - aliado de producción (con catálogo)",
    "segment": "regalos",
    "step": 1,
    "subject": "Aliado de producción para las campañas de {{empresa}}",
    "body": "Hola {{saludo}},\n\nSoy Jorge, de Customania (Bogotá). Producimos material promocional y merchandising personalizado con impresión propia (DTF textil, DTF UV y sublimación): camisetas, gorras, mugs, botellas, pendones, stickers, botones y más.\n\nSi {{empresa}} necesita un proveedor de producción para sus campañas o activaciones, puedo cotizarle por proyecto. Adjunto un catálogo de referencia; para cotizar solo necesito el brief, las cantidades y la fecha de entrega.\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": "regalos"
  },
  {
    "name": "Eventos - alianza con organizadores (con catálogo)",
    "segment": "eventos",
    "step": 1,
    "subject": "Alianza con {{empresa}}: recordatorios personalizados y alquiler para eventos",
    "body": "Hola {{saludo}},\n\nSoy Jorge, de Customania (Bogotá). Trabajamos con organizadores de eventos en dos frentes: recordatorios y material con la marca del evento (camisetas, gorras, botones, stickers, pendones, medallas) y alquiler de crispetera y fuente de chocolate.\n\nAdjunto un catálogo de referencia. Si {{empresa}} maneja eventos donde esto pueda sumar, con gusto conversamos una alianza y le envío tarifas y disponibilidad.\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": "general"
  },
  {
    "name": "Aliados - maquila de estampado y sublimación",
    "segment": "aliados",
    "step": 1,
    "subject": "Maquila de DTF y sublimación para {{empresa}}",
    "body": "Hola {{saludo}},\n\nLe escribo de Customania (Bogotá). Además de vender productos personalizados, ofrecemos servicio de impresión para terceros: DTF textil, DTF UV y sublimación.\n\nSi {{empresa}} recibe pedidos de estampado o personalización que prefiere tercerizar, o quiere ampliar su oferta sin invertir en equipos, podemos trabajar como su aliado de producción. Cuénteme qué tipo de pedidos maneja y le envío condiciones.\n\nMás información: https://customania.com.co\n\nQuedo atento,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": ""
  },
  {
    "name": "Seguimiento (único) - con catálogo",
    "segment": "todos",
    "step": 2,
    "subject": "Re: {{asunto_original}}",
    "body": "Hola {{saludo}},\n\nLe escribo una sola vez más por si mi mensaje anterior se le pasó. Le comparto de nuevo nuestro catálogo por si le sirve como referencia; si en {{empresa}} hay un pedido en camino, quedo atento a cantidades y fecha para cotizar.\n\nSi no es de su interés, basta con responder BAJA y no le escribiré más.\n\nGracias por su tiempo,\nJorge\nCustomania · WhatsApp +57 319 385 9952",
    "attach": "general"
  }
];
