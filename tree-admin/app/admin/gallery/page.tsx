"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Check, Trash2, ArrowLeft, TreePine } from "lucide-react";
import Link from "next/link";

interface GalleryImage {
  id: number;
  image_url: string;
  title: string;
  description: string;
  user_name: string;
  user_email: string;
  tree_id: number | null;
  approved: boolean;
  created_at: string;
}

enum TabType {
  PENDING = 'pending',
  APPROVED = 'approved'
}

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.PENDING);
  const [pendingImages, setPendingImages] = useState<GalleryImage[]>([]);
  const [approvedImages, setApprovedImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const router = useRouter();

  useEffect(() => {
    if (activeTab === TabType.PENDING) {
      fetchPendingImages();
    } else {
      fetchApprovedImages();
    }
  }, [activeTab]);

  async function fetchPendingImages() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/gallery/pending");
      if (!response.ok) {
        throw new Error("Failed to fetch pending gallery images");
      }
      const data = await response.json();
      setPendingImages(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pending gallery images:", error);
      setLoading(false);
      setMessage({
        text: "Failed to load pending images. Please try again.",
        type: "error",
      });
    }
  }

  async function fetchApprovedImages() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/gallery/approved");
      if (!response.ok) {
        throw new Error("Failed to fetch approved gallery images");
      }
      const data = await response.json();
      setApprovedImages(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching approved gallery images:", error);
      setLoading(false);
      setMessage({
        text: "Failed to load approved images. Please try again.",
        type: "error",
      });
    }
  }

  async function handleApprove(id: number) {
    try {
      const response = await fetch(`/api/admin/gallery/approve/${id}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to approve image");
      }

      setMessage({
        text: "Image approved successfully!",
        type: "success",
      });

      // Remove the approved image from the pending list
      setPendingImages(pendingImages.filter(img => img.id !== id));
      
      // Refresh the approved images if we're on the approved tab
      if (activeTab === TabType.APPROVED) {
        fetchApprovedImages();
      }
    } catch (error) {
      console.error("Error approving image:", error);
      setMessage({
        text: "Failed to approve image. Please try again.",
        type: "error",
      });
    }
  }

  async function handleReject(id: number) {
    try {
      const response = await fetch(`/api/admin/gallery/reject/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to reject image");
      }

      setMessage({
        text: "Image rejected and removed successfully!",
        type: "success",
      });

      // Remove the rejected image from the pending list
      setPendingImages(pendingImages.filter(img => img.id !== id));
    } catch (error) {
      console.error("Error rejecting image:", error);
      setMessage({
        text: "Failed to reject image. Please try again.",
        type: "error",
      });
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/gallery/delete/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      setMessage({
        text: "Image deleted successfully!",
        type: "success",
      });

      // Remove the deleted image from the approved list
      setApprovedImages(approvedImages.filter(img => img.id !== id));
    } catch (error) {
      console.error("Error deleting image:", error);
      setMessage({
        text: "Failed to delete image. Please try again.",
        type: "error",
      });
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <TreePine className="mr-2 h-6 w-6 text-primary" />
          Gallery Management
        </h1>
        <Link
          href="/admin"
          className="secondary-button flex items-center text-sm px-3 py-1.5"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {message.text && (
        <div
          className={`p-3 mb-4 rounded text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tab navigation */}
      <div className="border-b border-neutral-200 mb-6">
        <div className="flex">
          <button
            className={`py-2 px-4 font-medium text-sm 
            ${activeTab === TabType.PENDING 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-text-secondary hover:text-primary'}`}
            onClick={() => setActiveTab(TabType.PENDING)}
          >
            Pending Approval
            {pendingImages.length > 0 && (
              <span className="ml-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                {pendingImages.length}
              </span>
            )}
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm 
            ${activeTab === TabType.APPROVED 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-text-secondary hover:text-primary'}`}
            onClick={() => setActiveTab(TabType.APPROVED)}
          >
            Approved Gallery
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeTab === TabType.PENDING ? (
        pendingImages.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-text-secondary">No pending images to approve!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingImages.map((image) => (
              <div
                key={image.id}
                className="card overflow-hidden"
              >
                <div className="relative h-48 bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-base font-semibold mb-1">{image.title}</h3>
                  <p className="text-text-secondary text-xs mb-2 line-clamp-2">{image.description}</p>
                  <div className="text-xs text-text-secondary mb-3">
                    <p>By: {image.user_name}</p>
                    <p>Email: {image.user_email}</p>
                    <p>Tree ID: {image.tree_id || "None"}</p>
                    <p>Date: {new Date(image.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(image.id)}
                      className="bg-primary hover:bg-primary-dark text-white text-xs font-medium py-1.5 px-3 rounded-md flex items-center justify-center flex-1"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(image.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-1.5 px-3 rounded-md flex items-center justify-center flex-1"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        approvedImages.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-text-secondary">No approved images in the gallery yet!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {approvedImages.map((image) => (
              <div
                key={image.id}
                className="card overflow-hidden"
              >
                <div className="relative h-40 bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-semibold">{image.title}</h3>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="text-text-secondary hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-text-secondary text-xs mb-2 line-clamp-2">{image.description}</p>
                  <div className="text-xs text-text-secondary">
                    <p>By: {image.user_name}</p>
                    <p>Date: {new Date(image.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
} 