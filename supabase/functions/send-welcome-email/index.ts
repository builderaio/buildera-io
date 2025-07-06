import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  userType: 'developer' | 'expert' | 'company';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, userType }: WelcomeEmailRequest = await req.json();

    const getWelcomeMessage = (type: string) => {
      switch (type) {
        case 'developer':
          return {
            title: '¡Bienvenido a Buildera, Desarrollador!',
            content: `
              <h1>¡Hola ${name}!</h1>
              <p>Te damos la bienvenida a Buildera, la plataforma que revolucionará tu forma de desarrollar con IA.</p>
              <p>Como desarrollador, tendrás acceso a:</p>
              <ul>
                <li>Herramientas avanzadas de desarrollo con IA</li>
                <li>Marketplace de componentes y soluciones</li>
                <li>Comunidad de desarrolladores expertos</li>
                <li>Oportunidades de colaboración en proyectos</li>
              </ul>
              <p>¡Empezemos a construir el futuro juntos!</p>
            `
          };
        case 'expert':
          return {
            title: '¡Bienvenido a Buildera, Experto!',
            content: `
              <h1>¡Hola ${name}!</h1>
              <p>Te damos la bienvenida a Buildera, donde tu experiencia impulsa la innovación.</p>
              <p>Como experto, podrás:</p>
              <ul>
                <li>Ofrecer consultoría especializada</li>
                <li>Participar en proyectos de alto impacto</li>
                <li>Acceder a inteligencia competitiva</li>
                <li>Conectar con empresas que necesitan tu experiencia</li>
              </ul>
              <p>¡Tu conocimiento es el motor del cambio!</p>
            `
          };
        case 'company':
          return {
            title: '¡Bienvenido a Buildera, Empresa!',
            content: `
              <h1>¡Hola ${name}!</h1>
              <p>Te damos la bienvenida a Buildera, tu socio en la transformación digital.</p>
              <p>Como empresa, tendrás acceso a:</p>
              <ul>
                <li>Dashboard completo para gestionar tu automatización</li>
                <li>Equipos de agentes de IA personalizados</li>
                <li>Marketplace de expertos y desarrolladores</li>
                <li>Academia Buildera con cursos especializados</li>
                <li>Inteligencia competitiva en tiempo real</li>
              </ul>
              <p>¡Comienza tu transformación digital hoy!</p>
            `
          };
        default:
          return {
            title: '¡Bienvenido a Buildera!',
            content: `
              <h1>¡Hola ${name}!</h1>
              <p>Te damos la bienvenida a Buildera, donde la innovación se encuentra con la automatización inteligente.</p>
              <p>¡Explora todas las posibilidades que tenemos para ti!</p>
            `
          };
      }
    };

    const welcomeMessage = getWelcomeMessage(userType);

    const emailResponse = await resend.emails.send({
      from: "Buildera <no-reply@buildera.io>",
      to: [email],
      subject: welcomeMessage.title,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://buildera.io/lovable-uploads/9bbad23a-3f28-47fd-bf57-1a43f0129bff.png" alt="Buildera" style="height: 60px;">
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px;">${welcomeMessage.title}</h1>
          </div>
          
          <div style="padding: 20px; line-height: 1.6; color: #333;">
            ${welcomeMessage.content}
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
            <a href="https://buildera.io/" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Acceder a Buildera
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            <p>¿Tienes preguntas? Contáctanos en <a href="mailto:soporte@buildera.io" style="color: #667eea;">soporte@buildera.io</a></p>
            <p style="margin-top: 10px;">Building the New Era</p>
            <p style="margin: 5px 0; font-size: 12px;">
              © 2025 Buildera. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);