import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useCRMContacts, CreateContactInput } from '@/hooks/useCRMContacts';
import { useCompanyData } from '@/hooks/useCompanyData';
import { Search, Plus, Mail, Phone, Building2, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ContactsList = () => {
  const { t } = useTranslation();
  const { primaryCompany } = useCompanyData();
  const companyId = primaryCompany?.id;
  
  const { contacts, isLoading, filters, setFilters, createContact } = useCRMContacts(companyId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newContact, setNewContact] = useState<Partial<CreateContactInput>>({
    business_type: 'b2c',
    contact_type: 'lead',
  });

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleCreateContact = async () => {
    if (!companyId || !newContact.first_name) return;
    
    await createContact.mutateAsync({
      ...newContact,
      company_id: companyId,
      first_name: newContact.first_name,
    } as CreateContactInput);
    
    setIsCreateOpen(false);
    setNewContact({ business_type: 'b2c', contact_type: 'lead' });
  };

  const getLifecycleBadgeColor = (stage: string) => {
    const colors: Record<string, string> = {
      subscriber: 'bg-gray-500',
      lead: 'bg-blue-500',
      mql: 'bg-purple-500',
      sql: 'bg-orange-500',
      opportunity: 'bg-yellow-500',
      customer: 'bg-green-500',
      evangelist: 'bg-pink-500',
    };
    return colors[stage] || 'bg-gray-500';
  };

  const getInitials = (firstName: string, lastName?: string) => {
    return `${firstName.charAt(0)}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('crm.contacts.searchPlaceholder')}
              className="pl-10"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          <Select
            value={filters.business_type || 'all'}
            onValueChange={(value) => setFilters(prev => ({ ...prev, business_type: value as 'b2c' | 'b2b' | 'all' }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('crm.contacts.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('crm.contacts.all')}</SelectItem>
              <SelectItem value="b2c">B2C</SelectItem>
              <SelectItem value="b2b">B2B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('crm.contacts.add')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('crm.contacts.addNew')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('crm.contacts.firstName')} *</Label>
                  <Input
                    value={newContact.first_name || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('crm.contacts.lastName')}</Label>
                  <Input
                    value={newContact.last_name || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{t('crm.contacts.email')}</Label>
                <Input
                  type="email"
                  value={newContact.email || ''}
                  onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('crm.contacts.phone')}</Label>
                <Input
                  value={newContact.phone || ''}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('crm.contacts.businessType')}</Label>
                  <Select
                    value={newContact.business_type || 'b2c'}
                    onValueChange={(value) => setNewContact(prev => ({ ...prev, business_type: value as 'b2c' | 'b2b' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="b2c">B2C</SelectItem>
                      <SelectItem value="b2b">B2B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('crm.contacts.contactType')}</Label>
                  <Select
                    value={newContact.contact_type || 'lead'}
                    onValueChange={(value) => setNewContact(prev => ({ ...prev, contact_type: value as 'lead' | 'customer' | 'prospect' | 'churned' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">{t('crm.lifecycle.lead')}</SelectItem>
                      <SelectItem value="prospect">{t('crm.lifecycle.prospect')}</SelectItem>
                      <SelectItem value="customer">{t('crm.lifecycle.customer')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newContact.business_type === 'b2b' && (
                <div className="space-y-2">
                  <Label>{t('crm.contacts.jobTitle')}</Label>
                  <Input
                    value={newContact.job_title || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, job_title: e.target.value }))}
                  />
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={handleCreateContact}
                disabled={!newContact.first_name || createContact.isPending}
              >
                {createContact.isPending ? t('status.saving') : t('crm.contacts.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contacts List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('status.loading')}
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('crm.contacts.noContacts')}
            </div>
          ) : (
            <div className="divide-y">
              {contacts.map((contact) => (
                <div key={contact.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contact.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(contact.first_name, contact.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {contact.business_type.toUpperCase()}
                        </Badge>
                        <Badge className={`${getLifecycleBadgeColor(contact.lifecycle_stage)} text-white text-xs`}>
                          {t(`crm.lifecycle.${contact.lifecycle_stage}`)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                        {contact.job_title && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {contact.job_title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-sm text-muted-foreground">
                      <p>{format(new Date(contact.created_at), "d MMM yyyy", { locale: es })}</p>
                      {contact.last_activity_at && (
                        <p className="text-xs">
                          {t('crm.contacts.lastActivity')}: {format(new Date(contact.last_activity_at), "d MMM", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
