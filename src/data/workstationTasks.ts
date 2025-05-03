
export interface Task {
  id: string;
  description: string;
}

export interface WorkstationConfig {
  stationNumber: number;
  stationName: string;
  tasks: Task[];
}

export const workstationTasks: WorkstationConfig[] = [
  {
    stationNumber: 1,
    stationName: "Initial Inspection",
    tasks: [
      { id: "ws1_task1", description: "Check task light" },
      { id: "ws1_task2", description: "Check plug top" },
      { id: "ws1_task3", description: "Check wire sleeving" },
      { id: "ws1_task4", description: "Check switch" },
      { id: "ws1_task5", description: "Check ACCU 10 & Other feeder" },
      { id: "ws1_task6", description: "Check bobbin winder condition" },
      { id: "ws1_task7", description: "Check all function & standard" },
      { id: "ws1_task8", description: "Check air leakage & Pneumatic" },
      { id: "ws1_task9", description: "Check control box & electronics" },
      { id: "ws1_task10", description: "Check painting condition" },
      { id: "ws1_task11", description: "Check oil condition" },
    ]
  },
  {
    stationNumber: 2,
    stationName: "External Parts Service",
    tasks: [
      { id: "ws2_task1", description: "Change caster wheel" },
      { id: "ws2_task2", description: "Clean caster wheel" },
      { id: "ws2_task3", description: "Remove thread stand" },
      { id: "ws2_task4", description: "Adjust stand height" },
      { id: "ws2_task5", description: "Change machine stand" },
      { id: "ws2_task6", description: "Paddle change" },
    ]
  },
  {
    stationNumber: 3,
    stationName: "Disassembly",
    tasks: [
      { id: "ws3_task1", description: "Remove synchronizer" },
      { id: "ws3_task2", description: "Remove wires" },
      { id: "ws3_task3", description: "Remove air tube" },
      { id: "ws3_task4", description: "Remove dust hose" },
      { id: "ws3_task5", description: "Remove machine head" },
      { id: "ws3_task6", description: "Remove covers" },
      { id: "ws3_task7", description: "Remove attachment & parts" },
      { id: "ws3_task8", description: "Change oil filter" },
      { id: "ws3_task9", description: "Clean oil filter" },
      { id: "ws3_task10", description: "Remove silicon cup" },
      { id: "ws3_task11", description: "Remove belt cover" },
      { id: "ws3_task12", description: "Remove hand wheel" },
    ]
  },
  {
    stationNumber: 4,
    stationName: "Cleaning",
    tasks: [
      { id: "ws4_task1", description: "Clean machine head inside" },
      { id: "ws4_task2", description: "Remove oil" },
      { id: "ws4_task3", description: "Clean thread cam" },
      { id: "ws4_task4", description: "Clean tension post" },
      { id: "ws4_task5", description: "Clean thread take-up" },
      { id: "ws4_task6", description: "Clean thread eyelet" },
      { id: "ws4_task7", description: "Clean wires" },
      { id: "ws4_task8", description: "Clean motor cover & control box" },
      { id: "ws4_task9", description: "Clean silicon cup" },
      { id: "ws4_task10", description: "Clean table top" },
      { id: "ws4_task11", description: "Clean machine head outside" },
      { id: "ws4_task12", description: "Touch up damaged paint areas" },
    ]
  },
  {
    stationNumber: 5,
    stationName: "Reassembly",
    tasks: [
      { id: "ws5_task1", description: "Fix thread take-up" },
      { id: "ws5_task2", description: "Fix tension post" },
      { id: "ws5_task3", description: "Fix hand wheel" },
      { id: "ws5_task4", description: "Fix synchronizer" },
      { id: "ws5_task5", description: "Fix belt cover" },
      { id: "ws5_task6", description: "Fix thread stand" },
      { id: "ws5_task7", description: "Fix needle plate" },
      { id: "ws5_task8", description: "Fix covers" },
      { id: "ws5_task9", description: "Fix oil or condition" },
      { id: "ws5_task10", description: "Fix eye guard" },
      { id: "ws5_task11", description: "Fix finger guard" },
      { id: "ws5_task12", description: "Fix thread eyelet" },
      { id: "ws5_task13", description: "Fix pressure foot" },
    ]
  },
  {
    stationNumber: 6,
    stationName: "Final Inspection",
    tasks: [
      { id: "ws6_task1", description: "Make or correct wire condition" },
      { id: "ws6_task2", description: "Make or correct pneumatic condition" },
      { id: "ws6_task3", description: "Replace dust bag" },
      { id: "ws6_task4", description: "Attach main wire clip" },
      { id: "ws6_task5", description: "Recheck all function & standards" },
      { id: "ws6_task6", description: "Paste service sticker" },
      { id: "ws6_task7", description: "Paste safety sticker" },
    ]
  }
];
