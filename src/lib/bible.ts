// Bible parsing and mapping utilities for PT-BR
// Supports 66 books with common synonyms and numeric prefixes (1,2,3)

export const booksPT: Record<string, string> = {
  // Antigo Testamento
  "genesis": "Gn", "gênesis": "Gn",
  "exodo": "Ex", "êxodo": "Ex",
  "levitico": "Lv", "levítico": "Lv",
  "numeros": "Nm", "números": "Nm",
  "deuteronomio": "Dt", "deuteronômio": "Dt",
  "josue": "Js", "josué": "Js",
  "juizes": "Jz", "juízes": "Jz",
  "rute": "Rt",
  "1 samuel": "1Sm", "1samuel": "1Sm", "primeiro samuel": "1Sm",
  "2 samuel": "2Sm", "2samuel": "2Sm", "segundo samuel": "2Sm",
  "1 reis": "1Rs", "1reis": "1Rs", "primeiro reis": "1Rs",
  "2 reis": "2Rs", "2reis": "2Rs", "segundo reis": "2Rs",
  "1 cronicas": "1Cr", "1 crônicas": "1Cr", "1cronicas": "1Cr", "primeiro cronicas": "1Cr",
  "2 cronicas": "2Cr", "2 crônicas": "2Cr", "2cronicas": "2Cr", "segundo cronicas": "2Cr",
  "esdras": "Ed",
  "neemias": "Ne",
  "ester": "Et", "estér": "Et",
  "jo": "Jó", "jó": "Jó",
  "salmos": "Sl", "salmo": "Sl",
  "proverbios": "Pv", "provérbios": "Pv",
  "eclesiastes": "Ec",
  "cantico dos canticos": "Ct", "cântico dos cânticos": "Ct", "canticos": "Ct", "cânticos": "Ct", "cantares": "Ct", "cantares de salomao": "Ct",
  "isaias": "Is", "isaías": "Is",
  "jeremias": "Jr",
  "lamentacoes": "Lm", "lamentações": "Lm",
  "ezequiel": "Ez",
  "daniel": "Dn",
  "oseias": "Os", "oséias": "Os",
  "joel": "Jl",
  "amos": "Am", "amós": "Am",
  "obadias": "Ob",
  "jonas": "Jn", "jonás": "Jn",
  "miqueias": "Mq",
  "naum": "Na",
  "habacuque": "Hc",
  "sofonias": "Sf",
  "ageu": "Ag",
  "zacarias": "Zc",
  "malaquias": "Ml",

  // Novo Testamento
  "mateus": "Mt",
  "marcos": "Mc",
  "lucas": "Lc",
  "joao": "Jo", "joão": "Jo",
  "atos": "At", "atos dos apostolos": "At",
  "romanos": "Rm",
  "1 corintios": "1Co", "1 coríntios": "1Co", "1corintios": "1Co", "primeiro corintios": "1Co",
  "2 corintios": "2Co", "2 coríntios": "2Co", "2corintios": "2Co", "segundo corintios": "2Co",
  "galatas": "Gl", "gálatas": "Gl",
  "efesios": "Ef", "efésios": "Ef",
  "filipenses": "Fp",
  "colossenses": "Cl",
  "1 tessalonicenses": "1Ts", "1tessalonicenses": "1Ts", "primeiro tessalonicenses": "1Ts",
  "2 tessalonicenses": "2Ts", "2tessalonicenses": "2Ts", "segundo tessalonicenses": "2Ts",
  "1 timoteo": "1Tm", "1 timóteo": "1Tm", "1timoteo": "1Tm", "primeiro timoteo": "1Tm",
  "2 timoteo": "2Tm", "2 timóteo": "2Tm", "2timoteo": "2Tm", "segundo timoteo": "2Tm",
  "tito": "Tt",
  "filemom": "Fm", "filêmon": "Fm", "filemon": "Fm",
  "hebreus": "Hb",
  "tiago": "Tg",
  "1 pedro": "1Pe", "1pedro": "1Pe", "primeiro pedro": "1Pe",
  "2 pedro": "2Pe", "2pedro": "2Pe", "segundo pedro": "2Pe",
  "1 joao": "1Jo", "1 joão": "1Jo", "1joao": "1Jo", "primeiro joao": "1Jo",
  "2 joao": "2Jo", "2 joão": "2Jo", "2joao": "2Jo", "segundo joao": "2Jo",
  "3 joao": "3Jo", "3 joão": "3Jo", "3joao": "3Jo", "terceiro joao": "3Jo",
  "judas": "Jd",
  "apocalipse": "Ap", "revelacao": "Ap", "revelação": "Ap"
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Converts "primeiro/segundo/terceiro" to numerals and common variants
const normalizeOrdinals = (s: string) =>
  s
    .replace(/primeir[oa]/g, "1")
    .replace(/segund[oa]/g, "2")
    .replace(/terceir[oa]/g, "3");

// Converte números por extenso em PT-BR (até 199) para dígitos dentro do texto normalizado
const wordsToDigitsInText = (s: string) => {
  const units: Record<string, number> = {
    'zero': 0, 'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'tres': 3, 'quatro': 4,
    'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9
  };
  const teens: Record<string, number> = {
    'dez': 10, 'onze': 11, 'doze': 12, 'treze': 13, 'catorze': 14, 'quatorze': 14,
    'quinze': 15, 'dezesseis': 16, 'dezessete': 17, 'dezoito': 18, 'dezenove': 19
  };
  const tens: Record<string, number> = {
    'vinte': 20, 'trinta': 30, 'quarenta': 40, 'cinquenta': 50,
    'sessenta': 60, 'setenta': 70, 'oitenta': 80, 'noventa': 90
  };

  const parseNumberWords = (tokens: string[], start: number): { value: number; length: number } => {
    let i = start;
    let value = 0;
    let consumed = 0;
    let matched = false;

    // centenas simples suportadas
    if (tokens[i] === 'cem') {
      return { value: 100, length: 1 };
    }
    if (tokens[i] === 'cento') {
      value = 100;
      i += 1; consumed += 1; matched = true;
      if (tokens[i] === 'e') { i += 1; consumed += 1; }
    }

    // teens (10-19) tem prioridade sobre dez + unidade
    if (teens[tokens[i]]) {
      value += teens[tokens[i]];
      consumed += 1; matched = true;
      return { value, length: consumed };
    }

    // dezenas (20-90) possivelmente seguidas de "e" + unidade
    if (tens[tokens[i]]) {
      value += tens[tokens[i]]; i += 1; consumed += 1; matched = true;
      if (tokens[i] === 'e') { i += 1; consumed += 1; }
      if (units[tokens[i]] !== undefined) { value += units[tokens[i]]; consumed += 1; }
      return { value, length: consumed };
    }

    // unidade isolada
    if (units[tokens[i]] !== undefined) {
      value += units[tokens[i]]; consumed += 1; matched = true;
      return { value, length: consumed };
    }

    return { value: 0, length: 0 };
  };

  const tokens = s.split(' ');
  const out: string[] = [];
  for (let i = 0; i < tokens.length; ) {
    const { value, length } = parseNumberWords(tokens, i);
    if (length > 0) {
      out.push(String(value));
      i += length;
    } else {
      out.push(tokens[i]);
      i += 1;
    }
  }
  return out.join(' ');
};

export const parseBibleReferencePT = (input: string): string | null => {
  if (!input) return null;
  const text = wordsToDigitsInText(normalizeOrdinals(normalize(input)));

  // Try to find a book key (longest first)
  const keys = Object.keys(booksPT).sort((a, b) => b.length - a.length);
  let matchedKey: string | null = null;
  let abbrev = "";
  let idx = -1;

  for (const key of keys) {
    const re = new RegExp(`(^|\\b)${key}(\\b)`, "i");
    const m = text.match(re);
    if (m) {
      matchedKey = key;
      abbrev = booksPT[key];
      idx = m.index !== undefined ? m.index + m[0].length : -1;
      break;
    }
  }

  if (!matchedKey) return null;

  // Look for chapter and verse numbers after the matched book name
  const rest = text.slice(idx).trim();
  // Accept patterns like: 3:16, 3 16, cap 3 vers 16, capítulo 3 versículo 16 (após conversão de números por extenso)
  const numMatch = rest.match(/(\d{1,3})\D+(\d{1,3})/);
  if (!numMatch) return null;

  const chapter = numMatch[1];
  const verse = numMatch[2];
  if (!chapter || !verse) return null;

  return `${abbrev} ${chapter}:${verse}`;
};
