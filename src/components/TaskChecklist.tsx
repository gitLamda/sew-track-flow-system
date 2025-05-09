
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Task } from "@/data/workstationTasks";

interface TaskChecklistProps {
  tasks: Task[];
  onTasksCompleted: (completedTaskIds: string[]) => void;
}

const TaskChecklist: React.FC<TaskChecklistProps> = ({ tasks, onTasksCompleted }) => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  // Handle checkbox change
  const handleCheckboxChange = (taskId: string, checked: boolean | "indeterminate") => {
    let newCompletedTasks: string[];
    
    if (checked === true) {
      newCompletedTasks = [...completedTasks, taskId];
    } else {
      newCompletedTasks = completedTasks.filter(id => id !== taskId);
    }
    
    setCompletedTasks(newCompletedTasks);
    onTasksCompleted(newCompletedTasks);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Required Tasks</h3>
        <span className="text-sm text-muted-foreground">
          {completedTasks.length} of {tasks.length} completed
        </span>
      </div>
      
      <div className="space-y-3">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className={cn(
              "flex items-start space-x-3 p-3 rounded-md transition-colors",
              completedTasks.includes(task.id) 
                ? "bg-primary/10" 
                : "hover:bg-secondary"
            )}
          >
            <Checkbox
              id={task.id}
              checked={completedTasks.includes(task.id)}
              onCheckedChange={(checked) => handleCheckboxChange(task.id, checked)}
              className="mt-1"
            />
            <Label 
              htmlFor={task.id}
              className={cn(
                "cursor-pointer text-base leading-tight", // Increased from text-sm to text-base
                completedTasks.includes(task.id) && "line-through text-muted-foreground"
              )}
            >
              {task.description}
            </Label>
          </div>
        ))}
      </div>
      
      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-24 border rounded-md">
          <p className="text-muted-foreground">No tasks defined for this workstation</p>
        </div>
      )}
    </div>
  );
};

export default TaskChecklist;
