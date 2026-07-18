"use client";

import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface QrCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  label?: string;
}

export function QrCodeDisplay({
  value,
  size = 220,
  className,
  label,
}: QrCodeDisplayProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative rounded-2xl bg-white p-4 shadow-lg ring-1 ring-border">
        <QRCodeSVG
          value={value}
          size={size}
          level="H"
          marginSize={1}
          fgColor="#065f46"
          bgColor="#ffffff"
          imageSettings={{
            src:
              "data:image/svg+xml;utf8," +
              encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23065f46' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='11' width='18' height='10' rx='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/></svg>`
              ),
            height: 36,
            width: 36,
            excavate: true,
          }}
        />
      </div>
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
    </div>
  );
}
