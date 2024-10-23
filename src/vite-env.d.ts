/// <reference types="vite/client" />

declare module 'pdf-parse' {
  interface PDFInfo {
    Title?: string;
    Author?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
    [key: string]: any;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: any;
    text: string;
    version: string;
  }

  function parse(dataBuffer: ArrayBuffer | Buffer): Promise<PDFData>;
  export default parse;
}

declare module 'mammoth' {
  interface ExtractResult {
    value: string;
    messages: any[];
  }

  interface Options {
    arrayBuffer: ArrayBuffer;
  }

  export function extractRawText(options: Options): Promise<ExtractResult>;
}