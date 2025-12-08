import { useTranslation } from 'react-i18next';
import { Leaf, BookOpen, Home, Award } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';

export const AboutSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 } // Trigger when 20% of the section is visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section
      id="o-nas"
      ref={sectionRef}
      className="py-24 bg-gradient-to-b from-white to-brown-50"
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2
            className={`text-4xl lg:text-5xl font-bold text-brown-800 mb-4 transition-all duration-1000 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 -translate-y-6'}`}
          >
            {t('about.title')}
          </h2>
          <div
            className={`h-1 w-24 bg-amber-500 mx-auto transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 w-24' : 'opacity-0 w-0'}`}
          ></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Text Content */}
          <div
            className={`space-y-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 -translate-x-10'}`}
          >
            <p className="text-gray-700 leading-relaxed text-lg">{t('about.text1')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Leaf className="w-6 h-6 text-green-600" />
                <span className="text-lg text-brown-800">{t('about.ecoFriendly')}</span>
              </div>

              <div className="flex items-center gap-3">
                <Home className="w-6 h-6 text-amber-600" />
                <span className="text-lg text-brown-800">{t('about.localProduction')}</span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/o-nas"
                className="group relative overflow-hidden bg-brown-600 text-white px-4 py-2 rounded-md hover:bg-brown-700 transition-colors shadow-sm hover:shadow-md inline-flex items-center gap-2 text-lg font-medium"
              >
                <BookOpen className="w-5 h-5" />
                <span>{t('about.readMore')}</span>
              </Link>
            </div>
          </div>

          {/* Right Column - Image */}
          <div
            className={`relative transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 translate-x-10'}`}
          >
            <div className="relative">
              <img
                src={getImageUrl('/images/o nas.png')}
                alt={t('about.imageAlt')}
                className="w-full h-auto rounded-xl shadow-xl object-cover"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-lg">
                <Award className="w-12 h-12 text-amber-500" />
              </div>
            </div>
            <div className="absolute -z-10 top-6 -right-6 w-full h-full bg-amber-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
