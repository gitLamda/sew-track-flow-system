import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types for machine data
export interface MachineRecord {
  barcodeId: string;
  operator: {
    name: string;
    epf: string;
  };
  workstation: number;
  checkinTime: string;
  checkoutTime: string | null;
  waitTime: number | null; // in milliseconds
  tasksCompleted: string[];
  totalTasks: number;
}

export interface MachineJourney {
  barcodeId: string;
  currentWorkstation: number | null;
  completedWorkstations: number[];
  records: MachineRecord[];
  startTime: string;
  endTime: string | null;
}

// Initialize the database structure
interface Database {
  machines: Record<string, MachineJourney>;
  lastUpdated: string;
}

// Fetch all machine data from Supabase
export const getDatabase = async (): Promise<Database> => {
  try {
    // Fetch machine journeys
    const { data: journeys, error: journeysError } = await supabase
      .from('machine_journeys')
      .select('*');
    
    if (journeysError) {
      console.error("Error fetching machine journeys:", journeysError);
      return initializeDatabase();
    }
    
    // Fetch machine records
    const { data: records, error: recordsError } = await supabase
      .from('machine_records')
      .select('*');
    
    if (recordsError) {
      console.error("Error fetching machine records:", recordsError);
      return initializeDatabase();
    }
    
    // Transform the data to match our expected format
    const machines: Record<string, MachineJourney> = {};
    
    // Process journeys
    journeys.forEach((journey) => {
      machines[journey.barcode_id] = {
        barcodeId: journey.barcode_id,
        currentWorkstation: journey.current_workstation,
        completedWorkstations: journey.completed_workstations || [],
        records: [], // Will be filled from records data
        startTime: journey.start_time,
        endTime: journey.end_time
      };
    });
    
    // Process records
    records.forEach((record) => {
      if (machines[record.barcode_id]) {
        machines[record.barcode_id].records.push({
          barcodeId: record.barcode_id,
          operator: {
            name: record.operator_name,
            epf: record.operator_epf
          },
          workstation: record.workstation,
          checkinTime: record.checkin_time,
          checkoutTime: record.checkout_time,
          waitTime: record.wait_time,
          tasksCompleted: record.tasks_completed || [],
          totalTasks: record.total_tasks || 0
        });
      }
    });
    
    return {
      machines,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting database:", error);
    return initializeDatabase();
  }
};

// Initialize a new database
export const initializeDatabase = (): Database => {
  return {
    machines: {},
    lastUpdated: new Date().toISOString(),
  };
};

// Save the database to Supabase
export const saveDatabase = async (database: Database): Promise<void> => {
  try {
    // For each machine, update or insert the journey and its records
    for (const barcodeId in database.machines) {
      const machine = database.machines[barcodeId];
      
      // Upsert machine journey
      const { error: journeyError } = await supabase
        .from('machine_journeys')
        .upsert({
          barcode_id: machine.barcodeId,
          current_workstation: machine.currentWorkstation,
          completed_workstations: machine.completedWorkstations,
          start_time: machine.startTime,
          end_time: machine.endTime
        });
      
      if (journeyError) {
        console.error("Error saving machine journey:", journeyError);
        toast.error(`Error saving journey for machine ${barcodeId}`);
        continue;
      }
      
      // Process records for this machine
      for (const record of machine.records) {
        // Check if this is a new record (no ID) or an existing one
        // For simplicity, we'll delete and re-insert all records for this machine
        // In a production app, you might want to use a more efficient approach
        
        // We identify records by their combination of barcodeId and workstation and checkin time
        const { error: recordError } = await supabase
          .from('machine_records')
          .upsert({
            barcode_id: record.barcodeId,
            operator_name: record.operator.name,
            operator_epf: record.operator.epf,
            workstation: record.workstation,
            checkin_time: record.checkinTime,
            checkout_time: record.checkoutTime,
            wait_time: record.waitTime,
            tasks_completed: record.tasksCompleted,
            total_tasks: record.totalTasks
          });
        
        if (recordError) {
          console.error("Error saving machine record:", recordError);
          toast.error(`Error saving record for machine ${barcodeId}`);
        }
      }
    }
    
    // Dispatch a custom event to notify any listeners
    const event = new CustomEvent('dbUpdate', { detail: { timestamp: database.lastUpdated } });
    document.dispatchEvent(event);
    
  } catch (error) {
    console.error("Error saving database:", error);
    toast.error("Failed to save data to Supabase");
  }
};

// Check in a machine to a workstation
export const checkInMachine = async (
  barcodeId: string,
  workstation: number,
  operator: { name: string; epf: string }
): Promise<{ isNew: boolean; waitTime: number | null }> => {
  try {
    const db = await getDatabase();
    const now = new Date();
    
    // Calculate wait time if there are any active machines in this workstation
    let waitTime: number | null = null;
    let isNew = false;
    
    // Check if the machine exists in the database
    if (!db.machines[barcodeId]) {
      // New machine, create a record
      db.machines[barcodeId] = {
        barcodeId,
        currentWorkstation: workstation,
        completedWorkstations: [],
        records: [],
        startTime: now.toISOString(),
        endTime: null,
      };
      isNew = true;
    } else if (db.machines[barcodeId].currentWorkstation !== null) {
      // Machine is already checked in somewhere
      toast.error(`Machine ${barcodeId} is already in workstation ${db.machines[barcodeId].currentWorkstation}`);
      return { isNew: false, waitTime: null };
    }
    
    // Count active machines in this workstation
    const activeInWorkstation = Object.values(db.machines).filter(
      (m) => m.currentWorkstation === workstation && m.barcodeId !== barcodeId
    ).length;
    
    if (activeInWorkstation > 0) {
      waitTime = activeInWorkstation * 15 * 60 * 1000; // 15 minutes per machine in queue
    }
    
    // Create a new record for this check-in
    const record: MachineRecord = {
      barcodeId,
      operator,
      workstation,
      checkinTime: now.toISOString(),
      checkoutTime: null,
      waitTime,
      tasksCompleted: [],
      totalTasks: 0,
    };
    
    // Update the machine's current status
    db.machines[barcodeId].currentWorkstation = workstation;
    db.machines[barcodeId].records.push(record);
    
    // Save the database
    await saveDatabase(db);
    
    return { isNew, waitTime };
  } catch (error) {
    console.error("Error checking in machine:", error);
    toast.error("Failed to check in machine. Please try again");
    return { isNew: false, waitTime: null };
  }
};

// Check out a machine from a workstation
export const checkOutMachine = async (
  barcodeId: string,
  workstation: number,
  tasksCompleted: string[],
  totalTasks: number
): Promise<boolean> => {
  try {
    const db = await getDatabase();
    const now = new Date();
    
    // Check if the machine exists and is in the correct workstation
    if (
      !db.machines[barcodeId] ||
      db.machines[barcodeId].currentWorkstation !== workstation
    ) {
      toast.error(`Machine ${barcodeId} is not checked in to workstation ${workstation}`);
      return false;
    }
    
    // Find the current record for this machine
    const currentRecordIndex = db.machines[barcodeId].records.findIndex(
      (r) => r.workstation === workstation && r.checkoutTime === null
    );
    
    if (currentRecordIndex === -1) {
      toast.error(`No active record found for machine ${barcodeId} in workstation ${workstation}`);
      return false;
    }
    
    // Update the record
    db.machines[barcodeId].records[currentRecordIndex].checkoutTime = now.toISOString();
    db.machines[barcodeId].records[currentRecordIndex].tasksCompleted = tasksCompleted;
    db.machines[barcodeId].records[currentRecordIndex].totalTasks = totalTasks;
    
    // Update the machine's status
    db.machines[barcodeId].completedWorkstations.push(workstation);
    db.machines[barcodeId].currentWorkstation = null;
    
    // If this is the final workstation (6), mark the machine as complete
    if (workstation === 6) {
      db.machines[barcodeId].endTime = now.toISOString();
    }
    
    // Save the database
    await saveDatabase(db);
    
    return true;
  } catch (error) {
    console.error("Error checking out machine:", error);
    toast.error("Failed to check out machine. Please try again");
    return false;
  }
};

// Get all machines for a specific workstation
export const getMachinesForWorkstation = async (workstation: number): Promise<any[]> => {
  try {
    const db = await getDatabase();
    
    return Object.values(db.machines)
      .filter((machine) => machine.currentWorkstation === workstation)
      .map((machine) => {
        // Find the current record
        const currentRecord = machine.records.find(
          (r) => r.workstation === workstation && r.checkoutTime === null
        );
        
        return {
          barcodeId: machine.barcodeId,
          checkinTime: currentRecord?.checkinTime || "",
          waitTime: currentRecord?.waitTime || null,
          operator: currentRecord?.operator || { name: "", epf: "" },
        };
      });
  } catch (error) {
    console.error("Error getting machines for workstation:", error);
    toast.error("Failed to fetch machines. Please try again");
    return [];
  }
};

export const getQueueForWorkstation = async (workstation: number): Promise<any[]> => {
  try {
    const machines = await getMachinesForWorkstation(workstation);
    
    // Sort by check-in time (oldest first)
    return machines.sort((a, b) => {
      return new Date(a.checkinTime).getTime() - new Date(b.checkinTime).getTime();
    });
  } catch (error) {
    console.error("Error getting queue for workstation:", error);
    return [];
  }
};

// Get all completed machines within a date range
export const getCompletedMachines = async (startDate: Date, endDate: Date): Promise<any[]> => {
  try {
    const db = await getDatabase();
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return Object.values(db.machines)
      .filter((machine) => {
        if (!machine.endTime) return false;
        const endTime = new Date(machine.endTime).getTime();
        return endTime >= start && endTime <= end;
      })
      .map((machine) => {
        return {
          barcodeId: machine.barcodeId,
          startTime: machine.startTime,
          endTime: machine.endTime,
          records: machine.records,
          completedWorkstations: machine.completedWorkstations || [],
          totalDuration: machine.endTime 
            ? new Date(machine.endTime).getTime() - new Date(machine.startTime).getTime()
            : null,
        };
      });
  } catch (error) {
    console.error("Error getting completed machines:", error);
    toast.error("Failed to fetch completed machines");
    return [];
  }
};

// Get a specific machine's journey
export const getMachineJourney = async (barcodeId: string): Promise<MachineJourney | null> => {
  try {
    const db = await getDatabase();
    return db.machines[barcodeId] || null;
  } catch (error) {
    console.error("Error getting machine journey:", error);
    toast.error("Failed to fetch machine data");
    return null;
  }
};

// Delete a machine from the system
export const deleteMachine = async (barcodeId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('machine_journeys')
      .delete()
      .eq('barcode_id', barcodeId);
    
    if (error) {
      console.error("Error deleting machine:", error);
      toast.error(`Failed to delete machine ${barcodeId}`);
      return false;
    }
    
    // The records will be deleted automatically due to the CASCADE constraint
    
    toast.success(`Machine ${barcodeId} has been deleted from the system`);
    return true;
  } catch (error) {
    console.error("Error deleting machine:", error);
    toast.error(`Failed to delete machine ${barcodeId}`);
    return false;
  }
};

// Export database to JSON file for backup
export const exportDatabase = async (): Promise<void> => {
  try {
    const db = await getDatabase();
    const dataStr = JSON.stringify(db);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileName = `sewing-machine-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', dataUri);
    downloadLink.setAttribute('download', exportFileName);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    toast.success('Database exported successfully');
  } catch (error) {
    console.error("Error exporting database:", error);
    toast.error("Failed to export database");
  }
};

// Import database from JSON file
export const importDatabase = async (jsonData: string): Promise<boolean> => {
  try {
    // Parse the data
    const parsedData = JSON.parse(jsonData) as Database;
    
    // Basic validation
    if (!parsedData.machines || !parsedData.lastUpdated) {
      toast.error('Invalid database format');
      return false;
    }
    
    // Clear the existing data
    await clearDatabase();
    
    // Save the imported data to Supabase
    await saveDatabase(parsedData);
    
    // Trigger a storage event to notify other tabs/windows
    const event = new CustomEvent('dbUpdate', { detail: { timestamp: parsedData.lastUpdated } });
    document.dispatchEvent(event);
    
    toast.success('Database imported successfully');
    return true;
  } catch (error) {
    console.error('Error importing database:', error);
    toast.error('Failed to import database');
    return false;
  }
};

// Clear all data (for testing/development only)
export const clearDatabase = async (): Promise<void> => {
  try {
    // Delete all machine records (will cascade to related records)
    const { error } = await supabase
      .from('machine_journeys')
      .delete()
      .neq('barcode_id', 'placeholder'); // Delete all rows
    
    if (error) {
      console.error("Error clearing database:", error);
      toast.error("Failed to clear database");
      return;
    }
    
    // Notify other components of the change
    const event = new CustomEvent('dbUpdate', { detail: { timestamp: new Date().toISOString() } });
    document.dispatchEvent(event);
    
    toast.success("Database cleared successfully");
  } catch (error) {
    console.error("Error clearing database:", error);
    toast.error("Failed to clear database");
  }
};

// Set up realtime subscription to listen for database changes
export const setupRealtimeSubscription = () => {
  // Set up subscription for machine_journeys
  const journeysChannel = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'machine_journeys' },
      () => {
        // Trigger a refresh event when data changes
        const event = new CustomEvent('dbUpdate', { detail: { timestamp: new Date().toISOString() } });
        document.dispatchEvent(event);
      }
    )
    .subscribe();

  // Set up subscription for machine_records
  const recordsChannel = supabase
    .channel('schema-db-changes-records')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'machine_records' },
      () => {
        // Trigger a refresh event when data changes
        const event = new CustomEvent('dbUpdate', { detail: { timestamp: new Date().toISOString() } });
        document.dispatchEvent(event);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(journeysChannel);
    supabase.removeChannel(recordsChannel);
  };
};
