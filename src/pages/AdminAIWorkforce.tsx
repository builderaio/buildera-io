import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AgentsLibrary } from "@/components/ai-workforce/admin/AgentsLibrary";
import { AgentEditor } from "@/components/ai-workforce/admin/AgentEditor";

const AdminAIWorkforce = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateNew = () => {
    setSelectedAgentId(null);
    setShowEditor(true);
  };

  const handleEditAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setShowEditor(true);
  };

  const handleAgentSaved = () => {
    setShowEditor(false);
    setSelectedAgentId(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="🤖 Taller de AI Workforce"
        subtitle="Gestión de agentes basados en el marco SFIA"
      />

      <div className="mb-6">
        <Button
          onClick={handleCreateNew}
          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear Nuevo Agente
        </Button>
      </div>

      {showEditor ? (
        <AgentEditor
          agentId={selectedAgentId}
          onSave={handleAgentSaved}
          onCancel={() => setShowEditor(false)}
        />
      ) : (
        <AgentsLibrary
          key={refreshKey}
          onEditAgent={handleEditAgent}
        />
      )}
    </AdminLayout>
  );
};

export default AdminAIWorkforce;
