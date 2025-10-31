import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyAgent } from "@/hooks/useCompanyAgent";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'support';
  timestamp: Date;
  context?: string;
}

interface SupportChatWidgetProps {
  user: any;
}

const SupportChatWidget = ({ user }: SupportChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTourCompleted, setIsTourCompleted] = useState(false);
  const [tourLoading, setTourLoading] = useState(true);
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Normalizamos el ID y nombre del usuario (compatibilidad con User de Supabase y perfil)
  const uid = (user as any)?.user_id || (user as any)?.id;
  const displayName = (user as any)?.display_name || (user as any)?.user_metadata?.full_name || (user as any)?.email;
  // Hook para verificar si el onboarding está completo
  const { isOnboardingComplete, loading: onboardingLoading } = useOnboardingStatus(uid);
  
  // Hook para manejar el agente empresarial
  const { updateCompanyAgent } = useCompanyAgent({ user, enabled: !!user });

  // Verificar si el tour guiado está completado (con debounce para evitar loops)
  useEffect(() => {
    if (!uid) return;
    
    let isMounted = true;
    const timeoutId = setTimeout(async () => {
      try {
        setTourLoading(true);
        const { data: tourStatus } = await supabase
          .from('user_guided_tour')
          .select('tour_completed')
          .eq('user_id', uid)
          .maybeSingle();

        if (isMounted) {
          setIsTourCompleted(tourStatus?.tour_completed || false);
        }
      } catch (error) {
        console.error('Error checking tour status:', error);
        if (isMounted) {
          setIsTourCompleted(false);
        }
      } finally {
        if (isMounted) {
          setTourLoading(false);
        }
      }
    }, 500); // Debounce de 500ms para evitar múltiples llamadas

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [uid]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Obtener contexto de la página actual
  const getPageContext = () => {
    const path = location.pathname;
    const contexts = {
      '/company-dashboard': 'Panel de control del negocio',
      '/company-dashboard/adn': 'Sección ADN del Negocio',
      '/company-dashboard/marketplace': 'Marketplace de expertos',
      '/company-dashboard/expertos': 'Gestión de expertos',
      '/company-dashboard/marketing': 'Marketing Hub',
      '/company-dashboard/inteligencia': 'Inteligencia Competitiva',
      '/company-dashboard/academia': 'Academia Buildera',
      '/company-dashboard/base-conocimiento': 'Base de Conocimiento',
      '/company-dashboard/configuracion': 'Configuración',
      '/profile': 'Perfil de usuario',
      '/': 'Página principal'
    };
    
    return contexts[path] || `Página: ${path}`;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const pageContext = getPageContext();
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      context: pageContext
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Try company agent chat first
      const { data, error } = await supabase.functions.invoke('company-agent-chat', {
        body: {
          message: inputMessage,
          user_id: uid,
          context: pageContext
        }
      });

      if (error) throw error;

      const eraMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.reply,
        sender: 'support',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, eraMessage]);
      setIsLoading(false);

    } catch (error) {
      console.error('Error sending message to company agent:', error);
      
      // Fallback to general Era chat
      try {
        const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('era-chat', {
          body: {
            message: inputMessage,
            context: pageContext,
            userInfo: {
              display_name: displayName,
              user_type: (user as any)?.user_type
            }
          }
        });

        if (fallbackError) throw fallbackError;

        const eraMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: fallbackData.reply,
          sender: 'support',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, eraMessage]);
        setIsLoading(false);

      } catch (fallbackError) {
        console.error('Error with fallback chat:', fallbackError);
        
        // Final fallback response
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Hola ${displayName || 'Usuario'}, soy tu copiloto empresarial. En este momento estoy configurando tu perfil personalizado. ¿En qué puedo ayudarte mientras tanto?`,
          sender: 'support',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, fallbackMessage]);
        setIsLoading(false);
        
        toast({
          title: "Configurando tu agente personal",
          description: "Tu copiloto empresarial se está adaptando a tu negocio. Algunas funciones avanzadas estarán disponibles pronto.",
          variant: "default",
        });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Mensaje de bienvenida inicial y creación de agente (solo después del onboarding Y del tour)
  useEffect(() => {
    if (messages.length === 0 && user && uid && isOnboardingComplete && isTourCompleted) {
      // Crear agente empresarial si no existe
      const initializeCompanyAgent = async () => {
        try {
          // Obtener empresa principal del usuario
          const { data: userCompany } = await supabase
            .from('company_members')
            .select('company_id, companies(name)')
            .eq('user_id', uid)
            .eq('is_primary', true)
            .maybeSingle();

          if (userCompany) {
            // Obtener datos de la empresa para el status
            const [
              { data: companyAgent },
              { data: companyStrategy },
              { data: companyObjectives },
              { data: linkedinConnections },
              { data: facebookConnections }
            ] = await Promise.all([
              supabase
                .from('company_agents')
                .select('agent_name')
                .eq('user_id', uid)
                .maybeSingle(),
              supabase
                .from('company_strategy')
                .select('*')
                .eq('company_id', userCompany.company_id)
                .maybeSingle(),
              supabase
                .from('company_objectives')
                .select('*')
                .eq('company_id', userCompany.company_id),
              supabase
                .from('linkedin_connections')
                .select('id')
                .eq('user_id', uid),
              supabase
                .from('facebook_instagram_connections')
                .select('id')
                .eq('user_id', uid)
            ]);

            if (!companyAgent) {
              // Crear agente en background
              supabase.functions.invoke('create-company-agent', {
                body: {
                  user_id: uid,
                  company_id: userCompany.company_id
                }
              }).catch(console.error);
            }

            const companyName = userCompany.companies?.name || 'tu empresa';
            const hasStrategy = !!companyStrategy;
            const objectivesCount = companyObjectives?.length || 0;
            const hasConnections = (linkedinConnections?.length || 0) > 0 || (facebookConnections?.length || 0) > 0;

            // Crear mensaje wow personalizado con análisis profundo
            const completionPercentage = Math.round(([hasStrategy, objectivesCount > 0, hasConnections].filter(Boolean).length / 3) * 100);
            
            let welcomeContent = `# 🚀 ¡Hola ${displayName}! Soy **ERA**\n\n`;
            welcomeContent += `Soy tu **Copiloto Empresarial de IA** especializado en ${companyName}. He analizado tu ecosistema empresarial y tengo insights personalizados para ti.\n\n`;
            
            welcomeContent += `## 📊 **Análisis Empresarial Instantáneo**\n\n`;
            welcomeContent += `**Nivel de Configuración:** ${completionPercentage}%\n\n`;
            
            welcomeContent += `### Status Actual:\n`;
            welcomeContent += hasStrategy ? '✅ **Estrategia empresarial** - Sólida base estratégica\n' : '🔧 **Estrategia empresarial** - Oportunidad de definición\n';
            welcomeContent += objectivesCount > 0 ? `✅ **Objetivos establecidos** - ${objectivesCount} metas activas\n` : '🎯 **Objetivos** - Listos para establecer roadmap\n';
            welcomeContent += hasConnections ? '✅ **Ecosistema digital** - Redes sociales conectadas\n' : '🌐 **Ecosistema digital** - Canales listos para integrar\n';
            
            welcomeContent += `\n### 🧠 **Mi Conocimiento Especializado:**\n`;
            welcomeContent += `• **Marketing Inteligente** - Estrategias personalizadas para ${companyName}\n`;
            welcomeContent += `• **Análisis Competitivo** - Insights del sector en tiempo real\n`;
            welcomeContent += `• **Optimización Operacional** - Automatización de procesos\n`;
            welcomeContent += `• **Crecimiento Escalable** - Roadmap de expansión\n\n`;
            
            welcomeContent += `### 🎯 **Acciones Prioritarias:**\n`;
            if (!hasStrategy) welcomeContent += `• **Definir ADN Empresarial** - Estructura estratégica fundamental\n`;
            if (objectivesCount === 0) welcomeContent += `• **Establecer OKRs** - Objetivos medibles y alcanzables\n`;
            if (!hasConnections) welcomeContent += `• **Activar Marketing Hub** - Integración de canales digitales\n`;
            welcomeContent += `• **Explorar Marketplace** - Conectar con expertos especializados\n`;
            welcomeContent += `• **Activar Inteligencia Competitiva** - Ventaja estratégica del mercado\n\n`;
            
            welcomeContent += `**¿En qué área quieres que enfoque mi análisis primero?** 🎯`;

            const welcomeMessage: Message = {
              id: 'welcome',
              content: welcomeContent,
              sender: 'support',
              timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
          }
        } catch (error) {
          console.error('Error initializing company agent:', error);
          const welcomeMessage: Message = {
            id: 'welcome',
            content: `# 🤖 ¡Hola ${displayName || 'Usuario'}! Soy **ERA**\n\nTu **Copiloto Empresarial de IA** está configurando tu perfil personalizado.\n\n**Mientras tanto, puedo ayudarte con:**\n• Consultas generales de negocio\n• Estrategias de marketing\n• Análisis competitivo\n• Optimización operacional\n\n¿En qué puedo asistirte hoy? 🚀`,
            sender: 'support',
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
        }
      };

      initializeCompanyAgent();
    }
  }, [user, isOnboardingComplete, isTourCompleted]);

  // No mostrar el widget si el usuario no existe, está cargando, o no ha completado onboarding Y tour
  if (!user || onboardingLoading || tourLoading || !isOnboardingComplete || !isTourCompleted) return null;

  return (
    <>
      {/* Widget flotante */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat expandido */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 md:w-[480px] h-[600px] shadow-xl z-50 flex flex-col">
          {/* Header del chat */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-purple-600 text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="w-6 h-6" />
                <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-base">ERA - Copiloto Empresarial</h3>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {getPageContext()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Contenido del chat */}
          {!isMinimized && (
            <>
              {/* Mensajes */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.sender === 'support' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={`max-w-[280px] md:max-w-[360px] px-4 py-3 rounded-lg text-sm ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gradient-to-br from-muted to-muted/80 border border-border/50'
                        }`}
                      >
                        {message.sender === 'support' ? (
                          <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-li:text-foreground">
                            <ReactMarkdown 
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                                ul: ({ children }) => <ul className="ml-4 mb-2 space-y-1">{children}</ul>,
                                li: ({ children }) => <li className="text-sm text-foreground">{children}</li>,
                                h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-foreground">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-foreground">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-foreground">{children}</h3>
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          message.content
                        )}
                        <div className="text-xs opacity-70 mt-2 text-right">
                          {message.timestamp.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      {message.sender === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted px-3 py-2 rounded-lg text-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input de mensaje */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
};

export default SupportChatWidget;