'use client';

import { useState } from 'react';
import { Calculator as CalculatorClass } from '../lib/Calculator';

const calculator = new CalculatorClass();

export default function Calculator() {
  const [display, setDisplay] = useState('0');

  const handleNumber = (num: string) => {
    calculator.inputNumber(num);
    setDisplay(calculator.getCurrentDisplay());
  };

  const handleOperation = (op: string) => {
    calculator.inputOperation(op);
    setDisplay(calculator.getCurrentDisplay());
  };

  const handleEquals = () => {
    calculator.performCalculation();
    setDisplay(calculator.getCurrentDisplay());
  };

  const handleDecimal = () => {
    calculator.inputDecimal();
    setDisplay(calculator.getCurrentDisplay());
  };

  const handleClear = () => {
    calculator.clear();
    setDisplay(calculator.getCurrentDisplay());
  };

  return (
    <div className="calculator">
      <div className="display">
        {display}
      </div>
      
      <div className="buttons">
        <button className="btn clear" onClick={handleClear}>C</button>
        <button className="btn operation">±</button>
        <button className="btn operation">%</button>
        <button className="btn operation" onClick={() => handleOperation('÷')}>÷</button>
        
        <button className="btn number" onClick={() => handleNumber('7')}>7</button>
        <button className="btn number" onClick={() => handleNumber('8')}>8</button>
        <button className="btn number" onClick={() => handleNumber('9')}>9</button>
        <button className="btn operation" onClick={() => handleOperation('×')}>×</button>
        
        <button className="btn number" onClick={() => handleNumber('4')}>4</button>
        <button className="btn number" onClick={() => handleNumber('5')}>5</button>
        <button className="btn number" onClick={() => handleNumber('6')}>6</button>
        <button className="btn operation" onClick={() => handleOperation('-')}>-</button>
        
        <button className="btn number" onClick={() => handleNumber('1')}>1</button>
        <button className="btn number" onClick={() => handleNumber('2')}>2</button>
        <button className="btn number" onClick={() => handleNumber('3')}>3</button>
        <button className="btn operation" onClick={() => handleOperation('+')}>+</button>
        
        <button className="btn number zero" onClick={() => handleNumber('0')}>0</button>
        <button className="btn number" onClick={handleDecimal}>.</button>
        <button className="btn equals" onClick={handleEquals}>=</button>
      </div>
    </div>
  );
}