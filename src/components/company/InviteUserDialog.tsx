import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Mail, UserPlus } from "lucide-react";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  onInviteSent?: () => void;
}

const InviteUserDialog = ({
  open,
  onOpenChange,
  companyId,
  onInviteSent,
}: InviteUserDialogProps) => {
  const { t } = useTranslation("common");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      toast.error(t("config.invite.noCompany"));
      return;
    }

    if (!email.trim()) {
      toast.error(t("config.invite.emailRequired"));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke("send-company-invitation", {
        body: {
          email: email.trim(),
          companyId,
          role,
        },
      });

      if (error) throw error;

      onInviteSent?.();
      onOpenChange(false);
      setEmail("");
      setRole("member");
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast.error(error.message || t("config.invite.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {t("config.invite.title")}
          </DialogTitle>
          <DialogDescription>
            {t("config.invite.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("config.invite.emailLabel")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={t("config.invite.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{t("config.invite.roleLabel")}</Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  {t("config.team.roles.member")} - {t("config.invite.roles.memberDesc")}
                </SelectItem>
                <SelectItem value="admin">
                  {t("config.team.roles.admin")} - {t("config.invite.roles.adminDesc")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("config.invite.sending")}
                </>
              ) : (
                t("config.invite.send")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
