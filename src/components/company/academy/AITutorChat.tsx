import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Send, MessageCircle, X } from "lucide-react";
import { useAITutor, TutorMessage } from "@/hooks/useAITutor";
import { cn } from "@/lib/utils";

interface AITutorChatProps {
  moduleId?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const AITutorChat = ({ moduleId, isOpen, onToggle }: AITutorChatProps) => {
  const [message, setMessage] = useState('');
  const { session, loading, isTyping, startSession, sendMessage, endSession } = useAITutor();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !session) {
      startSession(moduleId);
    }
  }, [isOpen, session, moduleId, startSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !session || isTyping) return;
    
    await sendMessage(message, moduleId);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">Tutor IA</CardTitle>
              <div className="text-xs text-muted-foreground">Academia Buildera</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {session?.topics_covered && session.topics_covered.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {session.topics_covered.slice(0, 3).map((topic, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {session?.messages.map((msg, index) => (
              <MessageBubble key={index} message={msg} />
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    <Bot className="w-3 h-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3 max-w-[250px]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu pregunta..."
              disabled={isTyping || loading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || isTyping || loading}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MessageBubble = ({ message }: { message: TutorMessage }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex items-start gap-2", isUser && "flex-row-reverse")}>
      <Avatar className="w-6 h-6">
        <AvatarFallback className={cn(
          "text-xs",
          isUser 
            ? "bg-accent text-accent-foreground" 
            : "bg-primary text-primary-foreground"
        )}>
          {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "rounded-lg p-3 max-w-[250px] text-sm",
        isUser 
          ? "bg-accent text-accent-foreground ml-8" 
          : "bg-muted mr-8"
      )}>
        {message.content}
      </div>
    </div>
  );
};