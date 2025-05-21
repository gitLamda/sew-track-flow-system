
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  getOperators, 
  addOperator, 
  deleteOperator, 
  Operator, 
  initializeOperators 
} from "@/data/operators";
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
} from "@/components/ui/alert-dialog";
import { Trash, UserPlus, Users } from "lucide-react";

const OperatorManagement: React.FC = () => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [newName, setNewName] = useState("");
  const [newEpf, setNewEpf] = useState("");
  const [operatorToDelete, setOperatorToDelete] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  // Load operators from storage
  useEffect(() => {
    initializeOperators();
    setOperators(getOperators());
  }, []);

  // Handle adding a new operator
  const handleAddOperator = () => {
    if (!newName.trim() || !newEpf.trim()) {
      toast.error("Please provide both name and EPF number");
      return;
    }

    try {
      const updatedOperators = addOperator(newName.trim(), newEpf.trim());
      setOperators(updatedOperators);
      setNewName("");
      setNewEpf("");
      setDialogOpen(false);
      toast.success(`Operator ${newName} added successfully`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add operator");
      }
    }
  };

  // Handle operator deletion
  const handleDeleteOperator = () => {
    if (operatorToDelete) {
      const operator = operators.find(op => op.epfNumber === operatorToDelete);
      try {
        const updatedOperators = deleteOperator(operatorToDelete);
        setOperators(updatedOperators);
        toast.success(operator ? `Operator ${operator.name} deleted successfully` : "Operator deleted successfully");
      } catch (error) {
        toast.error("Failed to delete operator");
      }
      setOperatorToDelete(null);
      setAlertOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Operator Management</h3>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Operator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Operator</DialogTitle>
              <DialogDescription>
                Add a new operator to the system. Please provide the name and EPF number.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="Operator name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="epf">EPF Number</Label>
                <Input 
                  id="epf" 
                  value={newEpf} 
                  onChange={(e) => setNewEpf(e.target.value)} 
                  placeholder="EPF number"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddOperator}>Add Operator</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        {operators.length > 0 ? (
          <div className="divide-y">
            {operators.map((operator) => (
              <div 
                key={operator.epfNumber}
                className="flex justify-between items-center p-3 hover:bg-secondary/50"
              >
                <div>
                  <div className="font-medium">{operator.name}</div>
                  <div className="text-sm text-muted-foreground">EPF: {operator.epfNumber}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setOperatorToDelete(operator.epfNumber);
                    setAlertOpen(true);
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No operators found. Add an operator to get started.
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Deleting Operators */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Operator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this operator? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOperatorToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteOperator}
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

export default OperatorManagement;
