declare module "html-to-docx" {
  export interface HtmlToDocxOptions {
    title?: string;
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
      header?: number;
      footer?: number;
      gutter?: number;
    };
    [key: string]: unknown;
  }

  function htmlToDocx(
    html: string,
    headerHtml?: string | null,
    options?: HtmlToDocxOptions,
    footerHtml?: string | null
  ): Promise<Buffer | Blob>;

  export default htmlToDocx;
}
