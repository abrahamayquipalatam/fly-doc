import React from 'react';

interface Win11IconProps {
  type: string;
  size?: number;
  className?: string;
}

const Win11Icon: React.FC<Win11IconProps> = ({ type, size = 32, className = '' }) => {
  const safeType = type || 'application/octet-stream';
  const isFolder = safeType === 'application/vnd.google-apps.folder';
  const isPDF = safeType.includes('pdf');
  const isImage = safeType.includes('image');
  const isVideo = safeType.includes('video');
  const isDoc = safeType.includes('document') || safeType.includes('word');
  const isSheet = safeType.includes('spreadsheet') || safeType.includes('excel');
  const isSlide = safeType.includes('presentation') || safeType.includes('powerpoint');

  if (isFolder) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M5 10C5 8.34315 6.34315 7 8 7H18.5L23.5 12H40C41.6569 12 43 13.3431 43 15V38C43 39.6569 41.6569 41 40 41H8C6.34315 41 5 39.6569 5 38V10Z" fill="#F8D44A"/>
        <path d="M5 15C5 13.3431 6.34315 12 8 12H40C41.6569 12 43 13.3431 43 15V38C43 39.6569 41.6569 41 40 41H8C6.34315 41 5 39.6569 5 38V15Z" fill="#FFC107"/>
        <path d="M5 25C5 23.3431 6.34315 22 8 22H40C41.6569 22 43 23.3431 43 25V38C43 39.6569 41.6569 41 40 41H8C6.34315 41 5 39.6569 5 38V25Z" fill="#FFB300"/>
      </svg>
    );
  }

  if (isPDF) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M10 6C10 4.34315 11.3431 3 13 3H30L38 11V42C38 43.6569 36.6569 45 35 45H13C11.3431 45 10 43.6569 10 42V6Z" fill="#F44336"/>
            <path d="M30 3L38 11H30V3Z" fill="#B71C1C" fillOpacity="0.5"/>
            <path d="M15 25H33V28H15V25Z" fill="white"/>
            <path d="M15 18H33V21H15V18Z" fill="white" fillOpacity="0.5"/>
            <path d="M15 32H25V35H15V32Z" fill="white" fillOpacity="0.8"/>
        </svg>
    );
  }

  if (isDoc) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M10 6C10 4.34315 11.3431 3 13 3H30L38 11V42C38 43.6569 36.6569 45 35 45H13C11.3431 45 10 43.6569 10 42V6Z" fill="#2196F3"/>
            <path d="M30 3L38 11H30V3Z" fill="#0D47A1" fillOpacity="0.5"/>
            <path d="M15 25H33V27H15V25Z" fill="white"/>
            <path d="M15 31H33V33H15V31Z" fill="white"/>
            <path d="M15 19H25V21H15V19Z" fill="white"/>
        </svg>
    );
  }

  if (isSheet) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M10 6C10 4.34315 11.3431 3 13 3H30L38 11V42C38 43.6569 36.6569 45 35 45H13C11.3431 45 10 43.6569 10 42V6Z" fill="#4CAF50"/>
            <path d="M30 3L38 11H30V3Z" fill="#1B5E20" fillOpacity="0.5"/>
            <path d="M16 22H22V28H16V22Z" fill="white" fillOpacity="0.8"/>
            <path d="M26 22H32V28H26V22Z" fill="white" fillOpacity="0.8"/>
            <path d="M16 32H22V38H16V32Z" fill="white" fillOpacity="0.8"/>
            <path d="M26 32H32V38H26V32Z" fill="white" fillOpacity="0.8"/>
        </svg>
    );
  }

  if (isSlide) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M10 6C10 4.34315 11.3431 3 13 3H30L38 11V42C38 43.6569 36.6569 45 35 45H13C11.3431 45 10 43.6569 10 42V6Z" fill="#FF9800"/>
            <path d="M30 3L38 11H30V3Z" fill="#E65100" fillOpacity="0.5"/>
            <circle cx="24" cy="24" r="8" stroke="white" strokeWidth="2" fillOpacity="0.2" fill="white"/>
        </svg>
    );
  }

  if (isImage) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M10 6C10 4.34315 11.3431 3 13 3H35C36.6569 3 38 4.34315 38 6V42C38 43.6569 36.6569 45 35 45H13C11.3431 45 10 43.6569 10 42V6Z" fill="#00BCD4"/>
            <circle cx="18" cy="14" r="4" fill="#BBDEFB"/>
            <path d="M38 30L30 20L18 35L10 25V42C10 43.6569 11.3431 45 13 45H35C36.6569 45 38 43.6569 38 42V30Z" fill="#00838F"/>
        </svg>
    );
  }

  if (isVideo) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M10 6C10 4.34315 11.3431 3 13 3H35C36.6569 3 38 4.34315 38 6V42C38 43.6569 36.6569 45 35 45H13C11.3431 45 10 43.6569 10 42V6Z" fill="#673AB7"/>
            <path d="M18 18V30L28 24L18 18Z" fill="white"/>
        </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M10 6C10 4.34315 11.3431 3 13 3H30L38 11V42C38 43.6569 36.6569 45 35 45H13C11.3431 45 10 43.6569 10 42V6Z" fill="#90A4AE"/>
        <path d="M30 3L38 11H30V3Z" fill="#455A64" fillOpacity="0.5"/>
    </svg>
  );
};

export default Win11Icon;
