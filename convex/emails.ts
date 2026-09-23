import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendWelcomeEmail = internalAction({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Inicializar Resend con la variable de entorno
    const resend = new Resend(process.env.RESEND_API_KEY);

    const userName = args.name || "Jugador";

    // Enviar correo
    const { data, error } = await resend.emails.send({
      from: "Mexicanario <hola@mexicanario.com>",
      to: [args.email],
      subject: `¡Bienvenido a Mexicanario, ${userName}! 🌮`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
            <h1 style="color: #61f28b; margin: 0;">¡Bienvenido a Mexicanario! 🎉</h1>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 16px;">Hola <strong>${userName}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5;">¡Qué chido tenerte por acá! Ya eres parte de la comunidad exclusiva donde jugamos y aprendemos el verdadero sabor del español de México.</p>
            <p style="font-size: 16px; line-height: 1.5;">Prepárate para adivinar palabras, aprender expresiones únicas y competir con tus panas para demostrar que eres el macizo del vocabulario.</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://mexicanario.com" style="background-color: #61f28b; color: #1a1a1a; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Ir a mi perfil</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Si tienes alguna duda o sugerencia, solo responde a este correo y nos pondremos en contacto contigo de volada.</p>
            <br/>
            <p style="font-size: 16px;">Con mucho cariño,<br/><strong>El equipo de Mexicanario</strong> 🌮</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} Mexicanario. Todos los derechos reservados.<br/>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Error enviando email de bienvenida:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Correo de bienvenida enviado cón éxito. ID:", data?.id);
    return { success: true, id: data?.id };
  },
});
