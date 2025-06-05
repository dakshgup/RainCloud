export class Calculator {
  private current: string = '0';
  private previous: string = '';
  private operation: string = '';
  private waitingForNumber: boolean = false;
  private memory: number = 0;

  public getCurrentDisplay(): string {
    return this.current;
  }

  public clear(): void {
    this.current = '0';
    this.previous = '';
    this.operation = '';
    this.waitingForNumber = false;
  }

  public inputNumber(num: string): void {
    if (this.waitingForNumber) {
      this.current = num;
      this.waitingForNumber = false;
    } else {
      this.current = this.current === '0' ? num : this.current + num;
    }
  }

  public inputDecimal(): void {
    if (this.waitingForNumber) {
      this.current = '0.';
      this.waitingForNumber = false;
    } else if (this.current.indexOf('.') === -1) {
      this.current += '.';
    }
  }

  public inputOperation(nextOperation: string): void {
    const inputValue = parseFloat(this.current);

    if (this.previous === '') {
      this.previous = this.current;
    } else if (this.operation) {
      const currentValue = parseFloat(this.previous);
      const result = this.calculate(currentValue, inputValue, this.operation);
      
      this.current = String(result);
      this.previous = String(result);
    }

    this.waitingForNumber = true;
    this.operation = nextOperation;
  }

  public performCalculation(): void {
    const inputValue = parseFloat(this.current);
    const currentValue = parseFloat(this.previous);

    if (this.previous === '' || this.operation === '') {
      return;
    }

    const result = this.calculate(currentValue, inputValue, this.operation);
    this.current = String(result);
    this.previous = '';
    this.operation = '';
    this.waitingForNumber = true;
  }

  private calculate(firstValue: number, secondValue: number, operation: string): number {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      default:
        return secondValue;
    }
  }

  public memoryStore = (): void => {
    this.memory = parseFloat(this.current);
  };

  public memoryRecall = (): void => {
    this.current = String(this.memory);
  };

  public memoryClear = (): void => {
    this.memory = 0;
  };

  public memoryAdd = (): void => {
    this.memory += parseFloat(this.current);
  };
}