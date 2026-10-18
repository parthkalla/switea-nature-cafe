import React, { useEffect, useState } from 'react';
import { Palette, Check, Save, ExternalLink, Sparkles } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ImageUploadField } from '../../components/common/ImageUploadField';
import { api } from '../../services/api';
import { LandingPageContent } from '../../types';

export const AdminBranding: React.FC = () => {
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadEditor() {
      try {
        const res = await api.getLandingEditor();
        setContent(res.content);
      } catch (err) {
        console.error('Failed to load landing editor:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEditor();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    try {
      setSaving(true);
      await api.updateLandingEditor(content);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save landing page changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !content) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-xs text-stone-400">Loading landing editor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Landing Page & Branding Editor</h1>
            <p className="text-xs text-stone-500 mt-1">Changes update the official website live instantly</p>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-nature-900 bg-white border border-stone-200 px-4 py-2.5 rounded-xl shadow-sm hover:bg-stone-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Live Site</span>
          </a>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Landing page content updated live in database!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Announcement Banner */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-stone-900">Announcement Bar</h2>
              <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.announcementActive}
                  onChange={(e) => setContent({ ...content, announcementActive: e.target.checked })}
                  className="w-4 h-4 text-nature-900 rounded"
                />
                <span>Active on Homepage</span>
              </label>
            </div>
            <input
              type="text"
              value={content.announcementText || ''}
              onChange={(e) => setContent({ ...content, announcementText: e.target.value })}
              placeholder="e.g. Welcome to Switea! Enjoy 10% off with code NATURE10"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
            />
          </div>

          {/* Hero Section */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
            <h2 className="font-serif font-bold text-base text-stone-900 pb-2 border-b border-stone-100">
              Hero Section
            </h2>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                Hero Headline
              </label>
              <input
                type="text"
                value={content.heroTitle}
                onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                Hero Subtitle
              </label>
              <textarea
                rows={2}
                value={content.heroSubtitle}
                onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
              />
            </div>

            <div>
              <ImageUploadField
                label="Hero Background Photo"
                value={content.heroImage || ''}
                onChange={(url) => setContent({ ...content, heroImage: url })}
                placeholder="Upload hero photo from device or paste URL"
              />
            </div>
          </div>

          {/* About Cafe Section */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
            <h2 className="font-serif font-bold text-base text-stone-900 pb-2 border-b border-stone-100">
              About Section & Story
            </h2>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                About Headline
              </label>
              <input
                type="text"
                value={content.aboutTitle}
                onChange={(e) => setContent({ ...content, aboutTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                Brand Story Content
              </label>
              <textarea
                rows={3}
                value={content.aboutText}
                onChange={(e) => setContent({ ...content, aboutText: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                  Highlight 1
                </label>
                <input
                  type="text"
                  value={content.aboutHighlight1}
                  onChange={(e) => setContent({ ...content, aboutHighlight1: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                  Highlight 2
                </label>
                <input
                  type="text"
                  value={content.aboutHighlight2}
                  onChange={(e) => setContent({ ...content, aboutHighlight2: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                  Highlight 3
                </label>
                <input
                  type="text"
                  value={content.aboutHighlight3}
                  onChange={(e) => setContent({ ...content, aboutHighlight3: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <ImageUploadField
                label="About Cafe Ambience Photo"
                value={content.aboutImage || ''}
                onChange={(url) => setContent({ ...content, aboutImage: url })}
                placeholder="Upload cafe story photo or paste URL"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-nature-900 hover:bg-nature-950 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-nature-300" />
              <span>{saving ? 'Publishing...' : 'Publish to Live Website'}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};
