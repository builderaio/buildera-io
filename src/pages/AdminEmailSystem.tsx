import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { EmailSystemConfig } from '@/components/admin/EmailSystemConfig';
import { Mail } from 'lucide-react';

const AdminEmailSystem = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <AdminPageHeader
          title="Sistema de Email"
          subtitle="Gestiona configuraciones SMTP, plantillas y envíos de email"
          icon={Mail}
          showBackButton={true}
        />
        <main className="flex-1 p-6 overflow-auto">
          <EmailSystemConfig />
        </main>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminEmailSystem;