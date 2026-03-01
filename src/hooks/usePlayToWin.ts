import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  PlayToWinStrategy, 
  PTWReview,
  AspirationMetric,
  TargetMarket,
  TargetSegment,
  GeographicFocus,
  ChannelFocus,
  DifferentiationFactor,
  ValuePropositionCanvas,
  RequiredCapability,
  CapabilityMilestone,
  OKR,
  KPIDefinition,
  GovernanceModel,
  MoatType,
  ReviewCadence,
  PTWStatus
} from '@/types/playToWin';
import { Json } from '@/integrations/supabase/types';

// Helper to convert DB row to TypeScript type
const dbToStrategy = (row: any): PlayToWinStrategy => ({
  id: row.id,
  companyId: row.company_id,
  businessModel: row.business_model || null,
  winningAspiration: row.winning_aspiration || '',
  aspirationMetrics: (row.aspiration_metrics as AspirationMetric[]) || [],
  aspirationTimeline: row.aspiration_timeline || '3_years',
  currentSituation: row.current_situation || '',
  futurePositioning: row.future_positioning || '',
  targetMarkets: (row.target_markets as TargetMarket[]) || [],
  targetSegments: (row.target_segments as TargetSegment[]) || [],
  geographicFocus: (row.geographic_focus as GeographicFocus[]) || [],
  channelsFocus: (row.channels_focus as ChannelFocus[]) || [],
  desiredAudiencePositioning: row.desired_audience_positioning || '',
  competitiveAdvantage: row.competitive_advantage || '',
  differentiationFactors: (row.differentiation_factors as DifferentiationFactor[]) || [],
  valuePropositionCanvas: row.value_proposition_canvas as ValuePropositionCanvas | null,
  moatType: row.moat_type as MoatType | null,
  competitiveCategory: row.competitive_category || '',
  keyAssets: row.key_assets || '',
  requiredCapabilities: (row.required_capabilities as RequiredCapability[]) || [],
  capabilityRoadmap: (row.capability_roadmap as CapabilityMilestone[]) || [],
  reviewCadence: (row.review_cadence as ReviewCadence) || 'monthly',
  okrs: (row.okrs as OKR[]) || [],
  kpiDefinitions: (row.kpi_definitions as KPIDefinition[]) || [],
  governanceModel: row.governance_model as GovernanceModel | null,
  currentStep: row.current_step || 1,
  completionPercentage: row.completion_percentage || 0,
  lastReviewDate: row.last_review_date,
  nextReviewDate: row.next_review_date,
  status: row.status as PTWStatus || 'draft',
  generatedWithAI: row.generated_with_ai || false,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// Helper to convert TypeScript type to DB format
const strategyToDb = (strategy: Partial<PlayToWinStrategy>): Record<string, Json | string | number | boolean | null> => {
  const result: Record<string, Json | string | number | boolean | null> = {};
  
  if (strategy.businessModel !== undefined) result.business_model = strategy.businessModel;
  if (strategy.winningAspiration !== undefined) result.winning_aspiration = strategy.winningAspiration;
  if (strategy.aspirationMetrics !== undefined) result.aspiration_metrics = strategy.aspirationMetrics as unknown as Json;
  if (strategy.aspirationTimeline !== undefined) result.aspiration_timeline = strategy.aspirationTimeline;
  if (strategy.currentSituation !== undefined) result.current_situation = strategy.currentSituation;
  if (strategy.futurePositioning !== undefined) result.future_positioning = strategy.futurePositioning;
  if (strategy.targetMarkets !== undefined) result.target_markets = strategy.targetMarkets as unknown as Json;
  if (strategy.targetSegments !== undefined) result.target_segments = strategy.targetSegments as unknown as Json;
  if (strategy.geographicFocus !== undefined) result.geographic_focus = strategy.geographicFocus as unknown as Json;
  if (strategy.channelsFocus !== undefined) result.channels_focus = strategy.channelsFocus as unknown as Json;
  if (strategy.desiredAudiencePositioning !== undefined) result.desired_audience_positioning = strategy.desiredAudiencePositioning;
  if (strategy.competitiveAdvantage !== undefined) result.competitive_advantage = strategy.competitiveAdvantage;
  if (strategy.differentiationFactors !== undefined) result.differentiation_factors = strategy.differentiationFactors as unknown as Json;
  if (strategy.valuePropositionCanvas !== undefined) result.value_proposition_canvas = strategy.valuePropositionCanvas as unknown as Json;
  if (strategy.moatType !== undefined) result.moat_type = strategy.moatType;
  if (strategy.competitiveCategory !== undefined) result.competitive_category = strategy.competitiveCategory;
  if (strategy.keyAssets !== undefined) result.key_assets = strategy.keyAssets;
  if (strategy.requiredCapabilities !== undefined) result.required_capabilities = strategy.requiredCapabilities as unknown as Json;
  if (strategy.capabilityRoadmap !== undefined) result.capability_roadmap = strategy.capabilityRoadmap as unknown as Json;
  if (strategy.reviewCadence !== undefined) result.review_cadence = strategy.reviewCadence;
  if (strategy.okrs !== undefined) result.okrs = strategy.okrs as unknown as Json;
  if (strategy.kpiDefinitions !== undefined) result.kpi_definitions = strategy.kpiDefinitions as unknown as Json;
  if (strategy.governanceModel !== undefined) result.governance_model = strategy.governanceModel as unknown as Json;
  if (strategy.currentStep !== undefined) result.current_step = strategy.currentStep;
  if (strategy.completionPercentage !== undefined) result.completion_percentage = strategy.completionPercentage;
  if (strategy.lastReviewDate !== undefined) result.last_review_date = strategy.lastReviewDate;
  if (strategy.nextReviewDate !== undefined) result.next_review_date = strategy.nextReviewDate;
  if (strategy.status !== undefined) result.status = strategy.status;
  if (strategy.generatedWithAI !== undefined) result.generated_with_ai = strategy.generatedWithAI;
  
  return result;
};

// Calculate completion percentage based on filled fields
const calculateCompletion = (strategy: PlayToWinStrategy): number => {
  let totalPoints = 0;
  let earnedPoints = 0;
  
  // Step 1: Winning Aspiration (20 points)
  totalPoints += 20;
  if (strategy.winningAspiration && strategy.winningAspiration.length >= 50) earnedPoints += 10;
  if (strategy.aspirationMetrics.length > 0) earnedPoints += 5;
  if (strategy.aspirationTimeline) earnedPoints += 5;
  
  // Step 2: Where to Play (20 points)
  totalPoints += 20;
  if (strategy.targetMarkets.length > 0) earnedPoints += 5;
  if (strategy.targetSegments.length > 0) earnedPoints += 5;
  if (strategy.geographicFocus.length > 0) earnedPoints += 5;
  if (strategy.channelsFocus.length > 0) earnedPoints += 5;
  
  // Step 3: How to Win (20 points)
  totalPoints += 20;
  if (strategy.competitiveAdvantage && strategy.competitiveAdvantage.length >= 50) earnedPoints += 8;
  if (strategy.differentiationFactors.length > 0) earnedPoints += 4;
  if (strategy.moatType) earnedPoints += 4;
  if (strategy.valuePropositionCanvas) earnedPoints += 4;
  
  // Step 4: Capabilities (20 points)
  totalPoints += 20;
  if (strategy.requiredCapabilities.length > 0) earnedPoints += 10;
  if (strategy.capabilityRoadmap.length > 0) earnedPoints += 10;
  
  // Step 5: Management Systems (20 points)
  totalPoints += 20;
  if (strategy.reviewCadence) earnedPoints += 4;
  if (strategy.okrs.length > 0) earnedPoints += 6;
  if (strategy.kpiDefinitions.length > 0) earnedPoints += 6;
  if (strategy.governanceModel) earnedPoints += 4;
  
  return Math.round((earnedPoints / totalPoints) * 100);
};

export function usePlayToWin(companyId: string | undefined) {
  const [strategy, setStrategy] = useState<PlayToWinStrategy | null>(null);
  const [reviews, setReviews] = useState<PTWReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Keep a ref to always have the latest strategy (avoids stale closure in updateStrategy)
  const strategyRef = useRef<PlayToWinStrategy | null>(null);
  strategyRef.current = strategy;

  // Fetch strategy
  const fetchStrategy = useCallback(async () => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('company_play_to_win')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        const parsed = dbToStrategy(data);
        setStrategy(parsed);
        strategyRef.current = parsed;
      }
      // Note: intentionally do NOT set strategy=null when no data found.
      // This preserves optimistic local state if DB write is pending.
    } catch (err: any) {
      console.error('Error fetching PTW strategy:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    if (!companyId || !strategy?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('company_ptw_reviews')
        .select('*')
        .eq('ptw_id', strategy.id)
        .order('review_date', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;

      setReviews(data?.map(row => ({
        id: row.id,
        companyId: row.company_id,
        ptwId: row.ptw_id,
        reviewType: row.review_type as ReviewCadence | 'annual',
        reviewDate: row.review_date,
        metricsSnapshot: row.metrics_snapshot as Record<string, any> | null,
        okrProgressSnapshot: row.okr_progress_snapshot as Record<string, any> | null,
        wins: row.wins || [],
        challenges: row.challenges || [],
        learnings: row.learnings || [],
        adjustments: row.adjustments as Record<string, any> | null,
        decisionsMade: (row.decisions_made as any[]) || [],
        actionItems: (row.action_items as any[]) || [],
        reviewedBy: row.reviewed_by,
        createdAt: row.created_at
      })) || []);
    } catch (err: any) {
      console.error('Error fetching PTW reviews:', err);
    }
  }, [companyId, strategy?.id]);

  // Initialize strategy
  const initializeStrategy = useCallback(async () => {
    if (!companyId) return null;

    try {
      setIsSaving(true);

      const newStrategy = {
        company_id: companyId,
        winning_aspiration: '',
        aspiration_metrics: [],
        aspiration_timeline: '3_years',
        target_markets: [],
        target_segments: [],
        geographic_focus: [],
        channels_focus: [],
        competitive_advantage: '',
        differentiation_factors: [],
        value_proposition_canvas: null,
        moat_type: null,
        required_capabilities: [],
        capability_roadmap: [],
        review_cadence: 'monthly',
        okrs: [],
        kpi_definitions: [],
        governance_model: null,
        current_step: 1,
        completion_percentage: 0,
        status: 'draft'
      };

      const { data, error: insertError } = await supabase
        .from('company_play_to_win')
        .insert(newStrategy)
        .select()
        .single();

      if (insertError) throw insertError;

      const created = dbToStrategy(data);
      setStrategy(created);
      
      toast({
        title: "Estrategia iniciada",
        description: "Tu estrategia Play to Win ha sido creada"
      });

      return created;
    } catch (err: any) {
      console.error('Error initializing PTW strategy:', err);
      toast({
        title: "Error",
        description: "No se pudo crear la estrategia",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [companyId, toast]);

  // Update strategy
  const updateStrategy = useCallback(async (updates: Partial<PlayToWinStrategy>) => {
    const currentStrategy = strategyRef.current;
    if (!currentStrategy?.id) {
      console.warn('usePlayToWin: No strategy ID, attempting to initialize first');
      const created = await initializeStrategy();
      if (!created?.id) {
        // DB init failed — still update local state optimistically so UI reflects user input
        console.error('usePlayToWin: Initialization failed, preserving local state');
        const fallback = currentStrategy || ({} as PlayToWinStrategy);
        const optimistic = { ...fallback, ...updates, updatedAt: new Date().toISOString() };
        setStrategy(optimistic as PlayToWinStrategy);
        strategyRef.current = optimistic as PlayToWinStrategy;
        return false;
      }
      // Now update the newly created strategy
      try {
        setIsSaving(true);
        const updatedStrategy = { ...created, ...updates };
        const completion = calculateCompletion(updatedStrategy);
        let status: PTWStatus = updatedStrategy.status;
        if (completion === 100 && status !== 'complete') status = 'complete';
        else if (completion > 0 && status === 'draft') status = 'in_progress';

        const optimistic = { ...updatedStrategy, completionPercentage: completion, status, updatedAt: new Date().toISOString() };
        setStrategy(optimistic);
        strategyRef.current = optimistic;

        const dbUpdates = { ...strategyToDb(updates), completion_percentage: completion, status };
        const { error: updateError } = await supabase
          .from('company_play_to_win')
          .update(dbUpdates)
          .eq('id', created.id);
        if (updateError) console.warn('DB update after init failed:', updateError.message);
        return true;
      } catch (err: any) {
        console.error('Error updating PTW strategy after init:', err);
        return false;
      } finally {
        setIsSaving(false);
      }
    }

    try {
      setIsSaving(true);

      // Use currentStrategy from ref to avoid stale closure
      const updatedStrategy = { ...currentStrategy, ...updates };
      const completion = calculateCompletion(updatedStrategy);
      
      let status: PTWStatus = updatedStrategy.status;
      if (completion === 100 && status !== 'complete') {
        status = 'complete';
      } else if (completion > 0 && status === 'draft') {
        status = 'in_progress';
      }

      // Optimistic local update BEFORE DB write to prevent stale state
      const optimisticState = {
        ...updatedStrategy,
        completionPercentage: completion,
        status,
        updatedAt: new Date().toISOString()
      };
      setStrategy(optimisticState);
      strategyRef.current = optimisticState;

      const dbUpdates = {
        ...strategyToDb(updates),
        completion_percentage: completion,
        status
      };

      const { error: updateError } = await supabase
        .from('company_play_to_win')
        .update(dbUpdates)
        .eq('id', currentStrategy.id);

      if (updateError) {
        console.warn('DB update failed, local state preserved:', updateError.message);
      }

      return true;
    } catch (err: any) {
      console.error('Error updating PTW strategy:', err);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [toast, initializeStrategy]);

  // Update current step
  const setCurrentStep = useCallback(async (step: number) => {
    if (!strategy?.id || step < 1 || step > 5) return;

    await updateStrategy({ currentStep: step });
  }, [strategy?.id, updateStrategy]);

  // Create review
  const createReview = useCallback(async (reviewData: Partial<PTWReview>) => {
    if (!companyId || !strategy?.id) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('company_ptw_reviews')
        .insert({
          company_id: companyId,
          ptw_id: strategy.id,
          review_type: reviewData.reviewType || 'monthly',
          review_date: reviewData.reviewDate || new Date().toISOString().split('T')[0],
          metrics_snapshot: reviewData.metricsSnapshot as Json,
          okr_progress_snapshot: reviewData.okrProgressSnapshot as Json,
          wins: reviewData.wins || [],
          challenges: reviewData.challenges || [],
          learnings: reviewData.learnings || [],
          adjustments: reviewData.adjustments as Json,
          decisions_made: reviewData.decisionsMade as Json || [],
          action_items: reviewData.actionItems as Json || []
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update last review date
      await updateStrategy({
        lastReviewDate: data.review_date,
        status: 'reviewing'
      });

      await fetchReviews();
      
      toast({
        title: "Revisión creada",
        description: "La revisión estratégica ha sido registrada"
      });

      return data;
    } catch (err: any) {
      console.error('Error creating PTW review:', err);
      toast({
        title: "Error",
        description: "No se pudo crear la revisión",
        variant: "destructive"
      });
      return null;
    }
  }, [companyId, strategy?.id, updateStrategy, fetchReviews, toast]);

  // Effects
  useEffect(() => {
    fetchStrategy();
  }, [fetchStrategy]);

  useEffect(() => {
    if (strategy?.id) {
      fetchReviews();
    }
  }, [strategy?.id, fetchReviews]);

  return {
    strategy,
    reviews,
    isLoading,
    isSaving,
    error,
    initializeStrategy,
    updateStrategy,
    setCurrentStep,
    createReview,
    refetch: fetchStrategy
  };
}
