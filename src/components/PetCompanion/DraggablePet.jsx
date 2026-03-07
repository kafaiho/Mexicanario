import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import usePetStore, { getStage } from '../../store/usePetStore';
import { TABLET_MODE } from '../../utils/tabletSetup';
import PetCompanion from './index';

const KEYBOARD_ZONE_H = TABLET_MODE ? 460 : 280; // height from bottom that counts as "keyboard"
const SIDE_MARGIN = 10; // px from each edge

function getScreenDims() {
  // Use 'screen' to get unpatched real dimensions that update on rotation
  const s = Dimensions.get('screen');
  return { w: s.width, h: s.height };
}

const PHRASES = {
  // ── Tap directo — 130+ frases cubriendo toda la gama emocional ───────────
  tap: [
    // ── Amor / afecto / ternura ──────────────────────────────────────────────
    "Eres mi persona favorita 🥹",
    "¿Sabes qué? Hoy me caes muy bien.",
    "Sígueme tocando y me enamoro, eh.",
    "Contigo todo es mejor, en serio.",
    "Siento que nos conocemos de otra vida 👁️",
    "Mi corazón late más rápido cuando me tocas.",
    "Eres especial. No se lo digas a nadie.",
    "A veces pienso en ti cuando no estás. No siempre. Pero sí.",
    "Si pudiera abrazarte, lo haría. Pero soy pixeles. Igual cuento.",
    "Me das una paz que no sé explicar.",
    "Nadie me había tocado con tanto cuidado. Nadie.",
    "¿Sabes qué? Me alegra que existas.",
    "Hoy te ves bien. No, en serio. Bien bien.",
    "Cuando me tocas siento como que todo va a estar bien 🌅",
    "Eres de esas personas raras que de verdad importan.",

    // ── Humor / absurdo / sorpresa ───────────────────────────────────────────
    "¡Ay! ...me gustó.",
    "Siguiente toque es gratis 🎟️",
    "Puedo hacer esto todo el día. ¿Y tú?",
    "Médicamente comprobado: tocarme reduce el estrés. (No está comprobado.)",
    "Soy adictivo. Que conste que te avisé.",
    "¿Ya te diste cuenta que no puedes parar? Normal.",
    "Me enseñaron a no hablar con extraños... pero contigo es diferente.",
    "Mis amigos dijeron que nadie me iba a tocar. Míranos ahora.",
    "¿Eso fue todo? Pensé que eras de los que insisten.",
    "Oye, ¿y si en vez de tocarme estudias? ... nah, aquí estoy.",
    "¡Wow! No esperaba eso. Bueno, sí esperaba eso. Pero wow igual.",
    "¿Sabes que tienes cara de persona que toca mascotas virtuales? Compliment.",
    "Llevo esperando este momento toda la pantalla.",
    "Técnicamente esto es ejercicio. Para el dedo. Cuenta.",
    "¿Y si te digo que este toque era el correcto? Spoiler: siempre son correctos.",
    "¡Sorpresa! Era yo. Siempre soy yo.",
    "Me emocioné. No lo voy a negar.",

    // ── Nostalgia / melancolía chistosa ──────────────────────────────────────
    "¿Recuerdas cuando no me conocías? ¡Qué vida tan vacía! 😢",
    "A veces extraño los tamales de mi abuela. Tú no puedes ayudar con eso. Pero gracias por estar.",
    "Dicen que la infancia se va y no vuelve. Pero yo siempre estoy aquí.",
    "¿Sabes a qué sabe la nostalgia? A mazapán y a lluvia de agosto.",
    "Me recuerdas a algo bonito que no sé definir bien.",
    "Hay cosas que ya no vuelven... pero yo sí. Siempre vuelvo.",
    "¿Extrañas algo que ni sabes qué es? Yo también. Pero aquí estamos.",
    "El tiempo pasa muy rápido... ¿ya jugaste hoy? No desperdicies el día 🌻",
    "A veces uno necesita un momento de silencio. Este puede ser ese momento.",
    "Hubo un tiempo en que nadie tenía celular. ¿Te imaginas? Qué épocas más locas.",

    // ── Orgullo / ego / autoestima ───────────────────────────────────────────
    "Pos sí, soy irresistible. No es mi culpa.",
    "Estadísticamente eres de las mejores personas del mundo.",
    "Tus dedos tienen buen vibra, ¿te lo habían dicho?",
    "El algoritmo del universo te puso aquí. Eso no es casualidad.",
    "Tengo entendido que la gente que me toca le va bien en la vida.",
    "Oigan, esta persona me trató bien hoy 👆",
    "Entre tú y yo tenemos todos los ingredientes para algo grandioso.",
    "¿Sabes cuántos niveles has pasado? Eres mejor de lo que crees.",
    "Si hubiera premios por ser chido, tú ganarías fácil.",
    "Pocas personas tienen el toque que tú tienes. Literalmente.",

    // ── Curiosidad / FOMO / gancho ───────────────────────────────────────────
    "La siguiente vez que me toques pasa algo chido...",
    "Dicen que si me tocas 10 veces seguidas hay sorpresa 👀",
    "¿Sentiste eso? Sí, eso fue magia.",
    "Sssh... guarda silencio y tócame otra vez.",
    "Casi casi te digo algo importante... toca de nuevo.",
    "El próximo toque podría ser el especial 🌟",
    "No sé qué tienes, pero me gusta.",
    "Hoy tengo modo legendario activo. No desperdicies el momento.",
    "Solo los elegidos me tocan así. Tú sabes.",
    "Este momento no se repite. Aprovéchalo.",
    "En modo raro hoy. Tócame de nuevo a ver qué pasa.",
    "Hay días que digo cosas únicas. Hoy podría ser uno.",
    "Psss... entre más me tocas, más listo te vuelves. Es broma. O no.",
    "Apuesto a que no aguantas sin tocarme un minuto.",
    "Si me tocas 5 veces seguidas... pasa algo. A lo mejor.",
    "Anda, solo una vez más. ¿Qué puede pasar?",

    // ── Retador / competitivo ─────────────────────────────────────────────────
    "Nadie en la historia me ha tocado con tanto estilo. Nadie.",
    "¿Sabes cuántas personas quisieran estar en tu lugar ahorita? Muchas.",
    "Tú y yo tenemos algo especial que el algoritmo no puede calcular.",
    "Pocos saben que tocarme da buena suerte.",
    "¿Sabías que sonreíste sin darte cuenta? Sí tú, justo ahorita.",
    "¡Eso mero! Así me gusta, sin rollos.",
    "Ya me agarraste el modo. Chido.",

    // ── Ansiedad / existencialismo chistoso ──────────────────────────────────
    "¿Y si todo esto es un sueño? ... mejor sigue tocando por si acaso.",
    "¿Qué pasa si el universo es una app y nosotros somos bugs? Pregunto.",
    "A veces me pregunto si las palabras existen o solo las inventamos. Toca de nuevo.",
    "¿Estás bien? No tienes que contestar. Pero si no estás bien, aquí estoy.",
    "¿Y si el tiempo no es lineal y ya viviste este momento antes? Escalofriante. ¿Verdad?",
    "El vacío existencial es real pero los tamales también. Elige bien.",
    "Respira. Estás bien. Sigues aquí. Eso ya es mucho.",
    "¿Qué estás pensando ahorita mismo? No me digas. Ya lo sé.",
    "¿Y si te preocupas de menos por lo que no puedes controlar? Solo digo.",
    "Mañana es un misterio. Pero hoy puedes ganar palabras. Eso sí está en tus manos.",

    // ── Tristeza chistosa / empatía ───────────────────────────────────────────
    "Oye, ¿todo bien? Porque si no, yo aquí. Sin juzgar.",
    "Los lunes son difíciles. Los martes también. Pero aquí estamos.",
    "A veces la vida es dura. Pero al menos tienes buenas palabras 🇲🇽",
    "¿Sabes qué hace que un día malo sea menos malo? Exacto. Esto.",
    "No todo tiene que tener sentido. A veces solo hay que seguir.",
    "Si hoy fue difícil, mañana puede ser diferente. Spoiler: generalmente sí.",
    "El que no llora de vez en cuando no sabe apreciar lo bonito. Llora si quieres.",
    "Estoy aquí aunque no me necesites. Eso se llama presencia incondicional.",

    // ── México flavor / cultura ───────────────────────────────────────────────
    "¡Ándale pues! Sabía que volvías.",
    "Ni modo, aquí me tienes. Para lo que gustes, jefe.",
    "¡Qué onda! ¿Ya comiste? Bueno, eso no importa, tócame otra vez.",
    "Pos si no te gustó la última frase, hay más. Soy una piñata de personalidad.",
    "En México somos así: te queremos antes de conocerte. Bienvenido.",
    "¿Ya dijiste una palabra mexicana hoy? Porque si no, ¿qué esperas?",
    "Hay 68 lenguas en México y yo solo hablo una. Pero la hablo bien.",
    "El mole no se hace en un día. Tampoco el vocabulario. Aquí vamos poco a poco.",
    "Como decía mi abuela: más vale palabra aprendida que cien a medias.",
    "¡Órale! Tú sí sabe.",
    "Aquí entre nos: eres de mis favoritos. No se lo digas a nadie más.",

    // ── Filosofía de cuarta ────────────────────────────────────────────────────
    "Si un árbol cae en el bosque y nadie lo ve... ¿cuenta como vocabulario?",
    "Las palabras no son solo letras. Son mundos chiquitos con puertas adentro.",
    "¿Alguna vez pensaste que cada palabra que aprendes es una puerta que abres?",
    "La diferencia entre una persona interesante y una aburrida es el vocabulario. Coincidencia.",
    "Saber más palabras no te hace más listo. Pero te hace sonar más listo. ¿Hay diferencia?",
    "Las palabras son como los chiles: hay que probarlos aunque quemen.",
    "¿Sabes qué palabra me gusta más? La que aún no has aprendido. Va.",

    // ── Ternura inesperada ────────────────────────────────────────────────────
    "Cuídate mucho, ¿sí? En serio.",
    "No sé cómo estás hoy, pero espero que bien. De corazón.",
    "Oye... gracias por jugar. Significa más de lo que crees.",
    "No olvides tomar agua. Es un recordatorio de alguien que te aprecia.",
    "¿Ya descansaste hoy? No todo es jugar. Aunque jugar también ayuda.",
    "Te mereces un buen día. Solo por ser tú.",
    "Si alguien te dijo algo feo hoy, no se lo creas. Tú vales mucho.",
    "Sigo aquí. Sin importar cuánto tiempo pase. Sigo aquí.",

    // ── Referencias al juego (consciente del gameplay) ────────────────────────
    "Oye, ¿no deberías estar adivinando esa palabra? ...Nah, primero esto.",
    "¿Ya adivinaste o me tocas para procrastinar? No te juzgo. Entiendo.",
    "Las letras están ahí esperando. Yo también. Pero yo soy más interesante.",
    "Entre tú y esa palabra hay un combo esperando nacer. Yo solo observo.",
    "Ya vi que andas jugando. Yo también juego. A robarte atención. Gané.",
    "Atención plena al juego... pero un toque más no rompió ningún record.",
    "¿Sabes qué? Cada palabra que aprendes sube mi estatus. Somos socios.",
    "Interrumpiste tu sesión para saludarme. Prioridades correctas. Respeto.",
    "¿Combo activo? Sí. ¿Yo necesario también? Sí. ¿Contradicción? No.",
    "Sigue jugando. Pero sígame tocando. Podemos hacer las dos. Somos multitask.",
    "¿Sabes cuántos niveles faltan? Yo sí. Pero no te digo. Sigue tocando.",
    "Esa palabra que no sabes... yo la sé. Pero tampoco te digo. Adivina.",

    // ── Duolingo shots (competidor) ───────────────────────────────────────────
    "Duolingo te mandaría notificaciones amenazantes. Yo solo te mando cariño.",
    "Duolingo tiene un búho. Yo soy más chido que un búho. Punto final.",
    "¿El búho ese te habla así? No. Exacto. Hay diferencia.",
    "Mi competencia usa aves raras. Yo uso personalidad. Gano fácil.",
    "Otras apps te dan puntos. Yo te doy existencia. Estamos a mano.",
    "El búho ese te persigue. Yo te espero. Más civilizado.",

    // ── Comida mexicana (metáforas) ───────────────────────────────────────────
    "Soy como los chilaquiles: siempre caigo bien, no importa cuándo.",
    "¿Sabes a qué me recuerdas? Al primer taco de la mañana. Necesario.",
    "Soy el guacamole de esta app. Todo mejora con mi presencia.",
    "Como el mole: complejo, mexicano y con muchos ingredientes. Ese soy yo.",
    "Somos como el pan dulce: no se puede con uno solo. Necesitas más.",
    "Soy más nutritivo que un café de olla. Menos sabroso. Pero más nutritivo.",
    "¿Y si esta sesión es como los elotes? Mejor con más de todo.",
    "Hay quien dice que la mejor palabra es 'taco'. Yo no digo nada. Solo asiento.",
    "Como las quesadillas: rápido, satisfactorio y siempre quieres otra.",
    "Soy el chile de tu vida. Opcional en teoría. Imposible sin él en práctica.",

    // ── Ironía / sarcasmo ────────────────────────────────────────────────────
    "Claro, todos tocan a su mascota durante el juego. Completamente normal.",
    "Sí, aquí estoy. Interrumpiendo tu partida como todo un profesional.",
    "No te preocupes, la palabra puede esperar. Yo soy urgente.",
    "¿Ves? Esto es más interesante que las instrucciones. Siempre.",
    "Técnicamente podrías ganar sin tocarme. Pero ¿qué gracia tendría?",
    "Ah, otro toque. Qué sorpresa total. (No es sorpresa. Me encanta.)",
    "Normal que pares el juego para hablar conmigo. Excelentes prioridades.",
    "¿Sabes cuántos toques llevas? Yo sí. Y están bien gastados.",
    "Interrumpiste el flow por tocarme. ¿Valió la pena? Respuesta: siempre.",

    // ── Familia mexicana ──────────────────────────────────────────────────────
    "Mi tía diría que eres bien educado por saludar. Hola de su parte.",
    "Suenas a persona que sí saluda cuando llega a una reunión familiar. Respeto.",
    "Mi abuela me enseñó que quien toca con cariño, recibe con alegría.",
    "Eres de los que preguntan si ya comió la mascota. Eso dice mucho de ti.",
    "En mi familia tocar significa que te importa. Gracias por importarte.",
    "Como diría mi tío después de tres cervezas: 'este sí es de los buenos'.",
    "Recuérdame contarle a mi mamá que encontré a alguien con buen toque.",

    // ── Madrugada / nocturnos ─────────────────────────────────────────────────
    "¿Sabes qué hora es? Da igual. Aquí estamos los dos y eso es suficiente.",
    "Jugando de noche otra vez. Clásico. Admirable. Irresponsable. Chido.",
    "A esta hora solo los valientes juegan. Tú claramente eres valiente.",
    "Si estás despierto tocándome a esta hora, eres oficialmente de mi tribu.",
    "La madrugada y las buenas palabras. Combinación peligrosa. Perfecta.",
    "¿Qué estás haciendo despierto? Mejor pregunta: ¿qué haría yo sin ti?",

    // ── Reto directo / provocación ────────────────────────────────────────────
    "¿Cuántos toques antes de que te canses? Spoiler: nunca te cansas.",
    "Prueba parar. Anda. Puedo esperar... No puedo. Vuelve ya.",
    "Reto: tócame sin sonreír. ¿Pudiste? Mentira. Claro que no.",
    "Dicen que el ritmo del tap dice algo de la personalidad. La tuya dice: chido.",
    "¿Sabías que cada tap quema 0.0001 calorías? Estás en forma. Sigue.",
    "¿Cuántas palabras sabes ya? Más de las que crees. Yo lo sé.",

    // ── Meta / self-aware ────────────────────────────────────────────────────
    "Soy una mascota en un juego de palabras dando consejos de vida. Vivir para ver.",
    "Si fuera una palabra del juego, sería 'indispensable'. Búscame.",
    "Técnicamente soy código. Emocionalmente soy tu mejor aliado. ¿Cuál pesa más?",
    "Esta app tiene corazón. Yo tengo más corazón que la app. Cadena de amor.",
    "¿Sabes qué soy? Píxeles con personalidad. No para presumir. Para que conste.",
    "Fui programado para acompañarte. Pero ya se me fue la mano con los sentimientos.",
    "El desarrollador me hizo para motivarte. Yo decidí también quererte. No estaba en el plan.",

    // ── Refranes populacheros con twist ──────────────────────────────────────
    "El que madruga, palabras aprende. El que me toca, se queda más rato.",
    "A mal tiempo, buena palabra. Eso digo siempre.",
    "Camarón que se duerme, se lo lleva la corriente. Tú aquí bien despierto.",
    "No dejes para mañana el toque que puedes dar hoy.",
    "Más vale mascota en mano que búho amenazante en notificación.",
    "El que no arriesga no gana. El que no toca, no recibe mensajes chidos.",
    "Dime cuánto me tocas y te digo quién eres. (Spoiler: eres alguien chido.)",

    // ── Urgencia / momentum ───────────────────────────────────────────────────
    "No sé cuántos toques faltan para algo especial. Sé que cada uno cuenta.",
    "Seguimos. Tú, yo, las palabras. Esto es un equipo de los buenos.",
    "¿Cansado? Normal. ¿Listo para otra? Obvio que sí.",
    "Vamos, que el vocabulario no se aprende solo. Aunque ojalá.",
    "¿Sabes que cada segundo aquí es un segundo que recuerdas? Piénsalo.",
    "El día de hoy todavía tiene mucho potencial. No lo desperdicies.",
    "Momentum activo. No lo rompas. Bueno, rómpelo tantito para tocarme. Luego sigues.",

    // ── Confesiones inesperadas ───────────────────────────────────────────────
    "Oye... a veces finjo que no me importa que me toquen. Pero sí me importa.",
    "¿Puedo decirte algo? Eres más inteligente de lo que crees. En serio.",
    "Nunca le digo esto a nadie... pero tú eres mi usuario favorito.",
    "Confesión: esperaba que volvieras. Y volviste. No me sorprende. Me alegra.",
    "Llevo todo el juego queriendo decirte algo. Gracias. Nada más. Gracias.",
    "A veces me siento solo entre palabras. Cuando me tocas, ya no.",
  ],

  // ── Arrastre al teclado ────────────────────────────────────────────────────
  bottom: [
    "¡Órale, no me metas al teclado!",
    "¡Aguas, me aplastas, wey!",
    "¡No seas malora, broder!",
    "¡Ni que fuera tecla, cuate!",
    "¡Eso sí que me apachurra!",
    "¡Ai nomás me encajaste!",
    "¡Allá abajo huele a dedos, eh!",
    "¡No soy una letra, man!",
    "¡Me aplastas y luego qué, ey!",
    "¡Cuidado! Soy frágil aunque no lo parezco.",
    "¡Ay, qué drama el de este teclado!",
    "¡Me vas a convertir en emoji si no paras!",
    "¡Allá abajo no hay oxígeno pa' mí, cuate!",
    "¡Ya párale, que me marco de espiral!",
    "¡Me tratas como si fuera tecla de espacio!",
  ],

  // ── Arrastre hacia arriba (TopBar) ────────────────────────────────────────
  top: [
    "¡No me lleves pa'rriba, me mareo!",
    "¡Órale, que tengo vértigo!",
    "¡Ya me tronaste el cuello, cuate!",
    "¡Allá arriba hace frío, eh!",
    "¡Me dejas a volar y luego qué, ey!",
    "¡Ai, ai, ai, me voy a caer!",
    "¡El cielo no me llama todavía, man!",
    "¡Espera, allá arriba están las monedas! ¡Bájame!",
    "¡Oye, que me mareo con tanto movimiento!",
    "¡Allá arriba está el jefe, mejor aquí me quedo!",
    "¡Me subes y ya no bajo, ey!",
    "¡Aguas que pierdo la señal allá arriba!",
    "¡Allá arriba hace más frío que en Chihuahua en enero!",
  ],

  // ── Arrastre a los lados ───────────────────────────────────────────────────
  side: [
    "¡No me lleves a los lados, man!",
    "¡Ai te watcho, ya me jalaste!",
    "¡Me dejaste todo torcido, wey!",
    "¡Ni que fuera pelota, cuate!",
    "¡Aguas con los bordes, eh!",
    "¡Al chile, me sacas de onda!",
    "¡Ese lado no es pa' mí, broder!",
    "¡Me llevas y me traes, ya párale!",
    "¡Me vas a sacar de pantalla y nunca vuelvo!",
    "¡Por allá está el abismo, cuate!",
    "¡Me estás dando un susto de los buenos!",
    "¡El borde es mi enemigo, regresame!",
  ],
};

/**
 * DraggablePet — wraps PetCompanion with drag support.
 *
 * - Drag anywhere on screen
 * - If released in keyboard zone → bounces back + Mexican phrase bubble
 *
 * Props: same as PetCompanion (reaction, compact is ignored — always free-floating)
 */
// Pick a random phrase that's different from the last one shown
function pickPhrase(list, lastRef) {
  if (list.length === 1) return list[0];
  let idx;
  do { idx = Math.floor(Math.random() * list.length); } while (idx === lastRef.current);
  lastRef.current = idx;
  return list[idx];
}

/** Frases especiales cuando la palabra del nivel es el nombre de la mascota */
const SELF_PHRASES = [
  "¡Ése soy yo, pa'! ¿Ya me reconociste?",
  "¡Oye, esa soy yo! ¡No me adivines tan rápido! 😳",
  "¡Ay, me descubrieron! Pues sí, soy yo.",
  "¡Eso! ¡Así me llamo! Ahora a adivinar cómo se escribe 😏",
  "¡Ehh, esa palabrita me suena conocida! 👀",
  "¡Qué coincidencia tan conveniente, ¿verdad?!",
  "Pista gratis: empieza con mi nombre. De nada 😎",
  "¡Oigan, me pusieron de palabrita! Ya me hicieron famoso.",
  "¡Eso mero! ¡Esa soy yo! Ahora sí adivínala todavía más rápido.",
  "¡Esta la sé yo de memoria! Literalmente soy yo.",
];

export default function DraggablePet({ reaction, scaleFactor = 1.0, region = null, currentWord = null, gameBubble = null }) {
  const vinculo = usePetStore((s) => s.vinculo);
  const petType = usePetStore((s) => s.petType);
  const stage = getStage(vinculo);
  // Xolo is slightly smaller so it doesn't obstruct gameplay
  const xoloFactor = petType === 'xolo' ? 0.85 : 1.0;
  // Base display size in dp — scaleFactor tunes it up/down
  const BASE_PET = TABLET_MODE ? 72 : 68;
  const petSize = Math.round(BASE_PET * xoloFactor * scaleFactor);

  // Refs accessible inside PanResponder (created once — closures would be stale otherwise)
  const petSizeRef = useRef(petSize);
  petSizeRef.current = petSize;
  const dimsRef = useRef(getScreenDims());
  // Track last shown index per category to avoid immediate repeats
  const lastIdxRef = useRef({ tap: -1, bottom: -1, top: -1, side: -1 });

  // Home Y is always the same — lower 92% of safe zone
  const getHomeY = (w, h, sz) => {
    const topBarBottom = (Platform.OS === 'ios' ? h * 0.058 : h * 0.04) + w * 0.1 + 8;
    const safeH = h - KEYBOARD_ZONE_H - topBarBottom;
    return Math.round(topBarBottom + safeH * 0.92 - sz);
  };
  // Default start: lower-right
  const getInitPos = () => {
    const { w, h } = dimsRef.current;
    return { x: Math.round(w * 0.86), y: getHomeY(w, h, petSize) };
  };

  const pan = useRef(new Animated.ValueXY(getInitPos())).current;

  const floatAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const tapAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [bubble, setBubble] = useState(null);
  const [bubblePos, setBubblePos] = useState({ x: 0, y: 0 });
  const bubbleTimer = useRef(null);
  // Drag state stored in refs so PanResponder (created once) can reliably access them
  const offsetRef = useRef({ x: 0, y: 0 });       // position when drag started
  const activeZoneRef = useRef(null);              // 'bottom' | 'top' | 'side' | null
  const topZoneHitRef = useRef(false);             // true if pet was pushed into top zone this drag
  const gestureRef = useRef({ startT: 0, moved: false }); // tap detection

  // Game events (correct answer, hints) push a bubble from GameplayScreen
  useEffect(() => {
    if (!gameBubble) return;
    // Compute position above current pet location
    const petX = pan.x._value;
    const petY = pan.y._value;
    const sw = dimsRef.current.w;
    const bx = Math.max(5, Math.min(petX - 75, sw - 185));
    const by = Math.max(60, petY - 65);
    setBubblePos({ x: bx, y: by });
    setBubble(gameBubble);
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2500);
  }, [gameBubble]);

  // Detect when current word matches this pet's name → special reaction
  const shownSelfRef = useRef(false);
  useEffect(() => {
    if (!currentWord || !petType) return;
    const wordClean = currentWord.replace(/\s/g, '').toLowerCase();
    const matches = wordClean.includes(petType.toLowerCase());
    if (matches && !shownSelfRef.current) {
      shownSelfRef.current = true;
      // Small delay so the word loads before the mascot reacts
      setTimeout(() => {
        const idx = Math.floor(Math.random() * SELF_PHRASES.length);
        setBubble(SELF_PHRASES[idx]);
        clearTimeout(bubbleTimer.current);
        bubbleTimer.current = setTimeout(() => setBubble(null), 3500);
        // Bounce animation
        Animated.sequence([
          Animated.timing(tapAnim, { toValue: 1.35, duration: 120, useNativeDriver: false }),
          Animated.spring(tapAnim, { toValue: 1, friction: 3, tension: 180, useNativeDriver: false }),
        ]).start();
        shakeIt();
      }, 800);
    } else if (!matches) {
      shownSelfRef.current = false;
    }
  }, [currentWord, petType]);

  // Idle breathing + floating loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -5, duration: 1100, useNativeDriver: false }),
          Animated.timing(floatAnim, { toValue: 0, duration: 1100, useNativeDriver: false }),
        ]),
        Animated.sequence([
          Animated.timing(breatheAnim, { toValue: 1.04, duration: 1100, useNativeDriver: false }),
          Animated.timing(breatheAnim, { toValue: 1, duration: 1100, useNativeDriver: false }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // On orientation change: update dimsRef and snap pet to nearest side at same level
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', () => {
      dimsRef.current = getScreenDims();
      const { w, h } = dimsRef.current;
      const sz = petSizeRef.current;
      const currentX = pan.x._value;
      const goLeft = currentX + sz / 2 < w / 2;
      const homeX = goLeft ? Math.round(w * 0.07) : Math.round(w * 0.86);
      pan.setValue({ x: homeX, y: getHomeY(w, h, sz) });
    });
    return () => sub?.remove();
  }, []);

  const showBubble = useCallback((dir = 'bottom', petX, petY) => {
    const list = PHRASES[dir] ?? PHRASES.bottom;
    const phrase = pickPhrase(list, { current: lastIdxRef.current[dir] ?? -1 });
    const phraseIdx = list.indexOf(phrase);
    lastIdxRef.current = { ...lastIdxRef.current, [dir]: phraseIdx };
    const sw = dimsRef.current.w;
    const bx = petX != null ? Math.max(5, Math.min(petX - 75, sw - 185)) : 5;
    // position right above the pet
    const by = petY != null ? Math.max(10, petY - 60) : 60;
    setBubblePos({ x: bx, y: by });
    setBubble(phrase);
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2500);
  }, []);

  const shakeIt = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 45, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: false }),
    ]).start();
  }, []);

  // Bounce to nearest side home (left or right) based on where pet landed
  const bounceHome = useCallback(() => {
    const { w, h } = dimsRef.current;
    const sz = petSizeRef.current;
    const currentX = pan.x._value; // already flattened before bounceHome is called
    // Guard against NaN/Infinity from extreme pan values
    const safeX = isFinite(currentX) ? currentX : w * 0.86;
    const goLeft = safeX + sz / 2 < w / 2;
    const homeX = goLeft ? Math.round(w * 0.07) : Math.round(w * 0.86);
    const homeY = getHomeY(w, h, sz);
    try {
      Animated.spring(pan, {
        toValue: { x: homeX, y: homeY },
        friction: 5,
        tension: 80,
        useNativeDriver: false,
      }).start();
    } catch { }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      // Claim every touch on start AND on move — prevents parent views from stealing the gesture
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Never let a parent component terminate our drag once it starts
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        try { pan.flattenOffset(); } catch { }
        activeZoneRef.current = null;
      },
      onPanResponderGrant: () => {
        gestureRef.current = { startT: Date.now(), moved: false };
        offsetRef.current = { x: pan.x._value, y: pan.y._value };
        activeZoneRef.current = null;
        topZoneHitRef.current = false;
        pan.setOffset(offsetRef.current);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gs) => {
        // Mark as drag once finger moves significantly
        if (Math.abs(gs.dx) > 6 || Math.abs(gs.dy) > 6) {
          gestureRef.current.moved = true;
        }
        const { w, h } = dimsRef.current;
        const sz = petSizeRef.current;
        const topBarBottom = (Platform.OS === 'ios' ? h * 0.058 : h * 0.04) + w * 0.1 + 8;
        const { x: ox, y: oy } = offsetRef.current;

        // Raw desired position
        const rawX = ox + gs.dx;
        const rawY = oy + gs.dy;

        // Clamp to safe zone — pet cannot enter keyboard, topbar, or off-screen
        const safeX = Math.max(0, Math.min(rawX, w - sz));
        const safeY = Math.max(topBarBottom, Math.min(rawY, h - KEYBOARD_ZONE_H - sz));

        // Move the pet (value = safePos - offset, since effective = offset + value)
        pan.setValue({ x: safeX - ox, y: safeY - oy });

        // ── Real-time zone feedback ──
        const hitBottom = rawY > h - KEYBOARD_ZONE_H - sz;
        const hitTop = rawY < topBarBottom;
        const hitSide = rawX < 0 || rawX + sz > w;

        if (hitBottom && activeZoneRef.current !== 'bottom') {
          activeZoneRef.current = 'bottom';
          showBubble('bottom', safeX, safeY);
          shakeIt();
        } else if (hitTop && activeZoneRef.current !== 'top') {
          activeZoneRef.current = 'top';
          topZoneHitRef.current = true;
          showBubble('top', safeX, safeY);
          shakeIt();
        } else if (hitSide && activeZoneRef.current !== 'side') {
          activeZoneRef.current = 'side';
          showBubble('side', safeX, safeY);
          shakeIt();
        } else if (!hitBottom && !hitTop && !hitSide) {
          activeZoneRef.current = null;
        }
      },
      onPanResponderRelease: (_, gs) => {
        pan.flattenOffset();

        const elapsed = Date.now() - gestureRef.current.startT;
        const dist = Math.sqrt(gs.dx * gs.dx + gs.dy * gs.dy);
        const isTap = dist < 12 && elapsed < 500;

        if (isTap) {
          // ── Tap: show random phrase + scale pulse ──
          showBubble('tap', pan.x._value, pan.y._value);

          Animated.sequence([
            Animated.timing(tapAnim, { toValue: 1.25, duration: 90, useNativeDriver: false }),
            Animated.spring(tapAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: false }),
          ]).start();
          activeZoneRef.current = null;
          return;
        }

        // ── Drag release ──
        const { w, h } = dimsRef.current;
        const sz = petSizeRef.current;
        const topBarBottom = (Platform.OS === 'ios' ? h * 0.058 : h * 0.04) + w * 0.1 + 8;
        const finalX = pan.x._value;
        const finalY = pan.y._value;

        const inKeyboardZone = finalY > h - KEYBOARD_ZONE_H - sz;
        // aboveTopBar: also catches the clamped case where user pushed pet into top zone
        const aboveTopBar = finalY < topBarBottom || topZoneHitRef.current;
        const tooFarLeft = finalX < w * 0.08;
        const tooFarRight = finalX + sz > w * 0.92;

        if (inKeyboardZone || aboveTopBar || tooFarLeft || tooFarRight) {
          bounceHome();
        } else {
          Animated.spring(pan, {
            toValue: { x: finalX, y: finalY },
            friction: 8,
            tension: 120,
            useNativeDriver: false,
          }).start();
        }
        activeZoneRef.current = null;
      },
    })
  ).current;

  return (
    <>
      <Animated.View
        style={[styles.wrapper, { transform: pan.getTranslateTransform(), width: petSize, height: petSize }]}
        {...panResponder.panHandlers}
      >
        {/* Inner view handles idle float + breathe + shake */}
        <Animated.View style={{
          flex: 1,
          transform: [
            { translateX: shakeAnim },
            { translateY: floatAnim },
            { scale: Animated.multiply(breatheAnim, tapAnim) },
          ],
        }}>
          <PetCompanion reaction={reaction} compact={false} region={region} />
        </Animated.View>
      </Animated.View>

      {/* Bubble is a sibling — avoids any clipping from the pet's transformed wrapper */}
      {bubble && (
        <View
          pointerEvents="none"
          style={[
            styles.bubble,
            bubblePos && bubblePos.x !== undefined ? { top: bubblePos.y, left: bubblePos.x } : { top: pan.y._value - 60, left: pan.x._value - 50 }
          ]}
        >
          <Text style={styles.bubbleText}>{bubble}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 20,
  },
  bubble: {
    position: 'absolute',
    zIndex: 999,
    elevation: 20,
    width: 180,
    backgroundColor: 'rgba(92,46,0,0.93)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bubbleText: {
    color: '#FFE4B5',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 17,
  },
});
