/**
 * Terminosdeservio.jsx
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
    title: '1. Aceptación de los términos',
    body:
      'Al descargar, instalar o usar Mexicanario aceptas estos Términos de Servicio. Si no estás de acuerdo con alguna parte, no uses la aplicación.\n\n' +
      'Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado de la app tras los cambios implica su aceptación.',
  },
  {
    title: '2. Descripción del servicio',
    body:
      'Mexicanario es un juego móvil de vocabulario mexicano. El objetivo es adivinar palabras del español mexicano, aprender su significado y acumular progreso a través de niveles, misiones diarias, mascota virtual y ligas de competición.\n\n' +
      'El servicio incluye funciones gratuitas y opciones de pago voluntario (monedas, pase sin anuncios).',
  },
  {
    title: '3. Cuenta de usuario',
    body:
      'La app crea automáticamente una cuenta anónima al primer uso. Opcionalmente puedes vincularla a tu cuenta de Google o Apple para recuperarla en otro dispositivo.\n\n' +
      'Eres responsable de:\n' +
      '• Mantener seguro tu código de recuperación o credenciales de Google/Apple\n' +
      '• Todas las actividades realizadas desde tu cuenta\n' +
      '• No compartir tu cuenta con terceros\n\n' +
      'Nos reservamos el derecho de suspender cuentas que incumplan estos términos.',
  },
  {
    title: '4. Uso aceptable',
    body:
      'Al usar Mexicanario te comprometes a NO:\n\n' +
      '• Hacer trampa, usar bots, scripts o cualquier software de automatización\n' +
      '• Intentar vulnerar la seguridad del servidor o la base de datos\n' +
      '• Usar la app para actividades ilegales\n' +
      '• Revender o transferir monedas o cuentas\n' +
      '• Publicar contenido ofensivo en nombre de usuario\n\n' +
      'El incumplimiento puede resultar en la suspensión permanente de tu cuenta sin reembolso.',
  },
  {
    title: '5. Moneda virtual y compras',
    body:
      'Mexicanario ofrece moneda virtual (monedas y diamantes) que se puede obtener jugando o comprando. La moneda virtual:\n\n' +
      '• No tiene valor monetario real\n' +
      '• No puede canjearse por dinero real\n' +
      '• No puede transferirse entre cuentas\n' +
      '• Puede perderse si se elimina la cuenta\n\n' +
      'Las compras se procesan a través de Google Play o App Store y están sujetas a sus políticas de reembolso. Mexicanario no gestiona reembolsos directamente — dirígete a Google Play o App Store.',
  },
  {
    title: '6. Pase sin anuncios',
    body:
      'El pase sin anuncios es una suscripción mensual que elimina los anuncios en la app. La suscripción:\n\n' +
      '• Se renueva automáticamente cada mes\n' +
      '• Puede cancelarse en cualquier momento desde los ajustes de Google Play / App Store\n' +
      '• No genera reembolso por el período ya pagado\n' +
      '• Se desactiva si la suscripción vence o se cancela',
  },
  {
    title: '7. Publicidad',
    body:
      'La versión gratuita muestra anuncios proporcionados por Google AdMob. Los anuncios pueden ser personalizados según el identificador publicitario de tu dispositivo.\n\n' +
      'Puedes optar por no recibir publicidad personalizada en los ajustes de privacidad de tu dispositivo, o eliminar los anuncios comprando el pase correspondiente.',
  },
  {
    title: '8. Propiedad intelectual',
    body:
      'Todo el contenido de Mexicanario — incluyendo diseño, ilustraciones, audio, animaciones, código y textos — es propiedad de kafai o sus respectivos propietarios.\n\n' +
      'Queda prohibida la reproducción, distribución o modificación de cualquier elemento de la app sin autorización expresa por escrito.',
  },
  {
    title: '9. Disponibilidad del servicio',
    body:
      'Hacemos nuestro mejor esfuerzo para mantener la app disponible, pero no garantizamos:\n\n' +
      '• Disponibilidad 24/7 sin interrupciones\n' +
      '• Que todos los errores serán corregidos de inmediato\n' +
      '• Que el servicio no será modificado o descontinuado\n\n' +
      'En caso de discontinuación del servicio, notificaremos con al menos 30 días de antelación cuando sea posible.',
  },
  {
    title: '10. Limitación de responsabilidad',
    body:
      'En la máxima medida permitida por la ley, Mexicanario no será responsable de:\n\n' +
      '• Pérdida de progreso de juego por fallo técnico o eliminación de cuenta\n' +
      '• Daños indirectos, incidentales o consecuentes\n' +
      '• Interrupciones del servicio fuera de nuestro control\n\n' +
      'El servicio se proporciona "tal cual" sin garantías de ningún tipo.',
  },
  {
    title: '11. Legislación aplicable',
    body:
      'Estos términos se rigen por las leyes de México. Cualquier disputa se someterá a los tribunales competentes del domicilio del desarrollador, salvo que la ley aplicable establezca otra cosa.',
  },
  {
    title: '12. Contacto',
    body:
      'Para preguntas sobre estos términos:\n\n' +
      '📧 kafaiho@gmail.com\n\n' +
      'Responderemos en un plazo máximo de 30 días hábiles.',
  },
];

// ─── Componente ────────────────────────────────────────────────────────────────
export default function Terminosdeservio({ visible, onClose }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modal}>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Términos de Servicio</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Fecha */}
          <Text style={s.updated}>Última actualización: {LAST_UPDATED}</Text>

          {/* Intro */}
          <Text style={s.intro}>
            Estos términos regulan el uso de Mexicanario. Al usar la app confirmas que los has leído y aceptado.
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
