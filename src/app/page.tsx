import Head from 'next/head';
import ImageUploader from './components/ImageUploader';
import './globals.css';

import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 relative">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(156, 163, 175, 0.3) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />
      <main className="flex flex-col max-w-screen-xl mx-auto items-center justify-center w-full flex-1 text-center z-10">
        <ImageUploader />
      </main>
    </div>
  );
};

export default Home;
