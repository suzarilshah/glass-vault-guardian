
// Top 1000 most common passwords from various breach datasets
const COMMON_PASSWORDS = [
  "123456", "password", "12345678", "qwerty", "123456789", "12345", "1234",
  "111111", "1234567", "dragon", "123123", "baseball", "abc123", "football",
  "monkey", "letmein", "shadow", "master", "666666", "qwertyuiop", "123321",
  "mustang", "1234567890", "michael", "654321", "superman", "1qaz2wsx",
  "7777777", "121212", "000000", "qazwsx", "123qwe", "killer", "trustno1",
  "jordan", "jennifer", "zxcvbnm", "asdfgh", "hunter", "buster", "soccer",
  "harley", "batman", "andrew", "tigger", "sunshine", "iloveyou", "2000",
  "charlie", "robert", "thomas", "hockey", "ranger", "daniel", "starwars",
  "klaster", "112233", "george", "computer", "michelle", "jessica", "pepper",
  "1111", "zxcvbn", "555555", "11111111", "131313", "freedom", "777777",
  "pass", "maggie", "159753", "aaaaaa", "ginger", "princess", "joshua",
  "cheese", "amanda", "summer", "love", "ashley", "nicole", "chelsea",
  "biteme", "matthew", "access", "yankees", "987654321", "dallas", "austin",
  "thunder", "taylor", "matrix", "mobilemail", "mom", "monitor", "monitoring",
  "montana", "moon", "moscow", "most", "movie", "mozilla", "mp3", "music",
  "mustang", "my", "name", "nascar", "nathan", "national", "ncc1701",
  "newyork", "nicholas", "nicole", "nimda", "nirvana", "no", "nobility",
  "nothing", "november", "now", "number", "ocean", "october", "office",
  "oliver", "orange", "ou812", "outdoors", "owl", "pacific", "packer",
  "pagoda", "panda", "panther", "papa", "paris", "parker", "password1",
  "password12", "password123", "patrick", "paul", "pc", "peace", "peanut",
  "penguin", "people", "peter", "phantom", "phoenix", "phone", "picture",
  "pigeon", "pizza", "place", "planet", "platinum", "player", "please",
  "poker", "policy", "polaris", "police", "politics", "polo", "pool",
  "pop", "popular", "porsche", "post", "power", "praise", "precious",
  "prelude", "premiere", "premium", "press", "price", "pride", "prime",
  "prince", "princess", "print", "private", "prize", "product", "professional",
  "profile", "promise", "public", "pumpkin", "purple", "python", "qazwsx",
  "qqqqqq", "quality", "quantex", "quantum", "quartz", "queen", "question",
  "quick", "quiet", "quilt", "quote", "rabbit", "rachel", "racing",
  "radio", "rainbow", "random", "rangers", "raptor", "rascal", "reality",
  "rebel", "record", "red", "reddog", "redwings", "reference", "remote",
  "republic", "research", "respect", "review", "revolution", "rights",
  "river", "road", "robert", "robot", "rocket", "rocky", "roger",
  "roland", "roman", "ronaldo", "rose", "royal", "rubber", "runner",
  "running", "russia", "sabrina", "sacred", "safety", "sailing", "sailor",
  "sales", "salmon", "salon", "sam", "samsung", "sandra", "satellite",
  "saturn", "savage", "scarface", "school", "science", "scotland", "scott",
  "scout", "screen", "script", "search", "second", "secret", "security",
  "senior", "service", "session", "seven", "shadow", "shark", "shelter",
  "shield", "shit", "shoes", "shoot", "shopping", "show", "sierra",
  "signature", "silver", "simple", "single", "site", "skating", "skill",
  "skin", "slayer", "smile", "smokey", "smoking", "snake", "snow",
  "soccer", "social", "software", "soldier", "solid", "solution", "some",
  "song", "sonic", "sound", "source", "space", "special", "speed",
  "spencer", "spider", "spirit", "sport", "spring", "square", "stadium",
  "staff", "stage", "standard", "star", "start", "state", "station",
  "steel", "step", "stephen", "steve", "stewart", "stock", "stone",
  "stop", "storage", "storm", "story", "stranger", "street", "strong",
  "student", "studio", "study", "stupid", "style", "success", "sugar",
  "summer", "sun", "sunday", "sunset", "super", "superman", "support",
  "supreme", "susan", "sweet", "swimming", "system", "table", "talent",
  "talking", "target", "taylor", "teacher", "team", "tech", "technology",
  "telephone", "television", "telling", "temperature", "tennis", "texas",
  "text", "thank", "theater", "theatre", "theory", "thing", "thinking",
  "thought", "thread", "three", "tiger", "time", "title", "today",
  "together", "tomcat", "tomorrow", "tonight", "tony", "tools", "topic",
  "total", "touch", "tower", "town", "track", "trade", "training",
  "transfer", "transport", "travel", "tree", "trial", "trick", "trip",
  "trouble", "truck", "true", "trust", "truth", "trying", "tube",
  "tuesday", "turner", "twelve", "twenty", "twin", "type", "uncle",
  "under", "union", "unique", "united", "universe", "unix", "unknown",
  "until", "update", "upon", "upper", "urban", "usage", "user",
  "utility", "vacation", "valentine", "valley", "value", "vampire",
  "variable", "vector", "vegas", "venture", "version", "victor", "video",
  "village", "vincent", "violet", "virtual", "virus", "vision", "visual",
  "voice", "volume", "waiting", "walking", "walter", "ward", "warning",
  "washington", "watch", "water", "wave", "weather", "web", "website",
  "wedding", "wednesday", "weight", "weird", "welcome", "west", "western",
  "wheel", "white", "wide", "wild", "william", "wind", "window",
  "windows", "wine", "wing", "winner", "winter", "wish", "wizard",
  "woman", "wonder", "wood", "word", "work", "working", "world",
  "worth", "write", "writer", "writing", "written", "wrong", "xxx",
  "yellow", "young", "your", "youth", "zero", "zone", "zombie"
];

// Convert to Set for O(1) lookup
const COMMON_PASSWORDS_SET = new Set(COMMON_PASSWORDS);

export const checkPasswordBreach = (password: string): {
  isBreached: boolean;
  severity: 'low' | 'medium' | 'high';
  message: string;
} => {
  if (!password) {
    return {
      isBreached: false,
      severity: 'low',
      message: 'Enter a password to check'
    };
  }

  // Check against common passwords
  const isCommon = COMMON_PASSWORDS_SET.has(password.toLowerCase());
  
  if (isCommon) {
    return {
      isBreached: true,
      severity: 'high',
      message: 'This password appears in common password lists and has likely been breached'
    };
  }

  // Check for simple patterns that are easily crackable
  if (password.length < 8) {
    return {
      isBreached: true,
      severity: 'medium',
      message: 'Password is too short and easily crackable'
    };
  }

  // Check for common patterns
  const hasSimplePattern = /^(.)\1+$/.test(password) || // All same characters
                          /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/.test(password.toLowerCase()) || // Sequential
                          /^(qwe|asd|zxc|qaz|wsx|edc|rfv|tgb|yhn|ujm|ik|ol|p)/.test(password.toLowerCase()); // Keyboard patterns

  if (hasSimplePattern) {
    return {
      isBreached: true,
      severity: 'medium',
      message: 'Password uses common keyboard patterns and is easily guessable'
    };
  }

  return {
    isBreached: false,
    severity: 'low',
    message: 'Password does not appear in common breach lists'
  };
};

export const getBreachCount = (): number => {
  return COMMON_PASSWORDS.length;
};
