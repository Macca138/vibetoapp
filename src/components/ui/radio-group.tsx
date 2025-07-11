"use client"

import * as React from "react"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, disabled, children, ...props }, ref) => {
    return (
      <div
        className={cn("grid gap-2", className)}
        role="radiogroup"
        ref={ref}
        {...props}
      >
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { 
                groupValue: value, 
                onGroupValueChange: onValueChange,
                disabled: disabled || child.props.disabled
              })
            : child
        )}
      </div>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  groupValue?: string;
  onGroupValueChange?: (value: string) => void;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, groupValue, onGroupValueChange, disabled, ...props }, ref) => {
    const isChecked = groupValue === value;
    
    return (
      <label className="flex items-center cursor-pointer">
        <input
          type="radio"
          className="sr-only"
          checked={isChecked}
          onChange={() => onGroupValueChange?.(value as string)}
          disabled={disabled}
          ref={ref}
          {...props}
        />
        <div
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-gray-300 flex items-center justify-center transition-colors",
            isChecked && "border-blue-500 bg-blue-500",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          {isChecked && <Circle className="h-2 w-2 fill-white text-white" />}
        </div>
      </label>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }