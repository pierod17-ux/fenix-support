declare module 'pdf-parse/lib/pdf-parse.js' {
  function pdfParse(
    dataBuffer: Buffer,
    options?: object
  ): Promise<{
    numpages: number
    numrender: number
    info: object
    metadata: object
    text: string
    version: string
  }>
  export = pdfParse
}
