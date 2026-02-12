import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle, XCircle, Clock, FileEdit, Eye, Send,
  MessageSquare, ArrowLeft, RefreshCw, User
} from "lucide-react";

interface ContentApprovalPanelProps {
  companyId?: string;
  onBack?: () => void;
}

interface ContentApproval {
  id: string;
  content_id: string;
  content_type: string;
  content_data: any;
  status: string;
  submitted_by: string | null;
  reviewer_id: string | null;
  reviewer_comments: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const statusConfig: Record<string, { icon: any; color: string; labelKey: string }> = {
  draft: { icon: FileEdit, color: "text-muted-foreground", labelKey: "approvals.status.draft" },
  pending_review: { icon: Clock, color: "text-yellow-600", labelKey: "approvals.status.pendingReview" },
  approved: { icon: CheckCircle, color: "text-green-600", labelKey: "approvals.status.approved" },
  rejected: { icon: XCircle, color: "text-destructive", labelKey: "approvals.status.rejected" },
  published: { icon: Send, color: "text-primary", labelKey: "approvals.status.published" },
};

export const ContentApprovalPanel = ({ companyId, onBack }: ContentApprovalPanelProps) => {
  const { t } = useTranslation("marketing");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState<ContentApproval[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedApproval, setSelectedApproval] = useState<ContentApproval | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (companyId) loadApprovals();
  }, [companyId, filter]);

  const loadApprovals = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      let query = supabase
        .from("content_approvals")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setApprovals(data || []);
    } catch (err) {
      console.error("Error loading approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateApprovalStatus = async (id: string, status: string) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updates: any = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewer_id: user?.id,
      };
      if (reviewComment) {
        updates.reviewer_comments = reviewComment;
      }

      const { error } = await supabase
        .from("content_approvals")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({ title: t(`approvals.${status === "approved" ? "approvedSuccess" : "rejectedSuccess"}`) });
      setSelectedApproval(null);
      setReviewComment("");
      loadApprovals();
    } catch (err) {
      console.error("Error updating approval:", err);
      toast({ title: t("approvals.updateError"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const submitForReview = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("content_approvals")
        .update({
          status: "pending_review",
          submitted_at: new Date().toISOString(),
          submitted_by: user?.id,
        })
        .eq("id", id);

      if (error) throw error;
      toast({ title: t("approvals.submittedForReview") });
      loadApprovals();
    } catch (err) {
      toast({ title: t("approvals.updateError"), variant: "destructive" });
    }
  };

  const pendingCount = approvals.filter((a) => a.status === "pending_review").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              {t("approvals.title")}
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>
              )}
            </h2>
            <p className="text-muted-foreground mt-1">{t("approvals.subtitle")}</p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={loadApprovals} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {["all", "draft", "pending_review", "approved", "rejected"].map((status) => {
          const count = status === "all" ? approvals.length : approvals.filter((a) => a.status === status).length;
          const config = status === "all" ? { icon: Eye, color: "text-foreground", labelKey: "approvals.filter.all" } : statusConfig[status];
          const Icon = config.icon;
          return (
            <Card
              key={status}
              className={`cursor-pointer border-0 shadow-sm hover:shadow-md transition-all ${filter === status ? "ring-2 ring-primary" : ""}`}
              onClick={() => setFilter(status)}
            >
              <CardContent className="p-3 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${config.color}`} />
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{t(config.labelKey)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">{t("approvals.noContent")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("approvals.noContentHint")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval) => {
            const config = statusConfig[approval.status] || statusConfig.draft;
            const StatusIcon = config.icon;
            const contentTitle = (approval.content_data as any)?.title || (approval.content_data as any)?.text?.substring(0, 50) || approval.content_id;

            return (
              <Card key={approval.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <StatusIcon className={`h-5 w-5 shrink-0 ${config.color}`} />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{contentTitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{approval.content_type}</Badge>
                          <Badge variant="secondary" className={`text-xs ${config.color}`}>
                            {t(config.labelKey)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(approval.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {approval.reviewer_comments && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {approval.reviewer_comments}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {approval.status === "draft" && (
                        <Button size="sm" variant="outline" onClick={() => submitForReview(approval.id)}>
                          <Send className="h-3 w-3 mr-1" />
                          {t("approvals.submitReview")}
                        </Button>
                      )}
                      {approval.status === "pending_review" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updateApprovalStatus(approval.id, "approved")}
                            disabled={submitting}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t("approvals.approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedApproval(approval);
                            }}
                            disabled={submitting}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            {t("approvals.reject")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rejection Dialog */}
      {selectedApproval && (
        <Card className="border-2 border-destructive/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">{t("approvals.rejectReason")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={t("approvals.rejectReasonPlaceholder")}
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => updateApprovalStatus(selectedApproval.id, "rejected")}
                disabled={submitting}
              >
                {t("approvals.confirmReject")}
              </Button>
              <Button variant="outline" onClick={() => { setSelectedApproval(null); setReviewComment(""); }}>
                {t("approvals.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
