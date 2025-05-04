import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BarcodeScanner from "./BarcodeScanner";
import TaskChecklist from "./TaskChecklist";
import QueueDisplay from "./QueueDisplay";
import { WorkstationConfig } from "@/data/workstationTasks";
import { 
  checkInMachine, 
  checkOutMachine, 
  getQueueForWorkstation, 
  getMachineJourney,
  deleteMachine
} from "@/utils/dataStorage";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Info, Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WorkstationInterfaceProps {
  workstation: WorkstationConfig;
}

const WorkstationInterface: React.FC<WorkstationInterfaceProps> = ({ workstation }) => {
  const [activeMachine, setActiveMachine] = useState<string | null>(null);
  const [operatorName, setOperatorName] = useState<string>("");
  const [operatorEPF, setOperatorEPF] = useState<string>("");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [machineToDelete, setMachineToDelete] = useState<string | null>(null);
  
  // Force update queue when refresh is needed
  const refreshQueue = () => {
    const queueData = getQueueForWorkstation(workstation.stationNumber);
    setQueue(queueData);
  };

  // Load queue data on mount and when queue changes
  useEffect(() => {
    refreshQueue();
    
    // Refresh queue every 30 seconds
    const intervalId = setInterval(refreshQueue, 30000);
    
    return () => clearInterval(intervalId);
  }, [workstation.stationNumber, activeMachine]);
  
  // Load operator info from localStorage if available
  useEffect(() => {
    const savedOperator = localStorage.getItem('operatorInfo');
    if (savedOperator) {
      try {
        const { name, epf } = JSON.parse(savedOperator);
        setOperatorName(name || '');
        setOperatorEPF(epf || '');
      } catch (e) {
        console.error('Error loading operator info:', e);
      }
    }
  }, []);
  
  // Save operator info when it changes
  useEffect(() => {
    if (operatorName && operatorEPF) {
      localStorage.setItem('operatorInfo', JSON.stringify({ name: operatorName, epf: operatorEPF }));
    }
  }, [operatorName, operatorEPF]);
  
  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    if (isProcessing) return;
    
    if (!operatorName || !operatorEPF) {
      toast.error("Please enter your name and EPF number");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Check if the machine has completed previous workstations if not the first one
      if (workstation.stationNumber > 1) {
        const machineJourney = getMachineJourney(barcode);
        
        if (!machineJourney) {
          toast.error(`Machine ${barcode} has not been registered in the system`);
          setIsProcessing(false);
          return;
        }
        
        const previousStation = workstation.stationNumber - 1;
        if (!machineJourney.completedWorkstations.includes(previousStation)) {
          toast.error(`Machine ${barcode} has not completed Workstation ${previousStation}`);
          setIsProcessing(false);
          return;
        }
      }
      
      // Check if this machine is already in this workstation
      const existingQueueItem = queue.find(item => item.barcodeId === barcode);
      if (existingQueueItem) {
        if (!activeMachine) {
          setActiveMachine(barcode);
          setCompletedTasks([]);
        } else {
          toast.info(`Machine ${barcode} is already in the queue`);
        }
        setShowScanner(false);
        setIsProcessing(false);
        return;
      }
      
      // Check in the machine
      const { isNew, waitTime } = checkInMachine(
        barcode,
        workstation.stationNumber,
        { name: operatorName, epf: operatorEPF }
      );
      
      if (isNew || waitTime === null) {
        toast.success(`Machine ${barcode} checked in to Workstation ${workstation.stationNumber}`);
      } else {
        const waitMinutes = Math.floor(waitTime / (1000 * 60));
        toast.info(`Machine ${barcode} is in queue. Estimated wait: ${waitMinutes} minutes`);
      }
      
      // If no machine is active, set this one as active
      if (!activeMachine) {
        setActiveMachine(barcode);
        setCompletedTasks([]);
      }
      
      // Update the queue
      refreshQueue();
      setShowScanner(false);
    } catch (error) {
      console.error("Error checking in machine:", error);
      toast.error("Failed to check in machine. Please try again");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle switching to a different machine in the queue
  const handleSwitchMachine = (barcodeId: string) => {
    if (isProcessing) return;
    
    if (activeMachine === barcodeId) return;
    
    // Save the current progress if needed
    // For now we're just switching machines without saving partial progress
    
    setActiveMachine(barcodeId);
    setCompletedTasks([]);
    toast.info(`Switched to machine ${barcodeId}`);
  };
  
  // Handle task completion
  const handleTasksCompleted = (taskIds: string[]) => {
    setCompletedTasks(taskIds);
  };
  
  // Handle machine completion
  const handleCompleteMachine = () => {
    if (!activeMachine) return;
    
    setIsProcessing(true);
    
    try {
      // Check out the machine
      const success = checkOutMachine(
        activeMachine,
        workstation.stationNumber,
        completedTasks,
        workstation.tasks.length
      );
      
      if (success) {
        toast.success(`Machine ${activeMachine} completed in Workstation ${workstation.stationNumber}`);
        
        if (workstation.stationNumber === 6) {
          toast.success("Machine service process completed! Data saved to report.");
        } else {
          toast.info(`Machine ${activeMachine} ready for Workstation ${workstation.stationNumber + 1}`);
        }
        
        // Find the next machine in queue if any
        refreshQueue();
        
        // Set the next machine in queue as active if available
        const nextMachine = queue.find(item => item.barcodeId !== activeMachine);
        if (nextMachine) {
          setActiveMachine(nextMachine.barcodeId);
          setCompletedTasks([]);
          toast.info(`Next machine ${nextMachine.barcodeId} is now active`);
        } else {
          setActiveMachine(null);
          setCompletedTasks([]);
        }
      }
    } catch (error) {
      console.error("Error completing machine:", error);
      toast.error("Failed to complete machine. Please try again");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete machine
  const handleDeleteMachine = () => {
    if (!machineToDelete) return;
    
    const success = deleteMachine(machineToDelete);
    
    if (success) {
      // If the deleted machine was active, clear it
      if (activeMachine === machineToDelete) {
        setActiveMachine(null);
        setCompletedTasks([]);
      }
      
      // Update the queue
      refreshQueue();
    }
    
    setMachineToDelete(null);
  };

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">
                Workstation {workstation.stationNumber}
              </CardTitle>
              <CardDescription>{workstation.stationName}</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg font-medium">
              {queue.length > 0 
                ? `${activeMachine ? "Active" : "Ready"} (${queue.length} in queue)`
                : (activeMachine ? "Active" : "Ready")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Operator information section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium" htmlFor="operatorName">
                Operator Name
              </label>
              <Input
                id="operatorName"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Enter your name"
                disabled={isProcessing}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="operatorEPF">
                EPF Number
              </label>
              <Input
                id="operatorEPF"
                value={operatorEPF}
                onChange={(e) => setOperatorEPF(e.target.value)}
                placeholder="Enter your EPF number"
                disabled={isProcessing}
              />
            </div>
          </div>
          
          {/* Scanner toggle section */}
          {!showScanner ? (
            <div className="flex gap-2">
              <Button 
                className="w-full"
                variant="outline" 
                onClick={() => setShowScanner(true)}
                disabled={isProcessing || !operatorName || !operatorEPF}
              >
                <Plus className="mr-2 h-4 w-4" />
                Scan New Machine
              </Button>
            </div>
          ) : (
            <BarcodeScanner 
              onScan={handleBarcodeScan} 
              onCancel={() => setShowScanner(false)}
              disabled={isProcessing || !operatorName || !operatorEPF}
            />
          )}
          
          {/* Active machine information */}
          {activeMachine && (
            <div className="bg-primary/10 p-4 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Active Machine
                </div>
                <div className="text-xl font-bold">{activeMachine}</div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setMachineToDelete(activeMachine)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Machine</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete machine {machineToDelete}? 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setMachineToDelete(null)}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteMachine}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          
          {/* Tabs for Tasks and Queue */}
          <Tabs defaultValue={activeMachine ? "tasks" : "queue"}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks" disabled={!activeMachine}>Tasks</TabsTrigger>
              <TabsTrigger value="queue">Queue ({queue.length})</TabsTrigger>
            </TabsList>
            {activeMachine && (
              <TabsContent value="tasks" className="space-y-4 pt-4">
                <TaskChecklist 
                  tasks={workstation.tasks} 
                  onTasksCompleted={handleTasksCompleted}
                />
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleCompleteMachine} 
                    disabled={isProcessing || completedTasks.length === 0}
                    className="w-full sm:w-auto"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Complete & Send to Next Station
                  </Button>
                </div>
              </TabsContent>
            )}
            <TabsContent value="queue">
              <QueueDisplay 
                queue={queue} 
                currentBarcodeId={activeMachine}
                onSelectMachine={handleSwitchMachine}
                onDeleteMachine={(barcodeId) => setMachineToDelete(barcodeId)}
                onQueueUpdate={refreshQueue}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        
        {/* Information messages */}
        <CardFooter className="border-t bg-secondary/50">
          {!operatorName || !operatorEPF ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                Please enter your name and EPF number before scanning a machine
              </div>
            </div>
          ) : !activeMachine ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                {queue.length > 0 
                  ? `${queue.length} machine(s) in queue. Select a machine or scan a new one.`
                  : "No machines in queue. Scan a machine barcode to begin processing."}
              </div>
            </div>
          ) : completedTasks.length === 0 ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                Complete at least one task before sending the machine to the next station
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                {completedTasks.length} of {workstation.tasks.length} tasks completed. 
                Click "Complete" when ready.
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Alert dialog for confirming machine deletion */}
      <AlertDialog open={!!machineToDelete} onOpenChange={(open) => !open && setMachineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Machine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete machine {machineToDelete}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMachineToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMachine}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkstationInterface;
