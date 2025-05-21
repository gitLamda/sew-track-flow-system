
export interface Operator {
  name: string;
  epfNumber: string;
}

// Initial set of operators
export const defaultOperators: Operator[] = [
  { name: "Ashoka", epfNumber: "2258" },
  { name: "Shantha", epfNumber: "5338" },
  { name: "Jude", epfNumber: "938" },
  { name: "Suraj", epfNumber: "5397" },
];

// Get operators from localStorage or use default if not available
export const getOperators = (): Operator[] => {
  const storedOperators = localStorage.getItem('operators');
  if (storedOperators) {
    try {
      return JSON.parse(storedOperators);
    } catch (error) {
      console.error("Error parsing stored operators:", error);
      return defaultOperators;
    }
  }
  return defaultOperators;
};

// Save operators to localStorage
export const saveOperators = (operators: Operator[]): void => {
  localStorage.setItem('operators', JSON.stringify(operators));
};

// Add a new operator
export const addOperator = (name: string, epfNumber: string): Operator[] => {
  const operators = getOperators();
  
  // Check if operator with same EPF already exists
  const exists = operators.some(op => op.epfNumber === epfNumber);
  if (exists) {
    throw new Error(`Operator with EPF number ${epfNumber} already exists`);
  }
  
  const newOperators = [...operators, { name, epfNumber }];
  saveOperators(newOperators);
  return newOperators;
};

// Delete an operator
export const deleteOperator = (epfNumber: string): Operator[] => {
  const operators = getOperators();
  const newOperators = operators.filter(op => op.epfNumber !== epfNumber);
  saveOperators(newOperators);
  return newOperators;
};

// Initialize with default operators if none exist
export const initializeOperators = (): void => {
  if (!localStorage.getItem('operators')) {
    saveOperators(defaultOperators);
  }
};

// Export the operators variable for backward compatibility
export const operators = getOperators();
