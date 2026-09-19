declare module 'pdf-parse' {
  type PdfResult={text:string;numpages?:number;numrender?:number;info?:unknown;metadata?:unknown;version?:string};
  function pdfParse(data:Buffer|Uint8Array,options?:Record<string,unknown>):Promise<PdfResult>;
  export default pdfParse;
}
