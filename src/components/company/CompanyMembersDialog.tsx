import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompanyManagement, CompanyMember } from '@/hooks/useCompanyManagement';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Mail, MoreHorizontal, Trash2, Crown, Shield, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CompanyMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  members: CompanyMember[];
}

export const CompanyMembersDialog = ({ 
  open, 
  onOpenChange, 
  companyId, 
  members 
}: CompanyMembersDialogProps) => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  
  const { 
    addCompanyMember, 
    updateMemberRole, 
    removeCompanyMember,
    fetchCompanyMembers 
  } = useCompanyManagement();
  const { toast } = useToast();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "El email es requerido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Buscar usuario por email y obtener su ID
      // Por ahora, simulamos que encontramos el usuario
      toast({
        title: "Función en desarrollo",
        description: "La invitación de miembros estará disponible próximamente",
        variant: "default",
      });
      
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteForm(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo invitar al miembro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'owner' | 'admin' | 'member') => {
    try {
      const result = await updateMemberRole(memberId, newRole);
      
      if (result.success) {
        toast({
          title: "Rol actualizado",
          description: "El rol del miembro ha sido actualizado",
        });
        await fetchCompanyMembers(companyId);
      } else {
        throw new Error(result.error?.message || 'Error desconocido');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el rol",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const result = await removeCompanyMember(memberId);
      
      if (result.success) {
        toast({
          title: "Miembro eliminado",
          description: "El miembro ha sido eliminado de la empresa",
        });
        await fetchCompanyMembers(companyId);
      } else {
        throw new Error(result.error?.message || 'Error desconocido');
      }
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "No se pudo eliminar al miembro",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Miembros del Equipo
          </DialogTitle>
          <DialogDescription>
            Gestiona los miembros de tu empresa y sus roles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showInviteForm && (
            <Button
              variant="outline"
              onClick={() => setShowInviteForm(true)}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invitar Miembro
            </Button>
          )}

          {showInviteForm && (
            <form onSubmit={handleInviteMember} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email del nuevo miembro</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Rol</Label>
                <Select value={inviteRole} onValueChange={(value: 'admin' | 'member') => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Miembro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Invitando..." : "Enviar Invitación"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInviteForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Miembros Actuales ({members.length})</h4>
            
            {members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay miembros en esta empresa</p>
                <p className="text-sm">Invita a tu primer miembro para comenzar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.user_id.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">Usuario {member.user_id.substring(0, 8)}</p>
                          {getRoleIcon(member.role)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {member.role === 'owner' ? 'Propietario' : 
                             member.role === 'admin' ? 'Administrador' : 'Miembro'}
                          </Badge>
                          {member.is_primary && (
                            <Badge variant="outline" className="text-xs">
                              Principal
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleRoleChange(member.id, member.role === 'admin' ? 'member' : 'admin')}
                          >
                            {member.role === 'admin' ? 'Cambiar a Miembro' : 'Hacer Administrador'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};