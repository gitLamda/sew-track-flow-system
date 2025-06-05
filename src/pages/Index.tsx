
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WorkstationInterface from "@/components/WorkstationInterface";
import DataViewer from "@/components/DataViewer";
import { workstationTasks } from "@/data/workstationTasks";
import { exportDatabase, importDatabase } from "@/utils/dataStorage";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index: React.FC = () => {
  const [activeWorkstation, setActiveWorkstation] = useState<number>(1);
  
  // Get the workstation configuration for the active workstation
  const workstation = workstationTasks.find(ws => ws.stationNumber === activeWorkstation)!;

  // Handle database import
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        const success = await importDatabase(jsonData);
        
        if (success) {
          toast.success("Data imported successfully");
        }
      } catch (error) {
        console.error("Error reading file:", error);
        toast.error("Failed to read the import file");
      }
    };
    reader.readAsText(file);
    
    // Clear the input value so the same file can be selected again
    event.target.value = '';
  };

  return (
    <div className="container py-8 mx-auto min-h-screen">
      <div className="flex flex-col items-center mb-8 relative">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            ServiceTrack
          </h1>
          <p className="text-muted-foreground mt-1">
            Machine Service Management System
          </p>
        </div>
        
        <div className="flex mt-4 sm:mt-0 space-x-3 items-center">
          <ThemeToggle />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportDatabase}
            className="glass-card transition-all hover:shadow-md"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <div className="relative">
            <input
              type="file"
              id="import-file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".json"
              onChange={handleImport}
            />
            <Button 
              variant="outline" 
              size="sm"
              className="glass-card transition-all hover:shadow-md"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs 
        defaultValue="workstation" 
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 glass-card p-1">
          <TabsTrigger value="workstation" className="text-base">Workstation Interface</TabsTrigger>
          <TabsTrigger value="reports" className="text-base">Reports & Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workstation" className="space-y-6">
          {/* Workstation selector */}
          <Card className="glass-card card-highlight shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Select Workstation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {workstationTasks.map((ws) => (
                  <button
                    key={ws.stationNumber}
                    className={`py-3 px-4 rounded-lg text-center transition-all ${
                      activeWorkstation === ws.stationNumber
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-secondary hover:bg-secondary/80 hover:shadow"
                    }`}
                    onClick={() => setActiveWorkstation(ws.stationNumber)}
                  >
                    <span className="text-lg font-semibold">WS-{ws.stationNumber}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Active workstation interface */}
          <WorkstationInterface 
            workstation={workstation} 
            key={`ws-${workstation.stationNumber}`} 
          />
        </TabsContent>
        
        <TabsContent value="reports">
          <Card className="mb-6 glass-card card-highlight shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Data Management</CardTitle>
              <CardDescription>
                Export your data to keep a backup or import previous data to restore it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="secondary" 
                  onClick={exportDatabase}
                  className="transition-all hover:shadow-md"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    id="import-file-large"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".json"
                    onChange={handleImport}
                  />
                  <Button 
                    variant="secondary"
                    className="transition-all hover:shadow-md"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <DataViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
