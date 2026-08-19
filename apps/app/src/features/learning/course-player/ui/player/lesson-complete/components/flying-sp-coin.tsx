"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export const CELEBRATION_GOLD = "#FFC800";
export const CELEBRATION_GOLD_DARK = "#E5B000";
export const COIN_FLIGHT_MS = 900;

export interface FlyingCoin {
  id: number;
  start: { x: number; y: number };
  mid: { x: number; y: number };
  end: { x: number; y: number };
  delayMs: number;
  value: number;
}

interface FlyingSpCoinProps {
  coin: FlyingCoin;
}

export function FlyingSpCoin({ coin }: FlyingSpCoinProps) {
  return (
    <motion.div
      className="pointer-events-none fixed z-[130] flex h-10 w-10 items-center justify-center rounded-full"
      style={{
        background: `linear-gradient(145deg, ${CELEBRATION_GOLD} 0%, ${CELEBRATION_GOLD_DARK} 100%)`,
        boxShadow: `0 3px 0 ${CELEBRATION_GOLD_DARK}, 0 8px 18px rgba(229, 176, 0, 0.4)`,
        left: 0,
        top: 0,
        marginLeft: -20,
        marginTop: -20,
      }}
      initial={{
        x: coin.start.x,
        y: coin.start.y,
        scale: 0.3,
        opacity: 0,
        rotate: -30,
      }}
      animate={{
        x: [coin.start.x, coin.mid.x, coin.end.x, coin.end.x],
        y: [coin.start.y, coin.mid.y, coin.end.y, coin.end.y],
        scale: [0.3, 1.2, 0.75, 0.65],
        opacity: [0, 1, 0.95, 0],
        rotate: [-30, 15, 420, 420],
      }}
      transition={{
        duration: COIN_FLIGHT_MS / 1000,
        delay: coin.delayMs / 1000,
        times: [0, 0.42, 0.88, 1],
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Zap className="h-4 w-4 fill-white text-white" strokeWidth={2} />
    </motion.div>
  );
}
