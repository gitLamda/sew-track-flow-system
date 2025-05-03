
import { toast } from "sonner";

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

// Storage key for the database in localStorage
const STORAGE_KEY = "machineServiceDB";

// Initialize the database structure
interface Database {
  machines: Record<string, MachineJourney>;
  lastUpdated: string;
}

// Get the database from localStorage or initialize a new one
export const getDatabase = (): Database => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    try {
      return JSON.parse(storedData);
    } catch (error) {
      console.error("Error parsing stored data:", error);
      return initializeDatabase();
    }
  }
  return initializeDatabase();
};

// Initialize a new database
export const initializeDatabase = (): Database => {
  return {
    machines: {},
    lastUpdated: new Date().toISOString(),
  };
};

// Save the database to localStorage
export const saveDatabase = (database: Database): void => {
  database.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
};

// Check in a machine to a workstation
export const checkInMachine = (
  barcodeId: string,
  workstation: number,
  operator: { name: string; epf: string }
): { isNew: boolean; waitTime: number | null } => {
  const db = getDatabase();
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
  saveDatabase(db);
  
  return { isNew, waitTime };
};

// Check out a machine from a workstation
export const checkOutMachine = (
  barcodeId: string,
  workstation: number,
  tasksCompleted: string[],
  totalTasks: number
): boolean => {
  const db = getDatabase();
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
  saveDatabase(db);
  
  return true;
};

// Get all machines for a specific workstation
export const getMachinesForWorkstation = (workstation: number): any[] => {
  const db = getDatabase();
  
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
};

// Get machines in queue for a specific workstation
export const getQueueForWorkstation = (workstation: number): any[] => {
  const machines = getMachinesForWorkstation(workstation);
  
  // Sort by check-in time (oldest first)
  return machines.sort((a, b) => {
    return new Date(a.checkinTime).getTime() - new Date(b.checkinTime).getTime();
  });
};

// Get all completed machines within a date range
export const getCompletedMachines = (startDate: Date, endDate: Date): any[] => {
  const db = getDatabase();
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
        totalDuration: machine.endTime 
          ? new Date(machine.endTime).getTime() - new Date(machine.startTime).getTime()
          : null,
      };
    });
};

// Get a specific machine's journey
export const getMachineJourney = (barcodeId: string): MachineJourney | null => {
  const db = getDatabase();
  return db.machines[barcodeId] || null;
};

// Clear all data (for testing/development only)
export const clearDatabase = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
