import React, { useState, useRef, useEffect } from 'react';
import { soundEngine } from '../utils/audio';

interface CalculatorVaultProps {
  onSecretTrigger: () => void;
}

export const CalculatorVault: React.FC<CalculatorVaultProps> = ({ onSecretTrigger }) => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [prevValue, setPrevValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [plusTapCount, setPlusTapCount] = useState<number>(0);

  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Inactivity timeout: Reset plus tap counter after 3.5 seconds of no plus taps
  const registerPlusTap = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    const nextCount = plusTapCount + 1;
    setPlusTapCount(nextCount);

    if (nextCount >= 7) {
      // 7 taps reached! Trigger secret password gate
      try {
        soundEngine.playChime();
        if (navigator.vibrate) {
          navigator.vibrate([40, 60, 80]);
        }
      } catch {
        // audio/vibrate non-fatal
      }
      setPlusTapCount(0);
      onSecretTrigger();
      return;
    }

    resetTimerRef.current = setTimeout(() => {
      setPlusTapCount(0);
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const inputDigit = (digit: string) => {
    soundEngine.playPop();
    if (waitingForOperand) {
      setDisplayValue(digit);
      setWaitingForOperand(false);
    } else {
      setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
    }
  };

  const inputDecimal = () => {
    soundEngine.playPop();
    if (waitingForOperand) {
      setDisplayValue('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const clearAll = () => {
    soundEngine.playPop();
    setDisplayValue('0');
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const toggleSign = () => {
    soundEngine.playPop();
    const val = parseFloat(displayValue);
    if (!isNaN(val)) {
      setDisplayValue(String(val * -1));
    }
  };

  const inputPercent = () => {
    soundEngine.playPop();
    const current = parseFloat(displayValue);
    if (!isNaN(current)) {
      const fixed = (current / 100).toString();
      setDisplayValue(fixed);
    }
  };

  const performOperation = (nextOperation: string) => {
    soundEngine.playPop();
    
    // Check if user tapped plus icon
    if (nextOperation === '+') {
      registerPlusTap();
    }

    const inputValue = parseFloat(displayValue);

    if (prevValue === null) {
      setPrevValue(displayValue);
    } else if (operation) {
      const currentValue = parseFloat(prevValue);
      const newValue = calculate(currentValue, inputValue, operation);
      setDisplayValue(String(newValue));
      setPrevValue(String(newValue));
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '−':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b === 0 ? 0 : a / b;
      default:
        return b;
    }
  };

  const handleEquals = () => {
    soundEngine.playPop();
    const inputValue = parseFloat(displayValue);

    if (prevValue !== null && operation) {
      const currentValue = parseFloat(prevValue);
      const result = calculate(currentValue, inputValue, operation);
      // Format clean decimals
      const formatted = Number.isInteger(result) 
        ? String(result) 
        : String(parseFloat(result.toFixed(8)));
      setDisplayValue(formatted);
      setPrevValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        inputDigit(e.key);
      } else if (e.key === '.') {
        inputDecimal();
      } else if (e.key === '=' || e.key === 'Enter') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        clearAll();
      } else if (e.key === '+') {
        performOperation('+');
      } else if (e.key === '-') {
        performOperation('−');
      } else if (e.key === '*') {
        performOperation('×');
      } else if (e.key === '/') {
        e.preventDefault();
        performOperation('÷');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayValue, prevValue, operation, waitingForOperand, plusTapCount]);

  // Adjust display text size based on length
  const getDisplayFontSize = () => {
    const len = displayValue.length;
    if (len > 12) return 'text-3xl sm:text-4xl';
    if (len > 8) return 'text-4xl sm:text-5xl';
    return 'text-5xl sm:text-6xl';
  };

  return (
    <div className="min-h-screen w-full bg-[#121214] text-white flex flex-col justify-end items-center px-4 pb-8 pt-4 select-none touch-manipulation">
      <div className="w-full max-w-[360px] mx-auto flex flex-col justify-end">
        
        {/* Top Header / Brand camouflage */}
        <div className="flex justify-between items-center text-xs text-zinc-500 mb-auto pt-2 pb-4 font-mono">
          <span>RAD</span>
          <span className="text-[11px] tracking-widest text-zinc-600">CALCULATOR</span>
        </div>

        {/* Display Screen */}
        <div className="w-full px-2 py-4 mb-2 text-right overflow-hidden flex flex-col justify-end min-h-[140px]">
          {/* History/formula line */}
          <div className="text-zinc-500 text-sm font-mono tracking-wider h-6 truncate">
            {prevValue !== null && operation ? `${prevValue} ${operation}` : ''}
          </div>
          {/* Main number display */}
          <div className={`font-light tracking-tight text-white transition-all font-mono truncate ${getDisplayFontSize()}`}>
            {displayValue}
          </div>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-3 text-2xl font-normal">
          {/* Row 1 */}
          <button
            onClick={clearAll}
            className="h-16 rounded-full bg-zinc-600/80 hover:bg-zinc-500 active:scale-95 text-white flex items-center justify-center font-medium transition-all shadow-sm cursor-pointer"
          >
            {displayValue !== '0' ? 'C' : 'AC'}
          </button>
          <button
            onClick={toggleSign}
            className="h-16 rounded-full bg-zinc-600/80 hover:bg-zinc-500 active:scale-95 text-white flex items-center justify-center font-medium transition-all shadow-sm cursor-pointer"
          >
            ±
          </button>
          <button
            onClick={inputPercent}
            className="h-16 rounded-full bg-zinc-600/80 hover:bg-zinc-500 active:scale-95 text-white flex items-center justify-center font-medium transition-all shadow-sm cursor-pointer"
          >
            %
          </button>
          <button
            onClick={() => performOperation('÷')}
            className={`h-16 rounded-full flex items-center justify-center font-semibold text-white text-3xl transition-all shadow-sm cursor-pointer active:scale-95 ${
              operation === '÷' ? 'bg-white text-amber-500' : 'bg-amber-500 hover:bg-amber-400'
            }`}
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            onClick={() => inputDigit('7')}
            className="h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer font-light"
          >
            7
          </button>
          <button
            onClick={() => inputDigit('8')}
            className="h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer font-light"
          >
            8
          </button>
          <button
            onClick={() => inputDigit('9')}
            className="h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer font-light"
          >
            9
          </button>
          <button
            onClick={() => performOperation('×')}
            className={`h-16 rounded-full flex items-center justify-center font-semibold text-white text-3xl transition-all shadow-sm cursor-pointer active:scale-95 ${
              operation === '×' ? 'bg-white text-amber-500' : 'bg-amber-500 hover:bg-amber-400'
            }`}
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            onClick={() => inputDigit('4')}
            className="h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer font-light"
          >
            4
          </button>
          <button
            onClick={() => inputDigit('5')}
            className="h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer font-light"
          >
            5
          </button>
          <button
            onClick={() => inputDigit('6')}
            className="h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer font-light"
          >
            6
          </button>
          <button
            onClick={() => performOperation('−')}
            className={`h-16 rounded-full flex items-center justify-center font-semibold text-white text-3xl transition-all shadow-sm cursor-pointer active:scale-95 ${
              operation === '−' ? 'bg-white text-amber-500' : 'bg-amber-500 hover:bg-amber-400'
            }`}
          >
            −
          </button>

          {/* Row 4 */}
          <button
            onClick={() => inputDigit('1')}
            className="h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer font-light"
          >
            1
          </button>
          <button
            onClick={() => inputDigit('2')}
            className="h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer font-light"
          >
            2
          </button>
          <button
            onClick={() => inputDigit('3')}
            className="h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer font-light"
          >
            3
          </button>
          {/* SECRET + BUTTON: 7 taps opens Password Screen */}
          <button
            onClick={() => performOperation('+')}
            className={`h-16 rounded-full flex items-center justify-center font-semibold text-white text-3xl transition-all shadow-sm cursor-pointer active:scale-95 select-none ${
              operation === '+' ? 'bg-white text-amber-500' : 'bg-amber-500 hover:bg-amber-400'
            }`}
            aria-label="Add"
          >
            +
          </button>

          {/* Row 5 */}
          <button
            onClick={() => inputDigit('0')}
            className="col-span-2 h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-start pl-8 transition-all shadow-sm cursor-pointer font-light"
          >
            0
          </button>
          <button
            onClick={inputDecimal}
            className="h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer font-light"
          >
            .
          </button>
          <button
            onClick={handleEquals}
            className="h-16 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-white flex items-center justify-center font-semibold text-3xl transition-all shadow-sm cursor-pointer"
          >
            =
          </button>
        </div>

        {/* Subtle home indicator line like iOS */}
        <div className="w-32 h-1 bg-zinc-700/60 rounded-full mx-auto mt-6" />
      </div>
    </div>
  );
};
