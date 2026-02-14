import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Database, Settings, Shield } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { EmailSystemConfig } from '@/components/admin/EmailSystemConfig';
import DatabasePanel from '@/components/admin/DatabasePanel';
import SecurityEventsPanel from '@/components/admin/SecurityEventsPanel';

const AdminSystem = () => {
  const [activeTab, setActiveTab] = useState('email');

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Sistema"
        subtitle="Email, base de datos, seguridad y configuraciones del sistema"
        icon={Settings}
        showBackButton={true}
      />
      
      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>Base de Datos</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Seguridad</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <EmailSystemConfig />
          </TabsContent>

          <TabsContent value="database">
            <DatabasePanel />
          </TabsContent>

          <TabsContent value="security">
            <SecurityEventsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </AdminLayout>
  );
};

export default AdminSystem;
