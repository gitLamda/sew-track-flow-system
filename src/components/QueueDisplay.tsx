
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueueItem {
  barcodeId: string;
  checkinTime: string;
  waitTime: number | null;
}

interface QueueDisplayProps {
  queue: QueueItem[];
  currentBarcodeId?: string | null;
}

const QueueDisplay: React.FC<QueueDisplayProps> = ({ queue, currentBarcodeId }) => {
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
                  "p-3 rounded-md flex justify-between items-center",
                  item.barcodeId === currentBarcodeId 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : index === 0 && item.barcodeId !== currentBarcodeId
                      ? "bg-green-100 dark:bg-green-900/20"
                      : "bg-secondary"
                )}
              >
                <span className="text-sm">
                  {item.barcodeId}
                  {index === 0 && item.barcodeId !== currentBarcodeId && (
                    <span className="ml-2 text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                      Next Up
                    </span>
                  )}
                </span>
                <div className="flex gap-2 items-center">
                  <span className="text-xs opacity-80">
                    {formatTime(item.checkinTime)}
                  </span>
                  <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                    {formatWaitTime(item.waitTime)}
                  </span>
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
