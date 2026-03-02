import { mutation } from "./_generated/server";

/**
 * Banco ampliado de palabras mexicanas — ~1000 palabras nuevas
 * Organizadas en 20 bloques de 50 (5 por cada una de las 10 categorías)
 *
 * Categorías: Comida · Juegos · Música · Animales · Historia
 *             Artistas · Monumentos · Plantas · Tradiciones · Modismos
 *
 * Ejecutar desde Convex Dashboard: seedWords1000
 * Luego ejecutar: createLevelsForAllWords
 */
const NEW_WORDS = [

  // ════════════════════════════════════════════════════════════
  // BLOQUE 1
  // ════════════════════════════════════════════════════════════

  // ── Comida ──
  { word: "Sope", meaning: "Tortilla gruesa con frijoles y guiso", example: "Me comí un sope de carnitas en el mercado", region: "CDMX", category: "Comida" },
  { word: "Carnitas", meaning: "Cerdo frito en su propia grasa", example: "Fuimos por carnitas al pueblo el domingo", region: "Michoacán", category: "Comida" },
  { word: "Birria", meaning: "Guisado de chivo o res con adobo", example: "La birria de Jalisco es la mejor", region: "Jalisco", category: "Comida" },
  { word: "Barbacoa", meaning: "Carne cocida en hoyo de tierra", example: "El domingo desayunamos barbacoa en el tianguis", region: "Hidalgo", category: "Comida" },
  { word: "Menudo", meaning: "Caldo de panza de res con chile", example: "El menudo te cura la cruda", region: "Norte", category: "Comida" },

  // ── Juegos ──
  { word: "Papalote", meaning: "Cometa de papel que vuela con viento", example: "Subimos el papalote en el parque", region: "Todo México", category: "Juegos" },
  { word: "Yoyo", meaning: "Juguete que sube y baja por un hilo", example: "El yoyo se enredó en mis dedos", region: "Infantil", category: "Juegos" },
  { word: "Matatena", meaning: "Juego con piedritas y pelota", example: "Jugamos matatena en el patio", region: "Tradicional", category: "Juegos" },
  { word: "Conquián", meaning: "Juego de cartas tradicional", example: "Ganamos conquián en la posada", region: "Norte", category: "Juegos" },
  { word: "Brincar la cuerda", meaning: "Juego de saltar sobre una cuerda girada", example: "Brincamos la cuerda en el recreo", region: "Escuela", category: "Juegos" },

  // ── Música ──
  { word: "Danzón", meaning: "Baile de salón veracruzano", example: "El danzón se baila en el Parque México", region: "Veracruz", category: "Música" },
  { word: "Marimba", meaning: "Instrumento de percusión con teclas de madera", example: "La marimba sonó en la fiesta de Chiapas", region: "Chiapas", category: "Música" },
  { word: "Guitarrón", meaning: "Bajo acústico del mariachi", example: "El guitarrón le da el ritmo al mariachi", region: "Jalisco", category: "Música" },
  { word: "Jarabe tapatío", meaning: "Baile folclórico nacional", example: "Bailamos el jarabe tapatío en el festival", region: "Jalisco", category: "Música" },
  { word: "La bamba", meaning: "Son jarocho veracruzano muy popular", example: "Cantamos La bamba en el karaoke", region: "Veracruz", category: "Música" },

  // ── Animales ──
  { word: "Quetzal", meaning: "Ave de plumas verdes brillantes", example: "El quetzal vive en las nubes de Chiapas", region: "Chiapas", category: "Animales" },
  { word: "Mariposa monarca", meaning: "Mariposa migratoria que llega en invierno", example: "Las mariposas monarca cubrieron los árboles", region: "Michoacán", category: "Animales" },
  { word: "Coyote", meaning: "Cánido del desierto muy astuto", example: "El coyote aúlla en las noches del norte", region: "Norte", category: "Animales" },
  { word: "Tecolote", meaning: "Búho pequeño de México", example: "El tecolote cantó en el mezquite", region: "Norte", category: "Animales" },
  { word: "Tapir mexicano", meaning: "Mamífero grande de selva tropical", example: "Vimos un tapir en la reserva de Calakmul", region: "Chiapas", category: "Animales" },

  // ── Historia ──
  { word: "Tenochtitlan", meaning: "Capital del Imperio Mexica", example: "Tenochtitlan se construyó sobre un lago", region: "CDMX", category: "Historia" },
  { word: "Cuauhtémoc", meaning: "Último tlatoani mexica", example: "Cuauhtémoc defendió Tenochtitlan hasta el final", region: "CDMX", category: "Historia" },
  { word: "Benito Juárez", meaning: "Presidente que reformó las leyes de México", example: "Benito Juárez nació en Guelatao, Oaxaca", region: "Oaxaca", category: "Historia" },
  { word: "Emiliano Zapata", meaning: "Líder revolucionario del agro", example: "Emiliano Zapata luchó por Tierra y Libertad", region: "Morelos", category: "Historia" },
  { word: "La Independencia", meaning: "Movimiento que separó México de España", example: "La Independencia se consumó en 1821", region: "Nacional", category: "Historia" },

  // ── Artistas ──
  { word: "Frida Kahlo", meaning: "Pintora surrealista mexicana", example: "El museo de Frida Kahlo está en Coyoacán", region: "CDMX", category: "Artistas" },
  { word: "Diego Rivera", meaning: "Muralista icónico del siglo XX", example: "Diego Rivera pintó en el Palacio Nacional", region: "CDMX", category: "Artistas" },
  { word: "Juan Rulfo", meaning: "Escritor de Pedro Páramo", example: "Juan Rulfo revolucionó la narrativa mexicana", region: "Jalisco", category: "Artistas" },
  { word: "Carlos Fuentes", meaning: "Novelista del Boom latinoamericano", example: "Carlos Fuentes escribió La región más transparente", region: "CDMX", category: "Artistas" },
  { word: "Cantinflas", meaning: "Comediante ícono del Cine de Oro", example: "Cantinflas hizo reír a generaciones de mexicanos", region: "CDMX", category: "Artistas" },

  // ── Monumentos ──
  { word: "Chichen Itzá", meaning: "Ciudad maya con El Castillo", example: "Chichen Itzá es una de las Siete Maravillas", region: "Yucatán", category: "Monumentos" },
  { word: "Teotihuacan", meaning: "Ciudad prehispánica con pirámide del Sol", example: "Subimos la pirámide del Sol en Teotihuacan", region: "Estado de México", category: "Monumentos" },
  { word: "Templo Mayor", meaning: "Pirámide azteca en el centro de CDMX", example: "El Templo Mayor estaba en el corazón de Tenochtitlan", region: "CDMX", category: "Monumentos" },
  { word: "Palacio de Bellas Artes", meaning: "Teatro de mármol con murales famosos", example: "El concierto fue en el Palacio de Bellas Artes", region: "CDMX", category: "Monumentos" },
  { word: "Catedral Metropolitana", meaning: "La catedral más grande de América Latina", example: "La Catedral Metropolitana domina el Zócalo", region: "CDMX", category: "Monumentos" },

  // ── Plantas ──
  { word: "Nopal", meaning: "Cactus comestible mexicano", example: "El nopal asado está en la dieta diaria", region: "Todo México", category: "Plantas" },
  { word: "Maguey", meaning: "Planta base del pulque y el mezcal", example: "Del maguey sacamos el aguamiel", region: "Oaxaca", category: "Plantas" },
  { word: "Ceiba sagrada", meaning: "Árbol sagrado para los mayas", example: "La ceiba conecta el cielo con el inframundo", region: "Sur", category: "Plantas" },
  { word: "Mezquite", meaning: "Árbol del desierto muy resistente", example: "La madera de mezquite da un humo especial", region: "Norte", category: "Plantas" },
  { word: "Copal", meaning: "Resina aromática de uso ritual", example: "Quemamos copal en el altar de muertos", region: "Oaxaca", category: "Plantas" },

  // ── Tradiciones ──
  { word: "Día de Muertos", meaning: "Celebración para honrar a los difuntos", example: "El Día de Muertos llenó el panteón de flores", region: "Nacional", category: "Tradiciones" },
  { word: "Posadas navideñas", meaning: "Nueve noches de celebración antes de Navidad", example: "En la posada rompimos la piñata con los niños", region: "Nacional", category: "Tradiciones" },
  { word: "Guelaguetza", meaning: "Festival de danzas indígenas de Oaxaca", example: "La Guelaguetza reúne comunidades de Oaxaca cada julio", region: "Oaxaca", category: "Tradiciones" },
  { word: "Quinceañera", meaning: "Celebración de los quince años de una joven", example: "La quinceañera bailó el vals con su chambelán", region: "Todo México", category: "Tradiciones" },
  { word: "Danza de los Voladores", meaning: "Rito totонaco de fertilidad", example: "Los Voladores de Papantla giran en el aire", region: "Veracruz", category: "Tradiciones" },

  // ── Modismos ──
  { word: "Chido", meaning: "Algo cool o muy bueno", example: "Ese concierto estuvo bien chido", region: "Juvenil", category: "Modismos" },
  { word: "Güey", meaning: "Término familiar entre amigos", example: "¿Ya viste, güey, lo que pasó?", region: "Todo México", category: "Modismos" },
  { word: "Órale", meaning: "Expresión de acuerdo o ánimo", example: "Órale, nos vemos al rato en la tienda", region: "Todo México", category: "Modismos" },
  { word: "Neta", meaning: "La verdad pura", example: "La neta no sé qué pasó anoche", region: "Juvenil", category: "Modismos" },
  { word: "Chamba", meaning: "Trabajo o empleo", example: "Ando buscando chamba por el centro", region: "Todo México", category: "Modismos" },

  // ════════════════════════════════════════════════════════════
  // BLOQUE 2
  // ════════════════════════════════════════════════════════════

  // ── Comida ──
  { word: "Cochinita pibil", meaning: "Cerdo marinado en achiote cocido en hoyo", example: "La cochinita pibil viene de Yucatán", region: "Yucatán", category: "Comida" },
  { word: "Flautas", meaning: "Tortillas enrolladas y fritas con guiso", example: "Comí flautas de pollo con crema y queso", region: "CDMX", category: "Comida" },
  { word: "Quesadilla", meaning: "Tortilla de maíz con queso derretido", example: "La quesadilla con huitlacoche estaba increíble", region: "CDMX", category: "Comida" },
  { word: "Guacamole", meaning: "Pasta de aguacate con limón y chile", example: "Preparamos guacamole para la botana", region: "Todo México", category: "Comida" },
  { word: "Tostada", meaning: "Tortilla frita con toppings encima", example: "Me comí una tostada de ceviche en el mercado", region: "Jalisco", category: "Comida" },

  // ── Juegos ──
  { word: "Policías y ladrones", meaning: "Juego de persecución con equipos", example: "Jugamos policías y ladrones en el parque", region: "Callejero", category: "Juegos" },
  { word: "El rey de la montaña", meaning: "Juego de empuje en un punto alto", example: "Jugamos al rey de la montaña en el cerro", region: "Infantil", category: "Juegos" },
  { word: "Quemados", meaning: "Juego donde se elimina con pelota", example: "Los quemados era el favorito en la clase", region: "Escuela", category: "Juegos" },
  { word: "La carretilla", meaning: "Juego de carrera en parejas", example: "Ganamos la carrera de carretilla en el día del deporte", region: "Escuela", category: "Juegos" },
  { word: "Kermés", meaning: "Feria escolar con juegos y comida", example: "La kermés de la escuela estuvo divertida", region: "Escuela", category: "Juegos" },

  // ── Música ──
  { word: "Bésame mucho", meaning: "Bolero mexicano de fama mundial", example: "Bésame mucho se escucha en todas las serenatas", region: "Nacional", category: "Música" },
  { word: "Cielito lindo", meaning: "Canción tradicional mexicana muy conocida", example: "Cantamos cielito lindo en el festival", region: "Nacional", category: "Música" },
  { word: "Trova yucateca", meaning: "Música romántica tradicional de Yucatán", example: "La trova yucateca suena muy bonito en Mérida", region: "Yucatán", category: "Música" },
  { word: "Tambora sinaloense", meaning: "Bombo de banda sinaloense", example: "La tambora le da energía a la banda", region: "Sinaloa", category: "Música" },
  { word: "Requinto", meaning: "Guitarra pequeña de sonido agudo", example: "El requinto lleva la melodía en el trío", region: "Nacional", category: "Música" },

  // ── Animales ──
  { word: "Mono araña", meaning: "Primate de brazos largos de la selva", example: "El mono araña se columpia en las lianas", region: "Chiapas", category: "Animales" },
  { word: "Cacomixtle", meaning: "Mamífero nocturno con rayas", example: "El cacomixtle se metió por el techo", region: "Sur", category: "Animales" },
  { word: "Alacrán", meaning: "Arácnido venenoso de zonas áridas", example: "Encontramos un alacrán en el zapato", region: "Norte", category: "Animales" },
  { word: "Manatí", meaning: "Mamífero acuático en peligro de extinción", example: "El manatí nada despacio en las costas", region: "Quintana Roo", category: "Animales" },
  { word: "Luciérnaga", meaning: "Insecto que emite luz en la noche", example: "Las luciérnagas iluminaron el campo en junio", region: "Centro", category: "Animales" },

  // ── Historia ──
  { word: "Huitzilopochtli", meaning: "Dios mexica del sol y la guerra", example: "Huitzilopochtli guiaba a los mexicas en su migración", region: "CDMX", category: "Historia" },
  { word: "Malinche", meaning: "Traductora e intérprete de Hernán Cortés", example: "La Malinche habló náhuatl y maya con los españoles", region: "Nacional", category: "Historia" },
  { word: "Pancho Villa", meaning: "General revolucionario del norte", example: "Pancho Villa lideró la División del Norte", region: "Chihuahua", category: "Historia" },
  { word: "Constitución de 1917", meaning: "Carta magna que surgió de la Revolución", example: "La Constitución de 1917 garantiza derechos sociales", region: "Nacional", category: "Historia" },
  { word: "La Noche Triste", meaning: "Derrota española al huir de Tenochtitlan", example: "En La Noche Triste Cortés perdió muchos soldados", region: "CDMX", category: "Historia" },

  // ── Artistas ──
  { word: "Jorge Negrete", meaning: "Cantante y actor del Cine de Oro", example: "Jorge Negrete era conocido como el Charro cantor", region: "Jalisco", category: "Artistas" },
  { word: "María Félix", meaning: "Actriz icónica del cine mexicano", example: "María Félix fue La Doña del cine nacional", region: "Sonora", category: "Artistas" },
  { word: "Dolores del Río", meaning: "Primera actriz latina en Hollywood", example: "Dolores del Río brilló en Hollywood y México", region: "Chihuahua", category: "Artistas" },
  { word: "Tin Tan", meaning: "Comediante pachuco del Cine de Oro", example: "Tin Tan inventó el estilo pachuco en México", region: "Chihuahua", category: "Artistas" },
  { word: "Rosario Castellanos", meaning: "Escritora feminista de Chiapas", example: "Rosario Castellanos defendió los derechos de las mujeres", region: "Chiapas", category: "Artistas" },

  // ── Monumentos ──
  { word: "El Tajín", meaning: "Ciudad totonaca con pirámide de nichos", example: "El Tajín tiene 365 nichos en su pirámide", region: "Veracruz", category: "Monumentos" },
  { word: "Tula", meaning: "Capital tolteca con Atlantes de piedra", example: "Los Atlantes de Tula son estatuas guerreras de piedra", region: "Hidalgo", category: "Monumentos" },
  { word: "Xochicalco", meaning: "Centro astronómico prehispánico", example: "Xochicalco tiene tallados mayas y teotihuacanos", region: "Morelos", category: "Monumentos" },
  { word: "Cholula", meaning: "Ciudad con la pirámide más grande por volumen", example: "La pirámide de Cholula tiene una iglesia encima", region: "Puebla", category: "Monumentos" },
  { word: "Hospicio Cabañas", meaning: "Patrimonio cultural de Guadalajara", example: "El Hospicio Cabañas tiene murales de Orozco", region: "Jalisco", category: "Monumentos" },

  // ── Plantas ──
  { word: "Chicozapote", meaning: "Árbol de fruto dulce y café", example: "El chicozapote tiene un sabor muy especial", region: "Sur", category: "Plantas" },
  { word: "Pitaya", meaning: "Fruto del cactus de colores brillantes", example: "Comimos pitaya roja en el mercado de Oaxaca", region: "Oaxaca", category: "Plantas" },
  { word: "Tejocote", meaning: "Fruta ácida para ponche navideño", example: "El tejocote es ingrediente del ponche en Navidad", region: "Centro", category: "Plantas" },
  { word: "Capulín mexicano", meaning: "Cereza silvestre de zonas altas", example: "El capulín crece en los bosques de Michoacán", region: "Occidente", category: "Plantas" },
  { word: "Chaya", meaning: "Planta comestible rica en proteínas", example: "La chaya se mezcla con huevo en Yucatán", region: "Yucatán", category: "Plantas" },

  // ── Tradiciones ──
  { word: "Altar de muertos", meaning: "Ofrenda con foto, comida y flores del difunto", example: "Pusimos el altar con su foto y cempasúchil", region: "Nacional", category: "Tradiciones" },
  { word: "Piñata de posada", meaning: "Figura de barro decorada con papel", example: "Rompimos la piñata de posada con siete picos", region: "Nacional", category: "Tradiciones" },
  { word: "Semana Santa", meaning: "Semana de conmemoración de la Pasión de Cristo", example: "En Semana Santa la familia se reúne a celebrar", region: "Nacional", category: "Tradiciones" },
  { word: "Serenata", meaning: "Cantos nocturnos para celebrar a alguien", example: "Le dieron serenata a mi mamá en su cumpleaños", region: "Nacional", category: "Tradiciones" },
  { word: "Tianguis", meaning: "Mercado ambulante tradicional", example: "El tianguis del domingo vende de todo en el barrio", region: "Todo México", category: "Tradiciones" },

  // ── Modismos ──
  { word: "Ándale", meaning: "Expresión de prisa o acuerdo", example: "Ándale, ya es tarde para el camión", region: "Todo México", category: "Modismos" },
  { word: "Sale", meaning: "Aceptación informal de algo", example: "Sale, ahí nos vemos en la tarde", region: "Todo México", category: "Modismos" },
  { word: "Simón", meaning: "Sí, de acuerdo en jerga juvenil", example: "¿Vas a la fiesta? Simón, claro que sí", region: "Juvenil", category: "Modismos" },
  { word: "Nel", meaning: "No, negativa informal", example: "¿Quieres más? Nel, ya estoy lleno", region: "Juvenil", category: "Modismos" },
  { word: "Cuate", meaning: "Amigo cercano o gemelo", example: "Ese cuate es mi mejor amigo desde la prepa", region: "Todo México", category: "Modismos" },

  // ════════════════════════════════════════════════════════════
  // BLOQUE 3
  // ════════════════════════════════════════════════════════════

  // ── Comida ──
  { word: "Enchiladas verdes", meaning: "Tortillas bañadas en salsa verde con pollo", example: "Pedí enchiladas verdes con crema y queso", region: "CDMX", category: "Comida" },
  { word: "Mole negro", meaning: "Salsa oscura oaxaqueña con chilhuacle negro", example: "El mole negro de Oaxaca es el más complejo", region: "Oaxaca", category: "Comida" },
  { word: "Pipián", meaning: "Salsa de semillas de calabaza con chile", example: "El pipián verde acompañó las enchiladas", region: "Todo México", category: "Comida" },
  { word: "Caldo de res", meaning: "Caldo con verduras y hueso de res", example: "El caldo de res es perfecto para el frío", region: "Nacional", category: "Comida" },
  { word: "Gordita", meaning: "Masa de maíz rellena y cocida en comal", example: "La gordita de chicharrón estaba crujiente", region: "Norte", category: "Comida" },

  // ── Juegos ──
  { word: "El avión", meaning: "Rayuela dibujada en el suelo con casillas", example: "Saltamos en el avión a la hora del recreo", region: "Escuela", category: "Juegos" },
  { word: "San Serafín", meaning: "Juego de ronda con mímicas y canciones", example: "Jugamos a San Serafín en la fiesta del kínder", region: "Infantil", category: "Juegos" },
  { word: "Las estatuas de marfil", meaning: "Juego de quedarse inmóvil al instante", example: "Nos congelamos jugando a las estatuas de marfil", region: "Callejero", category: "Juegos" },
  { word: "El florón", meaning: "Juego de pasar objeto oculto en ronda", example: "En el florón nadie sabía quién tenía la piedra", region: "Infantil", category: "Juegos" },
  { word: "Carrera de sacos", meaning: "Competencia saltando dentro de un costal", example: "Gané la carrera de sacos en el día del deporte", region: "Escuela", category: "Juegos" },

  // ── Música ──
  { word: "Jarana yucateca", meaning: "Guitarra pequeña del son yucateco", example: "La jarana yucateca le da el ritmo a la trova", region: "Yucatán", category: "Música" },
  { word: "Arpa jarocha", meaning: "Arpa del son de Veracruz", example: "El arpa jarocha guía la melodía del fandango", region: "Veracruz", category: "Música" },
  { word: "Teponaztli", meaning: "Tambor de madera prehispánico", example: "El teponaztli sonaba en las ceremonias mexicas", region: "CDMX", category: "Música" },
  { word: "El son de la negra", meaning: "Canción símbolo del mariachi", example: "Tocaron El son de la negra en la boda", region: "Jalisco", category: "Música" },
  { word: "Agustín Lara", meaning: "Compositor romántico autor de boleros clásicos", example: "Agustín Lara escribió Granada y Veracruz", region: "Veracruz", category: "Música" },

  // ── Animales ──
  { word: "Boa constrictor", meaning: "Serpiente grande que asfixia a su presa", example: "La boa constrictor enrolló al ratón en la selva", region: "Sur", category: "Animales" },
  { word: "Tortuga caguama", meaning: "Tortuga marina en peligro de extinción", example: "La tortuga caguama llegó a desovar en la playa", region: "Oaxaca", category: "Animales" },
  { word: "Tepezcuintle", meaning: "Roedor grande de selva comestible", example: "El tepezcuintle es muy sabroso en Tabasco", region: "Sur", category: "Animales" },
  { word: "Grulla blanca", meaning: "Ave migratoria de largo cuello", example: "Las grullas blancas llegaron a Chihuahua en invierno", region: "Chihuahua", category: "Animales" },
  { word: "Pez blanco de Pátzcuaro", meaning: "Pez endémico del lago michoacano", example: "El pez blanco de Pátzcuaro casi se extinguió", region: "Michoacán", category: "Animales" },

  // ── Historia ──
  { word: "Miguel Hidalgo", meaning: "Cura que inició la guerra de Independencia", example: "Miguel Hidalgo dio el Grito en Dolores", region: "Guanajuato", category: "Historia" },
  { word: "Josefa Ortiz de Domínguez", meaning: "Heroína corregidora de la Independencia", example: "Josefa Ortiz avisó a los insurgentes del descubrimiento", region: "Querétaro", category: "Historia" },
  { word: "Grito de Independencia", meaning: "Llamado que inició la lucha en 1810", example: "El Grito de Independencia se repite cada 15 de septiembre", region: "Nacional", category: "Historia" },
  { word: "Plan de Iguala", meaning: "Documento que proclamó la independencia de México", example: "El Plan de Iguala unió a realistas e insurgentes", region: "Nacional", category: "Historia" },
  { word: "Batalla de Puebla", meaning: "Victoria mexicana ante el ejército francés", example: "La Batalla de Puebla se ganó el 5 de mayo de 1862", region: "Puebla", category: "Historia" },

  // ── Artistas ──
  { word: "Elena Poniatowska", meaning: "Periodista y escritora mexicana", example: "Elena Poniatowska documentó el movimiento del 68", region: "CDMX", category: "Artistas" },
  { word: "Carlos Monsiváis", meaning: "Cronista y ensayista de la cultura mexicana", example: "Carlos Monsiváis era el gran observador del México moderno", region: "CDMX", category: "Artistas" },
  { word: "Chespirito", meaning: "Comediante creador del Chavo del 8", example: "Chespirito hizo reír a todo el mundo hispanohablante", region: "CDMX", category: "Artistas" },
  { word: "Silvia Pinal", meaning: "Actriz del Cine de Oro mexicano", example: "Silvia Pinal actuó con Luis Buñuel", region: "CDMX", category: "Artistas" },
  { word: "Jaime Sabines", meaning: "Poeta chiapaneco de gran sensibilidad", example: "Los poemas de Jaime Sabines se aprenden de memoria", region: "Chiapas", category: "Artistas" },

  // ── Monumentos ──
  { word: "Malinalco", meaning: "Zona arqueológica tallada en roca viva", example: "Malinalco tiene templos esculpidos en la piedra", region: "Estado de México", category: "Monumentos" },
  { word: "La Venta", meaning: "Centro ceremonial olmeca de Tabasco", example: "La Venta tiene enormes cabezas olmecas", region: "Tabasco", category: "Monumentos" },
  { word: "Bonampak", meaning: "Sitio maya famoso por sus murales únicos", example: "Los murales de Bonampak narran batallas mayas", region: "Chiapas", category: "Monumentos" },
  { word: "Palacio Nacional", meaning: "Sede del gobierno en el Zócalo de CDMX", example: "El Palacio Nacional tiene murales de Diego Rivera", region: "CDMX", category: "Monumentos" },
  { word: "Ángel de la Independencia", meaning: "Columna con victoria alada símbolo de CDMX", example: "El Ángel de la Independencia brilla en Reforma", region: "CDMX", category: "Monumentos" },

  // ── Plantas ──
  { word: "Guanábana", meaning: "Fruta tropical de pulpa blanca y sabor ácido", example: "La guanábana es buenísima en agua fresca", region: "Sur", category: "Plantas" },
  { word: "Mamey sapote", meaning: "Fruto grande y dulce de color naranja", example: "El mamey sabe a mezcla de chocolate y vainilla", region: "Sur", category: "Plantas" },
  { word: "Nance", meaning: "Fruta amarilla silvestre y ácida", example: "El nance en aguardiente es típico de Guerrero", region: "Guerrero", category: "Plantas" },
  { word: "Ocote", meaning: "Pino resinoso que se usa para encender fuego", example: "El ocote prende muy rápido para el fogón", region: "Norte", category: "Plantas" },
  { word: "Amate", meaning: "Árbol de higuera cuya corteza sirve para papel", example: "El amate es base del arte indígena otomí", region: "Hidalgo", category: "Plantas" },

  // ── Tradiciones ──
  { word: "Cempasúchil", meaning: "Flor amarilla símbolo del Día de Muertos", example: "El cempasúchil guía a las almas al altar", region: "Nacional", category: "Tradiciones" },
  { word: "Pastorela", meaning: "Obra teatral navideña sobre el nacimiento", example: "La pastorela del pueblo estuvo muy chistosa", region: "Nacional", category: "Tradiciones" },
  { word: "Quema de Judas", meaning: "Quema de figuras de papier-mâché en Sábado de Gloria", example: "Quemamos al Judas con cohetes en la calle", region: "Nacional", category: "Tradiciones" },
  { word: "Rosca de Reyes", meaning: "Pan ovalado con figuras para el 6 de enero", example: "Me tocó el niñito en la rosca de reyes", region: "Nacional", category: "Tradiciones" },
  { word: "Mañanitas", meaning: "Canción tradicional de cumpleaños y fiestas", example: "Le cantamos las mañanitas a las 6 de la mañana", region: "Nacional", category: "Tradiciones" },

  // ── Modismos ──
  { word: "Jale", meaning: "Trabajo o acción pendiente", example: "Me voy al jale temprano mañana", region: "Todo México", category: "Modismos" },
  { word: "Chela", meaning: "Cerveza fría", example: "Échame una chela bien helada", region: "Todo México", category: "Modismos" },
  { word: "Morro", meaning: "Niño o chico joven", example: "Ese morro ya juega bien el fut", region: "CDMX", category: "Modismos" },
  { word: "Morra", meaning: "Chica joven, mujer", example: "La morra de la esquina estudia medicina", region: "CDMX", category: "Modismos" },
  { word: "Fresa", meaning: "Persona presumida o de clase acomodada", example: "No seas fresa y comparte tu comida", region: "Juvenil", category: "Modismos" },

  // ════════════════════════════════════════════════════════════
  // BLOQUE 4
  // ════════════════════════════════════════════════════════════

  // ── Comida ──
  { word: "Tasajo", meaning: "Carne seca salada al estilo oaxaqueño", example: "El tasajo asado es delicioso en la tlayuda", region: "Oaxaca", category: "Comida" },
  { word: "Cecina", meaning: "Carne salada y seca en láminas", example: "La cecina enchilada es famosa en Yecapixtla", region: "Morelos", category: "Comida" },
  { word: "Rajas con crema", meaning: "Tiras de chile poblano en crema", example: "Las rajas con crema son mi guarnición favorita", region: "Puebla", category: "Comida" },
  { word: "Huitlacoche", meaning: "Hongo del maíz considerado manjar", example: "La quesadilla de huitlacoche es muy gourmet", region: "CDMX", category: "Comida" },
  { word: "Adobo mexicano", meaning: "Marinada espesa de chiles y especias", example: "El adobo mexicano le da sabor a la carne", region: "Nacional", category: "Comida" },

  // ── Juegos ──
  { word: "Matarile", meaning: "Juego de ronda y preguntas cantadas", example: "Cantamos matarile en el recreo del kínder", region: "Infantil", category: "Juegos" },
  { word: "Caballito de madera", meaning: "Balancín de feria en forma de caballo", example: "Me subí al caballito de madera en la feria", region: "Feria", category: "Juegos" },
  { word: "Tiro al blanco", meaning: "Juego de precisión en la feria", example: "Gané un peluche en el tiro al blanco", region: "Feria", category: "Juegos" },
  { word: "Juego de argollas", meaning: "Lanzar argollas sobre objetos para ganar premios", example: "Jugué argollas en la kermés de la escuela", region: "Feria", category: "Juegos" },
  { word: "Damas chinas", meaning: "Juego de estrategia con canicas de colores", example: "Jugamos damas chinas en el recreo", region: "Infantil", category: "Juegos" },

  // ── Música ──
  { word: "Bajo sexto", meaning: "Guitarra de 12 cuerdas del norte", example: "El bajo sexto es esencial en la música norteña", region: "Norte", category: "Música" },
  { word: "Maracas", meaning: "Instrumento de percusión con semillas", example: "Las maracas llevan el ritmo en la fiesta", region: "Todo México", category: "Música" },
  { word: "Vihuela de mariachi", meaning: "Guitarra pequeña de fondo curvo", example: "La vihuela marca los acordes en el mariachi", region: "Jalisco", category: "Música" },
  { word: "Tríos románticos", meaning: "Formato musical de tres voces y guitarras", example: "Los tríos románticos llenan las serenatas", region: "Nacional", category: "Música" },
  { word: "Son calentano", meaning: "Música de la Tierra Caliente de Michoacán", example: "El son calentano se baila zapateando", region: "Michoacán", category: "Música" },

  // ── Animales ──
  { word: "Pelícano café", meaning: "Ave costera que zambulle por peces", example: "Los pelícanos cafés vuelan sobre el puerto", region: "Pacífico", category: "Animales" },
  { word: "Acocil", meaning: "Crustáceo de agua dulce comestible", example: "Los acociles son una botana con limón en CDMX", region: "CDMX", category: "Animales" },
  { word: "Tortuga laúd", meaning: "La tortuga marina más grande del mundo", example: "La tortuga laúd desova en las playas de Oaxaca", region: "Oaxaca", category: "Animales" },
  { word: "Mono aullador", meaning: "Mono con rugido que se escucha a lo lejos", example: "El mono aullador se oye en toda la selva", region: "Sur", category: "Animales" },
  { word: "Jabalí de collar", meaning: "Jabalí de selva y monte mexicano", example: "El jabalí de collar cruzó el camino en Yucatán", region: "Sur", category: "Animales" },

  // ── Historia ──
  { word: "José María Morelos", meaning: "Líder insurgente de la Independencia", example: "Morelos redactó los Sentimientos de la Nación", region: "Michoacán", category: "Historia" },
  { word: "Agustín de Iturbide", meaning: "Primer emperador mexicano", example: "Agustín de Iturbide fue coronado en 1822", region: "Nacional", category: "Historia" },
  { word: "Maximiliano de Habsburgo", meaning: "Emperador impuesto por Francia", example: "Maximiliano de Habsburgo gobernó de 1864 a 1867", region: "Nacional", category: "Historia" },
  { word: "Cristiada", meaning: "Guerra de cristeros entre Iglesia y Estado", example: "La Cristiada duró tres años en el occidente", region: "Occidente", category: "Historia" },
  { word: "El Porfiriato", meaning: "Período de dictadura de Porfirio Díaz", example: "El Porfiriato trajo modernización pero poca libertad", region: "Nacional", category: "Historia" },

  // ── Artistas ──
  { word: "Sor Juana Inés de la Cruz", meaning: "Primera gran poeta y escritora de México", example: "Sor Juana fue la décima musa de las letras", region: "CDMX", category: "Artistas" },
  { word: "Alfonso Reyes", meaning: "Escritor y diplomático mexicano", example: "Alfonso Reyes representó a México en el mundo", region: "Nuevo León", category: "Artistas" },
  { word: "Salvador Novo", meaning: "Poeta y cronista de la Ciudad de México", example: "Salvador Novo escribió crónicas de la vida capitalina", region: "CDMX", category: "Artistas" },
  { word: "Xavier Villaurrutia", meaning: "Poeta del grupo Contemporáneos", example: "Xavier Villaurrutia escribió los Nocturnos", region: "CDMX", category: "Artistas" },
  { word: "Efraín Huerta", meaning: "Poeta urbano y político", example: "Efraín Huerta cantó a la Ciudad de México", region: "Guanajuato", category: "Artistas" },

  // ── Monumentos ──
  { word: "Torre Latinoamericana", meaning: "Rascacielos icónico del centro de CDMX", example: "La Torre Latinoamericana sobrevivió los sismos", region: "CDMX", category: "Monumentos" },
  { word: "Yaxchilán", meaning: "Ciudad maya a orillas del río Usumacinta", example: "Yaxchilán tiene dinteles con relieves únicos", region: "Chiapas", category: "Monumentos" },
  { word: "Toniná", meaning: "Gran acrópolis maya del sur", example: "Toniná tiene la pirámide más alta de Mesoamérica", region: "Chiapas", category: "Monumentos" },
  { word: "Castillo de Chapultepec", meaning: "Castillo en el bosque de Chapultepec", example: "El Castillo de Chapultepec fue residencia presidencial", region: "CDMX", category: "Monumentos" },
  { word: "Monumento a la Revolución", meaning: "Cúpula que alberga restos de héroes nacionales", example: "El Monumento a la Revolución domina la colonia Tabacalera", region: "CDMX", category: "Monumentos" },

  // ── Plantas ──
  { word: "Huizache", meaning: "Árbol espinoso con flores amarillas", example: "El huizache florece en la temporada seca del norte", region: "Norte", category: "Plantas" },
  { word: "Peyote", meaning: "Cactus con propiedades rituales de los huicholes", example: "El peyote es sagrado para los wixáritari", region: "Norte", category: "Plantas" },
  { word: "Árbol del tule", meaning: "Ciprés milenario de Oaxaca", example: "El árbol del tule tiene el tronco más grueso del mundo", region: "Oaxaca", category: "Plantas" },
  { word: "Colorín", meaning: "Árbol de flores rojas comestibles", example: "Las flores del colorín se comen en quesillo en Oaxaca", region: "Oaxaca", category: "Plantas" },
  { word: "Palma real", meaning: "Palma alta del paisaje costero mexicano", example: "La palma real bordea los caminos de Veracruz", region: "Veracruz", category: "Plantas" },

  // ── Tradiciones ──
  { word: "Día de Reyes", meaning: "Celebración del 6 de enero con regalos", example: "Los niños recibieron sus regalos el Día de Reyes", region: "Nacional", category: "Tradiciones" },
  { word: "Peregrinación guadalupana", meaning: "Marcha de fieles al Tepeyac el 12 de diciembre", example: "Las peregrinaciones llegan al Tepeyac desde muy lejos", region: "Nacional", category: "Tradiciones" },
  { word: "Compadrazgo", meaning: "Relación ritual entre padrinos y padres", example: "El compadrazgo une a las familias de por vida", region: "Todo México", category: "Tradiciones" },
  { word: "Velorio mexicano", meaning: "Vigilia nocturna para el difunto", example: "El velorio duró toda la noche con tamales y café", region: "Nacional", category: "Tradiciones" },
  { word: "Carnaval de Veracruz", meaning: "Carnaval costero con comparsas y música", example: "El Carnaval de Veracruz es el más grande del país", region: "Veracruz", category: "Tradiciones" },

  // ── Modismos ──
  { word: "Naco", meaning: "Persona con modales considerados vulgares", example: "No seas naco y baja la música", region: "Juvenil", category: "Modismos" },
  { word: "Gandalla", meaning: "Persona aprovechada y abusiva", example: "No seas gandalla, espera tu turno", region: "Todo México", category: "Modismos" },
  { word: "Apapachar", meaning: "Abrazar y consentir con cariño", example: "Le gusta que la apapachen cuando está triste", region: "Todo México", category: "Modismos" },
  { word: "Desmadre", meaning: "Caos o desorden total", example: "La fiesta se convirtió en un desmadre total", region: "Juvenil", category: "Modismos" },
  { word: "Cotorrear", meaning: "Platicar y reírse con amigos", example: "Nos quedamos cotorreando en la banqueta toda la tarde", region: "Juvenil", category: "Modismos" },

  // ════════════════════════════════════════════════════════════
  // BLOQUE 5
  // ════════════════════════════════════════════════════════════

  // ── Comida ──
  { word: "Marquesita", meaning: "Crujiente enrollada con queso y relleno dulce", example: "La marquesita de queso amarillo es típica de Mérida", region: "Yucatán", category: "Comida" },
  { word: "Poc chuc", meaning: "Cerdo marinado en naranja agria al carbón", example: "El poc chuc es un platillo yucateco muy sabroso", region: "Yucatán", category: "Comida" },
  { word: "Machaca", meaning: "Carne seca deshebrada del norte", example: "La machaca con huevo es el desayuno norteño", region: "Norte", category: "Comida" },
  { word: "Chorizo mexicano", meaning: "Embutido de cerdo con chile y especias", example: "El chorizo mexicano es diferente al español", region: "Nacional", category: "Comida" },
  { word: "Tepache", meaning: "Bebida fermentada de piña", example: "El tepache de piña está muy rico en verano", region: "Todo México", category: "Comida" },

  // ── Juegos ──
  { word: "Chaz-chaz", meaning: "Juego de palmas cantado entre dos", example: "Jugamos chaz-chaz en el recreo", region: "Infantil", category: "Juegos" },
  { word: "Mamá Lupe", meaning: "Juego de ronda tradicional infantil", example: "Cantamos mamá Lupe en la fiesta del kínder", region: "Infantil", category: "Juegos" },
  { word: "El patio de mi casa", meaning: "Juego de ronda con canción tradicional", example: "Jugamos el patio de mi casa con los niños", region: "Infantil", category: "Juegos" },
  { word: "Baraja española", meaning: "Juego de naipes con figuras españolas", example: "Jugamos baraja española toda la noche", region: "Todo México", category: "Juegos" },
  { word: "Concurso de piñata", meaning: "Competencia de rompimiento de piñata", example: "En el concurso de piñata gané el último turno", region: "Feria", category: "Juegos" },

  // ── Música ──
  { word: "Son de artesa", meaning: "Baile afromexicano sobre una artesa de madera", example: "El son de artesa se baila en Costa Chica", region: "Guerrero", category: "Música" },
  { word: "Chilena guerrerense", meaning: "Género musical de Guerrero con raíces africanas", example: "La chilena guerrerense mezcla ritmos africanos y españoles", region: "Guerrero", category: "Música" },
  { word: "Flauta de carrizo", meaning: "Instrumento de viento prehispánico", example: "La flauta de carrizo suena en ceremonias otomíes", region: "Centro", category: "Música" },
  { word: "Zapateado", meaning: "Técnica de baile con los pies", example: "El zapateado del jarocho sacude el fandango", region: "Veracruz", category: "Música" },
  { word: "Canción mixteca", meaning: "Himno nostálgico del pueblo mixteco", example: "La Canción mixteca se escucha en los pueblos de Oaxaca", region: "Oaxaca", category: "Música" },

  // ── Animales ──
  { word: "Gorrión mexicano", meaning: "Pequeño pájaro café muy común", example: "El gorrión mexicano anida en las casas del barrio", region: "Todo México", category: "Animales" },
  { word: "Salamandra de Oaxaca", meaning: "Anfibio endémico de Oaxaca", example: "La salamandra de Oaxaca vive en bosques húmedos", region: "Oaxaca", category: "Animales" },
  { word: "Manta raya", meaning: "Raya gigante de aguas tropicales", example: "La manta raya saltó del mar en Baja California", region: "Baja California", category: "Animales" },
  { word: "Lince mexicano", meaning: "Felino mediano en peligro de extinción", example: "El lince mexicano ya casi no se ve en el norte", region: "Norte", category: "Animales" },
  { word: "Grana cochinilla", meaning: "Insecto que produce tinte rojo", example: "La grana cochinilla tiñe las telas de rojo intenso", region: "Oaxaca", category: "Animales" },

  // ── Historia ──
  { word: "Triple Alianza", meaning: "Confederación de Tenochtitlan, Texcoco y Tlacopan", example: "La Triple Alianza dominó el centro de México", region: "CDMX", category: "Historia" },
  { word: "Hernán Cortés", meaning: "Conquistador español de México", example: "Hernán Cortés llegó en 1519 a Veracruz", region: "Nacional", category: "Historia" },
  { word: "Leyes de Reforma", meaning: "Leyes que separaron Iglesia del Estado", example: "Las Leyes de Reforma modernizaron el país", region: "Nacional", category: "Historia" },
  { word: "Reforma Agraria", meaning: "Repartición de tierras a campesinos", example: "La Reforma Agraria cambió el campo mexicano", region: "Nacional", category: "Historia" },
  { word: "Sismo de 1985", meaning: "Terremoto devastador que sacudió CDMX", example: "El Sismo de 1985 unió al pueblo mexicano", region: "CDMX", category: "Historia" },

  // ── Artistas ──
  { word: "Ramón López Velarde", meaning: "Poeta de la identidad mexicana", example: "Ramón López Velarde escribió La Suave Patria", region: "Zacatecas", category: "Artistas" },
  { word: "Elena Garro", meaning: "Escritora surrealista mexicana", example: "Elena Garro escribió Los recuerdos del porvenir", region: "Puebla", category: "Artistas" },
  { word: "José Vasconcelos", meaning: "Filósofo y fundador de la SEP", example: "Vasconcelos impulsó la educación pública en México", region: "Oaxaca", category: "Artistas" },
  { word: "Amparo Ochoa", meaning: "Cantante de música de protesta social", example: "Amparo Ochoa cantó con gran sentimiento social", region: "Sinaloa", category: "Artistas" },
  { word: "Astrid Hadad", meaning: "Artista de cabaret político mexicano", example: "Astrid Hadad mezcla humor y crítica social", region: "CDMX", category: "Artistas" },

  // ── Monumentos ──
  { word: "Dzibilchaltún", meaning: "Zona maya con templo de las Siete Muñecas", example: "El templo de Dzibilchaltún alinea el sol en equinoccio", region: "Yucatán", category: "Monumentos" },
  { word: "Ek Balam", meaning: "Ciudad maya con friso de estuco único", example: "Ek Balam tiene el friso de estuco mejor conservado", region: "Yucatán", category: "Monumentos" },
  { word: "Cobá", meaning: "Ciudad maya con pirámide rodeada de selva", example: "Cobá tiene su pirámide rodeada de selva", region: "Quintana Roo", category: "Monumentos" },
  { word: "Tulum", meaning: "Ciudad maya en el Caribe", example: "Tulum tiene ruinas con vista al mar", region: "Quintana Roo", category: "Monumentos" },
  { word: "Museo Nacional de Antropología", meaning: "Museo más importante de México", example: "El Museo de Antropología tiene el Calendario Azteca", region: "CDMX", category: "Monumentos" },

  // ── Plantas ──
  { word: "Biznaga", meaning: "Cactus barril de zonas áridas", example: "La biznaga almacena agua en el desierto", region: "Norte", category: "Plantas" },
  { word: "Damiana", meaning: "Planta medicinal del norte", example: "La damiana se toma en té para relajarse", region: "Norte", category: "Plantas" },
  { word: "Gobernadora", meaning: "Arbusto medicinal del desierto", example: "La gobernadora crece en el desierto de Chihuahua", region: "Norte", category: "Plantas" },
  { word: "Zapote negro", meaning: "Fruto oscuro que sabe a chocolate", example: "El zapote negro sabe a chocolate sin azúcar", region: "Sur", category: "Plantas" },
  { word: "Sotol", meaning: "Planta del desierto que produce bebida", example: "El sotol de Chihuahua es la bebida regional", region: "Chihuahua", category: "Plantas" },

  // ── Tradiciones ──
  { word: "Xantolo potosino", meaning: "Versión huasteca del Día de Muertos", example: "El Xantolo potosino tiene danzas especiales", region: "San Luis Potosí", category: "Tradiciones" },
  { word: "Convite", meaning: "Desfile festivo que anuncia una fiesta", example: "El convite recorrió las calles con música y mojigangas", region: "Oaxaca", category: "Tradiciones" },
  { word: "Mayordomía", meaning: "Sistema de organización de fiestas comunitarias", example: "La mayordomía corre con todos los gastos de la fiesta", region: "Oaxaca", category: "Tradiciones" },
  { word: "Danza del Venado", meaning: "Danza yaqui que imita al venado sagrado", example: "La Danza del Venado honra al animal sagrado yaqui", region: "Sonora", category: "Tradiciones" },
  { word: "Calenda oaxaqueña", meaning: "Desfile nocturno con mojigangas y música", example: "La calenda oaxaqueña iluminó las calles del centro", region: "Oaxaca", category: "Tradiciones" },

  // ── Modismos ──
  { word: "Pistear", meaning: "Tomar bebidas alcohólicas en grupo", example: "Vamos a pistear esta noche con los cuates", region: "Juvenil", category: "Modismos" },
  { word: "Peda", meaning: "Reunión o fiesta con alcohol", example: "La peda de anoche estuvo cañón", region: "Juvenil", category: "Modismos" },
  { word: "Estar cañón", meaning: "Algo muy difícil o muy intenso", example: "Ese examen estuvo bien cañón", region: "Todo México", category: "Modismos" },
  { word: "Chingón", meaning: "Alguien muy bueno en lo que hace", example: "Ese mecánico está bien chingón", region: "Todo México", category: "Modismos" },
  { word: "Chafa", meaning: "Algo de mala calidad", example: "Me vendieron un celular bien chafa", region: "Todo México", category: "Modismos" },

  // ════════════════════════════════════════════════════════════
  // BLOQUE 6
  // ════════════════════════════════════════════════════════════

  // ── Comida ──
  { word: "Jamaica", meaning: "Agua fresca de flor de jamaica", example: "El agua de jamaica está riquísima con hielo", region: "Todo México", category: "Comida" },
  { word: "Horchata", meaning: "Agua fresca de arroz con canela", example: "La horchata bien fría quita el calor", region: "Nacional", category: "Comida" },
  { word: "Pulque", meaning: "Bebida fermentada del maguey", example: "En la pulquería tomamos curado de fresa", region: "Hidalgo", category: "Comida" },
  { word: "Mezcal", meaning: "Destilado de agave ahumado", example: "El mezcal de Oaxaca tiene un sabor único", region: "Oaxaca", category: "Comida" },
  { word: "Michelada", meaning: "Cerveza con limón, sal y salsas", example: "La michelada con clamato es perfecta en el calor", region: "Todo México", category: "Comida" },

  // ── Juegos ──
  { word: "Tezos", meaning: "Discos de plástico coleccionables de los 90", example: "Los tezos era el juego de moda en la primaria", region: "Infantil", category: "Juegos" },
  { word: "Juego de naipes", meaning: "Cartas para juegos de mesa tradicionales", example: "Jugamos naipes hasta la madrugada", region: "Todo México", category: "Juegos" },
  { word: "Feria de la escuela", meaning: "Evento escolar de diversión y venta", example: "La feria de la escuela tiene juegos y comida", region: "Escuela", category: "Juegos" },
  { word: "Juego de talla", meaning: "Juego de apuestas con monedas en ferias", example: "Jugamos talla en la feria del pueblo", region: "Norte", category: "Juegos" },
  { word: "Ajedrez azteca", meaning: "Ajedrez con piezas de figuras precolombinas", example: "Compramos un ajedrez azteca de obsidiana", region: "CDMX", category: "Juegos" },

  // ── Música ──
  { word: "Son de Veracruz", meaning: "Género musical de la costa veracruzana", example: "El son de Veracruz se baila en fandangos", region: "Veracruz", category: "Música" },
  { word: "Versada", meaning: "Improvisación de versos en la música jarocha", example: "La versada del poeta jarocho duró media hora", region: "Veracruz", category: "Música" },
  { word: "Dueto huasteco", meaning: "Formato musical de voz y violín", example: "El dueto huasteco tocó en la huasteca potosina", region: "Huasteca", category: "Música" },
  { word: "Marimba chiapaneca", meaning: "Marimba grande orquesta de Chiapas", example: "La marimba chiapaneca suena en bodas y fiestas", region: "Chiapas", category: "Música" },
  { word: "Música de tarima", meaning: "Música para bailar sobre plataforma de madera", example: "La música de tarima viene de la Costa Chica", region: "Guerrero", category: "Música" },

  // ── Animales ──
  { word: "Puma", meaning: "Felino grande de montaña mexicana", example: "El puma vive en la Sierra Madre", region: "Norte", category: "Animales" },
  { word: "Escarabajo de cuerno", meaning: "Escarabajo grande con cuernos imponentes", example: "El escarabajo de cuerno es el más grande de México", region: "Sur", category: "Animales" },
  { word: "Tarántula mexicana", meaning: "Araña grande y peluda", example: "La tarántula mexicana asusta pero es mansa", region: "Norte", category: "Animales" },
  { word: "Flamenco americano", meaning: "Ave rosada de aguas salinas", example: "Los flamencos americanos tiñen de rosa la laguna", region: "Yucatán", category: "Animales" },
  { word: "Cóndor californiano", meaning: "Ave carroñera en peligro crítico", example: "El cóndor californiano sobrevive en Baja California", region: "Baja California", category: "Animales" },

  // ── Historia ──
  { word: "Quetzalcóatl", meaning: "Dios serpiente emplumada mexica", example: "Quetzalcóatl era el dios del viento y el conocimiento", region: "CDMX", category: "Historia" },
  { word: "Tlaloc", meaning: "Dios mexica de la lluvia", example: "Tlaloc pedía ofrendas para que lloviera", region: "CDMX", category: "Historia" },
  { word: "Coatlicue", meaning: "Diosa mexica de la tierra y la muerte", example: "La escultura de Coatlicue está en el Museo de Antropología", region: "CDMX", category: "Historia" },
  { word: "Piedra del Sol", meaning: "Monolito mexica con el calendario", example: "La Piedra del Sol está en el Museo de Antropología", region: "CDMX", category: "Historia" },
  { word: "Moctezuma II", meaning: "Noveno tlatoani de Tenochtitlan", example: "Moctezuma II gobernaba cuando llegó Cortés", region: "CDMX", category: "Historia" },

  // ── Artistas ──
  { word: "Francisco Toledo", meaning: "Artista plástico oaxaqueño", example: "Francisco Toledo defendió la cultura de Oaxaca", region: "Oaxaca", category: "Artistas" },
  { word: "Gabriel Orozco", meaning: "Artista conceptual mexicano", example: "Gabriel Orozco expuso en museos de todo el mundo", region: "CDMX", category: "Artistas" },
  { word: "Damián Ortega", meaning: "Artista plástico contemporáneo", example: "Damián Ortega desarmó un Vocho para una instalación", region: "CDMX", category: "Artistas" },
  { word: "Pedro Coronel", meaning: "Pintor abstracto de Zacatecas", example: "Pedro Coronel creó obras de gran colorido", region: "Zacatecas", category: "Artistas" },
  { word: "Ignacio López Tarso", meaning: "Actor emblemático del cine y teatro", example: "Ignacio López Tarso fue un gigante del teatro nacional", region: "CDMX", category: "Artistas" },

  // ── Monumentos ──
  { word: "Kohunlich", meaning: "Zona maya con máscaras del dios solar", example: "Las máscaras de Kohunlich son únicas en Mesoamérica", region: "Quintana Roo", category: "Monumentos" },
  { word: "Acueducto de Querétaro", meaning: "Acueducto colonial de 74 arcos", example: "El acueducto de Querétaro tiene 74 arcos", region: "Querétaro", category: "Monumentos" },
  { word: "Fuerte de San Juan de Ulúa", meaning: "Fortaleza colonial en Veracruz", example: "El Fuerte de San Juan de Ulúa controló el puerto", region: "Veracruz", category: "Monumentos" },
  { word: "Biblioteca Palafoxiana", meaning: "Primera biblioteca pública de América", example: "La Biblioteca Palafoxiana tiene libros del siglo XVI", region: "Puebla", category: "Monumentos" },
  { word: "Parroquia de San Miguel de Allende", meaning: "Iglesia neogótica del Bajío", example: "La Parroquia de San Miguel es la más fotografiada de México", region: "Guanajuato", category: "Monumentos" },

  // ── Plantas ──
  { word: "Lechuguilla", meaning: "Planta de fibra del desierto", example: "La lechuguilla se usa para hacer fibras y artesanías", region: "Norte", category: "Plantas" },
  { word: "Maguey espadín", meaning: "Agave base del mezcal", example: "El maguey espadín da el mezcal más común de Oaxaca", region: "Oaxaca", category: "Plantas" },
  { word: "Maguey tequilero", meaning: "Agave azul para el tequila", example: "El maguey tequilero tarda 7 años en madurar", region: "Jalisco", category: "Plantas" },
  { word: "Cedro rojo", meaning: "Árbol maderable de selvas tropicales", example: "El cedro rojo es muy valorado por su madera fina", region: "Sur", category: "Plantas" },
  { word: "Pochote", meaning: "Árbol con espinas en el tronco", example: "El pochote tiene flores grandes y vistosas", region: "Guerrero", category: "Plantas" },

  // ── Tradiciones ──
  { word: "Noche de Muertos en Pátzcuaro", meaning: "Vigilia en las islas del lago de Pátzcuaro", example: "La Noche de Muertos en Pátzcuaro es muy emotiva", region: "Michoacán", category: "Tradiciones" },
  { word: "Feria patronal", meaning: "Celebración anual del santo patrón del pueblo", example: "La feria patronal duró toda la semana con juegos", region: "Todo México", category: "Tradiciones" },
  { word: "Danza de los Viejitos", meaning: "Danza purépecha que imita a los ancianos", example: "La Danza de los Viejitos se baila en Michoacán", region: "Michoacán", category: "Tradiciones" },
  { word: "Concheros", meaning: "Danzantes que honran tradiciones aztecas", example: "Los concheros danzan en el Zócalo cada domingo", region: "CDMX", category: "Tradiciones" },
  { word: "Lazo y arras", meaning: "Ritual simbólico de boda mexicana", example: "El lazo y arras unen a los novios para siempre", region: "Nacional", category: "Tradiciones" },

  // ── Modismos ──
  { word: "Carnal", meaning: "Hermano o amigo muy cercano", example: "Ese es mi carnal de toda la vida", region: "Todo México", category: "Modismos" },
  { word: "Mano", meaning: "Forma corta de hermano, para un amigo", example: "Órale mano, ¿qué pasó?", region: "Todo México", category: "Modismos" },
  { word: "Qué oso", meaning: "Situación muy vergonzosa", example: "Qué oso me hice cuando me caí en la escalera", region: "Juvenil", category: "Modismos" },
  { word: "Cotorreo", meaning: "Plática divertida entre amigos", example: "El cotorreo con los cuates duró horas", region: "Juvenil", category: "Modismos" },
  { word: "Hacerse el occiso", meaning: "Fingir que no se sabe de algo", example: "No te hagas el occiso, sé que fuiste tú", region: "Todo México", category: "Modismos" },

  // ════════════════════════════════════════════════════════════
  // BLOQUE 7
  // ════════════════════════════════════════════════════════════

  // ── Comida ──
  { word: "Mangonada", meaning: "Smoothie de mango con chamoy y chile", example: "La mangonada de la esquina estaba buenísima", region: "CDMX", category: "Comida" },
  { word: "Nieves de garrafa", meaning: "Helado artesanal de garrafa", example: "Las nieves de garrafa de Oaxaca son las mejores", region: "Oaxaca", category: "Comida" },
  { word: "Capirotada", meaning: "Postre de cuaresma con pan y piloncillo", example: "En Semana Santa preparamos capirotada con nuez", region: "Nacional", category: "Comida" },
  { word: "Discada norteña", meaning: "Guisado de carnes variadas en disco de arado", example: "La discada norteña se prepara en el campo", region: "Norte", category: "Comida" },
  { word: "Salsa verde", meaning: "Salsa de tomatillo con chile y cilantro", example: "La salsa verde de la abuela es la mejor", region: "Todo México", category: "Comida" },

  // ── Juegos ──
  { word: "Avioncito de papel", meaning: "Avión doblado en papel para lanzar", example: "Hicimos avioncitos de papel en la clase", region: "Escuela", category: "Juegos" },
  { word: "Futbolito", meaning: "Juego de mesa de fútbol con palitos", example: "Jugamos futbolito toda la tarde en el café", region: "Todo México", category: "Juegos" },
  { word: "Rompecabezas", meaning: "Juego de piezas para armar imágenes", example: "Armamos un rompecabezas de 1000 piezas", region: "Familiar", category: "Juegos" },
  { word: "El teléfono descompuesto", meaning: "Juego de pasar mensajes al oído", example: "El teléfono descompuesto terminó en puro sinsentido", region: "Infantil", category: "Juegos" },

  // ── Música ──
  { word: "Noche de ronda", meaning: "Bolero famoso de Agustín Lara", example: "Cantamos Noche de ronda en la serenata", region: "Nacional", category: "Música" },
  { word: "Sabor a mí", meaning: "Bolero romántico muy popular", example: "Sabor a mí sonó en la cena romántica", region: "Nacional", category: "Música" },
  { word: "Flauta de barro", meaning: "Instrumento cerámico prehispánico", example: "La flauta de barro tiene un sonido muy suave", region: "Oaxaca", category: "Música" },
  { word: "Chicahuaztli", meaning: "Sonaja ritual prehispánica", example: "El chicahuaztli acompañaba las danzas sagradas", region: "CDMX", category: "Música" },
  { word: "Pito de barro", meaning: "Silbato de barro en forma de animal", example: "El pito de barro es juguete e instrumento al mismo tiempo", region: "Oaxaca", category: "Música" },

  // ── Animales ──
  { word: "Tejón mexicano", meaning: "Mamífero con rayas en la cara", example: "El tejón mexicano hurgó en la basura del campamento", region: "Norte", category: "Animales" },
  { word: "Hormiga chicatana", meaning: "Hormiga reina comestible de temporada", example: "Las hormigas chicatanas se comen tostadas con sal", region: "Oaxaca", category: "Animales" },
  { word: "Mosco pinto", meaning: "Mosquito transmisor del dengue", example: "El mosco pinto se reproduce en agua estancada", region: "Nacional", category: "Animales" },
  { word: "Lechuza", meaning: "Búho de cara plana y ojos grandes", example: "La lechuza ululó toda la noche en el árbol", region: "Todo México", category: "Animales" },
  { word: "Cuervo", meaning: "Córvido negro de gran inteligencia", example: "El cuervo robó el taco de la mesa", region: "Norte", category: "Animales" },

  // ── Historia ──
  { word: "Tlatelolco", meaning: "Plaza de las Tres Culturas en CDMX", example: "En Tlatelolco conviven ruinas aztecas e iglesia colonial", region: "CDMX", category: "Historia" },
  { word: "Movimiento estudiantil del 68", meaning: "Protesta estudiantil reprimida en Tlatelolco", example: "El Movimiento estudiantil del 68 marcó la historia de México", region: "CDMX", category: "Historia" },
  { word: "EZLN 1994", meaning: "Levantamiento zapatista de Chiapas", example: "El EZLN 1994 tomó San Cristóbal de las Casas", region: "Chiapas", category: "Historia" },
  { word: "Subcomandante Marcos", meaning: "Portavoz del EZLN chiapaneco", example: "El Subcomandante Marcos habló en nombre de los indígenas", region: "Chiapas", category: "Historia" },
  { word: "Adelitas", meaning: "Mujeres soldado de la Revolución Mexicana", example: "Las Adelitas lucharon junto a los hombres en la Revolución", region: "Nacional", category: "Historia" },

  // ── Artistas ──
  { word: "Katy Jurado", meaning: "Actriz nominada al Oscar de Hollywood", example: "Katy Jurado fue la primera latinoamericana en ganar un Globo de Oro", region: "Jalisco", category: "Artistas" },
  { word: "Ernesto Alonso", meaning: "Actor y productor de telenovelas", example: "Ernesto Alonso fue el señor de las telenovelas mexicanas", region: "CDMX", category: "Artistas" },
  { word: "Jorge Ibargüengoitia", meaning: "Escritor satírico mexicano", example: "Ibargüengoitia se burló de la historia con gran humor", region: "Guanajuato", category: "Artistas" },
  { word: "Sergio Pitol", meaning: "Premio Cervantes mexicano", example: "Sergio Pitol fue el mayor diplomático de las letras mexicanas", region: "Veracruz", category: "Artistas" },
  { word: "Gunther Gerzso", meaning: "Pintor abstracto surrealista", example: "Gunther Gerzso creó un lenguaje pictórico único", region: "CDMX", category: "Artistas" },

  // ── Monumentos ──
  { word: "Casa de los Azulejos", meaning: "Palacio cubierto de azulejos talavera en CDMX", example: "La Casa de los Azulejos es un ícono del centro histórico", region: "CDMX", category: "Monumentos" },
  { word: "Palacio de Cortés", meaning: "Museo de Cuernavaca con murales de Rivera", example: "El Palacio de Cortés tiene murales de Diego Rivera", region: "Morelos", category: "Monumentos" },
  { word: "Museo Frida Kahlo", meaning: "Casa azul de Frida en Coyoacán", example: "El Museo Frida Kahlo está en la casa donde nació", region: "CDMX", category: "Monumentos" },
  { word: "Cerro de la Estrella", meaning: "Colina con zona arqueológica en Iztapalapa", example: "El Cerro de la Estrella fue sede del Fuego Nuevo mexica", region: "CDMX", category: "Monumentos" },
  { word: "Zona Lacustre de Xochimilco", meaning: "Canales y chinampas de CDMX", example: "La Zona Lacustre de Xochimilco es Patrimonio UNESCO", region: "CDMX", category: "Monumentos" },

  // ── Plantas ──
  { word: "Verdolaga", meaning: "Planta comestible silvestre", example: "La verdolaga con puerco es un platillo tradicional", region: "Todo México", category: "Plantas" },
  { word: "Quelite", meaning: "Hierbas silvestres comestibles", example: "Los quelites se guisan con frijoles negros", region: "Oaxaca", category: "Plantas" },
  { word: "Quintonil", meaning: "Quelite comestible rico en hierro", example: "El quintonil en quesillo es un taco de lujo", region: "Oaxaca", category: "Plantas" },
  { word: "Tepozán", meaning: "Arbusto medicinal de montaña", example: "El tepozán se usa para aliviar los bronquios", region: "Centro", category: "Plantas" },
  { word: "Caoba mexicana", meaning: "Árbol maderable de selva tropical", example: "La caoba mexicana es muy valorada en ebanistería", region: "Sur", category: "Plantas" },

  // ── Tradiciones ──
  { word: "Danza de la Pluma", meaning: "Danza zapoteca de conquista", example: "La Danza de la Pluma se presenta en la Guelaguetza", region: "Oaxaca", category: "Tradiciones" },
  { word: "Mojigangas", meaning: "Figuras gigantes de cartonería animadas", example: "Las mojigangas bailan en las fiestas oaxaqueñas", region: "Oaxaca", category: "Tradiciones" },
  { word: "Alebrije procesional", meaning: "Figura de cartonería gigante en desfile", example: "El alebrije procesional recorrió el Zócalo de noche", region: "CDMX", category: "Tradiciones" },
  { word: "Carnaval de Mazatlán", meaning: "Carnaval sinaloense con reyes y comparsas", example: "El Carnaval de Mazatlán dura una semana entera", region: "Sinaloa", category: "Tradiciones" },
  { word: "Feria Nacional de San Marcos", meaning: "Feria más importante de México", example: "La Feria de San Marcos llena Aguascalientes cada año", region: "Aguascalientes", category: "Tradiciones" },

  // ── Modismos ──
  { word: "A huevo", meaning: "Afirmación enfática y entusiasta", example: "A huevo que voy a la fiesta", region: "Todo México", category: "Modismos" },
  { word: "Ni modo", meaning: "Resignación ante algo inevitable", example: "Ni modo, ya se fue el camión", region: "Todo México", category: "Modismos" },
  { word: "Echar la hueva", meaning: "No hacer nada, holgazanear", example: "Me quedé echando la hueva todo el sábado", region: "Juvenil", category: "Modismos" },
  { word: "Tirarse a la bartola", meaning: "Relajarse completamente sin hacer nada", example: "En vacaciones me tiré a la bartola", region: "Todo México", category: "Modismos" },
  { word: "Dar en la torre", meaning: "Arruinar o fastidiar algo", example: "El aguacero le dio en la torre al partido", region: "Todo México", category: "Modismos" },

  // ════════════════════════════════════════════════════════════
  // BLOQUE 8
  // ════════════════════════════════════════════════════════════

  // ── Comida ──
  { word: "Pico de gallo", meaning: "Mezcla de jitomate, cebolla y cilantro fresco", example: "El pico de gallo fresco le va a todo", region: "Todo México", category: "Comida" },
  { word: "Tequila", meaning: "Destilado de agave azul de Jalisco", example: "Nos tomamos unos tequilas en la cantina", region: "Jalisco", category: "Comida" },
  { word: "Tejuino", meaning: "Bebida fermentada de maíz con limón y sal", example: "El tejuino es la bebida más refrescante del calor", region: "Jalisco", category: "Comida" },
  { word: "Longaniza", meaning: "Embutido condimentado diferente al chorizo", example: "La longaniza frita en taco es deliciosa", region: "Oaxaca", category: "Comida" },
  { word: "Papadzul", meaning: "Taco de huevo bañado en salsa de pepita", example: "El papadzul es una joya de la cocina yucateca", region: "Yucatán", category: "Comida" },

  // ── Juegos ──
  { word: "Memorama", meaning: "Juego de voltear pares de tarjetas ilustradas", example: "Jugamos memorama con las figuras de la lotería", region: "Infantil", category: "Juegos" },
  { word: "El cartero", meaning: "Juego de ronda donde el cartero entrega cartas", example: "El cartero trajo carta para todos y salimos corriendo", region: "Infantil", category: "Juegos" },
  { word: "Zancos", meaning: "Juego de caminar sobre zancos de madera", example: "Los niños del circo andaban en zancos", region: "Feria", category: "Juegos" },
  { word: "La cola del diablo", meaning: "Juego de jalar la cola atada en la cintura", example: "Jugamos la cola del diablo en el deportivo", region: "Infantil", category: "Juegos" },
  { word: "Volibol playero", meaning: "Voleibol en la playa o potrero", example: "Jugamos volibol playero en la cancha del deportivo", region: "Nacional", category: "Juegos" },

  // ── Música ──
  { word: "Solamente una vez", meaning: "Bolero de Agustín Lara", example: "Solamente una vez sonó en la radio toda la tarde", region: "Nacional", category: "Música" },
  { word: "Caracol marino", meaning: "Instrumento de viento prehispánico", example: "El caracol marino llamaba a los guerreros mexicas", region: "CDMX", category: "Música" },
  { word: "Guitarra séptima", meaning: "Guitarra de 7 cuerdas del son huasteco", example: "La guitarra séptima sostiene el ritmo del huapango", region: "Huasteca", category: "Música" },
  { word: "Tambor de agua", meaning: "Instrumento percutido en recipiente de agua", example: "El tambor de agua se usa en ceremonias purépechas", region: "Michoacán", category: "Música" },
  { word: "Tecomapache", meaning: "Instrumento de vasija de barro con agua", example: "El tecomapache produce sonidos únicos en Oaxaca", region: "Oaxaca", category: "Música" },

  // ── Animales ──
  { word: "Coralillo", meaning: "Serpiente venenosa de anillos de colores", example: "El coralillo tiene bandas rojas, amarillas y negras", region: "Sur", category: "Animales" },
  { word: "Chachalaca", meaning: "Ave ruidosa de la selva", example: "La chachalaca cacarea al amanecer en la selva", region: "Veracruz", category: "Animales" },
  { word: "Loro cabeza amarilla", meaning: "Loro endémico en peligro de extinción", example: "El loro cabeza amarilla imita voces humanas", region: "Veracruz", category: "Animales" },
  { word: "Nutria de río", meaning: "Mamífero acuático de ríos mexicanos", example: "La nutria de río nada en el río Lacandón", region: "Chiapas", category: "Animales" },
  { word: "Venado cola blanca", meaning: "Venado más común de México", example: "El venado cola blanca es muy ágil en el monte", region: "Norte", category: "Animales" },

  // ── Historia ──
  { word: "Soldaderas", meaning: "Mujeres combatientes en la Revolución", example: "Las soldaderas cargaban armas y cocinaban para las tropas", region: "Nacional", category: "Historia" },
  { word: "Zapatismo", meaning: "Movimiento agrario de Emiliano Zapata", example: "El zapatismo exigía tierras para los campesinos", region: "Morelos", category: "Historia" },
  { word: "Villismo", meaning: "Movimiento armado de Pancho Villa", example: "El villismo fue el ejército más numeroso del norte", region: "Norte", category: "Historia" },
  { word: "Tierra y Libertad", meaning: "Lema del ejército zapatista", example: "Tierra y Libertad era el grito de los zapatistas", region: "Morelos", category: "Historia" },
  { word: "Plan de Ayala", meaning: "Manifiesto agrario de Zapata", example: "El Plan de Ayala exigió la devolución de tierras", region: "Morelos", category: "Historia" },

  // ── Artistas ──
  { word: "Luis Buñuel", meaning: "Cineasta surrealista radicado en México", example: "Luis Buñuel filmó Los Olvidados en México", region: "CDMX", category: "Artistas" },
  { word: "Pedro Armendáriz", meaning: "Actor del Cine de Oro", example: "Pedro Armendáriz fue uno de los galanes más queridos", region: "Chihuahua", category: "Artistas" },
  { word: "Mario Moreno", meaning: "Nombre real de Cantinflas", example: "Mario Moreno fue el cómico más famoso de México", region: "CDMX", category: "Artistas" },
  { word: "Eulalio González Piporro", meaning: "Cómico norteño muy querido", example: "Piporro representó el humor del norte de México", region: "Tamaulipas", category: "Artistas" },
  { word: "Jorge Salinas", meaning: "Actor contemporáneo de telenovelas", example: "Jorge Salinas es de los galanes más populares de México", region: "Nacional", category: "Artistas" },

  // ── Monumentos ──
  { word: "Cacaxtla", meaning: "Zona arqueológica con murales policromos", example: "Cacaxtla tiene murales de batallas bien conservados", region: "Tlaxcala", category: "Monumentos" },
  { word: "Ex Convento de Acolman", meaning: "Convento agustino colonial", example: "El Ex Convento de Acolman es uno de los más antiguos", region: "Estado de México", category: "Monumentos" },
  { word: "Pirámide de Cuicuilco", meaning: "Pirámide circular en el sur de CDMX", example: "La Pirámide de Cuicuilco es la más antigua de CDMX", region: "CDMX", category: "Monumentos" },
  { word: "Acueducto del Padre Tembleque", meaning: "Acueducto del siglo XVI", example: "El Acueducto del Padre Tembleque es Patrimonio UNESCO", region: "Hidalgo", category: "Monumentos" },
  { word: "Capilla del Rosario", meaning: "Joya del barroco novohispano", example: "La Capilla del Rosario en Puebla es de oro puro", region: "Puebla", category: "Monumentos" },

  // ── Plantas ──
  { word: "Guayacán", meaning: "Árbol de flores amarillas del desierto", example: "El guayacán florece en primavera en el norte", region: "Norte", category: "Plantas" },
  { word: "Palo fierro", meaning: "Árbol del desierto muy duro", example: "El palo fierro crece muy lento en el desierto sonorense", region: "Sonora", category: "Plantas" },
  { word: "Maguey cenizo", meaning: "Agave plateado del semiárido", example: "El maguey cenizo produce una bebida artesanal", region: "Centro", category: "Plantas" },
  { word: "Zapote blanco", meaning: "Árbol frutal de sombra fresca", example: "El zapote blanco da sombra y fruta en el jardín", region: "Sur", category: "Plantas" },
  { word: "Chupandilla", meaning: "Fruto silvestre agridulce del Pacífico", example: "La chupandilla tiene un sabor agridulce muy especial", region: "Guerrero", category: "Plantas" },

  // ── Tradiciones ──
  { word: "Novenario", meaning: "Nueve días de rezo tras el fallecimiento", example: "El novenario reunió a toda la familia en el rezo", region: "Nacional", category: "Tradiciones" },
  { word: "Tequio comunitario", meaning: "Trabajo colectivo sin pago en comunidades", example: "El tequio comunitario arregló el camino del pueblo", region: "Oaxaca", category: "Tradiciones" },
  { word: "Papel picado de altar", meaning: "Papel recortado de colores para ofrendas", example: "El papel picado de altar alegra el Día de Muertos", region: "Nacional", category: "Tradiciones" },
  { word: "Calavera literaria", meaning: "Poema satírico sobre la muerte", example: "La calavera literaria del político arrancó carcajadas", region: "Nacional", category: "Tradiciones" },
  { word: "Calaverita", meaning: "Figura de azúcar en forma de cráneo", example: "La calaverita de azúcar tenía mi nombre en la frente", region: "Nacional", category: "Tradiciones" },

  // ── Modismos ──
  { word: "Cábula", meaning: "Broma o persona muy bromista", example: "No seas cábula y toma en serio el trabajo", region: "Todo México", category: "Modismos" },
  { word: "Maicear", meaning: "Sobornar o convencer con dinero", example: "Le maicearon al árbitro para ganar el partido", region: "Juvenil", category: "Modismos" },
  { word: "Aventar el rollo", meaning: "Hablar mucho sin decir nada importante", example: "El político llegó a aventar el rollo de siempre", region: "Todo México", category: "Modismos" },
  { word: "Estar cuete", meaning: "Estar borracho", example: "Mi tío llegó bien cuete a la fiesta", region: "Todo México", category: "Modismos" },
  { word: "Pachanga", meaning: "Fiesta animada y ruidosa", example: "La pachanga duró hasta el amanecer", region: "Todo México", category: "Modismos" },

  // ── BLOQUE 9 ──
  // ── Comida ──
  { word: "Memela", meaning: "Tortilla ovalada de maíz con frijoles", example: "Desayuné una memela con salsa en el mercado", region: "Oaxaca", category: "Comida" },
  { word: "Tetela", meaning: "Empanada triangular de masa con frijoles", example: "Las tetelas de Oaxaca son mi antojo favorito", region: "Oaxaca", category: "Comida" },
  { word: "Salbut", meaning: "Tortilla frita con pavo y vegetales", example: "Pedimos salbutes en el restaurante yucateco", region: "Yucatán", category: "Comida" },
  { word: "Panuchos", meaning: "Tortilla frita rellena de frijol con carne encima", example: "Los panuchos de cochinita son el mejor antojo en Mérida", region: "Yucatán", category: "Comida" },
  { word: "Relleno negro", meaning: "Guiso yucateco oscuro de chiles y carne", example: "El relleno negro es el orgullo de la cocina yucateca", region: "Yucatán", category: "Comida" },
  // ── Juegos ──
  { word: "Las cuatro esquinas", meaning: "Juego infantil de intercambio de lugares", example: "Jugamos las cuatro esquinas en el recreo", region: "Todo México", category: "Juegos" },
  { word: "El lobo", meaning: "Juego de persecución donde uno hace de lobo", example: "Jugamos al lobo en el parque toda la tarde", region: "Todo México", category: "Juegos" },
  { word: "Palo encebado", meaning: "Competencia de escalar poste engrasado", example: "En la feria nadie pudo subir al palo encebado", region: "Todo México", category: "Juegos" },
  { word: "Corrida de cintas", meaning: "Juego ecuestre de ensartar argollas al galope", example: "La corrida de cintas es tradición en las fiestas patronales", region: "Bajío", category: "Juegos" },
  { word: "El lazarillo", meaning: "Juego de guiar a un compañero con los ojos vendados", example: "En clase jugamos al lazarillo para aprender confianza", region: "Todo México", category: "Juegos" },
  // ── Música ──
  { word: "Banda de viento", meaning: "Agrupación musical de metales y percusiones", example: "La banda de viento tocó en la plaza principal", region: "Sinaloa", category: "Música" },
  { word: "Fandango veracruzano", meaning: "Reunión musical con jarana y zapateado", example: "El fandango veracruzano duró toda la noche", region: "Veracruz", category: "Música" },
  { word: "Canción de cuna", meaning: "Melodía suave para arrullar niños", example: "Mi abuela me cantaba una canción de cuna en náhuatl", region: "Todo México", category: "Música" },
  { word: "Décima espinela", meaning: "Forma poética de diez versos usada en son jarocho", example: "El decimero improvisó una décima espinela al momento", region: "Veracruz", category: "Música" },
  { word: "Villancico mexicano", meaning: "Canto navideño con ritmos regionales", example: "El coro cantó villancicos mexicanos en la posada", region: "Todo México", category: "Música" },
  // ── Animales ──
  { word: "Tejón real", meaning: "Mamífero rayado parecido al mapache", example: "Vi un tejón real rebuscando comida en el monte", region: "Norte", category: "Animales" },
  { word: "Codorniz moctezuma", meaning: "Ave pequeña de plumaje con manchas blancas", example: "La codorniz moctezuma es difícil de ver en el bosque", region: "Centro", category: "Animales" },
  { word: "Temazate", meaning: "Venado pequeño de selva tropical", example: "El temazate es el venado más pequeño de México", region: "Sureste", category: "Animales" },
  { word: "Murciélago pescador", meaning: "Murciélago que atrapa peces con garras grandes", example: "El murciélago pescador caza de noche en la laguna", region: "Tabasco", category: "Animales" },
  { word: "Gallina de monte", meaning: "Ave silvestre grande parecida al pavo", example: "Escuchamos a la gallina de monte en la sierra", region: "Oaxaca", category: "Animales" },
  // ── Historia ──
  { word: "Inquisición mexicana", meaning: "Tribunal colonial que perseguía herejías", example: "La Inquisición mexicana operó durante casi tres siglos", region: "Colonial", category: "Historia" },
  { word: "Virreinato de Nueva España", meaning: "Territorio colonial español en América del Norte", example: "El Virreinato de Nueva España fue el más extenso de América", region: "Nacional", category: "Historia" },
  { word: "Tratado de Guadalupe", meaning: "Acuerdo de 1848 que cedió territorio a EE.UU.", example: "El Tratado de Guadalupe cambió el mapa de México para siempre", region: "Nacional", category: "Historia" },
  { word: "Dos de octubre", meaning: "Fecha de la Masacre de Tlatelolco en 1968", example: "Dos de octubre no se olvida, repiten los estudiantes cada año", region: "CDMX", category: "Historia" },
  { word: "Intervención francesa", meaning: "Invasión francesa a México entre 1861 y 1867", example: "La Intervención francesa terminó con la victoria de Juárez", region: "Nacional", category: "Historia" },
  // ── Artistas ──
  { word: "Pita Amor", meaning: "Poetisa y pintora mexicana excéntrica del siglo XX", example: "Pita Amor recitaba sus poemas en los cafés de la Ciudad de México", region: "CDMX", category: "Artistas" },
  { word: "Emilio Fernández", meaning: "Director y actor clave del cine de oro mexicano", example: "Emilio Fernández dirigió películas icónicas del cine de oro", region: "Nacional", category: "Artistas" },
  { word: "Gabriel Figueroa", meaning: "Fotógrafo cinematográfico del cine mexicano de oro", example: "Gabriel Figueroa ganó reconocimiento mundial por su fotografía", region: "CDMX", category: "Artistas" },
  { word: "José Revueltas", meaning: "Escritor y activista marxista del siglo XX", example: "José Revueltas fue encarcelado por su participación en el 68", region: "Durango", category: "Artistas" },
  { word: "Carlos Pellicer", meaning: "Poeta tabasqueño maestro del color y la naturaleza", example: "Carlos Pellicer convirtió el trópico en poesía luminosa", region: "Tabasco", category: "Artistas" },
  // ── Monumentos ──
  { word: "Cantona", meaning: "Zona arqueológica de la mayor ciudad prehispánica de México", example: "Cantona tenía más de 90 mil habitantes en su apogeo", region: "Puebla", category: "Monumentos" },
  { word: "El Pedregal de San Ángel", meaning: "Reserva ecológica sobre lava volcánica en la UNAM", example: "El Pedregal de San Ángel alberga cientos de especies únicas", region: "CDMX", category: "Monumentos" },
  { word: "Monte de las Cruces", meaning: "Sitio histórico de batalla insurgente en 1810", example: "En Monte de las Cruces Hidalgo enfrentó al ejército realista", region: "Estado de México", category: "Monumentos" },
  { word: "Kabah", meaning: "Ciudad maya famosa por su Palacio de los Mascarones", example: "Kabah impresiona por las miles de máscaras del dios Chaac", region: "Yucatán", category: "Monumentos" },
  { word: "Guachimontones", meaning: "Pirámides circulares únicas de la tradición Teuchitlán", example: "Los Guachimontones son únicos en el mundo por su forma circular", region: "Jalisco", category: "Monumentos" },
  // ── Plantas ──
  { word: "Chacah", meaning: "Árbol de corteza rojiza usado en medicina maya", example: "El chacah alivia picaduras de insectos en la selva yucateca", region: "Yucatán", category: "Plantas" },
  { word: "Copal negro", meaning: "Árbol resinoso cuyo incienso se usa en rituales", example: "El copal negro se quema en las ceremonias del Día de Muertos", region: "Oaxaca", category: "Plantas" },
  { word: "Maguey pulquero", meaning: "Agave del que se extrae el pulque", example: "Los tlachiqueros raspaban el maguey pulquero desde el amanecer", region: "Hidalgo", category: "Plantas" },
  { word: "Pirúl", meaning: "Árbol de origen sudamericano con frutos rosados", example: "A la sombra del pirúl descansaban los arrieros", region: "Centro", category: "Plantas" },
  { word: "Árbol de hule", meaning: "Planta tropical que produce látex natural", example: "Los olmecas usaban el árbol de hule para hacer pelotas sagradas", region: "Veracruz", category: "Plantas" },
  // ── Tradiciones ──
  { word: "Alfombra de aserrín", meaning: "Tapete decorativo de colores para procesiones", example: "Hicimos una alfombra de aserrín con flores para Semana Santa", region: "Oaxaca", category: "Tradiciones" },
  { word: "Procesión de silencio", meaning: "Marcha religiosa nocturna sin sonido en Semana Santa", example: "La procesión de silencio recorre las calles sin música ni palabras", region: "San Luis Potosí", category: "Tradiciones" },
  { word: "Padrino de boda", meaning: "Persona que patrocina parte de una ceremonia nupcial", example: "Mi tío fue padrino de boda y pagó el pastel y la música", region: "Todo México", category: "Tradiciones" },
  { word: "Candelaria", meaning: "Fiesta del 2 de febrero con bendición de niños Dios", example: "En la Candelaria llevamos al niño Dios a la iglesia", region: "Todo México", category: "Tradiciones" },
  { word: "Quema de castillo", meaning: "Estructura pirotécnica en forma de torre que se enciende en fiestas", example: "La quema de castillo iluminó toda la plaza del pueblo", region: "Todo México", category: "Tradiciones" },
  // ── Modismos ──
  { word: "Agarrar de bajada", meaning: "Aprovechar a alguien en un momento de debilidad", example: "Me agarraron de bajada cuando estaba cansado y acepté todo", region: "Todo México", category: "Modismos" },
  { word: "Hacer el oso", meaning: "Ponerse en ridículo o hacer el ridículo", example: "Hice el oso cuando se me olvidó la letra del himno", region: "Todo México", category: "Modismos" },
  { word: "Dar el gatazo", meaning: "Impresionar o aparentar más de lo que se es", example: "Con ese traje nuevo sí que dio el gatazo en la reunión", region: "Todo México", category: "Modismos" },
  { word: "Pelos de gato", meaning: "Muy poco, casi nada", example: "Me quedan pelos de gato de dinero hasta la quincena", region: "Todo México", category: "Modismos" },
  { word: "Al ahí se va", meaning: "Con poco cuidado, a medias", example: "Hizo la tarea al ahí se va y reprobó el examen", region: "Todo México", category: "Modismos" },

  // ── BLOQUE 10 ──
  // ── Comida ──
  { word: "Enchiladas potosinas", meaning: "Tortilla rellena de queso y chile ancho frita", example: "Las enchiladas potosinas son el orgullo de San Luis Potosí", region: "San Luis Potosí", category: "Comida" },
  { word: "Mole verde", meaning: "Salsa espesa de chile y hierbas frescas", example: "El mole verde con pollo es el plato favorito de mi mamá", region: "Centro", category: "Comida" },
  { word: "Entomatada", meaning: "Tortilla bañada en salsa de tomate", example: "Desayuné entomatadas con crema y queso fresco", region: "Todo México", category: "Comida" },
  { word: "Enmolada", meaning: "Tortilla enrollada cubierta de mole", example: "Las enmoladas de mole negro son un clásico oaxaqueño", region: "Oaxaca", category: "Comida" },
  { word: "Picada veracruzana", meaning: "Tortilla gruesa con salsa y queso", example: "En el mercado de Veracruz las picadas son el desayuno clásico", region: "Veracruz", category: "Comida" },
  // ── Juegos ──
  { word: "Chapas", meaning: "Juego con tapas de botellas como monedas", example: "Jugábamos chapas en la calle cuando éramos chicos", region: "Todo México", category: "Juegos" },
  { word: "Cinturón escondido", meaning: "Juego donde se esconde una correa y todos buscan", example: "El de en medio ganó el cinturón escondido más rápido", region: "Todo México", category: "Juegos" },
  { word: "Albures", meaning: "Juego de palabras con doble sentido picaresco", example: "Los albures son un arte verbal en México", region: "CDMX", category: "Juegos" },
  { word: "Cascarita", meaning: "Partido informal de futbol en la calle o parque", example: "Echamos una cascarita antes de que oscureciera", region: "Todo México", category: "Juegos" },
  { word: "El cartero", meaning: "Juego infantil donde se entrega una carta imaginaria", example: "Jugamos al cartero en el jardín de niños", region: "Todo México", category: "Juegos" },
  // ── Música ──
  { word: "Son abajeño", meaning: "Estilo musical del centro-occidente mexicano", example: "El son abajeño se toca con guitarra y vihuela", region: "Jalisco", category: "Música" },
  { word: "Tocada norteña", meaning: "Concierto informal de música norteña", example: "La tocada norteña empezó en la tarde y terminó en la madrugada", region: "Norte", category: "Música" },
  { word: "Polca norteña", meaning: "Ritmo bailable de origen europeo adaptado al norte", example: "La polca norteña alegra cualquier fiesta en Chihuahua", region: "Chihuahua", category: "Música" },
  { word: "Son istmeño", meaning: "Música y danza tradicional del Istmo de Tehuantepec", example: "El son istmeño suena en las velas oaxaqueñas", region: "Oaxaca", category: "Música" },
  { word: "Música grupera", meaning: "Género popular mexicano mezcla de varios ritmos", example: "La música grupera suena en todas las fiestas del rancho", region: "Todo México", category: "Música" },
  // ── Animales ──
  { word: "Caimán de pantano", meaning: "Reptil grande de agua dulce del sureste", example: "El caimán de pantano habita en los ríos de Tabasco", region: "Tabasco", category: "Animales" },
  { word: "Tucán pico iris", meaning: "Ave de pico largo y colorido de la selva chiapaneca", example: "El tucán pico iris es el símbolo del bosque nublado de Chiapas", region: "Chiapas", category: "Animales" },
  { word: "Pato real", meaning: "Ánade silvestre de colores brillantes", example: "El pato real anida en los humedales de Veracruz", region: "Veracruz", category: "Animales" },
  { word: "Garza blanca", meaning: "Ave zancuda blanca de ríos y lagunas", example: "La garza blanca se quedó inmóvil al borde del río", region: "Todo México", category: "Animales" },
  { word: "Pelícano blanco", meaning: "Ave costera de gran bolsa gular", example: "Los pelícanos blancos llegan al lago de Texcoco en invierno", region: "Centro", category: "Animales" },
  // ── Historia ──
  { word: "Lázaro Cárdenas", meaning: "Presidente que nacionalizó el petróleo en 1938", example: "Lázaro Cárdenas es recordado por la expropiación petrolera", region: "Nacional", category: "Historia" },
  { word: "Ejército Liberador del Sur", meaning: "Fuerza armada zapatista de Emiliano Zapata", example: "El Ejército Liberador del Sur luchó por la tierra y la libertad", region: "Morelos", category: "Historia" },
  { word: "Guerra Cristera", meaning: "Conflicto armado entre gobierno e Iglesia 1926–1929", example: "La Guerra Cristera dejó miles de muertos en el centro de México", region: "Centro-Occidente", category: "Historia" },
  { word: "Porfirio Díaz", meaning: "Presidente dictador que gobernó treinta años", example: "Porfirio Díaz modernizó México pero suprimió las libertades", region: "Oaxaca", category: "Historia" },
  { word: "Plan de Ayala", meaning: "Manifiesto zapatista contra Madero en 1911", example: "El Plan de Ayala exigía el reparto agrario inmediato", region: "Morelos", category: "Historia" },
  // ── Artistas ──
  { word: "Juan José Arreola", meaning: "Escritor jalisciense maestro del cuento fantástico", example: "Juan José Arreola creó universos únicos en sus cuentos", region: "Jalisco", category: "Artistas" },
  { word: "María Izquierdo", meaning: "Pintora que retrató la vida popular mexicana", example: "María Izquierdo pintó circos, altares y mujeres con fuerza", region: "Jalisco", category: "Artistas" },
  { word: "Dr. Atl", meaning: "Pintor volcánico y precursor del muralismo mexicano", example: "El Dr. Atl pintó los volcanes mexicanos con pasión ardiente", region: "Jalisco", category: "Artistas" },
  { word: "Tina Modotti", meaning: "Fotógrafa y activista que documentó México revolucionario", example: "Tina Modotti capturó la vida obrera con su cámara", region: "CDMX", category: "Artistas" },
  { word: "Roberto Montenegro", meaning: "Muralista pionero del primer mural moderno mexicano", example: "Roberto Montenegro pintó el primer mural del México moderno", region: "Jalisco", category: "Artistas" },
  // ── Monumentos ──
  { word: "Fuerte de Loreto", meaning: "Fortaleza donde se libró la Batalla de Puebla", example: "El Fuerte de Loreto es símbolo de la victoria del 5 de Mayo", region: "Puebla", category: "Monumentos" },
  { word: "Cañón del Sumidero", meaning: "Cañón espectacular del río Grijalva en Chiapas", example: "El Cañón del Sumidero tiene paredes de casi mil metros", region: "Chiapas", category: "Monumentos" },
  { word: "Monasterio de Yanhuitlán", meaning: "Exconvento dominico del siglo XVI en la Mixteca", example: "El Monasterio de Yanhuitlán es una joya del arte colonial", region: "Oaxaca", category: "Monumentos" },
  { word: "Expiatorio de Guadalajara", meaning: "Catedral neogótica tapatía de construcción centenaria", example: "El Expiatorio de Guadalajara tardó más de cien años en construirse", region: "Jalisco", category: "Monumentos" },
  { word: "Palacio de Gobierno de Jalisco", meaning: "Edificio colonial con murales de Orozco", example: "En el Palacio de Gobierno de Jalisco está el mural de Hidalgo", region: "Jalisco", category: "Monumentos" },
  // ── Plantas ──
  { word: "Aguacate", meaning: "Fruto verde con semilla y pulpa cremosa", example: "El aguacate mexicano es el más exportado del mundo", region: "Michoacán", category: "Plantas" },
  { word: "Cacao", meaning: "Árbol tropical cuyo fruto produce el chocolate", example: "El cacao era considerado alimento de los dioses por los mayas", region: "Tabasco", category: "Plantas" },
  { word: "Vainilla", meaning: "Orquídea trepadora de fruto aromático", example: "La vainilla mexicana es la más fina del mundo", region: "Veracruz", category: "Plantas" },
  { word: "Chile habanero", meaning: "Chile pequeño y muy picante del sureste mexicano", example: "El chile habanero es el más picante que existe en México", region: "Yucatán", category: "Plantas" },
  { word: "Epazote", meaning: "Hierba aromática usada en frijoles y tamales", example: "Los frijoles sin epazote no saben igual", region: "Todo México", category: "Plantas" },
  // ── Tradiciones ──
  { word: "Vals de quinceañera", meaning: "Baile formal con el que inicia la fiesta de quince años", example: "El vals de quinceañera la bailó con su papá entre aplausos", region: "Todo México", category: "Tradiciones" },
  { word: "Cohetes de feria", meaning: "Pirotecnia que acompaña fiestas patronales", example: "Los cohetes de feria retumbaron en todo el pueblo", region: "Todo México", category: "Tradiciones" },
  { word: "Noche de Rábanos", meaning: "Concurso navideño de esculturas de rábano en Oaxaca", example: "La Noche de Rábanos reúne a artistas y turistas cada diciembre", region: "Oaxaca", category: "Tradiciones" },
  { word: "Bendición de animales", meaning: "Ritual del 17 de enero en que las mascotas van a la iglesia", example: "Llevamos al perro a la bendición de animales el día de San Antón", region: "Todo México", category: "Tradiciones" },
  { word: "Día de San Juan", meaning: "Fiesta del 24 de junio con baños rituales en ríos", example: "En el Día de San Juan la gente se baña en el río para purificarse", region: "Todo México", category: "Tradiciones" },
  // ── Modismos ──
  { word: "Echarse un taco de ojo", meaning: "Mirar algo o a alguien con mucho gusto", example: "Se echó un taco de ojo con el pastel antes de cortarlo", region: "Todo México", category: "Modismos" },
  { word: "Huevón", meaning: "Persona muy floja que no quiere trabajar", example: "No seas huevón y ayúdame a cargar las cajas", region: "Todo México", category: "Modismos" },
  { word: "Chingona", meaning: "Mujer capaz, fuerte y sin miedo", example: "Mi jefa es una chingona, sacó el negocio adelante sola", region: "Todo México", category: "Modismos" },
  { word: "Chantear", meaning: "Presionar o manipular con chantaje emocional", example: "No me chantees con que lloras si no te doy el dinero", region: "Todo México", category: "Modismos" },
  { word: "Dar el rol", meaning: "Salir a pasear sin rumbo fijo", example: "Le damos el rol por el centro o qué", region: "CDMX", category: "Modismos" },

  // ── BLOQUE 11 ──
  // ── Comida ──
  { word: "Tostada de tinga", meaning: "Tortilla frita con tinga de pollo encima", example: "Las tostadas de tinga del mercado son las mejores", region: "CDMX", category: "Comida" },
  { word: "Flautas de pollo", meaning: "Tacos enrollados y fritos rellenos de pollo", example: "Las flautas de pollo con guacamole son el mejor antojo", region: "Todo México", category: "Comida" },
  { word: "Gordita de chicharrón", meaning: "Masa gruesa rellena de chicharrón prensado", example: "Compré gorditas de chicharrón en el mercado del barrio", region: "Norte", category: "Comida" },
  { word: "Chalupa poblana", meaning: "Tortilla pequeña con pollo, salsa y cebolla", example: "Las chalupas poblanas se venden frente a la catedral", region: "Puebla", category: "Comida" },
  { word: "Sopa de lima", meaning: "Caldo yucateco con lima y pollo desmenuzado", example: "La sopa de lima me curó el resfriado en Mérida", region: "Yucatán", category: "Comida" },
  // ── Juegos ──
  { word: "Trompo", meaning: "Juguete cónico de madera que gira con un cordel", example: "Saqué el trompo sin que tocara el suelo", region: "Todo México", category: "Juegos" },
  { word: "Pirinola", meaning: "Trompo pequeño de seis caras para apostar fichas", example: "Jugamos pirinola hasta que se acabaron las fichas", region: "Todo México", category: "Juegos" },
  { word: "Balero", meaning: "Juguete de palo y bola unidos por un hilo", example: "Me tardé una hora en ensartar el balero diez veces", region: "Todo México", category: "Juegos" },
  { word: "Avioncito", meaning: "Figura de papel doblado que se lanza a volar", example: "Hicimos un avioncito de papel en clase de matemáticas", region: "Todo México", category: "Juegos" },
  { word: "Serpientes y escaleras", meaning: "Juego de tablero con fichas, retos y premios", example: "Perdí en serpientes y escaleras por caer siempre en la serpiente grande", region: "Todo México", category: "Juegos" },
  // ── Música ──
  { word: "Corrido norteño", meaning: "Narración cantada de hazañas o aventuras del norte", example: "El corrido norteño cuenta la historia del pueblo con orgullo", region: "Chihuahua", category: "Música" },
  { word: "Canto cardenche", meaning: "Canto a capella del desierto duranguense", example: "El canto cardenche es patrimonio del desierto mexicano", region: "Durango", category: "Música" },
  { word: "Chilena guerrerense", meaning: "Danza y música de Guerrero con raíces sudamericanas", example: "La chilena guerrerense se baila en la Costa Chica", region: "Guerrero", category: "Música" },
  { word: "Huapango arribeño", meaning: "Son poético de duelo entre trovadores", example: "El huapango arribeño es un desafío de ingenio entre poetas", region: "San Luis Potosí", category: "Música" },
  { word: "Música tropical mexicana", meaning: "Ritmos caribeños adaptados al gusto mexicano", example: "La música tropical mexicana suena en todas las costas", region: "Veracruz", category: "Música" },
  // ── Animales ──
  { word: "Axolote", meaning: "Anfibio acuático endémico del lago de Xochimilco", example: "El axolote puede regenerar sus extremidades", region: "CDMX", category: "Animales" },
  { word: "Mono araña", meaning: "Primate de cola prensil y extremidades largas", example: "El mono araña se balancea entre los árboles de la selva", region: "Chiapas", category: "Animales" },
  { word: "Tortuga laúd", meaning: "La tortuga marina más grande del mundo", example: "La tortuga laúd desova en las playas de Michoacán", region: "Michoacán", category: "Animales" },
  { word: "Pez vela", meaning: "Pez de aleta dorsal en forma de vela", example: "El pez vela es el más rápido del océano Pacífico", region: "Pacífico", category: "Animales" },
  { word: "Perrito de las praderas", meaning: "Roedor social que vive en colonias subterráneas", example: "El perrito de las praderas abunda en las llanuras del norte", region: "Norte", category: "Animales" },
  // ── Historia ──
  { word: "Constitución de 1824", meaning: "Primera carta magna del México independiente", example: "La Constitución de 1824 estableció la república federal", region: "Nacional", category: "Historia" },
  { word: "Reforma agraria", meaning: "Reparto de tierras a campesinos sin propiedad", example: "La reforma agraria de Cárdenas transformó el campo mexicano", region: "Nacional", category: "Historia" },
  { word: "Plan de Iguala", meaning: "Acuerdo de independencia de 1821 entre Iturbide e insurgentes", example: "El Plan de Iguala unió a realistas e insurgentes para la independencia", region: "Nacional", category: "Historia" },
  { word: "Batalla de Celaya", meaning: "Victoria de Obregón sobre Villa en 1915", example: "La Batalla de Celaya definió el rumbo de la Revolución", region: "Guanajuato", category: "Historia" },
  { word: "Grito de Dolores", meaning: "Llamado a la insurrección del padre Hidalgo en 1810", example: "El Grito de Dolores inició la guerra de Independencia", region: "Guanajuato", category: "Historia" },
  // ── Artistas ──
  { word: "Nahui Ollin", meaning: "Pintora y poetisa de la vanguardia mexicana", example: "Nahui Ollin escandalizó y fascinó a la Ciudad de México", region: "CDMX", category: "Artistas" },
  { word: "Agustín Lara", meaning: "Compositor de boleros románticos del siglo XX", example: "Agustín Lara le cantó a Veracruz y al amor con igual pasión", region: "Veracruz", category: "Artistas" },
  { word: "Dolores del Río", meaning: "Actriz de Hollywood y cine de oro mexicano", example: "Dolores del Río fue la primera latina en triunfar en Hollywood", region: "Durango", category: "Artistas" },
  { word: "Xavier Villaurrutia", meaning: "Poeta y dramaturgo del grupo Contemporáneos", example: "Xavier Villaurrutia exploró la muerte y el sueño en su poesía", region: "CDMX", category: "Artistas" },
  { word: "Jorge Negrete", meaning: "Cantante y actor símbolo del charro mexicano", example: "Jorge Negrete cantaba México lindo y querido con el alma", region: "Guanajuato", category: "Artistas" },
  // ── Monumentos ──
  { word: "Acueducto de Morelia", meaning: "Estructura de 253 arcos que abastecía agua a la ciudad", example: "El Acueducto de Morelia tiene más de doscientos cincuenta arcos", region: "Michoacán", category: "Monumentos" },
  { word: "Capilla del Rosario", meaning: "Joya del barroco novohispano en Santo Domingo Puebla", example: "La Capilla del Rosario es llamada la octava maravilla del mundo", region: "Puebla", category: "Monumentos" },
  { word: "Pirámide de Cholula", meaning: "La pirámide más grande del mundo por volumen", example: "La Pirámide de Cholula tiene una iglesia encima construida por los españoles", region: "Puebla", category: "Monumentos" },
  { word: "Ex Convento de Actopan", meaning: "Convento agustino del siglo XVI en el Mezquital", example: "El Ex Convento de Actopan es uno de los mejor conservados de México", region: "Hidalgo", category: "Monumentos" },
  { word: "Zona Arqueológica de Mitla", meaning: "Ciudad zapoteca famosa por sus mosaicos de piedra", example: "Mitla era el centro religioso más importante de los zapotecos", region: "Oaxaca", category: "Monumentos" },
  // ── Plantas ──
  { word: "Colorín", meaning: "Árbol de flores rojas cuyos pétalos se comen en salsa", example: "Los colorines en salsa verde son un manjar del Altiplano", region: "Centro", category: "Plantas" },
  { word: "Nopal tunero", meaning: "Cactácea que produce la tuna roja y amarilla", example: "El nopal tunero cubre los cerros del centro de México", region: "Centro", category: "Plantas" },
  { word: "Palma de coco", meaning: "Árbol tropical de fruto refrescante", example: "La palma de coco adorna todas las playas mexicanas", region: "Costas", category: "Plantas" },
  { word: "Cirián", meaning: "Árbol tropical cuyo fruto sirve para hacer artesanías", example: "El cirián crece en las selvas del Pacífico mexicano", region: "Guerrero", category: "Plantas" },
  { word: "Huizache", meaning: "Arbusto espinoso de flores amarillas aromáticas", example: "El huizache florece en primavera y perfuma los campos", region: "Norte", category: "Plantas" },
  // ── Tradiciones ──
  { word: "Manda", meaning: "Promesa religiosa que implica sacrificio o peregrinación", example: "Cumplió su manda caminando de rodillas hasta la basílica", region: "Todo México", category: "Tradiciones" },
  { word: "Pedida de mano", meaning: "Ceremonia en que el novio pide formalmente al padre", example: "La pedida de mano se hizo con mariachi y toda la familia", region: "Todo México", category: "Tradiciones" },
  { word: "Cruz de mayo", meaning: "Celebración del 3 de mayo con altar floral a la cruz", example: "Adornamos la cruz de mayo con flores de temporada", region: "Centro", category: "Tradiciones" },
  { word: "Rosca de Reyes", meaning: "Pan en forma de corona que se parte el 6 de enero", example: "Quien saque al niño en la rosca de Reyes paga el tamale", region: "Todo México", category: "Tradiciones" },
  { word: "Velación", meaning: "Vigilia nocturna junto al cuerpo de un difunto", example: "La velación duró toda la noche con rezos y café", region: "Todo México", category: "Tradiciones" },
  // ── Modismos ──
  { word: "Echarle ganas", meaning: "Esforzarse con entusiasmo en algo", example: "Échenle ganas al examen y seguro lo pasan", region: "Todo México", category: "Modismos" },
  { word: "Sacar el cobre", meaning: "Revelar el verdadero carácter negativo de alguien", example: "Cuando se enojó sacó el cobre y todos se quedaron fríos", region: "Todo México", category: "Modismos" },
  { word: "Andar de lambiscón", meaning: "Adular exageradamente para conseguir algo", example: "Andaba de lambiscón con el jefe para que le dieran vacaciones", region: "Todo México", category: "Modismos" },
  { word: "Ponerse trucha", meaning: "Estar alerta o listo para reaccionar", example: "Ponte trucha porque llega la supervisión", region: "Todo México", category: "Modismos" },
  { word: "No hay bronca", meaning: "No hay problema, todo está bien", example: "No hay bronca, yo te ayudo con eso sin falta", region: "Todo México", category: "Modismos" },

  // ── BLOQUE 12 ──
  // ── Comida ──
  { word: "Caldo tlalpeño", meaning: "Sopa con pollo, garbanzo y chipotle", example: "El caldo tlalpeño es el favorito en los mercados de la CDMX", region: "CDMX", category: "Comida" },
  { word: "Mixiote", meaning: "Carne cocida al vapor en piel de maguey", example: "El mixiote de borrego del Valle del Mezquital no tiene igual", region: "Hidalgo", category: "Comida" },
  { word: "Huarache de nopal", meaning: "Tortilla larga con cactácea, frijol y salsa", example: "El huarache de nopal es el desayuno estrella de los mercados capitalinos", region: "CDMX", category: "Comida" },
  { word: "Tamal oaxaqueño", meaning: "Tamal envuelto en hoja de plátano con mole negro", example: "El tamal oaxaqueño en hoja de plátano tiene un sabor inigualable", region: "Oaxaca", category: "Comida" },
  { word: "Birria de chivo", meaning: "Estofado picante de chivo cocido en adobo", example: "La birria de chivo es el platillo que no puede faltar en las fiestas jaliscienses", region: "Jalisco", category: "Comida" },
  // ── Juegos ──
  { word: "Yoyo", meaning: "Juguete de disco doble que sube y baja por un hilo", example: "Mi primo hacía trucos increíbles con el yoyo", region: "Todo México", category: "Juegos" },
  { word: "Ronda infantil", meaning: "Canción con círculo de niños tomados de la mano", example: "Las rondas infantiles como Naranja Dulce son parte de la infancia mexicana", region: "Todo México", category: "Juegos" },
  { word: "El rey manda", meaning: "Juego donde uno ordena acciones absurdas", example: "En el rey manda me tocó hacer de gallina por cinco minutos", region: "Todo México", category: "Juegos" },
  { word: "Tumba la lata", meaning: "Juego de puntería con pelota y latas apiladas", example: "Tumba la lata era el juego favorito en la kermés del colegio", region: "Todo México", category: "Juegos" },
  { word: "Conquián", meaning: "Juego de cartas mexicano de descarte", example: "El conquián se juega de a dos y el primero en armar su juego gana", region: "Todo México", category: "Juegos" },
  // ── Música ──
  { word: "Norteña de acordeón", meaning: "Música del norte con acordeón como instrumento base", example: "La norteña de acordeón suena en todos los ranchos de Tamaulipas", region: "Tamaulipas", category: "Música" },
  { word: "Canción ranchera", meaning: "Género vocal que expresa amor, dolor y orgullo mexicano", example: "La canción ranchera es el alma de las fiestas patrias", region: "Todo México", category: "Música" },
  { word: "Marimba chiapaneca", meaning: "Instrumento de percusión de madera símbolo de Chiapas", example: "La marimba chiapaneca sonó toda la noche en la plaza", region: "Chiapas", category: "Música" },
  { word: "Teponaztle", meaning: "Tambor de madera prehispánico de dos lengüetas", example: "El teponaztle aún resuena en las ceremonias indígenas del centro", region: "Centro", category: "Música" },
  { word: "Trova yucateca", meaning: "Género poético musical de Yucatán con guitarra", example: "La trova yucateca es poesía cantada con el corazón", region: "Yucatán", category: "Música" },
  // ── Animales ──
  { word: "Iguana verde", meaning: "Reptil de gran tamaño que habita en zonas tropicales", example: "La iguana verde toma el sol en las ramas del río", region: "Veracruz", category: "Animales" },
  { word: "Cocodrilo de río", meaning: "Reptil de gran tamaño en ríos del sureste", example: "El cocodrilo de río llegó a medir cinco metros en el pasado", region: "Chiapas", category: "Animales" },
  { word: "Tiburón ballena", meaning: "El pez más grande del mundo que visita el Caribe", example: "Nadar con el tiburón ballena en Holbox es una experiencia única", region: "Quintana Roo", category: "Animales" },
  { word: "Lobo mexicano", meaning: "Subespecie del lobo gris en peligro de extinción", example: "El lobo mexicano fue reintroducido en Sierra Madre Occidental", region: "Chihuahua", category: "Animales" },
  { word: "Manatí del Caribe", meaning: "Mamífero acuático herbívoro de aguas cálidas", example: "El manatí del Caribe pace en los manglares de Tabasco", region: "Tabasco", category: "Animales" },
  // ── Historia ──
  { word: "Independencia de México", meaning: "Proceso de separación de España concluido en 1821", example: "La Independencia de México costó once años de lucha armada", region: "Nacional", category: "Historia" },
  { word: "Revolución mexicana", meaning: "Conflicto armado de 1910 que transformó el país", example: "La Revolución mexicana surgió contra la dictadura de Porfirio Díaz", region: "Nacional", category: "Historia" },
  { word: "Maximiliano de Habsburgo", meaning: "Emperador impuesto por Francia en México", example: "Maximiliano de Habsburgo fue fusilado en el Cerro de las Campanas", region: "Nacional", category: "Historia" },
  { word: "Benito Juárez", meaning: "Presidente indígena que defendió la república", example: "Benito Juárez proclamó que el respeto al derecho ajeno es la paz", region: "Oaxaca", category: "Historia" },
  { word: "Constitución de 1917", meaning: "Carta magna que garantizó derechos sociales", example: "La Constitución de 1917 fue la primera en reconocer derechos laborales", region: "Nacional", category: "Historia" },
  // ── Artistas ──
  { word: "Frida Kahlo", meaning: "Pintora de autorretratos y símbolo feminista", example: "Frida Kahlo convirtió su dolor en arte universal", region: "CDMX", category: "Artistas" },
  { word: "Diego Rivera", meaning: "Muralista que narró la historia de México en paredes", example: "Diego Rivera pintó la epopeya del pueblo mexicano en el Palacio Nacional", region: "Guanajuato", category: "Artistas" },
  { word: "José Clemente Orozco", meaning: "Muralista expresionista de la Revolución", example: "José Clemente Orozco pintó la rabia y la esperanza del pueblo", region: "Jalisco", category: "Artistas" },
  { word: "David Alfaro Siqueiros", meaning: "Muralista y político comunista mexicano", example: "David Alfaro Siqueiros experimentó con nuevas técnicas en sus murales", region: "Chihuahua", category: "Artistas" },
  { word: "Rufino Tamayo", meaning: "Pintor oaxaqueño que fusionó arte prehispánico y moderno", example: "Rufino Tamayo creó un lenguaje visual propio e inconfundible", region: "Oaxaca", category: "Artistas" },
  // ── Monumentos ──
  { word: "Palacio de Bellas Artes", meaning: "Teatro y museo de mármol en el centro de la CDMX", example: "El Palacio de Bellas Artes se hunde unos centímetros cada año", region: "CDMX", category: "Monumentos" },
  { word: "Torre Latinoamericana", meaning: "Primer rascacielos antisísmico de América Latina", example: "La Torre Latinoamericana fue el edificio más alto de México por décadas", region: "CDMX", category: "Monumentos" },
  { word: "Museo Nacional de Antropología", meaning: "Alberga las piezas arqueológicas más importantes de México", example: "El Museo Nacional de Antropología recibe millones de visitantes al año", region: "CDMX", category: "Monumentos" },
  { word: "Zona Arqueológica de Paquimé", meaning: "Ciudad precolombina del norte con arquitectura única", example: "Paquimé era centro de comercio entre Mesoamérica y el suroeste de EE.UU.", region: "Chihuahua", category: "Monumentos" },
  { word: "Castillo de Chapultepec", meaning: "Residencia presidencial convertida en museo histórico", example: "El Castillo de Chapultepec fue la última resistencia de los Niños Héroes", region: "CDMX", category: "Monumentos" },
  // ── Plantas ──
  { word: "Pochote", meaning: "Árbol gigante de tronco espinoso emparentado con la ceiba", example: "El pochote da sombra en los pueblos cálidos del sur", region: "Oaxaca", category: "Plantas" },
  { word: "Musgo de encino", meaning: "Planta epífita que crece en bosques de niebla", example: "El musgo de encino cuelga de los árboles en la sierra de Oaxaca", region: "Oaxaca", category: "Plantas" },
  { word: "Nanche", meaning: "Árbol frutal de pequeñas bayas amarillas", example: "Los nanches en aguardiente son un dulce típico de temporada", region: "Todo México", category: "Plantas" },
  { word: "Tepeguaje", meaning: "Árbol leguminoso de madera muy dura del trópico seco", example: "El tepeguaje resiste la sequía y da sombra en el Balsas", region: "Guerrero", category: "Plantas" },
  { word: "Huizache", meaning: "Arbusto espinoso de flores amarillas aromáticas", example: "El huizache florece en primavera y perfuma los campos", region: "Norte", category: "Plantas" },
  // ── Tradiciones ──
  { word: "Posada navideña", meaning: "Festejo de nueve noches previas a la Navidad", example: "En la posada navideña rompimos la piñata y cantamos villancicos", region: "Todo México", category: "Tradiciones" },
  { word: "Danza de los Voladores", meaning: "Ceremonia ritual totonaca de vuelo desde un poste", example: "La Danza de los Voladores de Papantla es Patrimonio de la Humanidad", region: "Veracruz", category: "Tradiciones" },
  { word: "Baile de los Diablos", meaning: "Danza afromexicana de la Costa Chica", example: "El Baile de los Diablos celebra la herencia africana de México", region: "Guerrero", category: "Tradiciones" },
  { word: "Kermés escolar", meaning: "Feria benéfica organizada por escuelas y padres", example: "En la kermés escolar vendimos tamales y rifamos una bicicleta", region: "Todo México", category: "Tradiciones" },
  { word: "Calenda oaxaqueña", meaning: "Desfile festivo nocturno con gigantes y marmotas", example: "La calenda oaxaqueña recorrió las calles con música y cohetes", region: "Oaxaca", category: "Tradiciones" },
  // ── Modismos ──
  { word: "Estar de pelos", meaning: "Estar excelente, de maravilla", example: "La fiesta estuvo de pelos, no quería que terminara", region: "Todo México", category: "Modismos" },
  { word: "Dar atole con el dedo", meaning: "Engañar a alguien con promesas falsas", example: "El candidato nos dio atole con el dedo y no cumplió nada", region: "Todo México", category: "Modismos" },
  { word: "Armar el mitote", meaning: "Crear un escándalo o pleito innecesario", example: "No armes el mitote por algo tan tonto", region: "Todo México", category: "Modismos" },
  { word: "Estar pato", meaning: "No tener dinero, estar sin un centavo", example: "Estoy bien pato hasta que llegue la quincena", region: "Todo México", category: "Modismos" },
  { word: "Caerle el veinte", meaning: "Entender algo después de un momento de confusión", example: "Le cayó el veinte cuando ya habíamos salido del cine", region: "Todo México", category: "Modismos" },

  // ── BLOQUE 13 ──
  // ── Comida ──
  { word: "Cochinita pibil", meaning: "Cerdo marinado en achiote cocido bajo tierra", example: "La cochinita pibil de Mérida es la mejor que he probado", region: "Yucatán", category: "Comida" },
  { word: "Camarones a la diabla", meaning: "Camarones en salsa roja muy picante", example: "Los camarones a la diabla de Mazatlán me dejaron llorando", region: "Sinaloa", category: "Comida" },
  { word: "Chiles en nogada", meaning: "Chile poblano relleno con nogada y granada", example: "Los chiles en nogada se sirven en temporada patria", region: "Puebla", category: "Comida" },
  { word: "Ceviche de camarón", meaning: "Mariscos crudos marinados en jugo de limón", example: "El ceviche de camarón en Ensenada es fresco y abundante", region: "Baja California", category: "Comida" },
  { word: "Tamales de rajas", meaning: "Tamales con chile poblano y queso", example: "Los tamales de rajas son el antojo perfecto en fría mañana", region: "Todo México", category: "Comida" },
  // ── Juegos ──
  { word: "Lotería mexicana", meaning: "Juego de cartas ilustradas con figuras icónicas", example: "Jugamos lotería mexicana toda la noche con frijoles de fichas", region: "Todo México", category: "Juegos" },
  { word: "Rayuela", meaning: "Juego de saltar cuadros dibujados en el piso", example: "La rayuela requiere equilibrio y puntería para saltar bien", region: "Todo México", category: "Juegos" },
  { word: "Matatena", meaning: "Juego de habilidad con piedras o bolitas", example: "Las niñas jugaban matatena en el patio de la escuela", region: "Todo México", category: "Juegos" },
  { word: "Encantados", meaning: "Juego donde quien queda congelado al ser tocado", example: "Jugamos encantados hasta que ya no podíamos correr más", region: "Todo México", category: "Juegos" },
  { word: "El bote pateado", meaning: "Variante del escondite donde se patea una lata", example: "El bote pateado era el juego más emocionante del vecindario", region: "Todo México", category: "Juegos" },
  // ── Música ──
  { word: "Danzón", meaning: "Baile elegante de salón originado en Cuba y adoptado en México", example: "El danzón es el baile de los abuelos en el Parque México", region: "CDMX", category: "Música" },
  { word: "Mambo mexicano", meaning: "Ritmo afrocaribeño popularizado por Pérez Prado", example: "El mambo mexicano conquistó los salones de baile del mundo", region: "CDMX", category: "Música" },
  { word: "Quebradita", meaning: "Baile acrobático al ritmo de banda sinaloense", example: "La quebradita se baila con botas y sombrero vaquero", region: "Sinaloa", category: "Música" },
  { word: "Cumbia villera mexicana", meaning: "Cumbia de barrio con letra picaresca y ritmo pegajoso", example: "La cumbia villera mexicana sonó fuerte en los barrios del norte", region: "Norte", category: "Música" },
  { word: "Clave jarocha", meaning: "Instrumento de percusión del son veracruzano", example: "La clave jarocha marca el ritmo del fandango en Veracruz", region: "Veracruz", category: "Música" },
  // ── Animales ──
  { word: "Víbora de cascabel", meaning: "Serpiente venenosa de cascabel sonoro", example: "La víbora de cascabel advierte con su sonaja antes de atacar", region: "Norte", category: "Animales" },
  { word: "Tapir mexicano", meaning: "Mamífero grande con nariz prensil de las selvas", example: "El tapir mexicano es el animal terrestre más grande de México", region: "Chiapas", category: "Animales" },
  { word: "Puma", meaning: "Felino grande y sigiloso de las sierras mexicanas", example: "El puma es el depredador más ampliamente distribuido de América", region: "Todo México", category: "Animales" },
  { word: "Loro cabeza amarilla", meaning: "Loro endémico mexicano en peligro de extinción", example: "El loro cabeza amarilla imita la voz humana con asombrosa precisión", region: "Veracruz", category: "Animales" },
  { word: "Coatí", meaning: "Mamífero rayado de nariz larga pariente del mapache", example: "El coatí buscaba comida entre los turistas de Xcaret", region: "Quintana Roo", category: "Animales" },
  // ── Historia ──
  { word: "Hernán Cortés", meaning: "Conquistador español que derrocó al Imperio Azteca", example: "Hernán Cortés llegó a México en 1519 y cambió la historia", region: "Nacional", category: "Historia" },
  { word: "La Malinche", meaning: "Intérprete indígena y aliada de Hernán Cortés", example: "La Malinche fue clave en la comunicación entre españoles e indígenas", region: "Nacional", category: "Historia" },
  { word: "Cuauhtémoc", meaning: "Último tlatoani azteca, símbolo de resistencia indígena", example: "Cuauhtémoc resistió el sitio de Tenochtitlán hasta el final", region: "CDMX", category: "Historia" },
  { word: "Álvaro Obregón", meaning: "General revolucionario y presidente modernizador", example: "Álvaro Obregón derrotó a Villa en Celaya y consolidó la Revolución", region: "Sonora", category: "Historia" },
  { word: "Francisco I. Madero", meaning: "Presidente que inició la Revolución contra el Porfiriato", example: "Francisco I. Madero fue traicionado y asesinado en la Decena Trágica", region: "Coahuila", category: "Historia" },
  // ── Artistas ──
  { word: "Juan Rulfo", meaning: "Escritor de Pedro Páramo y El Llano en llamas", example: "Juan Rulfo creó con pocas páginas una de las obras más importantes del siglo XX", region: "Jalisco", category: "Artistas" },
  { word: "Carlos Fuentes", meaning: "Novelista y diplomático del boom latinoamericano", example: "Carlos Fuentes retrató la identidad mexicana en La región más transparente", region: "CDMX", category: "Artistas" },
  { word: "Octavio Paz", meaning: "Poeta y Nobel de Literatura 1990", example: "Octavio Paz exploró la identidad mexicana en El laberinto de la soledad", region: "CDMX", category: "Artistas" },
  { word: "Elena Poniatowska", meaning: "Periodista y escritora cronista de México moderno", example: "Elena Poniatowska documentó el 68 en La noche de Tlatelolco", region: "CDMX", category: "Artistas" },
  { word: "Rosario Castellanos", meaning: "Escritora chiapaneca defensora de las mujeres indígenas", example: "Rosario Castellanos abrió camino a las voces femeninas en la literatura", region: "Chiapas", category: "Artistas" },
  // ── Monumentos ──
  { word: "Plaza de las Tres Culturas", meaning: "Lugar donde conviven restos aztecas, iglesia colonial y edificio moderno", example: "La Plaza de las Tres Culturas en Tlatelolco es símbolo del 68", region: "CDMX", category: "Monumentos" },
  { word: "Laguna de Bacalar", meaning: "Laguna de siete colores en la selva quintanarroense", example: "La Laguna de Bacalar tiene aguas turquesas únicas en el mundo", region: "Quintana Roo", category: "Monumentos" },
  { word: "Cumbres de Monterrey", meaning: "Reserva natural con montañas y cañones del norte", example: "Las Cumbres de Monterrey son el pulmón verde del noreste mexicano", region: "Nuevo León", category: "Monumentos" },
  { word: "Mina El Edén", meaning: "Mina colonial de plata convertida en museo", example: "La Mina El Edén en Zacatecas abrió sus túneles al turismo", region: "Zacatecas", category: "Monumentos" },
  { word: "Ex Hacienda de Chautla", meaning: "Casco colonial con capilla y jardines en la Sierra de Puebla", example: "La Ex Hacienda de Chautla es hoy un hotel histórico entre pinos", region: "Puebla", category: "Monumentos" },
  // ── Plantas ──
  { word: "Caoba", meaning: "Árbol de madera preciosa color rojo oscuro", example: "La caoba fue uno de los recursos más explotados en Chiapas", region: "Chiapas", category: "Plantas" },
  { word: "Ramón", meaning: "Árbol maya cuyas semillas nutritivas salvaron comunidades", example: "El ramón era alimento sagrado de los mayas en tiempos de hambruna", region: "Yucatán", category: "Plantas" },
  { word: "Cuachalalate", meaning: "Árbol de corteza medicinal usada para problemas renales", example: "El cuachalalate en té es remedio popular para el riñón", region: "Guerrero", category: "Plantas" },
  { word: "Tule", meaning: "Planta acuática de la que se tejen petates y sombreros", example: "Con el tule del lago las artesanas hacen canastas y tapetes", region: "Oaxaca", category: "Plantas" },
  { word: "Tasiste", meaning: "Palma silvestre de las selvas costeras del Pacífico", example: "Las hojas del tasiste se usan para techar casas en Nayarit", region: "Nayarit", category: "Plantas" },
  // ── Tradiciones ──
  { word: "Guelaguetza", meaning: "Festival oaxaqueño de danza y ofrenda entre comunidades", example: "La Guelaguetza reúne a los ocho pueblos de Oaxaca cada julio", region: "Oaxaca", category: "Tradiciones" },
  { word: "Fiesta de Xantolo", meaning: "Celebración huasteca del Día de Muertos", example: "En la Fiesta de Xantolo bailan disfraces de muerte en las calles", region: "Hidalgo", category: "Tradiciones" },
  { word: "Jaripeo", meaning: "Rodeo mexicano con jinetes y toros bravos", example: "El jaripeo empezó a las diez de la noche y duró hasta el amanecer", region: "Todo México", category: "Tradiciones" },
  { word: "Serenata", meaning: "Música tocada bajo la ventana de noche como homenaje", example: "Le dio serenata a su novia con mariachi a las doce", region: "Todo México", category: "Tradiciones" },
  { word: "Bautizo católico", meaning: "Sacramento que da nombre y fe a un recién nacido", example: "El bautizo del bebé lo celebramos con mole y música", region: "Todo México", category: "Tradiciones" },
  // ── Modismos ──
  { word: "Quedarse con el ojo cuadrado", meaning: "Quedarse muy sorprendido o asombrado", example: "Me quedé con el ojo cuadrado cuando vi el precio", region: "Todo México", category: "Modismos" },
  { word: "Echar raíces", meaning: "Establecerse definitivamente en un lugar", example: "Mi familia echó raíces en Monterrey hace treinta años", region: "Todo México", category: "Modismos" },
  { word: "Hacer de tripas corazón", meaning: "Armarse de valor ante algo difícil", example: "Hice de tripas corazón y pedí aumento de sueldo", region: "Todo México", category: "Modismos" },
  { word: "Andar con el Jesús en la boca", meaning: "Estar muy asustado o angustiado", example: "Andaba con el Jesús en la boca esperando los resultados", region: "Todo México", category: "Modismos" },
  { word: "Tener mucha labia", meaning: "Tener facilidad de palabra y convencer fácilmente", example: "Ese vendedor tiene mucha labia, me convenció de comprar todo", region: "Todo México", category: "Modismos" },

  // ── BLOQUE 14 ──
  // ── Comida ──
  { word: "Agua de jamaica", meaning: "Bebida refrescante de flor de hibisco", example: "El agua de jamaica bien fría es perfecta para el calor", region: "Todo México", category: "Comida" },
  { word: "Agua de tamarindo", meaning: "Refresco agridulce de pulpa de tamarindo", example: "En la feria siempre hay agua de tamarindo con chile", region: "Todo México", category: "Comida" },
  { word: "Tejate", meaning: "Bebida prehispánica de cacao y maíz sin fermentar", example: "El tejate es la bebida sagrada de los zapotecos de Oaxaca", region: "Oaxaca", category: "Comida" },
  { word: "Tepache de piña", meaning: "Bebida fermentada de piña con piloncillo y especias", example: "El tepache de piña se vende en las calles del centro histórico", region: "CDMX", category: "Comida" },
  { word: "Ponche navideño", meaning: "Bebida caliente de frutas para las posadas", example: "El ponche navideño con tejocotes y guayabas calienta el alma", region: "Todo México", category: "Comida" },
  // ── Juegos ──
  { word: "Canicas", meaning: "Bolitas de vidrio de colores para jugar en la tierra", example: "Perdí todas mis canicas jugando en el recreo", region: "Todo México", category: "Juegos" },
  { word: "Dominó", meaning: "Juego de fichas rectangulares con puntos", example: "Los domingos jugamos dominó en la mesa de la cocina", region: "Todo México", category: "Juegos" },
  { word: "Ajedrez callejero", meaning: "Partida de ajedrez en parques y plazas públicas", example: "En el parque Alameda siempre hay gente jugando ajedrez callejero", region: "CDMX", category: "Juegos" },
  { word: "Carrera de costales", meaning: "Competencia de saltar dentro de un costal", example: "La carrera de costales en el kínder nos hacía reír a todos", region: "Todo México", category: "Juegos" },
  { word: "Juego del pañuelo", meaning: "Competencia de velocidad con un pañuelo entre equipos", example: "En el juego del pañuelo me tocó el número cuatro tres veces", region: "Todo México", category: "Juegos" },
  // ── Música ──
  { word: "Rockabilly mexicano", meaning: "Fusión de rock americano con influencia norteña", example: "El rockabilly mexicano tiene su propio sello en Ciudad Juárez", region: "Chihuahua", category: "Música" },
  { word: "Ska mexicano", meaning: "Género jamaicano fusionado con rock en la CDMX", example: "El ska mexicano de los noventa llenó los foros independientes", region: "CDMX", category: "Música" },
  { word: "Onda chicana", meaning: "Música fronteriza que mezcla inglés y español", example: "La onda chicana cruzó la frontera y conquistó ambos lados", region: "Frontera Norte", category: "Música" },
  { word: "Huehuentón", meaning: "Personaje de danza burlesca en fiestas indígenas serranas", example: "El huehuentón baila con máscara de viejo en las fiestas de la sierra", region: "Puebla", category: "Música" },
  { word: "Arpa jarocha", meaning: "Instrumento de cuerdas clave del son veracruzano", example: "El arpa jarocha lleva la melodía en el fandango veracruzano", region: "Veracruz", category: "Música" },
  // ── Animales ──
  { word: "Guajolote", meaning: "Pavo doméstico originario de México", example: "El guajolote es la base del mole negro en Oaxaca", region: "Oaxaca", category: "Animales" },
  { word: "Chachalaca", meaning: "Ave ruidosa de los bosques tropicales", example: "La chachalaca canta a gritos al amanecer en la selva", region: "Veracruz", category: "Animales" },
  { word: "Armadillo", meaning: "Mamífero con caparazón óseo articulado", example: "El armadillo se hace bola cuando siente peligro", region: "Todo México", category: "Animales" },
  { word: "Tejón", meaning: "Mamífero nocturno del norte con rayas faciales", example: "El tejón escarba el suelo buscando raíces e insectos", region: "Norte", category: "Animales" },
  { word: "Zopilote", meaning: "Ave carroñera de gran envergadura", example: "El zopilote cumple una función vital en el ecosistema", region: "Todo México", category: "Animales" },
  // ── Historia ──
  { word: "Emiliano Zapata", meaning: "Líder agrarista del sur durante la Revolución", example: "Emiliano Zapata murió en Chinameca peleando por la tierra", region: "Morelos", category: "Historia" },
  { word: "Pancho Villa", meaning: "General del norte, ícono de la Revolución mexicana", example: "Pancho Villa encabezó la División del Norte con bravura", region: "Durango", category: "Historia" },
  { word: "Victoriano Huerta", meaning: "General que traicionó y derrocó a Madero", example: "Victoriano Huerta gobernó México tras el golpe de la Decena Trágica", region: "Nacional", category: "Historia" },
  { word: "Venustiano Carranza", meaning: "Presidente que promulgó la Constitución de 1917", example: "Venustiano Carranza convocó el Congreso Constituyente de Querétaro", region: "Coahuila", category: "Historia" },
  { word: "Leona Vicario", meaning: "Heroína insurgente que financió la Independencia", example: "Leona Vicario arriesgó su fortuna y su libertad por la Independencia", region: "CDMX", category: "Historia" },
  // ── Artistas ──
  { word: "Remedios Varo", meaning: "Pintora surrealista exiliada en México", example: "Remedios Varo creó mundos fantásticos y oníricos en sus lienzos", region: "CDMX", category: "Artistas" },
  { word: "Leonora Carrington", meaning: "Pintora surrealista británica radicada en México", example: "Leonora Carrington pobló sus cuadros de criaturas míticas y misterio", region: "CDMX", category: "Artistas" },
  { word: "Francisco Toledo", meaning: "Artista oaxaqueño de obra vasta y compromiso social", example: "Francisco Toledo fundó instituciones culturales para preservar Oaxaca", region: "Oaxaca", category: "Artistas" },
  { word: "Álvaro Carrillo", meaning: "Compositor de boleros como Sabor a mí", example: "Álvaro Carrillo llenó de poesía la música romántica mexicana", region: "Oaxaca", category: "Artistas" },
  { word: "Armando Manzanero", meaning: "Compositor yucateco maestro del bolero moderno", example: "Armando Manzanero escribió canciones que el mundo entero cantó", region: "Yucatán", category: "Artistas" },
  // ── Monumentos ──
  { word: "Acueducto del Padre Tembleque", meaning: "Acueducto del siglo XVI patrimonio de la humanidad", example: "El Acueducto del Padre Tembleque es la obra hidráulica más larga del virreinato", region: "Hidalgo", category: "Monumentos" },
  { word: "Xochicalco", meaning: "Ciudad prehispánica con pirámide de la Serpiente Emplumada", example: "Xochicalco fue un importante centro astronómico prehispánico", region: "Morelos", category: "Monumentos" },
  { word: "Palacio Municipal de Oaxaca", meaning: "Edificio colonial frente al zócalo oaxaqueño", example: "El Palacio Municipal de Oaxaca tiene portales con artesanías y mezcal", region: "Oaxaca", category: "Monumentos" },
  { word: "Hacienda de Gogorrón", meaning: "Balneario y casco colonial en San Luis Potosí", example: "La Hacienda de Gogorrón combina arquitectura histórica con aguas termales", region: "San Luis Potosí", category: "Monumentos" },
  { word: "Faro de Comercio", meaning: "Escultura de acero que proyecta luz láser en Monterrey", example: "El Faro de Comercio ilumina el cielo de Monterrey cada noche", region: "Nuevo León", category: "Monumentos" },
  // ── Plantas ──
  { word: "Cedro rojo", meaning: "Árbol de madera aromática y duradera", example: "El cedro rojo fue muy talado en las selvas de Campeche", region: "Campeche", category: "Plantas" },
  { word: "Flor de izote", meaning: "Flor blanca de la yuca comestible en el sur", example: "La flor de izote en huevos es un plato típico de Oaxaca", region: "Oaxaca", category: "Plantas" },
  { word: "Bonete", meaning: "Árbol de fruto verde y látex del trópico seco", example: "El bonete crece en las selvas bajas caducifolias del Pacífico", region: "Jalisco", category: "Plantas" },
  { word: "Salvia mexicana", meaning: "Planta aromática de flores moradas endémica del altiplano", example: "La salvia mexicana atrae colibríes en los jardines de la CDMX", region: "Centro", category: "Plantas" },
  { word: "Acahual", meaning: "Girasol silvestre que coloniza terrenos abandonados", example: "El acahual cubre los campos abandonados con sus flores amarillas", region: "Sur", category: "Plantas" },
  // ── Tradiciones ──
  { word: "Día de la Santa Cruz", meaning: "Celebración del 3 de mayo de albañiles y mineros", example: "El Día de la Santa Cruz los albañiles adornan la obra con una cruz", region: "Todo México", category: "Tradiciones" },
  { word: "Tamalada navideña", meaning: "Reunión familiar para preparar tamales en diciembre", example: "La tamalada navideña es el evento más esperado del año en mi familia", region: "Todo México", category: "Tradiciones" },
  { word: "Fiesta patronal", meaning: "Celebración anual en honor al santo del pueblo", example: "En la fiesta patronal hubo cohetes, danzantes y mole para todos", region: "Todo México", category: "Tradiciones" },
  { word: "Limpia con huevo", meaning: "Ritual de curandera para quitar el mal de ojo", example: "La curandera le hizo una limpia con huevo y oró por él", region: "Todo México", category: "Tradiciones" },
  { word: "Paseo del Ángelus", meaning: "Procesión vespertina en pueblos con toque de campanas", example: "El Paseo del Ángelus reunía a toda la comunidad al atardecer", region: "Centro", category: "Tradiciones" },
  // ── Modismos ──
  { word: "Estar en chino", meaning: "Estar muy difícil o complicado algo", example: "Se me hace que esto va a estar en chino sin ayuda", region: "Todo México", category: "Modismos" },
  { word: "Meter el pie", meaning: "Meterse donde no lo llaman o arruinar algo", example: "Metiste el pie cuando dijiste eso frente a su mamá", region: "Todo México", category: "Modismos" },
  { word: "A todo mecate", meaning: "A toda velocidad, sin parar", example: "El taxi iba a todo mecate por el periférico", region: "Todo México", category: "Modismos" },
  { word: "Ir de pinta", meaning: "Faltar a la escuela para divertirse", example: "Nos fuimos de pinta al parque en lugar de ir a matemáticas", region: "Todo México", category: "Modismos" },
  { word: "Estar como agua para chocolate", meaning: "Estar muy enojado y al límite", example: "Mi mamá estaba como agua para chocolate cuando llegué tarde", region: "Todo México", category: "Modismos" },

  // ── BLOQUE 15 ──
  // ── Comida ──
  { word: "Machetes oaxaqueños", meaning: "Tortilla grande y gruesa con asiento de queso", example: "Los machetes oaxaqueños son tan grandes que no caben en el plato", region: "Oaxaca", category: "Comida" },
  { word: "Molotes", meaning: "Masa de maíz rellena frita en forma ovalada", example: "Los molotes de chorizo son el antojo callejero en Oaxaca", region: "Oaxaca", category: "Comida" },
  { word: "Caldo de res", meaning: "Caldo con hueso, verduras y tuétano", example: "El caldo de res con limón y cebolla cura cualquier cruda", region: "Todo México", category: "Comida" },
  { word: "Pipián rojo", meaning: "Salsa espesa de chile y semilla de calabaza", example: "El pipián rojo con pollo es el orgullo de la cocina guerrerense", region: "Guerrero", category: "Comida" },
  { word: "Chileatole", meaning: "Atole espeso con chile y elote", example: "El chileatole verde de Guerrero es un caldo reconfortante", region: "Guerrero", category: "Comida" },
  // ── Juegos ──
  { word: "Quemados", meaning: "Juego donde se lanza una pelota a eliminar contrincantes", example: "En quemados el que agarre la pelota salva a su equipo", region: "Todo México", category: "Juegos" },
  { word: "Policías y ladrones", meaning: "Juego de persecución con dos equipos", example: "Jugamos policías y ladrones en toda la cuadra", region: "Todo México", category: "Juegos" },
  { word: "Estatuas de marfil", meaning: "Juego donde hay que quedarse inmóvil al detenerse la música", example: "Estatuas de marfil era el juego favorito en las piñatas", region: "Todo México", category: "Juegos" },
  { word: "Roña", meaning: "Juego de persecución donde el tocado queda contaminado", example: "La roña es la versión más pegajosa del juego de la traes", region: "Todo México", category: "Juegos" },
  { word: "Siete pecados", meaning: "Juego de preguntas con penitencias divertidas", example: "En siete pecados nadie quería que le saliera beso en la frente", region: "Todo México", category: "Juegos" },
  // ── Música ──
  { word: "Música de viento oaxaqueña", meaning: "Agrupación de metales y percusión de tradición zapoteca", example: "La música de viento oaxaqueña acompaña todas las fiestas del pueblo", region: "Oaxaca", category: "Música" },
  { word: "Cuarteto de cuerdas poblano", meaning: "Ensamble clásico con influencia barroca novohispana", example: "El cuarteto de cuerdas poblano tocó en el atrio de la catedral", region: "Puebla", category: "Música" },
  { word: "Punta guatemalteca", meaning: "Ritmo garífuna bailado en la Costa de Chiapas", example: "La punta guatemalteca se baila en las comunidades de la frontera", region: "Chiapas", category: "Música" },
  { word: "Son de artesa", meaning: "Música y danza afromexicana sobre una artesa de madera", example: "El son de artesa preserva la herencia africana en Guerrero", region: "Guerrero", category: "Música" },
  { word: "Zapateado jarocho", meaning: "Técnica de percusión corporal con los pies en el fandango", example: "El zapateado jarocho retumba en la tarima hasta el amanecer", region: "Veracruz", category: "Música" },
  // ── Animales ──
  { word: "Tlacuache", meaning: "Marsupial nocturno que habita en todo México", example: "El tlacuache se hace el muerto cuando siente peligro", region: "Todo México", category: "Animales" },
  { word: "Mapache", meaning: "Mamífero con máscara facial oscura y manos hábiles", example: "El mapache abrió el bote de basura con sus manitas", region: "Todo México", category: "Animales" },
  { word: "Cacomixtle", meaning: "Mamífero nocturno de cola anillada pariente del mapache", example: "El cacomixtle es ágil y trepa árboles con facilidad", region: "Centro", category: "Animales" },
  { word: "Paloma de ala blanca", meaning: "Ave migratoria que cruza México en primavera", example: "La paloma de ala blanca descansa en los mezquites del norte", region: "Norte", category: "Animales" },
  { word: "Murciélago nectarívoro", meaning: "Murciélago polinizador de flores y agaves nocturnos", example: "El murciélago nectarívoro poliniza el agave de noche", region: "Centro", category: "Animales" },
  // ── Historia ──
  { word: "Miguel Hidalgo", meaning: "Cura criollo que inició la Independencia en 1810", example: "Miguel Hidalgo tocó la campana de Dolores y cambió la historia", region: "Guanajuato", category: "Historia" },
  { word: "José María Morelos", meaning: "Sacerdote insurgente y estratega de la Independencia", example: "José María Morelos redactó los Sentimientos de la Nación", region: "Michoacán", category: "Historia" },
  { word: "Josefa Ortiz de Domínguez", meaning: "Corregidora que alertó a los insurgentes en 1810", example: "Josefa Ortiz de Domínguez arriesgó su vida para avisar a Hidalgo", region: "Querétaro", category: "Historia" },
  { word: "Vicente Guerrero", meaning: "General insurgente y segundo presidente de México", example: "Vicente Guerrero fue el primero en abolir la esclavitud en México", region: "Guerrero", category: "Historia" },
  { word: "Agustín de Iturbide", meaning: "Militar que consumó la Independencia y se proclamó Emperador", example: "Agustín de Iturbide firmó el Acta de Independencia en 1821", region: "Michoacán", category: "Historia" },
  // ── Artistas ──
  { word: "Sor Juana Inés de la Cruz", meaning: "Poetisa y pensadora del siglo XVII, primera feminista de América", example: "Sor Juana defendió el derecho de las mujeres a la educación y el conocimiento", region: "CDMX", category: "Artistas" },
  { word: "José Guadalupe Posada", meaning: "Grabador creador de las calaveras y La Catrina", example: "José Guadalupe Posada inventó La Catrina y la ironía de la muerte", region: "Aguascalientes", category: "Artistas" },
  { word: "Salvador Novo", meaning: "Escritor y cronista de la Ciudad de México", example: "Salvador Novo documentó la vida urbana con ironía y elegancia", region: "CDMX", category: "Artistas" },
  { word: "María Grever", meaning: "Compositora de boleros como Te quiero dijiste", example: "María Grever fue la primera compositora mexicana famosa en el mundo", region: "Jalisco", category: "Artistas" },
  { word: "Consuelo Velázquez", meaning: "Compositora del bolero Bésame mucho", example: "Consuelo Velázquez escribió Bésame mucho a los dieciséis años", region: "Jalisco", category: "Artistas" },
  // ── Monumentos ──
  { word: "Fuerte de San Juan de Ulúa", meaning: "Fortaleza colonial en el puerto de Veracruz", example: "El Fuerte de San Juan de Ulúa fue la última posición española en México", region: "Veracruz", category: "Monumentos" },
  { word: "Convento de la Santa Cruz", meaning: "Convento franciscano donde vivió Maximiliano en Querétaro", example: "El Convento de la Santa Cruz fue cuartel y cárcel imperial", region: "Querétaro", category: "Monumentos" },
  { word: "Balneario de Comanjilla", meaning: "Aguas termales medicinales en plena meseta central", example: "El Balneario de Comanjilla tiene agua caliente natural todo el año", region: "Guanajuato", category: "Monumentos" },
  { word: "Iglesia de San Juan Chamula", meaning: "Templo sincrético donde se mezcla catolicismo y costumbre tzotzil", example: "En San Juan Chamula el incienso y las velas ocupan el lugar de los bancos", region: "Chiapas", category: "Monumentos" },
  { word: "Arco de la Independencia de Querétaro", meaning: "Monumento conmemorativo en la capital queretana", example: "El Arco de la Independencia marca el inicio del boulevard principal", region: "Querétaro", category: "Monumentos" },
  // ── Plantas ──
  { word: "Izote", meaning: "Planta de hojas rígidas y flores blancas comestibles", example: "El izote crece en los cerros secos y es símbolo del estado de Puebla", region: "Puebla", category: "Plantas" },
  { word: "Guamúchil", meaning: "Árbol de fruto en vaina con semillas dulces", example: "Los niños comen las semillas del guamúchil directamente del árbol", region: "Sinaloa", category: "Plantas" },
  { word: "Maguey mezcalero", meaning: "Agave del que se extrae el mezcal artesanal", example: "El maguey mezcalero tarda años en madurar antes de ser cosechado", region: "Oaxaca", category: "Plantas" },
  { word: "Tepehuaje", meaning: "Árbol resistente a la sequía de zonas semiáridas", example: "El tepehuaje proporciona sombra y forraje en el norte árido", region: "Norte", category: "Plantas" },
  { word: "Chaca roja", meaning: "Árbol de corteza rojiza antiinflamatoria de la selva", example: "El chaca roja crece en la selva baja y tiene corteza medicinal", region: "Yucatán", category: "Plantas" },
  // ── Tradiciones ──
  { word: "Danza de los Concheros", meaning: "Danza ritual prehispánica con caracoles y penachos", example: "Los Concheros danzan en el atrio del Templo Mayor cada año", region: "CDMX", category: "Tradiciones" },
  { word: "Feria de San Marcos", meaning: "La feria más importante de México en Aguascalientes", example: "La Feria de San Marcos reúne millones de visitantes cada abril", region: "Aguascalientes", category: "Tradiciones" },
  { word: "Carnaval de Veracruz", meaning: "Festejo previo a la Cuaresma con desfiles y disfraces", example: "El Carnaval de Veracruz es el más grande del país", region: "Veracruz", category: "Tradiciones" },
  { word: "Danza del Venado", meaning: "Danza yaqui que recrea la caza ritual del venado", example: "La Danza del Venado de los yaquis es una de las más antiguas de México", region: "Sonora", category: "Tradiciones" },
  { word: "Corrida de toros", meaning: "Espectáculo taurino tradicional en plazas de toros", example: "La corrida de toros en la Monumental de la CDMX reúne a miles", region: "CDMX", category: "Tradiciones" },
  // ── Modismos ──
  { word: "Hacerse guaje", meaning: "Fingir ignorancia para no hacer algo", example: "Se hizo guaje cuando le preguntaron quién rompió el florero", region: "Todo México", category: "Modismos" },
  { word: "Andar de volada", meaning: "Ir muy rápido o hacer algo a toda prisa", example: "Ando de volada, luego te cuento lo que pasó", region: "Todo México", category: "Modismos" },
  { word: "Echar un ojo", meaning: "Vigilar o revisar algo rápidamente", example: "Échame un ojo a mi mochila mientras voy al baño", region: "Todo México", category: "Modismos" },
  { word: "Darle al hígado", meaning: "Tomar alcohol en exceso", example: "Ese señor le da duro al hígado cada fin de semana", region: "Todo México", category: "Modismos" },
  { word: "Ni modo", meaning: "No hay remedio, hay que aceptarlo", example: "Ni modo, ya se canceló el concierto y no hay reembolso", region: "Todo México", category: "Modismos" },

  // ── BLOQUE 16 ──
  // ── Comida ──
  { word: "Taco de canasta", meaning: "Taco relleno guardado en canasta y bañado en aceite", example: "Los tacos de canasta del ciclista son el desayuno del trabajador", region: "CDMX", category: "Comida" },
  { word: "Enfrijolada", meaning: "Tortilla bañada en salsa de frijol negro", example: "Desayuné enfrijoladas con crema y queso de rancho", region: "Oaxaca", category: "Comida" },
  { word: "Sopa de fideos", meaning: "Sopa de pasta frita y cocida en caldo de jitomate", example: "La sopa de fideos de mi abuela es el mejor plato del mundo", region: "Todo México", category: "Comida" },
  { word: "Caldo de pollo", meaning: "Caldo ligero con pollo, verduras y hierbas", example: "Con un buen caldo de pollo se alivia hasta el alma", region: "Todo México", category: "Comida" },
  { word: "Arroz a la mexicana", meaning: "Arroz frito con jitomate, cebolla y verduras", example: "El arroz a la mexicana no puede faltar en ninguna comida", region: "Todo México", category: "Comida" },
  // ── Juegos ──
  { word: "Veintiuno", meaning: "Juego de cartas donde se busca llegar a 21 sin pasarse", example: "En veintiuno apostamos monedas y perdí todas las mías", region: "Todo México", category: "Juegos" },
  { word: "Teléfono descompuesto", meaning: "Juego de susurrar mensajes en cadena", example: "En teléfono descompuesto el mensaje llegó completamente cambiado", region: "Todo México", category: "Juegos" },
  { word: "Memorama", meaning: "Juego de memoria con pares de cartas boca abajo", example: "El memorama de animales mexicanos lo gané tres veces seguidas", region: "Todo México", category: "Juegos" },
  { word: "El gato", meaning: "Juego de tres en raya en papel", example: "Jugamos el gato en la servilleta mientras esperábamos la comida", region: "Todo México", category: "Juegos" },
  { word: "La roña de agua", meaning: "Versión acuática del juego de la traes en albercas", example: "La roña de agua en la alberca fue la diversión de todo el verano", region: "Todo México", category: "Juegos" },
  // ── Música ──
  { word: "Tecno cumbia mexicana", meaning: "Fusión electrónica de cumbia con sintetizadores", example: "La tecno cumbia mexicana inundó los bailes de los noventa", region: "Todo México", category: "Música" },
  { word: "Requinto jarocho", meaning: "Guitarra pequeña de cuatro cuerdas del son veracruzano", example: "El requinto jarocho improvisa la melodía en el fandango", region: "Veracruz", category: "Música" },
  { word: "Vihuela de mariachi", meaning: "Guitarra pequeña abombada que marca el ritmo del mariachi", example: "La vihuela de mariachi tiene un sonido único e inconfundible", region: "Jalisco", category: "Música" },
  { word: "Guitarrón mexicano", meaning: "Bajo acústico grande de seis cuerdas del mariachi", example: "El guitarrón mexicano es el corazón rítmico del mariachi", region: "Jalisco", category: "Música" },
  { word: "Sinfonía india", meaning: "Composición orquestal de Carlos Chávez con temas prehispánicos", example: "La Sinfonía India de Carlos Chávez fusiona lo prehispánico con lo clásico", region: "CDMX", category: "Música" },
  // ── Animales ──
  { word: "Venado cola blanca", meaning: "Venado de cola blanca que habita en bosques y matorrales", example: "El venado cola blanca es el más cazado en México", region: "Norte", category: "Animales" },
  { word: "Borrego cimarrón", meaning: "Oveja salvaje de cuernos enroscados del norte", example: "El borrego cimarrón habita en las sierras áridas de Baja California", region: "Baja California", category: "Animales" },
  { word: "Nutria de río", meaning: "Mamífero semiacuático de ríos y lagunas", example: "La nutria de río está en peligro por la contaminación del agua", region: "Chiapas", category: "Animales" },
  { word: "Águila arpía", meaning: "El águila más grande del mundo en las selvas mexicanas", example: "El águila arpía puede atrapar monos entre las copas de los árboles", region: "Chiapas", category: "Animales" },
  { word: "Saraguato", meaning: "Mono aullador de selva tropical cuya voz retumba", example: "El saraguato aúlla al amanecer y al atardecer en la selva chiapaneca", region: "Chiapas", category: "Animales" },
  // ── Historia ──
  { word: "Batalla de Puebla", meaning: "Victoria mexicana sobre Francia el 5 de mayo de 1862", example: "La Batalla de Puebla es el origen de la fiesta del Cinco de Mayo", region: "Puebla", category: "Historia" },
  { word: "Expropiación petrolera", meaning: "Nacionalización del petróleo por Cárdenas en 1938", example: "La Expropiación petrolera fue el acto económico más audaz del siglo XX", region: "Nacional", category: "Historia" },
  { word: "Niños Héroes", meaning: "Cadetes que murieron defendiendo el Castillo de Chapultepec", example: "Los Niños Héroes son símbolo del sacrificio patriótico en México", region: "CDMX", category: "Historia" },
  { word: "Tratado de Libre Comercio", meaning: "Acuerdo comercial entre México, EE.UU. y Canadá de 1994", example: "El Tratado de Libre Comercio transformó la economía mexicana", region: "Nacional", category: "Historia" },
  { word: "Terremoto del 85", meaning: "Sismo devastador que sacudió la Ciudad de México en 1985", example: "El Terremoto del 85 mostró la solidaridad del pueblo mexicano", region: "CDMX", category: "Historia" },
  // ── Artistas ──
  { word: "Tin Tan", meaning: "Comediante del cine de oro con personaje pachuco", example: "Tin Tan creó un humor irreverente que sigue vigente hoy", region: "CDMX", category: "Artistas" },
  { word: "Cantinflas", meaning: "Comediante y actor ícono del cine mexicano", example: "Cantinflas hizo reír al mundo con su personaje de pelado simpático", region: "CDMX", category: "Artistas" },
  { word: "Pedro Infante", meaning: "Cantante y actor símbolo del cine de oro mexicano", example: "Pedro Infante conquistó a México con su voz y su sonrisa", region: "Sinaloa", category: "Artistas" },
  { word: "María Félix", meaning: "Actriz diva del cine de oro apodada La Doña", example: "María Félix fue la mujer más poderosa del cine mexicano de su época", region: "Sonora", category: "Artistas" },
  { word: "Javier Solís", meaning: "Cantante de boleros y rancheras de voz privilegiada", example: "Javier Solís llenó las radios mexicanas con su voz de terciopelo", region: "CDMX", category: "Artistas" },
  // ── Monumentos ──
  { word: "Teotihuacán", meaning: "Complejo arqueológico con la Pirámide del Sol y la Luna", example: "Las pirámides de Teotihuacán reciben millones de visitantes al año", region: "Estado de México", category: "Monumentos" },
  { word: "Palenque", meaning: "Ciudad maya rodeada de selva con la tumba del rey Pakal", example: "Palenque alberga el templo con la tumba del rey Pakal", region: "Chiapas", category: "Monumentos" },
  { word: "Monte Albán", meaning: "Primera ciudad prehispánica de Mesoamérica", example: "Monte Albán fue el centro político y religioso de los zapotecos", region: "Oaxaca", category: "Monumentos" },
  { word: "El Tajín", meaning: "Ciudad totonaca famosa por sus nichos y el juego de pelota", example: "El Tajín tiene la pirámide de los nichos más famosa de México", region: "Veracruz", category: "Monumentos" },
  { word: "Chichén Itzá", meaning: "Ciudad maya con la pirámide de Kukulcán", example: "Chichén Itzá es una de las Siete Maravillas del Mundo Moderno", region: "Yucatán", category: "Monumentos" },
  // ── Plantas ──
  { word: "Jacaranda", meaning: "Árbol de flores moradas que florece en primavera", example: "Las jacarandas de la CDMX tiñen de morado las avenidas en marzo", region: "CDMX", category: "Plantas" },
  { word: "Laurel de India", meaning: "Árbol de sombra abundante en parques y avenidas", example: "El laurel de India del zócalo tiene raíces que levantan las banquetas", region: "CDMX", category: "Plantas" },
  { word: "Platanillo", meaning: "Planta tropical de hojas grandes similar al plátano", example: "El platanillo crece silvestre a orillas de los ríos tropicales", region: "Veracruz", category: "Plantas" },
  { word: "Chaya", meaning: "Arbusto de hojas nutritivas comido en la cocina maya", example: "La chaya en tortillas es el alimento más nutritivo de Yucatán", region: "Yucatán", category: "Plantas" },
  { word: "Pitahaya", meaning: "Cactácea trepadora de fruto rojo con pulpa blanca", example: "La pitahaya del Pacífico es dulce, refrescante y llena de semillas", region: "Jalisco", category: "Plantas" },
  // ── Tradiciones ──
  { word: "Día de Muertos", meaning: "Ofrenda y celebración del 1 y 2 de noviembre a los difuntos", example: "El Día de Muertos es Patrimonio Cultural Inmaterial de la Humanidad", region: "Todo México", category: "Tradiciones" },
  { word: "Piñata de siete picos", meaning: "Figura de barro con siete conos que representa los pecados", example: "Romper la piñata de siete picos requiere pañuelo y muchas ganas", region: "Todo México", category: "Tradiciones" },
  { word: "Lucha libre", meaning: "Deporte-espectáculo de lucha con máscaras y acrobacias", example: "La lucha libre en la Arena México es el espectáculo más emocionante", region: "CDMX", category: "Tradiciones" },
  { word: "Altar de Día de Muertos", meaning: "Ofrenda con fotografías, flores y comida del difunto", example: "El altar de Día de Muertos guía el alma de regreso al hogar", region: "Todo México", category: "Tradiciones" },
  { word: "Cempasúchil", meaning: "Flor naranja que adorna altares y caminos del Día de Muertos", example: "La flor de cempasúchil ilumina el camino de las almas cada noviembre", region: "Todo México", category: "Tradiciones" },
  // ── Modismos ──
  { word: "Agarrar el toro por los cuernos", meaning: "Enfrentar un problema directo y sin rodeos", example: "Hay que agarrar el toro por los cuernos y hablar con el jefe hoy", region: "Todo México", category: "Modismos" },
  { word: "No tener madre", meaning: "No tener vergüenza o actuar sin consideración", example: "Ese tipo no tiene madre, llegó tarde y encima protestó", region: "Todo México", category: "Modismos" },
  { word: "Estar de mala leche", meaning: "Estar de muy mal humor", example: "Hoy está de mala leche, mejor no le hables", region: "Todo México", category: "Modismos" },
  { word: "Ser un coyote", meaning: "Ser una persona astuta que aprovecha a los demás", example: "Ese señor es un coyote, te cobra el doble del precio justo", region: "Todo México", category: "Modismos" },
  { word: "Poner el dedo", meaning: "Delatar a alguien ante la autoridad", example: "Le pusieron el dedo y lo corrieron del trabajo al día siguiente", region: "Todo México", category: "Modismos" },

  // ── BLOQUE 17 ──
  // ── Comida ──
  { word: "Tlayuda de tasajo", meaning: "Tortilla grande con tasajo, frijoles y quesillo", example: "Las tlayudas de tasajo se comen extendidas sobre papel", region: "Oaxaca", category: "Comida" },
  { word: "Quesillo", meaning: "Queso de hebra oaxaqueño enrollado en bola", example: "El quesillo se derrite perfecto sobre las tlayudas", region: "Oaxaca", category: "Comida" },
  { word: "Nieve de garrafa", meaning: "Helado artesanal batido con sal y hielo en barril", example: "La nieve de garrafa de limón es el mejor antojo de verano", region: "Oaxaca", category: "Comida" },
  { word: "Elote asado", meaning: "Maíz cocido a las brasas con mayonesa y chile", example: "El elote asado del parque huele a fiesta y verano", region: "Todo México", category: "Comida" },
  { word: "Esquites", meaning: "Granos de elote con crema, chile y limón", example: "Los esquites del mercado me quemaron la lengua de tanto chile", region: "CDMX", category: "Comida" },
  // ── Juegos ──
  { word: "Caballito", meaning: "Juego de equilibrio y fuerza sobre los hombros del padre", example: "Mi papá me cargaba de caballito y yo me sentía el rey del mundo", region: "Todo México", category: "Juegos" },
  { word: "Saltar la cuerda", meaning: "Juego de saltar sobre una cuerda girada por dos personas", example: "Las niñas saltaban la cuerda cantando rimas en el recreo", region: "Todo México", category: "Juegos" },
  { word: "Mata gente", meaning: "Juego brusco de escondite con golpe al descubierto", example: "En mata gente si te agarraban te dolía el brazo un rato", region: "Todo México", category: "Juegos" },
  { word: "Pulpo", meaning: "Juego de cartas donde se busca hacer series de cuatro", example: "El pulpo es el juego de cartas más buscado en las fiestas", region: "Todo México", category: "Juegos" },
  { word: "Mímica", meaning: "Juego de mesa donde hay que adivinar palabras actuando sin hablar", example: "En mímica me tocó actuar un elefante y nadie lo adivinó", region: "Todo México", category: "Juegos" },
  // ── Música ──
  { word: "Ranchera norteña", meaning: "Estilo de canción ranchera con acordeón del norte", example: "La ranchera norteña habla de amor, traición y tequila", region: "Norte", category: "Música" },
  { word: "Son de los Altos", meaning: "Estilo musical de Los Altos de Jalisco con arpa y guitarra", example: "El son de los Altos es la raíz del mariachi moderno", region: "Jalisco", category: "Música" },
  { word: "Tamborazo zacatecano", meaning: "Conjunto norteño con tambora y platillos de Zacatecas", example: "El tamborazo zacatecano es el más potente de México", region: "Zacatecas", category: "Música" },
  { word: "Jarana yucateca", meaning: "Guitarra pequeña de ocho cuerdas de la trova yucateca", example: "La jarana yucateca acompaña la vaquería y las serenatas", region: "Yucatán", category: "Música" },
  { word: "Corridazo sinaloense", meaning: "Corrido de banda larga y dramático del noroeste", example: "El corridazo sinaloense suena a todo volumen en las pachangas", region: "Sinaloa", category: "Música" },
  // ── Animales ──
  { word: "Coyote", meaning: "Cánido salvaje muy adaptable que habita en todo México", example: "El coyote aúlla de noche en los cerros cerca de la ciudad", region: "Todo México", category: "Animales" },
  { word: "Tecolote", meaning: "Búho de mediano tamaño de ojos amarillos", example: "El tecolote canta de noche y en el pueblo dicen que trae mal presagio", region: "Todo México", category: "Animales" },
  { word: "Pez payaso mexicano", meaning: "Pez de rayas de la costa del Pacífico mexicano", example: "El pez payaso mexicano vive entre los tentáculos de la anémona", region: "Pacífico", category: "Animales" },
  { word: "Cangrejo violinista", meaning: "Crustáceo con una pinza enorme que vive en manglares", example: "El cangrejo violinista agita su gran pinza para atraer pareja", region: "Tabasco", category: "Animales" },
  { word: "Mazahua silvestre", meaning: "Venado pequeño y tímido de la sierra central mexicana", example: "El mazahua silvestre huye al menor ruido en el bosque", region: "Estado de México", category: "Animales" },
  // ── Historia ──
  { word: "Movimiento estudiantil del 68", meaning: "Protesta universitaria reprimida en Tlatelolco", example: "El movimiento estudiantil del 68 cambió la política cultural de México", region: "CDMX", category: "Historia" },
  { word: "Guerra de Reforma", meaning: "Conflicto entre liberales y conservadores 1857–1861", example: "La Guerra de Reforma consolidó las Leyes de Reforma de Juárez", region: "Nacional", category: "Historia" },
  { word: "Tratado de Bucareli", meaning: "Acuerdo entre México y EE.UU. tras la Revolución", example: "El Tratado de Bucareli reguló los intereses petroleros de los años 20", region: "Nacional", category: "Historia" },
  { word: "Matanza de Acteal", meaning: "Masacre de indígenas tzotziles en Chiapas en 1997", example: "La Matanza de Acteal sacudió la conciencia nacional e internacional", region: "Chiapas", category: "Historia" },
  { word: "Decena Trágica", meaning: "Golpe de Estado de 1913 que derrocó y asesinó a Madero", example: "La Decena Trágica fue diez días de combate en las calles de la CDMX", region: "CDMX", category: "Historia" },
  // ── Artistas ──
  { word: "Lila Downs", meaning: "Cantante oaxaqueña que fusiona géneros y lenguas indígenas", example: "Lila Downs canta en mixe, náhuatl, español e inglés con igual pasión", region: "Oaxaca", category: "Artistas" },
  { word: "Eugenia León", meaning: "Cantante intérprete de música popular y clásica mexicana", example: "Eugenia León es la voz más completa de la canción mexicana", region: "CDMX", category: "Artistas" },
  { word: "Chavela Vargas", meaning: "Cantante costarricense adoptada por México", example: "Chavela Vargas cantó rancheras como nadie, con voz de tierra y fuego", region: "CDMX", category: "Artistas" },
  { word: "Astrid Hadad", meaning: "Cantante y performera conocida como la Monstrua", example: "Astrid Hadad mezcla cabaret, crítica política y música con ingenio", region: "CDMX", category: "Artistas" },
  { word: "Ofelia Medina", meaning: "Actriz comprometida con causas sociales y ambientales", example: "Ofelia Medina interpretó a Frida Kahlo antes que nadie en teatro", region: "CDMX", category: "Artistas" },
  // ── Monumentos ──
  { word: "Puente Baluarte", meaning: "El puente atirantado más alto del mundo en la Sierra Madre", example: "El Puente Baluarte tiene torres de más de cuatrocientos metros de altura", region: "Sinaloa", category: "Monumentos" },
  { word: "Museo Soumaya", meaning: "Edificio de fachada hexagonal con arte universal", example: "El Museo Soumaya guarda la colección privada más grande de México", region: "CDMX", category: "Monumentos" },
  { word: "Centro Histórico de Oaxaca", meaning: "Conjunto urbano colonial declarado Patrimonio Mundial", example: "El Centro Histórico de Oaxaca combina piedra verde y cultura viva", region: "Oaxaca", category: "Monumentos" },
  { word: "Malecón de La Paz", meaning: "Paseo marítimo frente al mar de Cortés", example: "El Malecón de La Paz es el lugar favorito para ver el atardecer", region: "Baja California Sur", category: "Monumentos" },
  { word: "Fuerte de San Felipe de Bacalar", meaning: "Fortaleza del siglo XVII junto a la Laguna de Bacalar", example: "El Fuerte de San Felipe protegió Bacalar de los piratas del Caribe", region: "Quintana Roo", category: "Monumentos" },
  // ── Plantas ──
  { word: "Xoconostle", meaning: "Tuna agria del nopal que se usa en guisos y mermeladas", example: "El xoconostle le da acidez al mole de olla del centro", region: "Centro", category: "Plantas" },
  { word: "Chicalote", meaning: "Planta silvestre espinosa con flor blanca y látex analgésico", example: "El chicalote se usaba para calmar el dolor de muelas", region: "Todo México", category: "Plantas" },
  { word: "Toronjil", meaning: "Hierba aromática usada en té para calmar los nervios", example: "El toronjil en infusión ayuda a conciliar el sueño", region: "Todo México", category: "Plantas" },
  { word: "Guayabo", meaning: "Árbol tropical de fruto verde y pulpa blanca o rosa", example: "El guayabo del patio daba guayabas en octubre y llenábamos cubetas", region: "Todo México", category: "Plantas" },
  { word: "Palma real mexicana", meaning: "Palmera nativa del sureste de tronco recto y majestuoso", example: "La palma real mexicana llega a medir hasta veinte metros de altura", region: "Veracruz", category: "Plantas" },
  // ── Tradiciones ──
  { word: "Vela istmeña", meaning: "Gran fiesta zapoteca con traje regional y baile toda la noche", example: "Las velas istmeñas duran dos días con sus noches de baile y mole", region: "Oaxaca", category: "Tradiciones" },
  { word: "Danza de Moros y Cristianos", meaning: "Representación teatral de la batalla medieval en pueblos", example: "La danza de Moros y Cristianos se hace en fiestas patronales del Bajío", region: "Bajío", category: "Tradiciones" },
  { word: "Peregrinación guadalupana", meaning: "Caminata de miles de feligreses a la Basílica cada diciembre", example: "La peregrinación guadalupana llega a sumar millones de peregrinos", region: "CDMX", category: "Tradiciones" },
  { word: "Quema de Judas", meaning: "Ritual de quemar figuras de cartón el Sábado de Gloria", example: "La quema de Judas llenó de luz y truenos las calles del barrio", region: "CDMX", category: "Tradiciones" },
  { word: "Danza de la Pluma", meaning: "Danza zapoteca que recrea la Conquista con penachos enormes", example: "La Danza de la Pluma en Teotitlán del Valle dura horas enteras", region: "Oaxaca", category: "Tradiciones" },
  // ── Modismos ──
  { word: "Traer entre ojos", meaning: "Tenerle manía o mala voluntad a alguien", example: "Me trae entre ojos desde que llegué a la empresa", region: "Todo México", category: "Modismos" },
  { word: "Quedarse plantado", meaning: "Ser abandonado en un lugar donde se esperaba a alguien", example: "Me dejó plantado dos horas en el café sin avisar", region: "Todo México", category: "Modismos" },
  { word: "Llevar el gato al agua", meaning: "Lograr algo difícil contra todo pronóstico", example: "Al final logramos llevar el gato al agua y firmamos el contrato", region: "Todo México", category: "Modismos" },
  { word: "Estar en el quinto sueño", meaning: "Estar en un lugar muy lejano o inaccesible", example: "Vive en el quinto sueño, tarda una hora en llegar al metro", region: "Todo México", category: "Modismos" },
  { word: "Dar lata", meaning: "Molestar o importunar sin parar", example: "No des lata y deja que los adultos hablen en paz", region: "Todo México", category: "Modismos" },

  // ── BLOQUE 18 ──
  // ── Comida ──
  { word: "Torta ahogada", meaning: "Birote relleno de carne sumergido en salsa picante", example: "La torta ahogada de Guadalajara se come sin miedo al chile", region: "Jalisco", category: "Comida" },
  { word: "Pambazo", meaning: "Pan bañado en salsa guajillo relleno de papa con chorizo", example: "El pambazo es el mejor antojo callejero de la CDMX", region: "CDMX", category: "Comida" },
  { word: "Michelada", meaning: "Cerveza con limón, sal, salsas y chile en vaso escarolado", example: "La michelada bien preparada es el desayuno del valiente", region: "Todo México", category: "Comida" },
  { word: "Caldo xóchitl", meaning: "Sopa con pollo, arroz y chile jalapeño", example: "El caldo xóchitl se sirve con aguacate y tortillas recién hechas", region: "CDMX", category: "Comida" },
  { word: "Machaca norteña", meaning: "Carne seca de res desmenuzada guisada con huevo", example: "La machaca norteña con huevo es el desayuno favorito del ranchero", region: "Norte", category: "Comida" },
  // ── Juegos ──
  { word: "Crucigrama", meaning: "Juego de palabras cruzadas con definiciones", example: "Los domingos resuelvo el crucigrama del periódico con café", region: "Todo México", category: "Juegos" },
  { word: "Sopa de letras", meaning: "Pasatiempo de encontrar palabras ocultas en cuadrícula", example: "Encontré todas las palabras de la sopa de letras en diez minutos", region: "Todo México", category: "Juegos" },
  { word: "Laberinto de papel", meaning: "Pasatiempo de trazar caminos en laberintos impresos", example: "El laberinto de papel del periódico era mi favorito en los viajes", region: "Todo México", category: "Juegos" },
  { word: "Tangram", meaning: "Rompecabezas de siete piezas geométricas para armar figuras", example: "El tangram con figuras prehispánicas viene en madera tallada", region: "Todo México", category: "Juegos" },
  { word: "Turista", meaning: "Juego de tablero de compra de propiedades y renta", example: "Jugamos turista y mi hermano compró toda la sección rosa", region: "Todo México", category: "Juegos" },
  // ── Música ──
  { word: "Balada romántica mexicana", meaning: "Canción de amor lenta con orquesta y voz melismática", example: "La balada romántica mexicana de los ochenta sigue sonando en la radio", region: "Todo México", category: "Música" },
  { word: "Rap en náhuatl", meaning: "Fusión de hip-hop con lengua indígena mexicana", example: "El rap en náhuatl de los jóvenes indígenas conquista las redes", region: "Centro", category: "Música" },
  { word: "Electrónica mexica", meaning: "Música electrónica con samples y ritmos prehispánicos", example: "La electrónica mexica mezcla los tambores del Templo Mayor con el sintetizador", region: "CDMX", category: "Música" },
  { word: "Norteño de tuba", meaning: "Variante del norteño con tuba en lugar de bajo sexto", example: "El norteño de tuba tiene un sonido grave y potente inconfundible", region: "Sonora", category: "Música" },
  { word: "Contradanza yucateca", meaning: "Baile de salón de origen europeo adaptado en Yucatán", example: "La contradanza yucateca se baila en los salones del Paseo de Montejo", region: "Yucatán", category: "Música" },
  // ── Animales ──
  { word: "Berrendo", meaning: "Antílope norteamericano de las llanuras del norte", example: "El berrendo es el mamífero terrestre más rápido de América del Norte", region: "Chihuahua", category: "Animales" },
  { word: "Gato montés", meaning: "Felino pequeño y sigiloso de bosques y matorrales", example: "El gato montés caza roedores de noche en la sierra", region: "Todo México", category: "Animales" },
  { word: "Cotorra serrana", meaning: "Perico verde endémico de la Sierra Madre Occidental", example: "La cotorra serrana vuela en parvadas sobre los pinares del norte", region: "Chihuahua", category: "Animales" },
  { word: "Vaquita marina", meaning: "El cetáceo más pequeño y en mayor peligro de extinción", example: "Solo quedan unos pocos individuos de la vaquita marina en el mundo", region: "Baja California", category: "Animales" },
  { word: "Toro de lidia", meaning: "Bovino criado para las corridas de toros", example: "El toro de lidia es seleccionado por su bravura y fuerza", region: "Todo México", category: "Animales" },
  // ── Historia ──
  { word: "Matrícula de Tributos", meaning: "Códice azteca que registra los impuestos del Imperio", example: "La Matrícula de Tributos muestra la riqueza del Imperio Azteca", region: "Nacional", category: "Historia" },
  { word: "Fundación de Tenochtitlán", meaning: "Establecimiento de la capital azteca en 1325", example: "La Fundación de Tenochtitlán se celebra cada 13 de marzo", region: "CDMX", category: "Historia" },
  { word: "Conquista espiritual", meaning: "Evangelización forzosa de los pueblos indígenas", example: "La conquista espiritual borró muchas lenguas y rituales prehispánicos", region: "Nacional", category: "Historia" },
  { word: "Ley Lerdo", meaning: "Reforma de 1856 que desamortizó bienes de la Iglesia", example: "La Ley Lerdo cambió la propiedad de la tierra en México para siempre", region: "Nacional", category: "Historia" },
  { word: "Rebelión de los Coras", meaning: "Última resistencia indígena al dominio español en 1722", example: "La Rebelión de los Coras ocurrió en la sierra de Nayarit", region: "Nayarit", category: "Historia" },
  // ── Artistas ──
  { word: "Toña la Negra", meaning: "Cantante veracruzana reina del bolero afroantillano", example: "Toña la Negra interpretó boleros con una sensualidad única", region: "Veracruz", category: "Artistas" },
  { word: "Lucha Reyes", meaning: "Cantante de corridos y canciones bravías del siglo XX", example: "Lucha Reyes cantó con pasión desgarradora hasta el final de su vida", region: "Jalisco", category: "Artistas" },
  { word: "Joaquín Pardavé", meaning: "Actor, cantante y director del cine de oro", example: "Joaquín Pardavé creó personajes cómicos y tiernos que el público adoró", region: "Guanajuato", category: "Artistas" },
  { word: "Sara García", meaning: "Actriz conocida como la abuelita del cine mexicano", example: "Sara García representó a la abuela mexicana con amor y autoridad", region: "CDMX", category: "Artistas" },
  { word: "Amparo Montes", meaning: "Cantante ícono del bolero y la guaracha en México", example: "Amparo Montes llenó el Salón Los Ángeles por décadas", region: "CDMX", category: "Artistas" },
  // ── Monumentos ──
  { word: "Reserva Sian Ka'an", meaning: "Reserva natural en Quintana Roo declarada Patrimonio Mundial", example: "Sian Ka'an alberga ecosistemas únicos de selva, laguna y arrecife", region: "Quintana Roo", category: "Monumentos" },
  { word: "Tula", meaning: "Capital tolteca con atlantes gigantes de piedra", example: "Los atlantes de Tula vigilaron el templo de Quetzalcóatl por siglos", region: "Hidalgo", category: "Monumentos" },
  { word: "Lago de Chapala", meaning: "El lago natural más grande de México", example: "El Lago de Chapala es fuente de agua y vida para millones de jaliscienses", region: "Jalisco", category: "Monumentos" },
  { word: "Catedral de Zacatecas", meaning: "Catedral barroca churrigueresca del siglo XVIII", example: "La Catedral de Zacatecas es la joya del barroco novohispano del norte", region: "Zacatecas", category: "Monumentos" },
  { word: "Grutas de Cacahuamilpa", meaning: "Sistema de cavernas entre Guerrero y Morelos", example: "Las Grutas de Cacahuamilpa tienen salones de hasta 80 metros de altura", region: "Guerrero", category: "Monumentos" },
  // ── Plantas ──
  { word: "Semilla de chía", meaning: "Semilla pequeña rica en omega-3 de la planta Salvia hispanica", example: "La semilla de chía fue alimento sagrado de los aztecas en guerra", region: "Centro", category: "Plantas" },
  { word: "Floripondio", meaning: "Arbusto de grandes flores en forma de trompeta", example: "El floripondio es venenoso pero de una belleza inigualable", region: "Sur", category: "Plantas" },
  { word: "Arrayán", meaning: "Árbol de corteza lisa multicolor que crece junto al agua", example: "Los arrayanes de Pátzcuaro tienen troncos retorcidos y plateados", region: "Michoacán", category: "Plantas" },
  { word: "Mezquite", meaning: "Árbol leguminoso de zonas áridas con vaina comestible", example: "El mezquite soporta la sequía y da sombra en el desierto norteño", region: "Norte", category: "Plantas" },
  { word: "Cachanilla", meaning: "Planta nativa de Baja California símbolo del estado", example: "La cachanilla crece silvestre en el Valle de Mexicali", region: "Baja California", category: "Plantas" },
  // ── Tradiciones ──
  { word: "Semana Santa en Taxco", meaning: "Procesiones nocturnas de penitentes encapuchados", example: "La Semana Santa en Taxco es la más dramática e impresionante del país", region: "Guerrero", category: "Tradiciones" },
  { word: "Feria Internacional del Libro de Guadalajara", meaning: "La mayor feria editorial de habla hispana", example: "La FIL de Guadalajara reúne editores de todo el mundo en noviembre", region: "Jalisco", category: "Tradiciones" },
  { word: "Tianguis", meaning: "Mercado ambulante que se instala en distintos lugares cada día", example: "En el tianguis del martes consigo todo más barato que en el súper", region: "Todo México", category: "Tradiciones" },
  { word: "Día del Niño", meaning: "Celebración del 30 de abril con juegos y regalos", example: "En el Día del Niño la escuela organizó una kermés con juegos", region: "Todo México", category: "Tradiciones" },
  { word: "Desfile del 20 de noviembre", meaning: "Marcha conmemorativa de la Revolución Mexicana", example: "El desfile del 20 de noviembre recorre el Paseo de la Reforma", region: "CDMX", category: "Tradiciones" },
  // ── Modismos ──
  { word: "Mandar al diablo", meaning: "Rechazar o ignorar a alguien con enojo", example: "Cuando me dijo eso lo mandé al diablo sin pensarlo dos veces", region: "Todo México", category: "Modismos" },
  { word: "Tener el sartén por el mango", meaning: "Tener el control total de una situación", example: "Ella tiene el sartén por el mango en esa empresa", region: "Todo México", category: "Modismos" },
  { word: "Estar en las últimas", meaning: "Estar casi sin dinero o muy mal de salud", example: "Está en las últimas, ya ni para el camión le alcanza", region: "Todo México", category: "Modismos" },
  { word: "Costar un ojo de la cara", meaning: "Ser muy caro o tener un precio exorbitante", example: "Ese departamento cuesta un ojo de la cara en la Condesa", region: "Todo México", category: "Modismos" },
  { word: "No dar pie con bola", meaning: "No acertar en nada o equivocarse constantemente", example: "Hoy no doy pie con bola, ya me equivoqué tres veces", region: "Todo México", category: "Modismos" },

  // ── BLOQUE 19 ──
  // ── Comida ──
  { word: "Carnitas michoacanas", meaning: "Cerdo frito en su propia manteca al estilo Michoacán", example: "Las carnitas michoacanas de Quiroga son las mejores del mundo", region: "Michoacán", category: "Comida" },
  { word: "Gorditas de maíz azul", meaning: "Tortilla gruesa de maíz azul rellena de guiso", example: "Las gorditas de maíz azul del mercado de Tlatelolco son únicas", region: "CDMX", category: "Comida" },
  { word: "Tejuino", meaning: "Bebida fermentada de maíz con limón y sal de Jalisco", example: "El tejuino frío con nieve de limón es el alivio en verano", region: "Jalisco", category: "Comida" },
  { word: "Tostadas de ceviche", meaning: "Tortilla crujiente con ceviche fresco encima", example: "Las tostadas de ceviche de camarón son el antojo de playa", region: "Sinaloa", category: "Comida" },
  { word: "Papas con chile", meaning: "Papas fritas con chamoy, limón y chile en polvo", example: "Las papas con chile del puesto de la esquina son adictivas", region: "Todo México", category: "Comida" },
  // ── Juegos ──
  { word: "Metras", meaning: "Canicas de barro cocido más pequeñas y baratas", example: "Las metras de barro eran las que perdía en cada recreo", region: "Todo México", category: "Juegos" },
  { word: "La víbora de la mar", meaning: "Juego infantil donde dos forman un arco y atrapan niños", example: "Jugamos a la víbora de la mar en el jardín de niños", region: "Todo México", category: "Juegos" },
  { word: "Bingo popular", meaning: "Juego de números cantados en cartones de cinco por cinco", example: "En el bingo popular del club social gané una licuadora", region: "Todo México", category: "Juegos" },
  { word: "Juego de manos", meaning: "Secuencias rítmicas de palmadas entre dos personas", example: "Mi prima y yo teníamos un juego de manos muy difícil", region: "Todo México", category: "Juegos" },
  { word: "El florón", meaning: "Juego infantil de adivinar quién tiene el objeto escondido", example: "En el florón yo siempre escondía el objeto debajo de la mano", region: "Todo México", category: "Juegos" },
  // ── Música ──
  { word: "Pirekua", meaning: "Canto tradicional p'urhépecha declarado Patrimonio de la Humanidad", example: "La pirekua narra el paisaje del lago de Pátzcuaro en versos", region: "Michoacán", category: "Música" },
  { word: "Música purépecha", meaning: "Tradición musical del pueblo p'urhépecha de Michoacán", example: "La música purépecha suena en las noches de pirekua junto al lago", region: "Michoacán", category: "Música" },
  { word: "Son de tarima zacatecano", meaning: "Variante regional del son con tarima en Zacatecas", example: "El son de tarima zacatecano se baila en las bodas del campo", region: "Zacatecas", category: "Música" },
  { word: "Pasodoble charro", meaning: "Ritmo español adaptado a los pasos de la charreada", example: "El pasodoble charro suena cuando el jinete entra a la arena", region: "Todo México", category: "Música" },
  { word: "Música de cuerdas oaxaqueña", meaning: "Agrupación de instrumentos de cuerda de tradición zapoteca", example: "La música de cuerdas oaxaqueña acompaña las bodas del pueblo", region: "Oaxaca", category: "Música" },
  // ── Animales ──
  { word: "Boa constrictor", meaning: "Serpiente grande no venenosa que mata por constricción", example: "La boa constrictor puede llegar a medir cuatro metros de largo", region: "Veracruz", category: "Animales" },
  { word: "Bagre de río", meaning: "Pez de río sin escamas y con bigotes largos", example: "El bagre de río se pesca de noche con anzuelo en el Balsas", region: "Guerrero", category: "Animales" },
  { word: "Tortuga de carey", meaning: "Tortuga marina de caparazón moteado en peligro de extinción", example: "La tortuga de carey anida en las playas del Caribe mexicano", region: "Quintana Roo", category: "Animales" },
  { word: "Mono saraguato negro", meaning: "Primate de color oscuro cuyo rugido resuena en la selva", example: "El mono saraguato negro es el primate más ruidoso de América", region: "Chiapas", category: "Animales" },
  { word: "Robalo veracruzano", meaning: "Pez marino de carne blanca muy apreciado en el Golfo", example: "El robalo a la veracruzana es el platillo estrella del puerto", region: "Veracruz", category: "Animales" },
  // ── Historia ──
  { word: "Primer Imperio Mexicano", meaning: "Monarquía de Iturbide tras la Independencia 1821–1823", example: "El Primer Imperio Mexicano duró menos de dos años antes de caer", region: "Nacional", category: "Historia" },
  { word: "República Restaurada", meaning: "Período de 1867 a 1876 tras la caída del Imperio", example: "La República Restaurada fue la época de mayor actividad de Juárez", region: "Nacional", category: "Historia" },
  { word: "Porfiriato", meaning: "Período de gobierno de Porfirio Díaz de 1876 a 1910", example: "El Porfiriato modernizó México pero creó una enorme desigualdad", region: "Nacional", category: "Historia" },
  { word: "Reparto agrario cardenista", meaning: "Distribución masiva de tierras entre 1934 y 1940", example: "El reparto agrario cardenista benefició a millones de campesinos", region: "Nacional", category: "Historia" },
  { word: "Mercado de Tlatelolco", meaning: "Gran mercado prehispánico del norte de Tenochtitlán", example: "El mercado de Tlatelolco asombró a los conquistadores por su tamaño", region: "CDMX", category: "Historia" },
  // ── Artistas ──
  { word: "Ana Gabriel", meaning: "Cantante sinaloense de pop y ranchera con gran voz", example: "Ana Gabriel llena estadios con su voz inconfundible", region: "Sinaloa", category: "Artistas" },
  { word: "Juan Gabriel", meaning: "Compositor y cantante ícono de la música popular mexicana", example: "Juan Gabriel llenó el Palacio de Bellas Artes siendo cantante popular", region: "Chihuahua", category: "Artistas" },
  { word: "Vicente Fernández", meaning: "El rey de la música ranchera del siglo XX", example: "Vicente Fernández cantó Volver volver con el alma entera", region: "Jalisco", category: "Artistas" },
  { word: "José Alfredo Jiménez", meaning: "Compositor de canciones rancheras eternas", example: "José Alfredo Jiménez escribió más de mil canciones que el mundo canta", region: "Guanajuato", category: "Artistas" },
  { word: "Bola de Nieve", meaning: "Pianista y cantante cubano adoptado por México", example: "Bola de Nieve interpretó sus canciones con picardía única", region: "CDMX", category: "Artistas" },
  // ── Monumentos ──
  { word: "Bonampak", meaning: "Ciudad maya con murales policromos únicos", example: "Los murales de Bonampak son los mejor conservados de toda Mesoamérica", region: "Chiapas", category: "Monumentos" },
  { word: "Palacio de Minería", meaning: "Edificio neoclásico del siglo XVIII en el centro de la CDMX", example: "El Palacio de Minería fue la primera escuela de ingeniería de América", region: "CDMX", category: "Monumentos" },
  { word: "Hacienda de Jaral de Berrio", meaning: "Hacienda pulquera del siglo XVII en Guanajuato", example: "La Hacienda de Jaral de Berrio fue la mayor productora de pulque del mundo", region: "Guanajuato", category: "Monumentos" },
  { word: "Reserva El Pinacate", meaning: "Desierto volcánico de cráteres y dunas en Sonora", example: "El Pinacate alberga cráteres volcánicos y dunas de arena blanca", region: "Sonora", category: "Monumentos" },
  { word: "Bahía de los Ángeles", meaning: "Bahía del Mar de Cortés rodeada de islas y tiburones ballena", example: "La Bahía de los Ángeles es paraíso para buzos y naturalistas", region: "Baja California", category: "Monumentos" },
  // ── Plantas ──
  { word: "Tepozán", meaning: "Arbusto medicinal de flores blancas del altiplano", example: "El tepozán en té alivia la fiebre y la tos desde tiempos prehispánicos", region: "Centro", category: "Plantas" },
  { word: "Muitle", meaning: "Arbusto de hojas moradas usado para teñir y curar", example: "El muitle se usa en tintes artesanales y remedios populares", region: "Oaxaca", category: "Plantas" },
  { word: "Achiote", meaning: "Planta tropical de semillas rojas usadas para colorear", example: "El achiote da el color rojo característico a la cochinita pibil", region: "Yucatán", category: "Plantas" },
  { word: "Cuernito de venado", meaning: "Cactus columnar que asemeja cuernos de venado", example: "Los cuernitos de venado adornan los jardines desérticos del norte", region: "Norte", category: "Plantas" },
  { word: "Jobo", meaning: "Árbol tropical de fruto amarillo agridulce comestible", example: "El jobo silvestre da frutos en temporada de lluvias en Veracruz", region: "Veracruz", category: "Plantas" },
  // ── Tradiciones ──
  { word: "Danza de los Zancos", meaning: "Baile tradicional sobre zancos en fiestas del Istmo", example: "Los danzantes de zancos alcanzan alturas increíbles en Tehuantepec", region: "Oaxaca", category: "Tradiciones" },
  { word: "Fiesta de la Vendimia", meaning: "Celebración de la cosecha de uva en Baja California", example: "La Fiesta de la Vendimia en el Valle de Guadalupe dura todo el verano", region: "Baja California", category: "Tradiciones" },
  { word: "Carnaval de Mazatlán", meaning: "Festejo previo a Cuaresma con reyes y batallas de flores", example: "El Carnaval de Mazatlán es el tercero más grande del mundo", region: "Sinaloa", category: "Tradiciones" },
  { word: "Día de la Madre", meaning: "Celebración del 10 de mayo más sentida que en ningún otro país", example: "El 10 de mayo los mariachis no paran de tocar en todas las colonias", region: "Todo México", category: "Tradiciones" },
  { word: "Procesión del Corpus Christi", meaning: "Desfile eucarístico con niños disfrazados de diversas regiones", example: "En Corpus Christi los niños desfilan vestidos de diferentes regiones", region: "Todo México", category: "Tradiciones" },
  // ── Modismos ──
  { word: "Sacar de quicio", meaning: "Sacar de sus casillas o hacer perder la paciencia", example: "Ese ruido me saca de quicio cuando intento concentrarme", region: "Todo México", category: "Modismos" },
  { word: "Ir al grano", meaning: "Hablar directamente sin rodeos ni preámbulos", example: "Ve al grano, no tengo tiempo para tantos rodeos", region: "Todo México", category: "Modismos" },
  { word: "Estar hasta el tope", meaning: "Estar completamente lleno o saturado", example: "El metro va hasta el tope en hora pico", region: "Todo México", category: "Modismos" },
  { word: "Hacer su agosto", meaning: "Ganar mucho dinero aprovechando una oportunidad", example: "Con las lluvias, los paragüeros hicieron su agosto en el centro", region: "Todo México", category: "Modismos" },
  { word: "Tomar el pelo", meaning: "Burlarse de alguien o engañarlo con gracia", example: "Me estás tomando el pelo, eso no puede ser verdad", region: "Todo México", category: "Modismos" },

  // ── BLOQUE 20 ──
  // ── Comida ──
  { word: "Tacos de barbacoa", meaning: "Tacos de carne de res cocida en hoyo bajo tierra", example: "Los tacos de barbacoa del domingo son sagrados en mi familia", region: "Hidalgo", category: "Comida" },
  { word: "Chilaquiles verdes", meaning: "Tortilla frita bañada en salsa verde con crema y queso", example: "Los chilaquiles verdes del desayuno me curan todo", region: "Todo México", category: "Comida" },
  { word: "Tamales de dulce", meaning: "Tamales rosados con pasas y coco en masa dulce", example: "Los tamales de dulce son el favorito de los niños en las posadas", region: "Todo México", category: "Comida" },
  { word: "Sopa de tortilla", meaning: "Caldo de jitomate con tiras de tortilla y crema", example: "La sopa de tortilla con queso y chile pasilla es perfecta para el frío", region: "CDMX", category: "Comida" },
  { word: "Chongos zamoranos", meaning: "Postre de leche cuajada con canela y piloncillo", example: "Los chongos zamoranos son el postre más delicado de Michoacán", region: "Michoacán", category: "Comida" },
  // ── Juegos ──
  { word: "Juego de las sillas", meaning: "Competencia musical donde sobra una silla cada ronda", example: "En el juego de las sillas me quedé sin silla a la primera", region: "Todo México", category: "Juegos" },
  { word: "La traes", meaning: "Juego de persecución donde quien toca pasa la maldición", example: "El recreo completo lo pasamos jugando la traes en el patio", region: "Todo México", category: "Juegos" },
  { word: "Escondidillas", meaning: "Versión simplificada del escondite para niños pequeños", example: "Las escondidillas eran el juego favorito de los más chiquitos", region: "Todo México", category: "Juegos" },
  { word: "Dados", meaning: "Juego de azar con cubos numerados del uno al seis", example: "Jugamos dados toda la tarde y nadie sacó el doble seis", region: "Todo México", category: "Juegos" },
  { word: "Competencia de trompos", meaning: "Torneo donde se mide quién hace girar el trompo más tiempo", example: "Gané la competencia de trompos en la kermés del barrio", region: "Todo México", category: "Juegos" },
  // ── Música ──
  { word: "Punk mexicano", meaning: "Subgénero del punk con letras políticas en español", example: "El punk mexicano de los ochenta protestaba contra el sistema", region: "CDMX", category: "Música" },
  { word: "Metal extremo mexicano", meaning: "Géneros de metal pesado con vocalistas guturales", example: "El metal extremo mexicano tiene bandas reconocidas en Europa", region: "CDMX", category: "Música" },
  { word: "Trova nueva chiapaneca", meaning: "Canción de autor con temas sociales e indígenas", example: "La trova nueva chiapaneca denuncia la injusticia con poesía", region: "Chiapas", category: "Música" },
  { word: "Jarabe nacional", meaning: "Baile folclórico oficial de México con múltiples sones", example: "El jarabe nacional combina ritmos de distintas regiones en un solo baile", region: "Jalisco", category: "Música" },
  { word: "Ópera en náhuatl", meaning: "Composición operística con libreto en lengua indígena", example: "La ópera en náhuatl combina la tradición clásica con el mundo prehispánico", region: "CDMX", category: "Música" },
  // ── Animales ──
  { word: "Camarón de río", meaning: "Crustáceo de agua dulce de ríos tropicales mexicanos", example: "El camarón de río guisado con chile es manjar en la Sierra", region: "Guerrero", category: "Animales" },
  { word: "Pato cuchara", meaning: "Pato de pico ancho y plano que filtra el agua", example: "El pato cuchara inverna en los lagos del Altiplano mexicano", region: "Centro", category: "Animales" },
  { word: "Lechuza llanera", meaning: "Búho pequeño que anida en madrigueras del suelo", example: "La lechuza llanera vive en colonias en los pastizales del norte", region: "Norte", category: "Animales" },
  { word: "Salamandra del Nevado", meaning: "Anfibio endémico de las alturas del Nevado de Toluca", example: "La salamandra del Nevado solo vive en ese volcán y está en peligro", region: "Estado de México", category: "Animales" },
  { word: "Caracol panocha", meaning: "Molusco marino de concha rosada del Pacífico sur", example: "El caracol panocha se recoge en las playas de Oaxaca en temporada", region: "Oaxaca", category: "Animales" },
  // ── Historia ──
  { word: "Conquista de Tenochtitlán", meaning: "Caída de la capital azteca ante Cortés en 1521", example: "La Conquista de Tenochtitlán marcó el fin del Imperio Azteca", region: "CDMX", category: "Historia" },
  { word: "Acta de Independencia de México", meaning: "Documento firmado el 28 de septiembre de 1821", example: "El Acta de Independencia de México puso fin al dominio español", region: "Nacional", category: "Historia" },
  { word: "Caste de la Nueva Galicia", meaning: "Mayor rebelión indígena del siglo XVI en el occidente", example: "La Caste de la Nueva Galicia fue la mayor rebelión indígena del norte", region: "Jalisco", category: "Historia" },
  { word: "Época de Oro del cine mexicano", meaning: "Período de apogeo cinematográfico de 1936 a 1969", example: "La Época de Oro del cine mexicano produjo películas vistas en todo el mundo", region: "CDMX", category: "Historia" },
  { word: "Llegada de los españoles", meaning: "Arribo de las naves de Cortés a las costas de México en 1519", example: "La llegada de los españoles a Veracruz cambió para siempre la historia", region: "Nacional", category: "Historia" },
  // ── Artistas ──
  { word: "Nellie Campobello", meaning: "Escritora y bailarina que narró la Revolución de primera mano", example: "Nellie Campobello fue la única mujer en escribir sobre Villa de primera mano", region: "Chihuahua", category: "Artistas" },
  { word: "Jaime Torres Bodet", meaning: "Poeta y Secretario de Educación del siglo XX", example: "Jaime Torres Bodet impulsó el alfabetismo en México con campañas nacionales", region: "CDMX", category: "Artistas" },
  { word: "Margarita Michelena", meaning: "Poetisa y diplomática mexicana del siglo XX", example: "Margarita Michelena escribió versos que exploran el amor y la soledad", region: "Hidalgo", category: "Artistas" },
  { word: "Héctor García", meaning: "Fotógrafo documentalista de la vida urbana del siglo XX", example: "Héctor García fotografió el alma de la Ciudad de México con su lente", region: "CDMX", category: "Artistas" },
  { word: "Paco Malgesto", meaning: "Narrador deportivo y animador de la radio y televisión", example: "Paco Malgesto narró los mejores momentos del deporte mexicano", region: "CDMX", category: "Artistas" },
  // ── Monumentos ──
  { word: "Uxmal", meaning: "Ciudad maya con el Cuadrángulo de las Monjas en Yucatán", example: "Uxmal es ejemplo del estilo Puuc y Patrimonio de la Humanidad", region: "Yucatán", category: "Monumentos" },
  { word: "Museo del Templo Mayor", meaning: "Museo sobre las ruinas del centro ceremonial azteca", example: "El Museo del Templo Mayor guarda la Piedra del Sol y miles de piezas", region: "CDMX", category: "Monumentos" },
  { word: "Isla de Janitzio", meaning: "Isla en el lago de Pátzcuaro famosa por el Día de Muertos", example: "La Isla de Janitzio ilumina el lago con velas cada Día de Muertos", region: "Michoacán", category: "Monumentos" },
  { word: "Yagul", meaning: "Ciudad zapoteca con juego de pelota y tumbas rupestres", example: "Yagul está rodeada de pitayos y tiene una vista impresionante del valle", region: "Oaxaca", category: "Monumentos" },
  { word: "Cascadas de Agua Azul", meaning: "Cataratas turquesas entre la selva chiapaneca", example: "Las Cascadas de Agua Azul forman pozas de color turquesa increíble", region: "Chiapas", category: "Monumentos" },
  // ── Plantas ──
  { word: "Hierba santa", meaning: "Planta de hojas grandes con aroma a anís usada en cocina", example: "La hierba santa envuelve el pescado en tamales de Oaxaca", region: "Oaxaca", category: "Plantas" },
  { word: "Zapote negro", meaning: "Árbol de fruto negro con pulpa dulce parecida al chocolate", example: "El zapote negro con naranja y azúcar es un postre único en Oaxaca", region: "Oaxaca", category: "Plantas" },
  { word: "Madroño", meaning: "Árbol de corteza rojiza y frutos rojos del bosque templado", example: "El madroño del bosque de pinos da frutos en invierno", region: "Sierra Madre", category: "Plantas" },
  { word: "Palmilla", meaning: "Planta del desierto de hojas rígidas y flores blancas", example: "La palmilla crece en el Chihuahua árido y es refugio de serpientes", region: "Chihuahua", category: "Plantas" },
  { word: "Sauce llorón", meaning: "Árbol de ramas colgantes junto a ríos y parques", example: "El sauce llorón del parque Alameda da sombra a los enamorados", region: "CDMX", category: "Plantas" },
  // ── Tradiciones ──
  { word: "Fiestas de Octubre de Guadalajara", meaning: "Festival cultural y artístico de la capital tapatía", example: "Las Fiestas de Octubre reúnen a millones en Guadalajara cada año", region: "Jalisco", category: "Tradiciones" },
  { word: "Festival Internacional Cervantino", meaning: "Encuentro artístico internacional en Guanajuato", example: "El Festival Cervantino es uno de los más importantes de América Latina", region: "Guanajuato", category: "Tradiciones" },
  { word: "Danza de los Tejorones", meaning: "Danza burlesca de Oaxaca con personajes enmascarados", example: "Los tejorones bailan y bromean con el público en las fiestas zapotecas", region: "Oaxaca", category: "Tradiciones" },
  { word: "Charreada", meaning: "Deporte ecuestre mexicano declarado Patrimonio de la Humanidad", example: "La charreada es el deporte nacional de México desde 1933", region: "Jalisco", category: "Tradiciones" },
  { word: "Pesca de trucha arcoíris", meaning: "Tradición recreativa en ríos de montaña mexicanos", example: "La pesca de trucha arcoíris en la Sierra Norte es deporte y descanso", region: "Puebla", category: "Tradiciones" },
  // ── Modismos ──
  { word: "Ponerse las pilas", meaning: "Esforzarse, animarse o activarse para hacer algo", example: "Ponte las pilas o te van a dejar sin trabajo", region: "Todo México", category: "Modismos" },
  { word: "Estar al alba", meaning: "Estar muy atento y listo para cualquier situación", example: "Hay que estar al alba porque el examen es sin consulta", region: "Todo México", category: "Modismos" },
  { word: "Agarrar la onda", meaning: "Entender el humor o la situación de un grupo", example: "Ya le agarró la onda al equipo y trabaja perfecto con todos", region: "Todo México", category: "Modismos" },
  { word: "Dar en el clavo", meaning: "Acertar exactamente en lo que se buscaba", example: "Le diste en el clavo, ese era exactamente el problema", region: "Todo México", category: "Modismos" },
  { word: "Qué onda", meaning: "Saludo informal o pregunta sobre el estado de alguien", example: "Qué onda, compa, ¿cómo te fue en el examen?", region: "Todo México", category: "Modismos" },

];

export const seedWords1000 = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("words").collect();
    const existingSet = new Set(existing.map((w) => w.word.toLowerCase()));
    let added = 0;
    const skipped: string[] = [];

    for (const entry of NEW_WORDS) {
      if (!existingSet.has(entry.word.toLowerCase())) {
        await ctx.db.insert("words", entry);
        existingSet.add(entry.word.toLowerCase()); // evita duplicados dentro del mismo array
        added++;
      } else {
        skipped.push(entry.word);
      }
    }

    return { added, skipped: skipped.length, skippedWords: skipped };
  },
});
