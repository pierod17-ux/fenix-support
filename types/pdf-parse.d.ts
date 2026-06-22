declare module 'pdf-parse' {
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
