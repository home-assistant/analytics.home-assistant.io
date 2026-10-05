// Population per country/territory, keyed by the ISO 3166-1 alpha-2 codes used
// by svgMap. The numbers are only used to normalize the installation map, so
// the shading shows how widespread Home Assistant is relative to the number of
// people living in a country instead of the absolute installation count.
//
// Source: World Bank population estimates (2018) as published in the
// country-json dataset (https://github.com/samayo/country-json), completed
// with estimates from the same period for the territories it does not cover
// (AX, BQ, CW, IM, JE, SX, TW and XK).
//
// Territories without a permanent population have a population of 0, those are
// excluded from the map instead of being scaled.
//
// Since these values only determine the color scale of the map, they do not
// need to be updated for every change in population.

const COUNTRY_POPULATION = {
  AD: 77006, // Andorra
  AE: 9630959, // United Arab Emirates
  AF: 37172386, // Afghanistan
  AG: 96286, // Antigua and Barbuda
  AI: 15094, // Anguilla
  AL: 2866376, // Albania
  AM: 2951776, // Armenia
  AO: 30809762, // Angola
  AQ: 1106, // Antarctica
  AR: 44494502, // Argentina
  AS: 55465, // American Samoa
  AT: 8840521, // Austria
  AU: 24982688, // Australia
  AW: 105845, // Aruba
  AX: 29789, // Åland Islands
  AZ: 9939800, // Azerbaijan
  BA: 3323929, // Bosnia and Herzegovina
  BB: 286641, // Barbados
  BD: 161356039, // Bangladesh
  BE: 11433256, // Belgium
  BF: 19751535, // Burkina Faso
  BG: 7025037, // Bulgaria
  BH: 1569439, // Bahrain
  BI: 11175378, // Burundi
  BJ: 11485048, // Benin
  BM: 63973, // Bermuda
  BN: 428962, // Brunei Darussalam
  BO: 11353142, // Bolivia
  BQ: 25157, // Caribbean Netherlands
  BR: 209469333, // Brazil
  BS: 385640, // Bahamas
  BT: 754394, // Bhutan
  BW: 2254126, // Botswana
  BY: 9483499, // Belarus
  BZ: 383071, // Belize
  CA: 37057765, // Canada
  CC: 596, // Cocos Islands
  CD: 84068091, // Democratic Republic of the Congo
  CF: 4666377, // Central African Republic
  CG: 5244363, // Congo
  CH: 8513227, // Switzerland
  CI: 25069229, // Ivory Coast
  CK: 17379, // Cook Islands
  CL: 18729160, // Chile
  CM: 25216237, // Cameroon
  CN: 1392730000, // China
  CO: 49648685, // Colombia
  CR: 4999441, // Costa Rica
  CU: 11338138, // Cuba
  CV: 543767, // Cape Verde
  CW: 160012, // Curaçao
  CX: 1402, // Christmas Island
  CY: 1189265, // Cyprus
  CZ: 10629928, // Czech Republic
  DE: 82905782, // Germany
  DJ: 958920, // Djibouti
  DK: 5793636, // Denmark
  DM: 71625, // Dominica
  DO: 10627165, // Dominican Republic
  DZ: 42228429, // Algeria
  EC: 17084357, // Ecuador
  EE: 1321977, // Estonia
  EG: 98423595, // Egypt
  EH: 652271, // Western Sahara
  ER: 6213972, // Eritrea
  ES: 46796540, // Spain
  ET: 109224559, // Ethiopia
  FI: 5515525, // Finland
  FJ: 883483, // Fiji
  FK: 2840, // Falkland Islands
  FM: 112640, // Federated States of Micronesia
  FO: 48497, // Faroe Islands
  FR: 66977107, // France
  GA: 2119275, // Gabon
  GB: 66460344, // United Kingdom
  GD: 111454, // Grenada
  GE: 3726549, // Georgia
  GF: 290691, // French Guiana
  GH: 29767108, // Ghana
  GI: 33718, // Gibraltar
  GL: 56025, // Greenland
  GM: 2280102, // Gambia
  GN: 12414318, // Guinea
  GP: 395700, // Guadeloupe
  GQ: 1308974, // Equatorial Guinea
  GR: 10731726, // Greece
  GS: 30, // South Georgia and the South Sandwich Islands
  GT: 17247807, // Guatemala
  GU: 165768, // Guam
  GW: 1874309, // Guinea-Bissau
  GY: 779004, // Guyana
  HK: 7451000, // Hong Kong
  HN: 9587522, // Honduras
  HR: 4087843, // Croatia
  HT: 11123176, // Haiti
  HU: 9775564, // Hungary
  ID: 267663435, // Indonesia
  IE: 4867309, // Ireland
  IL: 8882800, // Israel
  IM: 84077, // Isle of Man
  IN: 1352617328, // India
  IO: 0, // British Indian Ocean Territory
  IQ: 38433600, // Iraq
  IR: 81800269, // Iran
  IS: 352721, // Iceland
  IT: 60421760, // Italy
  JE: 106800, // Jersey
  JM: 2934855, // Jamaica
  JO: 9956011, // Jordan
  JP: 126529100, // Japan
  KE: 51393010, // Kenya
  KG: 6322800, // Kyrgyzstan
  KH: 16249798, // Cambodia
  KI: 115847, // Kiribati
  KM: 832322, // Comoros
  KN: 52441, // Saint Kitts and Nevis
  KP: 25549819, // North Korea
  KR: 51606633, // South Korea
  KW: 4137309, // Kuwait
  KY: 64174, // Cayman Islands
  KZ: 18272430, // Kazakhstan
  LA: 7061507, // Laos
  LB: 6848925, // Lebanon
  LC: 181889, // Saint Lucia
  LI: 37910, // Liechtenstein
  LK: 21670000, // Sri Lanka
  LR: 4818977, // Liberia
  LS: 2108132, // Lesotho
  LT: 2801543, // Lithuania
  LU: 607950, // Luxembourg
  LV: 1927174, // Latvia
  LY: 6678567, // Libya
  MA: 36029138, // Morocco
  MC: 38682, // Monaco
  MD: 2706049, // Moldova
  ME: 631219, // Montenegro
  MG: 26262368, // Madagascar
  MH: 58413, // Marshall Islands
  MK: 2084367, // Macedonia
  ML: 19077690, // Mali
  MM: 53708395, // Myanmar
  MN: 3170208, // Mongolia
  MO: 631636, // Macau
  MP: 56882, // Northern Mariana Islands
  MQ: 376480, // Martinique
  MR: 4403319, // Mauritania
  MS: 5900, // Montserrat
  MT: 484630, // Malta
  MU: 1265303, // Mauritius
  MV: 515696, // Maldives
  MW: 18143315, // Malawi
  MX: 126190788, // Mexico
  MY: 31528585, // Malaysia
  MZ: 29495962, // Mozambique
  NA: 2448255, // Namibia
  NC: 284060, // New Caledonia
  NE: 22442948, // Niger
  NF: 2169, // Norfolk Island
  NG: 195874740, // Nigeria
  NI: 6465513, // Nicaragua
  NL: 17231624, // Netherlands
  NO: 5311916, // Norway
  NP: 28087871, // Nepal
  NR: 12704, // Nauru
  NU: 1624, // Niue
  NZ: 4841000, // New Zealand
  OM: 4829483, // Oman
  PA: 4176873, // Panama
  PE: 31989256, // Peru
  PF: 277679, // French Polynesia
  PG: 8606316, // Papua New Guinea
  PH: 106651922, // Philippines
  PK: 212215030, // Pakistan
  PL: 37974750, // Poland
  PM: 5888, // Saint Pierre and Miquelon
  PN: 67, // Pitcairn Islands
  PR: 3195153, // Puerto Rico
  PS: 4569087, // Palestine
  PT: 10283822, // Portugal
  PW: 17907, // Palau
  PY: 6956071, // Paraguay
  QA: 2781677, // Qatar
  RE: 859959, // Reunion
  RO: 19466145, // Romania
  RS: 6963764, // Serbia
  RU: 144478050, // Russia
  RW: 12301939, // Rwanda
  SA: 33699947, // Saudi Arabia
  SB: 652858, // Solomon Islands
  SC: 96762, // Seychelles
  SD: 41801533, // Sudan
  SE: 10175214, // Sweden
  SG: 5638676, // Singapore
  SH: 6600, // Saint Helena
  SI: 2073894, // Slovenia
  SJ: 2572, // Svalbard and Jan Mayen
  SK: 5446771, // Slovakia
  SL: 7650154, // Sierra Leone
  SM: 33785, // San Marino
  SN: 15854360, // Senegal
  SO: 15008154, // Somalia
  SR: 575991, // Suriname
  SS: 10975920, // South Sudan
  ST: 211028, // São Tomé and Príncipe
  SV: 6420744, // El Salvador
  SX: 41109, // Sint Maarten
  SY: 16906283, // Syria
  SZ: 1136191, // Eswatini
  TC: 37665, // Turks and Caicos Islands
  TD: 15477751, // Chad
  TF: 0, // French Southern Territories
  TG: 7889094, // Togo
  TH: 69428524, // Thailand
  TJ: 9100837, // Tajikistan
  TK: 1411, // Tokelau
  TL: 1267972, // Timor-Leste
  TM: 5850908, // Turkmenistan
  TN: 11565204, // Tunisia
  TO: 103197, // Tonga
  TR: 82319724, // Turkey
  TT: 1389858, // Trinidad and Tobago
  TV: 11508, // Tuvalu
  TW: 23588932, // Taiwan
  TZ: 56318348, // Tanzania
  UA: 44622516, // Ukraine
  UG: 42723139, // Uganda
  UM: 300, // United States Minor Outlying Islands
  US: 326687501, // United States
  UY: 3449299, // Uruguay
  UZ: 32955400, // Uzbekistan
  VA: 825, // Vatican City
  VC: 110210, // Saint Vincent and the Grenadines
  VE: 28870195, // Venezuela
  VG: 29802, // British Virgin Islands
  VI: 106977, // United States Virgin Islands
  VN: 95540395, // Vietnam
  VU: 292680, // Vanuatu
  WF: 15289, // Wallis and Futuna
  WS: 196130, // Samoa
  XK: 1797085, // Kosovo
  YE: 28498687, // Yemen
  YT: 270372, // Mayotte
  ZA: 57779622, // South Africa
  ZM: 17351822, // Zambia
  ZW: 14439018, // Zimbabwe
};

module.exports = { COUNTRY_POPULATION };
