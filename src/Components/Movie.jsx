import { useNavigate, useLocation, Link } from "react-router-dom";
import "../App.css";
import "../navbar.css";
import { getMovieList, searchMovie, getMovieTrailer, getMovieDetails, getMovieCredits } from "../api";
import { useEffect, useState, useRef, useCallback } from "react";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import placeholderImage from '../Image_not_available.png';
import { Sling as Hamburger } from 'hamburger-react';
import AOS from "aos";
import "aos/dist/aos.css";
import ScrollTopButton from "./scrollTop/scrollTop";
import HeroImageMovies from './heroImage/heroImage';
import SpeechToText from "./speechRecognition/speechRecognition";
import { debounce } from "lodash";
import Bookmark from '../Assets/bookmark.svg';
import Rating from '../Assets/star.svg';
import { ClipLoader } from "react-spinners";

const Movie = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [popularMovies, setPopularMovies] = useState([])
  const [defaultMovies, setDefaultMovies] = useState(popularMovies)
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [movieCredits, setMovieCredits] = useState([]);
  const popupContentRef = useRef(null);
  const [isNoResults, setIsNoResults] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMovieList().then((result) => {
      setPopularMovies(result)
      setDefaultMovies(result)
    })
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location])

  const NavBar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [hamburgerSize, setHamburgerSize] = useState(24);
    const [prevScrollPos, setPrevScrollPos] = useState(0);
    const [visible, setVisible] = useState(true);

    const updateHamburgerSize = () => {
      if (window.innerWidth <= 480) {
        setHamburgerSize(18);
      } else {
        setHamburgerSize(24);
      }
    };

    const refresh = () => {
      window.location.reload();
    }

    useEffect(() => {
      const handleScroll = () => {
        const currentScrollPos = window.scrollY;
        const visible = prevScrollPos > currentScrollPos || menuOpen;

        setPrevScrollPos(currentScrollPos);
        setVisible(visible);
      };

      updateHamburgerSize();
      window.addEventListener('resize', updateHamburgerSize);
      window.addEventListener('scroll', handleScroll);

      return () => {
        window.removeEventListener('resize', updateHamburgerSize);
        window.removeEventListener('scroll', handleScroll);
      }
    }, [prevScrollPos, menuOpen]);

    return (
      <nav className={`navbar ${visible ? '' : 'hidden'}`}>
        <button onClick={refresh} className="logo">Movie Search</button>

        <ul className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <li><Link to="/" onClick={refresh}>Movies</Link></li>
          <li><Link to="/tv">TV</Link></li>
          <li><Link to="/trending">Trending</Link></li>
          <li><Link to="/login">Login</Link></li>
        </ul>

        <div className="hamburger">
          <Hamburger
            rounded
            size={hamburgerSize}
            duration={0.8}
            toggled={menuOpen}
            toggle={setMenuOpen}
          />
        </div>
      </nav>
    )
  }

  const loadMore = async () => {
    const nextPage = page + 1;
    if (isSearching) {
      const newMovies = await searchMovie(searchQuery, nextPage);
      if (newMovies.results.length > 0) {
        setPopularMovies((prevMovies) => [...prevMovies, ...newMovies.results]);
        setPage(nextPage);
      } else {
        setHasMorePages(false);
      }
    } else {
      const newMovies = await getMovieList(nextPage);
      if (newMovies.length > 0) {
        setPopularMovies((prevMovies) => [...prevMovies, ...newMovies]);
        setPage(nextPage);
      } else {
        setHasMorePages(false);
      }
    }
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (popupContentRef.current && !popupContentRef.current.contains(event.target)) {
        setIsPopupOpen(false);
      }
    };

    window.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const handleClick = useCallback(async (movie) => {
    try {
      setIsPopupOpen(true);
      setLoading(true);
      const movieDetails = await getMovieDetails(movie.id);
      const credits = await getMovieCredits(movie.id);
      setMovieCredits(credits.cast);

      setSelectedMovie({
        ...movieDetails,
        genres: movieDetails.genres || [],
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching movie details:", error);
    }
  }, []);

  const PopularMovieList = useCallback(() => {

    if (isNoResults) {
      return <div>No results found</div>;
    }

    return popularMovies.map((movie, i) => {
      const voteAverageClass = movie.vote_average < 5 ? 'low-rating' : '';
      return (
        <div className="Movie-wrapper" key={i} title={movie.title} onClick={() => handleClick(movie)}>
          <div className="Movie-title">{movie.title}</div>
          <LazyLoadImage
            className="Movie-image"
            alt={movie.title}
            loading="lazy"
            effect="opacity"
            src={`${process.env.REACT_APP_BASEIMGURL}/${movie.poster_path}`}
            placeholder={<ClipLoader color="white" size={120} />}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = placeholderImage
            }}
          />
          <div className="Movie-date">release: {movie.release_date}</div>
          <div className={`Movie-rate ${voteAverageClass}`}>{movie.vote_average.toFixed(2)}</div>
        </div>
      )
    })
  }, [popularMovies, handleClick, isNoResults]);

  const MoviePopup = useCallback(() => {
    if (!isPopupOpen || !selectedMovie) {
      return null;
    }

    const handleWatchTrailer = async () => {
      try {
        const trailerUrl = await getMovieTrailer(selectedMovie.id);
        if (trailerUrl) {
          window.open(trailerUrl);
        }
      } catch (error) {
        console.error("Error fetching movie trailer:", error);
      }
    };

    return (
      <div className="movie-popup-overlay">
        {loading ? (
          <ClipLoader color="white" loading={loading} size={120} />
        ) : (
          <div
            ref={popupContentRef}
            style={{ backgroundImage: `url(${process.env.REACT_APP_ORIGINALIMGURL}/${selectedMovie.backdrop_path})` }}
            className="movie-popup"
          >
            <div className="background-overlay">
            </div>
            <img
              className="movie-popup-image"
              src={`${process.env.REACT_APP_BASEIMGURL}/${selectedMovie.poster_path}`}
              alt={selectedMovie.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = placeholderImage;
              }}
              draggable="false"
            />
            <div className="movie-popup-details">
              <div className="movie-popup-title">{selectedMovie.title}</div>
              <div className="movie-popup-genres">
                {selectedMovie.genres && selectedMovie.genres.slice(0, 5).map((genre, i) => (
                  <span className="movie-popup-genre-items" key={i}>{genre.name}</span>
                ))
                }
              </div>
              <p>{selectedMovie.overview}</p>
              <div>
                <h2>Casts</h2>
                <div className="cast-container">
                  {movieCredits && movieCredits.slice(0, 6).map((cast, i) => (
                    <div key={i} className="cast-item">
                      {cast.profile_path ? (
                        <img
                          src={`${process.env.REACT_APP_BASEIMGURL}/${cast.profile_path}`}
                          alt={cast.name}
                          className="cast-photo"
                          draggable="false"
                        />
                      ) : (
                        <div className="no-photo">No Photo</div>
                      )}
                      <div className="cast-name">{cast.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="detail-btn-container">
                <div className="icon-btn-container">
                  <button className="icon-btn" onClick={() => navigate('/login')}>
                    <img
                      src={Bookmark}
                      alt='watchlist'
                      className="icon-img"
                      title="Add to watchlist"
                    />
                  </button>
                  <button className="icon-btn" onClick={() => navigate('/login')}>
                    <img
                      src={Rating}
                      alt='rating'
                      className="icon-img"
                      title="Rate"
                    />
                  </button>
                </div>
                <button className="trailer-btn" onClick={handleWatchTrailer}>Watch trailer</button>
              </div>
            </div>
            <button className="close" onClick={() => setIsPopupOpen(false)}>&#10005;</button>
          </div>
        )}
      </div>
    );
  }, [isPopupOpen, selectedMovie, movieCredits, loading, navigate]);

  useEffect(() => {
    const mobileOffset = window.innerWidth <= 768 ? 200 : 500;

    AOS.init({
      duration: 1000,
      easing: "ease",
      offset: mobileOffset,
    });
  }, []);

  const handleListeningChange = (isListening) => {
    setIsListening(isListening);
  };

  const debouncedSearch = debounce((q) => {
    setSearchQuery(q);
  }, 300);

  const search = async (q, page) => {
    if (q.length > 2) {
      const query = await searchMovie(q, page);
      setPopularMovies(query.results);
      setHasMorePages(query.results.length > 0);
      setPage(1);
      setTotalPages(query.totalPages);
      setIsSearching(true);
      setIsNoResults(query.results.length === 0);
    } else {
      setPopularMovies(defaultMovies)
      setHasMorePages(true);
      setPage(1);
      setIsSearching(false);
      setIsNoResults(false);
    }
  };

  useEffect(() => {
    search(searchQuery, 1);
    // eslint-disable-next-line
  }, [searchQuery]);

  return (
    <div className="App">
      <header className="App-header">
        <NavBar />
      </header>
      <HeroImageMovies />
      <MoviePopup />

      <div className="search-container">

        {!isListening && (
          <input
            placeholder="Search movies..."
            className="Movie-search"
            onChange={({ target }) => debouncedSearch(target.value, page)}
          />
        )}
        {isListening && (
          <input
            placeholder="Search movies..."
            className="Movie-search"
            value={searchQuery}
            onChange={({ target }) => debouncedSearch(target.value, page)}
          />
        )}
        <SpeechToText setSearchQuery={setSearchQuery} onListeningChange={handleListeningChange} />
      </div>

      <div className="Movie-container" data-aos="fade-up">
        <PopularMovieList />
      </div>

      <div>
        {isSearching && hasMorePages && page < totalPages && (
          <button className="load-more" onClick={loadMore}>
            Load more
          </button>
        )}

        {!isSearching && hasMorePages && (
          <button className="load-more" onClick={loadMore}>
            Load more
          </button>
        )}

        <ScrollTopButton />
      </div>
    </div>
  )
}

export default Movie;