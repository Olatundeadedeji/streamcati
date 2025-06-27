// Type declarations for enketo-core
declare module 'enketo-core' {
  export interface FormOptions {
    modelStr?: string;
    instanceStr?: string;
    external?: any[];
    submitted?: boolean;
  }

  export interface FormValidationError {
    level: number;
    message: string;
  }

  export interface FormData {
    [key: string]: any;
  }

  export class Form {
    constructor(formSelector: string | HTMLElement, options?: FormOptions);
    
    init(): Promise<Form>;
    validate(): Promise<boolean>;
    getDataStr(): string;
    getDataObj(): FormData;
    getValidationErrors(): FormValidationError[];
    destroy(): void;
    
    // Event methods
    on(event: string, callback: Function): void;
    off(event: string, callback?: Function): void;
    
    // Properties
    model: any;
    view: any;
    calc: any;
    output: any;
    pages: any;
    widgets: any;
    langs: any;
    options: FormOptions;
  }

  export default Form;
}

// Additional type declarations for DOM manipulation
declare global {
  interface Window {
    enketo?: any;
  }
}
