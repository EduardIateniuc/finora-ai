"use client";

import dynamic from "next/dynamic";

const MoneyRing = dynamic(() => import("./MoneyRing"), {
  ssr: false,
});

export default function ClientBackground() {
  return <MoneyRing />;
}