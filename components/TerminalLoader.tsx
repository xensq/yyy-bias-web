"use client"
import { useEffect, useState } from "react"

export default function TerminalLoader({ label }: { label?: string }) {
  return (
    <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", minHeight: "60vh", gap: "16px" }}>
      <div style={{ position: "relative", width: "48px", height: "48px" }}>
        <svg
          viewBox="0 0 100 100"
          style={{
            width: "48px", height: "48px",
            animation: "spin 3s linear infinite",
            color: "var(--accent)",
          }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M50 5 L53 47 L95 50 L53 53 L50 95 L47 53 L5 50 L47 47 Z" fill="var(--accent)" opacity="0.9"/>
          <path d="M50 20 L51.5 48.5 L80 50 L51.5 51.5 L50 80 L48.5 51.5 L20 50 L48.5 48.5 Z" fill="var(--accent)" opacity="0.5"/>
        </svg>
      </div>
      {label && (
        <span style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          {label}
        </span>
      )}
    </div>
  )
}
