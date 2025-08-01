import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import { EmailSystemConfig } from '@/components/admin/EmailSystemConfig';

const AdminEmailSystem = () => {
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-background">
        <EmailSystemConfig />
      </div>
    </AdminProtectedRoute>
  );
};

export default AdminEmailSystem;