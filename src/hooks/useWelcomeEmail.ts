import { supabase } from "@/integrations/supabase/client";

export const useWelcomeEmail = () => {
  const sendWelcomeEmail = async (email: string, name: string, userType: 'developer' | 'expert' | 'company') => {
    try {
      const { data, error } = await supabase.functions.invoke('send-buildera-email', {
        body: {
          templateId: '1fe990fb-c92b-4301-a752-4c2028ddc0ae', // ID del template "Bienvenida - Registro de Usuario"
          to: email,
          toName: name,
          subject: `¡Bienvenido a Buildera${userType === 'company' ? ', Empresa' : userType === 'developer' ? ', Desarrollador' : ', Experto'}!`,
          htmlContent: getWelcomeEmailContent(name, userType),
          variables: {
            user_name: name,
            user_type: userType,
            user_email: email,
            login_url: `${window.location.origin}/auth`,
            support_email: 'soporte@buildera.io'
          }
        }
      });

      if (error) {
        console.error('Error enviando email de bienvenida:', error);
        return { success: false, error };
      }

      console.log('Email de bienvenida enviado correctamente:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
      return { success: false, error };
    }
  };

  return { sendWelcomeEmail };
};

const getWelcomeEmailContent = (name: string, userType: string) => {
  const baseContent = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="{{buildera_logo}}" alt="{{buildera_name}}" style="height: 60px;">
      </div>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 24px;">¡Bienvenido a Buildera!</h1>
      </div>
      
      <div style="padding: 20px; line-height: 1.6; color: #333;">
        <h2>¡Hola {{user_name}}!</h2>
        <p>Te damos la bienvenida a Buildera, tu socio en la transformación digital.</p>
  `;

  let specificContent = '';
  if (userType === 'company') {
    specificContent = `
        <p>Como empresa, tendrás acceso a:</p>
        <ul style="margin: 15px 0; padding-left: 20px;">
          <li>Dashboard completo para gestionar tu automatización</li>
          <li>Equipos de agentes de IA personalizados</li>
          <li>Marketplace de expertos y desarrolladores</li>
          <li>Academia Buildera con cursos especializados</li>
          <li>Inteligencia competitiva en tiempo real</li>
        </ul>
        <p><strong>¡Comienza tu transformación digital hoy!</strong></p>
    `;
  } else if (userType === 'developer') {
    specificContent = `
        <p>Como desarrollador, podrás:</p>
        <ul style="margin: 15px 0; padding-left: 20px;">
          <li>Crear agentes de IA innovadores</li>
          <li>Monetizar tus habilidades en nuestro marketplace</li>
          <li>Acceder a herramientas avanzadas de desarrollo</li>
          <li>Colaborar con empresas de todo el mundo</li>
        </ul>
        <p><strong>¡Empezemos a construir el futuro juntos!</strong></p>
    `;
  } else if (userType === 'expert') {
    specificContent = `
        <p>Como experto, podrás:</p>
        <ul style="margin: 15px 0; padding-left: 20px;">
          <li>Compartir tu conocimiento y experiencia</li>
          <li>Ofrecer consultoría especializada</li>
          <li>Conectar con empresas que necesitan tu expertise</li>
          <li>Impulsar la innovación en tu industria</li>
        </ul>
        <p><strong>¡Tu conocimiento es el motor del cambio!</strong></p>
    `;
  }

  return baseContent + specificContent + `
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <a href="{{login_url}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 15px;">
          Acceder a Buildera
        </a>
        <p style="margin: 0; font-size: 14px; color: #666;">
          <strong>Importante:</strong> Para activar tu cuenta, verifica tu email haciendo clic en el enlace que te hemos enviado por separado.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
        <p>¿Tienes preguntas? Contáctanos en <a href="mailto:{{support_email}}" style="color: #667eea;">{{support_email}}</a></p>
        <p style="margin-top: 10px;">Building the New Era</p>
        <p style="margin: 5px 0; font-size: 12px;">© {{current_year}} {{buildera_name}}. Todos los derechos reservados.</p>
      </div>
    </div>
  `;
};