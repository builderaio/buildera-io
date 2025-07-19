import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
      '/company-dashboard': 'Panel de control empresarial',
      '/company-dashboard/adn': 'Sección ADN de la Empresa',
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
      const { data, error } = await supabase.functions.invoke('era-chat', {
        body: {
          message: inputMessage,
          context: pageContext,
          userInfo: {
            display_name: user?.display_name || user?.full_name,
            user_type: user?.user_type
          }
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
      console.error('Error sending message:', error);
      
      // Fallback response if Era service fails
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Hola ${user?.display_name || 'Usuario'}, soy Era, tu asistente personal de Buildera. En este momento estoy teniendo algunas dificultades técnicas. ¿Podrías intentar tu pregunta de nuevo en unos momentos? Gracias por tu paciencia.`,
        sender: 'support',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      setIsLoading(false);
      
      toast({
        title: "Nos reconectaremos pronto",
        description: "Era está trabajando en modo básico. Algunas funciones pueden estar limitadas temporalmente.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Mensaje de bienvenida inicial
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `¡Hola ${user?.display_name || 'Usuario'}! 👋 Soy Era, tu asistente personal de Buildera. Estoy aquí para ayudarte a sacar el máximo provecho de la plataforma y acompañarte en el crecimiento de tu empresa. ¿En qué puedo ayudarte hoy?`,
        sender: 'support',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [user]);

  if (!user) return null;

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
        <Card className="fixed bottom-6 right-6 w-80 h-96 shadow-xl z-50 flex flex-col">
          {/* Header del chat */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-sm">Era - Asistente IA</h3>
                <p className="text-xs opacity-90">{getPageContext()}</p>
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
                        className={`max-w-[200px] px-3 py-2 rounded-lg text-sm ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.content}
                        <div className="text-xs opacity-70 mt-1">
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