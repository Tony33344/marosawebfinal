import { Footer } from '../components/Footer';
import { Image } from '../components/Image';
import { Newspaper, Calendar, Youtube, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface MediaItem {
  title: string;
  date: string;
  source: string;
  link: string;
  image?: string;
  excerpt: string;
  type: 'article' | 'video';
}

const mediaItems: MediaItem[] = [
  {
    title: "Kmetija Maroša - Tradicija in inovacije iz Melincev",
    date: "28.1.2025",
    source: "Sobotainfo.com",
    link: "https://sobotainfo.com/novica/scena/video-kmetija-marosa-tradicija-inovacije-iz-melincev/271187",
    image: "/images/articles/sobotainfo-tradicija-inovacije.png",
    excerpt: "Družinska kmetija Maroša iz Melincev je postala sinonim za kakovostno ekološko pridelavo. S svojim pristopom do trajnostnega kmetovanja in inovativnimi metodami pridelave predstavljajo svetel zgled v regiji.",
    type: "article"
  },
  {
    title: "Najprej je ekološki kmet postal sin nogometaš, potem še oče",
    date: "21.8.2024",
    source: "Finance.si",
    link: "https://agrobiznis.finance.si/agro-podjetnik/najprej-je-ekoloski-kmet-postal-sin-nogometas-potem-se-oce/a/9026397",
    image: "/images/articles/finance-nogomet-kmet.jpg",
    excerpt: "Zgodba o tem, kako sta oče in sin skupaj razvila uspešno ekološko kmetijo in kako se je njihova dejavnost razširila na pridelavo različnih ekoloških izdelkov.",
    type: "article"
  },
  {
    title: "Krmaril je med nogometom in ekološkim kmetovanjem",
    date: "19.11.2018",
    source: "Vestnik",
    link: "https://vestnik.svet24.si/clanek/aktualno/krmaril-je-med-nogometom-in-ekoloskim-kmetovanjem-721190",
    image: "/images/articles/vestnik-nogomet-kmetovanje.jpg",
    excerpt: "Aleš Maroša je uspešno združil svojo športno kariero z razvojem ekološke kmetije in danes uspešno vodi družinsko podjetje.",
    type: "article"
  },
  {
    title: "Ekološka kmetija Maroša iz Melincev",
    date: "7.8.2024",
    source: "Kmečki glas",
    link: "https://kristijanhrastar.kmeckiglas.com/ekoloska-kmetija-marosa-iz-melincev/",
    image: "/images/articles/kmecki-glas-marosa.jpg",
    excerpt: "Podroben vpogled v delovanje in razvoj ekološke kmetije Maroša, ki je postala primer dobre prakse v regiji.",
    type: "article"
  },
  {
    title: "V soboto največje število lokalnih ponudnikov do sedaj",
    date: "8.7.2022",
    source: "Sobotainfo.com",
    link: "https://sobotainfo.com/novica/lokalno/soboto-najvecje-stevilo-lokalnih-ponudnikov-do-sedaj/139586",
    image: "/images/articles/sobotainfo-lokalni-ponudniki.jpg",
    excerpt: "Kmetija Maroša med pomembnimi lokalnimi ponudniki na tradicionalnem dogodku.",
    type: "article"
  },
  {
    title: "Kmetija Maroša - Predstavitev ekološke pridelave",
    date: "28.1.2025",
    source: "YouTube",
    link: "https://www.youtube.com/watch?v=gWpyYZE1ISk",
    image: "https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/video/ZELENASKP.png",
    excerpt: "Video predstavitev naše ekološke pridelave in predelave.",
    type: "video"
  },
  {
    title: "Tradicija ekološkega kmetovanja",
    date: "21.8.2024",
    source: "YouTube",
    link: "https://www.youtube.com/watch?v=QRtKEiiaLOA",
    image: "https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/video/AgriFuture.png",
    excerpt: "Poglobljen pogled v našo tradicijo ekološkega kmetovanja in vizijo za prihodnost.",
    type: "video"
  }
];

const shopImages = [
  {
    url: 'https://i.ibb.co/HTY4Knvx/Trgovina1.jpg',
    alt: 'Trgovina Kmetije Maroša - Pogled 1'
  },
  {
    url: 'https://i.ibb.co/dsP24xPk/Trgovina2.jpg',
    alt: 'Trgovina Kmetije Maroša - Pogled 2'
  },
  {
    url: 'https://i.ibb.co/RkhFJgvr/Trgovina3.jpg',
    alt: 'Trgovina Kmetije Maroša - Pogled 3'
  },
  {
    url: 'https://i.ibb.co/nsKfd365/Trgovina4.jpg',
    alt: 'Trgovina Kmetije Maroša - Pogled 4'
  }
];

export function AboutPage() {
  const articles = mediaItems.filter(item => item.type === 'article');
  const videos = mediaItems.filter(item => item.type === 'video');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleNavigation = (section: string | null = null) => {
    navigate('/', { replace: true });
    if (section) {
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="py-20 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div id="nasa-zgodba" className="mb-16 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8 md:p-12">
              <h1 className="text-4xl font-bold mb-8 text-brown-800">{t('aboutPage.story.title')}</h1>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="mb-6">
                  {t('aboutPage.story.content1')}
                </p>
                <p className="mb-6">
                  {t('aboutPage.story.content2')}
                </p>
                <p>
                  {t('aboutPage.story.content3')}
                </p>
              </div>
            </div>
          </div>

          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-brown-800 flex items-center gap-3">
              <Store className="w-8 h-8" />
              {t('aboutPage.shop.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shopImages.map((image, index) => (
                <div
                  key={index}
                  className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  <img
                    src={image.url}
                    alt={t(`aboutPage.shop.image${index + 1}Alt`)}
                    className="w-full h-[300px] object-cover"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-bold mb-8 text-brown-800 flex items-center gap-3">
                <Newspaper className="w-8 h-8" />
                {t('aboutPage.media.articles')}
              </h2>

              <div className="grid gap-8">
                {articles.map((item, index) => (
                  <article key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="md:flex">
                      {item.image && (
                        <div className="md:w-1/3">
                          <Image
                            src={item.image || '/images/placeholder.svg'}
                            alt={item.title}
                            className="w-full h-64 object-cover"
                          />
                        </div>
                      )}
                      <div className="p-8 md:w-2/3">
                        <div className="flex items-center gap-2 text-brown-600 mb-3">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{item.date}</span>
                          <span className="text-sm font-medium">{item.source}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{item.excerpt}</p>
                        <a
                          href={item.link}
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(item.link, '_blank', 'noopener,noreferrer');
                          }}
                          className="inline-flex items-center px-4 py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700 transition-colors duration-200"
                        >
                          {t('aboutPage.media.readArticle')}
                          <span aria-hidden="true" className="ml-2">→</span>
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-8 text-brown-800 flex items-center gap-3">
                <Youtube className="w-8 h-8" />
                {t('aboutPage.media.videos')}
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {videos.map((item, index) => (
                  <article key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="aspect-video relative">
                      <Image
                        src={item.image || '/images/placeholder.svg'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Youtube className="w-16 h-16 text-white opacity-80" />
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-brown-600 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{item.date}</span>
                        <span className="text-sm font-medium">{item.source}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{item.excerpt}</p>
                      <a
                        href={item.link}
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(item.link, '_blank', 'noopener,noreferrer');
                        }}
                        className="inline-flex items-center px-4 py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700 transition-colors duration-200"
                      >
                        {t('aboutPage.media.watchVideo')}
                        <span aria-hidden="true" className="ml-2">→</span>
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
