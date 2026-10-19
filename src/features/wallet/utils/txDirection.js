import { formatVnd } from "@/utils/money";

// Hướng tiền theo DẤU amount (dương = vào, âm = ra), KHÔNG theo type (PHASE4_GUIDE 4.2)
export const isIncoming = (tx) => tx.amount > 0;

export const matchDirection = (tx, direction) =>
  !direction ||
  direction === "ALL" ||
  (direction === "IN" ? tx.amount > 0 : tx.amount < 0);

// +612.000 đ / −500.000 đ (dấu trừ "−" cho dễ đọc)
export const formatSigned = (n) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${formatVnd(Math.abs(n))}`;
