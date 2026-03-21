'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  isVisible: boolean;
  message: string;
}

const Toast = ({ isVisible, message }: ToastProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: 'fixed',
            bottom: '40px',
            left: 0,
            right: 0,
            margin: '0 auto',
            width: 'fit-content', // 👈 clave
            zIndex: 9999,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            padding: '12px 24px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            width: '18px',
            height: '18px',
            border: '2px solid var(--accent-color)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{
            fontSize: '0.9rem',
            fontWeight: 500,
            color: 'var(--text-main)',
            letterSpacing: '0.3px'
          }}>
            {message}
          </span>

          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `
          }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;