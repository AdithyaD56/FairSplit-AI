import { allCountryNames } from "./countries";

export { allCountryNames };

export const destinationOptions = [
  {
    name: "Goa",
    country: "India",
    vibe: "Beach cafes, scooter-friendly routes, and sunset-first evenings.",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&q=90",
    greeting: "Hey travel crew,",
    journeyType: "Relaxed beach break",
    bestTime: "November to February",
    budgetRange: "Budget to mid-range friendly",
    bestPlaces: ["Fontainhas", "Anjuna", "Ashwem", "Benaulim"],
    quickNote:
      "Goa works best when the group stays close to one side of the coast and keeps transfers limited instead of hopping between far-away beaches every day.",
    stayFocus:
      "Choose compact stays near Anjuna, Candolim, or Colva so cafes, beaches, and evening walks stay close together.",
    foodAndTransport:
      "Scooters and short cabs keep the cost practical. Shack breakfasts, local thalis, and one or two special dinners usually fit a friend-group budget well.",
  },
  {
    name: "Manali",
    country: "India",
    vibe: "Cool mountain air, riverside cafes, and scenic drives.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
    greeting: "Welcome aboard,",
    journeyType: "Mountain road-trip escape",
    bestTime: "March to June",
    budgetRange: "Strong budget value",
    bestPlaces: ["Old Manali", "Solang Valley", "Naggar", "Vashisht"],
    quickNote:
      "Manali feels better when you mix slow mornings and two strong outing days instead of packing every viewpoint into the same schedule.",
    stayFocus:
      "Old Manali and Vashisht are good for budget stays with walkable cafes and easy taxi access.",
    foodAndTransport:
      "Local cafes, shared cabs, and one scenic day-trip usually give the best balance between comfort and spending.",
  },
  {
    name: "Dubai",
    country: "United Arab Emirates",
    vibe: "Clean city movement, skyline nights, and polished short stays.",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=90",
    greeting: "Hello explorers,",
    journeyType: "City break with efficient transit",
    bestTime: "November to March",
    budgetRange: "Mid-range with careful planning",
    bestPlaces: ["Downtown", "Dubai Marina", "Al Seef", "JBR Walk"],
    quickNote:
      "Dubai becomes much more budget-friendly when the group uses metro-linked neighborhoods and picks only one or two premium attractions.",
    stayFocus:
      "Stay near a metro station around Deira, Bur Dubai, or Al Barsha for lower nightly rates and quick movement.",
    foodAndTransport:
      "Metro plus budget cafeterias and mall food courts keep daily costs under control while still covering the main city zones.",
  },
  {
    name: "Tokyo",
    country: "Japan",
    vibe: "Transit-smart neighborhoods, late-night food lanes, and precise pacing.",
    image:
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1400&q=90",
    greeting: "Konnichiwa team,",
    journeyType: "High-energy urban journey",
    bestTime: "March to May or October to November",
    budgetRange: "Manageable with hostel planning",
    bestPlaces: ["Asakusa", "Shinjuku", "Ueno", "Shimokitazawa"],
    quickNote:
      "Tokyo rewards zone-based planning. If the group covers nearby neighborhoods together, you save both transit time and food overspending.",
    stayFocus:
      "Hostels or compact hotels around Ueno, Asakusa, and Ikebukuro usually strike the best cost-to-access balance.",
    foodAndTransport:
      "Convenience-store breakfasts, ramen counters, and day metro passes keep Tokyo realistic for friends on a tighter international budget.",
  },
  {
    name: "Paris",
    country: "France",
    vibe: "Walkable boulevards, cafe pauses, and layered city sightseeing.",
    image:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1400&q=90",
    greeting: "Bonjour planners,",
    journeyType: "Classic city stroll trip",
    bestTime: "April to June",
    budgetRange: "Moderate if you stay outside the center",
    bestPlaces: ["Le Marais", "Montmartre", "Latin Quarter", "Canal Saint-Martin"],
    quickNote:
      "Paris stays comfortable on a budget when the group uses metro-connected districts and limits paid museum days.",
    stayFocus:
      "Budget hotels just outside the central arrondissements often give a much better group value than staying in the core tourist lanes.",
    foodAndTransport:
      "Use bakeries for breakfast, fixed lunch menus in local cafes, and metro carnet tickets for the cleanest budget control.",
  },
  {
    name: "New York",
    country: "United States",
    vibe: "Skyline views, landmark clusters, and long walk days that still feel cinematic.",
    image:
      "https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=1400&q=90",
    greeting: "Hey city runners,",
    journeyType: "Big-city landmark sprint",
    bestTime: "April to June or September to November",
    budgetRange: "Higher cost, easier with group sharing",
    bestPlaces: ["Midtown", "DUMBO", "SoHo", "Central Park South"],
    quickNote:
      "New York is best when each day stays inside one region of the city. That keeps subway hops short and prevents the itinerary from feeling rushed.",
    stayFocus:
      "Queens and Brooklyn can give much stronger group hotel value than Manhattan while staying well connected.",
    foodAndTransport:
      "Subway passes, deli breakfasts, pizza slices, and one planned splurge meal are the easiest way to keep the budget controlled.",
  },
];

function buildConfig(country, description, providers) {
  return { country, description, providers };
}

const specialCountryConfigs = {
  India: buildConfig("India", "Popular booking shortcuts for domestic travel around India.", {
    flights: {
      label: "Flight trips",
      title: "Goibibo Flights",
      note: "Popular for domestic air routes.",
      url: "https://www.goibibo.com/flights/",
    },
    stays: {
      label: "Stay booking",
      title: "Goibibo Hotels",
      note: "Hotels and short stays for Indian routes.",
      url: "https://www.goibibo.com/hotels/",
    },
    trains: {
      label: "Train booking",
      title: "IRCTC Rail",
      note: "Official train reservation portal.",
      url: "https://www.irctc.co.in/nget/train-search",
    },
    cabs: {
      label: "Cab booking",
      title: "Goibibo Cabs",
      note: "Intercity and airport cab search.",
      url: "https://www.goibibo.com/cars/",
    },
  }),
  Japan: buildConfig("Japan", "Useful travel booking links for Japan routes and local transport.", {
    flights: {
      label: "Flight trips",
      title: "Google Flights",
      note: "Fast route and fare comparison.",
      url: "https://www.google.com/travel/flights",
    },
    stays: {
      label: "Stay booking",
      title: "Rakuten Travel",
      note: "Common hotel booking choice in Japan.",
      url: "https://travel.rakuten.com/",
    },
    trains: {
      label: "Train booking",
      title: "JR East Reservation",
      note: "Rail reservations and pass pickup info.",
      url: "https://www.eki-net.com/jreast-train-reservation/English/wb/common/Menu/Menu.aspx",
    },
    cabs: {
      label: "Cab booking",
      title: "GO Taxi",
      note: "Popular taxi-app starting point.",
      url: "https://go.goinc.jp/",
    },
  }),
  "United Arab Emirates": buildConfig(
    "United Arab Emirates",
    "Helpful booking links for Dubai and wider UAE travel.",
    {
      flights: {
        label: "Flight trips",
        title: "Google Flights",
        note: "Fast air route comparison.",
        url: "https://www.google.com/travel/flights",
      },
      stays: {
        label: "Stay booking",
        title: "Booking.com",
        note: "Wide hotel coverage across UAE stays.",
        url: "https://www.booking.com/",
      },
      trains: {
        label: "Train updates",
        title: "Etihad Rail",
        note: "Passenger network and rail updates.",
        url: "https://www.etihadrail.ae/en",
      },
      cabs: {
        label: "Cab booking",
        title: "Careem Taxi",
        note: "Common ride-hailing and taxi option.",
        url: "https://www.careem.com/en-AE/taxi",
      },
    },
  ),
  France: buildConfig("France", "Recommended planning links for France city and rail travel.", {
    flights: {
      label: "Flight trips",
      title: "Google Flights",
      note: "Fast route and fare comparison.",
      url: "https://www.google.com/travel/flights",
    },
    stays: {
      label: "Stay booking",
      title: "Booking.com",
      note: "Flexible hotel and apartment search.",
      url: "https://www.booking.com/",
    },
    trains: {
      label: "Train booking",
      title: "SNCF Connect",
      note: "Rail booking across France and nearby routes.",
      url: "https://www.sncf-connect.com/en-en/",
    },
    cabs: {
      label: "Cab booking",
      title: "Uber",
      note: "Ride-hailing in major French cities.",
      url: "https://www.uber.com/fr/en/ride/",
    },
  }),
  "United States": buildConfig(
    "United States",
    "Useful booking links for flights, stays, rail, and rides in the US.",
    {
      flights: {
        label: "Flight trips",
        title: "Google Flights",
        note: "Strong for route discovery and comparison.",
        url: "https://www.google.com/travel/flights",
      },
      stays: {
        label: "Stay booking",
        title: "Expedia Hotels",
        note: "Large inventory for US stays.",
        url: "https://www.expedia.com/Hotels",
      },
      trains: {
        label: "Train booking",
        title: "Amtrak",
        note: "Official long-distance and regional rail.",
        url: "https://www.amtrak.com/home.html",
      },
      cabs: {
        label: "Cab booking",
        title: "Uber",
        note: "Common ride-hailing choice.",
        url: "https://www.uber.com/us/en/ride/",
      },
    },
  ),
};

const europeCountries = new Set([
  "Albania",
  "Andorra",
  "Austria",
  "Belarus",
  "Belgium",
  "Bosnia and Herzegovina",
  "Bulgaria",
  "Croatia",
  "Czech Republic",
  "Denmark",
  "Estonia",
  "Finland",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Ireland",
  "Italy",
  "Latvia",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Moldova",
  "Monaco",
  "Montenegro",
  "Netherlands",
  "North Macedonia",
  "Norway",
  "Poland",
  "Portugal",
  "Romania",
  "San Marino",
  "Serbia",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "Switzerland",
  "Ukraine",
  "United Kingdom",
  "Vatican City",
]);

const asiaPacificCountries = new Set([
  "Afghanistan",
  "Armenia",
  "Australia",
  "Azerbaijan",
  "Bahrain",
  "Bangladesh",
  "Bhutan",
  "Brunei",
  "Cambodia",
  "China",
  "Fiji",
  "Georgia",
  "Indonesia",
  "Iran",
  "Iraq",
  "Jordan",
  "Kazakhstan",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Lebanon",
  "Malaysia",
  "Maldives",
  "Marshall Islands",
  "Micronesia",
  "Mongolia",
  "Myanmar",
  "Nauru",
  "Nepal",
  "New Zealand",
  "North Korea",
  "Oman",
  "Pakistan",
  "Palau",
  "Papua New Guinea",
  "Philippines",
  "Qatar",
  "Samoa",
  "Saudi Arabia",
  "Singapore",
  "Solomon Islands",
  "South Korea",
  "Sri Lanka",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Thailand",
  "Timor-Leste",
  "Tonga",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uzbekistan",
  "Vanuatu",
  "Vietnam",
  "Yemen",
]);

const americasCountries = new Set([
  "Antigua and Barbuda",
  "Argentina",
  "Bahamas",
  "Barbados",
  "Belize",
  "Bolivia",
  "Brazil",
  "Canada",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "El Salvador",
  "Grenada",
  "Guatemala",
  "Guyana",
  "Haiti",
  "Honduras",
  "Jamaica",
  "Mexico",
  "Nicaragua",
  "Panama",
  "Paraguay",
  "Peru",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Suriname",
  "Trinidad and Tobago",
  "Uruguay",
  "Venezuela",
]);

function genericConfig(country, description, providers) {
  return { country, description, providers };
}

export function getCountryBookingConfig(country) {
  if (specialCountryConfigs[country]) {
    return specialCountryConfigs[country];
  }

  if (europeCountries.has(country)) {
    return genericConfig(country, `Booking shortcuts prepared for ${country}.`, {
      flights: {
        label: "Flight trips",
        title: "Google Flights",
        note: "Quick route and fare comparison.",
        url: "https://www.google.com/travel/flights",
      },
      stays: {
        label: "Stay booking",
        title: "Booking.com",
        note: "Flexible hotel and apartment search.",
        url: "https://www.booking.com/",
      },
      trains: {
        label: "Train booking",
        title: "Trainline",
        note: "Popular rail booking across Europe.",
        url: "https://www.thetrainline.com/",
      },
      cabs: {
        label: "Cab booking",
        title: "Kiwitaxi",
        note: "Airport and city transfer booking.",
        url: "https://kiwitaxi.com/",
      },
    });
  }

  if (asiaPacificCountries.has(country)) {
    return genericConfig(country, `Booking shortcuts prepared for ${country}.`, {
      flights: {
        label: "Flight trips",
        title: "Google Flights",
        note: "Quick route and fare comparison.",
        url: "https://www.google.com/travel/flights",
      },
      stays: {
        label: "Stay booking",
        title: "Agoda",
        note: "Widely used stay search across Asia-Pacific.",
        url: "https://www.agoda.com/",
      },
      trains: {
        label: "Train trips",
        title: "12Go",
        note: "Useful for trains, ferries, and buses in many Asian routes.",
        url: "https://12go.asia/en",
      },
      cabs: {
        label: "Cab booking",
        title: "Kiwitaxi",
        note: "Airport and city transfer booking.",
        url: "https://kiwitaxi.com/",
      },
    });
  }

  if (americasCountries.has(country)) {
    return genericConfig(country, `Booking shortcuts prepared for ${country}.`, {
      flights: {
        label: "Flight trips",
        title: "Google Flights",
        note: "Quick route and fare comparison.",
        url: "https://www.google.com/travel/flights",
      },
      stays: {
        label: "Stay booking",
        title: "Expedia Hotels",
        note: "Strong coverage across the Americas.",
        url: "https://www.expedia.com/Hotels",
      },
      trains: {
        label: "Train trips",
        title: "Amtrak",
        note: "Useful starting point for US rail and inspiration.",
        url: "https://www.amtrak.com/home.html",
      },
      cabs: {
        label: "Cab booking",
        title: "Uber",
        note: "Common ride-hailing option.",
        url: "https://www.uber.com/us/en/ride/",
      },
    });
  }

  return genericConfig(country, `Booking shortcuts prepared for ${country}.`, {
    flights: {
      label: "Flight trips",
      title: "Google Flights",
      note: "Quick route and fare comparison.",
      url: "https://www.google.com/travel/flights",
    },
    stays: {
      label: "Stay booking",
      title: "Booking.com",
      note: "Flexible hotel and apartment search.",
      url: "https://www.booking.com/",
    },
    trains: {
      label: "Train trips",
      title: "Trainline",
      note: "Helpful for many international rail routes.",
      url: "https://www.thetrainline.com/",
    },
    cabs: {
      label: "Cab booking",
      title: "Kiwitaxi",
      note: "Airport and city transfer booking.",
      url: "https://kiwitaxi.com/",
    },
  });
}
