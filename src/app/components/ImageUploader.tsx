'use client';
import React, { useState, useRef } from 'react';
import Image from 'next/image';

const ImageUploader: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Immediately start the recognition process
      await handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await fetch('/api/recognize-fish', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.results);
    } catch (error) {
      console.error('Error recognizing fish:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = () => {
    alert('Camera functionality would be implemented here');
  };

  const formatResult = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    let formattedResult: React.ReactNode[] = [];
    let currentMainSection = '';
    let interestingFacts: string[] = [];

    const cleanText = (str: string) =>
      str
        .replace(/\*+/g, '')
        .replace(/:{1,2}$/, '')
        .trim();

    for (let i = 0; i < lines.length; i++) {
      const line = cleanText(lines[i]);
      if (line === '') continue;

      if (line.toLowerCase() === 'fish information') {
        formattedResult.push(
          <h2 key={i} className="text-2xl font-bold mb-4 text-black">
            {line}
          </h2>
        );
      } else if (
        ['species', 'habitat', 'interesting facts'].includes(line.toLowerCase())
      ) {
        currentMainSection = line.toLowerCase();
        if (currentMainSection !== 'interesting facts') {
          formattedResult.push(
            <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-gray-300">
              {line}
            </h3>
          );
        }
      } else if (
        line.includes(':') &&
        currentMainSection !== 'interesting facts'
      ) {
        const [subSection, content] = line.split(':').map(cleanText);
        formattedResult.push(
          <p key={i} className="mb-2 text-gray-300">
            <span className="font-semibold">{subSection}:</span>{' '}
            {content || (lines[i + 1] ? cleanText(lines[i + 1]) : '')}
          </p>
        );
        if (!content) i++; // Skip next line if it's the content for this subsection
      } else if (currentMainSection === 'interesting facts') {
        interestingFacts.push(line);
      } else {
        formattedResult.push(
          <p key={i} className="mb-2 text-gray-300">
            {line}
          </p>
        );
      }
    }

    // Add Interesting Facts as a dotted list
    if (interestingFacts.length > 0) {
      formattedResult.push(
        <div key="interesting-facts" className="mt-4">
          <h3 className="text-lg font-bold mb-2 text-gray-300">
            Interesting Facts
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            {interestingFacts.map((fact, index) => (
              <li key={index}>{fact}</li>
            ))}
          </ul>
        </div>
      );
    }

    return formattedResult;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-4 text-center text-gray-300">
          Fish Identifier
        </h1>
        <p className="text-center text-gray-300 mb-8">
          Discover the species of fish in your photos. Simply upload an image or
          take a photo to get started with our AI-powered fish recognition.
        </p>

        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold
              hover:bg-blue-600 transition duration-300 ease-in-out"
          >
            Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
          <button
            onClick={handleTakePhoto}
            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold
              hover:bg-green-600 transition duration-300 ease-in-out"
          >
            Take Photo
          </button>
        </div>

        {imagePreview && (
          <div className="mb-8">
            <Image
              src={imagePreview}
              alt="Uploaded fish"
              className="max-w-full h-auto rounded-lg shadow-lg"
              layout="responsive"
              width={500} // or the width you want
              height={300} // or the height you want
            />
          </div>
        )}

        {loading && (
          <div className="text-center text-gray-300 mb-4">
            <p>Processing image...</p>
          </div>
        )}

        {result && (
          <div className="bg-gray-700 bg-opacity-10 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-left text-gray-300">
              Fish Information:
            </h2>
            <div className="text-sm text-left text-gray-300 space-y-2">
              {formatResult(result)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
