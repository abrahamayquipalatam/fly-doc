'use client';

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  type: string;
  onLoaded?: () => void;
  isIOS?: boolean;
}

export default function VideoPlayer({ src, type, onLoaded, isIOS }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      // Create a <video> element to insert into the DOM
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered');
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      
      if (!isIOS) {
        videoElement.style.borderRadius = '8px';
        videoElement.style.overflow = 'hidden';
      }

      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, {
        controls: true,
        autoplay: true,
        responsive: true,
        fluid: false,
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        controlBar: {
          skipButtons: {
            forward: 10,
            backward: 10
          }
        },
        sources: [{
          src,
          type
        }]
      }, () => {
        player.on('loadeddata', () => {
          if (onLoaded) onLoaded();
        });
        
        // Sometimes loadeddata might not fire immediately or if cached
        player.on('canplay', () => {
          if (onLoaded) onLoaded();
        });
      });
    }

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, type, isIOS]); // Exclude onLoaded to avoid re-mounting player if callback changes

  return (
    <div data-vjs-player style={{ width: '100%', height: '100%' }}>
      <div ref={videoRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
