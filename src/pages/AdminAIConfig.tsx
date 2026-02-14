import { Brain } from 'lucide-react';
import UnifiedAIConfiguration from '@/components/admin/UnifiedAIConfiguration';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

const AdminAIConfig = () => {
  return (
    <AdminLayout>
      <AdminPageHeader
        title="Configuración IA"
        subtitle="Proveedores, modelos y configuraciones del sistema"
        icon={Brain}
        showBackButton={true}
      />
      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <UnifiedAIConfiguration />
      </main>
    </AdminLayout>
  );
};

export default AdminAIConfig;
