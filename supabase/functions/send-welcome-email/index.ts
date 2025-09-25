import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// Import Resend using ESM from a CDN instead of npm
const { Resend } = await import("https://esm.sh/resend@2.0.0");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  userType: 'developer' | 'expert' | 'company';
}

serve(async (req: Request): Promise<Response> => {
  console.log(`${req.method} request to send-welcome-email`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    console.log("Processing POST request");
    
    // Check if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const requestText = await req.text();
    console.log("Request body:", requestText);
    
    const { email, name, userType }: WelcomeEmailRequest = JSON.parse(requestText);
    console.log("Parsed data:", { email, name, userType });

    if (!email || !name || !userType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    const getWelcomeMessage = (type: string) => {
      switch (type) {
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
        case 'developer':
          return {
            title: '¡Bienvenido a Buildera, Desarrollador!',
            content: `
              <h1>¡Hola ${name}!</h1>
              <p>Te damos la bienvenida a Buildera, la plataforma que revolucionará tu forma de desarrollar con IA.</p>
              <p>¡Empezemos a construir el futuro juntos!</p>
            `
          };
        case 'expert':
          return {
            title: '¡Bienvenido a Buildera, Experto!',
            content: `
              <h1>¡Hola ${name}!</h1>
              <p>Te damos la bienvenida a Buildera, donde tu experiencia impulsa la innovación.</p>
              <p>¡Tu conocimiento es el motor del cambio!</p>
            `
          };
        default:
          return {
            title: '¡Bienvenido a Buildera!',
            content: `<h1>¡Hola ${name}!</h1><p>Te damos la bienvenida a Buildera.</p>`
          };
      }
    };

    const welcomeMessage = getWelcomeMessage(userType);

    console.log("Sending email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Buildera <onboarding@resend.dev>",
      to: [email],
      subject: welcomeMessage.title,
      html: `<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><img src="https://buildera.io/lovable-uploads/9bbad23a-3f28-47fd-bf57-1a43f0129bff.png" alt="Buildera" style="height: 60px; max-width: 100%;"></div><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;"><h1 style="margin: 0; font-size: 24px;">${welcomeMessage.title}</h1></div><div style="padding: 20px; line-height: 1.6; color: #333;">${welcomeMessage.content}</div><div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 10px;"><a href="https://buildera.io/" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acceder a Buildera</a></div><div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;"><p>¿Tienes preguntas? Contáctanos en <a href="mailto:soporte@buildera.io" style="color: #667eea;">soporte@buildera.io</a></p><p style="margin-top: 10px;">Building the New Era</p><p style="margin: 5px 0; font-size: 12px;">© 2025 Buildera. Todos los derechos reservados.</p></div></div>`,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      id: emailResponse.data?.id,
      message: "Email enviado correctamente"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});