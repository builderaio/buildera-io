import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain } from "lucide-react";
import AIModelSelection from '@/components/admin/AIModelSelection';
import AIBusinessConfiguration from '@/components/admin/AIBusinessConfiguration';
import EraPromptConfiguration from '@/components/admin/EraPromptConfiguration';

export default function ConfiguracionIA() {
  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Brain className="h-5 h-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold">Configuración de IA</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Configura los modelos y parámetros de inteligencia artificial en dos pasos
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Modelos IA</CardTitle>
          <p className="text-sm text-muted-foreground">
            Primero selecciona qué modelos usar por proveedor, luego asígnalos a cada función de negocio
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="selection" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="selection">1. Selección de Modelos</TabsTrigger>
              <TabsTrigger value="business">2. Funciones de Negocio</TabsTrigger>
              <TabsTrigger value="prompts">3. Prompts de Era</TabsTrigger>
            </TabsList>
            
            <TabsContent value="selection" className="mt-6">
              <AIModelSelection />
            </TabsContent>
            
            <TabsContent value="business" className="mt-6">
              <AIBusinessConfiguration />
            </TabsContent>
            
            <TabsContent value="prompts" className="mt-6">
              <EraPromptConfiguration />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}