const express = require("express");
const axios = require("axios");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// ============ CONFIGURATION ============
const SPORTICOS_API = {
  baseUrl: "https://api.betika.com/v1",
  //liveBaseUrl: "https://live.betika.com/v1",
  endpoints: {
    sport: "/soccer",
    match: "/match",
    live: "/live",
    v2: "v2",
  },

  /*
  https://sporticos.com/_i18n/wWX-Arq-/en-gb/messages.json
  https://sporticos.com/api/bonus-offer/en-gb
  https://sporticos.com/api/proxy/api/soccer/match/slugs
  https://sporticos.com/api/proxy/api/soccer/league/slugs
  https://sporticos.com/api/proxy/api/soccer/match/routing
  */
};

// ============ IN-MEMORY CACHE ============
let cache = {
  live: [],
  jackpots: [],
  jackpotEvents: null,   // <-- add
  previousJackpots: [],
  boostedEvents: [],
  sports: [],
  lastUpdate: null,
  lastJackpotUpdate: null,
};

// ============ API SERVICE ============
class SporticosApiService {
  constructor() {
    this.baseUrl = SPORTICOS_API.baseUrl;
    //this.liveBaseUrl = SPORTICOS_API.liveBaseUrl;
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
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Get live matches with filters
  async getLiveMatches(params = {}) {
    const {
      ids = [1431908,1433768,870224],
    } = params;

    let url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}${page}&ids=${ids}`;
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

    let url = `https://sporticos.com/api/proxy/api/en-gb/soccer/fixtures/competitions-with-matches?limit=${limit}&offset=${page}&from=${fromDate}&to=${toDate}`;
    return this.fetchWithTimeout(url);
  }

  // Get fixtures
  async getFixtures() {
    const url = `https://sporticos.com/api/proxy/api/en-gb/soccer/fixtures`;
    return this.fetchWithTimeout(url);
  }

  // Get match details by match_id
  async getMatch(matchId) {
    const url = `${this.liveBaseUrl}${SPORTICOS_API.endpoints.match}?id=${matchId}`;
    return this.fetchWithTimeout(url);
  }

  //Get how to watch a match
  async getMatchWatch(matchId) {
    const url = `${this.liveBaseUrl}/match/${matchId}/how-to-watch`
    return this.fetchWithTimeout(url);
  }

  //Get match header
  async getMatchHeader(matchId) {
    const url = `${this.baseUrl}/match/${matchId}/header`
    return this.fetchWithTimeout(url);
  }

  //Get match tv
  async getMatchTv(matchId) {
    const url = `${this.baseUrl}/match/${matchId}/tv`
    return this.fetchWithTimeout(url);
  }

  //Get match vpn-offer
  async getMatchVpnOffer(matchId) {
    const url = `${this.baseUrl}/match/${matchId}/vpn-offer`
    return this.fetchWithTimeout(url);
  }

  //Get match odds and predictions
  async getMatchOddAndPredictions(matchId) {
    const url = `${this.baseUrl}/match/${matchId}/feed/odds_and_predictions`
    return this.fetchWithTimeout(url);
  }

  //Get match betting tips
  async getMatchBettingTips(matchId, params = {}) {
    const {
      limit = 100,
      offset = 0,
    } = params;
    const url = `${this.baseUrl}/match/${matchId}/feed/betting_tips?limit=${limit}&offset=${offset}`
    return this.fetchWithTimeout(url);
  }

  //Get match head-to-head
  async getMatchHeadToHead(matchId) {
    const url = `${this.baseUrl}/match/${matchId}/feed/head_to_head`
    return this.fetchWithTimeout(url);
  }

  //Get match brackets
  //A match bracket (or tournament bracket) is a tree-like visual diagram that maps out every head-to-head matchup in a knockout tournament, showing how players or teams advance from the early rounds all the way to the championship
  async getMatchBrackets(matchId) {
    const url = `${this.baseUrl}/match/${matchId}/feed/brackets`
    return this.fetchWithTimeout(url);
  }

  //Get match feeds
  async getMatchFeeds(matchId) {
    const url = `${this.baseUrl}/match/${matchId}/feeds`
    return this.fetchWithTimeout(url);
  }

  //Get match form
  async getMatchForm(matchId) {
    const url = `${this.baseUrl}/match/${matchId}/feed/form`
    return this.fetchWithTimeout(url);
  }

  //Get match statistics
  async getMatchStatistics(matchId) {
    const url = `${this.baseUrl}/match/${matchId}/statistics`
    return this.fetchWithTimeout(url);
  }

  //Get predictions
  async getMatchPredictions(date) {
    let url = `${this.baseUrl}${sport}/predictions-new/`
    url = date !== "" ? url : url + date
    return this.fetchWithTimeout(url);
  }

  // Get predictions
  async getPredictions(sportId, params = {}) {
    const {
      limit = 10,
      offset = 0,
      is_published = 1,
      lang = en
    } = params;

    const url = `https://sporticos.com/api/news-proxy/read/match_prediction_posts?limit=${limit}&offset=${offset}&is_published=${is_published}&slang=${en}`; //&published_at%5Blte%5D=2026-02-26T04:12:00%2B03:00
    return this.fetchWithTimeout(url);
  }

  //Get team fixture prediction
  async getMatchStatistics(matchId, params = {}) {
    const {
      homeTeamName,//augsburg
      awayTeamName,//cologne
      date,//27-02-2026
      lang = en
    } = params;
    const url = `https://sporticos.com/api/news-proxy/match_prediction_posts/${matchId}-${matchId}-predictions-${date}?lang=${lang}`
    return this.fetchWithTimeout(url);
  }

  //Get league header
  async getLeagueHeader(leagueId) {
    let url = `https://sporticos.com/api/proxy/api/en-gb/soccer/league/${leagueId}/header`
    return this.fetchWithTimeout(url);
  }

  //Get league table/standings
  async getLeagueTable(leagueId) {
    let url = `https://sporticos.com/api/proxy/api/en-gb/soccer/league/${leagueId}/table`
    return this.fetchWithTimeout(url);
  }

  //Get league last results
  async getLeagueLastResults(leagueId) {
    let url = `https://sporticos.com/api/proxy/api/en-gb/soccer/league/${leagueId}/lastResults`
    return this.fetchWithTimeout(url);
  }

  //Get league fixtures
  async getLeagueFixtures(matchId, params = {}) {
    const {
      limit = 10,
      offset = 0
    } = params;

    const url = `https://sporticos.com/api/proxy/api/en-gb/soccer/league/233/fixtures?limit=${limit}&?offset=${offset}`
    return this.fetchWithTimeout(url);
  }

  //Get single post
  async getSinglePost(postId) {
    let url = `https://sporticos.com/api/news-proxy/read/posts/${postId}`
    return this.fetchWithTimeout(url);
  }


  // Get predictions
  async getPredictions(sportId, params = {}) {
    const {
      limit = 10,
      offset = 0,
      is_published = 1,
      lang = en
    } = params;

    const url = `https://sporticos.com/api/news-proxy/read/posts?limit==${limit}&offset=${offset}&is_published=${is_published}&slang=${en}`; //&published_at%5Blte%5D=2026-02-26T04:12:00%2B03:00
    return this.fetchWithTimeout(url);
  }

  // Get sport categories and competitions
  async getSport(sportId, params = {}) {
    const { page = 1, limit = 100 } = params;
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.sport}?page=${page}&limit=${limit}&id=${sportId}`;
    return this.fetchWithTimeout(url);
  }

  // Get jackpot events
  async getJackpotData() {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.jackpot}`;
    return this.fetchWithTimeout(url);
  }

  async getJackpotEvents(eventId) {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.jackpotEvent}?id=${eventId}`;
    return this.fetchWithTimeout(url);
  }

  // Get previous jackpots
  async getPreviousJackpots() {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.previousJackpot}`;
    return this.fetchWithTimeout(url);
  }

  // Get boosted events
  async getBoostedEvents() {
    const url = `${this.baseUrl}${SPORTICOS_API.endpoints.boosted}`;
    return this.fetchWithTimeout(url);
  }
}

const apiService = new SporticosApiService();

// ============ CACHE UPDATE FUNCTIONS ============
async function updateCache() {
  console.log("🔄 Updating cache...");
  try {
    // Fetch matches (Soccer by default)
    const matchesData = await apiService.getMatches({
      limit: 100,
      sport_id: 14,
      sort_id: 1,
    });
    cache.live = matchesData.data || [];
    cache.liveMeta = matchesData.meta || {};

    // Fetch sports
    const sportsData = await apiService.getSports();
    cache.sports = sportsData.data || [];

    // Fetch jackpots
    const jackpotData = await apiService.getJackpotData();
    cache.jackpots = jackpotData || [];

    const firstId = Array.isArray(jackpotData) ? jackpotData[0]?.id : null;
       if (firstId) {
       cache.jackpotEvents = await apiService.getJackpotEvents(firstId);
    }

    // Fetch previous jackpots
    const previousJackpotData = await apiService.getPreviousJackpots();
    cache.previousJackpots = previousJackpotData || [];

    // Fetch boosted events
    const boostedData = await apiService.getBoostedEvents();
    cache.boostedEvents = boostedData || [];

    cache.lastUpdate = new Date().toISOString();
    console.log(`✅ Cache updated at ${cache.lastUpdate}`);
    console.log(`   - ${cache.live.length} matches loaded`);
    console.log(`   - ${cache.sports.length} sports loaded`);
    console.log(`   - ${cache.jackpots.length} jackpots loaded`);
  } catch (error) {
    console.error("❌ Cache update failed:", error.message);
  }
}

async function updateJackpotCache() {
  console.log("🔄 Updating jackpot cache...");
  try {
    // get the list, then fetch each event's detail
    const list = await apiService.getJackpotData();       // array of metas
    const events = await Promise.all(
      (list || []).map(async (meta) => {
        try {
          const detail = await apiService.getJackpotEvents(meta.id);
          return { meta: detail?.meta || meta, data: detail?.data || [] };
        } catch (e) {
          return { meta, data: [] };
        }
      })
    );
    cache.jackpotEvents = events;
    cache.lastJackpotUpdate = new Date().toISOString();
    console.log(`✅ Jackpot cache updated at ${cache.lastJackpotUpdate}`);
  } catch (error) {
    console.error("❌ Jackpot cache update failed:", error.message);
  }
}

// ============ API ENDPOINTS ============

// Root endpoint - API documentation
app.get("/", (req, res) => {
  res.json({
    name: "Betika API",
    version: "3.0.0",
    description:
      "Betika matches, match details, and jackpot data API using official Betika API",
    baseUrl: `http://localhost:${PORT}`,
    endpoints: {
      "/api": "API documentation",
      "/api/matches": "Get all matches with filtering options",
      "/api/matches/:id": "Get match by ID",
      "/api/match/:matchId": "Get detailed match by Betika match ID",
      "/api/matches/sport/:sportId": "Get matches by sport",
      "/api/sports": "Get all sports",
      "/api/sport/:sportId": "Get sport categories and competitions",
      "/api/jackpot": "Get jackpot events",
      "/api/jackpot/previous": "Get previous jackpots",
      "/api/jackpot/boosted": "Get boosted events",
      "/api/refresh": "Force refresh all data",
      "/api/health": "API health check",
    },
    cache: {
      lastUpdate: cache.lastUpdate,
      totalMatches: cache.live.length,
      totalSports: cache.sports.length,
    },
    timestamp: new Date().toISOString(),
  });
});

// Get all sports
app.get("/api/sports", async (req, res) => {
  try {
    const sportsData = await apiService.getSports();
    res.json({
      success: true,
      data: sportsData.data || [],
      meta: sportsData.meta || {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch sports",
      message: error.message,
    });
  }
});

// Get sport categories and competitions
app.get("/api/sport/:sportId", async (req, res) => {
  const { sportId } = req.params;
  const { limit = 100 } = req.query;

  try {
    const data = await apiService.getSport(sportId, { limit });
    res.json({
      success: true,
      data: data.data || [],
      meta: data.meta || {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch sport data",
      message: error.message,
    });
  }
});

// Get all matches with filtering
app.get("/api/matches", async (req, res) => {
  const {
    page = 1,
    limit = 50,
    sport_id,
    sub_type_id = "1,186,340",
    sort_id = 1,
    period_id = -1,
    tab = "",
    esports = false,
  } = req.query;

  try {
    const data = await apiService.getMatches({
      page: parseInt(page),
      limit: parseInt(limit),
      sport_id,
      sub_type_id,
      sort_id: parseInt(sort_id),
      period_id: parseInt(period_id),
      tab,
      esports: esports === "true",
    });

    res.json({
      success: true,
      data,
      meta: data.meta || {},
      total: data.meta?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit),
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

// Get matches by sport
app.get("/api/matches/sport/:sportId", async (req, res) => {
  const { sportId } = req.params;
  const {
    page = 1,
    limit = 50,
    sub_type_id = "1,186,340",
    sort_id = 1,
    period_id = -1,
  } = req.query;

  try {
    const data = await apiService.getMatchesBySport(sportId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sub_type_id,
      sort_id: parseInt(sort_id),
      period_id: parseInt(period_id),
    });

    res.json({
      success: true,
      data,
      meta: data.meta || {},
      total: data.meta?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      sportId: parseInt(sportId),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch matches for sport",
      message: error.message,
    });
  }
});

// Get match by ID
app.get("/api/matches/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Try to find in cache first
    let match = cache.live.find((m) => m.match_id == id);

    if (match) {
      return res.json({
        success: true,
        source: "cache",
        data: match,
        timestamp: new Date().toISOString(),
      });
    }

    // If not in cache, fetch from API
    const data = await apiService.getMatch(id);

    if (!data || !data.meta) {
      return res.status(404).json({
        success: false,
        error: "Match not found",
        message: `No match found with ID: ${id}`,
      });
    }

    res.json({
      success: true,
      source: "api",
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

// Get match by parent match ID
app.get("/api/match/parent/:parentMatchId", async (req, res) => {
  const { parentMatchId } = req.params;

  try {
    const data = await apiService.getMatchByParentId(parentMatchId);

    if (!data || !data.meta) {
      return res.status(404).json({
        success: false,
        error: "Match not found",
        message: `No match found with parent ID: ${parentMatchId}`,
      });
    }

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

// Get match details by Betika match ID
app.get("/api/match/:matchId", async (req, res) => {
  const { matchId } = req.params;

  try {
    const data = await apiService.getMatch(matchId);

    if (!data || !data.meta) {
      return res.status(404).json({
        success: false,
        error: "Match not found",
        message: `No match found with ID: ${matchId}`,
      });
    }

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

// Get jackpot events
app.get("/api/jackpot", async (req, res) => {
  try {
    const data = await apiService.getJackpotData();
    res.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch jackpot events",
      message: error.message,
    });
  }
});

// Get previous jackpots
app.get("/api/jackpot/previous", async (req, res) => {
  try {
    const data = await apiService.getPreviousJackpots();
    res.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch previous jackpots",
      message: error.message,
    });
  }
});

// Get boosted events
app.get("/api/jackpot/boosted", async (req, res) => {
  try {
    const data = await apiService.getBoostedEvents();
    res.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch boosted events",
      message: error.message,
    });
  }
});

app.get("/api/jackpot/:eventId", async (req, res) => {
  const { eventId } = req.params;
  try {
    const payload = await apiService.getJackpotEvents(eventId);
    res.json({
      success: true,
      meta: payload?.meta || null,
      data: payload?.data || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch jackpot event", message: error.message });
  }
});

// Force refresh all data
app.get("/api/refresh", async (req, res) => {
  res.json({
    success: true,
    message: "Data refresh triggered",
    status: "refreshing",
    timestamp: new Date().toISOString(),
  });

  // Run in background
  setTimeout(async () => {
    await updateCache();
  }, 100);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    matchesCount: cache.live.length,
    sportsCount: cache.sports.length,
    jackpotsCount: cache.jackpots.length,
    lastUpdate: cache.lastUpdate,
    lastJackpotUpdate: cache.lastJackpotUpdate,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

// ============ LEGACY SUPPORT - Keep for backward compatibility ============
app.get("/api/betika-events", async (req, res) => {
  try {
    const { page = 1, limit = 2400, sport_id = 14 } = req.query;
    const data = await apiService.getMatches({
      page: parseInt(page),
      limit: parseInt(limit),
      sport_id,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// ============ START SERVER ============
async function startServer() {
  console.log("🚀 Starting Betika API Server v3.0...");
  console.log("=".repeat(50));

  // Initial cache load
  await updateCache();

  // Auto-refresh every 5 minutes
  setInterval(updateCache, 5 * 60 * 1000);
  setInterval(updateJackpotCache, 5 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log("\n📡 Available endpoints:");
    console.log(
      `  GET  /                                    - API documentation`,
    );
    console.log(`  GET  /api/sports                          - Get all sports`);
    console.log(
      `  GET  /api/sport/:sportId                 - Get sport categories & competitions`,
    );
    console.log(
      `  GET  /api/matches                        - Get all matches with filters`,
    );
    console.log(`  GET  /api/matches/:id                    - Get match by ID`);
    console.log(
      `  GET  /api/match/:matchId                 - Get detailed match`,
    );
    console.log(
      `  GET  /api/match/parent/:parentMatchId   - Get match by parent ID`,
    );
    console.log(
      `  GET  /api/matches/sport/:sportId         - Get matches by sport`,
    );
    console.log(
      `  GET  /api/jackpot                        - Get jackpot events`,
    );
    console.log(
      `  GET  /api/jackpot/previous               - Get previous jackpots`,
    );
    console.log(
      `  GET  /api/jackpot/boosted                - Get boosted events`,
    );
    console.log(
      `  GET  /api/refresh                        - Force refresh data`,
    );
    console.log(`  GET  /api/health                         - Health check`);

    console.log("\n📝 Examples:");
    console.log(`  http://localhost:${PORT}/api/matches?limit=10&sport_id=14`);
    console.log(`  http://localhost:${PORT}/api/matches/11072625`);
    console.log(`  http://localhost:${PORT}/api/match/11072625`);
    console.log(`  http://localhost:${PORT}/api/sports`);
    console.log(`  http://localhost:${PORT}/api/sport/14`);
    console.log(`  http://localhost:${PORT}/api/jackpot`);

    console.log(
      `\n📊 Cache status: ${cache.live.length} matches, ${cache.sports.length} sports loaded`,
    );
    console.log(`🔄 Auto-refresh every 5 minutes`);
  });
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit();
});

startServer().catch(console.error);
