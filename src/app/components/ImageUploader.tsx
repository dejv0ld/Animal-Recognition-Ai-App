/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useRef, useEffect } from 'react';

const ImageUploader: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const captureButtonRef = useRef<HTMLButtonElement>(null); // Ref for the capture button

  useEffect(() => {
    // Check if the device is mobile
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      );
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isCameraOpen && captureButtonRef.current) {
      captureButtonRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isCameraOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processImage(file);
    }
  };

  const processImage = async (file: File) => {
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    await handleImageUpload(file);
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

  const handleTakePhoto = async () => {
    setIsCameraOpen(true);
    try {
      const constraints = {
        video: {
          facingMode: isMobile ? 'environment' : 'user',
          width: { ideal: isMobile ? 1280 : 640 },
          height: { ideal: isMobile ? 720 : 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access the camera. ';
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage +=
              'Permission denied. Please allow camera access and try again.';
            break;
          case 'NotFoundError':
            errorMessage += 'No camera found on this device.';
            break;
          case 'NotReadableError':
            errorMessage += 'Camera is already in use or not accessible.';
            break;
          default:
            errorMessage += `Error: ${error.message}`;
        }
      } else {
        errorMessage += 'An unknown error occurred.';
      }
      alert(errorMessage);
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            processImage(file);
          }
        }, 'image/jpeg');
      }
    }
    closeCamera();
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

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
          Animal Identifier
        </h1>
        <p className="text-center text-gray-300 mb-8">
          Discover the species of animal in your photos. Simply upload an image
          or take a photo to get started with our AI-powered animal recognition.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-transparent text-gray-300 px-1 py-2 rounded-xl font-semibold
              hover:bg-black hover:bg-opacity-30 transition duration-300 ease-in-out border border-gray-300"
          >
            Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
            capture="environment"
          />
          <button
            onClick={handleTakePhoto}
            className="flex-1 bg-transparent text-gray-300 px-1 py-2 rounded-xl font-semibold
              hover:bg-black hover:bg-opacity-30 transition duration-300 ease-in-out border border-gray-300"
          >
            Take Photo
          </button>
        </div>

        {isCameraOpen && (
          <div className="mb-8 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <button
              ref={captureButtonRef}
              onClick={capturePhoto}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold
                hover:bg-red-600 transition duration-300 ease-in-out absolute bottom-4 left-1/2 transform -translate-x-1/2"
            >
              Capture Photo
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {imagePreview && (
          <div className="mb-8">
            <img
              src={imagePreview}
              alt="Uploaded fish"
              className="max-w-full h-auto rounded-lg shadow-lg"
              style={{ width: '100%', height: 'auto' }}
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
