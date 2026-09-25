const G = ['tradicional', '80s', '90s', '2000s', 'actual'];

// Tuplas: palabra, significado, ejemplo, colección, lugar, icono, dificultad, generaciones, nota de fuente.
const groups = [
  ['patio-recreo', [
    ['trompo','Juguete que gira sobre una punta al lanzarlo con una cuerda.','En el recreo hicimos bailar el trompo sobre el cemento.','juegos-ninez','todo-mexico','🪀',1,G],
    ['balero','Juguete de copa y pieza unidas por un cordón.','Mi abuelo me enseñó a ensartar el balero con paciencia.','juegos-ninez','todo-mexico','🪀',1,G],
    ['canicas','Bolitas de vidrio usadas en juegos de puntería.','Trazamos un círculo de tierra para jugar canicas.','juegos-ninez','todo-mexico','🔵',1,G],
    ['resortera','Horqueta con bandas elásticas usada para lanzar objetos.','Guardamos la resortera y nunca apuntamos a los animales.','juegos-ninez','todo-mexico','🌿',1,G],
    ['bote pateado','Juego de escondite en el que se libera al grupo pateando un bote.','En la calle jugamos bote pateado hasta que cayó la tarde.','juegos-ninez','todo-mexico','🥫',1,G],
    ['avioncito','Nombre mexicano de un juego de casillas que se recorre saltando.','Las niñas pintaron un avioncito de diez casillas en la banqueta.','juegos-ninez','todo-mexico','✈️',1,G],
    ['matatena','Juego de recoger piezas pequeñas mientras una pelota rebota.','Mi prima me ganaba en la matatena porque agarraba todas las piezas de un jalón.','juegos-ninez','todo-mexico','⭐',2,['tradicional','80s','90s','2000s']],
    ['resorte','Juego de saltos con una banda elástica sostenida entre dos personas.','En el recreo saltábamos el resorte cada vez más alto: tobillos, rodillas y cintura.','juegos-ninez','todo-mexico','➰',1,G],
    ['lotería','Juego de cartas ilustradas que se anuncian en voz alta.','La familia llenó la mesa para jugar lotería el domingo.','juegos-ninez','todo-mexico','🃏',1,G],
    ['Cri-Cri','El Grillito Cantor, personaje de Francisco Gabilondo Soler que cantaba canciones para niños.','En el festival del kínder bailamos «La patita» del Grillito Cantor.','musica-mexicana','todo-mexico','🦗',1,['tradicional','80s','90s','2000s']],
    ['encantados','Juego de persecución en el que tocar a alguien lo deja inmóvil.','En encantados, Luisa liberó a su equipo con un toque.','juegos-ninez','todo-mexico','🧊',1,G],
    ['cebollitas','Juego colectivo de fuerza en el que una fila intenta mantenerse unida.','Las cebollitas terminaron entre risas en el patio.','juegos-ninez','todo-mexico','🧅',2,['tradicional','80s','90s','2000s']],
    ['recreo','Descanso entre clases para comer, conversar o jugar.','Durante el recreo compartimos fruta y jugamos futbol.','escuela-mexicana','todo-mexico','🔔',1,G],
    ['cooperativa escolar','Puesto organizado dentro de una escuela para vender alimentos o útiles.','En la cooperativa escolar compramos fruta durante el recreo.','escuela-mexicana','todo-mexico','🏫',1,G],
    ['gis','Barra de yeso usada para escribir en el pizarrón.','La maestra escribió la fecha con un gis blanco.','escuela-mexicana','todo-mexico','🖍️',1,G],
    ['pizarrón','Superficie donde se escribe durante una clase.','Copiamos del pizarrón una estrofa del poema.','escuela-mexicana','todo-mexico','🧑‍🏫',1,G],
    ['basta','Juego de lápiz y papel para escribir palabras por categorías y letra.','En la hora libre jugamos basta con nombres, lugares y frutas.','juegos-ninez','todo-mexico','📝',1,G],
    ['estampita','Imagen pequeña que se intercambia o colecciona.','Cambiamos una estampita repetida al salir de clases.','juegos-ninez','todo-mexico','🖼️',1,['80s','90s','2000s','actual']],
    ['reata','Cuerda resistente que también se usa para saltar.','Dos amigas giraron la reata mientras las demás saltaban.','juegos-ninez','todo-mexico','➰',2,G],
    ['papalote','Armazón ligera con papel que vuela sostenida por un hilo.','Elevamos el papalote cuando comenzó a soplar el viento.','juegos-ninez','todo-mexico','🪁',1,G],
  ]],
  ['casa-abuela', [
    ['molinillo','Utensilio de madera que espuma bebidas de chocolate.','La abuela giró el molinillo entre las palmas para servir chocolate.','cocina-bebidas','todo-mexico','🥄',1,G],
    ['comal','Plancha circular donde se cuecen o calientan alimentos.','Calentamos las tortillas directamente sobre el comal.','cocina-bebidas','todo-mexico','🫓',1,G],
    ['metate','Piedra rectangular usada para moler con otra pieza de piedra.','En la cocina antigua conservan un metate de piedra volcánica.','cocina-bebidas','todo-mexico','🪨',2,G],
    ['jarrito','Vasija pequeña de barro usada para servir bebidas.','Me sirvieron café de olla en un jarrito de barro.','cocina-bebidas','todo-mexico','🏺',1,G],
    ['La Rosa de Guadalupe','Serie de televisión en la que, antes del milagro de cada capítulo, sopla un airecito y aparece una rosa blanca.','Cuando sopló el airecito, mi mamá dijo: «ahí viene el milagro de La Rosa de Guadalupe».','tele-cultura-popular','todo-mexico','🌹',1,['2000s','actual']],
    ['sobremesa','Conversación que continúa después de terminar la comida.','La sobremesa del domingo se alargó entre recuerdos familiares.','dichos-casa','todo-mexico','☕',1,G],
    ['apapacho','Muestra afectuosa de cariño o consuelo.','Cuando llegué triste, mi tía me recibió con un apapacho.','dichos-casa','todo-mexico','🤗',1,G],
    ['provecho','Expresión de cortesía dirigida a quien está comiendo.','Al pasar junto a la mesa dijimos provecho a la familia.','dichos-casa','todo-mexico','🍽️',1,G],
    ['mande','Respuesta cortés usada al atender un llamado.','Cuando su mamá la llamó desde la cocina, Elena respondió mande.','dichos-casa','todo-mexico','👂',1,G],
    ['aguas','Aviso coloquial para pedir cuidado o advertir un riesgo.','¡Aguas con el escalón!, avisó mi abuelo al entrar.','dichos-casa','todo-mexico','⚠️',1,G],
    ['ahorita','Expresión cuyo tiempo exacto depende del contexto.','Ahorita termino de barrer y te ayudo con la mesa.','dichos-casa','todo-mexico','⏱️',1,G],
    ['pilón','Cantidad adicional que se entrega como cortesía.','La marchanta puso dos mandarinas de pilón en la bolsa.','dichos-casa','todo-mexico','➕',2,G],
    ['chiquihuite','Canasta tejida de fibras vegetales para guardar o transportar cosas.','Las tortillas llegaron a la mesa dentro de un chiquihuite.','oficios-artesanias','todo-mexico','🧺',2,G],
    ['petate','Estera tejida con fibras de palma.','Extendieron el petate para descansar bajo la sombra.','oficios-artesanias','todo-mexico','🧶',2,G],
    ['radionovela','Relato dramático por episodios producido para escucharse en la radio.','La familia seguía la radionovela cada tarde y comentaba el episodio.','tele-cultura-popular','todo-mexico','📻',2,['tradicional','80s','90s']],
    ['atole','Bebida caliente y espesa preparada principalmente con maíz.','En una mañana fría desayunamos atole de vainilla.','cocina-bebidas','todo-mexico','🥣',1,G],
    ['champurrado','Bebida de masa de maíz preparada con chocolate.','Acompañamos los tamales con una taza de champurrado.','cocina-bebidas','todo-mexico','☕',1,G],
    ['pan dulce','Conjunto de piezas de panadería de formas y sabores variados.','Elegimos conchas y cuernitos de la charola de pan dulce.','dulces-antojitos','todo-mexico','🥐',1,G],
    ['cajeta','Dulce espeso elaborado tradicionalmente con leche de cabra.','Untamos un poco de cajeta sobre el pan tostado.','dulces-antojitos','todo-mexico','🍯',1,G],
    ['monitos','Nombre popular de las historietas y caricaturas, como las del periódico del domingo.','Mi abuelo me guardaba la sección de monitos del periódico dominical.','tele-cultura-popular','todo-mexico','🗯️',2,G],
  ]],
  ['calle-barrio', [
    ['banqueta','Franja elevada destinada al paso de peatones junto a una calle.','Nos sentamos en la banqueta a platicar al caer la tarde.','vida-barrio','todo-mexico','🚶',1,G],
    ['tiendita','Comercio pequeño de barrio con productos cotidianos.','Fui a la tiendita por huevos y jabón para la casa.','vida-barrio','todo-mexico','🏪',1,G],
    ['vecindad','Vivienda colectiva organizada alrededor de patios compartidos.','La vecindad celebró la posada en el patio central.','vida-barrio','cdmx','🏘️',2,G],
    ['sonidero','Persona o colectivo que anima bailes populares con equipo de sonido.','El sonidero mandó saludos a las familias del barrio.','musica-mexicana','cdmx','🔊',2,['80s','90s','2000s','actual']],
    ['cascarita','Partido informal y generalmente breve de futbol.','Armamos una cascarita con dos mochilas como porterías.','vida-barrio','todo-mexico','⚽',1,G],
    ['talacha','Trabajo manual de reparación o mantenimiento, a menudo ocasional.','El sábado hicimos la talacha de pintar la reja.','vida-barrio','todo-mexico','🔧',2,G],
    ['chamba','Trabajo u ocupación, en registro coloquial.','Consiguió una chamba cerca de su colonia.','vida-barrio','todo-mexico','🧰',1,G],
    ['cuate','Amigo o compañero cercano, en registro coloquial.','Me encontré a un cuate de la secundaria en el parque.','vida-barrio','todo-mexico','🤝',1,G],
    ['Cine de Oro','Periodo de gran desarrollo y proyección del cine mexicano entre las décadas de 1930 y 1950.','Los domingos mi abuela veía películas del Cine de Oro y se sabía los diálogos.','tele-cultura-popular','todo-mexico','🎞️',2,G],
    ['alburear','Participar en un intercambio de albur mediante ingenio verbal y acuerdo entre quienes juegan.','En el mercado, los marchantes se ponían a alburear con ingenio y todos se reían.','albures-picaresca','todo-mexico','😉',2,G],
    ['echar la mano','Ayudar a alguien con una tarea o dificultad.','Los vecinos nos echaron la mano para mover las mesas.','dichos-casa','todo-mexico','🫱',1,G],
    ['hacer la vaquita','Reunir pequeñas aportaciones de varias personas para un gasto común.','Hicimos la vaquita para comprar pintura para la cancha.','vida-barrio','todo-mexico','🐄',2,G],
    ['carpa','Espectáculo popular itinerante de teatro, música y comicidad bajo una lona.','Mi bisabuelo contaba que vio a Cantinflas empezar en una carpa de barrio.','tele-cultura-popular','cdmx','🎪',2,['tradicional','80s']],
    ['pesero','Nombre coloquial de ciertos vehículos de transporte público capitalino.','El pesero avanzó por la avenida durante la hora pico.','regiones-hablas','cdmx','🚐',2,['80s','90s','2000s','actual']],
    ['regio','Forma coloquial de referirse a alguien o algo de Monterrey.','Mi amigo regio nos invitó a una carne asada el domingo.','regiones-hablas','monterrey','🏔️',2,G],
    ['tapatío','Gentilicio de quien es originario de Guadalajara.','Una artesana tapatía presentó su trabajo en la plaza.','regiones-hablas','guadalajara','🏛️',2,G],
    ['chilango','Gentilicio coloquial asociado con la Ciudad de México.','Mi primo chilango nos llevó a comer tacos al pastor en su colonia.','regiones-hablas','cdmx','🚇',2,G],
    ['doble sentido','Expresión que admite una interpretación adicional, a menudo humorística.','El comediante usó un doble sentido blanco que entendió toda la familia.','albures-picaresca','todo-mexico','💬',2,G],
    ['albur','Juego verbal mexicano basado en dobles sentidos y respuestas ingeniosas.','Mi tío presumía que nadie le ganaba un albur en el mercado.','albures-picaresca','todo-mexico','😉',3,['tradicional','80s','90s','2000s','actual']],
    ['echar carrilla','Burlarse de alguien en buen plan, con bromas entre amigos.','Mis primos me echaron carrilla todo el día por mi corte de pelo.','albures-picaresca','todo-mexico','😜',2,G],
    ['cibercafé','Local que ofrece computadoras y conexión a internet por tiempo.','En los dos mil íbamos al cibercafé del barrio para imprimir la tarea.','mexico-digital','todo-mexico','🖥️',2,['90s','2000s','actual']],
    ['poner saldo','Comprar crédito para usar una línea móvil de prepago.','Pasé a la tiendita a poner saldo antes de llamar a mi mamá.','mexico-digital','todo-mexico','📱',2,['2000s','actual']],
    ['dar un timbrazo','Marcar y colgar antes de que contesten para que la otra persona devuelva la llamada.','No tenía saldo, así que le di un timbrazo a mi hermano para que me marcara.','mexico-digital','todo-mexico','📳',2,['2000s','actual']],
    ['lada','Clave que se marca antes del número para llamar a otra ciudad; también la llamada de larga distancia.','Para hablarle a la abuela a Puebla había que marcar la lada primero.','mexico-digital','todo-mexico','☎️',2,['80s','90s','2000s','actual']],
    ['llamada por cobrar','Llamada que paga quien la recibe, muy usada desde los teléfonos públicos.','Le hice una llamada por cobrar a mi abuelo porque no traía monedas.','mexico-digital','todo-mexico','📞',2,['80s','90s','2000s']],
  ]],
  ['mercado-antojitos', [
    ['tianguis','Mercado que se instala periódicamente en calles o espacios abiertos.','Los martes compramos fruta fresca en el tianguis del barrio.','vida-barrio','todo-mexico','🛍️',1,G],
    ['marchanta','Tratamiento coloquial para una vendedora o clienta de mercado.','La marchanta recomendó los tomates más maduros del puesto.','vida-barrio','todo-mexico','👩‍🌾',2,G],
    ['torta','Pan abierto y relleno con diversos ingredientes salados.','Pedimos una torta de frijoles con queso para el camino.','dulces-antojitos','todo-mexico','🥪',1,G],
    ['tamal','Masa de maíz rellena y cocida envuelta en hojas.','Compartimos un tamal de salsa verde durante el desayuno.','dulces-antojitos','todo-mexico','🫔',1,G],
    ['elote','Mazorca tierna de maíz, cocida o asada para comer.','En la plaza compramos un elote con limón y chile.','dulces-antojitos','todo-mexico','🌽',1,G],
    ['esquite','Granos de maíz preparados y servidos en vaso o recipiente.','La señora sirvió el esquite caliente con epazote.','dulces-antojitos','todo-mexico','🥣',1,G],
    ['garnacha','Nombre general de varios antojitos hechos con masa y acompañamientos.','En la feria probamos una garnacha recién salida del comal.','dulces-antojitos','todo-mexico','🌮',2,G],
    ['quesadilla','Tortilla doblada con queso u otros guisos, según la región.','Pedimos una quesadilla y aclaramos el relleno al ordenar.','dulces-antojitos','todo-mexico','🌮',1,G],
    ['tlacoyo','Pieza ovalada de masa rellena, cocida en comal.','El tlacoyo de haba llegó con nopales y salsa.','dulces-antojitos','cdmx','🫓',2,G],
    ['memela','Tortilla gruesa de masa con asiento y diversos acompañamientos.','En Oaxaca desayunamos una memela caliente en el mercado.','dulces-antojitos','oaxaca','🫓',2,G],
    ['cemita','Pan poblano y preparación rellena hecha con ese pan.','La cemita poblana llevaba quesillo, aguacate y pápalo.','dulces-antojitos','puebla','🥪',2,G],
    ['tlayuda','Tortilla oaxaqueña grande y firme que se sirve con diversos ingredientes.','Compartimos una tlayuda con frijoles y quesillo en Oaxaca.','dulces-antojitos','oaxaca','🫓',2,G],
    ['cochinita pibil','Carne adobada cocida tradicionalmente con técnica de horno de tierra.','En Yucatán sirvieron cochinita pibil con cebolla morada.','cocina-bebidas','yucatan','🍖',2,G],
    ['pozol','Bebida de maíz, común en el sureste mexicano y con variantes regionales.','En Tabasco tomamos pozol frío durante una tarde calurosa.','cocina-bebidas','tabasco','🥤',2,G],
    ['tejate','Bebida oaxaqueña de maíz y cacao con ingredientes aromáticos.','La vendedora batió el tejate antes de servirlo en una jícara.','cocina-bebidas','oaxaca','🥣',2,G],
    ['agua fresca','Bebida de agua preparada con fruta, semillas o flores.','Llenamos una jarra de agua fresca de jamaica para la comida.','cocina-bebidas','todo-mexico','🥤',1,G],
    ['chile en nogada','Platillo poblano de chile relleno cubierto con salsa de nuez.','En temporada compartimos un chile en nogada en Puebla.','cocina-bebidas','puebla','🌶️',2,G],
    ['corunda','Tamal michoacano de forma característica, envuelto en hojas de maíz.','La corunda llegó acompañada con crema y salsa.','dulces-antojitos','michoacan','🫔',2,G],
    ['marquesita','Postre yucateco crujiente, enrollado con distintos rellenos.','En Mérida pedimos una marquesita de queso con cajeta.','dulces-antojitos','yucatan','🧇',2,['90s','2000s','actual']],
    ['palanqueta','Dulce hecho con semillas o nueces unidas por caramelo.','Llevamos una palanqueta de cacahuate para el viaje.','dulces-antojitos','todo-mexico','🥜',1,G],
  ]],
  ['feria-verbena', [
    ['papel picado','Adorno de papel recortado con diseños, usado en celebraciones.','Colgamos papel picado de colores sobre el patio de la fiesta.','fiestas-tradiciones','todo-mexico','🎊',1,G],
    ['posada','Celebración decembrina que recrea la petición de alojamiento.','La posada del barrio tuvo letanías, ponche y piñata.','fiestas-tradiciones','todo-mexico','🕯️',1,G],
    ['piñata','Recipiente decorado que se rompe para repartir fruta o dulces.','Las niñas esperaron su turno para pegarle a la piñata.','fiestas-tradiciones','todo-mexico','🪅',1,G],
    ['verbena','Fiesta popular al aire libre con música, comida y puestos.','La verbena llenó la plaza de música y antojitos.','fiestas-tradiciones','todo-mexico','🎡',2,G],
    ['kermés','Fiesta comunitaria con juegos y venta de comida para reunir fondos.','La escuela organizó una kermés con tómbola y antojitos.','fiestas-tradiciones','todo-mexico','🎟️',1,G],
    ['tómbola','Sorteo de feria en el que se extraen números o boletos.','Ganamos una planta pequeña en la tómbola de la kermés.','fiestas-tradiciones','todo-mexico','🎫',2,G],
    ['castillo','Estructura de fuegos artificiales montada para fiestas populares.','Al final de la fiesta del pueblo prendieron el castillo y todos gritamos con la última rueda.','fiestas-tradiciones','todo-mexico','🎆',2,G],
    ['torito','Armazón festiva con pirotecnia que una persona carga y hace bailar.','El torito corrió echando chispas y los niños salimos corriendo entre risas.','fiestas-tradiciones','todo-mexico','🐂',2,G],
    ['calenda','Desfile festivo oaxaqueño con música, figuras y participación comunitaria.','La calenda avanzó por Oaxaca entre bandas y marmotas.','fiestas-tradiciones','oaxaca','🥁',2,G],
    ['guelaguetza','Principio zapoteco de ayuda recíproca y nombre de una celebración oaxaqueña.','En la Guelaguetza, las delegaciones bailaron y le aventaron fruta al público.','fiestas-tradiciones','oaxaca','🌺',3,G,'Del zapoteco; se asocia con reciprocidad y ofrenda.'],
    ['noche de rábanos','Exhibición oaxaqueña de figuras talladas en rábanos cada diciembre.','Visitamos la Noche de Rábanos y observamos escenas talladas.','fiestas-tradiciones','oaxaca','🥬',3,G],
    ['parachico','Danzante tradicional de la Fiesta Grande de Chiapa de Corzo.','El parachico recorrió las calles con su montera y chinchín.','fiestas-tradiciones','chiapas','🎭',3,G],
    ['volador','Participante del rito de los Voladores, practicado por comunidades mesoamericanas.','El volador bajó girando desde lo alto del palo mientras sonaba la flauta.','fiestas-tradiciones','veracruz','🪶',3,G],
    ['ramada','Estructura festiva hecha con ramas; el uso cambia según la región.','La comunidad adornó la ramada para recibir a las familias.','fiestas-tradiciones','nayarit','🌿',2,G],
    ['paseo del pendón','Desfile tradicional asociado con celebraciones comunitarias de Guerrero.','Las delegaciones participaron en el Paseo del Pendón con sus danzas.','fiestas-tradiciones','guerrero','🚩',3,G],
    ['hanal pixán','Conmemoración maya yucateca dedicada a las ánimas.','La familia preparó el altar de Hanal Pixán con respeto y memoria.','fiestas-tradiciones','yucatan','🕯️',3,G,'Expresión maya yucateca traducida comúnmente como comida de las ánimas.'],
    ['janitzio','Isla michoacana conocida por su vida comunitaria y celebraciones de ánimas.','En la noche de muertos, las velas de Janitzio se veían desde la lancha.','lugares-mexico','michoacan','🏝️',2,G],
    ['comparsa','Grupo que participa con música, baile o disfraces en una fiesta.','La comparsa ensayó varias semanas antes del carnaval.','fiestas-tradiciones','todo-mexico','🎭',2,G],
    ['carnaval','Celebración pública previa a la Cuaresma, con variantes regionales.','El carnaval de Campeche reunió comparsas en el malecón.','fiestas-tradiciones','campeche','🎉',2,G],
    ['ofrenda','Conjunto de objetos y alimentos dedicado a recordar a quienes murieron.','La familia colocó fotografías y flores en la ofrenda.','fiestas-tradiciones','todo-mexico','🕯️',1,G],
    ['lucha libre','Espectáculo deportivo de combate con llaves, vuelos y personajes enmascarados.','La familia asistió a una función de lucha libre en la Arena México.','ciencia-inventos-deporte','cdmx','🤼',2,G],
  ]],
  ['musica-une', [
    ['mariachi','Conjunto musical y tradición interpretativa vinculada especialmente con Jalisco.','El mariachi abrió la serenata con sones y violines.','musica-mexicana','jalisco','🎺',1,G],
    ['jarana','Instrumento de cuerdas usado en diversas tradiciones musicales mexicanas.','La jarana marcó el ritmo durante el fandango.','musica-mexicana','veracruz','🪕',2,G],
    ['marimba','Instrumento de láminas de madera percutidas, arraigado en el sureste.','La marimba animó la plaza de Chiapas al atardecer.','musica-mexicana','chiapas','🎶',2,G],
    ['huapango','Familia de expresiones musicales y dancísticas con variantes regionales.','Las parejas zapatearon huapango sobre la tarima.','musica-mexicana','huasteca','🎻',2,G],
    ['son jarocho','Tradición musical y dancística de Veracruz y zonas vecinas.','En el fandango tocaron son jarocho con jarana y arpa.','musica-mexicana','veracruz','🎻',2,G],
    ['son huasteco','Género musical de la Huasteca interpretado comúnmente por un trío.','El trío cantó son huasteco con violín y dos guitarras.','musica-mexicana','huasteca','🎻',3,G],
    ['norteño','Género musical del norte de México asociado con acordeón y bajo sexto.','El conjunto norteño tocó una polka frente a la plaza.','musica-mexicana','nuevo-leon','🪗',2,G],
    ['Timbiriche','Grupo pop juvenil de los ochenta del que salieron varias estrellas de la música mexicana.','Mi mamá todavía se sabe los pasos de las canciones de Timbiriche.','musica-mexicana','todo-mexico','🎤',2,['80s','90s']],
    ['bolero','Género de canción romántica cultivado ampliamente en México.','El trío interpretó un bolero con voces y guitarras.','musica-mexicana','todo-mexico','🎙️',2,G],
    ['ranchera','Género de canción mexicana ligado al acompañamiento de mariachi.','La cantante interpretó una ranchera durante la serenata.','musica-mexicana','todo-mexico','🎤',2,G],
    ['corrido','Forma narrativa cantada que relata personas o acontecimientos.','Mi abuelo cantaba un corrido de la Revolución mientras arreglaba el radio.','musica-mexicana','todo-mexico','📜',2,G],
    ['danzón','Género musical y baile de origen cubano con fuerte arraigo en México.','Varias parejas bailaron danzón en la plaza de Veracruz.','musica-mexicana','veracruz','💃',2,G],
    ['fandango','Fiesta comunitaria de música, baile y convivencia en varias regiones.','El fandango reunió a músicos y bailadoras alrededor de la tarima.','musica-mexicana','veracruz','🪵',2,G],
    ['zapateado','Percusión rítmica realizada con los pies durante ciertos bailes.','El zapateado resonó con claridad sobre la tarima de madera.','musica-mexicana','todo-mexico','👞',2,G],
    ['requinto','Guitarra pequeña de registro agudo usada en distintos conjuntos.','El requinto respondió a las voces con una breve melodía.','musica-mexicana','todo-mexico','🎸',2,G],
    ['bajo sexto','Instrumento de cuerdas característico de conjuntos norteños.','El bajo sexto sostuvo la armonía junto al acordeón.','musica-mexicana','nuevo-leon','🎸',3,G],
    ['vihuela','Instrumento pequeño de cuerdas que aporta ritmo al mariachi.','La vihuela acompañó a las trompetas con rasgueos firmes.','musica-mexicana','jalisco','🎸',3,G],
    ['guitarrón','Instrumento grave de gran caja usado en el mariachi.','El guitarrón marcó la base rítmica de la canción.','musica-mexicana','jalisco','🎸',3,G],
    ['tambora','Tambor grande presente en bandas y otras tradiciones regionales.','La tambora dio entrada a los metales durante el desfile.','musica-mexicana','todo-mexico','🥁',2,G],
    ['son calentano','Tradición musical de la región de Tierra Caliente compartida por Guerrero y estados vecinos.','Un conjunto de Guerrero interpretó son calentano con violín y guitarras.','musica-mexicana','guerrero','🎻',3,G,'La tradición abarca Tierra Caliente en Guerrero, Michoacán y el Estado de México; esta entrada representa su vertiente guerrerense.'],
  ]],
  ['mexico-regional', [
    ['ajijic','Población jalisciense situada a orillas del lago de Chapala.','En Ajijic caminamos por el malecón junto al lago.','lugares-mexico','jalisco','🌊',2,G],
    ['xochimilco','Zona lacustre y alcaldía del sur de la Ciudad de México.','En Xochimilco nos subimos a una trajinera y pasó un mariachi tocando.','lugares-mexico','cdmx','🛶',2,G,'Topónimo de origen náhuatl.'],
    ['monte albán','Antigua ciudad zapoteca ubicada en los Valles Centrales de Oaxaca.','Desde Monte Albán se ve todo el valle de Oaxaca.','lugares-mexico','oaxaca','🏛️',3,G],
    ['cholula','Ciudad poblana de larga historia, conocida por su gran basamento piramidal.','En Cholula subimos a la iglesia que está encima de la pirámide.','lugares-mexico','puebla','⛪',2,G],
    ['pátzcuaro','Ciudad michoacana vinculada históricamente con la región del lago.','En Pátzcuaro visitamos talleres y caminamos por sus plazas.','lugares-mexico','michoacan','🏘️',2,G],
    ['taxco','Ciudad de Guerrero reconocida por su tradición platera.','En Taxco una artesana explicó el trabajo de la plata.','lugares-mexico','guerrero','⛰️',2,G],
    ['san cristóbal','Ciudad de los Altos de Chiapas con amplia diversidad cultural.','En San Cristóbal escuchamos varias lenguas en el mercado.','lugares-mexico','chiapas','🏘️',2,G],
    ['izamal','Ciudad yucateca con patrimonio maya y arquitectura virreinal.','En Izamal todas las casas del centro están pintadas de amarillo.','lugares-mexico','yucatan','🟨',2,G],
    ['edzná','Antigua ciudad maya situada en el actual estado de Campeche.','En Edzná subimos al edificio de cinco pisos y se veía toda la selva.','lugares-mexico','campeche','🏛️',3,G,'Topónimo maya.'],
    ['tulum','Ciudad maya amurallada situada en la costa de Quintana Roo.','Visitamos Tulum temprano para recorrer el sitio con calma.','lugares-mexico','quintana-roo','🌊',2,G,'Topónimo maya.'],
    ['comalcalco','Ciudad tabasqueña y sitio arqueológico maya construido con ladrillo.','En Comalcalco vimos pirámides hechas de ladrillo, no de piedra.','lugares-mexico','tabasco','🧱',3,G,'Topónimo de origen náhuatl.'],
    ['tepic','Capital de Nayarit y centro de una región cultural diversa.','En Tepic desayunamos antes de subir a la sierra.','lugares-mexico','nayarit','🏙️',2,G],
    ['huasteca','Región cultural compartida por varios estados del oriente mexicano.','La Huasteca reúne tradiciones distintas a través de varios estados.','regiones-hablas','huasteca','🗺️',2,G],
    ['chale','Expresión de decepción o fastidio, muy usada en el centro del país.','¡Chale, ya se acabaron los tamales!','regiones-hablas','cdmx','😩',1,G],
    ['jarocho','Gentilicio y denominación cultural vinculada con Veracruz.','Mi tía jarocha dice que el café de Veracruz no tiene comparación.','regiones-hablas','veracruz','🌊',2,G],
    ['poblano','Gentilicio de las personas originarias del estado o ciudad de Puebla.','Mi abuela poblana empieza a hacer el mole desde un día antes.','regiones-hablas','puebla','🏺',1,G],
    ['purépecha','Nombre de un pueblo originario y su lengua, principalmente de Michoacán.','La maestra de mi hermano le enseñó a contar en purépecha.','pueblos-originarios-lenguas','michoacan','🦋',3,G,'Nombre del pueblo y de una lengua de la familia tarasca.'],
    ['maya yucateco','Lengua maya hablada principalmente en la península de Yucatán.','En Mérida, la señora del mercado nos saludó en maya yucateco.','pueblos-originarios-lenguas','yucatan','🌿',3,G,'Lengua de la familia maya.'],
    ['náayeri','Nombre con el que el pueblo cora se refiere a sí mismo y a su lengua.','Una autora náayeri presentó su poesía en edición bilingüe.','pueblos-originarios-lenguas','nayarit','🗣️',3,G,'Autodenominación asociada con el pueblo y lengua cora.'],
  ]],
  ['oficios-artesanias', [
    ['talavera','Cerámica vidriada elaborada bajo una tradición artesanal de Puebla y Tlaxcala.','En casa de mi abuela, los platos de talavera nomás eran para las visitas.','oficios-artesanias','puebla','🏺',2,G],
    ['barro negro','Tradición alfarera oaxaqueña asociada especialmente con San Bartolo Coyotepec.','La artesana bruñó una pieza de barro negro antes de cocerla.','oficios-artesanias','oaxaca','🏺',2,G],
    ['alebrije','Figura fantástica tallada en madera o modelada en cartonería, según la tradición.','En Oaxaca compramos un alebrije de colores con alas y cola de lagarto.','oficios-artesanias','todo-mexico','🐉',2,G],
    ['cartonería','Técnica que modela papel y engrudo para crear figuras.','El cartonero formó una máscara mediante varias capas de cartonería.','oficios-artesanias','todo-mexico','🎭',2,G],
    ['papel amate','Soporte elaborado con cortezas mediante una técnica de origen mesoamericano.','En el mercado de artesanías compramos un papel amate pintado con pájaros.','oficios-artesanias','puebla','📜',3,G],
    ['rebozo','Prenda rectangular tejida que se usa de diversas maneras.','La tejedora explicó cómo anudó el fleco del rebozo.','oficios-artesanias','todo-mexico','🧣',2,G],
    ['sarape','Prenda rectangular de abrigo, tejida con diseños variados.','El artesano mostró el telar donde tejió el sarape.','oficios-artesanias','todo-mexico','🧶',2,G],
    ['huipil','Prenda tradicional de origen mesoamericano, con variantes comunitarias.','Mi mamá se puso su huipil bordado para la boda de mi prima.','oficios-artesanias','todo-mexico','👚',2,G,'Del náhuatl huipilli; la prenda tiene variantes entre numerosos pueblos.'],
    ['quechquémitl','Prenda indígena para la parte superior del cuerpo, formada por lienzos unidos.','La abuela se puso su quechquémitl bordado para la fiesta del pueblo.','oficios-artesanias','huasteca','🧣',3,G,'Del náhuatl quechquemitl.'],
    ['deshilado','Técnica textil que retira y reorganiza hilos para formar diseños.','La bordadora trabajó el deshilado con luz natural.','oficios-artesanias','todo-mexico','🪡',2,G],
    ['telar de cintura','Telar tensado entre un punto fijo y una banda sujeta al cuerpo de quien teje.','La tejedora ajustó la tensión del telar de cintura antes de continuar.','oficios-artesanias','oaxaca','🧶',3,G],
    ['maque','Técnica artesanal de recubrimiento y decoración presente en México desde época antigua.','La artesana michoacana pulió cuidadosamente el maque de la batea.','oficios-artesanias','michoacan','🎨',3,G],
    ['platería','Oficio de trabajar la plata para crear objetos utilitarios o decorativos.','El platero de Taxco soldó una pieza en su banco de trabajo.','oficios-artesanias','guerrero','🥈',2,G],
    ['hojalata','Lámina metálica usada para crear objetos decorativos y utilitarios.','El artesano recortó la hojalata para formar un espejo.','oficios-artesanias','todo-mexico','🔨',2,G],
    ['cestería','Oficio de entrelazar fibras para fabricar recipientes y otros objetos.','La familia enseñó cómo seleccionar palma para la cestería.','oficios-artesanias','todo-mexico','🧺',2,G],
    ['laudero','Artesano que construye y repara instrumentos de cuerda.','El laudero ajustó la jarana antes del concierto.','oficios-artesanias','veracruz','🎸',3,G],
    ['alfarero','Persona que fabrica objetos de barro cocido.','El alfarero centró el barro húmedo sobre el torno.','oficios-artesanias','todo-mexico','🏺',2,G],
    ['chinampa','Parcela agrícola construida en zonas lacustres de poca profundidad.','La productora cultivó flores y hortalizas en la chinampa.','naturaleza-mexico','cdmx','🌱',2,G,'Del náhuatl chināmitl.'],
    ['milpa','Sistema agrícola mesoamericano centrado en maíz y cultivos asociados.','En la milpa crecieron juntos maíz, frijol y calabaza.','naturaleza-mexico','todo-mexico','🌽',2,G,'Del náhuatl mīlpan.'],
    ['nixtamal','Maíz cocido con una sustancia alcalina para preparar masa y otros alimentos.','En el molino transformaron el nixtamal en masa fresca.','cocina-bebidas','todo-mexico','🌽',2,G,'Del náhuatl nextamalli.'],
  ]],
  ['historias-leyendas', [
    ['Llorona','Personaje de una leyenda difundida en México con numerosas versiones.','Mi abuela nos contaba de la Llorona para que no saliéramos de noche.','leyendas-relatos','todo-mexico','👻',2,G],
    ['nahual','Ser humano con capacidad de transformarse o vínculo ritual, según diversas tradiciones.','En el rancho decían que un nahual se convertía en perro negro por las noches.','leyendas-relatos','todo-mexico','🐆',3,G,'Del náhuatl nāhualli; los sentidos varían entre tradiciones.'],
    ['alux','Ser de relatos mayas de la península de Yucatán.','La abuela narró una historia de aluxes ubicada cerca de la milpa.','leyendas-relatos','yucatan','🌿',3,G,'Término de origen maya yucateco.'],
    ['chaneque','Ser asociado con montes y aguas en distintas tradiciones del centro y Golfo.','El cuento del chaneque advertía cuidar el bosque y sus manantiales.','leyendas-relatos','veracruz','🌳',3,G,'Del náhuatl; las características cambian según la región.'],
    ['tzitzimime','Seres celestes de la tradición nahua, descritos en fuentes históricas.','En el códice, las tzitzimime aparecen como seres del cielo de la noche.','leyendas-relatos','todo-mexico','✨',3,['tradicional'],'Término del náhuatl; plural castellanizado de tzitzimitl.'],
    ['Popocatépetl','Volcán activo del centro de México y figura de relatos ampliamente difundidos.','Desde la azotea de mi tía en Puebla se ve el Popocatépetl echando fumarola.','naturaleza-mexico','puebla','🌋',2,G,'Topónimo de origen náhuatl.'],
    ['Iztaccíhuatl','Volcán del centro de México presente en relatos y memoria regional.','La silueta del Iztaccíhuatl apareció al despejarse el cielo.','naturaleza-mexico','puebla','🏔️',3,G,'Topónimo de origen náhuatl.'],
    ['Quetzalcóatl','Deidad mesoamericana relacionada con la serpiente emplumada en varias culturas.','En Teotihuacan vimos las cabezas de serpiente del templo de Quetzalcóatl.','historia-personajes','todo-mexico','🐍',3,['tradicional'],'Nombre de origen náhuatl; sus atributos varían históricamente.'],
    ['Sor Juana','Escritora novohispana del siglo XVII, autora de poesía, teatro y prosa.','En la secundaria nos aprendimos «Hombres necios» de Sor Juana.','historia-personajes','todo-mexico','📚',2,G],
    ['Morelos','José María Morelos, dirigente de la independencia de México.','En el billete de cincuenta aparecía Morelos con su paliacate.','historia-personajes','michoacan','📜',2,G],
    ['Benito Juárez','Presidente mexicano de origen zapoteco y figura central de la Reforma.','En la primaria aprendimos la frase de Benito Juárez sobre el respeto al derecho ajeno.','historia-personajes','oaxaca','📜',2,G],
    ['Carmen Serdán','Revolucionaria poblana que participó en el movimiento antirreeleccionista.','En Puebla visitamos la casa de Carmen Serdán, donde empezó la Revolución.','historia-personajes','puebla','🕊️',2,G],
    ['Pakal','Gobernante maya de Palenque durante el periodo Clásico.','En Palenque nos contaron que Pakal fue rey desde que era niño.','historia-personajes','chiapas','👑',3,G,'Nombre registrado en textos mayas; suele citarse como K’inich Janaab’ Pakal.'],
    ['códice','Libro manuscrito, especialmente los de tradición mesoamericana.','En el libro de texto venía el dibujo de un códice con figuras de colores.','historia-personajes','todo-mexico','📜',2,G],
    ['Callejón del Beso','Leyenda de Guanajuato de dos enamorados cuyos balcones estaban tan juntos que casi se tocaban.','Los novios se dieron un beso en el tercer escalón del Callejón del Beso, como manda la tradición.','leyendas-relatos','guanajuato','💋',2,G],
    ['Mulata de Córdoba','Personaje legendario veracruzano asociado con relatos coloniales de prodigio y persecución.','La narradora de Córdoba contó una versión local de la Mulata de Córdoba.','leyendas-relatos','veracruz','🕯️',3,G,'Leyenda con múltiples versiones; no debe leerse como biografía comprobada.'],
    ['Charro Negro','Jinete sobrenatural de relatos mexicanos que suele tentar o asustar a caminantes.','El abuelo contó que el Charro Negro aparecía en caminos solitarios.','leyendas-relatos','todo-mexico','🐎',3,G,'Motivo legendario difundido con variantes regionales.'],
    ['Planchada','Aparición de relatos hospitalarios mexicanos, descrita como una enfermera de uniforme impecable.','En el hospital, las enfermeras cuentan que la Planchada cuida a los enfermos de noche.','leyendas-relatos','todo-mexico','🏥',3,['80s','90s','2000s','actual'],'Leyenda urbana con versiones en distintos hospitales del país.'],
    ['Tisigua','Ser femenino de la tradición oral chiapaneca asociado con ríos y extravíos.','El relato chiapaneco advirtió que la Tisigua llamaba desde la orilla del río.','leyendas-relatos','chiapas','🌊',3,G,'La caracterización varía entre comunidades y narradores de Chiapas.'],
    ['Xtáabay','Personaje femenino sobrenatural de relatos mayas de la península de Yucatán.','La narradora yucateca situó a la Xtáabay junto a una ceiba del camino.','leyendas-relatos','yucatan','🌳',3,G,'Nombre de origen maya yucateco; existen diversas grafías y versiones.'],
  ]],
  ['mexico-profundo', [
    ['pelota mixteca','Juego de pelota practicado por comunidades de Oaxaca y su diáspora.','En Oaxaca vimos jugar pelota mixteca con guantes pesados y decorados.','ciencia-inventos-deporte','oaxaca','🥎',3,G,'Tradición deportiva viva con distintas modalidades.'],
    ['ulama','Juego de pelota de raíz mesoamericana que permanece vivo en el noroeste de México.','En Sinaloa todavía se juega ulama pegándole a la pelota con la cadera.','ciencia-inventos-deporte','sinaloa','🏐',3,G,'Tradición deportiva viva practicada especialmente en comunidades de Sinaloa.'],
    ['juego de pelota mesoamericano','Conjunto de prácticas rituales y deportivas con variantes entre sociedades mesoamericanas.','En Chichén Itzá vimos la cancha del juego de pelota mesoamericano y su aro de piedra.','ciencia-inventos-deporte','todo-mexico','⚽',3,['tradicional'],'No existió una sola modalidad; las reglas y significados variaron por región y periodo.'],
    ['Guillermo González Camarena','Ingeniero tapatío que inventó uno de los primeros sistemas de televisión a color.','En la escuela nos contaron que Guillermo González Camarena inventó una tele a color cuando era muy joven.','ciencia-inventos-deporte','guadalajara','📺',3,G],
    ['náhuatl','Lengua de los mexicas de la que vienen palabras como chocolate, tomate y aguacate.','Mi abuela usaba palabras que vienen del náhuatl, como apapacho y tlapalería.','pueblos-originarios-lenguas','todo-mexico','🗣️',3,G,'Lengua o agrupación de variantes de la familia yuto-nahua.'],
    ['mixteco','Lengua indígena de la Mixteca, región entre Oaxaca, Puebla y Guerrero.','En la Mixteca, los abuelos platican en mixteco en la plaza.','pueblos-originarios-lenguas','oaxaca','🗣️',3,G,'Agrupación de variantes de la familia otomangue.'],
    ['zapoteco','Lengua indígena de los Valles Centrales y el Istmo de Oaxaca.','En Juchitán, las señoras del mercado platican en zapoteco.','pueblos-originarios-lenguas','oaxaca','🗣️',3,G,'Agrupación lingüística de la familia otomangue.'],
    ['tsotsil','Lengua maya de los Altos de Chiapas, viva en Chamula, Zinacantán y San Andrés Larráinzar.','En el mercado de San Cristóbal, las vendedoras de Chamula platicaban en tsotsil.','pueblos-originarios-lenguas','chiapas','🗣️',3,G,'Lengua de la familia maya.'],
    ['tseltal','Lengua indígena con más hablantes en Chiapas, viva en Ocosingo, Oxchuc y Tenejapa.','En Ocosingo, las familias escuchan el programa de radio en tseltal.','pueblos-originarios-lenguas','chiapas','🗣️',3,G,'Lengua de la familia maya.'],
    ['chontal de Tabasco','Nombre de una lengua maya hablada en Tabasco.','En Nacajuca, algunos abuelos todavía hablan chontal de Tabasco.','pueblos-originarios-lenguas','tabasco','🗣️',3,G,'Lengua maya; sus hablantes también emplean la autodenominación yokot’an.',{ relatedConceptId: 'yokotan' }],
    ['yokot’an','Autodenominación relacionada con el pueblo y la lengua chontal de Tabasco.','La escritora presentó un poemario bilingüe en yokot’an y español.','pueblos-originarios-lenguas','tabasco','🗣️',3,G,'Autodenominación en la lengua conocida como chontal de Tabasco.',{ relatedConceptId: 'chontal-de-tabasco' }],
    ['wixárika','Autodenominación vinculada con el pueblo conocido también como huichol.','Un artesano wixárika nos enseñó sus cuadros de estambre de colores.','pueblos-originarios-lenguas','jalisco','🗣️',3,G,'Autodenominación del pueblo y su lengua.'],
    ['me’phaa','Autodenominación del pueblo y las lenguas conocidas también como tlapanecas.','En la Montaña de Guerrero, los niños aprenden a leer en me’phaa y en español.','pueblos-originarios-lenguas','guerrero','🗣️',3,G,'Autodenominación usada por comunidades de Guerrero.'],
    ['quelite','Nombre general de diversas plantas tiernas comestibles.','Mi abuela cocinaba quelites con cebolla y los servía en tacos.','naturaleza-mexico','todo-mexico','🌿',2,G,'Del náhuatl quilitl.'],
    ['nopal','Planta del género Opuntia, de gran presencia alimentaria y cultural en México.','Cortamos nopales del huerto usando guantes y pinzas.','naturaleza-mexico','todo-mexico','🌵',1,G,'Del náhuatl nopalli.'],
    ['ajolote','Anfibio mexicano capaz de conservar rasgos larvarios en la adultez.','En Xochimilco vimos un ajolote que parecía estar sonriendo.','naturaleza-mexico','cdmx','🦎',2,G,'Del náhuatl āxōlōtl.'],
    ['mariposa monarca','Mariposa migratoria que pasa el invierno en bosques del centro de México.','Observamos la mariposa monarca a distancia para no alterar el santuario.','naturaleza-mexico','michoacan','🦋',2,G],
    ['hule','Material elástico que los olmecas ya sacaban de un árbol para hacer pelotas que rebotaban.','La pelota de hule rebotó por todo el patio.','ciencia-inventos-deporte','veracruz','⚫',2,G,'Del náhuatl olli.'],
    ['grana cochinilla','Insecto que vive en los nopales y del que se saca un rojo que se exportó a todo el mundo.','En Oaxaca vimos cómo la grana cochinilla pinta de rojo la lana.','ciencia-inventos-deporte','oaxaca','🔴',3,G],
    ['chinanteco','Lengua indígena de la Chinantla, en el norte de Oaxaca.','Mi compañero de Oaxaca le hablaba en chinanteco a su abuela por teléfono.','pueblos-originarios-lenguas','oaxaca','🗣️',3,G,'Agrupación de variantes de la familia otomangue; cada comunidad identifica su forma local.'],
  ]],
];

let order = 0;
const SPORTS = new Set(['pelota mixteca', 'lucha libre', 'ulama', 'juego de pelota mesoamericano']);
const normalizeConceptVariant = (word) => word.toLocaleLowerCase('es-MX').replace(/ñ/g, '\u0000')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0000/g, 'ñ')
  .replace(/[^a-z0-9ñ]+/g, '-').replace(/^-|-$/g, '');
// Equivalencias conocidas que la revisión editorial considera un solo concepto.
// La revisión manual sigue siendo necesaria para descubrir nuevas familias.
const SEMANTIC_CONCEPT_OVERRIDES = {
  avion: 'juego-casillas-salto', avioncito: 'juego-casillas-salto', rayuela: 'juego-casillas-salto',
  laqueado: 'maque-artesanal', maque: 'maque-artesanal',
  escondidas: 'juego-escondidas', escondidillas: 'juego-escondidas',
  chiquihuite: 'chiquihuite', chiquiguite: 'chiquihuite',
  'yokot-an': 'yokotan',
};
const conceptKey = (word) => {
  const normalized = normalizeConceptVariant(word);
  return SEMANTIC_CONCEPT_OVERRIDES[normalized] || normalized;
};

function createCatalogEntry(input) {
  const generation = Object.freeze([...(input.generation || G)]);
  return Object.freeze({ ...input, rating: input.rating || 'familiar', generation });
}

// ── Recorrido en vueltas ───────────────────────────────────────────────────
// Cada camino junta sus palabras (primer catálogo + ampliación) y las reparte en
// ROUNDS vueltas. Cada vuelta pasa por los diez caminos en el mismo orden, así el
// jugador ve todos los mundos pronto y ninguno desaparece al final.
//
// La dificultad no se ordena de menor a mayor en bloques, sino que cada vuelta
// recibe una mezcla que sube poco a poco (TIER_WEIGHTS): la primera vuelta es casi
// toda fácil y sin dificultad 3; las últimas mezclan 3 con 2 y algunas fáciles de
// respiro. Así no hay muros de veinte palabras difíciles seguidas.
// Referencias: Lomas et al. 2013 (lo fácil retiene más), Ryan, Rigby & Przybylski
// 2006 (sentirse capaz), Kivetz et al. 2006 (tramos cortos con meta cercana).
const { EXPANSION } = require('./mexicoVividoExpansion');
const PATH_ORDER = groups.map(([pathId]) => pathId);
const ROUNDS = 8;
const TIER_WEIGHTS = {
  1: [8, 6, 4, 3, 2, 1.5, 1.5, 1.5],
  2: [2, 4, 5, 5, 5, 5, 4, 4],
  3: [0, 0.5, 2, 3, 3.5, 3.5, 3.5, 3.5],
};

// Íconos de nostalgia que abren su camino (dentro de su nivel de dificultad).
const OPENING_FAVORITES = [
  'trompo', 'lotería', 'canicas', 'balero', 'escondidas', 'la traes', 'quemados', 'tazos', 'memorama', 'papalote',
  'El Chavo del 8', 'Chabelo', 'Chespirito', 'La Chilindrina', 'Don Ramón', 'Cantinflas', 'mande', 'ahorita', 'apapacho', 'rosca de Reyes',
  'chido', 'no manches', 'qué oso', 'órale', 'neta', 'qué onda', 'ni modo', 'chamba', 'cuate', 'cascarita',
  'taco', 'tamal', 'elote', 'esquite', 'quesadilla', 'torta', 'pozole', 'chilaquiles', 'mole', 'guacamole',
  'piñata', 'posada', 'aguinaldo', 'Día de Muertos', 'cempasúchil', 'calaverita', 'papel picado', 'kermés', 'El Santo', 'quinceañera',
  'mariachi', 'Cielito lindo', 'La Bamba', 'RBD', 'Maná', 'Juan Gabriel', 'Vicente Fernández', 'Pedro Infante', 'Los Ángeles Azules', 'banda',
  'Zócalo', 'chale', 'Bellas Artes', 'Ángel de la Independencia', 'troca', 'poblano', 'Castillo de Chapultepec',
  'sombrero charro', 'Frida Kahlo', 'Catrina', 'Diego Rivera', 'traje de charro',
  'Miguel Hidalgo', 'Niños Héroes', 'Pancho Villa', 'Emiliano Zapata', 'Batalla de Puebla', 'Moctezuma',
  'nopal', 'jaguar', 'tlacuache', 'coyote', 'colibrí', 'Chichén Itzá', 'Teotihuacan', 'cenote', 'guajolote',
  // Primeras de dificultad 2 en cada camino: reconocibles antes que cortas.
  'matatena', 'burro castigado', 'pilón', 'hacer la vaquita', 'vecindad', 'sonidero', 'garnacha', 'tlacoyo',
  'lucha libre', 'corrido', 'ranchera', 'bolero', 'tapatío', 'chilango', 'jarocho', 'alebrije', 'talavera', 'rebozo',
  'Llorona', 'Benito Juárez', 'Sor Juana', 'ajolote', 'mariposa monarca',
  'La Rosa de Guadalupe', 'Cri-Cri', 'Timbiriche', 'monitos', 'lada',
  'El Chapulín Colorado', 'fuchi', 'catafixia', 'itacate', 'chamoy', 'chicharrones de harina', 'carne asada',
  'el quinto partido', 'la ola',
];
// Conceptos cercanos que no deben salir juntos en el mismo tramo de un camino.
const RELATED_GROUPS = [
  ['náhuatl', 'mixteco', 'zapoteco', 'tsotsil', 'tseltal', 'chontal de Tabasco', 'yokot’an', 'wixárika', 'me’phaa', 'chinanteco', 'mazahua', 'maya yucateco', 'purépecha', 'náayeri'],
  ['tsotsil', 'tseltal'],
  ['pelota mixteca', 'ulama', 'juego de pelota mesoamericano'],
  ['alburear', 'albur', 'doble sentido', 'picardía verbal'],
  ['choco', 'jach', 'tuch', 'xix', 'turix'],
  ['resortera', 'resorte'],
  ['hacerse guaje', 'hacerse el occiso'],
  ['huerco', 'plebe'],
  ['tortuga laúd', 'tortuga carey'],
  ['alux', 'Xtáabay'],
  ['Francisco I. Madero', 'Venustiano Carranza'],
  ['María Félix', 'Sara García'],
  ['Pedro Infante', 'Jorge Negrete'],
  ['enfrijoladas', 'entomatadas'],
  ['pico de gallo', 'guacamole'],
  ['sopa de tortilla', 'sopa de lima'],
  ['cecina', 'tasajo'],
  ['mamey', 'chicozapote'],
  ['mole', 'mole negro'],
  ['torta', 'torta ahogada'],
  ['taco', 'taco de canasta'],
  ['pesero', 'micro', 'combi', 'camión'],
];

const favoriteRank = new Map(OPENING_FAVORITES.map((word, index) => [normalizeConceptVariant(word), index]));
const relatedGroups = new Map();
RELATED_GROUPS.forEach((words, index) => words.forEach((word) => {
  const key = normalizeConceptVariant(word);
  relatedGroups.set(key, [...(relatedGroups.get(key) || []), index]);
}));
const letterCount = (word) => word.normalize('NFD').replace(/[^a-zA-ZñÑ]/g, '').length;
const withTopic = (entry) => (
  entry[3] === 'ciencia-inventos-deporte'
    ? [...entry.slice(0, 8), ...Array(Math.max(0, 8 - entry.length)).fill(undefined), undefined, { topic: 'deporte' }]
    : entry
);

// Reparto con residuo mayor: conserva el total exacto de cada nivel de dificultad.
function apportion(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (total * w) / sum);
  const quotas = raw.map(Math.floor);
  let left = total - quotas.reduce((a, b) => a + b, 0);
  raw.map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index)
    .forEach(({ index }) => { if (left > 0 && weights[index] > 0) { quotas[index]++; left--; } });
  for (let index = 0; left > 0; index = (index + 1) % quotas.length) {
    if (weights[index] > 0) { quotas[index]++; left--; }
  }
  return quotas;
}

function planPathRounds(pathId) {
  const pool = [
    ...(groups.find(([id]) => id === pathId)?.[1] || []),
    ...(EXPANSION[pathId] || []).map(withTopic),
  ].map((entry, sourceIndex) => ({ entry, sourceIndex, key: normalizeConceptVariant(entry[0]), difficulty: entry[6] ?? 2 }));
  const rounds = Array.from({ length: ROUNDS }, () => []);
  const groupsOf = (key) => relatedGroups.get(key) || [];
  const groupSizes = new Map();
  pool.forEach(({ key }) => groupsOf(key).forEach((group) => groupSizes.set(group, (groupSizes.get(group) || 0) + 1)));
  const groupCap = (group) => Math.max(1, Math.ceil(groupSizes.get(group) / ROUNDS));
  const groupCount = (round, group) => round.filter(({ key }) => groupsOf(key).includes(group)).length;
  const fits = (round, key) => groupsOf(key).every((group) => groupCount(round, group) < groupCap(group));

  for (const tier of [1, 2, 3]) {
    const tierItems = pool.filter(({ difficulty }) => difficulty === tier).sort((a, b) => (
      (favoriteRank.get(a.key) ?? Infinity) - (favoriteRank.get(b.key) ?? Infinity)
      || letterCount(a.entry[0]) - letterCount(b.entry[0])
      || a.sourceIndex - b.sourceIndex
    ));
    const quotas = apportion(tierItems.length, TIER_WEIGHTS[tier]);
    tierItems.forEach((item, tierRank) => {
      const open = quotas.map((quota, index) => (quota > 0 ? index : -1)).filter((index) => index >= 0);
      const target = open.find((index) => fits(rounds[index], item.key)) ?? open[0];
      quotas[target]--;
      rounds[target].push({ ...item, tierRank });
    });
  }
  return rounds.map(interleaveByDifficulty);
}

// Reparte las palabras más fáciles del tramo entre las más difíciles, para que cada
// bloque de diez niveles tenga respiros reales y no una racha de difíciles al final.
function interleaveByDifficulty(round) {
  const sorted = [...round].sort((a, b) => a.difficulty - b.difficulty || a.tierRank - b.tierRank);
  const top = sorted.length ? sorted[sorted.length - 1].difficulty : 0;
  const allSame = sorted.every(({ difficulty }) => difficulty === top);
  const easy = allSame ? sorted.slice(0, Math.ceil(sorted.length / 2)) : sorted.filter(({ difficulty }) => difficulty < top);
  const hard = allSame ? sorted.slice(easy.length) : sorted.filter(({ difficulty }) => difficulty === top);
  const at = (items) => items.map((item, index) => ({ item, key: (index + 0.5) / items.length }));
  return [...at(easy), ...at(hard)]
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item.entry);
}

const plannedRounds = PATH_ORDER.map(planPathRounds);
const journeyGroups = [];
for (let round = 0; round < ROUNDS; round++) {
  PATH_ORDER.forEach((pathId, pathIndex) => {
    const entries = plannedRounds[pathIndex][round];
    if (entries.length) journeyGroups.push([pathId, entries, round + 1]);
  });
}

// El nivel 10 de cada bloque es un reto (difficultyWaves). Si un tramo empezara justo
// en un múltiplo de 10, ese nivel quedaría solo en su bloque y perdería el reto; se
// evita adelantando una palabra fácil de una vuelta posterior del mismo camino a una
// vuelta anterior; se repite hasta que ningún tramo empiece en un nivel de reto.
function firstChallengeClash() {
  let position = 0;
  for (let index = 0; index < journeyGroups.length; index++) {
    if (index > 0 && (position + 1) % 10 === 0) return index;
    position += journeyGroups[index][1].length;
  }
  return -1;
}
for (let attempt = 0, clash = firstChallengeClash(); clash > 0 && attempt < 100; attempt++, clash = firstChallengeClash()) {
  let moved = false;
  for (let receiver = clash - 1; receiver >= 0 && !moved; receiver--) {
    const pathId = journeyGroups[receiver][0];
    const donor = journeyGroups.slice(clash).find(([id, entries]) => id === pathId && entries.length > 1);
    if (!donor) continue;
    // La palabra que se mueve se parece a la dificultad media del tramo que la recibe,
    // para no vaciar de respiros la vuelta donante ni meter difíciles al inicio.
    const received = journeyGroups[receiver][1];
    const target = received.reduce((sum, entry) => sum + (entry[6] ?? 2), 0) / received.length;
    const distance = (entry) => Math.abs((entry[6] ?? 2) - target);
    const pick = donor[1].reduce((best, entry, at) => (
      distance(entry) < distance(donor[1][best]) || (distance(entry) === distance(donor[1][best]) && (entry[6] ?? 2) < (donor[1][best][6] ?? 2))
        ? at : best
    ), 0);
    journeyGroups[receiver][1] = [...received, donor[1][pick]];
    donor[1] = donor[1].filter((_, at) => at !== pick);
    moved = true;
  }
  if (!moved) break;
}
// Las palabras movidas llegaron al final de su tramo: se vuelve a intercalar cada
// tramo (solo cambia el orden interno, no los tamaños ni los retos).
journeyGroups.forEach((group) => {
  group[1] = interleaveByDifficulty(group[1].map((entry, tierRank) => ({ entry, tierRank, difficulty: entry[6] ?? 2 })));
});

// Tramos consecutivos del recorrido: [pathId, vuelta, niveles]. La UI los usa para
// mostrar el progreso por camino y vuelta sin cargar todo el catálogo.
const PATH_SEGMENTS = Object.freeze(journeyGroups.map(([pathId, entries, round]) => Object.freeze([pathId, round, entries.length])));

const MEXICO_VIVIDO_WORDS = Object.freeze(journeyGroups.flatMap(([pathId, entries]) => entries.map((entry) => {
  const [word, meaning, example, collectionId, placeId, icon, difficulty = 2, generation = G, sourceNote, options = {}] = entry;
  order += 1;
  return createCatalogEntry({
    word, meaning, example, collectionId, pathId, placeId, difficulty, generation,
    rating: options.rating, icon, order, conceptId: conceptKey(word),
    ...(SPORTS.has(word) ? { topic: 'deporte' } : {}),
    ...(sourceNote ? { sourceNote } : {}),
    ...options,
  });
})));

const REMOVED_WORDS = [
  {
    word: 'bato',
    reason: 'Se retiró del recorrido editorial porque la pista antigua lo presentaba como sinónimo directo de cuate y lo ubicaba fuera de su contexto regional.',
    legacyPresentation: {
      meaning: 'Muchacho u hombre, en lenguaje popular.',
      example: 'Ese bato esperaba el camión con sus amigos.',
      region: 'Noroeste y occidente',
      collectionId: 'regiones-hablas',
      placeId: 'sinaloa',
      icon: '🧢',
      difficulty: 2,
    },
  },
  {
    word: 'bato loco',
    reason: 'Se retiró por ser una expresión imprecisa y estereotipada que no corresponde al apartado de CDMX.',
    legacyPresentation: {
      meaning: 'Expresión coloquial para un hombre considerado temerario.',
      example: 'En la película llamaban bato loco al personaje más temerario.',
      region: 'Noroeste y occidente',
      collectionId: 'regiones-hablas',
      placeId: 'sinaloa',
      icon: '🧢',
      difficulty: 2,
    },
  },
  {
    word: 'wey',
    reason: 'Duplicaba una variante ortográfica y su pista lo reducía incorrectamente a sinónimo de amigo.',
    legacyPresentation: {
      meaning: 'Grafía informal usada en mensajes para representar la voz «güey».',
      example: 'En el mensaje escribió «wey» como variante informal de «güey».',
      region: 'Todo México', collectionId: 'regiones-hablas', placeId: 'todo-mexico', icon: '💬', difficulty: 2,
    },
  },
  {
    word: 'güey',
    reason: 'Se retiró para evitar una pista ambigua que lo presentaba simplemente como amigo.',
    legacyPresentation: {
      meaning: 'Tratamiento coloquial cuyo sentido cambia entre confianza y molestia según el tono.',
      example: 'Entre personas de confianza, el tono dejó claro cómo usaron la palabra güey.',
      region: 'Todo México', collectionId: 'regiones-hablas', placeId: 'todo-mexico', icon: '💬', difficulty: 2,
    },
  },
  {
    word: 'carnal',
    reason: 'Su pista antigua se confundía con cuate y no explicaba el vínculo de hermandad o confianza estrecha.',
    legacyPresentation: {
      meaning: 'Hermano o persona tratada con afecto y mucha confianza.',
      example: 'Lo llamó carnal porque crecieron juntos y se tienen mucha confianza.',
      region: 'Todo México', collectionId: 'regiones-hablas', placeId: 'todo-mexico', icon: '🤜🤛', difficulty: 2,
    },
  },
  {
    word: 'ñero',
    reason: 'La definición «amigo de la calle» era imprecisa y podía reforzar un estereotipo social.',
    legacyPresentation: {
      meaning: 'Tratamiento callejero derivado de compañero; puede ser despectivo según el contexto.',
      example: 'El glosario explicó que ñero cambia de intención según el tono y el contexto.',
      region: 'Uso regional variable', collectionId: 'regiones-hablas', placeId: 'unclassified', icon: '💬', difficulty: 3,
    },
  },
  {
    word: 'morra / morro',
    reason: 'Combinaba dos respuestas en un solo nivel y las presentaba como voces generales de todo México.',
    legacyPresentation: {
      meaning: 'Formas populares para una joven y un joven, especialmente en el noroeste.',
      example: 'En el noroeste es común oír morra o morro al hablar de gente joven.',
      region: 'Noroeste', collectionId: 'regiones-hablas', placeId: 'sinaloa', icon: '🧑', difficulty: 2,
    },
  },
  {
    word: 'morro',
    reason: 'Estaba asignado a CDMX aunque su marca regional documentada corresponde al noroeste.',
    legacyPresentation: {
      meaning: 'Niño o joven, en el habla popular del noroeste.',
      example: 'De morro jugaba futbol todas las tardes con la gente de la cuadra.',
      region: 'Noroeste', collectionId: 'regiones-hablas', placeId: 'sinaloa', icon: '🧒', difficulty: 2,
    },
  },
  {
    word: 'morra',
    reason: 'Estaba asignada a CDMX aunque su marca regional documentada corresponde al noroeste.',
    legacyPresentation: {
      meaning: 'Niña o joven, en el habla popular del noroeste.',
      example: 'La morra del equipo anotó el gol durante la cascarita.',
      region: 'Noroeste', collectionId: 'regiones-hablas', placeId: 'sinaloa', icon: '🧒', difficulty: 2,
    },
  },
  {
    word: 'morrita',
    reason: 'Necesitaba la misma corrección regional que morra y morro.',
    legacyPresentation: {
      meaning: 'Forma diminutiva para una niña o joven, propia del habla popular del noroeste.',
      example: 'La familia recordó que de morrita aprendió a andar en bicicleta.',
      region: 'Noroeste', collectionId: 'regiones-hablas', placeId: 'sinaloa', icon: '🧒', difficulty: 2,
    },
  },
  {
    word: 'palomilla',
    reason: 'La pista antigua incluía la palabra cuates y permitía más de una respuesta razonable.',
    legacyPresentation: {
      meaning: 'Grupo de personas que conviven y salen juntas con frecuencia.',
      example: 'La palomilla se reunió en la cancha después de la escuela.',
      region: 'Todo México', collectionId: 'vida-barrio', placeId: 'todo-mexico', icon: '👥', difficulty: 2,
    },
  },
  {
    word: 'naco',
    reason: 'Se retiró por ser un insulto clasista presentado sin contexto crítico en una experiencia familiar.',
    legacyPresentation: {
      meaning: 'Insulto clasista aplicado a quien se considera de mal gusto; conviene evitarlo.',
      example: 'El taller analizó por qué usar naco para humillar a alguien reproduce prejuicios.',
      region: 'Todo México', collectionId: 'regiones-hablas', placeId: 'todo-mexico', icon: '⚠️', difficulty: 3,
    },
  },
  {
    word: 'chaleco',
    reason: 'La acepción «persona torpe» y su asignación a CDMX no tenían sustento editorial suficiente.',
    legacyPresentation: {
      meaning: 'Voz regional pendiente de documentación; no debe asumirse como expresión de CDMX.',
      example: 'El equipo editorial dejó chaleco fuera del recorrido hasta documentar su uso.',
      region: 'Uso regional no confirmado', collectionId: 'regiones-hablas', placeId: 'unclassified', icon: '❓', difficulty: 3,
    },
  },
  { word: 'cadena de tías', reason: 'Formulación retirada para no asociar una práctica digital familiar con un género específico.' },
  { word: 'teleteatro', reason: 'Término poco usado en México; se sustituyó por La Rosa de Guadalupe.' },
  { word: 'historieta mexicana', reason: 'Formulación forzada; en México se dice monitos, que es la que se conserva.' },
  { word: 'ronda infantil', reason: 'Nombre genérico sin sello mexicano; se sustituyó por Cri-Cri.' },
  { word: 'relato oral', reason: 'Término académico; se sustituyó por la leyenda del Callejón del Beso.' },
  { word: 'cadena de buenos días', reason: 'Práctica digital no propia de México; se sustituyó por dar un timbrazo.' },
  { word: 'sticker de buenos días', reason: 'Práctica digital no propia de México; se sustituyó por lada.' },
  { word: 'grupo de la familia', reason: 'Formulación genérica; se sustituyó por llamada por cobrar.' },
  { word: 'orquesta típica', reason: 'Poco reconocible como respuesta; se sustituyó por Timbiriche.' },
  { word: 'chilangoísmo', reason: 'Término de glosario poco usado; se sustituyó por chale.' },
  { word: 'televisión a color', reason: 'Formulación forzada; se conserva al inventor, Guillermo González Camarena.' },
  { word: 'cero', reason: 'Respuesta de cuatro letras sin sello mexicano en la palabra; se sustituyó por hule.' },
  { word: 'colorante grana', reason: 'Formulación forzada; se conserva el nombre usual, grana cochinilla.' },
  { word: 'picardía verbal', reason: 'Término genérico; se sustituyó por echar carrilla.' },
  { word: 'regiomontano', reason: 'Duplicaba el concepto de regio; se conservó la forma coloquial, más reconocible.' },
  { word: 'rayuela', reason: 'Duplicaba el concepto de avioncito; se conservó la variante mexicana del juego.' },
  { word: 'laqueado', reason: 'Duplicaba el concepto artesanal de maque; se sustituyó por telar de cintura.' },
  { word: 'costa', reason: 'Región demasiado genérica; se sustituyó por lugares canónicos concretos.' },
  { word: 'influencer', reason: 'Concepto efímero y no específicamente mexicano.' },
  { word: 'yucateco genérico', reason: 'Mezclaba culturas y estados distintos del sureste.' },
  { word: 'español', reason: 'Duplicado editorial sin anclaje en un camino cultural.' },
  { word: 'niño', reason: 'Término general sustituido por experiencias concretas de niñez mexicana.' },
];

const review = (category, reason) => ({ category, reason });
const FIRST_FIFTY_CONTEXT_REVIEW = {
  trompo: review('juego', 'Juego de destreza muy recordado en patios y recreos mexicanos.'),
  lotería: review('juego', 'Juego ilustrado inseparable de reuniones familiares y ferias mexicanas.'),
  canicas: review('juego', 'Juego de tierra y puntería arraigado en la memoria infantil mexicana.'),
  balero: review('juego', 'Juguete tradicional presente en hogares y ferias populares de México.'),
  escondidas: review('juego', 'Juego de esconderse que casi cualquier infancia mexicana jugó en patios y calles.'),
  'la traes': review('juego', 'Nombre mexicano del juego de persecución, gritado en recreos de todo el país.'),
  quemados: review('juego', 'Nombre mexicano del juego de pelota para eliminar rivales en la clase de deportes.'),
  matatena: review('juego', 'Juego de coordinación conocido por varias generaciones de niñas y niños mexicanos.'),
  tazos: review('juego', 'Coleccionables de frituras que marcaron los recreos mexicanos de los noventa.'),
  memorama: review('juego', 'Nombre mexicano del juego de parejas, presente en casas y salones de preescolar.'),
  papalote: review('lenguaje', 'Palabra de origen náhuatl cotidiana en México para el juguete volador.'),
  gis: review('escuela', 'Nombre mexicano de la tiza, ligado al pizarrón de la primaria.'),
  gato: review('juego', 'Nombre mexicano del tres en raya, jugado en cuadernos y pizarrones escolares.'),
  'Cri-Cri': review('medios', 'El Grillito Cantor de Gabilondo Soler acompañó festivales y kínderes mexicanos por generaciones.'),
  'El Chavo del 8': review('medios', 'Programa de Chespirito que reúne a familias mexicanas frente a la tele desde los setenta.'),
  Chabelo: review('medios', 'Conductor del programa dominical infantil que acompañó a generaciones de familias mexicanas.'),
  Chespirito: review('medios', 'Creador mexicano de personajes que siguen presentes en el habla y la memoria del país.'),
  pilón: review('mercado', 'Cantidad de cortesía ligada a la relación entre marchantes y clientela en México.'),
  'La Chilindrina': review('medios', 'Personaje de la vecindad de El Chavo recordado por varias generaciones mexicanas.'),
  'Don Ramón': review('medios', 'Personaje de la vecindad de El Chavo convertido en ícono popular mexicano.'),
  Cantinflas: review('medios', 'Cómico del cine mexicano cuya forma de hablar dio origen a la palabra cantinflear.'),
  mande: review('lenguaje', 'Respuesta cortés muy característica de la crianza y convivencia en México.'),
  ahorita: review('lenguaje', 'Expresión mexicana cuyo alcance temporal se entiende mediante el contexto.'),
  monitos: review('lenguaje', 'Nombre mexicano de las historietas del periódico dominical que leían abuelos y nietos.'),
  apapacho: review('lenguaje', 'Voz afectiva especialmente reconocible en el español cotidiano de México.'),
  'rosca de Reyes': review('familia', 'Tradición del 6 de enero en que quien saca el muñeco invita los tamales de la Candelaria.'),
  chido: review('lenguaje', 'Adjetivo coloquial mexicano para algo que está muy bien.'),
  'no manches': review('lenguaje', 'Expresión mexicana de sorpresa, apta para toda la familia.'),
  órale: review('lenguaje', 'Interjección mexicana de ánimo, sorpresa o acuerdo.'),
  'hacer la vaquita': review('barrio', 'Costumbre mexicana de juntar dinero entre varios para un gasto común.'),
  neta: review('lenguaje', 'Voz coloquial mexicana para la verdad, usada por varias generaciones.'),
  'qué onda': review('lenguaje', 'Saludo informal mexicano extendido desde la juventud de los sesenta.'),
  'ni modo': review('lenguaje', 'Expresión mexicana de resignación muy usada en la vida diaria.'),
  chamba: review('lenguaje', 'Voz coloquial mexicana para el trabajo u ocupación.'),
  cuate: review('lenguaje', 'Voz coloquial mexicana para una amistad o compañía cercana.'),
  vecindad: review('barrio', 'Forma de vivienda colectiva emblemática de la memoria urbana de Ciudad de México.'),
  cascarita: review('barrio', 'Partido improvisado con mochilas como porterías, escena común de barrios mexicanos.'),
  nel: review('lenguaje', 'Forma coloquial mexicana de decir que no, reconocible en todo el país.'),
  taco: review('cocina', 'Platillo central de la comida mexicana, de puestos de esquina a mesas familiares.'),
  tamal: review('cocina', 'Masa de maíz envuelta en hojas, presente en desayunos, posadas y la Candelaria.'),
  garnacha: review('mercado', 'Nombre mexicano para los antojitos de masa de puestos y ferias.'),
  elote: review('mercado', 'Mazorca tierna con limón y chile vendida en plazas y esquinas mexicanas.'),
  esquite: review('mercado', 'Granos de elote en vaso, antojo típico de plazas mexicanas por la tarde.'),
  quesadilla: review('cocina', 'Antojito mexicano de comal cuyo relleno cambia según la región.'),
  torta: review('cocina', 'Pan relleno que acompaña lonches escolares y comidas rápidas en México.'),
  pozole: review('cocina', 'Caldo de maíz cacahuazintle ligado a las fiestas patrias mexicanas.'),
  tlacoyo: review('mercado', 'Antojito de masa rellena vendido en mercados y tianguis del centro de México.'),
  chilaquiles: review('cocina', 'Desayuno mexicano de totopos en salsa, clásico del día después de la fiesta.'),
  'qué oso': review('lenguaje', 'Expresión mexicana de vergüenza muy usada por jóvenes desde los noventa.'),
  sonidero: review('barrio', 'Cultura de baile y saludos con arraigo particular en barrios de Ciudad de México.'),
};

module.exports = { MEXICO_VIVIDO_WORDS, PATH_SEGMENTS, REMOVED_WORDS, FIRST_FIFTY_CONTEXT_REVIEW, SEMANTIC_CONCEPT_OVERRIDES, createCatalogEntry };
