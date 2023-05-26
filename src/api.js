import axios from "axios"

const apiKey = process.env.REACT_APP_APIKEY
const baseUrl = process.env.REACT_APP_BASEURL

export const getMovieList = async(page) => {
    const movie = await axios.get(`${baseUrl}/movie/popular?page=${page}&api_key=${apiKey}`)
    return movie.data.results
}

export const searchMovie = async (q, page) => {
    const search = await axios.get(`${baseUrl}/search/movie?query=${q}&page=${page}&api_key=${apiKey}`)
    const { results, total_pages } = search.data;
    return {
        results,
        totalPages: total_pages
    }
}

export const getTVList = async(page) => {
    const tv = await axios.get(`${baseUrl}/tv/top_rated?page=${page}&api_key=${apiKey}`)
    return tv.data.results
}

export const searchTV = async (q, page) => {
    const search = await axios.get(`${baseUrl}/search/tv?query=${q}&page=${page}&api_key=${apiKey}`)
    const { results, total_pages } = search.data;
    return {
        results,
        totalPages: total_pages
    }
}

export const getTrendingList = async() => {
    const trending = await axios.get(`${baseUrl}/trending/all/week?page=1&api_key=${apiKey}`)
    return trending.data.results
}