export type ErrorType = 'address' | 'amount';

export interface ValidationError {
  index: number;
  type: ErrorType;
  message: string;
}
