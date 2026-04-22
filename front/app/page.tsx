import Image from 'next/image';

export default function HomePage() {
  return (
    <div>
      <h2>Bienvenue sur ChatFlow</h2>
      <div className="flex justify-center items-center mt-8">
        <Image 
          src="/logo.png" 
          alt="ChatFlow Logo" 
          width={400} 
          height={400}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}