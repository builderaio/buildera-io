import { Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import UnifiedAIConfiguration from '@/components/admin/UnifiedAIConfiguration';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

const AdminAIConfig = () => {
  const { t } = useTranslation(['admin']);

  return (
    <AdminLayout>
      <AdminPageHeader
        title={t('admin:aiConfig.title')}
        subtitle={t('admin:aiConfig.subtitle')}
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
