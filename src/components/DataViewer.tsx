
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
import { getCompletedMachines, getDatabase, MachineJourney } from "@/utils/dataStorage";
import { prepareMachineDataForExport } from "@/utils/excelExport";
import { 
  CalendarIcon, 
  Download,
  FileSpreadsheet, 
  RefreshCcw, 
  Search, 
  Sliders 
} from "lucide-react";
import { toast } from "sonner";

const DataViewer: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(subDays(new Date(), 7)); // Default to 7 days ago
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [machines, setMachines] = useState<MachineJourney[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  
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
      setMachines(data);
      
      if (data.length === 0) {
        toast.info("No completed machines found in the selected date range");
      } else {
        toast.success(`Found ${data.length} completed machines`);
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
      
      prepareMachineDataForExport(machines, date, adjustedEndDate);
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
                {machines.length} machines completed between {format(date!, "PP")} and {format(endDate!, "PP")}
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
                      <TableHead>Barcode ID</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Workstations</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machines.map((machine) => (
                      <TableRow key={machine.barcodeId}>
                        <TableCell className="font-medium">{machine.barcodeId}</TableCell>
                        <TableCell>{format(new Date(machine.startTime), "PPp")}</TableCell>
                        <TableCell>
                          {machine.endTime
                            ? format(new Date(machine.endTime), "PPp")
                            : "In progress"}
                        </TableCell>
                        <TableCell>{formatDuration(machine.totalDuration)}</TableCell>
                        <TableCell>{machine.completedWorkstations.length} / 6</TableCell>
                        <TableCell>
                          {machine.endTime ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
                              In Progress
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground flex justify-between items-center">
            <span>Click Export Excel for a detailed report with operator and task information</span>
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
