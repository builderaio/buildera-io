import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Linkedin, 
  Instagram, 
  Facebook, 
  Music, 
  Plus,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface ConnectionStatusBarProps {
  connections: {
    linkedin: boolean;
    instagram: boolean;
    facebook: boolean;
    tiktok: boolean;
  };
}

const platforms = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-500' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-700' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'from-blue-500 to-blue-600' },
  { key: 'tiktok', label: 'TikTok', icon: Music, color: 'from-gray-900 to-gray-800' },
] as const;

const ConnectionStatusBar = ({ connections }: ConnectionStatusBarProps) => {
  const navigate = useNavigate();
  const connectedCount = Object.values(connections).filter(Boolean).length;

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Redes conectadas:</span>
        <Badge variant={connectedCount > 0 ? "default" : "secondary"}>
          {connectedCount}/4
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 flex-1">
        {platforms.map(({ key, label, icon: Icon, color }) => {
          const isConnected = connections[key];
          return (
            <div
              key={key}
              className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all ${
                isConnected 
                  ? `bg-gradient-to-br ${color} text-white shadow-md` 
                  : 'bg-muted text-muted-foreground'
              }`}
              title={`${label}: ${isConnected ? 'Conectado' : 'No conectado'}`}
            >
              <Icon className="w-4 h-4" />
              {isConnected ? (
                <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-green-500 bg-background rounded-full" />
              ) : (
                <XCircle className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-muted-foreground bg-background rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      {connectedCount < 4 && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/company-dashboard?view=adn-empresa&tab=canales')}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Conectar más redes
        </Button>
      )}
    </div>
  );
};

export default ConnectionStatusBar;
