import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle, UserPlus, AtSign, Reply, Send, PenTool,
  Zap, Plus, Trash2, ToggleLeft, Bot, ArrowLeft
} from "lucide-react";
import { useMarketingStrategicBridge } from "@/hooks/useMarketingStrategicBridge";

interface SocialAutomationRulesProps {
  companyId?: string;
  onBack?: () => void;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  triggerConfig: Record<string, string>;
  action: string;
  actionConfig: Record<string, string>;
  isActive: boolean;
  platform: string;
}

const TRIGGERS = [
  { id: "new_comment", icon: MessageCircle, labelKey: "socialAutomation.triggers.newComment" },
  { id: "new_follower", icon: UserPlus, labelKey: "socialAutomation.triggers.newFollower" },
  { id: "new_mention", icon: AtSign, labelKey: "socialAutomation.triggers.newMention" },
  { id: "keyword_detected", icon: Zap, labelKey: "socialAutomation.triggers.keywordDetected" },
];

const ACTIONS = [
  { id: "ai_reply_comment", icon: Reply, labelKey: "socialAutomation.actions.aiReply" },
  { id: "send_dm", icon: Send, labelKey: "socialAutomation.actions.sendDM" },
  { id: "create_post", icon: PenTool, labelKey: "socialAutomation.actions.createPost" },
  { id: "add_to_crm", icon: UserPlus, labelKey: "socialAutomation.actions.addToCRM" },
];

export const SocialAutomationRules = ({ companyId, onBack }: SocialAutomationRulesProps) => {
  const { t } = useTranslation("marketing");
  const { toast } = useToast();
  const { recordMarketingImpact } = useMarketingStrategicBridge(companyId);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    name: "",
    trigger: "new_comment",
    action: "ai_reply_comment",
    platform: "instagram",
    triggerConfig: {},
    actionConfig: {},
    isActive: true,
  });

  const handleAddRule = () => {
    if (!newRule.name) {
      toast({ title: t("socialAutomation.nameRequired"), variant: "destructive" });
      return;
    }
    const rule: AutomationRule = {
      id: crypto.randomUUID(),
      name: newRule.name || "",
      trigger: newRule.trigger || "new_comment",
      triggerConfig: newRule.triggerConfig || {},
      action: newRule.action || "ai_reply_comment",
      actionConfig: newRule.actionConfig || {},
      isActive: true,
      platform: newRule.platform || "instagram",
    };
    setRules((prev) => [...prev, rule]);
    setIsCreating(false);
    setNewRule({ name: "", trigger: "new_comment", action: "ai_reply_comment", platform: "instagram", triggerConfig: {}, actionConfig: {}, isActive: true });
    toast({ title: t("socialAutomation.ruleCreated") });
    recordMarketingImpact({
      eventType: 'automation_activated',
      eventSource: 'automation_rule',
      sourceId: rule.id,
      dimension: 'operations',
      evidence: { trigger: rule.trigger, action: rule.action, platform: rule.platform },
    });
  };

  const toggleRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    const newActive = rule ? !rule.isActive : false;
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: newActive } : r))
    );
    recordMarketingImpact({
      eventType: newActive ? 'automation_activated' : 'automation_deactivated',
      eventSource: 'automation_rule',
      sourceId: id,
      dimension: 'operations',
    });
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast({ title: t("socialAutomation.ruleDeleted") });
  };

  const getTriggerInfo = (triggerId: string) => TRIGGERS.find((t) => t.id === triggerId);
  const getActionInfo = (actionId: string) => ACTIONS.find((a) => a.id === actionId);

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
              <Bot className="h-6 w-6 text-primary" />
              {t("socialAutomation.title")}
            </h2>
            <p className="text-muted-foreground mt-1">{t("socialAutomation.subtitle")}</p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("socialAutomation.newRule")}
        </Button>
      </div>

      {/* Create Rule Form */}
      {isCreating && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">{t("socialAutomation.createRule")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("socialAutomation.ruleName")}</Label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule((p) => ({ ...p, name: e.target.value }))}
                placeholder={t("socialAutomation.ruleNamePlaceholder")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t("socialAutomation.platform")}</Label>
                <Select value={newRule.platform} onValueChange={(v) => setNewRule((p) => ({ ...p, platform: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="all">{t("socialAutomation.allPlatforms")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t("socialAutomation.whenTrigger")}</Label>
                <Select value={newRule.trigger} onValueChange={(v) => setNewRule((p) => ({ ...p, trigger: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGERS.map((tr) => (
                      <SelectItem key={tr.id} value={tr.id}>{t(tr.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t("socialAutomation.thenAction")}</Label>
                <Select value={newRule.action} onValueChange={(v) => setNewRule((p) => ({ ...p, action: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map((ac) => (
                      <SelectItem key={ac.id} value={ac.id}>{t(ac.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Config */}
            {(newRule.action === "ai_reply_comment" || newRule.action === "send_dm") && (
              <div>
                <Label>{t("socialAutomation.messageTemplate")}</Label>
                <Textarea
                  placeholder={t("socialAutomation.messageTemplatePlaceholder")}
                  value={newRule.actionConfig?.template || ""}
                  onChange={(e) =>
                    setNewRule((p) => ({
                      ...p,
                      actionConfig: { ...p.actionConfig, template: e.target.value },
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("socialAutomation.useAIHint")}
                </p>
              </div>
            )}

            {newRule.trigger === "keyword_detected" && (
              <div>
                <Label>{t("socialAutomation.keywords")}</Label>
                <Input
                  placeholder={t("socialAutomation.keywordsPlaceholder")}
                  value={newRule.triggerConfig?.keywords || ""}
                  onChange={(e) =>
                    setNewRule((p) => ({
                      ...p,
                      triggerConfig: { ...p.triggerConfig, keywords: e.target.value },
                    }))
                  }
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAddRule}>{t("socialAutomation.save")}</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>{t("socialAutomation.cancel")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      {rules.length === 0 && !isCreating ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">{t("socialAutomation.noRules")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("socialAutomation.noRulesHint")}</p>
            <Button className="mt-4" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("socialAutomation.createFirst")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const triggerInfo = getTriggerInfo(rule.trigger);
            const actionInfo = getActionInfo(rule.action);
            const TriggerIcon = triggerInfo?.icon || Zap;
            const ActionIcon = actionInfo?.icon || Zap;

            return (
              <Card key={rule.id} className={`border-0 shadow-md transition-opacity ${!rule.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                      <div>
                        <p className="font-semibold">{rule.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Badge variant="outline" className="gap-1">
                            <TriggerIcon className="h-3 w-3" />
                            {triggerInfo ? t(triggerInfo.labelKey) : rule.trigger}
                          </Badge>
                          <span>→</span>
                          <Badge variant="outline" className="gap-1">
                            <ActionIcon className="h-3 w-3" />
                            {actionInfo ? t(actionInfo.labelKey) : rule.action}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">{rule.platform}</Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
