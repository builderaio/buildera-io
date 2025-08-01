import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmailSendHistory } from "@/hooks/useEmailSystem";
import { CheckCircle, XCircle, Clock, Search, RefreshCw } from "lucide-react";

interface EmailHistoryProps {
  history: EmailSendHistory[];
  onRefresh: () => void;
}

export const EmailHistory = ({ history, onRefresh }: EmailHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = history.filter(item =>
    item.to_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Enviado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Historial de Envíos</h2>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por email o asunto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="space-y-3">
        {filteredHistory.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(item.status)}
                  <CardTitle className="text-lg">{item.subject}</CardTitle>
                </div>
                {getStatusBadge(item.status)}
              </div>
              <CardDescription>
                Para: {item.to_name ? `${item.to_name} (${item.to_email})` : item.to_email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Enviado:</strong> {new Date(item.created_at).toLocaleString()}
                </div>
                {item.sent_at && (
                  <div>
                    <strong>Entregado:</strong> {new Date(item.sent_at).toLocaleString()}
                  </div>
                )}
                {item.cc_emails && item.cc_emails.length > 0 && (
                  <div>
                    <strong>CC:</strong> {item.cc_emails.join(", ")}
                  </div>
                )}
                {item.bcc_emails && item.bcc_emails.length > 0 && (
                  <div>
                    <strong>BCC:</strong> {item.bcc_emails.join(", ")}
                  </div>
                )}
              </div>
              
              {item.error_message && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Error:</strong> {item.error_message}
                  </p>
                </div>
              )}

              {Object.keys(item.variables).length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium mb-2">Variables utilizadas:</p>
                  <div className="text-xs text-gray-600">
                    {Object.entries(item.variables).map(([key, value]) => (
                      <span key={key} className="inline-block mr-3">
                        <strong>{key}:</strong> {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredHistory.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No se encontraron emails que coincidan con la búsqueda" : "No hay emails en el historial"}
          </div>
        )}
      </div>
    </div>
  );
};