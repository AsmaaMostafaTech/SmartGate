"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QrScannerProps {
  onScan: (decoded: string) => void;
  paused?: boolean;
}

export function QrScanner({ onScan, paused }: QrScannerProps) {
  const containerId = "smart-gate-reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState<
    "idle" | "starting" | "running" | "error" | "denied"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const lastScanRef = useRef<{ value: string; time: number }>({
    value: "",
    time: 0,
  });
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        const isRunning = scanner.isScanning;
        if (isRunning) {
          await scanner.stop();
        }
        await scanner.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    setStatus("starting");
    setErrorMsg("");
    // ensure clean
    await stop();
    try {
      const scanner = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (vw, vh) => {
            const min = Math.min(vw, vh);
            const size = Math.floor(min * 0.7);
            return { width: size, height: size };
          },
          aspectRatio: 1,
        },
        (decodedText) => {
          // throttle duplicate scans within 2.5s
          const now = Date.now();
          if (
            decodedText === lastScanRef.current.value &&
            now - lastScanRef.current.time < 2500
          ) {
            return;
          }
          lastScanRef.current = { value: decodedText, time: now };
          onScanRef.current(decodedText);
        },
        () => {
          /* per-frame errors ignored */
        }
      );
      setStatus("running");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.toLowerCase().includes("permission") ||
        msg.toLowerCase().includes("denied") ||
        msg.toLowerCase().includes("notallowed")
      ) {
        setStatus("denied");
        setErrorMsg("تم رفض الإذن للوصول إلى الكاميرا");
      } else {
        setStatus("error");
        setErrorMsg("تعذر تشغيل الكاميرا. يمكنك استخدام الإدخال اليدوي");
      }
    }
  }, [stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          "relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl border-2 bg-black",
          status === "running" ? "border-primary" : "border-border"
        )}
      >
        <div id={containerId} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />

        {/* Overlay frame + scan line */}
        {status === "running" && (
          <>
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-[12%] rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              <div className="absolute left-[12%] top-[12%] h-6 w-6 border-t-4 border-l-4 border-primary" />
              <div className="absolute right-[12%] top-[12%] h-6 w-6 border-t-4 border-r-4 border-primary" />
              <div className="absolute left-[12%] bottom-[12%] h-6 w-6 border-b-4 border-l-4 border-primary" />
              <div className="absolute right-[12%] bottom-[12%] h-6 w-6 border-b-4 border-r-4 border-primary" />
              {!paused && (
                <div className="animate-scanline pointer-events-none absolute inset-x-[14%] h-0.5 rounded-full bg-primary shadow-[0_0_10px_2px_var(--primary)]" />
              )}
            </div>
            {paused && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-medium text-white">
                جارٍ المعالجة...
              </div>
            )}
          </>
        )}

        {/* Idle / starting / error overlays */}
        {status !== "running" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            {status === "starting" ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-white/80">جارٍ تشغيل الكاميرا...</p>
              </>
            ) : status === "denied" || status === "error" ? (
              <>
                <CameraOff className="h-10 w-10 text-white/60" />
                <p className="text-sm text-white/80">{errorMsg}</p>
              </>
            ) : (
              <>
                <ScanLine className="h-10 w-10 text-white/60" />
                <p className="text-sm text-white/70">
                  اضغط لبدء المسح بالكاميرا
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {status === "running" ? (
          <Button variant="outline" onClick={stop as () => void} size="sm">
            <CameraOff className="ml-2 h-4 w-4" />
            إيقاف الكاميرا
          </Button>
        ) : (
          <Button onClick={start} size="sm" disabled={status === "starting"}>
            <Camera className="ml-2 h-4 w-4" />
            {status === "starting" ? "جارٍ التشغيل..." : "بدء المسح بالكاميرا"}
          </Button>
        )}
      </div>
    </div>
  );
}
