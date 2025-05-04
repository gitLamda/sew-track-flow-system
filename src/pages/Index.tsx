
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WorkstationInterface from "@/components/WorkstationInterface";
import DataViewer from "@/components/DataViewer";
import { workstationTasks } from "@/data/workstationTasks";
import { exportDatabase, importDatabase, setupRealtimeSubscription } from "@/utils/dataStorage";
import { toast } from "sonner";
import { Database, RefreshCw, Download, Upload } from "lucide-react";

const Index: React.FC = () => {
  const [activeWorkstation, setActiveWorkstation] = useState<number>(1);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Set up realtime subscription
  useEffect(() => {
    const unsubscribe = setupRealtimeSubscription();
    
    // Listen for database update events
    const handleDbUpdate = () => {
      setLastRefresh(new Date());
    };
    document.addEventListener('dbUpdate', handleDbUpdate);
    
    // Refresh every 30 seconds
    const intervalId = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);
    
    // Cleanup
    return () => {
      unsubscribe();
      clearInterval(intervalId);
      document.removeEventListener('dbUpdate', handleDbUpdate);
    };
  }, []);
  
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
          // Refresh the page to load the imported data
          setLastRefresh(new Date());
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

  // Manual refresh function
  const handleManualRefresh = () => {
    setLastRefresh(new Date());
    toast.success("Data refreshed from storage");
  };

  return (
    <div className="container py-6 mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold">Sewing Machine Service Tracking System</h1>
        
        <div className="flex mt-2 sm:mt-0 space-x-2">
          <Button variant="outline" size="sm" onClick={handleManualRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm" onClick={exportDatabase}>
            <Download className="h-4 w-4 mr-2" />
            Backup Data
          </Button>
          <div className="relative">
            <input
              type="file"
              id="import-file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".json"
              onChange={handleImport}
            />
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Restore Data
            </Button>
          </div>
        </div>
      </div>
      
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
          <WorkstationInterface 
            workstation={workstation} 
            key={`ws-${workstation.stationNumber}-${lastRefresh.getTime()}`} 
          />
        </TabsContent>
        
        <TabsContent value="reports">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export your data to keep a backup or import previous data to restore it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="secondary" onClick={handleManualRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
                <Button variant="secondary" onClick={exportDatabase}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data Backup
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    id="import-file-large"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".json"
                    onChange={handleImport}
                  />
                  <Button variant="secondary">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data from Backup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <DataViewer key={`data-viewer-${lastRefresh.getTime()}`} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
