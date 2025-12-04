// ============================================================
// DEPRECATED: Este componente usa la arquitectura legacy de agentes
// La nueva arquitectura usa platform_agents y AgentMarketplaceV2
// Este componente se mantiene por compatibilidad pero redirige al nuevo
// ============================================================

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentMarketplaceV2 from '@/pages/AgentMarketplaceV2';

/**
 * @deprecated Use AgentMarketplaceV2 instead
 * This component is kept for backwards compatibility but now renders AgentMarketplaceV2
 */
const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Optionally redirect to the new marketplace URL
    // navigate('/marketplace/agents', { replace: true });
  }, [navigate]);
  
  // Render the new marketplace component directly
  return <AgentMarketplaceV2 />;
};

export default Marketplace;
