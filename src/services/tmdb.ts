// TMDb API service for movie search
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4NDVhNDcyMTM0YWEzYTU1ZDUwZTFhMjg1MjI5YzgwYiIsIm5iZiI6MTc1NDU5NjYwMy44MzcsInN1YiI6IjY4OTUwNGZiZjhmMTI1OGJmOGEzMmVhZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.MVJed1DPk8_ZV7qnkMJYxikdlj-VgmXhnOA7BK7rDt4';

export interface TMDbMovie {
  id: number;
  title: string;
  release_date: string;
  popularity: number;
}

export interface TMDbSearchResponse {
  results: TMDbMovie[];
  total_results: number;
}

export interface MovieSuggestion {
  displayTitle: string; // "Jurassic Park (1993)"
  originalTitle: string; // "Jurassic Park"
}

// Helper function to normalize search queries for better matching
const normalizeQuery = (query: string): string => {
  return query
    .replace(/wall[\s\-·•]?e/gi, 'WALL-E') // Handle Wall-E variations
    .replace(/[\-·•]/g, '-') // Normalize different dash characters
    .trim();
};

export async function searchMovies(query: string): Promise<MovieSuggestion[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Normalize the query to handle edge cases
    const normalizedQuery = normalizeQuery(query);
    
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(normalizedQuery)}&include_adult=false&language=en-US&page=1`,
      {
        headers: {
          'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('TMDb API error:', response.status);
      return [];
    }

    const data: TMDbSearchResponse = await response.json();
    
    // Filter and sort results
    const validMovies = data.results
      .filter(movie => {
        // Only include movies with title, release date, and reasonable popularity
        return movie.title && 
               movie.release_date && 
               movie.popularity > 0 &&
               movie.release_date.length >= 4; // Valid year format
      })
      .sort((a, b) => {
        // Sort by popularity (descending)
        return b.popularity - a.popularity;
      })
      .slice(0, 8); // Top 8 results
    
    // Convert to MovieSuggestion format
    return validMovies.map(movie => {
      const year = new Date(movie.release_date).getFullYear();
      return {
        displayTitle: `${movie.title} (${year})`,
        originalTitle: movie.title
      };
    });
      
  } catch (error) {
    console.error('Error searching movies:', error);
    return [];
  }
}

// Debounce function to limit API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 