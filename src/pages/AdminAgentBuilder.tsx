import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Bot, Wand2 } from "lucide-react";
import { AgentBuilderWizard } from "@/components/admin/AgentBuilderWizard";
import { UnifiedAgentsLibrary } from "@/components/admin/UnifiedAgentsLibrary";

const AdminAgentBuilder = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateNew = () => {
    setSelectedAgentId(null);
    setShowWizard(true);
  };

  const handleEditAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setShowWizard(true);
  };

  const handleAgentSaved = () => {
    setShowWizard(false);
    setSelectedAgentId(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="🤖 Constructor de Agentes IA"
        subtitle="Crea y gestiona agentes estáticos, dinámicos e híbridos"
      />

      <div className="mb-6 flex gap-3">
        <Button
          onClick={handleCreateNew}
          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear Nuevo Agente
        </Button>
      </div>

      {showWizard ? (
        <AgentBuilderWizard
          agentId={selectedAgentId}
          onSave={handleAgentSaved}
          onCancel={() => setShowWizard(false)}
        />
      ) : (
        <UnifiedAgentsLibrary
          key={refreshKey}
          onEditAgent={handleEditAgent}
        />
      )}
    </AdminLayout>
  );
};

export default AdminAgentBuilder;
