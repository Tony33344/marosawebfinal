export interface Product {
  id: number; // Original ID from the static file, won't be used as primary key in DB
  name: string;
  description: string;
  image: string;
  weight?: string;
  price?: string; // Price includes currency symbol and uses comma decimal separator
}

// Keep the original data structure here
export const products: Product[] = [
  {
    id: 1,
    name: 'Bučno olje',
    description: 'Tradicionalno slovensko bučno olje iz ekološko pridelanih buč',
    image: './images/bucno olje/bucno olje 1.jpeg',
    weight: "0,5l",
    price: "10,00 €"
  },
  {
    id: 2,
    name: 'Bučno olje',
    description: 'Tradicionalno slovensko bučno olje iz ekološko pridelanih buč',
    image: './images/bucno olje/bucno olje 1.jpeg',
    weight: "1l",
    price: "19,00 €"
  },
  {
    id: 3,
    name: 'Bučna semena',
    description: 'Ekološko pridelana bučna semena',
    image: 'https://i.ibb.co/s9X6Qt57/bucna-semena-1.jpg',
    weight: "200g",
    price: "3,00 €"
  },
  {
    id: 4,
    name: 'Konopljino olje',
    description: 'Hladno stiskano konopljino olje',
    image: 'https://www.verywellhealth.com/thmb/VTzyI6R14fhCK-Rh8O2h_CK-ovk=/4500x3000/filters:fill(87E3EF,1)/HempOilforSkin-HempSeedOil-RezkrrGettyImages-5c788de5c9e77c0001d19ce5.jpg',
    weight: "0,25l",
    price: "8,00 €"
  },
  {
    id: 5,
    name: 'Konopljin čaj',
    description: 'Ekološko pridelan konopljin čaj',
    image: 'https://medicanco.com/wp-content/uploads/2020/02/How%E2%80%8C-%E2%80%8CDo%E2%80%8C-%E2%80%8CYou%E2%80%8C-%E2%80%8CMake%E2%80%8C-%E2%80%8CMarijuana%E2%80%8C-%E2%80%8CTea.jpg',
    weight: "20g",
    price: "3,00 €"
  },
  {
    id: 6,
    name: 'Konopljin čaj',
    description: 'Ekološko pridelan konopljin čaj',
    image: 'https://medicanco.com/wp-content/uploads/2020/02/How%E2%80%8C-%E2%80%8CDo%E2%80%8C-%E2%80%8CYou%E2%80%8C-%E2%80%8CMake%E2%80%8C-%E2%80%8CMarijuana%E2%80%8C-%E2%80%8CTea.jpg',
    weight: "40g",
    price: "6,00 €"
  },
  {
    id: 7,
    name: 'Melisa',
    description: 'Pomirjujoč zeliščni čaj',
    image: 'http://mamabruja.com/wp-content/uploads/2023/04/tim-krisztian-VP2lo1s02Bc-unsplash-3-scaled.jpg',
    weight: "20g",
    price: "4,00 €"
  },
  {
    id: 8,
    name: 'Poprova meta',
    description: 'Osvežujoč zeliščni čaj',
    image: 'https://i.ibb.co/0R1b72Cg/Poprova-meta-zacetna.png',
    weight: "20g",
    price: "4,00 €"
  },
  {
    id: 9,
    name: 'Ameriški slamnik',
    description: 'Zdravilni zeliščni čaj',
    image: 'https://i.ibb.co/M56v4WKC/Ameri-ki-slamnik-zacetna.jpg',
    weight: "20g",
    price: "4,00 €"
  },
  {
    id: 10,
    name: 'Kamilice',
    description: 'Pomirjujoč zeliščni čaj',
    image: 'https://i.ibb.co/99PH97wR/Kamilica1.jpg',
    weight: "20g",
    price: "4,00 €"
  },
  {
    id: 11,
    name: 'Aronija',
    description: 'Sveže stisnjen sok aronije',
    image: '/images/aronija/aronija.jpg',
    weight: "1l",
    price: "8,00 €"
  },
  {
    id: 12,
    name: 'Aronija',
    description: 'Sveže stisnjen sok aronije',
    image: '/images/aronija/aronija.jpg',
    weight: "0,5l",
    price: "5,00 €"
  },
  {
    id: 13,
    name: 'Ajdova kaša',
    description: 'Ekološko pridelana ajdova kaša',
    image: '/images/ajdovakasa/1.jpg',
    weight: "500g",
    price: "2,80 €"
  },
  {
    id: 14,
    name: 'Ajdova kaša',
    description: 'Ekološko pridelana ajdova kaša',
    image: '/images/ajdovakasa/1.jpg',
    weight: "1kg",
    price: "4,50 €"
  },
  {
    id: 15,
    name: 'Prosena kaša',
    description: 'Ekološko pridelana prosena kaša',
    image: 'https://beta.finance.si/pics/cache_pr/prosena-kasa01-ss-5b9f656a4407c-5b9f656a5a25d.JPG.cut.n-5b9f65737daac.jpg',
    weight: "500g",
    price: "2,50 €"
  },
  {
    id: 16,
    name: 'Prosena kaša',
    description: 'Ekološko pridelana prosena kaša',
    image: 'https://beta.finance.si/pics/cache_pr/prosena-kasa01-ss-5b9f656a4407c-5b9f656a5a25d.JPG.cut.n-5b9f65737daac.jpg',
    weight: "1kg",
    price: "4,00 €"
  },
  {
    id: 17,
    name: 'Fižol češnjevec',
    description: 'Tradicionalni slovenski fižol',
    image: 'https://onaplus.delo.si/media/images/20230219/1387063.1d06b693.fill-1200x630.jpg?rev=2',
    weight: "1kg",
    price: "6,00 €"
  },
  {
    id: 18,
    name: 'Pegasti badelj',
    description: 'Ekološko pridelana semena za zdravo življenje',
    image: 'https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/pegasti-badelj/pegastibadeljmain.png',
    weight: "250g",
    price: "9,50 €"
  }
];

// This function is kept for potential use within the frontend later,
// but it's not used by the migration script.
export function getRelatedProducts(productName: string): Product[] {
  return products.filter(p => p.name === productName);
}
