// ДЕМО-ДАННЫЕ. Это не настоящие цифры — только чтобы видеть, как выглядит дашборд.
// Потом заменим на данные из Supabase (импорт CSV из Ads Manager + лиды/заказы).

export type AdSetId = "broad" | "healthy" | "plant";

export const AD_SETS: { id: AdSetId; name: string; share: number; dailyBudget: number }[] = [
  { id: "broad", name: "01 Broad", share: 0.4, dailyBudget: 12 },
  { id: "healthy", name: "02 Healthy Food", share: 0.35, dailyBudget: 10.5 },
  { id: "plant", name: "03 Plant-Based / Fitness", share: 0.25, dailyBudget: 7.5 },
];

// из медиаплана
export const PLAN = {
  days: 14,
  dailyBudget: 30,
  totalBudget: 420,
};

// пример юнит-экономики из медиаплана (раздел 11), сумы
export const UNIT = {
  price: 180000,
  cost: 85000,
  delivery: 18000,
  targetMargin: 0.25,
};

export const USD_RATE = 12800; // сум за $, потом вынесем в настройки

export type DayRow = {
  day: number; // день теста 1..14
  date: string;
  adSet: AdSetId;
  creative: number; // 1..4
  spend: number; // $
  impressions: number;
  clicks: number;
  dialogs: number;
  orders: number;
  revenue: number; // сум
};

// простой генератор псевдо-случайных чисел, чтобы цифры не прыгали при каждом рендере
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const r = rand(42);
const START = new Date("2026-11-02");
export const DAYS_PASSED = 7; // идёт 7-й день теста

const creativesBySet: Record<AdSetId, number[]> = {
  broad: [1, 4],
  healthy: [1, 2],
  plant: [2, 3],
};

export const daily: DayRow[] = [];

for (let d = 1; d <= DAYS_PASSED; d++) {
  const date = new Date(START);
  date.setDate(START.getDate() + d - 1);
  for (const set of AD_SETS) {
    for (const c of creativesBySet[set.id]) {
      const spend = +(set.dailyBudget / 2 * (0.85 + r() * 0.3)).toFixed(2);
      const cpm = 1.1 + r() * 0.8;
      const impressions = Math.round((spend / cpm) * 1000);
      const ctr = 0.008 + r() * 0.012 + (set.id === "healthy" ? 0.003 : 0);
      const clicks = Math.round(impressions * ctr);
      const dialogs = Math.round(clicks * (0.12 + r() * 0.1));
      const orders = Math.round(dialogs * (0.05 + r() * 0.07));
      daily.push({
        day: d,
        date: date.toISOString().slice(0, 10),
        adSet: set.id,
        creative: c,
        spend,
        impressions,
        clicks,
        dialogs,
        orders,
        revenue: orders * UNIT.price,
      });
    }
  }
}

export type LeadStatus = "new" | "qualified" | "order" | "lost";

export type Lead = {
  id: number;
  status: LeadStatus;
  name: string;
  phone: string;
  city: string;
  adSet: AdSetId;
  creative: number;
  manager: string;
  amount: number; // сум, 0 если заказа нет
  createdAt: string;
};

const names = [
  "Dilnoza R.", "Aziz K.", "Malika T.", "Jasur M.", "Nodira S.", "Sardor U.", "Gulnora A.",
  "Bekzod I.", "Kamola Y.", "Rustam N.", "Shahnoza B.", "Otabek X.", "Zarina F.", "Anvar D.",
  "Madina Q.", "Timur E.", "Laylo G.", "Farrux O.", "Sevara P.", "Jahongir V.",
];
const cities = ["Toshkent", "Toshkent", "Toshkent", "Samarqand", "Toshkent", "Andijon"];
const managers = ["Alisher", "Raph", "Madina"];
const statuses: LeadStatus[] = ["new", "qualified", "qualified", "order", "lost", "order", "new", "lost"];

export const leads: Lead[] = names.map((name, i) => {
  const status = statuses[i % statuses.length];
  const set = AD_SETS[i % 3].id;
  const day = 1 + (i % DAYS_PASSED);
  const date = new Date(START);
  date.setDate(START.getDate() + day - 1);
  return {
    id: 1000 + i,
    status,
    name,
    // номера вымышленные
    phone: `+998 90 ${String(100 + i * 7).padStart(3, "0")}-${String(10 + i).padStart(2, "0")}-00`,
    city: cities[i % cities.length],
    adSet: set,
    creative: creativesBySet[set][i % 2],
    manager: managers[i % managers.length],
    amount: status === "order" ? UNIT.price * (1 + (i % 2)) : 0,
    createdAt: date.toISOString().slice(0, 10),
  };
});
