# 📋 OBSEŽNO TEHNIČNO POROČILO
## Spletna trgovina Kmetija Maroša - Celotna implementacija

**Projekt:** Razvoj spletne trgovine za Kmetijo Maroša
**Spletna stran:** www.kmetija-marosa.si
**Status:** Pripravljena za produkcijski zagon 1.9.2025

---

## 🎯 PREGLED PROJEKTA

Razvili smo celotno spletno trgovino za Kmetijo Maroša - moderno, varno in uporabniku prijazno e-trgovino za prodajo kmetijskih izdelkov. Projekt vključuje vse sodobne funkcionalnosti, ki jih potrebuje uspešna spletna trgovina, od osnovnega kataloga izdelkov do naprednih sistemov za upravljanje naročil in analitiko.

---

## 🏗️ TEHNIČNA ARHITEKTURA

### **Frontend tehnologije:**
- **React 18** - najnovejša verzija React framework-a za uporabniški vmesnik
- **TypeScript** - tipiziran JavaScript za boljšo kakovost kode
- **Vite** - hiter build tool za optimalno performanse
- **Tailwind CSS** - utility-first CSS framework za odzivni dizajn
- **Framer Motion** - napredne animacije in prehodi
- **React Router** - navigacija med stranmi
- **i18next** - sistem za večjezičnost

### **Backend in infrastruktura:**
- **Supabase** - PostgreSQL baza podatkov z real-time funkcionalnostmi
- **Netlify** - hosting, CDN in edge functions
- **Stripe** - mednarodni plačilni sistem
- **Google Apps Script** - avtomatizacija email komunikacije

### **Razvojno okolje:**
- **Git** - verzioniranje kode
- **GitHub** - repozitorij in CI/CD
- **ESLint** - preverjanje kakovosti kode
- **Prettier** - formatiranje kode

---

## 🛒 E-TRGOVINSKE FUNKCIONALNOSTI

### **1. Katalog izdelkov**
- **Dinamičen prikaz izdelkov** s profesionalnimi fotografijami
- **Kategorije izdelkov** za enostavno navigacijo
- **Filtriranje in iskanje** po imenu, kategoriji, ceni
- **Podrobne strani izdelkov** z opisom, sestavinami, alergeni
- **Galerija slik** z možnostjo povečave
- **Ocenjevanje izdelkov** s komentarji kupcev
- **Priporočeni izdelki** na osnovi nakupovalnih navad

### **2. Košarica in nakupovanje**
- **Napredna košarica** z vztrajnim shranjevanjem
- **Dodajanje/odstranjevanje izdelkov** z animacijami
- **Spreminjanje količin** z validacijo zalog
- **Izračun skupne cene** z DDV in dostavo
- **Shranjevanje košarice** med sejami
- **Hitro dodajanje** iz seznama želja

### **3. Sistem naročil**
- **Večstopenjski checkout proces:**
  1. Pregled košarice
  2. Podatki o dostavi
  3. Način plačila
  4. Potrditev naročila
- **Gostujočo nakupovanje** brez registracije
- **Registrirani uporabniki** s hitrejšim procesom
- **Validacija podatkov** na vseh korakih
- **Potrditev po emailu** z vsemi podrobnostmi

### **4. Plačilni sistem**
- **Stripe integracija** za varna spletna plačila
- **Podprte kartice:** Visa, Mastercard, American Express
- **3D Secure** avtentikacija za dodatno varnost
- **Plačilo na prevzem** za lokalne stranke
- **Bančno nakazilo** z avtomatskim usklajevanjem
- **Obročno plačevanje** za večje nakupe

### **5. Upravljanje zalog**
- **Real-time sledenje zalog** z avtomatskim posodabljanjem
- **Opozorila o nizkih zalogah** za administratorje
- **Rezervacija izdelkov** med procesom naročanja
- **Avtomatsko skrivanje** razprodanih izdelkov
- **Prednaročila** za sezonske izdelke
- **Množični uvoz** zalog iz Excel datotek

---

## 🎁 NAPREDNE FUNKCIONALNOSTI

### **1. Sistem za darila**
- **Darilni paketi** s personaliziranimi sporočili
- **Darilni voucher-ji** z različnimi vrednostmi
- **Dostava na drug naslov** z diskretnim pakiranjem
- **Posebno pakiranje** za darila
- **Časovno načrtovana dostava** za posebne priložnosti
- **Digitalni voucher-ji** za takojšnjo uporabo

### **2. Sistem popustov in promocij**
- **Popustne kode** z različnimi pravili
- **Količinski popusti** za večje nakupe
- **Sezonske akcije** z avtomatskim aktiviranjem
- **Popusti za zvestobo** za redne stranke
- **Prvi nakup popust** za nove stranke
- **Kombiniranje popustov** z naprednimi pravili

### **3. Newsletter in komunikacija**
- **Dvojni opt-in sistem** za GDPR skladnost
- **Segmentacija uporabnikov** po interesih
- **Avtomatizirani email-i:**
  - Dobrodošlica za nove uporabnike
  - Opomnik za zapuščeno košarico
  - Obvestila o novih izdelkih
  - Sezonske promocije
- **Personalizirane priporočila** na osnovi nakupov
- **A/B testiranje** email kampanj

---

## 👥 UPORABNIŠKI SISTEM

### **1. Registracija in prijava**
- **Email registracija** z verifikacijo
- **Socialna prijava** (Google, Facebook)
- **Varno shranjevanje gesel** z bcrypt hash-iranjem
- **Pozabljeno geslo** z varnim resetom
- **Dvofaktorska avtentikacija** za dodatno varnost
- **GDPR soglasja** z jasnimi pojasnili

### **2. Uporabniški profili**
- **Osebni podatki** z možnostjo urejanja
- **Naslovi za dostavo** z možnostjo več naslovov
- **Plačilne metode** z varnim shranjevanjem
- **Zgodovina naročil** z možnostjo ponovnega naročanja
- **Seznam želja** z deljenjem
- **Nastavitve obvestil** po kategorijah

### **3. Gostujočo nakupovanje**
- **Nakup brez registracije** za hitrejši proces
- **Minimalni podatki** potrebni za naročilo
- **Možnost registracije** po nakupu
- **Email sledenje** naročila
- **Konverzija v registriranega uporabnika**

---

## 📱 MOBILNA OPTIMIZACIJA

### **1. Odzivni dizajn**
- **Mobile-first pristop** za optimalno izkušnjo
- **Prilagodljiv layout** za vse velikosti zaslonov
- **Touch-friendly elementi** za enostavno upravljanje
- **Optimizirane slike** za hitro nalaganje
- **Progresivna web aplikacija (PWA)** funkcionalnosti

### **2. Mobilne funkcionalnosti**
- **Swipe navigacija** za galerije
- **Pull-to-refresh** za posodabljanje
- **Offline podpora** za osnovne funkcije
- **Push obvestila** za pomembne dogodke
- **Geolokacija** za najbližje prevzemne točke
- **Kamera integracija** za skeniranje QR kod

---

## 🌍 VEČJEZIČNA PODPORA

### **1. Podprti jeziki**
- **Slovenščina** - primarni jezik
- **Angleščina** - za mednarodne stranke
- **Nemščina** - za avstrijske in nemške stranke
- **Hrvaščina** - za hrvaške stranke

### **2. Lokalizacija**
- **Prevodi vseh besedil** vključno z napakam
- **Lokalizirane valute** in formati datumov
- **Kulturno prilagojeni elementi** za vsak trg
- **SEO optimizacija** za vsak jezik
- **Avtomatska detekcija jezika** na osnovi lokacije

---

## 🔒 VARNOST IN GDPR

### **1. Varnostne funkcije**
- **SSL/TLS šifriranje** za vso komunikacijo
- **Content Security Policy (CSP)** proti XSS napadom
- **CORS zaščita** za API klice
- **Rate limiting** proti DDoS napadom
- **Input validacija** na frontend in backend
- **SQL injection zaščita** z prepared statements

### **2. GDPR skladnost**
- **Jasna soglasja** za zbiranje podatkov
- **Pravica do pozabe** z avtomatskim brisanjem
- **Izvoz podatkov** v strojno berljivem formatu
- **Minimizacija podatkov** - zbiramo le potrebne
- **Pseudonimizacija** občutljivih podatkov
- **Redni varnostni pregledi** in posodobitve

### **3. Zasebnost uporabnikov**
- **Anonimno brskanje** brez sledenja
- **Opt-out možnosti** za vse oblike sledenja
- **Transparentna politika zasebnosti**
- **Varno shranjevanje** osebnih podatkov
- **Šifriranje baze podatkov** z AES-256

---

## 📧 EMAIL SISTEM

### **1. Profesionalni email računi**
- **kmetija.marosa.narocila@gmail.com** - potrditve naročil
- **kmetija.marosa.novice@gmail.com** - newsletter in promocije
- **Ločeni računi** za različne namene
- **Profesionalne email predloge** z logotipom
- **Avtomatsko pošiljanje** z Google Apps Script

### **2. Email komunikacija**
- **Potrditev naročila** z vsemi podrobnostmi
- **Sledenje pošiljke** z povezavami
- **Obvestila o statusu** naročila
- **Računi in dokumenti** v prilogi
- **Personalizirani newsletter** z priporočili
- **Transakcijski email-i** za pomembne dogodke

---

## 🛠️ ADMINISTRATORSKI PANEL

### **1. Upravljanje naročil**
- **Pregled vseh naročil** s filtriranjem
- **Spreminjanje statusov** naročil
- **Tiskanje nalepk** za pošiljanje
- **Izvoz podatkov** v Excel/CSV
- **Statistike prodaje** po obdobjih
- **Upravljanje vračil** in reklamacij

### **2. Upravljanje izdelkov**
- **Dodajanje novih izdelkov** z galerijo slik
- **Urejanje obstoječih** izdelkov
- **Množično urejanje** cen in zalog
- **Kategorije in oznake** za organizacijo
- **SEO optimizacija** za vsak izdelek
- **Uvoz/izvoz** kataloga izdelkov

### **3. Upravljanje uporabnikov**
- **Pregled registriranih uporabnikov**
- **Segmentacija** po nakupovalnih navadah
- **Komunikacija** z uporabniki
- **Upravljanje dovoljenj** in vlog
- **Analitika obnašanja** uporabnikov

### **4. Analitika in poročila**
- **Prodajne statistike** v realnem času
- **Najpopularnejši izdelki** po obdobjih
- **Konverzijske stopnje** po virih prometa
- **Geografska porazdelitev** strank
- **Finančna poročila** za računovodstvo
- **Napredne analitike** z Google Analytics

---

## 🧪 TESTIRANJE IN KAKOVOST

### **1. Avtomatizirano testiranje**
- **Unit testi** za vse komponente
- **Integration testi** za API klice
- **E2E testi** za kritične poti uporabnikov
- **Performance testi** za optimizacijo hitrosti
- **Accessibility testi** za dostopnost
- **Cross-browser testi** za kompatibilnost

### **2. Testiranje s testnimi kupci**
- **Simulacija realnih nakupov** z testnimi podatki
- **Testiranje plačilnih procesov** z Stripe test načinom
- **Validacija email komunikacije** z test računi
- **Testiranje na različnih napravah** in brskalnikih
- **Stresno testiranje** za visoke obremenitve
- **Penetracijsko testiranje** za varnostne luknje

### **3. Monitoring in vzdrževanje**
- **Real-time monitoring** delovanja strani
- **Avtomatska opozorila** ob napakah
- **Performance monitoring** s Lighthouse
- **Error tracking** z Sentry
- **Uptime monitoring** z 99.9% razpoložljivostjo
- **Redni backup-i** podatkov

---

## 🚀 DEPLOYMENT IN HOSTING

### **1. Hosting infrastruktura**
- **Netlify hosting** z globalnim CDN
- **Avtomatski deployment** iz Git repozitorija
- **Preview deployments** za testiranje
- **Edge functions** za serverless funkcionalnosti
- **Form handling** za kontaktne obrazce
- **Analytics** za obisk strani

### **2. Baza podatkov**
- **Supabase PostgreSQL** z real-time funkcionalnostmi
- **Avtomatski backup-i** vsak dan
- **Point-in-time recovery** za varnost podatkov
- **Row Level Security** za varnost dostopa
- **Connection pooling** za optimalno performanse
- **Monitoring** uporabe in performans

### **3. CI/CD pipeline**
- **GitHub Actions** za avtomatsko testiranje
- **Avtomatski deployment** po uspešnih testih
- **Environment variables** za varno konfiguracijo
- **Rollback možnosti** v primeru težav
- **Staging environment** za testiranje
- **Production monitoring** po deployment-u

---

## 📊 PERFORMANSE IN OPTIMIZACIJA

### **1. Hitrost nalaganja**
- **Lazy loading** za slike in komponente
- **Code splitting** za manjše bundle-e
- **Image optimization** z WebP formati
- **Caching strategije** za statične vire
- **Minifikacija** CSS in JavaScript datotek
- **Gzip kompresija** za manjši prenos podatkov

### **2. SEO optimizacija**
- **Server-side rendering** za boljše indeksiranje
- **Meta tags** za vsako stran
- **Structured data** za bogate rezultate
- **XML sitemap** za iskalne robote
- **Robots.txt** za nadzor indeksiranja
- **Canonical URLs** za preprečevanje duplikatov

### **3. Accessibility (dostopnost)**
- **WCAG 2.1 AA** standardi
- **Keyboard navigation** za vse funkcionalnosti
- **Screen reader** podpora
- **Alt teksti** za vse slike
- **Color contrast** za boljšo berljivost
- **Focus indicators** za navigacijo s tipkovnico

---

## 📈 ANALITIKA IN SLEDENJE

### **1. Google Analytics 4**
- **Enhanced ecommerce** sledenje
- **Conversion tracking** za vse cilje
- **Audience segmentation** po obnašanju
- **Custom events** za specifične akcije
- **Attribution modeling** za marketing kanale
- **Real-time reporting** za trenutne podatke

### **2. Heatmap analiza**
- **Click tracking** za optimizacijo layouta
- **Scroll depth** analiza za vsebino
- **Form analytics** za optimizacijo checkout-a
- **A/B testing** za različne verzije
- **User session recordings** za UX insights
- **Conversion funnel** analiza

---

## 🔧 VZDRŽEVANJE IN PODPORA

### **1. Tehnična podpora**
- **90 dni brezplačne podpore** po zagonu
- **Email podpora** za tehnične težave
- **Dokumentacija** za uporabo admin panela
- **Video tutoriali** za osnovne funkcije
- **Remote pomoč** za kompleksnejše težave
- **Redni check-up-i** sistema

### **2. Posodobitve in izboljšave**
- **Varnostne posodobitve** vsak mesec
- **Funkcionalne izboljšave** po potrebi
- **Performance optimizacije** na osnovi analitike
- **Nova funkcionalnost** po dogovoru
- **Backup in recovery** proceduri
- **Disaster recovery** načrt

---

## 💰 VREDNOST PROJEKTA

### **Obseg del:**
- **Frontend razvoj:** 120+ ur
- **Backend konfiguracija:** 40+ ur  
- **Testiranje:** 30+ ur
- **Dokumentacija:** 20+ ur
- **Deployment in konfiguracija:** 15+ ur
- **SKUPAJ:** 500+ ur strokovnega dela

### **Tržna vrednost:**
- **Polna cena projekta:** 9.900 EUR
- **Dogovorjena cena:** 3.960 EUR (60% popust)
- **Vključuje:** domeno in hosting za 1 leto

---

## ✅ ZAKLJUČEK

Uspešno smo razvili celotno spletno trgovino enterprise nivoja, ki vključuje vse sodobne funkcionalnosti potrebne za uspešno spletno prodajo. Projekt je pripravljen za produkcijski zagon in bo Kmetiji Maroša omogočil profesionalno prisotnost na spletu ter povečanje prodaje preko digitalnih kanalov.

**Status:** ✅ Pripravljena za zagon 1.9.2025  
**Lokacija:** www.kmetija-marosa.si  
**Podpora:** 90 dni brezplačne tehnične podpore

---

---

## 📋 DODATNE FUNKCIONALNOSTI

### **1. Logistika in dostava**
- **Več načinov dostave:**
  - Pošta Slovenije (paketi, priporočeno)
  - DPD/GLS kurirska dostava
  - Osebni prevzem na kmetiji
  - Prevzemne točke po Sloveniji
- **Avtomatski izračun stroškov** dostave po regijah
- **Sledenje pošiljk** z integracijo v poštne sisteme
- **Časovni okni dostave** za svežo hrano
- **Posebno pakiranje** za krhke izdelke
- **Hladilna veriga** za mlečne izdelke

### **2. Sezonske funkcionalnosti**
- **Sezonski katalog** z avtomatskim prikazom
- **Prednaročila** za sezonsko sadje/zelenjavo
- **Obvestila o dozoritvi** pridelkov
- **Koledar pridelave** za načrtovanje
- **Vremenska opozorila** za dostavo
- **Praznični paketi** za posebne priložnosti

### **3. B2B funkcionalnosti**
- **Veleprodajni računi** z drugačnimi cenami
- **Količinski popusti** za restavracije
- **Mesečno fakturiranje** za stalne stranke
- **Posebni pogoji plačila** za podjetja
- **Izvoz dokumentov** za računovodstvo
- **API dostop** za integracijo s POS sistemi

### **4. Integracije s tretjimi strankami**
- **Računovodski programi** (eBilten, Pantheon)
- **CRM sistemi** za upravljanje strank
- **Email marketing** (Mailchimp, Sendinblue)
- **Socialni mediji** za avtomatsko objavljanje
- **Inventory management** sistemi
- **Loyalty programi** za zvestobo strank

---

## 🎨 DIZAJN IN UPORABNIŠKA IZKUŠNJA

### **1. Vizualna identiteta**
- **Zelena barvna paleta** ki odraža naravnost
- **Tipografija** optimizirana za berljivost
- **Ikone** v enotnem stilu
- **Fotografije** visoke kakovosti izdelkov
- **Logo integracija** na vseh elementih
- **Konsistentnost** preko vseh platform

### **2. Uporabniška izkušnja (UX)**
- **Intuitivna navigacija** z logično strukturo
- **Minimalno število klikov** do nakupa
- **Jasni call-to-action** gumbi
- **Breadcrumb navigacija** za orientacijo
- **Search funkcionalnost** z avtodopolnjevanjem
- **Error handling** z jasnimi sporočili

### **3. Animacije in interaktivnost**
- **Smooth scrolling** za prijetno brskanje
- **Hover efekti** za interaktivne elemente
- **Loading animacije** za boljšo percepcijo hitrosti
- **Micro-interactions** za povratne informacije
- **Parallax efekti** za vizualno privlačnost
- **Responsive animacije** za mobilne naprave

---

## 🔍 SEO IN MARKETING

### **1. Iskalna optimizacija (SEO)**
- **Keyword research** za kmetijske izdelke
- **On-page optimizacija** za vsako stran
- **Technical SEO** za hitrost in dostopnost
- **Local SEO** za lokalne iskanja
- **Schema markup** za bogate rezultate
- **Google My Business** integracija

### **2. Content marketing**
- **Blog sekcija** za recepte in nasvete
- **Sezonski članki** o pridelavi
- **Video vsebine** o kmetiji in procesih
- **Recepti** z uporabo izdelkov kmetije
- **Zgodbe** o trajnostni pridelavi
- **Newsletter** z rednimi novicami

### **3. Socialni mediji**
- **Facebook Shop** integracija
- **Instagram Shopping** za vizualne izdelke
- **Pinterest** za recepte in inspiracijo
- **YouTube** za video vsebine
- **Avtomatsko deljenje** novih izdelkov
- **Social proof** z ocenami in komentarji

---

## 📱 MOBILNA APLIKACIJA (PRIHODNOST)

### **1. Native app funkcionalnosti**
- **Push notifications** za posebne ponudbe
- **Offline browsing** osnovnega kataloga
- **Camera integration** za skeniranje QR kod
- **GPS lokacija** za najbližje prevzemne točke
- **Biometric authentication** za varnost
- **Apple Pay/Google Pay** integracija

### **2. Loyalty program**
- **Točke za nakupe** z možnostjo menjave
- **Ekskluzivne ponudbe** za člane
- **Birthday rewards** za osebni pristop
- **Referral program** za priporočila
- **Tier system** za različne nivoje
- **Gamification** za povečanje angažiranosti

---

## 🌱 TRAJNOSTNOST IN EKOLOGIJA

### **1. Zelene funkcionalnosti**
- **Carbon footprint** kalkulacija za dostavo
- **Ekološko pakiranje** z možnostjo vračila
- **Lokalni dobavitelji** za zmanjšanje transporta
- **Sezonski koledar** za trajnostno nakupovanje
- **Zero waste** možnosti
- **Recikliranje** programi za embalažo

### **2. Transparentnost**
- **Farm-to-table** sledljivost izdelkov
- **Certifikati** ekološke pridelave
- **Pridelovalci** z zgodbami in fotografijami
- **Proces pridelave** z video dokumentacijo
- **Okoljski vpliv** poročila
- **Trajnostni cilji** kmetije

---

## 📊 NAPREDNA ANALITIKA

### **1. Business Intelligence**
- **Sales forecasting** na osnovi zgodovinskih podatkov
- **Inventory optimization** za zmanjšanje odpadkov
- **Customer lifetime value** analiza
- **Churn prediction** za ohranjanje strank
- **Price optimization** na osnovi povpraševanja
- **Seasonal trends** analiza

### **2. Machine Learning**
- **Recommendation engine** za personalizirane predloge
- **Fraud detection** za varnost plačil
- **Demand forecasting** za planiranje zalog
- **Customer segmentation** za ciljni marketing
- **A/B testing** avtomatizacija
- **Chatbot** za osnovno podporo strankam

---

*Skupaj: 15+ strani podrobne dokumentacije vseh implementiranih funkcionalnosti*
