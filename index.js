const express = require("express");
const axios = require("axios");
const path = require("path");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============
app.use(cors()); // <-- ADD THIS (allows all origins)

const allowedOrigins = [
  "https://sportiq-2dvc.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173", // if using Vite
];

//Better: Restrict to your known origins
/*app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Handle preflight requests
app.options("*", cors());*/

app.use(express.json());

//Option 2: Manual middleware (no dependency)
/*app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // or specific origin
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});*/

// ============ CONFIGURATION ============
const SPORTICOS_API = {
  baseUrl: "https://sporticos.com/api/proxy/api",
  endpoints: {
    sport: "/soccer",
    match: "/match",
    live: "/live",
  },

  /*
  for later reference
  https://sporticos.com/_i18n/wWX-Arq-/en-gb/messages.json
  https://sporticos.com/api/bonus-offer/en-gb
  https://sporticos.com/api/proxy/api/soccer/match/slugs
  https://sporticos.com/api/proxy/api/soccer/league/slugs
  https://sporticos.com/api/proxy/api/soccer/match/routing
  https://sporticos.com/api/proxy/api/en-gb/soccer/v2/providers-new/2/leagues
  https://sporticos.com/api/proxy/api/en-gb/soccer/v2/providers-new/2/fixtures?from=2026-09-25&to=2026-09-25
  */
};


// ============ API SERVICE ============
class SporticosApiService {
  constructor() {
    this.baseUrl = SPORTICOS_API.baseUrl;
  }

  async fetchWithTimeout(url, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.log(error)
      clearTimeout(timeoutId);
      throw error;
    }
  }

  //Get tv/stream/news providers
  async getTvProviders(params = {}) {
    const {
    countryId = 4,
    isPublished = 1,
    } = params
    const url = `${this.baseUrl}/en-gb/soccer/v2/providers-new?${countryId}&is_published=${isPublished}`
    return this.fetchWithTimeout(url);
  }
  
  //Get bookmakers
  async getBookmakers() {
    const url = `https://sporticos.com/api/en-gb/rankings/bookmakers/sporticos-uk`
    return this.fetchWithTimeout(url);
  }

  // Get live matches with filters
  async getLiveMatches(params = {}) {
    const {
      ids = [1431908,1433768,870224],
    } = params;

    let url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}/live&ids=${ids}`;
    return this.fetchWithTimeout(url);
  }

  // Get competitions with matches
  async getCompetitionsWithMatches(params = {}) {
    const {
      limit = 10,
      offset = 0,
      fromDate,//2026-09-25T21:00:00Z
      toDate,//2026-09-26T20:59:59Z
    } = params;

    let url = `${this.baseUrl}/en-gb/soccer/fixtures/competitions-with-matches?limit=${limit}&offset=${offset}&from=${fromDate}&to=${toDate}`;
    return this.fetchWithTimeout(url);
  }

  // Get fixtures
  async getFixtures() {
    const url = `${this.baseUrl}/en-gb/soccer/fixtures`;
    return this.fetchWithTimeout(url);
  }

  // Get match details by match_id
  async getMatch(matchId) {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}${SPORTICOS_API.endpoints.match}?id=${matchId}`;
    return this.fetchWithTimeout(url);
  }

  //Get how to watch a match
  async getMatchWatch(matchId) {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}${SPORTICOS_API.endpoints.match}/${matchId}/how-to-watch`
    return this.fetchWithTimeout(url);
  }

  //Get match header
  async getMatchHeader(matchId) {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}${SPORTICOS_API.endpoints.match}/${matchId}/header`
    return this.fetchWithTimeout(url);
  }

  //Get match tv
  async getMatchTv(matchId) {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}${SPORTICOS_API.endpoints.match}/${matchId}/tv`
    return this.fetchWithTimeout(url);
  }

  //Get match vpn-offer
  async getMatchVpnOffer(matchId) {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}${SPORTICOS_API.endpoints.match}/${matchId}/vpn-offer`
    return this.fetchWithTimeout(url);
  }

  //Get match odds and predictions
  async getMatchOddAndPredictions(matchId) {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}${SPORTICOS_API.endpoints.match}/${matchId}/feed/odds_and_predictions`
    return this.fetchWithTimeout(url);
  }

  //Get match betting tips
  async getMatchBettingTips(matchId, params = {}) {
    const {
      limit = 100,
      offset = 0,
    } = params;
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}${SPORTICOS_API.endpoints.match}/${matchId}/feed/betting_tips?limit=${limit}&offset=${offset}`
    return this.fetchWithTimeout(url);
  }

  //Get match head-to-head
  async getMatchHeadToHead(matchId) {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}${SPORTICOS_API.endpoints.match}/${matchId}/feed/head_to_head`
    return this.fetchWithTimeout(url);
  }

  //Get match brackets
  //A match bracket (or tournament bracket) is a tree-like visual diagram that maps out every head-to-head matchup in a knockout tournament, showing how players or teams advance from the early rounds all the way to the championship
  async getMatchBrackets(matchId) {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}${SPORTICOS_API.endpoints.match}/${matchId}/feed/brackets`
    return this.fetchWithTimeout(url);
  }

  //Get match feeds
  async getMatchFeeds(matchId) {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}${SPORTICOS_API.endpoints.match}/${matchId}/feeds`
    return this.fetchWithTimeout(url);
  }

  //Get match form
  async getMatchForm(matchId) {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}${SPORTICOS_API.endpoints.match}/${matchId}/feed/form`
    return this.fetchWithTimeout(url);
  }

  //Get match statistics
  async getMatchStatistics(matchId) {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}${SPORTICOS_API.endpoints.match}/${matchId}/statistics`
    return this.fetchWithTimeout(url);
  }

  //Get predictions by date
  async getMatchPredictions(date) {
    let url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}/predictions-new/`
    url = date !== "" ? url : url + date
    return this.fetchWithTimeout(url);
  }

  // Get predictions
  async getPredictions(params = {}) {
    const {
      limit = 10,
      offset = 0,
      is_published = 1,
      lang = "en"
    } = params;

    const url = `https://sporticos.com/api/news-proxy/read/match_prediction_posts?limit=${limit}&offset=${offset}&is_published=${is_published}&slang=${lang}`; //&published_at%5Blte%5D=2026-02-26T04:12:00%2B03:00&with_total=0
    return this.fetchWithTimeout(url);
  }


  //Get 1x2 predictions
  async getMarketPredictions(params = {}) {
    const {
      market = "full_time_result",// "over_under_25", "btts"
      date,
    } = params;

    //or without market ${this.baseUrl}/en-gb/soccer/predictions-new/2026-09-25

    const url = `${this.baseUrl}/en-gb/soccer/predictions-new/${date}/market/${market}`;
    return this.fetchWithTimeout(url);
  }

  //Get team fixture prediction
  async getFixturePrediction(matchId, params = {}) {
    const {
      homeTeamName,//augsburg
      awayTeamName,//cologne
      date,//27-02-2026
      lang = "en"
    } = params;
    const url = `https://sporticos.com/api/news-proxy/match_prediction_posts/${matchId}-${matchId}-predictions-${date}?lang=${lang}`
    return this.fetchWithTimeout(url);
  }

  //Get league header
  async getLeagueHeader(leagueId) {
    let url = `${this.baseUrl}/en-gb/soccer/league/${leagueId}/header`
    return this.fetchWithTimeout(url);
  }

  //Get league table/standings
  async getLeagueTable(leagueId) {
    let url = `${this.baseUrl}/en-gb/soccer/league/${leagueId}/table`
    return this.fetchWithTimeout(url);
  }

  //Get league last results
  async getLeagueLastResults(leagueId) {
    let url = `${this.baseUrl}/en-gb/soccer/league/${leagueId}/lastResults`
    return this.fetchWithTimeout(url);
  }

  //Get league fixtures
  async getLeagueFixtures(leagueId, params = {}) {
    const {
      limit = 10,
      offset = 0
    } = params;

    const url = `${this.baseUrl}/en-gb/soccer/league/${leagueId}/fixtures?limit=${limit}&?offset=${offset}`
    return this.fetchWithTimeout(url);
  }

  //Get posts
  async getPosts(params = {}) {
    const {
      limit = 10,
      offset = 0,
      isPublished = 1,
      lang = "en"
    } = params;

    const url = `https://sporticos.com/api/news-proxy/read/posts?limit=${limit}&?offset=${offset}&is_published=${isPublished}&lang=${lang}`//&published_at%5Blte%5D=2026-09-25T08:30:00Z&with_total=0&tag_resource_id=2&tag_resource_type=provider`
    return this.fetchWithTimeout(url);
  }

  //Get single post by id
  async getSinglePostById(postId) {
    let url = `https://sporticos.com/api/news-proxy/read/posts/${postId}`
    return this.fetchWithTimeout(url);
  }

  //Get single post by title
  async getSinglePostByTitle(title) {
    const slug = title.trim().toLowerCase()
      .replace(/€/g, 'eur')       // Replace € with eur
      .replace(/\./g, '')         // Remove decimals (turns 22.7 into 227)
      .replace(/[^a-z0-9]+/g, '-'); // Replace spaces and special chars with hyphens
    let url = `https://sporticos.com/api/news-proxy/read/posts/${slug}?lang=en`
    return this.fetchWithTimeout(url);
  }

  //Get guides
  async getGuides(params = {}) {
    const {
      limit = 10,
      offset = 0,
      isPublished = 1,
      lang = "en"
    } = params;

    const url = `https://sporticos.com/api/news-proxy/read/guides?limit=${limit}&?offset=${offset}&is_published=${isPublished}&lang=${lang}`//&published_at%5Blte%5D=2026-09-25T15:00:00Z`
    return this.fetchWithTimeout(url);
  }

}

const apiService = new SporticosApiService();


// ============ API ENDPOINTS ============

// Root endpoint - API documentation
app.get("/", (req, res) => {
  res.json({
    name: "Sporticos API",
    version: "1.0.0",
    baseUrl: `http://localhost:${PORT}`,
    endpoints: {
      "/api/providers": "Get TV/stream/news providers",
      "/api/bookmakers": "Get bookmakers",
      "/api/live": "Get live matches with filtering options",
      "/api/matches/": "Get competitions with matches",
      "/api/fixtures": "Get fixtures",
      "/api/match/:id": "Get match by ID",
      "/api/match/:id/how-to-watch": "Get how to watch a match",
      "/api/match/:matchId/header": "Get match header",
      "/api/match/:matchId/tv": "Get match TV",
      "/api/match/:matchId/vpn-offer": "Get match VPN offer",
      "/api/match/:matchId/odds_and_predictions": "Get match odds and predictions",
      "/api/match/:matchId/betting_tips": "Get match betting tips",
      "/api/match/:matchId/h2h": "Get match head-to-head",
      "/api/match/:matchId/brackets": "Get match brackets",
      "/api/match/:matchId/feeds": "Get match feeds",
      "/api/match/:matchId/form": "Get match form",
      "/api/match/:matchId/statistics": "Get match statistics",
      "/api/predictions/:date": "Get predictions by date",
      "/api/prediction_posts": "Get prediction posts",
      "/api/prediction_market/": "Get predictions by market",
      "/api/prediction_fixture/": "Get predictions by fixture",
      "/api/league/:leagueId/header": "Get league header",
      "/api/league/:leagueId/table": "Get league table/standings",
      "/api/league/:leagueId/lastResults": "Get league last results",
      "/api/league/:leagueId/fixtures": "Get league fixtures",
      "/api/posts": "Get posts",
      "/api/posts/:postId": "Get post by ID",
      "/api/posts/:title": "Get post by title",
      "/api/guides": "Get guides",
      "/api/health": "API health check",
    },
    timestamp: new Date().toISOString(),
  });
});

//Get tv/stream/news providers
app.get("/api/providers", async (req, res) => {
  const { countryId = 4, isPublished = 1 } = req.query;

  try {
    const data = await apiService.getTvProviders({
      countryId,
      isPublished
    });
    res.json({
      success: true,
      data: data.data || [],
      meta: data.meta || {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch providers",
      message: error.message,
    });
  }
});

//Get bookmakers
app.get("/api/bookmakers", async (req, res) => {

  try {
    const data = await apiService.getBookmakers();
    res.json({
      success: true,
      data: data.data || [],
      meta: data.meta || {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch bookmakers data",
      message: error.message,
    });
  }
});

// Get live matches with filtering
app.get("/api/live", async (req, res) => {
  const {
    ids = [],
  } = req.query;

  try {
    const data = await apiService.getLiveMatches(params = {ids : []});
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch live matches",
      message: error.message,
    });
  }
});

// Get competitions with matches
app.get("/api/matches/", async (req, res) => {
  const { sportId } = req.params;
  const {
    limit = 50,
    offset = 0,
    fromDate,//2026-09-25T21:00:00Z
    toDate,//2026-09-26T20:59:59Z
  } = req.query;

  try {
    const data = await apiService.getCompetitionsWithMatches({
      limit: parseInt(limit),
      offset: parseInt(offset),
      fromDate,
      toDate
    });

    res.json({
      success: true,
      data,
      limit: parseInt(limit),
      offset: parseInt(offset),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch matches",
      message: error.message,
    });
  }
});

// Get fixtures
app.get("/api/fixtures", async (req, res) => {
  try {
    const data = await apiService.getFixtures();
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch live matches",
      message: error.message,
    });
  }
});

// Get match by ID
app.get("/api/match/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const data = await apiService.getMatch(id);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch match",
      message: error.message,
    });
  }
});

 //Get how to watch a match
app.get("/api/match/:id/how-to-watch", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await apiService.getMatchWatch(id);

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch how to watch match",
      message: error.message,
    });
  }
});

// Get match header
app.get("/api/match/:matchId/header", async (req, res) => {
  const { matchId } = req.params;

  try {
    const data = await apiService.getMatchHeader(matchId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch match header",
      message: error.message,
    });
  }
});

// Get match tv
app.get("/api/match/:matchId/tv", async (req, res) => {
  const { matchId } = req.params;

  try {
    const data = await apiService.getMatchTv(matchId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch match tv",
      message: error.message,
    });
  }
});

// Get match vpn-offer
app.get("/api/match/:matchId/vpn-offer", async (req, res) => {
  const { matchId } = req.params;

  try {
    const data = await apiService.getMatchVpnOffer(matchId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch match vpn-offer",
      message: error.message,
    });
  }
});

// Get match odds and predictions
app.get("/api/match/:matchId/odds_and_predictions", async (req, res) => {
  const { matchId } = req.params;

  try {
    const data = await apiService.getMatchOddAndPredictions(matchId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch match odds and predictions",
      message: error.message,
    });
  }
});

// Get match betting tips
app.get("/api/match/:matchId/betting_tips", async (req, res) => {
  const { matchId } = req.params;
  const { 
    limit = 100,
    offset = 0,
   } = req.query;

  try {
    const data = await apiService.getMatchBettingTips(matchId, {limit, offset});
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch match betting tips",
      message: error.message,
    });
  }
});

//Get match head-to-head
app.get("/api/match/:matchId/h2h", async (req, res) => {
  const { matchId } = req.params;

  try {
    const data = await apiService.getMatchHeadToHead(matchId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch match heade-to-head",
      message: error.message,
    });
  }
});

//Get match brackets
app.get("/api/match/:matchId/brackets", async (req, res) => {
  const { matchId } = req.params;

  try {
    const data = await apiService.getMatchBrackets(matchId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch match brackets",
      message: error.message,
    });
  }
});

//Get match feeds
app.get("/api/match/:matchId/feeds", async (req, res) => {
  const { matchId } = req.params;

  try {
    const data = await apiService.getMatchFeeds(matchId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch match feeds",
      message: error.message,
    });
  }
});

//Get match form
app.get("/api/match/:matchId/form", async (req, res) => {
  const { matchId } = req.params;

  try {
    const data = await apiService.getMatchForm(matchId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch match form",
      message: error.message,
    });
  }
});

//Get match statistics
app.get("/api/match/:matchId/statistics", async (req, res) => {
  const { matchId } = req.params;

  try {
    const data = await apiService.getMatchStatistics(matchId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch match statistics",
      message: error.message,
    });
  }
});

//Get by predictions
app.get("/api/predictions/:date", async (req, res) => {
  const { date } = req.params;

  try {
    const data = await apiService.getMatchPredictions(date);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      date,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch predictions selected date",
      message: error.message,
    });
  }
});

//Get predictions
app.get("/api/prediction_posts", async (req, res) => {
  const { 
    limit = 50,
    offset = 0,
    is_published = 1,
    lang = "en"
   } = req.query;

  try {
    const data = await apiService.getPredictions({
      limit,
      offset,
      is_published,
      lang
    });
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch predictions",
      message: error.message,
    });
  }
});

//Get predictions by market
app.get("/api/prediction_market/", async (req, res) => {
  const { 
    market = "full_time_result",// "over_under_25", "btts"
    date,
   } = req.query;

  try {
    const data = await apiService.getMarketPredictions({
      market,
      date
    });
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      date,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch predictions for market",
      message: error.message,
    });
  }
});

//Get predictions by fixture
app.get("/api/prediction_fixture/", async (req, res) => {
  const { 
    homeTeamName,//augsburg
    awayTeamName,//cologne
    date,//27-02-2026
    lang = "en"
   } = req.query;

  try {
    const data = await apiService.getFixturePrediction({
      homeTeamName,
      awayTeamName,
      date,
      lang
    });
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      date,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch predictions for the fixture",
      message: error.message,
    });
  }
});

//Get league header
app.get("/api/league/:leagueId/header", async (req, res) => {
  const { leagueId } = req.params;

  try {
    const data = await apiService.getLeagueHeader(leagueId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch league header",
      message: error.message,
    });
  }
});

//Get league table
app.get("/api/league/:leagueId/table", async (req, res) => {
  const { leagueId } = req.params;

  try {
    const data = await apiService.getLeagueTable(leagueId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch league table",
      message: error.message,
    });
  }
});

//Get league lastResults
app.get("/api/league/:leagueId/lastResults", async (req, res) => {
  const { leagueId } = req.params;

  try {
    const data = await apiService.getLeagueLastResults(leagueId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch league lastResults",
      message: error.message,
    });
  }
});

//Get league fixtures
app.get("/api/league/:leagueId/fixtures", async (req, res) => {
  const { leagueId } = req.params;

  try {
    const data = await apiService.getLeagueFixtures(leagueId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch league fixtures",
      message: error.message,
    });
  }
});


//Get posts
app.get("/api/posts", async (req, res) => {
  const { 
    limit = 10,
    offset = 0,
    isPublished = 1,
    lang = "en"
  } = req.query;

  try {
    const data = await apiService.getPosts({
      limit,
      offset,
      isPublished,
      lang
    });
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch posts",
      message: error.message,
    });
  }
});

//Get post by id
app.get("/api/posts/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const data = await apiService.getSinglePostById(postId);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch post",
      message: error.message,
    });
  }
});

//Get post by title
app.get("/api/posts/:title", async (req, res) => {
  const { title } = req.params;

  try {
    const data = await apiService.getSinglePostByTitle(title);
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch post",
      message: error.message,
    });
  }
});

//Get guides
app.get("/api/guides", async (req, res) => {
  const { 
    limit = 50,
    offset = 0,
    isPublished = 1,
    lang = "en"
  } = req.query;

  try {
    const data = await apiService.getGuides({
      limit,
      offset,
      isPublished,
      lang
    });
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch guides",
      message: error.message,
    });
  }
});


// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});


// ============ START SERVER ============
async function startServer() {
  console.log("🚀 Starting Sporticos API Server v1.0...");
  console.log("=".repeat(50));

  app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log("\n📡 Available endpoints:");
    console.log(
      `  GET  /                                          - API documentation`,
    );
    console.log(
      `  GET  /api/providers                             - Get TV/stream/news providers`,
    );
    console.log(
      `  GET  /api/bookmakers                            - Get bookmakers`,
    );
    console.log(
      `  GET  /api/live                                  - Get live matches with filtering options`,
    );
    console.log(
      `  GET  /api/matches/                              - Get competitions with matches`,
    );
    console.log(
      `  GET  /api/fixtures                              - Get fixtures`,
    );
    console.log(
      `  GET  /api/match/:id                             - Get match by ID`,
    );
    console.log(
      `  GET  /api/match/:id/how-to-watch                - Get how to watch a match`,
    );
    console.log(
      `  GET  /api/match/:matchId/header                 - Get match header`,
    );
    console.log(
      `  GET  /api/match/:matchId/tv                     - Get match TV`,
    );
    console.log(
      `  GET  /api/match/:matchId/vpn-offer              - Get match VPN offer`,
    );
    console.log(
      `  GET  /api/match/:matchId/odds_and_predictions   - Get match odds and predictions`,
    );
    console.log(
      `  GET  /api/match/:matchId/betting_tips           - Get match betting tips`,
    );
    console.log(
      `  GET  /api/match/:matchId/h2h                    - Get match head-to-head`,
    );
    console.log(
      `  GET  /api/match/:matchId/brackets               - Get match brackets`,
    );
    console.log(
      `  GET  /api/match/:matchId/feeds                  - Get match feeds`,
    );
    console.log(
      `  GET  /api/match/:matchId/form                   - Get match form`,
    );
    console.log(
      `  GET  /api/match/:matchId/statistics             - Get match statistics`,
    );
    console.log(
      `  GET  /api/predictions/:date                     - Get predictions by date`,
    );
    console.log(
      `  GET  /api/prediction_posts                      - Get prediction posts`,
    );
    console.log(
      `  GET  /api/prediction_market/                    - Get predictions by market`,
    );
    console.log(
      `  GET  /api/prediction_fixture/                   - Get predictions by fixture`,
    );
    console.log(
      `  GET  /api/league/:leagueId/header               - Get league header`,
    );
    console.log(
      `  GET  /api/league/:leagueId/table                - Get league table/standings`,
    );
    console.log(
      `  GET  /api/league/:leagueId/lastResults          - Get league last results`,
    );
    console.log(
      `  GET  /api/league/:leagueId/fixtures             - Get league fixtures`,
    );
    console.log(
      `  GET  /api/posts                                 - Get posts`,
    );
    console.log(
      `  GET  /api/posts/:postId                         - Get post by ID`,
    );
    console.log(
      `  GET  /api/posts/:title                          - Get post by title`,
    );
    console.log(
      `  GET  /api/guides                                - Get guides`,
    );
    console.log(`  GET  /api/health                                - Health check`);

    console.log("\n📝 Examples:");
    console.log(`  http://localhost:${PORT}/api/providers`);
    console.log(`  http://localhost:${PORT}/api/bookmakers`);
    console.log(`  http://localhost:${PORT}/api/live?ids=1431908,1433768`);
    console.log(`  http://localhost:${PORT}/api/matches/?limit=10&fromDate=2026-09-25T21:00:00Z&toDate=2026-09-26T20:59:59Z`);
    console.log(`  http://localhost:${PORT}/api/match/1431908`);
    console.log(`  http://localhost:${PORT}/api/match/1431908/how-to-watch`);
    console.log(`  http://localhost:${PORT}/api/league/1/table`);
    console.log(`  http://localhost:${PORT}/api/predictions/2026-09-25`);
    console.log(`  http://localhost:${PORT}/api/guides?limit=5`);
  });
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit();
});

startServer().catch(console.error);
