import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Database, FileCheck, UserCheck, Globe, Bell } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Volver a Inicio
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <h1 className="text-xl font-bold">Buildera</h1>
              </div>
            </div>
            <Badge variant="secondary" className="gap-2">
              <Shield className="w-3 h-3" />
              Última actualización: Enero 2025
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shield className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Política de Privacidad y Seguridad
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            En Buildera, tu privacidad y la seguridad de tus datos son fundamentales. 
            Construimos con los más altos estándares de protección y confidencialidad.
          </p>
        </div>

        {/* Security Highlights */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary" />
              Compromisos de Seguridad de Buildera
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Encriptación End-to-End</h4>
                  <p className="text-sm text-muted-foreground">Todos tus datos están protegidos con encriptación AES-256</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Autenticación Segura</h4>
                  <p className="text-sm text-muted-foreground">OAuth 2.0 y autenticación multifactor disponible</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Cumplimiento GDPR</h4>
                  <p className="text-sm text-muted-foreground">Totalmente conforme con regulaciones europeas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-orange-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Auditorías Regulares</h4>
                  <p className="text-sm text-muted-foreground">Evaluaciones de seguridad independientes trimestrales</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Information Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="w-5 h-5" />
                1. Información que Recopilamos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Información Personal</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Nombre completo y dirección de correo electrónico (requeridos para la cuenta)</li>
                  <li>Información de la empresa (nombre, sector, tamaño)</li>
                  <li>Información profesional (cargo, años de experiencia, habilidades)</li>
                  <li>URL del sitio web de la empresa (opcional)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Información de Uso</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Datos de navegación y uso de la plataforma (anonimizados)</li>
                  <li>Métricas de rendimiento para mejorar el servicio</li>
                  <li>Logs de seguridad (sin información personal identificable)</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">
                  🔒 <strong>Garantía de Privacidad:</strong> Nunca accedemos al contenido de tus proyectos o datos empresariales sin tu consentimiento explícito.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="w-5 h-5" />
                2. Cómo Utilizamos tu Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-green-700">✅ Usos Permitidos</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></span>
                      Proporcionar y mejorar nuestros servicios
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></span>
                      Personalizar tu experiencia en la plataforma
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></span>
                      Comunicaciones sobre actualizaciones del servicio
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></span>
                      Soporte técnico y atención al cliente
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-red-700">❌ Nunca Hacemos</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></span>
                      Vender tu información a terceros
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></span>
                      Usar tus datos para publicidad externa
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></span>
                      Acceder a tus proyectos sin autorización
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></span>
                      Compartir datos con competidores
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-5 h-5" />
                3. Protección y Almacenamiento de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Medidas de Seguridad Técnicas</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium mb-2">Encriptación</h5>
                    <p className="text-sm text-muted-foreground">TLS 1.3 en tránsito y AES-256 en reposo</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium mb-2">Infraestructura</h5>
                    <p className="text-sm text-muted-foreground">Servidores en centros de datos SOC 2 certificados</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium mb-2">Acceso</h5>
                    <p className="text-sm text-muted-foreground">Control de acceso basado en roles (RBAC)</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium mb-2">Monitoreo</h5>
                    <p className="text-sm text-muted-foreground">Detección de amenazas 24/7</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Ubicación de Datos</h4>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm">
                    <strong>Servidores principales:</strong> Unión Europea (Frankfurt, Alemania)<br/>
                    <strong>Respaldos:</strong> Múltiples regiones dentro de la UE<br/>
                    <strong>Cumplimiento:</strong> GDPR, ISO 27001, SOC 2 Type II
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UserCheck className="w-5 h-5" />
                4. Tus Derechos sobre los Datos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-blue-700">Derecho de Acceso</h4>
                    <p className="text-sm text-muted-foreground">Puedes solicitar una copia completa de tus datos almacenados</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-700">Derecho de Rectificación</h4>
                    <p className="text-sm text-muted-foreground">Puedes corregir información incorrecta o incompleta</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-700">Derecho de Eliminación</h4>
                    <p className="text-sm text-muted-foreground">Puedes solicitar la eliminación total de tu cuenta y datos</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-700">Derecho de Portabilidad</h4>
                    <p className="text-sm text-muted-foreground">Puedes exportar tus datos en formato estándar</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-700">Derecho de Oposición</h4>
                    <p className="text-sm text-muted-foreground">Puedes oponerte al procesamiento de ciertos datos</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Derecho de Limitación</h4>
                    <p className="text-sm text-muted-foreground">Puedes solicitar restringir el procesamiento</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                5. Contacto y Actualizaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Oficial de Protección de Datos</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Email:</strong> privacy@buildera.io<br/>
                    <strong>Respuesta garantizada:</strong> Dentro de 72 horas<br/>
                    <strong>Resolución:</strong> Máximo 30 días calendario
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Actualizaciones de Política</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Te notificaremos por email sobre cambios significativos en esta política al menos 30 días antes de su implementación.
                </p>
                <Badge variant="outline" className="gap-2">
                  <FileCheck className="w-3 h-3" />
                  Versión 2.1 - Vigente desde Enero 2025
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta política de privacidad ha sido elaborada en cumplimiento del Reglamento General de Protección de Datos (GDPR) 
            y la Ley Orgánica de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/">
              <Button variant="outline">Volver al Inicio</Button>
            </Link>
            <Link to="/company-dashboard">
              <Button>Ir al Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;