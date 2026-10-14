'use client';

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  icon?: React.ReactNode;
  id?: string;
  name?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  required?: boolean;
}

export function Select({
  value: controlledValue,
  defaultValue,
  onChange,
  onValueChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  triggerClassName = '',
  contentClassName = '',
  icon,
  id,
  name,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  required = false,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  // Handle controlled and uncontrolled state
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue !== undefined ? defaultValue : options[0]?.value || ''
  );
  const currentValue = isControlled ? controlledValue : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedOption = options.find((opt) => opt.value === currentValue);

  // Position calculation with viewport flip detection
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(options.length * 40 + 12, 260);
    const placeAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      placeAbove,
    });
  }, [options.length]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    updatePosition();
    setIsOpen(true);
    const selectedIdx = options.findIndex((opt) => opt.value === currentValue);
    setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
  }, [disabled, updatePosition, options, currentValue]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const handleSelect = useCallback(
    (val: string) => {
      if (!isControlled) {
        setInternalValue(val);
      }
      onChange?.(val);
      onValueChange?.(val);
      handleClose();
      triggerRef.current?.focus();
    },
    [isControlled, onChange, onValueChange, handleClose]
  );

  // Reposition on scroll and resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, handleClose]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        handleClose();
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex].value);
        }
        break;
      case 'Tab':
        handleClose();
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && dropdownRef.current && highlightedIndex >= 0) {
      const items = dropdownRef.current.querySelectorAll('[role="option"]');
      const target = items[highlightedIndex] as HTMLElement;
      if (target) {
        target.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex]);

  return (
    <div className={`relative inline-block w-full ${className}`}>
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          required={required}
        />
      )}

      {/* Select Trigger */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        onKeyDown={handleKeyDown}
        className={`w-full min-h-[40px] px-3.5 py-2 text-left bg-white border border-[#E1E4EA] rounded-lg text-sm transition-colors flex items-center justify-between gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25 focus:border-[#1B4332] hover:bg-[#FAF9F5] hover:border-[#CFD3DC] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {icon && <span className="shrink-0 text-[#5B6370]">{icon}</span>}
          {selectedOption ? (
            <span className="text-[#22252A] font-medium truncate">
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-[#5B6370] truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#5B6370] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#1B4332]' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Floating Dropdown Content in Portal */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={selectId}
            style={{
              position: 'fixed',
              top: coords.placeAbove ? 'auto' : `${coords.top}px`,
              bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : 'auto',
              left: `${coords.left}px`,
              width: `${Math.max(coords.width, 180)}px`,
              zIndex: 9999,
            }}
            className={`bg-white border border-[#E1E4EA] rounded-xl shadow-[0_6px_24px_rgba(0,0,0,0.08)] py-1.5 max-h-64 overflow-y-auto outline-none transition-all ${contentClassName}`}
          >
            {options.map((option, idx) => {
              const isSelected = option.value === currentValue;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2 transition-colors select-none ${
                    isSelected
                      ? 'bg-[#FAF9F5] text-[#1B4332] font-semibold'
                      : isHighlighted
                      ? 'bg-[#F4F4F0] text-[#22252A]'
                      : 'text-[#22252A] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    {option.icon && (
                      <span className="shrink-0 text-[#5B6370]">{option.icon}</span>
                    )}
                    <span className="truncate">{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-[#5B6370] ml-1.5 truncate">
                        {option.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#1B4332] shrink-0" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
