
import * as XLSX from 'xlsx';
import { MachineJourney, MachineRecord } from './dataStorage';
import { toast } from 'sonner';

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

// Calculate duration between two timestamps
const calculateDuration = (start: string, end: string | null): string => {
  if (!end) return "In progress";
  
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const durationMs = endTime - startTime;
  
  // Convert to hours, minutes, seconds
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
  
  return `${hours}h ${minutes}m ${seconds}s`;
};

// Format wait time
const formatWaitTime = (waitTimeMs: number | null): string => {
  if (waitTimeMs === null) return "No wait";
  
  const minutes = Math.floor(waitTimeMs / (1000 * 60));
  
  return `${minutes} minutes`;
};

// Create a summary sheet for all machines
const createSummarySheet = (machines: MachineJourney[]): any[] => {
  return machines.map((machine) => {
    // Calculate the total waiting time across all workstations
    const totalWaitTime = machine.records.reduce((total, record) => {
      return total + (record.waitTime || 0);
    }, 0);
    
    // Format the total wait time
    const formattedTotalWaitTime = totalWaitTime > 0 
      ? `${Math.floor(totalWaitTime / (1000 * 60))} minutes` 
      : "No wait";
    
    return {
      "Barcode ID": machine.barcodeId,
      "Start Time": formatDate(machine.startTime),
      "End Time": machine.endTime ? formatDate(machine.endTime) : "In progress",
      "Total Duration": machine.endTime 
        ? calculateDuration(machine.startTime, machine.endTime) 
        : "In progress",
      "Total Wait Time": formattedTotalWaitTime,
      "Completed Workstations": machine.completedWorkstations.length,
      "Current Workstation": machine.currentWorkstation || "Completed",
      "Status": machine.endTime ? "Completed" : "In Progress"
    };
  });
};

// Create a detailed sheet with all records
const createDetailedSheet = (machines: MachineJourney[]): any[] => {
  const allRecords: any[] = [];
  
  machines.forEach((machine) => {
    machine.records.forEach((record) => {
      allRecords.push({
        "Barcode ID": machine.barcodeId,
        "Workstation": record.workstation,
        "Operator Name": record.operator.name,
        "Operator EPF": record.operator.epf,
        "Check-in Time": formatDate(record.checkinTime),
        "Check-out Time": record.checkoutTime ? formatDate(record.checkoutTime) : "In progress",
        "Duration": record.checkoutTime 
          ? calculateDuration(record.checkinTime, record.checkoutTime) 
          : "In progress",
        "Wait Time": formatWaitTime(record.waitTime),
        "Tasks Completed": record.tasksCompleted.length,
        "Total Tasks": record.totalTasks,
        "Completion Rate": record.totalTasks > 0 
          ? `${Math.round((record.tasksCompleted.length / record.totalTasks) * 100)}%` 
          : "N/A",
      });
    });
  });
  
  return allRecords;
};

// Create a tasks sheet with task completion details
const createTasksSheet = (machines: MachineJourney[]): any[] => {
  const taskRecords: any[] = [];
  
  machines.forEach((machine) => {
    machine.records.forEach((record) => {
      if (record.tasksCompleted.length > 0) {
        record.tasksCompleted.forEach((taskId) => {
          taskRecords.push({
            "Barcode ID": machine.barcodeId,
            "Workstation": record.workstation,
            "Operator": `${record.operator.name} (${record.operator.epf})`,
            "Task ID": taskId,
            "Completed On": record.checkoutTime ? formatDate(record.checkoutTime) : "In progress",
          });
        });
      }
    });
  });
  
  return taskRecords;
};

// Export data to Excel file
export const exportToExcel = (machines: MachineJourney[], dateRange: string): void => {
  try {
    // Create summary and detailed sheets
    const summaryData = createSummarySheet(machines);
    const detailedData = createDetailedSheet(machines);
    const tasksData = createTasksSheet(machines);
    
    // Create a new workbook and add the sheets
    const wb = XLSX.utils.book_new();
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
    
    const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(wb, detailedSheet, "Detailed Records");
    
    const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
    XLSX.utils.book_append_sheet(wb, tasksSheet, "Task Completion");
    
    // Add column widths to make the sheets more readable
    const columnWidths = [
      { wch: 15 }, // Barcode ID
      { wch: 20 }, // Dates
      { wch: 20 }, // Times
      { wch: 15 }, // Duration
      { wch: 15 }, // Other fields
    ];
    
    [summarySheet, detailedSheet, tasksSheet].forEach(sheet => {
      sheet['!cols'] = columnWidths;
    });
    
    // Generate filename with current date
    const fileName = `Machine_Service_Report_${dateRange}.xlsx`;
    
    // Write to file and download
    XLSX.writeFile(wb, fileName);
    toast.success(`Excel file exported: ${fileName}`);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    toast.error("Failed to export Excel file. Check console for details.");
  }
};

// Convert machine data for download
export const prepareMachineDataForExport = (
  machines: MachineJourney[], 
  startDate: Date, 
  endDate: Date
): void => {
  const formattedStartDate = startDate.toLocaleDateString().replace(/\//g, '-');
  const formattedEndDate = endDate.toLocaleDateString().replace(/\//g, '-');
  const dateRange = `${formattedStartDate}_to_${formattedEndDate}`;
  
  exportToExcel(machines, dateRange);
};
