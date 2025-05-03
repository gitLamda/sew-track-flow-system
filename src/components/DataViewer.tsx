
import React, { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getCompletedMachines, getDatabase, MachineJourney, MachineRecord } from "@/utils/dataStorage";
import { prepareMachineDataForExport } from "@/utils/excelExport";
import { 
  CalendarIcon, 
  Download,
  FileSpreadsheet, 
  RefreshCcw, 
  Search, 
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ProcessedMachineRecord {
  barcodeId: string;
  startTime: string;
  endTime: string | null;
  records: MachineRecord[];
  totalDuration: number | null;
  completedWorkstations: number[];
  currentWorkstation: number | null;
}

const DataViewer: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(subDays(new Date(), 7)); // Default to 7 days ago
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [machines, setMachines] = useState<ProcessedMachineRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  
  // Load database summary on component mount
  useEffect(() => {
    const db = getDatabase();
    setTotalEntries(Object.keys(db.machines).length);
  }, []);
  
  // Fetch data based on date range
  const handleViewData = () => {
    if (!date || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Add one day to end date to include the entire day
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      
      const data = getCompletedMachines(date, adjustedEndDate);
      
      // Process data to ensure all required properties exist
      const processedData = data.map(machine => ({
        ...machine,
        completedWorkstations: machine.completedWorkstations || [],
        currentWorkstation: machine.currentWorkstation,
      }));
      
      setMachines(processedData);
      setSelectedMachine(null);
      
      if (processedData.length === 0) {
        toast.info("No completed machines found in the selected date range");
      } else {
        toast.success(`Found ${processedData.length} machines`);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data. Please try again");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Export data to Excel
  const handleExport = () => {
    if (!date || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    
    if (machines.length === 0) {
      toast.error("No data to export. Please search for machines first");
      return;
    }
    
    try {
      // Add one day to end date to include the entire day
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      
      // Convert ProcessedMachineRecord[] back to MachineJourney[] for export
      const machineJourneys = machines.map(machine => ({
        barcodeId: machine.barcodeId,
        currentWorkstation: machine.currentWorkstation,
        completedWorkstations: machine.completedWorkstations,
        records: machine.records,
        startTime: machine.startTime,
        endTime: machine.endTime
      }));
      
      prepareMachineDataForExport(machineJourneys, date, adjustedEndDate);
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data. Please try again");
    }
  };
  
  // Format the duration
  const formatDuration = (durationMs: number | null): string => {
    if (durationMs === null) return "N/A";
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Handle machine selection for detailed view
  const handleSelectMachine = (barcodeId: string) => {
    setSelectedMachine(selectedMachine === barcodeId ? null : barcodeId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Machine Service Reports</CardTitle>
              <CardDescription>
                Select a date range to view and export machine service records
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Total database entries: {totalEntries}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Start Date</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">End Date</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="p-3"
                    disabled={(date) => {
                      // Disable dates before the start date
                      return date && date && date < date;
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="self-end space-x-2">
              <Button onClick={handleViewData} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    View Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {machines.length > 0 && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Machine Records</CardTitle>
              <CardDescription>
                {machines.length} machines between {format(date!, "PP")} and {format(endDate!, "PP")}
              </CardDescription>
            </div>
            <Button onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]"></TableHead>
                      <TableHead>Barcode ID</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Workstations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machines.map((machine) => (
                      <React.Fragment key={machine.barcodeId}>
                        <TableRow 
                          className={cn(selectedMachine === machine.barcodeId && "bg-muted/50")}
                          onClick={() => handleSelectMachine(machine.barcodeId)}
                        >
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View details</span>
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">{machine.barcodeId}</TableCell>
                          <TableCell>{format(new Date(machine.startTime), "MMM d, HH:mm")}</TableCell>
                          <TableCell>
                            {machine.endTime ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200">
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200">
                                In Progress - WS {machine.currentWorkstation}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDuration(machine.totalDuration)}</TableCell>
                          <TableCell>{machine.completedWorkstations.length} / 6</TableCell>
                        </TableRow>
                        
                        {/* Detailed view when selected */}
                        {selectedMachine === machine.barcodeId && (
                          <TableRow>
                            <TableCell colSpan={6} className="p-0">
                              <div className="bg-muted/30 p-4 space-y-4">
                                <h4 className="font-medium text-lg">Machine Journey Details</h4>
                                
                                <div className="rounded-md border overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Workstation</TableHead>
                                        <TableHead>Operator</TableHead>
                                        <TableHead>Check-in Time</TableHead>
                                        <TableHead>Check-out Time</TableHead>
                                        <TableHead>Tasks</TableHead>
                                        <TableHead>Wait Time</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {machine.records.map((record, index) => (
                                        <TableRow key={index}>
                                          <TableCell>
                                            <Badge variant={machine.completedWorkstations.includes(record.workstation) ? "default" : "outline"}>
                                              WS-{record.workstation}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <div>{record.operator.name}</div>
                                            <div className="text-xs text-muted-foreground">EPF: {record.operator.epf}</div>
                                          </TableCell>
                                          <TableCell>{format(new Date(record.checkinTime), "MMM d, HH:mm")}</TableCell>
                                          <TableCell>
                                            {record.checkoutTime 
                                              ? format(new Date(record.checkoutTime), "MMM d, HH:mm") 
                                              : "In progress"}
                                          </TableCell>
                                          <TableCell>
                                            {record.tasksCompleted.length} / {record.totalTasks}
                                            <div className="text-xs text-muted-foreground">
                                              {Math.round((record.tasksCompleted.length / (record.totalTasks || 1)) * 100)}% complete
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            {record.waitTime
                                              ? `${Math.round(record.waitTime / (1000 * 60))} mins`
                                              : "No wait"}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                
                                {machine.records.length === 0 && (
                                  <div className="text-center p-4 text-muted-foreground">
                                    No detailed records available for this machine
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground flex justify-between items-center">
            <span>Click on a row to view detailed journey information</span>
            <div className="text-xs">
              Last updated: {format(new Date(), "PPp")}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default DataViewer;
