import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import type { MaturityLevel } from './useCompanyState';

export type DepartmentType = 'marketing' | 'sales' | 'finance' | 'legal' | 'hr' | 'operations';

export interface DepartmentConfig {
  id: string;
  company_id: string;
  department: DepartmentType;
  autopilot_enabled: boolean;
  maturity_level_required: string;
  allowed_actions: string[];
  guardrails: Record<string, any>;
  execution_frequency: string;
  last_execution_at: string | null;
  next_execution_at: string | null;
  auto_unlocked: boolean;
  auto_unlocked_at: string | null;
  total_cycles_run: number;
  max_credits_per_cycle: number;
  require_human_approval: boolean;
}

interface DepartmentDefinition {
  department: DepartmentType;
  maturity_level_required: MaturityLevel;
  default_actions: string[];
  default_guardrails: Record<string, any>;
}

const DEPARTMENT_DEFINITIONS: DepartmentDefinition[] = [
  {
    department: 'marketing',
    maturity_level_required: 'starter',
    default_actions: ['generate_content', 'schedule_post', 'analyze_performance'],
    default_guardrails: { max_posts_per_day: 3, require_brand_check: true },
  },
  {
    department: 'sales',
    maturity_level_required: 'starter',
    default_actions: ['score_leads', 'alert_stalled_deals'],
    default_guardrails: { max_outreach_per_day: 10 },
  },
  {
    department: 'finance',
    maturity_level_required: 'starter',
    default_actions: ['monitor_credits', 'project_consumption'],
    default_guardrails: { alert_threshold_percentage: 80 },
  },
  {
    department: 'legal',
    maturity_level_required: 'growing',
    default_actions: ['review_contracts', 'check_compliance'],
    default_guardrails: { require_human_review: true },
  },
  {
    department: 'hr',
    maturity_level_required: 'established',
    default_actions: ['generate_profiles', 'analyze_climate'],
    default_guardrails: { require_human_review: true },
  },
  {
    department: 'operations',
    maturity_level_required: 'established',
    default_actions: ['optimize_processes', 'monitor_sla'],
    default_guardrails: { max_auto_actions: 5 },
  },
];

const MATURITY_ORDER: MaturityLevel[] = ['starter', 'growing', 'established', 'scaling'];

const isMaturitySufficient = (current: MaturityLevel, required: MaturityLevel): boolean => {
  return MATURITY_ORDER.indexOf(current) >= MATURITY_ORDER.indexOf(required);
};

const CAPABILITY_SEEDS: Record<string, { code: string; name: string; required_maturity: string; trigger: Record<string, any> }[]> = {
  marketing: [
    { code: 'content_optimization', name: 'Content A/B Testing', required_maturity: 'starter', trigger: { type: 'schedule', interval: 'weekly' } },
    { code: 'audience_segmentation', name: 'Smart Audience Segmentation', required_maturity: 'growing', trigger: { type: 'data_threshold', min_followers: 500 } },
    { code: 'ab_testing_auto', name: 'Automated A/B Testing', required_maturity: 'established', trigger: { type: 'performance', min_posts: 20 } },
  ],
  sales: [
    { code: 'lead_scoring', name: 'AI Lead Scoring', required_maturity: 'starter', trigger: { type: 'data_available', source: 'crm' } },
    { code: 'predictive_churn', name: 'Predictive Churn Detection', required_maturity: 'growing', trigger: { type: 'data_threshold', min_customers: 50 } },
  ],
  finance: [
    { code: 'credit_monitoring', name: 'Credit Consumption Monitoring', required_maturity: 'starter', trigger: { type: 'schedule', interval: 'daily' } },
    { code: 'budget_forecasting', name: 'Budget Forecasting', required_maturity: 'growing', trigger: { type: 'data_threshold', min_transactions: 30 } },
  ],
  legal: [
    { code: 'compliance_check', name: 'Content Compliance Check', required_maturity: 'growing', trigger: { type: 'on_publish' } },
    { code: 'regulatory_monitor', name: 'Regulatory Change Monitor', required_maturity: 'established', trigger: { type: 'schedule', interval: 'weekly' } },
  ],
  hr: [
    { code: 'profile_generation', name: 'Job Profile Generation', required_maturity: 'established', trigger: { type: 'manual' } },
    { code: 'climate_analysis', name: 'Work Climate Analysis', required_maturity: 'established', trigger: { type: 'schedule', interval: 'monthly' } },
  ],
  operations: [
    { code: 'process_optimization', name: 'Process Optimization', required_maturity: 'established', trigger: { type: 'schedule', interval: 'weekly' } },
    { code: 'sla_monitoring', name: 'SLA Monitoring', required_maturity: 'established', trigger: { type: 'schedule', interval: 'daily' } },
  ],
};

const seedCapabilities = async (companyId: string, departments: DepartmentDefinition[]) => {
  // Check existing capabilities to avoid duplicates
  const { data: existing } = await supabase
    .from('autopilot_capabilities')
    .select('capability_code')
    .eq('company_id', companyId);

  const existingCodes = new Set((existing || []).map(e => e.capability_code));

  const capabilities = departments.flatMap(def => {
    const seeds = CAPABILITY_SEEDS[def.department] || [];
    return seeds
      .filter(seed => !existingCodes.has(seed.code))
      .map(seed => ({
        company_id: companyId,
        department: def.department,
        capability_code: seed.code,
        capability_name: seed.name,
        required_maturity: seed.required_maturity,
        trigger_condition: seed.trigger,
        is_active: false,
      }));
  });

  if (capabilities.length > 0) {
    await supabase.from('autopilot_capabilities').insert(capabilities);
  }
};

export const useDepartmentUnlocking = (
  companyId: string | null,
  maturityLevel: MaturityLevel
) => {
  const [departments, setDepartments] = useState<DepartmentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<DepartmentType[]>([]);
  const { toast } = useToast();
  const { t } = useTranslation('common');

  // Load existing department configs
  const loadDepartments = useCallback(async () => {
    if (!companyId) {
      setDepartments([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('company_department_config')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      setDepartments((data || []) as DepartmentConfig[]);
    } catch (err) {
      console.error('Error loading department configs:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Check and auto-unlock departments based on maturity
  const checkAndUnlock = useCallback(async () => {
    if (!companyId || loading) return;

    const existingDepts = new Set(departments.map(d => d.department));
    const toUnlock: DepartmentDefinition[] = [];

    for (const def of DEPARTMENT_DEFINITIONS) {
      if (!existingDepts.has(def.department) && isMaturitySufficient(maturityLevel, def.maturity_level_required)) {
        toUnlock.push(def);
      }
    }

    if (toUnlock.length === 0) return;

    try {
      const inserts = toUnlock.map(def => ({
        company_id: companyId,
        department: def.department,
        autopilot_enabled: false,
        maturity_level_required: def.maturity_level_required,
        allowed_actions: def.default_actions,
        guardrails: def.default_guardrails,
        auto_unlocked: true,
        auto_unlocked_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('company_department_config')
        .insert(inserts)
        .select();

      if (error) throw error;

      const unlockedNames = toUnlock.map(d => d.department);
      setNewlyUnlocked(unlockedNames);
      setDepartments(prev => [...prev, ...((data || []) as DepartmentConfig[])]);

      // Show toast for each newly unlocked department
      unlockedNames.forEach(dept => {
        toast({
          title: t('enterprise.department_unlocked', { department: t(`enterprise.departments.${dept}`) }),
          description: t('enterprise.department_unlocked_desc'),
        });
      });

      // Seed autopilot capabilities for newly unlocked departments
      await seedCapabilities(companyId, toUnlock);

      // Log unlock event in company_parameters
      await supabase.from('company_parameters').insert(
        unlockedNames.map(dept => ({
          company_id: companyId,
          category: 'strategy' as const,
          parameter_key: `department_unlocked_${dept}`,
          parameter_value: { unlocked_at: new Date().toISOString(), maturity_level: maturityLevel },
          is_current: true,
          version: 1,
        }))
      );
    } catch (err) {
      console.error('Error auto-unlocking departments:', err);
    }
  }, [companyId, maturityLevel, departments, loading, toast, t]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    if (!loading && companyId) {
      checkAndUnlock();
    }
  }, [maturityLevel, loading, companyId]);

  // Toggle autopilot for a department
  const toggleAutopilot = useCallback(async (department: DepartmentType, enabled: boolean) => {
    if (!companyId) return false;

    try {
      const { error } = await supabase
        .from('company_department_config')
        .update({ autopilot_enabled: enabled })
        .eq('company_id', companyId)
        .eq('department', department);

      if (error) throw error;

      setDepartments(prev =>
        prev.map(d => d.department === department ? { ...d, autopilot_enabled: enabled } : d)
      );
      return true;
    } catch (err) {
      console.error('Error toggling autopilot:', err);
      return false;
    }
  }, [companyId]);

  // Get config for a specific department
  const getDepartment = useCallback((dept: DepartmentType): DepartmentConfig | null => {
    return departments.find(d => d.department === dept) || null;
  }, [departments]);

  // Check if a department is unlocked (config exists)
  const isDepartmentUnlocked = useCallback((dept: DepartmentType): boolean => {
    return departments.some(d => d.department === dept);
  }, [departments]);

  // Get departments available at a specific maturity level
  const getAvailableDepartments = useCallback((): DepartmentDefinition[] => {
    return DEPARTMENT_DEFINITIONS.filter(def =>
      isMaturitySufficient(maturityLevel, def.maturity_level_required)
    );
  }, [maturityLevel]);

  // Get locked departments with progress info
  const getLockedDepartments = useCallback((): (DepartmentDefinition & { requiredLevel: MaturityLevel })[] => {
    return DEPARTMENT_DEFINITIONS
      .filter(def => !isMaturitySufficient(maturityLevel, def.maturity_level_required))
      .map(def => ({ ...def, requiredLevel: def.maturity_level_required }));
  }, [maturityLevel]);

  return {
    departments,
    loading,
    newlyUnlocked,
    toggleAutopilot,
    getDepartment,
    isDepartmentUnlocked,
    getAvailableDepartments,
    getLockedDepartments,
    refresh: loadDepartments,
  };
};
