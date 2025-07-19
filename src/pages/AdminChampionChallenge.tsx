import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import ChampionChallenge from '@/components/admin/ChampionChallenge';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminChampionChallenge = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
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
              <div className="h-4 sm:h-6 w-px bg-gray-300 hidden sm:block" />
              <div className="flex items-center min-w-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800 mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold text-gray-900 truncate">Champion Challenge IA</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Portal Admin - Buildera</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <span className="text-xs sm:text-sm text-gray-700 hidden md:block">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <ChampionChallenge />
      </main>
    </div>
  );
};

export default AdminChampionChallenge;