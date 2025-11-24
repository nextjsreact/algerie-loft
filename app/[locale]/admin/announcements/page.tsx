'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Announcement {
  id: string;
  message_fr: string;
  message_en: string;
  message_ar: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  background_color: string;
  text_color: string;
  created_at: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const [formData, setFormData] = useState({
    message_fr: '',
    message_en: '',
    message_ar: '',
    duration_days: 7,
    background_color: '#EF4444',
    text_color: '#FFFFFF',
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('urgent_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + formData.duration_days);

    const announcementData = {
      message_fr: formData.message_fr,
      message_en: formData.message_en,
      message_ar: formData.message_ar,
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
      background_color: formData.background_color,
      text_color: formData.text_color,
      is_active: true,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('urgent_announcements')
          .update(announcementData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('urgent_announcements')
          .insert([announcementData]);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      
      // Messages d'erreur plus explicites
      let errorMessage = 'Erreur lors de la sauvegarde';
      
      if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
        errorMessage = '❌ La table n\'existe pas encore.\n\n' +
                      '📋 Veuillez exécuter le SQL de migration dans Supabase.\n' +
                      'Voir: INSTALLATION_ANNONCES.md';
      } else if (error?.message?.includes('permission denied') || error?.message?.includes('policy')) {
        errorMessage = '❌ Permission refusée.\n\n' +
                      'Vous devez être Admin ou Superuser pour créer des annonces.\n' +
                      'Vérifiez votre rôle dans la table profiles.';
      } else if (error?.message) {
        errorMessage = `Erreur: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      message_fr: announcement.message_fr,
      message_en: announcement.message_en,
      message_ar: announcement.message_ar,
      duration_days: Math.ceil(
        (new Date(announcement.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
      background_color: announcement.background_color,
      text_color: announcement.text_color,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;

    try {
      const { error } = await supabase
        .from('urgent_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('urgent_announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      message_fr: '',
      message_en: '',
      message_ar: '',
      duration_days: 7,
      background_color: '#EF4444',
      text_color: '#FFFFFF',
    });
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Message d'aide pour la première utilisation */}
      {announcements.length === 0 && !isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Première utilisation ?
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                Si vous voyez une erreur lors de la création, la table n'existe peut-être pas encore.
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                📋 Consultez <code className="bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded">INSTALLATION_ANNONCES.md</code> pour exécuter le SQL de migration.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Annonces Urgentes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez les bannières de promotion affichées sur la page d'accueil
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            resetForm();
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle annonce</span>
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
            {editingId ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Message FR */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message (Français) *
              </label>
              <input
                type="text"
                required
                value={formData.message_fr}
                onChange={(e) => setFormData({ ...formData, message_fr: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="🎉 Promotion spéciale : -20% sur tous les lofts ce week-end !"
              />
            </div>

            {/* Message EN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message (English) *
              </label>
              <input
                type="text"
                required
                value={formData.message_en}
                onChange={(e) => setFormData({ ...formData, message_en: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="🎉 Special promotion: -20% on all lofts this weekend!"
              />
            </div>

            {/* Message AR */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message (العربية) *
              </label>
              <input
                type="text"
                required
                dir="rtl"
                value={formData.message_ar}
                onChange={(e) => setFormData({ ...formData, message_ar: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-right"
                placeholder="🎉 عرض خاص: خصم 20٪ على جميع الشقق هذا الأسبوع!"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Durée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durée (jours) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="365"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Couleur de fond */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Couleur de fond
                </label>
                <input
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              {/* Couleur du texte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Couleur du texte
                </label>
                <input
                  type="color"
                  value={formData.text_color}
                  onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Aperçu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aperçu
              </label>
              <div
                className="p-4 rounded-lg text-center font-semibold"
                style={{
                  backgroundColor: formData.background_color,
                  color: formData.text_color,
                }}
              >
                {formData.message_fr || 'Votre message apparaîtra ici...'}
              </div>
            </div>

            {/* Boutons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                {editingId ? 'Mettre à jour' : 'Créer l\'annonce'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Liste des annonces */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Aucune annonce pour le moment
            </p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        announcement.is_active && !isExpired(announcement.end_date)
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {announcement.is_active && !isExpired(announcement.end_date)
                        ? 'Active'
                        : isExpired(announcement.end_date)
                        ? 'Expirée'
                        : 'Inactive'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Expire le {new Date(announcement.end_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div
                    className="p-4 rounded-lg mb-3"
                    style={{
                      backgroundColor: announcement.background_color,
                      color: announcement.text_color,
                    }}
                  >
                    <p className="font-semibold">{announcement.message_fr}</p>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p><strong>EN:</strong> {announcement.message_en}</p>
                    <p dir="rtl"><strong>AR:</strong> {announcement.message_ar}</p>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => toggleActive(announcement.id, announcement.is_active)}
                    className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    title={announcement.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {announcement.is_active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    title="Modifier"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
