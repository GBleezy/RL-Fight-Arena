import { InputHTMLAttributes, forwardRef } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatValue?: (val: number) => string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ label, value, min, max, step = 1, onChange, formatValue, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm">
          <label className="font-medium text-zinc-300">{label}</label>
          <span className="text-zinc-500 font-mono">{formatValue ? formatValue(value) : value}</span>
        </div>
        <input
          type="range"
          ref={ref}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';
