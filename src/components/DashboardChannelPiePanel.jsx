import { uesEffect, useMemo, useState } from "react";
import { fetchChannelProfit } from "../api";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

// 数字を「1,234」形式にする
function money(n) {
  return Number(n ?? 0).toLocaleString();
}

// 今日を基準に「今月の１日～月末」を作る(YYYY-MM-DD)
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
