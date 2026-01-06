import {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  ExportPDFJob,
  ExportPDFParams,
  ExportPDFTargetFormat,
  ExportPDFResult,
  SDKError,
  ServiceUsageError,
  ServiceApiError
} from "@adobe/pdfservices-node-sdk";
import fs from "fs";
import path from "path";

export interface ConversionResult {
  success: boolean;
  docxPath?: string;
  error?: string;
  originalPdfPath: string;
}

export async function convertPdfToDocx(pdfPath: string, outputDir: string): Promise<ConversionResult> {
  const clientId = process.env.ADOBE_PDF_SERVICES_CLIENT_ID;
  const clientSecret = process.env.ADOBE_PDF_SERVICES_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      success: false,
      error: "Adobe PDF Services API credentials not configured. Please set ADOBE_PDF_SERVICES_CLIENT_ID and ADOBE_PDF_SERVICES_CLIENT_SECRET environment variables.",
      originalPdfPath: pdfPath
    };
  }

  let readStream: fs.ReadStream | undefined;

  try {
    console.log(`[Adobe PDF] Starting PDF to DOCX conversion: ${pdfPath}`);

    const credentials = new ServicePrincipalCredentials({
      clientId,
      clientSecret
    });

    const pdfServices = new PDFServices({ credentials });

    readStream = fs.createReadStream(pdfPath);
    const inputAsset = await pdfServices.upload({
      readStream,
      mimeType: MimeType.PDF
    });

    const params = new ExportPDFParams({
      targetFormat: ExportPDFTargetFormat.DOCX
    });

    const job = new ExportPDFJob({ inputAsset, params });
    const pollingURL = await pdfServices.submit({ job });
    
    console.log(`[Adobe PDF] Job submitted, polling for result...`);
    
    const pdfServicesResponse = await pdfServices.getJobResult({
      pollingURL,
      resultType: ExportPDFResult
    });

    if (!pdfServicesResponse.result) {
      throw new Error("No result returned from Adobe PDF Services");
    }

    const resultAsset = pdfServicesResponse.result.asset;
    const streamAsset = await pdfServices.getContent({ asset: resultAsset });

    const pdfBasename = path.basename(pdfPath, path.extname(pdfPath));
    const docxFilename = `${pdfBasename}_converted.docx`;
    const docxPath = path.join(outputDir, docxFilename);

    await new Promise<void>((resolve, reject) => {
      const outputStream = fs.createWriteStream(docxPath);
      streamAsset.readStream.pipe(outputStream);
      outputStream.on("finish", () => resolve());
      outputStream.on("error", (err) => reject(err));
    });

    console.log(`[Adobe PDF] Conversion successful: ${docxPath}`);

    return {
      success: true,
      docxPath,
      originalPdfPath: pdfPath
    };

  } catch (err: any) {
    console.error("[Adobe PDF] Conversion error:", err);

    let errorMessage = "Unknown error during PDF to DOCX conversion";

    if (err instanceof SDKError) {
      errorMessage = `SDK Error: ${err.message}`;
    } else if (err instanceof ServiceUsageError) {
      errorMessage = `Service Usage Error: ${err.message}`;
    } else if (err instanceof ServiceApiError) {
      errorMessage = `API Error: ${err.message}`;
    } else if (err.message) {
      errorMessage = err.message;
    }

    return {
      success: false,
      error: errorMessage,
      originalPdfPath: pdfPath
    };
  } finally {
    if (readStream) {
      readStream.destroy();
    }
  }
}

export function isAdobeApiConfigured(): boolean {
  return !!(process.env.ADOBE_PDF_SERVICES_CLIENT_ID && process.env.ADOBE_PDF_SERVICES_CLIENT_SECRET);
}
