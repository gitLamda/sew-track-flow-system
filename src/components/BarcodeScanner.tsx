
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Barcode } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, disabled = false }) => {
  const [barcodeValue, setBarcodeValue] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus on the input when the component mounts
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Handle barcode input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcodeValue(e.target.value);
  };

  // Handle barcode input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barcodeValue.trim()) {
      toast.error("Please enter or scan a barcode");
      return;
    }
    
    // Show scanning animation
    setIsScanning(true);
    if (containerRef.current) {
      containerRef.current.classList.add("barcode-flash");
    }
    
    // Process the barcode after a short delay to show animation
    setTimeout(() => {
      onScan(barcodeValue.trim());
      setBarcodeValue("");
      setIsScanning(false);
      
      if (containerRef.current) {
        containerRef.current.classList.remove("barcode-flash");
      }
      
      // Re-focus the input for the next scan
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 500);
  };

  // Handle manual scan button click
  const handleManualScan = () => {
    if (!barcodeValue.trim()) {
      toast.error("Please enter a barcode");
      return;
    }
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div ref={containerRef} className="barcode-scanner bg-white p-4 rounded-lg shadow-md">
      <div className="text-lg font-medium mb-2 flex items-center gap-2">
        <Barcode className="h-5 w-5" />
        <span>Machine Barcode Scanner</span>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={barcodeValue}
          onChange={handleInputChange}
          placeholder="Scan or enter barcode..."
          className="flex-1"
          disabled={disabled || isScanning}
          autoComplete="off"
        />
        <Button 
          type="button" 
          onClick={handleManualScan}
          disabled={disabled || isScanning}
        >
          {isScanning ? "Scanning..." : "Scan"}
        </Button>
      </form>
    </div>
  );
};

export default BarcodeScanner;
