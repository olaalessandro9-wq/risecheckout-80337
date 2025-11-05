import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

export const ColorPicker = ({ label, value, onChange, description }: ColorPickerProps) => {
  const [localValue, setLocalValue] = useState(value);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Throttle function para evitar muitos updates
  const throttledOnChange = (newValue: string) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // Se passou mais de 50ms desde último update, atualiza imediatamente
    if (timeSinceLastUpdate >= 50) {
      lastUpdateRef.current = now;
      onChange(newValue);
    } else {
      // Senão, agenda update para daqui a 50ms
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      throttleTimeoutRef.current = setTimeout(() => {
        lastUpdateRef.current = Date.now();
        onChange(newValue);
      }, 50);
    }
  };

  // Debounce apenas para input de texto (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value && localValue.match(/^#[0-9A-Fa-f]{6}$/)) {
        onChange(localValue);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="flex gap-2 items-center">
        <Input
          type="color"
          value={localValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setLocalValue(newValue);
            // Throttled update - rápido mas sem travar
            throttledOnChange(newValue);
          }}
          className="w-16 h-10 p-1 cursor-pointer"
        />
        <Input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
          pattern="^#[0-9A-Fa-f]{6}$"
        />
      </div>
    </div>
  );
};

