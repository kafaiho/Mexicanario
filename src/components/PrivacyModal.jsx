/**
 * PrivacyModal.jsx
 *
 * Para actualizar el contenido: edita únicamente el array SECTIONS al inicio
 * del archivo. Cada sección tiene { title, body }. No necesitas tocar el
 * componente ni los estilos.
 *
 * Última actualización: 2026-03-04
 */
import React from 'react';
import {
  Dimensions,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// ─── Fecha de actualización ────────────────────────────────────────────────────
const LAST_UPDATED = '4 de marzo de 2026';

// ─── Contenido editable ────────────────────────────────────────────────────────
// Para agregar, editar o quitar secciones: modifica este array.
const SECTIONS = [
  {
    title: '1. Responsable del tratamiento',
    body:
      'Mexicanario es una aplicación móvil desarrollada por kafai. Para cualquier consulta sobre esta política puedes contactarnos en:\n\n📧 kafaiho@gmail.com',
  },
  {
    title: '2. Datos que recopilamos',
    body:
      'Al usar Mexicanario, podemos recopilar los siguientes datos:\n\n' +
      '• Identificador de usuario anónimo (generado automáticamente)\n' +
      '• Nombre de jugador (elegido por ti)\n' +
      '• País seleccionado\n' +
      '• Progreso del juego: nivel actual, palabras aprendidas, racha de juego, combinaciones, logros\n' +
      '• Mascota virtual: tipo, nombre, estado de evolución\n' +
      '• Moneda virtual: monedas y diamantes ganados o comprados\n' +
      '• Email y ID de Google o Apple (solo si vinculas tu cuenta voluntariamente)\n' +
      '• Datos de compras dentro de la app (sin datos de tarjeta — gestionados por Google Play / App Store)',
  },
  {
    title: '3. Cómo usamos tus datos',
    body:
      'Usamos tu información para:\n\n' +
      '• Guardar y sincronizar tu progreso de juego\n' +
      '• Permitirte recuperar tu cuenta en otro dispositivo (si vinculas Google/Apple)\n' +
      '• Mostrarte publicidad relevante a través de AdMob\n' +
      '• Procesar compras dentro de la aplicación\n' +
      '• Mejorar la experiencia y detectar errores\n' +
      '• Cumplir con obligaciones legales',
  },
  {
    title: '4. Servicios de terceros',
    body:
      'Mexicanario utiliza los siguientes servicios externos, cada uno con su propia política de privacidad:\n\n' +
      '• Convex (base de datos en la nube)\n  convex.dev/privacy\n\n' +
      '• Google Sign-In (autenticación opcional)\n  policies.google.com/privacy\n\n' +
      '• Apple Sign-In (autenticación opcional, solo iOS)\n  apple.com/legal/privacy\n\n' +
      '• Google AdMob (publicidad)\n  policies.google.com/privacy\n\n' +
      '• RevenueCat (compras dentro de la app)\n  revenuecat.com/privacy\n\n' +
      '• Google Play / App Store (pagos)\n  Gestionados directamente por Google y Apple',
  },
  {
    title: '5. Publicidad',
    body:
      'Usamos Google AdMob para mostrar anuncios. AdMob puede usar el identificador de publicidad de tu dispositivo para mostrarte anuncios personalizados.\n\n' +
      'Puedes desactivar la personalización de anuncios en los ajustes de tu dispositivo:\n' +
      '• Android: Ajustes → Google → Anuncios\n' +
      '• iOS: Ajustes → Privacidad → Publicidad de Apple\n\n' +
      'También puedes eliminar los anuncios comprando el pase sin anuncios disponible en la tienda de la app.',
  },
  {
    title: '6. Retención de datos',
    body:
      'Guardamos tus datos mientras tengas la app instalada y uses el servicio. Si solicitas eliminar tu cuenta, borraremos tus datos en un plazo de 30 días.\n\n' +
      'Los usuarios anónimos (sin cuenta vinculada) que lleven más de 12 meses inactivos pueden tener sus datos eliminados automáticamente.',
  },
  {
    title: '7. Tus derechos',
    body:
      'Tienes derecho a:\n\n' +
      '• Acceder a tus datos personales\n' +
      '• Rectificar datos incorrectos\n' +
      '• Solicitar la eliminación de tus datos\n' +
      '• Oponerte al tratamiento para fines de marketing\n' +
      '• Portabilidad de datos\n\n' +
      'Para ejercer cualquiera de estos derechos, escríbenos a kafaiho@gmail.com',
  },
  {
    title: '8. Seguridad',
    body:
      'Tomamos medidas técnicas y organizativas razonables para proteger tu información, incluyendo cifrado en tránsito (HTTPS/TLS) y acceso restringido a la base de datos.\n\n' +
      'Sin embargo, ningún sistema es 100% seguro. Te recomendamos no compartir tu código de recuperación ni datos de cuenta con terceros.',
  },
  {
    title: '9. Privacidad de menores',
    body:
      'Mexicanario no está dirigida específicamente a menores de 13 años. No recopilamos conscientemente datos personales de menores sin el consentimiento de sus padres o tutores.\n\n' +
      'Si crees que un menor ha proporcionado datos sin consentimiento, contáctanos en kafaiho@gmail.com',
  },
  {
    title: '10. Cambios a esta política',
    body:
      'Podemos actualizar esta política de vez en cuando. Te notificaremos de cambios importantes dentro de la app. La fecha de "Última actualización" al inicio indica cuándo fue revisada por última vez.\n\n' +
      'El uso continuado de la app después de los cambios implica la aceptación de la nueva política.',
  },
  {
    title: '11. Contacto',
    body:
      'Para cualquier duda, solicitud o queja sobre tu privacidad:\n\n' +
      '📧 kafaiho@gmail.com\n\n' +
      'Responderemos en un plazo máximo de 30 días hábiles.',
  },
];

// ─── Componente ────────────────────────────────────────────────────────────────
export default function PrivacyModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modal}>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Política de Privacidad</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Fecha */}
          <Text style={s.updated}>Última actualización: {LAST_UPDATED}</Text>

          {/* Intro */}
          <Text style={s.intro}>
            Al usar Mexicanario aceptas esta política. Léela con atención — explica qué datos guardamos y cómo los usamos.
          </Text>

          {/* Secciones */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
          >
            {SECTIONS.map((sec, i) => (
              <View key={i} style={s.section}>
                <Text style={s.sectionTitle}>{sec.title}</Text>
                <Text style={s.sectionBody}>{sec.body}</Text>
              </View>
            ))}

            {/* Pie de página */}
            <View style={s.footer}>
              <Text style={s.footerText}>© 2026 Mexicanario · kafaiho@gmail.com</Text>
            </View>
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────
const BROWN  = '#8B4513';
const AMBER  = '#D2691E';
const WHEAT  = '#FFE4B5';
const WHEAT2 = '#F5DEB3';

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: WHEAT,
    borderRadius: width * 0.05,
    width: '92%',
    maxHeight: height * 0.88,
    borderWidth: 2.5,
    borderColor: BROWN,
    overflow: 'hidden',
    shadowColor: '#5C2800',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.022,
    paddingBottom: height * 0.012,
    borderBottomWidth: 2,
    borderBottomColor: '#D2691E55',
    backgroundColor: WHEAT2,
  },
  title: {
    fontSize: width * 0.048,
    fontWeight: 'bold',
    color: BROWN,
    flex: 1,
  },
  closeBtn: {
    width: width * 0.09,
    height: width * 0.09,
    borderRadius: width * 0.045,
    backgroundColor: AMBER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: width * 0.058,
    fontWeight: 'bold',
    lineHeight: width * 0.068,
  },
  updated: {
    fontSize: width * 0.029,
    color: '#9A6030',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: height * 0.008,
    backgroundColor: WHEAT2,
    borderBottomWidth: 1,
    borderBottomColor: '#D2691E33',
  },
  intro: {
    fontSize: width * 0.033,
    color: BROWN,
    lineHeight: width * 0.05,
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.012,
    backgroundColor: '#FFF3DC',
    borderBottomWidth: 1,
    borderBottomColor: '#D2691E22',
  },
  scroll: {
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.015,
    paddingBottom: height * 0.03,
  },
  section: {
    marginBottom: height * 0.022,
  },
  sectionTitle: {
    fontSize: width * 0.038,
    fontWeight: 'bold',
    color: BROWN,
    marginBottom: height * 0.006,
  },
  sectionBody: {
    fontSize: width * 0.033,
    color: '#6B3A1F',
    lineHeight: width * 0.052,
  },
  footer: {
    marginTop: height * 0.01,
    paddingTop: height * 0.015,
    borderTopWidth: 1,
    borderTopColor: '#D2691E33',
    alignItems: 'center',
  },
  footerText: {
    fontSize: width * 0.028,
    color: '#B38E6A',
    fontStyle: 'italic',
  },
});
