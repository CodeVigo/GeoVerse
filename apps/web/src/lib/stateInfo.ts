// Curated soil / major-crops / culture notes for Indian states & major UTs.
// Used to populate the "Soil & Crops" and "Culture" tabs on state pages.
// Concise, exam-oriented summaries (not exhaustive).

export interface StateInfo {
  soils: string[];
  crops: string[];
  culture: string[];
}

// Keys are normalised (lowercase) state names for tolerant matching.
export const STATE_INFO: Record<string, StateInfo> = {
  india: {
    soils: [
      "Alluvial soils (Indo-Gangetic plains)",
      "Black (regur) cotton soils (Deccan)",
      "Red & yellow soils (peninsular)",
      "Laterite soils (high-rainfall hills)",
      "Arid/desert, forest & mountain soils",
    ],
    crops: ["Rice", "Wheat", "Sugarcane", "Cotton", "Pulses", "Tea", "Jute", "Oilseeds", "Spices"],
    culture: [
      "8 classical dance forms (Bharatanatyam, Kathak, Odissi, Kathakali…)",
      "Hindustani & Carnatic classical music traditions",
      "Diverse festivals — Diwali, Holi, Eid, Pongal, Durga Puja, Onam",
      "40+ UNESCO World Heritage Sites; 22 scheduled languages",
    ],
  },
  "andhra pradesh": {
    soils: ["Red sandy soils", "Black (regur) soils", "Coastal alluvial & deltaic soils"],
    crops: ["Rice", "Groundnut", "Tobacco", "Chillies", "Cotton", "Sugarcane"],
    culture: [
      "Kuchipudi classical dance originated here",
      "Telugu language & literature; Ugadi (new year) festival",
      "Tirupati temple; Kalamkari and Kondapalli toys",
    ],
  },
  "arunachal pradesh": {
    soils: ["Forest & mountain soils", "Lateritic soils"],
    crops: ["Rice (jhum/terrace)", "Maize", "Millet", "Large cardamom", "Oranges", "Kiwi"],
    culture: [
      "Home to 26+ major tribes (Nyishi, Adi, Apatani, Monpa)",
      "Losar & Solung festivals; Buddhist Tawang Monastery",
      "Bamboo & cane handicrafts, tribal weaving",
    ],
  },
  assam: {
    soils: ["Alluvial soils (Brahmaputra valley)", "Lateritic & hill soils"],
    crops: ["Tea", "Rice", "Jute", "Oilseeds", "Sugarcane"],
    culture: [
      "Bihu — the signature folk dance & festival",
      "Sattriya classical dance; Assamese silk (Muga, Pat, Eri)",
      "Kamakhya temple; Majuli river island monasteries",
    ],
  },
  bihar: {
    soils: ["Gangetic alluvial soils", "Terai soils in the north"],
    crops: ["Rice", "Wheat", "Maize", "Pulses", "Sugarcane", "Litchi (Muzaffarpur)"],
    culture: [
      "Chhath Puja — major sun-worship festival",
      "Madhubani (Mithila) painting; Bhojpuri & Maithili traditions",
      "Buddhist heritage at Bodh Gaya & Nalanda",
    ],
  },
  chhattisgarh: {
    soils: ["Red & yellow soils", "Lateritic soils", "Black soils"],
    crops: ["Rice (the 'rice bowl' of central India)", "Maize", "Pulses", "Oilseeds"],
    culture: [
      "Rich tribal (Gond, Bastar) culture & Bastar Dussehra",
      "Panthi & Raut Nacha folk dances",
      "Dhokra metal craft and bell-metal art",
    ],
  },
  goa: {
    soils: ["Lateritic soils", "Coastal sandy & alluvial soils"],
    crops: ["Rice", "Coconut", "Cashew", "Arecanut", "Mango", "Kokum"],
    culture: [
      "Indo-Portuguese heritage; Carnival & Shigmo festivals",
      "Konkani language; churches of Old Goa (UNESCO)",
      "Fado-influenced music, seafood cuisine, feni",
    ],
  },
  gujarat: {
    soils: ["Black soils", "Alluvial soils", "Sandy (Kutch) & saline soils"],
    crops: ["Cotton", "Groundnut", "Tobacco", "Bajra", "Wheat", "Castor"],
    culture: [
      "Garba & Dandiya during Navratri",
      "Patola (Patan) double-ikat silk; vibrant Kutch embroidery",
      "Rann Utsav; Jain & Vaishnav temple traditions",
    ],
  },
  haryana: {
    soils: ["Alluvial soils", "Sandy & saline soils in the south-west"],
    crops: ["Wheat", "Rice (basmati)", "Sugarcane", "Bajra", "Cotton", "Mustard"],
    culture: [
      "Green Revolution heartland; folk Saang theatre",
      "Phag, Teej & Gangaur festivals; robust dairy culture",
      "Strong wrestling (kushti) and sporting tradition",
    ],
  },
  "himachal pradesh": {
    soils: ["Mountain & forest soils", "Brown hill soils", "Alluvial valley soils"],
    crops: ["Apple & temperate fruits", "Wheat", "Maize", "Barley", "Potato"],
    culture: [
      "Kullu Dussehra; Nati folk dance (Guinness record)",
      "Pahari painting; wool shawls & caps",
      "Hill temples (Shimla, Manali, Dharamshala) & Tibetan influence",
    ],
  },
  jharkhand: {
    soils: ["Red & lateritic soils", "Sandy & micaceous soils"],
    crops: ["Rice", "Maize", "Pulses", "Oilseeds", "Millets"],
    culture: [
      "Tribal heartland (Santhal, Munda, Oraon)",
      "Chhau dance; Sohrai & Karma festivals",
      "Sohrai-Khovar wall painting (GI), tribal music",
    ],
  },
  karnataka: {
    soils: ["Red soils", "Black (regur) soils", "Laterite soils", "Coastal alluvium"],
    crops: ["Coffee", "Ragi (finger millet)", "Rice", "Sugarcane", "Cotton", "Arecanut", "Silk"],
    culture: [
      "Yakshagana folk theatre; Mysuru Dasara",
      "Carnatic music; Kannada literature (8 Jnanpith awards)",
      "Mysore silk, sandalwood, Channapatna toys, Bidriware",
    ],
  },
  kerala: {
    soils: ["Laterite soils", "Coastal alluvial soils", "Forest & hill soils"],
    crops: ["Coconut", "Rubber", "Spices (pepper, cardamom)", "Tea", "Coffee", "Rice", "Cashew"],
    culture: [
      "Kathakali & Mohiniyattam classical dances; Theyyam ritual art",
      "Onam harvest festival; Kalaripayattu martial art",
      "Backwaters, snake-boat races, Kerala murals",
    ],
  },
  "madhya pradesh": {
    soils: ["Black (regur) soils", "Red & yellow soils", "Alluvial soils"],
    crops: ["Soybean (the 'soya state')", "Wheat", "Gram", "Pulses", "Cotton", "Sugarcane"],
    culture: [
      "Khajuraho & Sanchi (UNESCO) heritage",
      "Tribal Gond art; folk dances like Matki & Gangaur",
      "Tansen music festival; Chanderi & Maheshwari weaves",
    ],
  },
  maharashtra: {
    soils: ["Black (regur) cotton soils", "Laterite soils", "Alluvial coastal soils"],
    crops: ["Cotton", "Sugarcane", "Jowar", "Onion", "Soybean", "Grapes & oranges"],
    culture: [
      "Lavani & Tamasha folk performance; Ganesh Chaturthi",
      "Warli tribal painting; Marathi theatre & literature",
      "Paithani silk sarees; Ajanta & Ellora caves (UNESCO)",
    ],
  },
  manipur: {
    soils: ["Valley alluvial soils", "Red ferruginous hill soils"],
    crops: ["Rice", "Maize", "Pulses", "Oilseeds", "Pineapple"],
    culture: [
      "Manipuri classical dance (Raas Leela)",
      "Loktak Lake & phumdis; Sangai festival",
      "Thang-Ta martial art; fine handloom weaving",
    ],
  },
  meghalaya: {
    soils: ["Red lateritic soils", "Forest & hill soils"],
    crops: ["Rice", "Maize", "Potato", "Turmeric", "Oranges", "Areca nut"],
    culture: [
      "Matrilineal Khasi, Garo & Jaintia societies",
      "Nongkrem & Wangala (100-drums) festivals",
      "Living root bridges; bamboo & cane crafts",
    ],
  },
  mizoram: {
    soils: ["Lateritic & forest soils", "Mountain soils"],
    crops: ["Rice (jhum)", "Maize", "Ginger", "Bird's-eye chilli", "Bamboo"],
    culture: [
      "Cheraw (bamboo) dance; Chapchar Kut festival",
      "Mizo handloom shawls (puan)",
      "Close-knit community 'tlawmngaihna' ethic",
    ],
  },
  nagaland: {
    soils: ["Forest & hill soils", "Lateritic soils"],
    crops: ["Rice (jhum & terrace)", "Maize", "Millets", "Naga king chilli", "Pulses"],
    culture: [
      "Hornbill Festival — 'festival of festivals'",
      "16+ major tribes with distinct attire & dialects",
      "Wood carving, bamboo work & tribal weaving",
    ],
  },
  odisha: {
    soils: ["Red & lateritic soils", "Alluvial coastal & deltaic soils", "Black soils"],
    crops: ["Rice", "Pulses", "Oilseeds", "Jute", "Sugarcane", "Turmeric"],
    culture: [
      "Odissi classical dance; Rath Yatra (Puri Jagannath)",
      "Sun Temple, Konark (UNESCO); Pattachitra painting",
      "Sambalpuri ikat textiles, silver filigree (Cuttack)",
    ],
  },
  punjab: {
    soils: ["Alluvial soils", "Sandy soils in the south-west"],
    crops: ["Wheat", "Rice (basmati)", "Maize", "Sugarcane", "Cotton"],
    culture: [
      "Bhangra & Giddha folk dances; Baisakhi harvest festival",
      "Sikh heritage; Golden Temple, Amritsar",
      "Phulkari embroidery; vibrant Punjabi music",
    ],
  },
  rajasthan: {
    soils: ["Desert (arid sandy) soils", "Alluvial soils", "Saline & red-yellow soils"],
    crops: ["Bajra", "Wheat", "Pulses", "Mustard", "Barley", "Guar"],
    culture: [
      "Ghoomar & Kalbeliya (UNESCO) dances",
      "Hill forts (UNESCO); Pushkar fair; folk music (Manganiyar)",
      "Block-printing, blue pottery, miniature painting, bandhani",
    ],
  },
  sikkim: {
    soils: ["Brown hill & mountain soils", "Forest soils"],
    crops: ["Large cardamom", "Maize", "Rice", "Ginger", "Orange", "Organic produce"],
    culture: [
      "India's first fully organic state",
      "Buddhist monasteries; Losar & Saga Dawa festivals",
      "Mask (Cham) dances; Lepcha, Bhutia & Nepali traditions",
    ],
  },
  "tamil nadu": {
    soils: ["Red soils", "Black soils", "Alluvial & coastal soils", "Laterite soils"],
    crops: ["Rice", "Sugarcane", "Groundnut", "Cotton", "Banana", "Tea & coffee (hills)"],
    culture: [
      "Bharatanatyam classical dance; Pongal harvest festival",
      "Dravidian temple architecture; Carnatic music",
      "Tanjore painting, Kanchipuram silk, bronze idols",
    ],
  },
  telangana: {
    soils: ["Red sandy soils", "Black (regur) soils", "Lateritic soils"],
    crops: ["Rice", "Cotton", "Maize", "Turmeric", "Chillies", "Soybean"],
    culture: [
      "Bathukamma & Bonalu festivals",
      "Perini Shivatandavam dance; Telugu literature",
      "Pochampally ikat (GI), Hyderabadi cuisine & pearls",
    ],
  },
  tripura: {
    soils: ["Red lateritic soils", "Alluvial valley soils"],
    crops: ["Rice", "Jute", "Tea", "Rubber", "Pineapple", "Bamboo"],
    culture: [
      "Garia & Hojagiri folk dances",
      "Kharchi & Garia Puja festivals",
      "Fine bamboo & cane handicrafts, tribal weaving",
    ],
  },
  "uttar pradesh": {
    soils: ["Gangetic alluvial soils", "Bhabar & Terai soils", "Ravine soils"],
    crops: ["Sugarcane (largest producer)", "Wheat", "Rice", "Pulses", "Potato"],
    culture: [
      "Kathak classical dance; Ramlila & Kumbh Mela",
      "Taj Mahal & Mughal heritage; Awadhi cuisine",
      "Chinkankari (Lucknow), Banarasi silk, brassware (Moradabad)",
    ],
  },
  uttarakhand: {
    soils: ["Mountain & forest soils", "Brown hill soils", "Bhabar & Terai soils"],
    crops: ["Rice", "Wheat", "Mandua (ragi)", "Pulses", "Fruits", "Tea"],
    culture: [
      "Garhwali & Kumaoni traditions; Aipan folk art",
      "Char Dham pilgrimage; Nanda Devi Raj Jat",
      "Folk dances (Choliya); woollen & ringaal crafts",
    ],
  },
  "west bengal": {
    soils: ["Alluvial soils", "Lateritic soils", "Coastal & deltaic (Sundarbans) soils"],
    crops: ["Rice", "Jute (largest producer)", "Tea (Darjeeling)", "Potato", "Oilseeds"],
    culture: [
      "Durga Puja (UNESCO intangible heritage)",
      "Rabindra Sangeet; Baul folk music; Bengali literature",
      "Kantha embroidery, terracotta temples, Darjeeling tea",
    ],
  },

  // ── Major Union Territories ──
  delhi: {
    soils: ["Gangetic alluvial soils", "Sandy soils along the Yamuna"],
    crops: ["Wheat", "Vegetables", "Floriculture", "Dairy (peri-urban)"],
    culture: [
      "Mughal & colonial heritage (Red Fort, Qutub Minar — UNESCO)",
      "Cosmopolitan cuisine; Phoolwalon ki Sair festival",
      "Hub of classical & contemporary arts",
    ],
  },
  "jammu and kashmir": {
    soils: ["Mountain & alluvial valley soils", "Karewa (lacustrine) soils"],
    crops: ["Apple & temperate fruits", "Rice", "Saffron (Pampore)", "Walnut", "Maize"],
    culture: [
      "Sufi & Kashmiri Shaivite traditions; Rouf dance",
      "Pashmina & Kani shawls, papier-mâché, walnut wood carving",
      "Shikara & houseboats on Dal Lake; Mughal gardens",
    ],
  },
  ladakh: {
    soils: ["Cold-desert sandy & gravelly soils"],
    crops: ["Barley", "Wheat", "Peas", "Apricot", "Sea buckthorn"],
    culture: [
      "Tibetan-Buddhist monasteries (Hemis, Thiksey)",
      "Hemis & Losar festivals; mask dances",
      "Pashmina (Changthangi goat) wool, thangka painting",
    ],
  },
  puducherry: {
    soils: ["Coastal alluvial soils", "Red soils"],
    crops: ["Rice", "Sugarcane", "Groundnut", "Cotton", "Coconut"],
    culture: [
      "French colonial heritage & quarter",
      "Auroville; Bharatanatyam & Carnatic traditions",
      "Masquerade (Mardi Gras) and temple festivals",
    ],
  },
  chandigarh: {
    soils: ["Alluvial soils", "Sandy loam (Shivalik foothills)"],
    crops: ["Wheat", "Maize", "Vegetables", "Floriculture"],
    culture: [
      "Le Corbusier's planned city & Capitol Complex (UNESCO)",
      "Nek Chand's Rock Garden; Sukhna Lake",
      "Shared capital of Punjab & Haryana",
    ],
  },
  lakshadweep: {
    soils: ["Coral sandy soils"],
    crops: ["Coconut", "Areca", "Breadfruit", "Tuna fisheries"],
    culture: [
      "Coral atolls & lagoons; only coral islands of India",
      "Jeseri (Malayalam dialect) & Mahl speakers; Islamic heritage",
      "Lava & Kolkali folk dances; coir & shell crafts",
    ],
  },
  "dadra and nagar haveli and daman and diu": {
    soils: ["Coastal alluvial soils", "Lateritic & sandy soils"],
    crops: ["Rice", "Ragi", "Sugarcane", "Coconut", "Mango"],
    culture: [
      "Former Portuguese enclaves; forts of Daman & Diu",
      "Warli tribal painting (Dadra & Nagar Haveli)",
      "Beaches, churches & seafood cuisine",
    ],
  },
  "andaman and nicobar islands": {
    soils: ["Forest & lateritic soils", "Coastal sandy soils"],
    crops: ["Coconut", "Arecanut", "Rice", "Spices", "Fruits"],
    culture: [
      "Indigenous tribes (Jarwa, Sentinelese, Nicobarese)",
      "Cellular Jail heritage; multicultural settler society",
      "Shell craft and coconut-based crafts",
    ],
  },
};

export function getStateInfo(name: string): StateInfo | undefined {
  return STATE_INFO[name.trim().toLowerCase()];
}
