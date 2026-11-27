/**
 * Validation utilities for Slovenian addresses and phone numbers
 */

/**
 * Validate Slovenian postal code (4 digits: 1000-9999)
 * Major postal codes: 1000 Ljubljana, 2000 Maribor, 3000 Celje, 4000 Kranj, 5000 Nova Gorica
 */
export function validateSlovenianPostalCode(postalCode: string): boolean {
  const cleaned = postalCode.replace(/\s/g, '');
  // Must be exactly 4 digits, starting with 1-9 (not 0)
  const postalCodeRegex = /^[1-9]\d{3}$/;
  return postalCodeRegex.test(cleaned);
}

/**
 * Validate full name (must contain at least first name and last name)
 * Prevents single letters like "darko m"
 */
export function validateFullName(name: string): boolean {
  const trimmed = name.trim();

  // Must be at least 3 characters total
  if (trimmed.length < 3) return false;

  // Split by spaces and filter out empty strings
  const nameParts = trimmed.split(/\s+/).filter(part => part.length > 0);

  // Must have at least 2 parts (first name + last name)
  if (nameParts.length < 2) return false;

  // Each part must be at least 2 characters (no single letters)
  return nameParts.every(part => part.length >= 2);
}

/**
 * Validate Slovenian phone number based on official Wikipedia data
 * Mobile operators and their prefixes:
 * - A1 Slovenija: 030, 040, 068, 069
 * - Telekom Slovenije: 031, 041, 051, 065
 * - Telemach: 070, 071
 * - T-2: 064
 * - Mega M: 065
 * Landline area codes: 01, 02, 03, 04, 05, 07
 */
export function validateSlovenianPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // Remove +386/386 prefix if present; Slovenian numbers drop the trunk 0
  // in international format, so restore it (+386 41 234 567 → 041234567)
  let withoutCountryCode = cleaned;
  if (cleaned.startsWith('+386')) {
    withoutCountryCode = '0' + cleaned.substring(4);
  } else if (cleaned.startsWith('00386')) {
    withoutCountryCode = '0' + cleaned.substring(5);
  } else if (cleaned.startsWith('386')) {
    withoutCountryCode = '0' + cleaned.substring(3);
  }

  // Mobile numbers (9 digits) - Based on official operator prefixes
  const mobileRegex = /^(030|031|040|041|051|064|065|068|069|070|071)\d{6}$/;

  // Landline numbers (8 digits) - Based on official area codes
  const landlineRegex = /^(01|02|03|04|05|07)\d{6}$/;

  return mobileRegex.test(withoutCountryCode) || landlineRegex.test(withoutCountryCode);
}

/**
 * Format Slovenian phone number for display
 */
export function formatSlovenianPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Remove +386 prefix if present
  const withoutCountryCode = cleaned.startsWith('+386') 
    ? cleaned.substring(4) 
    : cleaned.startsWith('386') 
    ? cleaned.substring(3)
    : cleaned;
  
  // Format mobile numbers (9 digits)
  if (withoutCountryCode.length === 9) {
    return withoutCountryCode.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  
  // Format landline numbers (8 digits)
  if (withoutCountryCode.length === 8) {
    return withoutCountryCode.replace(/(\d{2})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  
  return withoutCountryCode;
}

/**
 * Comprehensive list of Slovenian cities, towns, and municipalities for autocomplete
 */
export const SLOVENIAN_CITIES = [
  // Major cities
  'Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje', 'Koper', 'Novo mesto', 'Ptuj',
  'Trbovlje', 'Kamnik', 'Jesenice', 'Nova Gorica', 'Domžale', 'Škofja Loka', 'Murska Sobota',
  'Slovenj Gradec', 'Krško', 'Postojna', 'Litija', 'Sevnica', 'Ajdovščina', 'Idrija', 'Metlika',
  'Radovljica', 'Lendava', 'Piran', 'Izola', 'Portorož', 'Bled', 'Bohinj', 'Bovec', 'Tolmin',
  'Kobarid', 'Sežana', 'Divača', 'Ilirska Bistrica', 'Ribnica', 'Kočevje', 'Črnomelj', 'Brežice',
  'Trebnje', 'Grosuplje', 'Ivančna Gorica', 'Moravče', 'Mengeš', 'Vodice', 'Komenda', 'Medvode',
  'Vrhnika', 'Logatec', 'Cerknica', 'Borovnica', 'Horjul',

  // Additional municipalities and towns
  'Beltinci', 'Benedikt', 'Bistrica ob Sotli', 'Bled', 'Bloke', 'Bohinj', 'Borovnica', 'Bovec',
  'Braslovče', 'Brda', 'Brezovica', 'Brežice', 'Cankova', 'Cerklje na Gorenjskem', 'Cerknica',
  'Cerkno', 'Cerkvenjak', 'Cirkulane', 'Črenšovci', 'Črna na Koroškem', 'Črnomelj', 'Destrnik',
  'Divača', 'Dobje', 'Dobrepolje', 'Dobrna', 'Dobrova-Polhov Gradec', 'Dobrovnik', 'Dol pri Ljubljani',
  'Dolenjske Toplice', 'Duplek', 'Gorenja vas-Poljane', 'Gorišnica', 'Gornja Radgona', 'Gornji Grad',
  'Gornji Petrovci', 'Grad', 'Grosuplje', 'Hajdina', 'Hoče-Slivnica', 'Hodoš', 'Hrpelje-Kozina',
  'Idrija', 'Ig', 'Ilirska Bistrica', 'Ivančna Gorica', 'Izola', 'Jezersko', 'Juršinci', 'Kamnik',
  'Kanal', 'Kidričevo', 'Kobarid', 'Kobilje', 'Kočevje', 'Komen', 'Komenda', 'Koper', 'Kostanjevica na Krki',
  'Kostel', 'Kozje', 'Kranj', 'Kranjska Gora', 'Križevci', 'Krško', 'Kungota', 'Kuzma', 'Laško',
  'Lenart', 'Lendava', 'Litija', 'Ljubno', 'Ljutomer', 'Log-Dragomer', 'Logatec', 'Loška dolina',
  'Loški Potok', 'Lovrenc na Pohorju', 'Luče', 'Lukovica', 'Majšperk', 'Makole', 'Maribor', 'Markovci',
  'Medvode', 'Mengeš', 'Metlika', 'Mežica', 'Miklavž na Dravskem polju', 'Miren-Kostanjevica', 'Mirna',
  'Mirna Peč', 'Mislinja', 'Mokronog-Trebelno', 'Moravče', 'Moravske Toplice', 'Mozirje', 'Murska Sobota',
  'Muta', 'Naklo', 'Nazarje', 'Nova Gorica', 'Novo mesto', 'Odranci', 'Oplotnica', 'Ormož', 'Osilnica',
  'Pesnica', 'Piran', 'Pivka', 'Podčetrtek', 'Podlehnik', 'Podvelka', 'Poljčane', 'Polzela', 'Postojna',
  'Prebold', 'Preddvor', 'Prevalje', 'Ptuj', 'Puconci', 'Rače-Fram', 'Radeče', 'Radenci', 'Radlje ob Dravi',
  'Radovljica', 'Ravne na Koroškem', 'Razkrižje', 'Rečica ob Savinji', 'Renče-Vogrsko', 'Ribnica',
  'Ribnica na Pohorju', 'Rogaška Slatina', 'Rogašovci', 'Rogatec', 'Ruše', 'Šalovci', 'Selnica ob Dravi',
  'Semič', 'Sevnica', 'Sežana', 'Slovenj Gradec', 'Slovenska Bistrica', 'Slovenske Konjice', 'Šmarje pri Jelšah',
  'Šmarješke Toplice', 'Šmartno ob Paki', 'Šmartno pri Litiji', 'Sodražica', 'Solčava', 'Šoštanj',
  'Starše', 'Štore', 'Straža', 'Sveta Ana', 'Sveta Trojica v Slovenskih goricah', 'Sveti Andraž v Slovenskih goricah',
  'Sveti Jurij ob Ščavnici', 'Sveti Jurij v Slovenskih goricah', 'Sveti Tomaž', 'Šentilj', 'Šentjernej',
  'Šentjur', 'Šentrupert', 'Škocjan', 'Škofja Loka', 'Škofljica', 'Tabor', 'Tišina', 'Tolmin', 'Trbovlje',
  'Trebnje', 'Trnovska vas', 'Trzin', 'Tržič', 'Turnišče', 'Velenje', 'Velika Polana', 'Velike Lašče',
  'Veržej', 'Videm', 'Vipava', 'Vitanje', 'Vodice', 'Vojnik', 'Vransko', 'Vrhnika', 'Vuzenica', 'Zagorje ob Savi',
  'Zavrč', 'Zreče', 'Žalec', 'Železniki', 'Žetale', 'Žiri', 'Žirovnica', 'Žužemberk'
];

/**
 * Validate if city looks like a real Slovenian city name
 * More lenient approach - blocks obvious nonsense but allows real places
 */
export function validateSlovenianCity(city: string): boolean {
  const trimmed = city.trim();

  // Must be at least 2 characters
  if (trimmed.length < 2) return false;

  // Must contain only letters, spaces, hyphens, apostrophes and Slovenian characters
  const validCharsRegex = /^[a-zA-ZčćžšđČĆŽŠĐ\s\-']+$/;
  if (!validCharsRegex.test(trimmed)) return false;

  // Block only very obvious nonsense patterns (be very restrictive here)
  const nonsensePatterns = [
    /^[a-z]{1,4}$/i,           // Very short random letters like "dsda", "abc", "xy", "abcd"
    /^[a-z]\s*[a-z]$/i,        // Single letters like "d s", "a b"
    /^\d+$/,                   // Only numbers like "123"
    /^[a-z]{1,2}\d+$/i,        // Letters + numbers like "ab123", "x5"
    /^[bcdfghjklmnpqrstvwxyz]{4,}$/i, // Only consonants, no vowels (like "dsda")
  ];

  // If it matches obvious nonsense patterns, reject it
  if (nonsensePatterns.some(pattern => pattern.test(trimmed))) {
    return false;
  }

  // Check if it's in our comprehensive cities list
  const normalizedCity = trimmed.toLowerCase();
  const isKnownCity = SLOVENIAN_CITIES.some(slovenianCity =>
    slovenianCity.toLowerCase() === normalizedCity
  );

  // If it's a known city, definitely allow it
  if (isKnownCity) return true;

  // For unknown cities, be very lenient - allow anything reasonable
  // Must have at least one vowel to look like a real word
  const hasVowel = /[aeiouAEIOU]/.test(trimmed);

  // Allow if it has vowels and reasonable length (covers all villages, districts, etc.)
  return hasVowel && trimmed.length >= 3 && trimmed.length <= 50;
}

/**
 * Validate Slovenian address format
 * Must contain street name and house number
 */
export function validateSlovenianAddressFormat(address: string): boolean {
  const trimmed = address.trim();

  // Must be at least 5 characters
  if (trimmed.length < 5) return false;

  // Must contain at least one letter (street name) and one number (house number)
  const hasLetter = /[a-zA-ZčćžšđČĆŽŠĐ]/.test(trimmed);
  const hasNumber = /\d/.test(trimmed);

  if (!hasLetter || !hasNumber) return false;

  // Split by spaces and check structure
  const parts = trimmed.split(/\s+/).filter(part => part.length > 0);

  // Must have at least 2 parts (street name + house number)
  if (parts.length < 2) return false;

  // Check if it looks like a real address (not just random characters)
  const invalidPatterns = [
    /^[a-z]{1,3}\s*\d{1,2}$/i, // Too short like "dsj 3"
    /^[a-z]\s*[a-z]\s*\d$/i,   // Single letters like "d s 3"
    /^[a-z]{1,2}\d+$/i,        // No space like "ds3"
  ];

  return !invalidPatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Get city suggestions for autocomplete
 */
export function getSlovenianCitySuggestions(input: string, limit: number = 5): string[] {
  const normalizedInput = input.trim().toLowerCase();
  if (normalizedInput.length < 2) return [];
  
  return SLOVENIAN_CITIES
    .filter(city => city.toLowerCase().startsWith(normalizedInput))
    .slice(0, limit);
}

/**
 * Comprehensive validation for Slovenian address and personal data
 */
export interface SlovenianValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    postalCode?: string;
    phone?: string;
    city?: string;
    address?: string;
  };
}

export function validateSlovenianData(data: {
  name?: string;
  postalCode: string;
  phone?: string;
  city: string;
  address?: string;
}): SlovenianValidationResult {
  const errors: { name?: string; postalCode?: string; phone?: string; city?: string; address?: string } = {};

  // Validate full name if provided
  if (data.name && !validateFullName(data.name)) {
    errors.name = 'Prosimo, vnesite polno ime (ime in priimek, vsaj 2 črki za vsak del)';
  }

  // Validate postal code
  if (!validateSlovenianPostalCode(data.postalCode)) {
    errors.postalCode = 'Prosimo, vnesite veljavno 4-mestno poštno številko (1000-9999)';
  }

  // Validate phone number if provided
  if (data.phone && !validateSlovenianPhoneNumber(data.phone)) {
    errors.phone = 'Prosimo, vnesite veljavno slovensko telefonsko številko (npr. 041234567, 031234567)';
  }

  // Validate address if provided
  if (data.address && !validateSlovenianAddressFormat(data.address)) {
    errors.address = 'Prosimo, vnesite veljaven naslov (npr. Slovenska cesta 1)';
  }

  // Validate city - now with error for invalid cities
  if (!validateSlovenianCity(data.city)) {
    errors.city = 'Prosimo, vnesite veljavno slovensko mesto (npr. Ljubljana, Maribor, Celje)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Country-aware checkout validation.
 * Strict Slovenian rules apply only when shipping to Slovenija;
 * other countries get lenient international checks.
 */
export function validateCheckoutData(data: {
  name?: string;
  postalCode: string;
  phone?: string;
  city: string;
  address?: string;
  country?: string;
}): SlovenianValidationResult {
  const isSlovenia = !data.country || data.country === 'Slovenija' || data.country === 'Slovenia';
  if (isSlovenia) {
    return validateSlovenianData(data);
  }

  const errors: SlovenianValidationResult['errors'] = {};

  if (data.name && !validateFullName(data.name)) {
    errors.name = 'Please enter your full name (first and last name)';
  }

  // International postal codes: 3-10 alphanumeric characters
  const postalCleaned = data.postalCode.replace(/[\s\-]/g, '');
  if (!/^[A-Za-z0-9]{3,10}$/.test(postalCleaned)) {
    errors.postalCode = 'Please enter a valid postal code';
  }

  // International phone numbers: digits with optional + prefix, 8-15 digits
  if (data.phone) {
    const phoneCleaned = data.phone.replace(/[\s\-\(\)\.]/g, '');
    if (!/^\+?\d{8,15}$/.test(phoneCleaned)) {
      errors.phone = 'Please enter a valid phone number';
    }
  }

  // Lenient city check — at least 2 letters
  if (!/^[\p{L}\s\-'.]{2,}$/u.test(data.city.trim())) {
    errors.city = 'Please enter a valid city';
  }

  // Lenient address check — at least 5 chars, contains a letter and a number
  if (data.address) {
    const addr = data.address.trim();
    if (addr.length < 5 || !/\p{L}/u.test(addr) || !/\d/.test(addr)) {
      errors.address = 'Please enter a valid address';
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

// Keep the old function for backward compatibility
export function validateSlovenianAddress(address: {
  postalCode: string;
  phone?: string;
  city: string;
}): SlovenianValidationResult {
  return validateSlovenianData(address);
}
