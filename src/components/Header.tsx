import SearchBar from './SearchBar';

export default function Header() {
  return (
    <header className="bg-button-primary shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center md:flex-row flex-col gap-4 py-4">
          <a href="https://www.chess.com/" target="_blank" rel="noopener noreferrer" className="flex items-center">
            <img 
              src="/assets/images/chess-api.png" 
              alt="Chess API logo" 
              className="h-20 w-auto object-contain"
            />
          </a>
          
          <div className="flex-1 max-w-xl mx-8">
            <SearchBar />
          </div>
        </div>
      </div>
    </header>
  );
}

