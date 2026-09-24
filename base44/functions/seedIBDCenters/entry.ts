import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Registro ECCO E-QUALITY — centri IBD partecipanti (~250 voci, ~35 nazioni).
// Idempotente: i centri già presenti (stesso name+country, source='ecco') vengono saltati.
// Phase 1: bulk create di tutti i centri con coordinate del centroide della nazione (mappa subito visibile).
// Phase 2: geocodifica Nominatim di un batch (precisa lat/lng + città + regione); rilanciabile.
const ECCO = [
  { c: "Albania", n: "Mother Teresa Hospital Center" },
  { c: "Armenia", n: "Mikaelyan University Hospital" },
  { c: "Australia", n: "The Alfred Hospital" },
  { c: "Australia", n: "Barwon Health" },
  { c: "Australia", n: "Flinders Medical Centre" },
  { c: "Australia", n: "Liverpool Hospital" },
  { c: "Australia", n: "Royal Adelaide Hospital" },
  { c: "Australia", n: "Royal Perth Hospital" },
  { c: "Australia", n: "Royal Prince Alfred Hospital" },
  { c: "Australia", n: "Royal North Shore Hospital" },
  { c: "Australia", n: "Sydney Children's Hospital" },
  { c: "Australia", n: "St. John Of God Midland Hospital" },
  { c: "Australia", n: "St. Vincents Public Hospital Sydney" },
  { c: "Austria", n: "Klinik Landstrasse" },
  { c: "Austria", n: "Krankenhaus der Barmherzigen Bruder St. Veit an der Glan" },
  { c: "Austria", n: "Medical University of Graz" },
  { c: "Austria", n: "Medical University of Vienna" },
  { c: "Belgium", n: "Hospital ZOL" },
  { c: "Belgium", n: "AZ Damiaan" },
  { c: "Belgium", n: "AZ Delta" },
  { c: "Belgium", n: "AZ Groeninge" },
  { c: "Belgium", n: "AZ Herentals" },
  { c: "Belgium", n: "AZ Maria Middelares" },
  { c: "Belgium", n: "AZ Rivierenland" },
  { c: "Belgium", n: "AZ Sint Jan" },
  { c: "Belgium", n: "AZ Sint-Lucas Gent" },
  { c: "Belgium", n: "AZ Sint-Maarten" },
  { c: "Belgium", n: "AZ Turnhout" },
  { c: "Belgium", n: "AZ Vesalius" },
  { c: "Belgium", n: "AZ Voorkempen" },
  { c: "Belgium", n: "OLV Ziekenhuis Aalst" },
  { c: "Belgium", n: "Vitaz" },
  { c: "Belgium", n: "UZ Leuven" },
  { c: "Belgium", n: "UZ Gent" },
  { c: "Belgium", n: "UZ Brussel" },
  { c: "Belgium", n: "CHU Charleroi" },
  { c: "Belgium", n: "CHU Liege" },
  { c: "Belgium", n: "CSL-Arlon" },
  { c: "Belgium", n: "University Hospital Antwerp" },
  { c: "Belgium", n: "Grand Hospital de Charleroi" },
  { c: "Belgium", n: "Heilighartziekenhuis Lier" },
  { c: "Belgium", n: "Hopital Erasme" },
  { c: "Belgium", n: "Imelda Hospital" },
  { c: "Belgium", n: "Mariaziekenhuis" },
  { c: "Belgium", n: "Pediatric Gastroenterology Antwerp University Hospital" },
  { c: "Belgium", n: "Sint-Trudo Ziekenhuis" },
  { c: "Belgium", n: "Sint-Jozefskliniek Izegem" },
  { c: "Belgium", n: "Sint-Franciscus Ziekenhuis Heusden" },
  { c: "Belgium", n: "Sint-Andriesziekenhuis" },
  { c: "Brazil", n: "Cajuru University Hospital" },
  { c: "Brazil", n: "Ludvig Clinic" },
  { c: "Brazil", n: "Coloprocto Clinica do Aparelho Digestivo" },
  { c: "Brazil", n: "Hospital Universitario Gaffree e Guinle UNIRIO" },
  { c: "Brazil", n: "DIImuno - Centro de Doencas Intestinais Inflamatorias" },
  { c: "Brazil", n: "Novagastro - Bauru" },
  { c: "Brazil", n: "Hospital Felicio Rocho" },
  { c: "Brazil", n: "Instituto Hospital de Base - Distrito Federal" },
  { c: "Brazil", n: "Clinica Gastro" },
  { c: "Brazil", n: "Hospital Divina" },
  { c: "Brazil", n: "FGF Coloproctologia - Hospital de Base de Sao Jose do Rio Preto" },
  { c: "Brazil", n: "Hospital Federal dos Servidores de Estado do Rio de Janeiro" },
  { c: "Brazil", n: "Clinica Medica Integrada" },
  { c: "Brazil", n: "Gastrocentro Natal" },
  { c: "Brazil", n: "Hospital das Clinicas - Universidade Federal de Minas Gerais" },
  { c: "Brazil", n: "Hospital Alianca" },
  { c: "Bulgaria", n: "UMHAT Tsaritsa Yoanna-ISUL" },
  { c: "Bulgaria", n: "Military Medical Academy" },
  { c: "Canada", n: "British Columbia Children's Hospital" },
  { c: "Chile", n: "Pontificia Universidad Catolica de Chile" },
  { c: "Chile", n: "Hospital Regional Dr. Leonardo Guzman" },
  { c: "China", n: "Third Xiangya Hospital of Central South University" },
  { c: "Colombia", n: "Hospital Universitario San Ignacio" },
  { c: "Colombia", n: "Union de Cirujanos ODO Zentria Salud" },
  { c: "Colombia", n: "Clinica Universitaria Colombia" },
  { c: "Colombia", n: "Hospital Pablo Tobon Uribe" },
  { c: "Croatia", n: "University Hospital Zagreb" },
  { c: "Croatia", n: "General Zadar Hospital" },
  { c: "Croatia", n: "UHC SESTRE Milosrdnice" },
  { c: "Cuba", n: "Centro Nacional de Cirugia de Minimo Acceso" },
  { c: "Cyprus", n: "American Gastroenterology Center Cyprus" },
  { c: "Czech Republic", n: "Ceske Budejovice" },
  { c: "Czech Republic", n: "IBD Clinical and Research Centre ISCARE" },
  { c: "Denmark", n: "Aalborg University Hospital" },
  { c: "Denmark", n: "Aarhus University Hospital" },
  { c: "Denmark", n: "Zealand University Hospital" },
  { c: "Denmark", n: "Bispebjerg Hospital" },
  { c: "Denmark", n: "Copenhagen University Hospital Rigshospitalet" },
  { c: "Denmark", n: "Godstrup Hospital" },
  { c: "Denmark", n: "Herlev and Gentofte Hospital" },
  { c: "Denmark", n: "Hospital of South West Denmark Esbjerg" },
  { c: "Denmark", n: "Hvidovre Hospital" },
  { c: "Denmark", n: "Lillebaelt Hospital" },
  { c: "Denmark", n: "Regional Hospital Silkeborg" },
  { c: "Denmark", n: "Regionshospitalet Viborg" },
  { c: "Denmark", n: "Slagelse Regional Hospital" },
  { c: "Dominican Republic", n: "Hospital Luis e Aybar" },
  { c: "Egypt", n: "Al-Hussein University Hospital" },
  { c: "Egypt", n: "IBD clinic at Alrajhi Hospital Assiut University" },
  { c: "Egypt", n: "Specialized Medical Hospital - Mansoura University" },
  { c: "Estonia", n: "West Tallinn Central Hospital" },
  { c: "Estonia", n: "East-Tallinn Central Hospital" },
  { c: "Estonia", n: "Tartu Ulikooli Kliinikum" },
  { c: "Finland", n: "Children's Hospital Helsinki" },
  { c: "Finland", n: "Helsinki University Hospital" },
  { c: "France", n: "Bordeaux University Hospital" },
  { c: "France", n: "CHU Dijon" },
  { c: "France", n: "CHU Grenoble Alpes" },
  { c: "France", n: "Gastroenterology Unit - Poitiers University Hospital" },
  { c: "France", n: "Henri Mondor" },
  { c: "France", n: "Hopital Saint-Louis Paris" },
  { c: "France", n: "Hospital Louis-Mourier" },
  { c: "France", n: "Hospital Saint Antoine" },
  { c: "France", n: "Toulouse University Hospital" },
  { c: "Germany", n: "Zentrum fur Gastroenterologie Saar MVZ" },
  { c: "Germany", n: "Ambulanzzentrum Gastroenterologie am Klinikum Lueneburg" },
  { c: "Germany", n: "Charite Campus Benjamin Franklin" },
  { c: "Germany", n: "University Medical Center Freiburg" },
  { c: "Germany", n: "University Hospital Frankfurt" },
  { c: "Germany", n: "University Hospital Erlangen" },
  { c: "Germany", n: "University Hospital Dresden" },
  { c: "Germany", n: "German Red Cross Hospital Berlin Westend" },
  { c: "Germany", n: "Universitatsklinikum Augsburg" },
  { c: "Germany", n: "IBD Center Agaplesion Markus Hospital" },
  { c: "Germany", n: "Isarklinikum and VIVAQ-MVZ" },
  { c: "Germany", n: "MVZ for Immunology" },
  { c: "Germany", n: "Siloah St. Trudpert Hospital" },
  { c: "Greece", n: "401 General Military Hospital of Athens" },
  { c: "Greece", n: "Agia Sofia Children's Hospital" },
  { c: "Greece", n: "Agios Nikolaos General Hospital" },
  { c: "Greece", n: "AHEPA General University Hospital of Thessaloniki" },
  { c: "Greece", n: "Athens Medical Center" },
  { c: "Greece", n: "Athens Medical Paleo Faliron Hospital" },
  { c: "Greece", n: "Attikon University Hospital" },
  { c: "Greece", n: "Venizeleio General Hospital" },
  { c: "Greece", n: "University Hospital of Larisa" },
  { c: "Greece", n: "University Hospital of Heraklion" },
  { c: "Greece", n: "University Hospital of Alexandroupolis" },
  { c: "Greece", n: "Gastroenterology Department Alexandra General Hospital" },
  { c: "Greece", n: "General Hospital of Athens G. Gennimatas" },
  { c: "Greece", n: "General Hospital of Kavala" },
  { c: "Greece", n: "GHA Evaggelismos-Ophthalmiatreion Athinon" },
  { c: "Greece", n: "Hippocration General Hospital Athens" },
  { c: "Greece", n: "Hippokration Hospital Thessaloniki" },
  { c: "Greece", n: "Tzaneio General Hospital" },
  { c: "Greece", n: "Interbalkan Medical Center of Thessaloniki" },
  { c: "Greece", n: "Theagenio Anticancer Hospital of Thessaloniki" },
  { c: "Greece", n: "Metaxa Memorial Hospital" },
  { c: "Greece", n: "Metropolitan General Hospital - Advanced Therapeutic Endoscopy" },
  { c: "Greece", n: "Metropolitan General Hospital - Gastroenterology Hepatology Clinic" },
  { c: "Greece", n: "Saint George - General Hospital of Chania" },
  { c: "Hong Kong", n: "Prince of Wales Hospital - Chinese University of Hong Kong" },
  { c: "Hungary", n: "University of Szeged" },
  { c: "India", n: "Institute of Medical Sciences and SUM Hospital" },
  { c: "India", n: "CMC Vellore" },
  { c: "India", n: "Dr RML hospital New Delhi" },
  { c: "India", n: "Krishna Institute of Medical Sciences" },
  { c: "India", n: "Prem Pushpa Wellness Center" },
  { c: "Indonesia", n: "The RSAW IBD Centre" },
  { c: "Indonesia", n: "Dr. Soetomo General Hospital" },
  { c: "Iran", n: "Masoud Clinic" },
  { c: "Ireland", n: "Cork University Hospital" },
  { c: "Ireland", n: "Ulster Hospital Dundonald" },
  { c: "Ireland", n: "Mater University Hospital" },
  { c: "Ireland", n: "St Vincent's University Hospital" },
  { c: "Israel", n: "Hadassah Medical Center" },
  { c: "Israel", n: "Kaplan Medical Center" },
  { c: "Israel", n: "Tel Aviv Sourasky Medical Center" },
  { c: "Israel", n: "Soroka University Medical Center" },
  { c: "Israel", n: "Rabin Medical Center" },
  { c: "Israel", n: "Sheba Medical Center Ramat Gan" },
  { c: "Italy", n: "A.O.U. Policlinico San Marco - Catania" },
  { c: "Italy", n: "Arnas G. Brotzu" },
  { c: "Italy", n: "ASST Lariana - Ospedale Sant'Anna" },
  { c: "Italy", n: "Azienda Ospedale Universita di Padova" },
  { c: "Italy", n: "Azienda Ospedaliera San Giovanni Addolorata" },
  { c: "Italy", n: "Ca' Foncello" },
  { c: "Italy", n: "Careggi University Hospital" },
  { c: "Italy", n: "Casa Sollievo della Sofferenza" },
  { c: "Italy", n: "Cattinara Hospital" },
  { c: "Italy", n: "Valduce Hospital" },
  { c: "Italy", n: "UOSD Endoscopia - PO Alto Vicentino" },
  { c: "Italy", n: "University Hospital L. Vanvitelli" },
  { c: "Italy", n: "Fondazione Policlinico Agostino Gemelli IRCCS" },
  { c: "Italy", n: "University Federico II of Naples" },
  { c: "Italy", n: "Universitary General Hospital - Renato Dulbecco" },
  { c: "Italy", n: "IBD-Unit Ospedali Riuniti Rivoli" },
  { c: "Italy", n: "IRCCS Azienda Ospedaliero-Universitaria di Bologna - Policlinico di S. Orsola" },
  { c: "Italy", n: "IRCCS Fondazione San Gerardo dei Tintori" },
  { c: "Italy", n: "IRCCS Sacro Cuore Don Calabria Negrar" },
  { c: "Italy", n: "IRCCS San Donato IBD Unit" },
  { c: "Italy", n: "IRCCS San Raffaele Hospital" },
  { c: "Italy", n: "Istituto Clinico Humanitas" },
  { c: "Italy", n: "Maggiore Hospital" },
  { c: "Italy", n: "Manzoni Hospital" },
  { c: "Italy", n: "Mauriziano Hospital" },
  { c: "Italy", n: "Ospedale Bernardo Ramazzini di Carpi - AUSL Modena" },
  { c: "Italy", n: "Ospedale Luigi Sacco" },
  { c: "Italy", n: "Ospedale San Filippo Neri" },
  { c: "Italy", n: "Pediatric Gastroenterology Unit - Umberto I Hospital" },
  { c: "Italy", n: "Policlinico Messina" },
  { c: "Italy", n: "Policlinico Palermo" },
  { c: "Italy", n: "Policlinico Universitario di Monserrato" },
  { c: "Italy", n: "Rho Hospital - ASST Rhodense" },
  { c: "Italy", n: "San Bortolo Hospital" },
  { c: "Italy", n: "San Camillo-Forlanini" },
  { c: "Italy", n: "San Gerardo Hospital University of Milan Bicocca" },
  { c: "Italy", n: "Santa Maria della Misericordia di Perugia" },
  { c: "Italy", n: "University Tor Vergata of Rome" },
  { c: "Japan", n: "Kitasato University Kitasato Institute Hospital" },
  { c: "Japan", n: "Fujisawa Shonandai Hospital" },
  { c: "Japan", n: "Takamatsu Red Cross Hospital" },
  { c: "Japan", n: "Toho University Sakura Medical Center" },
  { c: "Japan", n: "Hyogo Medical University Hospital" },
  { c: "Japan", n: "Kyushu University Hospital" },
  { c: "Kazakhstan", n: "Scientific Institute of Cardiology and Internal diseases" },
  { c: "Latvia", n: "Pauls Stradins Clinical University Hospital" },
  { c: "Lithuania", n: "Lithuanian University of Health Sciences" },
  { c: "Malaysia", n: "University Malaya Medical Center" }
];

// Centroide (capitale) per nazione — usato come coordinate iniziali prima della geocodifica.
const CENTROIDS = {
  "Albania": [41.3275, 19.8187], "Armenia": [40.1872, 44.5152], "Australia": [-35.2809, 149.13],
  "Austria": [48.2082, 16.3738], "Belgium": [50.8503, 4.3517], "Brazil": [-15.7939, -47.8828],
  "Bulgaria": [42.6977, 23.3219], "Canada": [45.4215, -75.6972], "Chile": [-33.4489, -70.6693],
  "China": [39.9042, 116.4074], "Colombia": [4.711, -74.0721], "Croatia": [45.815, 15.9819],
  "Cuba": [23.1136, -82.3666], "Cyprus": [35.1856, 33.3823], "Czech Republic": [50.0755, 14.4378],
  "Denmark": [55.6761, 12.5683], "Dominican Republic": [18.4861, -69.9312], "Egypt": [30.0444, 31.2357],
  "Estonia": [59.437, 24.7536], "Finland": [60.1699, 24.9384], "France": [48.8566, 2.3522],
  "Germany": [52.52, 13.405], "Greece": [37.9838, 23.7275], "Hong Kong": [22.3193, 114.1694],
  "Hungary": [47.4979, 19.0402], "India": [28.6139, 77.209], "Indonesia": [-6.2088, 106.8456],
  "Iran": [35.6892, 51.389], "Ireland": [53.3498, -6.2603], "Israel": [31.7683, 35.2137],
  "Italy": [41.9028, 12.4964], "Japan": [35.6762, 139.6503], "Kazakhstan": [51.1605, 71.4704],
  "Latvia": [56.9496, 24.1052], "Lithuania": [54.6872, 25.2797], "Malaysia": [3.139, 101.6869]
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch (_) {}
    const geocodeBatch = Math.min(Math.max(parseInt(payload.geocodeBatch ?? '30', 10) || 30, 0), 80);

    // Phase 1 — upsert dei centri mancanti con coordinate del centroide nazione.
    const existing = await base44.asServiceRole.entities.ServiceLocation.filter({ source: 'ecco' }, '-created_date', 1000);
    const keySet = new Set(existing.map((e) => (e.name + '||' + (e.country || ''))));
    const toCreate = [];
    for (const e of ECCO) {
      const key = e.n + '||' + e.c;
      if (keySet.has(key)) continue;
      const cent = CENTROIDS[e.c] || [0, 0];
      toCreate.push({
        name: e.n, country: e.c, region: '', city: '', type: 'centro_ibd',
        source: 'ecco', geocoded: false, lat: cent[0], lng: cent[1]
      });
    }
    let created = 0;
    for (let i = 0; i < toCreate.length; i += 100) {
      const chunk = toCreate.slice(i, i + 100);
      await base44.asServiceRole.entities.ServiceLocation.bulkCreate(chunk);
      created += chunk.length;
    }

    // Phase 2 — geocodifica Nominatim di un batch di centri non ancora geocodificati.
    let geocoded = 0, geoFailed = 0, remaining = 0;
    if (geocodeBatch > 0) {
      const ungeocoded = await base44.asServiceRole.entities.ServiceLocation.filter({ source: 'ecco', geocoded: false }, '-created_date', geocodeBatch + 1);
      remaining = ungeocoded.length;
      const batch = ungeocoded.slice(0, geocodeBatch);
      for (const rec of batch) {
        const q = encodeURIComponent(`${rec.name}, ${rec.country}`);
        const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=1`;
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'IBD-Care/1.0 (ibd-care.app)' } });
          if (res.ok) {
            const arr = await res.json();
            if (arr && arr.length) {
              const r = arr[0];
              const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
              const a = r.address || {};
              const city = a.city || a.town || a.village || a.municipality || a.county || '';
              const region = a.state || a.region || '';
              await base44.asServiceRole.entities.ServiceLocation.update(rec.id, { lat, lng, city, region, geocoded: true });
              geocoded++;
            } else {
              await base44.asServiceRole.entities.ServiceLocation.update(rec.id, { geocoded: true });
              geoFailed++;
            }
          } else {
            await base44.asServiceRole.entities.ServiceLocation.update(rec.id, { geocoded: true });
            geoFailed++;
          }
        } catch (_) {
          await base44.asServiceRole.entities.ServiceLocation.update(rec.id, { geocoded: true }).catch(() => {});
          geoFailed++;
        }
        await sleep(1100);
      }
      remaining = Math.max(0, remaining - geocoded);
    }

    return Response.json({ created, geocoded, geoFailed, geocodeBatch, remaining });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}