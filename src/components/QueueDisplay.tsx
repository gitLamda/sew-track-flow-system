
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueueItem {
  barcodeId: string;
  checkinTime: string;
  waitTime: number | null;
  operator?: {
    name: string;
    epf: string;
  };
}

interface QueueDisplayProps {
  queue: QueueItem[];
  currentBarcodeId?: string | null;
  onSelectMachine?: (barcodeId: string) => void;
  onDeleteMachine?: (barcodeId: string) => void;
  onQueueUpdate?: () => void;
}

const QueueDisplay: React.FC<QueueDisplayProps> = ({ 
  queue, 
  currentBarcodeId,
  onSelectMachine,
  onDeleteMachine,
  onQueueUpdate
}) => {
  const [lastStorageUpdate, setLastStorageUpdate] = useState<string | null>(null);
  
  // Listen for storage events from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'machineServiceDB' && e.newValue !== null) {
        // If the database was updated in another tab/window
        if (onQueueUpdate) {
          onQueueUpdate();
        }
      }
    };
    
    // Add event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for updates every 10 seconds to catch changes from other devices
    const intervalId = setInterval(() => {
      const currentData = localStorage.getItem('machineServiceDB');
      if (currentData && currentData !== lastStorageUpdate) {
        setLastStorageUpdate(currentData);
        if (onQueueUpdate) {
          onQueueUpdate();
        }
      }
    }, 10000);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [onQueueUpdate, lastStorageUpdate]);

  // Format the check-in time
  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format the wait time
  const formatWaitTime = (waitTime: number | null): string => {
    if (waitTime === null) return "No wait";
    
    const minutes = Math.floor(waitTime / (1000 * 60));
    return `~${minutes} mins`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <span>Machine Queue</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {queue.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            No machines in queue
          </div>
        ) : (
          <ul className="space-y-2">
            {queue.map((item, index) => (
              <li 
                key={item.barcodeId}
                className={cn(
                  "p-3 rounded-md",
                  item.barcodeId === currentBarcodeId 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : index === 0 && !currentBarcodeId
                      ? "bg-green-100 dark:bg-green-900/20"
                      : "bg-secondary"
                )}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <div className="font-medium">
                      {item.barcodeId}
                      {index === 0 && !currentBarcodeId && (
                        <span className="ml-2 text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                          Next Up
                        </span>
                      )}
                    </div>
                    {item.operator && (
                      <div className="text-xs opacity-80">
                        Operator: {item.operator.name} ({item.operator.epf})
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex flex-col items-end">
                      <span className="text-xs opacity-80">
                        {formatTime(item.checkinTime)}
                      </span>
                      <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                        {formatWaitTime(item.waitTime)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {onSelectMachine && item.barcodeId !== currentBarcodeId && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onSelectMachine(item.barcodeId)}
                        >
                          Select
                        </Button>
                      )}
                      {onDeleteMachine && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onDeleteMachine(item.barcodeId)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default QueueDisplay;
