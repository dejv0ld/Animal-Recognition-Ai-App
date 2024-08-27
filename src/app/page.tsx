import Head from 'next/head';
import ImageUploader from './components/ImageUploader';
import './globals.css';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">


      <main className="flex flex-col max-w-screen-xl mx-auto items-center justify-center w-full flex-1 text-center bg-gray-500">
   
        <ImageUploader />
      </main>
    </div>
  );
};

export default Home;
