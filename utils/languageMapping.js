// utils/languageMapping.js
export const regionTitles = {
  maharashtra: {
    en: 'Marathi Panchang',
    local: 'मराठी पंचांग',
    language: 'Marathi'
  },
  tamilnadu: {
    en: 'Tamil Panchangam',
    local: 'தமிழ் பஞ்சாங்கம்',
    language: 'Tamil'
  },
  kerala: {
    en: 'Malayalam Panchangam',
    local: 'മലയാളം പഞ്ചാംഗം',
    language: 'Malayalam'
  },
  westbengal: {
    en: 'Bengali Panjika',
    local: 'বাংলা পঞ্জিকা',
    language: 'Bengali'
  },
  gujarat: {
    en: 'Gujarati Panchang',
    local: 'ગુજરાતી પંચાંગ',
    language: 'Gujarati'
  },
  odisha: {
    en: 'Odia Panji',
    local: 'ଓଡ଼ିଆ ପଞ୍ଚାଙ୍ଗ',
    language: 'Odia'
  }
};

export const getRegionTitle = (region, type = 'local') => {
  return regionTitles[region]?.[type] || 'Panchang';
};