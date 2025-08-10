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
  let normalized = query.trim();
  
  // Handle Wall-E variations - be more specific
  if (/wall[\s\-·•]?e/gi.test(normalized)) {
    normalized = 'WALL-E';
  }
  
  // Normalize different dash characters to regular hyphen
  normalized = normalized.replace(/[·•]/g, '-');
  
  return normalized;
};

// Alternative search strategies for difficult cases
const getSearchStrategies = (query: string): string[] => {
  const strategies = [normalizeQuery(query)];
  
  // For Wall-E, try multiple variations
  if (/wall[\s\-·•]?e/gi.test(query)) {
    strategies.push('WALL-E', 'Wall-E', 'WALL·E', 'Wall·E');
  }
  
  return [...new Set(strategies)]; // Remove duplicates
};

// Calculate relevance score for better filtering
const calculateRelevanceScore = (movie: TMDbMovie, query: string): number => {
  const title = movie.title.toLowerCase();
  const searchTerm = query.toLowerCase();
  
  let score = 0;
  
  // Exact match gets highest score
  if (title === searchTerm) {
    score += 1000;
  }
  // Starts with search term
  else if (title.startsWith(searchTerm)) {
    score += 500;
  }
  // Contains search term as whole word
  else if (title.includes(' ' + searchTerm + ' ') || title.includes(' ' + searchTerm)) {
    score += 200;
  }
  // Contains search term anywhere
  else if (title.includes(searchTerm)) {
    score += 100;
  }
  
  // Add popularity bonus (scaled down)
  score += Math.min(movie.popularity * 0.1, 50);
  
  return score;
};

export async function searchMovies(query: string): Promise<MovieSuggestion[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const searchStrategies = getSearchStrategies(query);
    const allResults: TMDbMovie[] = [];
    
    // Try each search strategy
    for (const searchQuery of searchStrategies) {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(searchQuery)}&include_adult=false&language=en-US&page=1`,
        {
          headers: {
            'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`TMDb API error for "${searchQuery}":`, response.status);
        continue;
      }

      const data: TMDbSearchResponse = await response.json();
      
      // Debug logging
      console.log(`Search "${searchQuery}" returned ${data.results.length} results`);
      if (data.results.length > 0) {
        console.log('First few results:', data.results.slice(0, 3).map(m => ({ title: m.title, popularity: m.popularity })));
      }
      
      // Add valid results
      const validResults = data.results.filter(movie => {
        return movie.title && 
               movie.release_date && 
               movie.popularity > 0 &&
               movie.release_date.length >= 4; // Valid year format
      });
      
      allResults.push(...validResults);
      
      // If we found good results, break early (unless it's a Wall-E search)
      if (validResults.length > 0 && !searchQuery.toLowerCase().includes('wall')) {
        break;
      }
    }
    
    // Remove duplicates by movie ID
    const uniqueResults = Array.from(
      new Map(allResults.map(movie => [movie.id, movie])).values()
    );
    
    // Calculate relevance scores and sort
    const scoredResults = uniqueResults.map(movie => ({
      movie,
      score: calculateRelevanceScore(movie, query)
    }));
    
    // Sort by relevance score (descending)
    scoredResults.sort((a, b) => b.score - a.score);
    
    // Take top 8 results
    const topResults = scoredResults.slice(0, 8).map(item => item.movie);
    
    // Convert to MovieSuggestion format
    const suggestions = topResults.map(movie => {
      const year = new Date(movie.release_date).getFullYear();
      return {
        displayTitle: `${movie.title} (${year})`,
        originalTitle: movie.title
      };
    });
    
    console.log(`Final suggestions for "${query}":`, suggestions.map(s => s.displayTitle));
    return suggestions;
      
  } catch (error) {
    console.error('Error searching movies:', error);
    return [];
  }
}

// Debounce function to limit API calls
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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