"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import { Upload, Send, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import './Share_Experience.css';
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FaCamera, FaMapMarkerAlt, FaLeaf, FaCheck, FaArrowLeft } from "react-icons/fa";
import AnimatedSection from "../../components/AnimatedSection";
import { useTheme } from "../../components/ThemeProvider";

interface TreeData {
  name: string;
  family_name: string;
  scientific_name: string;
  location: string;
  gen_info: string;
  distribution: string;
  image_url: string;
}

const ShareExperience = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [formData, setFormData] = useState<TreeData>({
    name: '',
    family_name: '',
    scientific_name: '',
    location: '',
    gen_info: '',
    distribution: '',
    image_url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const MapEvents = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setFormData(prev => ({
          ...prev,
          location: `${lat.toFixed(6)},${lng.toFixed(6)}`
        }));
      },
    });
    return null;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const file = e.target.files[0];
    setImageUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Upload failed');
      
      const { url } = await res.json();
      setFormData(prev => ({ ...prev, image_url: url }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error('Submission failed');
      
      toast.success('Tree information submitted successfully!');
      setFormData({
        name: '',
        family_name: '',
        scientific_name: '',
        location: '',
        gen_info: '',
        distribution: '',
        image_url: '',
      });
    } catch (error) {
      toast.error('Failed to submit tree information');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedSection className="share-experience-container" delay={0.2}>
      <div className="share-experience">
        <div className="hero-section">
          <h1>Share Your Tree Discovery</h1>
          <p>Help us grow our database by sharing information about trees in your area</p>
        </div>

        <div className="form-wrapper">
          <form onSubmit={handleSubmit} className="tree-form">
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="name">Tree Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter common name of the tree"
                />
              </div>

              <div className="input-group">
                <label htmlFor="family">Family Name</label>
                <input
                  id="family"
                  type="text"
                  required
                  value={formData.family_name}
                  onChange={e => setFormData(prev => ({ ...prev, family_name: e.target.value }))}
                  placeholder="Enter tree family name"
                />
              </div>

              <div className="input-group">
                <label htmlFor="scientific">Scientific Name</label>
                <input
                  id="scientific"
                  type="text"
                  required
                  value={formData.scientific_name}
                  onChange={e => setFormData(prev => ({ ...prev, scientific_name: e.target.value }))}
                  placeholder="Enter scientific name"
                />
              </div>

              <div className="input-group full-width">
                <label>
                  <MapPin className="icon" size={18} />
                  Location
                </label>
                <input
                  type="text"
                  required
                  readOnly
                  value={formData.location}
                  placeholder="Click on the map to set location"
                />
                {mounted && (
                  <div className="map-container">
                    <MapContainer
                      center={[16.5333, 120.4000]}
                      zoom={13}
                      className="map"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                      />
                      {formData.location && (
                        <Marker 
                          position={formData.location.split(',').map(Number) as LatLngTuple} 
                        />
                      )}
                      <MapEvents />
                    </MapContainer>
                  </div>
                )}
              </div>

              <div className="input-group full-width">
                <label htmlFor="info">General Information</label>
                <textarea
                  id="info"
                  rows={4}
                  value={formData.gen_info}
                  onChange={e => setFormData(prev => ({ ...prev, gen_info: e.target.value }))}
                  placeholder="Describe the tree's characteristics..."
                />
              </div>

              <div className="input-group full-width">
                <label htmlFor="distribution">Distribution</label>
                <textarea
                  id="distribution"
                  rows={4}
                  value={formData.distribution}
                  onChange={e => setFormData(prev => ({ ...prev, distribution: e.target.value }))}
                  placeholder="Describe where this tree species can be found..."
                />
              </div>

              <div className="input-group full-width">
                <label>
                  <Upload className="icon" size={18} />
                  Tree Image
                </label>
                <div className="file-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                  />
                  {imageUploading && <Loader2 className="spin" size={20} />}
                </div>
                {formData.image_url && (
                  <div className="image-preview">
                    <img src={formData.image_url} alt="Tree preview" />
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="submit-button" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="spin" size={20} />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Tree Information
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default ShareExperience;
