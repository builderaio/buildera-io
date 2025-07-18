import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link to="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
            <h1 className="text-4xl font-heading font-bold text-primary mb-4">
              Términos de Servicio
            </h1>
            <p className="text-muted-foreground">
              Última actualización: 18 de julio de 2025
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Aceptación de los Términos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Al acceder y utilizar BUILDERA (el "Servicio"), operado por Innoventum S.A.S. ("nosotros", "nuestro" o "la Compañía"), 
                usted acepta cumplir y estar sujeto a estos Términos de Servicio ("Términos"). Si no está de acuerdo con alguna 
                parte de estos términos, no debe utilizar nuestro servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Descripción del Servicio</h2>
              <p className="text-muted-foreground leading-relaxed">
                BUILDERA es una plataforma de inteligencia artificial que conecta empresas con desarrolladores y expertos 
                especializados para acelerar la transformación digital. Ofrecemos servicios de marketplace, gestión de proyectos, 
                análisis de inteligencia competitiva y herramientas de marketing automatizado.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Registro y Cuentas de Usuario</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Para utilizar ciertos aspectos del Servicio, debe crear una cuenta proporcionando información precisa, 
                  actual y completa. Usted es responsable de:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Mantener la confidencialidad de sus credenciales de cuenta</li>
                  <li>Todas las actividades que ocurran bajo su cuenta</li>
                  <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
                  <li>Proporcionar información veraz y actualizada</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Uso Aceptable</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Al utilizar nuestro Servicio, usted acepta no:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Utilizar el Servicio para fines ilegales o no autorizados</li>
                  <li>Transmitir contenido malicioso, ofensivo o que viole derechos de terceros</li>
                  <li>Intentar acceder sin autorización a otros sistemas o cuentas</li>
                  <li>Interferir con la funcionalidad del Servicio</li>
                  <li>Realizar ingeniería inversa o intentar extraer código fuente</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Propiedad Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                El Servicio y todo su contenido, características y funcionalidades son propiedad de Innoventum S.A.S. 
                y están protegidos por derechos de autor, marcas comerciales y otras leyes de propiedad intelectual. 
                No se le otorga ningún derecho sobre nuestra propiedad intelectual, excepto el derecho limitado de usar 
                el Servicio de acuerdo con estos Términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Privacidad y Protección de Datos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Su privacidad es importante para nosotros. Nuestro manejo de su información personal se rige por nuestra 
                <Link to="/privacy-policy" className="text-primary hover:underline"> Política de Privacidad</Link>, 
                que forma parte integral de estos Términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Pagos y Facturación</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Algunos aspectos del Servicio pueden requerir pago. Al realizar un pago:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Usted autoriza el cobro de las tarifas aplicables</li>
                  <li>Los pagos no son reembolsables salvo que se indique lo contrario</li>
                  <li>Las tarifas pueden cambiar con previo aviso</li>
                  <li>Usted es responsable de todos los impuestos aplicables</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Limitación de Responsabilidad</h2>
              <p className="text-muted-foreground leading-relaxed">
                En ningún caso Innoventum S.A.S. será responsable por daños indirectos, incidentales, especiales, 
                consecuenciales o punitivos, incluyendo pero no limitado a pérdida de ganancias, datos o uso, 
                independientemente de la teoría legal en la que se base la reclamación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Terminación</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos terminar o suspender su cuenta inmediatamente, sin previo aviso o responsabilidad, por cualquier 
                motivo, incluyendo pero no limitado al incumplimiento de estos Términos. Al terminar, su derecho a usar 
                el Servicio cesará inmediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Modificaciones a los Términos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las modificaciones entrarán 
                en vigor inmediatamente después de su publicación en esta página. Su uso continuado del Servicio después 
                de cualquier modificación constituye su aceptación de los nuevos Términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Ley Aplicable</h2>
              <p className="text-muted-foreground leading-relaxed">
                Estos Términos se regirán e interpretarán de acuerdo con las leyes de Colombia, sin dar efecto a 
                ningún principio de conflictos de leyes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Si tiene preguntas sobre estos Términos de Servicio, contáctenos en:
              </p>
              <div className="mt-4 text-muted-foreground">
                <p>Innoventum S.A.S.</p>
                <p>Email: legal@buildera.dev</p>
                <p>Colombia</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;