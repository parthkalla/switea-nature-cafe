import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { GalleryImage } from '../../types';

export const GalleryPage: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    async function loadGallery() {
      try {
        const res = await api.getLandingPage('switea');
        if (res.gallery) {
          setImages(res.gallery);
        }
      } catch (err) {
        console.error('Failed to load gallery:', err);
      }
    }
    loadGallery();
  }, []);

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col selection:bg-nature-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-wider font-bold text-nature-700 block">
            Visual Ambiance
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900">
            Switea Nature Gallery
          </h1>
          <p className="text-sm text-stone-600">
            A glimpse into our leafy garden cafe corners, steaming clay kulhads, and evening fairy-light dinners.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => setSelectedImage(img)}
              className="group cursor-pointer rounded-3xl overflow-hidden bg-stone-100 shadow-soft hover:shadow-card transition-all aspect-[4/3] relative"
            >
              <img
                src={img.imageUrl}
                alt={img.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 text-white">
                <span className="font-serif font-bold text-base">{img.title}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <div className="max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
            <img src={selectedImage.imageUrl} alt={selectedImage.title} className="max-h-[80vh] w-auto object-contain" />
            <p className="text-center text-white text-sm font-serif font-bold p-3 bg-nature-950">
              {selectedImage.title}
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
