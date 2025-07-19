import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import ConfiguracionIA from '@/components/company/ConfiguracionIA';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminAIConfig = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center">
                <Shield className="w-6 h-6 text-slate-800 mr-2" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Configuración IA</h1>
                  <p className="text-xs text-gray-500">Portal Admin - Buildera</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConfiguracionIA />
      </main>
    </div>
  );
};

export default AdminAIConfig;