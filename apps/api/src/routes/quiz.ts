import type { FastifyInstance } from "fastify";
import { prisma } from "@geoverse/db";
import { currentUser } from "./auth.js";

// Fisher–Yates shuffle.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function pickDistractors<T>(pool: T[], exclude: (x: T) => boolean, n: number): T[] {
  return shuffle(pool.filter((x) => !exclude(x))).slice(0, n);
}

// Deterministic RNG so the Daily Challenge is identical for everyone all day.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

type WeakMap = Map<string, { due: boolean; reps: number }>;

// Order a pool so a logged-in learner sees DUE (often previously-wrong) items
// first, then never-seen items, then everything else. Anonymous users get a
// plain shuffle. This is how the game "remembers" mistakes across sessions.
function orderForUser<T extends { id: string }>(pool: T[], weak: WeakMap): T[] {
  if (!weak.size) return shuffle(pool);
  const due: T[] = [];
  const fresh: T[] = [];
  const rest: T[] = [];
  for (const x of pool) {
    const c = weak.get(x.id);
    if (!c) fresh.push(x);
    else if (c.due) due.push(x);
    else rest.push(x);
  }
  return [...shuffle(due), ...shuffle(fresh), ...shuffle(rest)];
}

export interface QuizQuestion {
  id: string;
  flag: string | null;
  wiki?: string | null;
  prompt: string;
  answer: string;
  options: string[];
  hook: string | null;
}

// Curated general-knowledge banks (q = prompt, a = answer, w = wrong options).
interface GkItem {
  q: string;
  a: string;
  w: string[];
  hook: string;
}

const WORLD_GK: GkItem[] = [
  { q: "Which is the longest river in the world?", a: "Nile", w: ["Amazon", "Yangtze", "Mississippi"], hook: "The Nile (~6,650 km) in Africa is generally considered the longest river." },
  { q: "Which river carries the most water (largest by discharge)?", a: "Amazon", w: ["Nile", "Ganga", "Congo"], hook: "The Amazon discharges more water than the next several rivers combined." },
  { q: "What is the highest mountain above sea level?", a: "Mount Everest", w: ["K2", "Kangchenjunga", "Mount Kilimanjaro"], hook: "Everest stands 8,849 m on the Nepal–China border." },
  { q: "Which is the largest hot desert on Earth?", a: "Sahara", w: ["Arabian", "Gobi", "Kalahari"], hook: "The Sahara spans much of North Africa — roughly the size of the USA." },
  { q: "Which is the largest desert in the world overall?", a: "Antarctic Desert", w: ["Sahara", "Arctic", "Gobi"], hook: "Cold polar deserts count too — Antarctica is the largest desert." },
  { q: "Which is the largest country by area?", a: "Russia", w: ["Canada", "China", "United States"], hook: "Russia covers ~17 million km², spanning 11 time zones." },
  { q: "Which is the smallest country in the world?", a: "Vatican City", w: ["Monaco", "Nauru", "San Marino"], hook: "Vatican City is just ~0.49 km²." },
  { q: "Which is the largest ocean?", a: "Pacific Ocean", w: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], hook: "The Pacific is larger than all land area combined." },
  { q: "Which is the largest lake (by area) in the world?", a: "Caspian Sea", w: ["Lake Superior", "Lake Victoria", "Lake Baikal"], hook: "Despite its name, the Caspian Sea is the world's largest lake." },
  { q: "Which is the deepest lake in the world?", a: "Lake Baikal", w: ["Caspian Sea", "Lake Tanganyika", "Lake Superior"], hook: "Baikal in Siberia is over 1,600 m deep and holds ~20% of unfrozen freshwater." },
  { q: "Which is the highest waterfall in the world?", a: "Angel Falls", w: ["Niagara Falls", "Victoria Falls", "Jog Falls"], hook: "Angel Falls in Venezuela drops ~979 m." },
  { q: "Which is the longest mountain range on land?", a: "Andes", w: ["Himalayas", "Rockies", "Alps"], hook: "The Andes run ~7,000 km down South America's west coast." },
  { q: "Which is the most populous country in the world?", a: "India", w: ["China", "United States", "Indonesia"], hook: "India became the most populous country in 2023." },
  { q: "Which is the largest island in the world?", a: "Greenland", w: ["New Guinea", "Borneo", "Madagascar"], hook: "Australia is treated as a continent, so Greenland is the largest island." },
  { q: "Through how many continents does the Equator pass?", a: "Three", w: ["Two", "Four", "Five"], hook: "The Equator crosses South America, Africa and Asia (and many oceans)." },
  { q: "Which country has the most time zones?", a: "France", w: ["Russia", "United States", "China"], hook: "Counting overseas territories, France spans 12 time zones." },
  { q: "Which strait separates Asia from North America?", a: "Bering Strait", w: ["Strait of Malacca", "Strait of Gibraltar", "Palk Strait"], hook: "The Bering Strait lies between Russia and Alaska." },
  { q: "Which is the largest country in Africa by area?", a: "Algeria", w: ["Sudan", "Egypt", "Nigeria"], hook: "Algeria became Africa's largest country after South Sudan split from Sudan." },
  { q: "Which line divides the Earth into Northern and Southern hemispheres?", a: "Equator", w: ["Prime Meridian", "Tropic of Cancer", "International Date Line"], hook: "The Equator is at 0° latitude." },
  { q: "Which sea is the saltiest large water body, lying at Earth's lowest land point?", a: "Dead Sea", w: ["Red Sea", "Black Sea", "Caspian Sea"], hook: "The Dead Sea shore is ~430 m below sea level." },
];

const KARNATAKA_GK: GkItem[] = [
  { q: "Where does the river Kaveri originate?", a: "Talakaveri (Kodagu)", w: ["Koodli", "Mahabaleshwar", "Wayanad"], hook: "The Kaveri rises at Talakaveri in the Brahmagiri hills of Kodagu." },
  { q: "The Tungabhadra is formed by the union of which two rivers?", a: "Tunga and Bhadra", w: ["Krishna and Bhima", "Kaveri and Kabini", "Malaprabha and Ghataprabha"], hook: "The Tunga and Bhadra meet at Koodli to form the Tungabhadra." },
  { q: "Jog Falls is formed by which river?", a: "Sharavathi", w: ["Kali", "Kaveri", "Netravati"], hook: "The Sharavathi plunges ~253 m to create Jog Falls, among India's tallest." },
  { q: "Which is the highest peak in Karnataka?", a: "Mullayanagiri", w: ["Kudremukh", "Baba Budangiri", "Kemmanagundi"], hook: "Mullayanagiri (1,930 m) is in the Chikkamagaluru district." },
  { q: "Which is the largest district of Karnataka by area?", a: "Belagavi", w: ["Kalaburagi", "Tumakuru", "Vijayapura"], hook: "Belagavi is the largest Karnataka district by area." },
  { q: "What is the capital of Karnataka?", a: "Bengaluru", w: ["Mysuru", "Hubballi", "Mangaluru"], hook: "Bengaluru is the capital and India's IT hub." },
  { q: "Hampi, a UNESCO site, was the capital of which empire?", a: "Vijayanagara Empire", w: ["Hoysala Empire", "Chalukya dynasty", "Bahmani Sultanate"], hook: "Hampi was the glittering capital of the Vijayanagara Empire." },
  { q: "Gol Gumbaz is located in which city?", a: "Vijayapura", w: ["Kalaburagi", "Bidar", "Bagalkote"], hook: "Gol Gumbaz in Vijayapura has one of the world's largest domes." },
  { q: "Kolar Gold Fields (KGF) is in which district?", a: "Kolar", w: ["Raichur", "Ballari", "Chitradurga"], hook: "KGF in Kolar was once India's deepest gold mine." },
  { q: "On which date was the state of Karnataka formed?", a: "1 November 1956", w: ["1 May 1960", "15 August 1947", "1 November 1973"], hook: "Formed in 1956 (as Mysore State); renamed Karnataka in 1973." },
  { q: "Which is the official language of Karnataka?", a: "Kannada", w: ["Tulu", "Konkani", "Telugu"], hook: "Kannada is a classical language with ~2,000 years of literature." },
  { q: "The famous Dasara festival is most associated with which city?", a: "Mysuru", w: ["Bengaluru", "Hampi", "Udupi"], hook: "Mysuru Dasara features the grand Jumboo Savari elephant procession." },
  { q: "Indian coffee cultivation began in which Karnataka hills?", a: "Baba Budangiri (Chikkamagaluru)", w: ["Kodagu", "Kemmanagundi", "Nandi Hills"], hook: "Baba Budan is said to have first planted coffee here." },
  { q: "Pattadakal's monuments were built by which dynasty?", a: "Chalukyas", w: ["Hoysalas", "Rashtrakutas", "Wodeyars"], hook: "Pattadakal showcases Chalukyan temple architecture (UNESCO)." },
  { q: "The Belur and Halebidu temples were built by which dynasty?", a: "Hoysalas", w: ["Chalukyas", "Vijayanagara", "Kadambas"], hook: "The Hoysala temples were inscribed by UNESCO in 2023." },
  { q: "The Kali river meets the Arabian Sea at which town?", a: "Karwar", w: ["Honnavar", "Mangaluru", "Gokarna"], hook: "The Kali flows through Uttara Kannada to the sea at Karwar." },
  { q: "Which river is the lifeline / main water source of Mangaluru?", a: "Netravati", w: ["Sharavathi", "Kali", "Kabini"], hook: "The Netravati flows past Dharmasthala to Mangaluru." },
  { q: "Bidriware, a famous metal handicraft, comes from which place?", a: "Bidar", w: ["Kalaburagi", "Raichur", "Gadag"], hook: "Bidriware is silver-inlay metalwork from Bidar." },
  { q: "Which district is known as the 'sugar bowl' of Karnataka?", a: "Mandya", w: ["Belagavi", "Davanagere", "Hassan"], hook: "Mandya, fed by the KRS dam, is famed for sugarcane." },
  { q: "The KRS dam (Krishnarajasagara) is built across which river?", a: "Kaveri", w: ["Tungabhadra", "Krishna", "Sharavathi"], hook: "KRS near Mysuru fronts the famous Brindavan Gardens." },
];

// Geographical Indications — "which place is this product from?"
const GI_GK: GkItem[] = [
  { q: "Mysore silk is a GI product of which state?", a: "Karnataka", w: ["Tamil Nadu", "Andhra Pradesh", "Kerala"], hook: "Mysore silk and Mysore sandal soap are iconic Karnataka GIs." },
  { q: "Bidriware metal craft is a GI of which state?", a: "Karnataka", w: ["Telangana", "Maharashtra", "Bihar"], hook: "Bidriware silver-inlay work comes from Bidar, Karnataka." },
  { q: "Channapatna toys come from which state?", a: "Karnataka", w: ["Kerala", "Tamil Nadu", "Goa"], hook: "Channapatna near Bengaluru is the 'town of toys'." },
  { q: "Darjeeling tea is a GI product of which state?", a: "West Bengal", w: ["Assam", "Sikkim", "Himachal Pradesh"], hook: "Darjeeling was India's first GI-tagged product (2004)." },
  { q: "The Banarasi saree is a GI of which state?", a: "Uttar Pradesh", w: ["Bihar", "Madhya Pradesh", "West Bengal"], hook: "Banarasi silk sarees are woven in Varanasi (Banaras)." },
  { q: "Kanchipuram silk sarees are a GI of which state?", a: "Tamil Nadu", w: ["Karnataka", "Andhra Pradesh", "Telangana"], hook: "Kanchipuram (Kanjeevaram) silk is from Tamil Nadu." },
  { q: "Pochampally Ikat is a GI textile of which state?", a: "Telangana", w: ["Andhra Pradesh", "Odisha", "Gujarat"], hook: "Pochampally tie-dye ikat is woven in Telangana." },
  { q: "Madhubani (Mithila) painting is a GI of which state?", a: "Bihar", w: ["Jharkhand", "West Bengal", "Uttar Pradesh"], hook: "Madhubani painting comes from the Mithila region of Bihar." },
  { q: "Pashmina wool is a famous GI of which region?", a: "Jammu & Kashmir", w: ["Himachal Pradesh", "Uttarakhand", "Sikkim"], hook: "Kashmir Pashmina comes from the Changthangi goat." },
  { q: "Phulkari embroidery is a GI of which state?", a: "Punjab", w: ["Haryana", "Rajasthan", "Gujarat"], hook: "Phulkari ('flower work') is Punjab's signature embroidery." },
  { q: "Alphonso mango (Hapus) is a prized GI of which state?", a: "Maharashtra", w: ["Gujarat", "Karnataka", "Goa"], hook: "Alphonso from the Konkan coast is the 'king of mangoes'." },
  { q: "Tirupati Laddu is a GI sweet of which state?", a: "Andhra Pradesh", w: ["Telangana", "Tamil Nadu", "Karnataka"], hook: "The laddu of the Tirumala temple is GI-protected." },
  { q: "Bikaneri Bhujia is a GI snack of which state?", a: "Rajasthan", w: ["Gujarat", "Punjab", "Haryana"], hook: "Bikaneri Bhujia is the famous spicy snack from Bikaner." },
  { q: "Kullu shawls are a GI craft of which state?", a: "Himachal Pradesh", w: ["Uttarakhand", "Jammu & Kashmir", "Sikkim"], hook: "Kullu shawls feature bright geometric borders." },
  { q: "Aranmula Kannadi (metal mirror) is a GI of which state?", a: "Kerala", w: ["Tamil Nadu", "Karnataka", "Goa"], hook: "The Aranmula metal-alloy mirror is unique to Kerala." },
  { q: "Feni, a cashew/coconut spirit, is a GI of which state?", a: "Goa", w: ["Kerala", "Maharashtra", "Karnataka"], hook: "Feni is Goa's traditional distilled spirit." },
  { q: "Chanderi sarees are a GI of which state?", a: "Madhya Pradesh", w: ["Maharashtra", "Uttar Pradesh", "Chhattisgarh"], hook: "Chanderi's sheer silk-cotton weave is from Madhya Pradesh." },
  { q: "The Naga 'king chilli' (Raja Mircha) is a GI of which state?", a: "Nagaland", w: ["Manipur", "Mizoram", "Assam"], hook: "One of the world's hottest chillies, GI-tagged to Nagaland." },
  // ── World GIs ──
  { q: "Champagne can only be called so if it comes from which country?", a: "France", w: ["Italy", "Spain", "Belgium"], hook: "Champagne is a protected designation from that region of France." },
  { q: "Parmigiano-Reggiano (Parmesan) cheese is a GI of which country?", a: "Italy", w: ["France", "Switzerland", "Greece"], hook: "True Parmesan comes only from a defined region of Italy." },
  { q: "Tequila is a GI spirit of which country?", a: "Mexico", w: ["Spain", "Peru", "Cuba"], hook: "Tequila must come from the Jalisco region of Mexico." },
  { q: "Scotch whisky is a GI of which country?", a: "United Kingdom", w: ["Ireland", "United States", "Canada"], hook: "Scotch must be distilled and matured in Scotland, UK." },
  { q: "Feta cheese is a protected GI of which country?", a: "Greece", w: ["Bulgaria", "Turkey", "Cyprus"], hook: "Feta is a protected designation of origin of Greece." },
  { q: "Café de Colombia (coffee) is a GI of which country?", a: "Colombia", w: ["Brazil", "Ethiopia", "Vietnam"], hook: "Colombian coffee is one of the best-known GI products." },
  { q: "Kobe beef is a GI of which country?", a: "Japan", w: ["South Korea", "China", "Australia"], hook: "Kobe beef comes from Wagyu cattle in Hyōgo, Japan." },
  { q: "Cognac, a type of brandy, is a GI of which country?", a: "France", w: ["Italy", "Portugal", "Germany"], hook: "Cognac comes from the region around the town of Cognac, France." },
];

function dedupeByPrompt(items: GkItem[]): GkItem[] {
  const seen = new Set<string>();
  const out: GkItem[] = [];
  for (const it of items) {
    if (it.w.length >= 2 && !seen.has(it.q)) {
      seen.add(it.q);
      out.push(it);
    }
  }
  return out;
}

function gkQuiz(type: string, bank: GkItem[], count: number): QuizQuestion[] {
  const withIds = bank.map((e, i) => ({ ...e, id: `${type}-${i}` }));
  return shuffle(withIds)
    .slice(0, count)
    .map((e) => ({
      id: e.id,
      flag: null,
      prompt: e.q,
      answer: e.a,
      options: shuffle([e.a, ...e.w.slice(0, 3)]),
      hook: e.hook,
    }));
}

// ── Procedurally generated question pools (merged with the curated banks) ──

async function buildKarnatakaPool(): Promise<GkItem[]> {
  const out: GkItem[] = [...KARNATAKA_GK];
  const kn = await prisma.entity.findFirst({ where: { slug: "karnataka" }, select: { id: true } });
  if (!kn) return dedupeByPrompt(out);

  const districts = await prisma.entity.findMany({
    where: { type: "DISTRICT", parentId: kn.id },
    select: { name: true, districtProfile: { select: { headquarter: true, data: true } } },
  });
  const hqs = [...new Set(districts.map((d) => d.districtProfile?.headquarter).filter(Boolean) as string[])];
  const names = [...new Set(districts.map((d) => d.name))];
  for (const d of districts) {
    const hq = d.districtProfile?.headquarter;
    if (hq) {
      out.push({
        q: `What is the headquarters of ${d.name} district?`,
        a: hq,
        w: pickDistractors(hqs, (x) => x === hq, 3),
        hook: `${hq} is the headquarters of ${d.name} district.`,
      });
    }
    const data = (d.districtProfile?.data ?? {}) as Record<string, unknown>;
    const knownFor = Array.isArray(data.knownFor) ? (data.knownFor as string[]) : [];
    if (knownFor[0]) {
      out.push({
        q: `Which Karnataka district is best known for "${knownFor[0]}"?`,
        a: d.name,
        w: pickDistractors(names, (x) => x === d.name, 3),
        hook: `${d.name} is known for ${knownFor.slice(0, 2).join(", ")}.`,
      });
    }
  }

  const riverRels = await prisma.entityRelation.findMany({
    where: { toId: kn.id, type: "FLOWS_THROUGH" },
    select: { from: { select: { name: true, metadata: true } } },
  });
  const rivers = riverRels
    .map((r) => ({ name: r.from.name, meta: (r.from.metadata ?? {}) as Record<string, unknown> }))
    .filter((r) => typeof r.meta.origin === "string");
  const originPool = [...new Set(rivers.map((r) => r.meta.origin as string))];
  for (const r of rivers) {
    out.push({
      q: `Where does the ${r.name} river originate?`,
      a: r.meta.origin as string,
      w: pickDistractors(originPool, (x) => x === r.meta.origin, 3),
      hook: `The ${r.name} originates at ${r.meta.origin}${
        r.meta.mouth ? ` and drains into ${r.meta.mouth}` : ""
      }.`,
    });
  }
  return dedupeByPrompt(out);
}

async function buildWorldPool(): Promise<GkItem[]> {
  const out: GkItem[] = [...WORLD_GK];

  const countries = await prisma.entity.findMany({
    where: { type: "COUNTRY", countryProfile: { isNot: null } },
    select: { name: true, countryProfile: { select: { continent: true, currency: true } } },
  });
  const continents = [
    ...new Set(countries.map((c) => c.countryProfile?.continent).filter(Boolean) as string[]),
  ];
  const currencies = [
    ...new Set(countries.map((c) => c.countryProfile?.currency).filter(Boolean) as string[]),
  ];
  for (const c of countries) {
    const cont = c.countryProfile?.continent;
    if (cont && continents.length >= 4) {
      out.push({
        q: `In which continent is ${c.name}?`,
        a: cont,
        w: pickDistractors(continents, (x) => x === cont, 3),
        hook: `${c.name} is in ${cont}.`,
      });
    }
    const cur = c.countryProfile?.currency;
    if (cur && currencies.length >= 4) {
      out.push({
        q: `What is the currency of ${c.name}?`,
        a: cur,
        w: pickDistractors(currencies, (x) => x === cur, 3),
        hook: `The currency of ${c.name} is ${cur}.`,
      });
    }
  }

  const wonders = await prisma.entity.findMany({
    where: { metadata: { path: ["featured"], equals: true } },
    select: { name: true, metadata: true },
  });
  const wonderCountries = [
    ...new Set(
      wonders.map((w) => (w.metadata as Record<string, unknown>)?.country).filter(Boolean) as string[],
    ),
  ];
  for (const w of wonders) {
    const country = (w.metadata as Record<string, unknown>)?.country as string | undefined;
    if (country) {
      out.push({
        q: `In which country would you find ${w.name}?`,
        a: country,
        w: pickDistractors(wonderCountries, (x) => x === country, 3),
        hook: `${w.name} is located in ${country}.`,
      });
    }
  }
  return dedupeByPrompt(out);
}

export async function quizRoutes(app: FastifyInstance) {
  // GET /api/quiz?type=flags|capitals&scope=world|india&count=10
  app.get<{ Querystring: { type?: string; scope?: string; count?: string } }>("/", async (req) => {
    const type = req.query.type ?? "flags";
    const scope = req.query.scope ?? "world";
    const count = Math.min(Math.max(Number(req.query.count ?? 10), 3), 500);

    // General-knowledge quizzes: curated seed questions PLUS a large pool
    // generated from the database, so the bank is effectively unlimited.
    if (type === "world-gk" || type === "karnataka-gk" || type === "gi") {
      const pool =
        type === "world-gk"
          ? await buildWorldPool()
          : type === "karnataka-gk"
            ? await buildKarnatakaPool()
            : dedupeByPrompt(GI_GK);
      return { type, scope, questions: gkQuiz(type, pool, count), available: pool.length };
    }

    // Landmark photo-guess: identify the world-famous place from its photo.
    if (type === "landmarks") {
      const wonders = await prisma.entity.findMany({
        where: { metadata: { path: ["featured"], equals: true } },
        select: { id: true, name: true, summary: true, metadata: true },
      });
      const names = wonders.map((w) => w.name);
      const questions: QuizQuestion[] = shuffle(wonders)
        .slice(0, count)
        .map((w) => {
          const meta = (w.metadata ?? {}) as Record<string, unknown>;
          return {
            id: w.id,
            flag: null,
            wiki: (meta.wiki as string) ?? w.name,
            prompt: "Which famous place is this?",
            answer: w.name,
            options: shuffle([w.name, ...pickDistractors(names, (n) => n === w.name, 3)]),
            hook: w.summary ?? (meta.country ? `Located in ${meta.country}.` : null),
          };
        });
      return { type, scope, questions, available: wonders.length };
    }

    // Daily Challenge: a fixed 10-question mix, identical for everyone today.
    if (type === "daily") {
      const dayIndex = Math.floor(Date.now() / 86_400_000);
      const rnd = mulberry32(dayIndex);
      const toQ = (e: GkItem, id: string): QuizQuestion => ({
        id,
        flag: null,
        prompt: e.q,
        answer: e.a,
        options: seededShuffle([e.a, ...e.w.slice(0, 3)], rnd),
        hook: e.hook,
      });
      const world = await buildWorldPool();
      const kn = await buildKarnatakaPool();
      const mix: QuizQuestion[] = [
        ...seededShuffle(world, rnd).slice(0, 6).map((e, i) => toQ(e, `daily-w-${i}`)),
        ...seededShuffle(kn, rnd).slice(0, 4).map((e, i) => toQ(e, `daily-k-${i}`)),
      ];
      const questions = seededShuffle(mix, rnd);
      return { type, scope, questions, available: questions.length };
    }

    // Personalisation: weak/due items first for a logged-in user.
    const user = await currentUser(req);
    let weak: WeakMap = new Map();
    if (user) {
      const cards = await prisma.srsCard.findMany({
        where: { userId: user.id },
        select: { entityId: true, dueAt: true, repetitions: true },
      });
      const now = Date.now();
      weak = new Map(
        cards.map((c) => [c.entityId, { due: c.dueAt.getTime() <= now, reps: c.repetitions }]),
      );
    }

    if (scope === "india") {
      const states = await prisma.entity.findMany({
        where: { type: { in: ["STATE", "UNION_TERRITORY"] }, stateProfile: { isNot: null } },
        select: { id: true, name: true, stateProfile: { select: { capital: true } } },
      });
      const usable = states.filter((s) => s.stateProfile?.capital);
      const questions: QuizQuestion[] = orderForUser(usable, weak)
        .slice(0, count)
        .map((s) => {
          const answer = s.stateProfile!.capital!;
          const distractors = pickDistractors(
            usable.map((u) => u.stateProfile!.capital!),
            (c) => c === answer,
            3,
          );
          return {
            id: s.id,
            flag: null,
            prompt: `What is the capital of ${s.name}?`,
            answer,
            options: shuffle([answer, ...distractors]),
            hook: `${answer} is the capital of ${s.name}.`,
          };
        });
      return { type, scope, questions, available: usable.length };
    }

    const countries = await prisma.entity.findMany({
      where: { type: "COUNTRY", countryProfile: { isNot: null } },
      select: {
        id: true,
        name: true,
        countryProfile: { select: { iso2: true, capital: true, continent: true } },
      },
    });

    const withFlag = countries.filter((c) => c.countryProfile?.iso2);
    const withCapital = countries.filter((c) => c.countryProfile?.capital);

    let questions: QuizQuestion[] = [];

    if (type === "capitals") {
      questions = orderForUser(withCapital, weak)
        .slice(0, count)
        .map((c) => {
          const answer = c.countryProfile!.capital!;
          const distractors = pickDistractors(
            withCapital.map((x) => x.countryProfile!.capital!),
            (cap) => cap === answer,
            3,
          );
          const cont = c.countryProfile?.continent;
          return {
            id: c.id,
            flag: null,
            prompt: `What is the capital of ${c.name}?`,
            answer,
            options: shuffle([answer, ...distractors]),
            hook: `${answer} is the capital of ${c.name}${cont ? ` (${cont})` : ""}.`,
          };
        });
    } else {
      questions = orderForUser(withFlag, weak)
        .slice(0, count)
        .map((c) => {
          const answer = c.name;
          const distractors = pickDistractors(
            withFlag.map((x) => x.name),
            (n) => n === answer,
            3,
          );
          const cap = c.countryProfile?.capital;
          const cont = c.countryProfile?.continent;
          const bits = [cap ? `capital ${cap}` : "", cont ?? ""].filter(Boolean).join(" · ");
          return {
            id: c.id,
            flag: (c.countryProfile!.iso2 as string).toLowerCase(),
            prompt: "Which country does this flag belong to?",
            answer,
            options: shuffle([answer, ...distractors]),
            hook: bits ? `${answer} — ${bits}.` : answer,
          };
        });
    }

    return { type, scope, questions, available: type === "capitals" ? withCapital.length : withFlag.length };
  });

  // GET /api/quiz/due — spaced-repetition cards that are due for review now.
  app.get("/due", async (req, reply) => {
    const user = await currentUser(req);
    if (!user) return reply.code(401).send({ error: "Log in to see your reviews." });
    const now = new Date();
    const cards = await prisma.srsCard.findMany({
      where: { userId: user.id, dueAt: { lte: now } },
      orderBy: { dueAt: "asc" },
      take: 60,
      select: {
        repetitions: true,
        entity: {
          select: {
            id: true,
            name: true,
            type: true,
            slug: true,
            summary: true,
            countryProfile: { select: { capital: true, continent: true } },
            stateProfile: { select: { capital: true } },
          },
        },
      },
    });
    const items = cards
      .filter((c) => c.entity)
      .map((c) => {
        const e = c.entity!;
        const capital = e.stateProfile?.capital ?? e.countryProfile?.capital ?? null;
        return {
          entityId: e.id,
          name: e.name,
          type: e.type,
          slug: e.slug,
          summary: e.summary,
          capital,
          continent: e.countryProfile?.continent ?? null,
          reps: c.repetitions,
        };
      });
    return { items, total: items.length };
  });

  // POST /api/quiz/attempt — save results: update spaced-repetition cards + XP.
  app.post<{
    Body: { items?: { entityId: string; correct: boolean }[]; quizType?: string; mode?: string };
  }>("/attempt", async (req, reply) => {
    const user = await currentUser(req);
    if (!user) return reply.code(401).send({ error: "Log in to save your progress." });

    const items = (req.body.items ?? []).filter((i) => i?.entityId);
    const now = new Date();
    let awarded = 0;
    let correctCount = 0;

    for (const it of items) {
      if (it.correct) {
        awarded += 10;
        correctCount += 1;
      }
      const card = await prisma.srsCard.findUnique({
        where: { userId_entityId: { userId: user.id, entityId: it.entityId } },
      });
      let ease = card?.easeFactor ?? 2.5;
      let reps = card?.repetitions ?? 0;
      let interval = card?.intervalDays ?? 0;
      if (it.correct) {
        reps += 1;
        ease = Math.min(2.8, ease + 0.1);
        interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.max(1, Math.round(interval * ease));
      } else {
        reps = 0;
        ease = Math.max(1.3, ease - 0.2);
        interval = 0; // due again immediately — it'll resurface next time
      }
      const dueAt = new Date(now.getTime() + interval * 86_400_000);
      // FK requires the entity to exist; quiz item ids are entity ids, so this is safe.
      await prisma.srsCard
        .upsert({
          where: { userId_entityId: { userId: user.id, entityId: it.entityId } },
          create: {
            userId: user.id,
            entityId: it.entityId,
            easeFactor: ease,
            intervalDays: interval,
            repetitions: reps,
            dueAt,
          },
          update: { easeFactor: ease, intervalDays: interval, repetitions: reps, dueAt },
        })
        .catch(() => void 0);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: awarded }, lastActiveAt: now },
    });

    await prisma.quizAttempt
      .create({
        data: {
          userId: user.id,
          quizType: req.body.quizType ?? "quiz",
          score: correctCount,
          total: items.length,
          details: items as object,
        },
      })
      .catch(() => void 0);

    return { awarded, xp: updated.xp, streakCount: updated.streakCount };
  });
}
