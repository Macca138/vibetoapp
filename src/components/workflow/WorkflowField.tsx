'use client';

import { m } from 'framer-motion';
import { WorkflowField as WorkflowFieldType } from '@/lib/workflow/types';
import AnimatedInput from '@/components/animations/AnimatedInput';

interface WorkflowFieldProps {
  field: WorkflowFieldType;
  value: string | string[] | boolean | number;
  onChange: (value: string | string[] | boolean | number) => void;
  error?: string;
}

export default function WorkflowField({ field, value, onChange, error }: WorkflowFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    
    if (field.type === 'checkbox') {
      onChange((target as HTMLInputElement).checked);
    } else if (field.type === 'multiselect') {
      const selectElement = target as HTMLSelectElement;
      const selectedValues = Array.from(selectElement.selectedOptions, option => option.value);
      onChange(selectedValues);
    } else if (field.type === 'number') {
      onChange(Number(target.value));
    } else {
      onChange(target.value);
    }
  };

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <AnimatedInput
            type="text"
            id={field.id}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          />
        );

      case 'textarea':
        return (
          <m.textarea
            id={field.id}
            value={value as string}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            maxLength={field.maxLength}
            minLength={field.minLength}
            rows={4}
            className={`block w-full rounded-md border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 resize-vertical ${
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            whileFocus={{
              scale: 1.01,
              transition: { duration: 0.2 }
            }}
          />
        );

      case 'select':
        return (
          <m.select
            id={field.id}
            value={value as string}
            onChange={handleChange}
            required={field.required}
            className={`block w-full rounded-md border-gray-300 px-4 py-3 text-base text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            whileFocus={{
              scale: 1.01,
              transition: { duration: 0.2 }
            }}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </m.select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <m.label
                key={option}
                className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-colors duration-200"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <input
                  type="checkbox"
                  checked={(value as string[])?.includes(option) || false}
                  onChange={(e) => {
                    const currentValues = (value as string[]) || [];
                    if (e.target.checked) {
                      onChange([...currentValues, option]);
                    } else {
                      onChange(currentValues.filter(v => v !== option));
                    }
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </m.label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <m.label
                key={option}
                className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-colors duration-200"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </m.label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <m.label
            className="flex items-center space-x-2 cursor-pointer"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">{field.label}</span>
          </m.label>
        );

      case 'number':
        return (
          <AnimatedInput
            type="number"
            id={field.id}
            value={value as number}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={field.placeholder}
            required={field.required}
            className={error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          />
        );

      default:
        return null;
    }
  };

  return (
    <m.div
      className="space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {field.type !== 'checkbox' && (
        <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {renderField()}
      
      {field.helpText && (
        <p className="text-xs text-gray-500">{field.helpText}</p>
      )}
      
      {field.maxLength && field.type === 'textarea' && (
        <p className="text-xs text-gray-400 text-right">
          {(value as string)?.length || 0} / {field.maxLength}
        </p>
      )}
      
      {error && (
        <m.p
          className="text-sm text-red-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </m.p>
      )}
    </m.div>
  );
}