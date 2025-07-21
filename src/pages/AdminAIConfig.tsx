import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield } from 'lucide-react';
import AIProviderManagement from '@/components/admin/AIProviderManagement';
import BusinessFunctionConfiguration from '@/components/admin/BusinessFunctionConfiguration';
import AIModelSelection from '@/components/admin/AIModelSelection';
import AIBusinessConfiguration from '@/components/admin/AIBusinessConfiguration';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import ThemeSelector from '@/components/ThemeSelector';

const AdminAIConfig = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex items-center p-2 sm:px-3 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver al Dashboard</span>
              </Button>
              <div className="h-4 sm:h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center min-w-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">Configuración IA</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Portal Admin - Buildera</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <ThemeSelector />
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Configuración de IA</h2>
            <p className="text-muted-foreground">
              Gestiona los proveedores, modelos de IA y configuraciones del sistema
            </p>
          </div>

          <Tabs defaultValue="providers" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="providers">Proveedores de IA</TabsTrigger>
              <TabsTrigger value="functions">Funciones de Negocio</TabsTrigger>
              <TabsTrigger value="selection">Selección Legacy</TabsTrigger>
              <TabsTrigger value="business">Configuración Legacy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="providers">
              <AIProviderManagement />
            </TabsContent>
            
            <TabsContent value="functions">
              <BusinessFunctionConfiguration />
            </TabsContent>
            
            <TabsContent value="selection">
              <AIModelSelection />
            </TabsContent>
            
            <TabsContent value="business">
              <AIBusinessConfiguration />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminAIConfig;