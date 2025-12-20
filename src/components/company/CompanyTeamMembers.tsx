import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Shield, User, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import InviteUserDialog from "./InviteUserDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    updated_at: string | null;
  } | null;
}

const CompanyTeamMembers = () => {
  const { t } = useTranslation("common");
  const { company, loading: companyLoading } = useCompany();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      // Wait for company context to finish loading
      if (companyLoading) return;
      
      if (!company?.id) {
        console.log('🔍 [CompanyTeamMembers] No company available');
        setLoading(false);
        return;
      }

      console.log('🔍 [CompanyTeamMembers] Fetching members for company:', company.id);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        const { data: membersData, error } = await supabase
          .from("company_members")
          .select(`
            id,
            user_id,
            role,
            joined_at
          `)
          .eq("company_id", company.id)
          .order("joined_at", { ascending: true });

        if (error) throw error;

        console.log('🔍 [CompanyTeamMembers] Found members:', membersData?.length);

        // Fetch profiles for each member
        const membersWithProfiles: TeamMember[] = await Promise.all(
          (membersData || []).map(async (member) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email, avatar_url, updated_at")
              .eq("id", member.user_id)
              .single();

            return {
              ...member,
              profile: profile || null,
            };
          })
        );

        setMembers(membersWithProfiles);
        
        // Check if current user is owner
        const currentMember = membersWithProfiles.find(m => m.user_id === user?.id);
        setIsOwner(currentMember?.role === "owner");
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast.error(t("config.team.errorLoading"));
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [company?.id, companyLoading, t]);

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      const { error } = await supabase
        .from("company_members")
        .delete()
        .eq("id", memberToRemove.id);

      if (error) throw error;

      setMembers(members.filter(m => m.id !== memberToRemove.id));
      toast.success(t("config.team.memberRemoved"));
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error(t("config.team.errorRemoving"));
    } finally {
      setMemberToRemove(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
            <Crown className="w-3 h-3 mr-1" />
            {t("config.team.roles.owner")}
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
            <Shield className="w-3 h-3 mr-1" />
            {t("config.team.roles.admin")}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <User className="w-3 h-3 mr-1" />
            {t("config.team.roles.member")}
          </Badge>
        );
    }
  };

  const formatLastActivity = (dateString: string | null) => {
    if (!dateString) return t("config.team.noActivity");
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return t("config.team.lastActivity.minutes", { count: diffMins });
    if (diffHours < 24) return t("config.team.lastActivity.hours", { count: diffHours });
    return t("config.team.lastActivity.days", { count: diffDays });
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return "?";
  };

  if (loading || companyLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!company?.id) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("config.team.noCompany", "No hay empresa configurada")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("config.team.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("config.team.description", { count: members.length })}
          </p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          {t("config.team.invite")}
        </Button>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(member.profile?.full_name, member.profile?.email)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {member.profile?.full_name || member.profile?.email || t("config.team.unknownUser")}
                </span>
                {getRoleBadge(member.role)}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {member.profile?.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatLastActivity(member.profile?.updated_at)}
              </p>
            </div>

            {isOwner && member.user_id !== currentUserId && member.role !== "owner" && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setMemberToRemove(member)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}

        {members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {t("config.team.noMembers")}
          </div>
        )}
      </div>

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        companyId={company?.id}
        onInviteSent={() => {
          toast.success(t("config.team.inviteSent"));
        }}
      />

      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("config.team.removeConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("config.team.removeConfirm.description", {
                name: memberToRemove?.profile?.full_name || memberToRemove?.profile?.email
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompanyTeamMembers;
