# Rideau Canal Monitoring Dashboard – API Documentation

## Overview

This document describes the REST API for the **Rideau Canal Ice Monitoring Dashboard**.  
The API provides access to real-time and historical ice condition data collected from sensors along the Rideau Canal.

The backend:
- Retrieves aggregated telemetry from **Azure Cosmos DB**
- Computes **safety status** based on ice thickness
- Serves data to a web dashboard hosted on **Azure App Service**

All responses are JSON.

---

## Base URL

### Local Development
http://localhost:3000

### Production 
https://rideau-canal-dashbaord-c9asargmgwfuehcr.canadacentral-01.azurewebsites.net/

## Endpoints

## `/api/latest`

### Description
Returns the **latest aggregated reading** for each monitored location, including a computed safety status.

### Locations Returned
- `dowslake`
- `fifthave`
- `nac`

### Request
`GET /api/latest`


### Response
```json
{
  "success": true,
  "timestamp": "2025-11-29T22:15:30.123Z",
  "data": [
    {
      "id": "dowslake-202511292215",
      "location": "dowslake",
      "timestamp": "2025-11-29T22:15:00Z",
      "avgIceThicknessCm": 42.3,
      "avgSurfaceTemperatureC": -6.5,
      "maxSnowAccumulationCm": 18.1,
      "eventCount": 12,
      "safetyStatus": "Safe"
    }
  ]
}
```

## `/api/history/:location`
### Description
Returns historical aggregated readings for a single location, ordered from oldest to newest.
### Parameter
- location: dowslake, fifthave, nac

### Query Parameters
- limit: Number of records to return, Default = 12

### Request
`GET /api/history/dowslake?limit=12`


### Response
```json
{
  "success": true,
  "location": "dowslake",
  "data": [
    {
      "timestamp": "2025-11-29T21:25:00Z",
      "avgIceThicknessCm": 38.2,
      "avgSurfaceTemperatureC": -5.9,
      "maxSnowAccumulationCm": 17.4,
      "eventCount": 10
    },
    {
      "timestamp": "2025-11-29T21:30:00Z",
      "avgIceThicknessCm": 39.6,
      "avgSurfaceTemperatureC": -6.1,
      "maxSnowAccumulationCm": 18.1,
      "eventCount": 11
    }
  ]
}

```

## `/api/status`
### Description
Returns the overall system safety status and individual location statuses.

### Request
`GET /api/status`


### Response
```json
{
  "success": true,
  "overallStatus": "Caution",
  "locations": [
    {
      "location": "dowslake",
      "safetyStatus": "Safe",
      "timestamp": "2025-11-29T22:15:00Z"
    },
    {
      "location": "fifthave",
      "safetyStatus": "Unsafe",
      "timestamp": "2025-11-29T22:15:00Z"
    },
    {
      "location": "nac",
      "safetyStatus": "Caution",
      "timestamp": "2025-11-29T22:15:00Z"
    }
  ]
}

```

## `/api/all`
### Description
Returns all records from the Cosmos DB container. For debugging.
### Request
`GET /api/all`


### Response
```json
{
  "success": true,
  "count": 240,
  "data": [ ... ]
}


```

## `/health`
### Description
Health check endpoint for monitoring and deployments.
### Request
`GET /health`


### Response
```json
{
  "status": "healthy",
  "timestamp": "2025-11-29T22:16:10.551Z",
  "cosmosdb": {
    "endpoint": "configured",
    "database": "RideauCanalDB",
    "container": "SensorAggregations"
  }
}

```