import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ui/toast';
import api from '../lib/api';
import axios from 'axios';
import { Camera, Save, RefreshCw, User } from 'lucide-react';

export default function ProfileTab() {
  const { user, login } = useAuth();
  const toast = useToast();

  const [bio, setBio] = useState(user?.bio || '');
  const [description, setDescription] = useState(user?.description || '');
  const [profilePicUrl, setProfilePicUrl] = useState(user?.profilePicUrl || '');
  const [profilePicPath, setProfilePicPath] = useState(user?.profilePic || '');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast({ title: 'Image size must be less than 5MB', variant: 'error' });
    }

    setUploading(true);
    try {
      const filename = file.name;
      const contentType = file.type;
      
      const res = await api.post('/media/upload-url', {
        filename,
        contentType,
        folder: 'profile-pics',
      });

      const { signedUrl, filePath, publicUrl } = res.data;

      await axios.put(signedUrl, file, {
        headers: {
          'Content-Type': contentType,
        },
      });

      setProfilePicUrl(publicUrl);
      setProfilePicPath(filePath);

      toast({ title: 'Profile image uploaded successfully', variant: 'success' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to upload profile picture', variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/user/profile', {
        bio,
        description,
        profilePic: profilePicPath,
      });

      toast({ title: 'Profile saved successfully', variant: 'success' });
      
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (err) {
      console.error(err);
      toast({ title: err.response?.data?.message || 'Error saving profile', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-on-surface-variant/50";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm p-8">
        <h3 className="font-bold text-on-surface text-lg mb-2 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" /> Edit Your Profile
        </h3>
        <p className="text-on-surface-variant text-sm mb-8">Customize how you appear to other members in your mentorship group.</p>

        <form onSubmit={handleSaveProfile} className="space-y-8">
          {/* Avatar Upload Container */}
          <div className="flex flex-col items-start gap-4">
            <label className="text-sm font-semibold text-on-surface">Profile Picture</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div
                onClick={handleImageClick}
                className="group relative w-24 h-24 rounded-full p-1 cursor-pointer bg-gradient-to-br from-primary to-primary-container border border-outline-variant/30 flex items-center justify-center overflow-hidden hover:shadow-md transition-all duration-300 shrink-0"
              >
                {profilePicUrl ? (
                  <img
                    src={profilePicUrl}
                    alt="Profile Preview"
                    className="w-full h-full object-cover rounded-full bg-surface transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface-variant text-2xl transition-all duration-300 group-hover:text-primary">
                    {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200 text-white rounded-full m-1 backdrop-blur-[2px]">
                  <Camera className="w-6 h-6" />
                </div>

                {/* Upload Spinner overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-surface/80 flex items-center justify-center text-primary rounded-full m-1 backdrop-blur-sm z-10">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <button 
                  type="button" 
                  onClick={handleImageClick}
                  className="px-5 py-2.5 text-sm font-semibold text-primary bg-primary-container/40 hover:bg-primary-container rounded-xl transition-colors border border-primary/20 w-fit"
                >
                  Change Avatar
                </button>
                <span className="text-[11px] text-on-surface-variant font-medium">Max size: 5MB</span>
              </div>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="h-px w-full bg-outline-variant/20"></div>

          {/* Short Bio */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-sm font-semibold text-on-surface">Bio (Short summary)</label>
            <input
              type="text"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="e.g. Passionate about machine learning & Competitive Programming"
              maxLength={100}
              className={inputClass}
            />
            <span className="text-right text-[10px] text-on-surface-variant font-medium">{bio.length}/100</span>
          </div>

          {/* Detailed Description */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-sm font-semibold text-on-surface">About Me (Detailed Description)</label>
            <textarea
              rows={5}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Share details about your background, interests, when you are available, and what you're looking forward to in the mentorship program..."
              className={`${inputClass} resize-none`}
              maxLength={1000}
            />
            <span className="text-right text-[10px] text-on-surface-variant font-medium">{description.length}/1000</span>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-on-primary-fixed-variant text-on-primary transition-colors duration-200 font-semibold text-sm px-8 py-3.5 rounded-xl shadow-sm hover:shadow disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
