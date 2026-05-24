import { useRef, useState } from "react";
import { createWorker } from "tesseract.js";

import { getApiError } from "../services/api";


export default function ReceiptScannerPanel({ onExtractText }) {
  const fileInputRef = useRef(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [lastReceiptName, setLastReceiptName] = useState("");

  async function processReceipt(file) {
    if (!file) return;

    setOcrLoading(true);
    setOcrError("");
    setLastReceiptName(file.name);

    let worker = null;
    try {
      worker = await createWorker("eng");
      const result = await worker.recognize(file);
      const extractedText = result?.data?.text?.trim();

      if (!extractedText) {
        throw new Error("Could not read text from this receipt image.");
      }

      onExtractText(
        `\n\nReceipt OCR from ${file.name}:\n${extractedText}\n\nPlease split this bill fairly.`,
      );
    } catch (error) {
      setOcrError(getApiError(error) || error.message || "OCR failed for this receipt.");
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setOcrLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-brand-100 bg-gradient-to-r from-aqua-50 via-white to-brand-50 p-5 dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
            OCR receipt scanner
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-200">
            Upload a bill photo and FairSplit AI will extract the text into your scenario box.
          </p>
          {lastReceiptName && (
            <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Last scan: {lastReceiptName}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => processReceipt(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrLoading}
            className="shimmer-button rounded-full bg-gradient-to-r from-slate-900 via-brand-700 to-berry-600 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-soft transition hover:scale-105 disabled:opacity-70"
          >
            {ocrLoading ? "Scanning..." : "Upload Receipt"}
          </button>
        </div>
      </div>

      {ocrError && (
        <div className="mt-4 rounded-3xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-500/12 dark:text-rose-200">
          {ocrError}
        </div>
      )}
    </div>
  );
}
