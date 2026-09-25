# Sporticos API Documentation

A Node.js/Express REST API that proxies and exposes data from [Sporticos](https://sporticos.com) — football/soccer matches, live scores, predictions, betting tips, TV providers, bookmakers, league standings, and news posts.

---

## Table of Contents

- [Base URL](#base-url)
- [Response Format](#response-format)
- [Quick Start](#quick-start)
- [Endpoints](#endpoints)
  - [Documentation & Health](#documentation--health)
  - [Providers & Bookmakers](#providers--bookmakers)
  - [Matches & Fixtures](#matches--fixtures)
  - [Match Details (by match ID)](#match-details-by-match-id)
  - [Predictions](#predictions)
  - [Leagues](#leagues)
  - [Posts & Guides](#posts--guides)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Known Limitations](#known-limitations)

---

## Base URL

```
http://localhost:3000
```

The port is configurable via the `PORT` environment variable.

---

## Response Format

All endpoints return JSON with a consistent envelope:

**Success:**
```json
{
  "success": true,
  "data": { },
  "timestamp": "2026-09-25T10:30:00.000Z"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Failed to fetch match",
  "message": "HTTP error! status: 404"
}
```

Most list endpoints also include `limit`, `offset`, `meta`, or `date` fields where applicable.

---

## Quick Start

```bash
# Install dependencies
npm install express axios

# Start the server
node server.js

# Server runs at http://localhost:3000
```

---

## Endpoints

### Documentation & Health

#### `GET /`
Returns API documentation — a list of all available endpoints.

```bash
curl http://localhost:3000/
```

#### `GET /api/health`
Health check with uptime and memory usage.

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": 1234.56,
  "memoryUsage": { "rss": 45678912, "heapTotal": 12345678, "heapUsed": 8765432 },
  "timestamp": "2026-09-25T10:30:00.000Z"
}
```

---

### Providers & Bookmakers

#### `GET /api/providers`
Get TV/stream/news providers.

| Query Param | Type | Default | Description |
|---|---|---|---|
| `countryId` | integer | `4` | Country ID filter |
| `isPublished` | integer | `1` | Filter by published status |

```bash
curl "http://localhost:3000/api/providers?countryId=4&isPublished=1"
```

---

#### `GET /api/bookmakers`
Get bookmaker rankings.

```bash
curl http://localhost:3000/api/bookmakers
```

---

### Matches & Fixtures

#### `GET /api/live`
Get live matches.

| Query Param | Type | Default | Description |
|---|---|---|---|
| `ids` | array | `[]` | Comma-separated match IDs |

```bash
curl "http://localhost:3000/api/live?ids=1431908,1433768"
```

> ⚠️ **Note:** Currently the handler passes an empty `ids` array to the service regardless of query params. See [Known Limitations](#known-limitations).

---

#### `GET /api/matches/`
Get competitions with matches.

| Query Param | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `50` | Number of results |
| `offset` | integer | `0` | Pagination offset |
| `fromDate` | ISO 8601 | — | Start datetime (e.g. `2026-09-25T21:00:00Z`) |
| `toDate` | ISO 8601 | — | End datetime (e.g. `2026-09-26T20:59:59Z`) |

```bash
curl "http://localhost:3000/api/matches/?limit=10&fromDate=2026-09-25T21:00:00Z&toDate=2026-09-26T20:59:59Z"
```

---

#### `GET /api/fixtures`
Get all fixtures.

```bash
curl http://localhost:3000/api/fixtures
```

---

### Match Details (by match ID)

All endpoints below take a Sporticos match ID (e.g. `1431908`).

#### `GET /api/match/:id`
Get detailed match information.

```bash
curl http://localhost:3000/api/match/1431908
```

#### `GET /api/match/:id/how-to-watch`
Get how-to-watch information for a match.

```bash
curl http://localhost:3000/api/match/1431908/how-to-watch
```

#### `GET /api/match/:matchId/header`
Get match header (teams, score, competition, status).

```bash
curl http://localhost:3000/api/match/1431908/header
```

#### `GET /api/match/:matchId/tv`
Get TV broadcast listings for a match.

```bash
curl http://localhost:3000/api/match/1431908/tv
```

#### `GET /api/match/:matchId/vpn-offer`
Get VPN offer shown alongside the match.

```bash
curl http://localhost:3000/api/match/1431908/vpn-offer
```

#### `GET /api/match/:matchId/odds_and_predictions`
Get odds and predictions for a match.

```bash
curl http://localhost:3000/api/match/1431908/odds_and_predictions
```

#### `GET /api/match/:matchId/betting_tips`
Get betting tips for a match.

| Query Param | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `100` | Number of tips |
| `offset` | integer | `0` | Pagination offset |

```bash
curl "http://localhost:3000/api/match/1431908/betting_tips?limit=20&offset=0"
```

#### `GET /api/match/:matchId/h2h`
Get head-to-head history.

```bash
curl http://localhost:3000/api/match/1431908/h2h
```

#### `GET /api/match/:matchId/brackets`
Get tournament bracket for the match (knockout tournaments only).

```bash
curl http://localhost:3000/api/match/1431908/brackets
```

#### `GET /api/match/:matchId/feeds`
Get all feeds for a match.

```bash
curl http://localhost:3000/api/match/1431908/feeds
```

#### `GET /api/match/:matchId/form`
Get recent form for both teams.

```bash
curl http://localhost:3000/api/match/1431908/form
```

#### `GET /api/match/:matchId/statistics`
Get match statistics.

```bash
curl http://localhost:3000/api/match/1431908/statistics
```

---

### Predictions

#### `GET /api/predictions/:date`
Get predictions for a specific date.

| Path Param | Format | Example |
|---|---|---|
| `date` | `YYYY-MM-DD` | `2026-09-25` |

```bash
curl http://localhost:3000/api/predictions/2026-09-25
```

> ⚠️ **Note:** The underlying service method references an undefined `sport` variable. See [Known Limitations](#known-limitations).

---

#### `GET /api/prediction_posts`
Get match prediction posts (news-style articles).

| Query Param | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `50` | Number of posts |
| `offset` | integer | `0` | Pagination offset |
| `is_published` | integer | `1` | Filter by published status |
| `lang` | string | `en` | Language code |

```bash
curl "http://localhost:3000/api/prediction_posts?limit=10&offset=0"
```

---

#### `GET /api/prediction_market/`
Get predictions filtered by market.

| Query Param | Type | Default | Description |
|---|---|---|---|
| `market` | string | `full_time_result` | `full_time_result`, `over_under_25`, `btts` |
| `date` | `YYYY-MM-DD` | — | Target date |

```bash
curl "http://localhost:3000/api/prediction_market/?market=full_time_result&date=2026-09-25"
```

---

#### `GET /api/prediction_fixture/`
Get prediction for a specific fixture.

| Query Param | Type | Description |
|---|---|---|
| `homeTeamName` | string | e.g. `augsburg` |
| `awayTeamName` | string | e.g. `cologne` |
| `date` | `DD-MM-YYYY` | e.g. `27-02-2026` |
| `lang` | string | Language code (default `en`) |

```bash
curl "http://localhost:3000/api/prediction_fixture/?homeTeamName=augsburg&awayTeamName=cologne&date=27-02-2026"
```

---

### Leagues

All league endpoints take a Sporticos league ID.

#### `GET /api/league/:leagueId/header`
Get league header (name, country, logo, season).

```bash
curl http://localhost:3000/api/league/1/header
```

#### `GET /api/league/:leagueId/table`
Get league table / standings.

```bash
curl http://localhost:3000/api/league/1/table
```

#### `GET /api/league/:leagueId/lastResults`
Get last results for a league.

```bash
curl http://localhost:3000/api/league/1/lastResults
```

#### `GET /api/league/:leagueId/fixtures`
Get upcoming fixtures for a league.

| Query Param | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `10` | Number of fixtures |
| `offset` | integer | `0` | Pagination offset |

```bash
curl "http://localhost:3000/api/league/1/fixtures?limit=10&offset=0"
```

> ⚠️ **Note:** The handler does not forward `limit`/`offset` from the query string to the service.

---

### Posts & Guides

#### `GET /api/posts`
Get news/blog posts.

| Query Param | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `10` | Number of posts |
| `offset` | integer | `0` | Pagination offset |
| `isPublished` | integer | `1` | Filter by published status |
| `lang` | string | `en` | Language code |

```bash
curl "http://localhost:3000/api/posts?limit=5"
```

#### `GET /api/posts/:postId`
Get a single post by numeric ID.

```bash
curl http://localhost:3000/api/posts/12345
```

#### `GET /api/posts/:title`
Get a single post by title (slugified automatically).

The title is converted to a slug: lowercased, `€` → `eur`, decimals removed, non-alphanumerics → hyphens.

```bash
curl "http://localhost:3000/api/posts/How%20to%20Watch%20Chelsea%20vs%20Arsenal"
```

> ⚠️ **Note:** Route conflict — `GET /api/posts/:postId` and `GET /api/posts/:title` share the same path pattern. Express matches the first registered route, so `/api/posts/12345` always hits `:postId`. To fetch by title you must use a non-numeric title, but `/api/posts/anything` still matches `:postId` first. Consider prefixing one route (e.g. `/api/posts/title/:title`).

#### `GET /api/guides`
Get betting/watching guides.

| Query Param | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `50` | Number of guides |
| `offset` | integer | `0` | Pagination offset |
| `isPublished` | integer | `1` | Filter by published status |
| `lang` | string | `en` | Language code |

```bash
curl "http://localhost:3000/api/guides?limit=5"
```

---

## Error Handling

All endpoints return HTTP `500` on upstream failures with this shape:

```json
{
  "success": false,
  "error": "Failed to fetch <resource>",
  "message": "<underlying error message>"
}
```

The upstream fetch has a **10-second timeout** (`AbortController`), after which the request aborts and returns a `500`.

---

## Configuration

Defined in `SPORTICOS_API`:

```js
const SPORTICOS_API = {
  baseUrl: "https://sporticos.com/api/proxy/api",
  endpoints: {
    sport: "/soccer",
    match: "/match",
    live:  "/live",
  },
};
```

| Env Var | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port the server listens on |

---

## Known Limitations

These are issues in the current implementation that affect runtime behavior:

| # | Location | Issue |
|---|---|---|
| 1 | `getTvProviders` | Query string is malformed: `?${countryId}` should be `?country_id=${countryId}` |
| 2 | `getLiveMatches` | URL uses `/live&ids=...` — should be `?ids=...` (query separator) |
| 3 | `/api/live` handler | Hardcodes `{ ids: [] }`, ignoring `req.query.ids` |
| 4 | `getMatchPredictions` | References undefined `sport` variable; URL will throw `ReferenceError` |
| 5 | `getPredictions`, `getPosts`, `getGuides` | `lang = "en"` — `en` is undefined; should be `"en"`. `slang=${en}` is also undefined |
| 6 | `/api/prediction_posts` | Response references undefined `date` variable |
| 7 | `getFixturePrediction` | Signature takes `(matchId, params)` but handler calls it with a single object; `matchId` is `undefined` |
| 8 | `/api/posts/:postId` vs `/api/posts/:title` | Duplicate route patterns; second is unreachable |
| 9 | `getLeagueFixtures` | Uses `&?offset=` (stray `?`); handler doesn't forward query params |
| 10 | `/api/matches/` handler | Destructures `sportId` from `req.params` but route has no such param (harmless) |
| 11 | `getCompetitionsWithMatches` | Was fixed — uses `offset` instead of undefined `page` |
| 12 | `getSinglePostById` | Was fixed — stray `}` removed from URL |

---

## Example: Full Workflow

```bash
# 1. Check server health
curl http://localhost:3000/api/health

# 2. Get today's competitions & matches
curl "http://localhost:3000/api/matches/?limit=5&fromDate=2026-09-25T00:00:00Z&toDate=2026-09-25T23:59:59Z"

# 3. Get details for a match
curl http://localhost:3000/api/match/1431908/header

# 4. Get predictions for that match
curl http://localhost:3000/api/match/1431908/odds_and_predictions

# 5. Get league standings
curl http://localhost:3000/api/league/1/table

# 6. Get news posts
curl "http://localhost:3000/api/posts?limit=5"
```

---

## License

ISC (or your project's license).

## Disclaimer

This API proxies publicly available data from Sporticos. Respect Sporticos' terms of service and rate limits. Not affiliated with Sporticos.