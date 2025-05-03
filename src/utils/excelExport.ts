
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
    
    // Calculate the percentage of total process completion
    const completionPercentage = (machine.completedWorkstations.length / 6) * 100;
    
    return {
      "Barcode ID": machine.barcodeId,
      "Start Time": formatDate(machine.startTime),
      "End Time": machine.endTime ? formatDate(machine.endTime) : "In progress",
      "Total Duration": machine.endTime 
        ? calculateDuration(machine.startTime, machine.endTime) 
        : "In progress",
      "Total Wait Time": formattedTotalWaitTime,
      "Completed Workstations": machine.completedWorkstations.length,
      "Progress": `${Math.round(completionPercentage)}%`,
      "Current Workstation": machine.currentWorkstation || "Completed",
      "Status": machine.endTime ? "Completed" : "In Progress"
    };
  });
};

// Create a detailed worksheet with all records
const createDetailedSheet = (machines: MachineJourney[]): any[] => {
  const allRecords: any[] = [];
  
  machines.forEach((machine) => {
    machine.records.forEach((record) => {
      const duration = record.checkoutTime 
        ? calculateDuration(record.checkinTime, record.checkoutTime)
        : "In progress";
        
      const processingTime = record.checkoutTime
        ? (new Date(record.checkoutTime).getTime() - new Date(record.checkinTime).getTime())
        : null;
        
      const waitTimeFormatted = formatWaitTime(record.waitTime);
        
      allRecords.push({
        "Barcode ID": machine.barcodeId,
        "Workstation": record.workstation,
        "Operator Name": record.operator.name,
        "Operator EPF": record.operator.epf,
        "Check-in Time": formatDate(record.checkinTime),
        "Check-out Time": record.checkoutTime ? formatDate(record.checkoutTime) : "In progress",
        "Duration": duration,
        "Processing Time (mins)": processingTime ? Math.round(processingTime / (1000 * 60)) : "N/A",
        "Wait Time": waitTimeFormatted,
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
      } else if (record.checkoutTime) {
        // Include records where no tasks were completed but the machine was processed
        taskRecords.push({
          "Barcode ID": machine.barcodeId,
          "Workstation": record.workstation,
          "Operator": `${record.operator.name} (${record.operator.epf})`,
          "Task ID": "None completed",
          "Completed On": formatDate(record.checkoutTime),
          "Note": "Machine processed with no tasks marked as complete",
        });
      }
    });
  });
  
  return taskRecords;
};

// Create a workstation journey sheet that tracks machine flow
const createWorkstationJourneySheet = (machines: MachineJourney[]): any[] => {
  const journeyRecords: any[] = [];
  
  machines.forEach((machine) => {
    // Sort records by workstation number to show the flow
    const sortedRecords = [...machine.records].sort((a, b) => a.workstation - b.workstation);
    
    // Create a record of the machine's path through workstations
    const workstationPath = sortedRecords.map(record => {
      const checkInDate = new Date(record.checkinTime);
      const checkoutDate = record.checkoutTime ? new Date(record.checkoutTime) : null;
      
      return {
        "Barcode ID": machine.barcodeId,
        "Journey Step": `Workstation ${record.workstation}`,
        "Date": checkInDate.toLocaleDateString(),
        "Check-in Time": checkInDate.toLocaleTimeString(),
        "Check-out Time": checkoutDate ? checkoutDate.toLocaleTimeString() : "In progress",
        "Duration": checkoutDate 
          ? `${Math.round((checkoutDate.getTime() - checkInDate.getTime()) / (1000 * 60))} mins` 
          : "In progress",
        "Operator": record.operator.name,
        "Tasks Done": `${record.tasksCompleted.length} of ${record.totalTasks}`,
        "Status": record.checkoutTime ? "Completed" : "In Progress"
      };
    });
    
    journeyRecords.push(...workstationPath);
    
    // Add the final status of the machine
    journeyRecords.push({
      "Barcode ID": machine.barcodeId,
      "Journey Step": "Final Status",
      "Date": machine.endTime ? new Date(machine.endTime).toLocaleDateString() : new Date().toLocaleDateString(),
      "Check-in Time": "-",
      "Check-out Time": machine.endTime ? new Date(machine.endTime).toLocaleTimeString() : "-",
      "Duration": "Total: " + (machine.endTime 
        ? `${Math.round((new Date(machine.endTime).getTime() - new Date(machine.startTime).getTime()) / (1000 * 60))} mins`
        : "In progress"),
      "Operator": "-",
      "Tasks Done": `${machine.completedWorkstations.length} of 6 workstations`,
      "Status": machine.endTime ? "Process Complete" : `At Workstation ${machine.currentWorkstation || '?'}`
    });
  });
  
  return journeyRecords;
};

// Export data to Excel file
export const exportToExcel = (machines: MachineJourney[], dateRange: string): void => {
  try {
    // Create various data sheets
    const summaryData = createSummarySheet(machines);
    const detailedData = createDetailedSheet(machines);
    const tasksData = createTasksSheet(machines);
    const journeyData = createWorkstationJourneySheet(machines);
    
    // Create a new workbook and add the sheets
    const wb = XLSX.utils.book_new();
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
    
    const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(wb, detailedSheet, "Detailed Records");
    
    const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
    XLSX.utils.book_append_sheet(wb, tasksSheet, "Task Completion");
    
    const journeySheet = XLSX.utils.json_to_sheet(journeyData);
    XLSX.utils.book_append_sheet(wb, journeySheet, "Machine Journey");
    
    // Add column widths to make the sheets more readable
    const columnWidths = [
      { wch: 15 }, // Barcode ID
      { wch: 20 }, // Dates and times
      { wch: 20 }, // Other fields
      { wch: 15 }, // Durations
      { wch: 15 }, // Workstations
      { wch: 15 }, // Operators
    ];
    
    [summarySheet, detailedSheet, tasksSheet, journeySheet].forEach(sheet => {
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
