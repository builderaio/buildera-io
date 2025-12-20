import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, TrendingUp, Activity, DollarSign, Target } from 'lucide-react';
import { useCRMContacts } from '@/hooks/useCRMContacts';
import { useCRMDeals } from '@/hooks/useCRMDeals';
import { useCRMAccounts } from '@/hooks/useCRMAccounts';
import { useCRMActivities } from '@/hooks/useCRMActivities';
import { useCompanyData } from '@/hooks/useCompanyData';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const CRMDashboard = () => {
  const { t } = useTranslation();
  const { primaryCompany } = useCompanyData();
  const companyId = primaryCompany?.id;

  const { contacts, isLoading: contactsLoading } = useCRMContacts(companyId);
  const { accounts, isLoading: accountsLoading } = useCRMAccounts(companyId);
  const { deals, isLoading: dealsLoading } = useCRMDeals(companyId);
  const { activities, pendingTasks, isLoading: activitiesLoading } = useCRMActivities(companyId);

  const isLoading = contactsLoading || accountsLoading || dealsLoading || activitiesLoading;

  // Calculate metrics
  const totalContacts = contacts.length;
  const b2bContacts = contacts.filter(c => c.business_type === 'b2b').length;
  const b2cContacts = contacts.filter(c => c.business_type === 'b2c').length;
  const openDeals = deals.filter(d => d.status === 'open');
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
  const wonDeals = deals.filter(d => d.status === 'won');
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

  const stats = [
    {
      title: t('crm.dashboard.totalContacts'),
      value: totalContacts,
      subtitle: `${b2bContacts} B2B · ${b2cContacts} B2C`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: t('crm.dashboard.accounts'),
      value: accounts.length,
      subtitle: t('crm.dashboard.activeAccounts'),
      icon: Building2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: t('crm.dashboard.pipelineValue'),
      value: `$${pipelineValue.toLocaleString()}`,
      subtitle: `${openDeals.length} ${t('crm.dashboard.openDeals')}`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: t('crm.dashboard.wonThisMonth'),
      value: `$${wonValue.toLocaleString()}`,
      subtitle: `${wonDeals.length} ${t('crm.dashboard.deals')}`,
      icon: Target,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email_sent':
      case 'email_received':
        return '📧';
      case 'call':
        return '📞';
      case 'meeting':
        return '📅';
      case 'note':
        return '📝';
      case 'deal_created':
        return '💼';
      case 'deal_won':
        return '🎉';
      case 'deal_lost':
        return '❌';
      default:
        return '📌';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('crm.dashboard.recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('crm.dashboard.noActivity')}
              </p>
            ) : (
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <span className="text-xl">{getActivityIcon(activity.activity_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.activity_date), "d MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('crm.dashboard.pendingTasks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('crm.dashboard.noTasks')}
              </p>
            ) : (
              <div className="space-y-4">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{task.subject}</p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground">
                          {t('crm.dashboard.dueDate')}: {format(new Date(task.due_date), "d MMM", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
