
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WorkstationInterface from "@/components/WorkstationInterface";
import DataViewer from "@/components/DataViewer";
import { workstationTasks } from "@/data/workstationTasks";
import { toast } from "sonner";

const Index: React.FC = () => {
  const [activeWorkstation, setActiveWorkstation] = useState<number>(1);
  
  // Get the workstation configuration for the active workstation
  const workstation = workstationTasks.find(ws => ws.stationNumber === activeWorkstation)!;

  return (
    <div className="container py-6 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sewing Machine Service Tracking System</h1>
      
      <Tabs 
        defaultValue="workstation" 
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workstation">Workstation Interface</TabsTrigger>
          <TabsTrigger value="reports">Reports & Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workstation" className="space-y-6">
          {/* Workstation selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Select Workstation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {workstationTasks.map((ws) => (
                  <button
                    key={ws.stationNumber}
                    className={`py-2 px-4 rounded-md text-center transition-colors ${
                      activeWorkstation === ws.stationNumber
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                    onClick={() => setActiveWorkstation(ws.stationNumber)}
                  >
                    WS-{ws.stationNumber}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Active workstation interface */}
          <WorkstationInterface workstation={workstation} />
        </TabsContent>
        
        <TabsContent value="reports">
          <DataViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
