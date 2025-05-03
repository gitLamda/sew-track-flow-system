
import React, { useState } from "react";
import { format } from "date-fns";
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
import { cn } from "@/lib/utils";
import { getCompletedMachines } from "@/utils/dataStorage";
import { prepareMachineDataForExport } from "@/utils/excelExport";
import { CalendarIcon, Download } from "lucide-react";

const DataViewer: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [machines, setMachines] = useState<any[]>([]);
  
  // Fetch data based on date range
  const handleViewData = () => {
    if (date && endDate) {
      // Add one day to end date to include the entire day
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      
      const data = getCompletedMachines(date, adjustedEndDate);
      setMachines(data);
    }
  };
  
  // Export data to Excel
  const handleExport = () => {
    if (date && endDate && machines.length > 0) {
      // Add one day to end date to include the entire day
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      
      prepareMachineDataForExport(machines, date, adjustedEndDate);
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
          <CardTitle>Machine Service Data</CardTitle>
          <CardDescription>
            Select a date range to view and export machine service records
          </CardDescription>
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
                    className={cn("p-3 pointer-events-auto")}
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
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="self-end">
              <Button onClick={handleViewData}>View Data</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {machines.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left">Barcode ID</th>
                      <th className="h-10 px-4 text-left">Started</th>
                      <th className="h-10 px-4 text-left">Completed</th>
                      <th className="h-10 px-4 text-left">Total Duration</th>
                      <th className="h-10 px-4 text-left">Workstations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machines.map((machine) => (
                      <tr key={machine.barcodeId} className="border-b">
                        <td className="p-4">{machine.barcodeId}</td>
                        <td className="p-4">{format(new Date(machine.startTime), "PPp")}</td>
                        <td className="p-4">
                          {machine.endTime
                            ? format(new Date(machine.endTime), "PPp")
                            : "In progress"}
                        </td>
                        <td className="p-4">{formatDuration(machine.totalDuration)}</td>
                        <td className="p-4">{machine.records.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Click Export Excel for a detailed report
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default DataViewer;
