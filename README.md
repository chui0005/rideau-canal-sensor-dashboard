# Web Dashboard Repository README.md

## Overview
The Rideau Canal Sensor Dashboard is a web-based application that visualizes environmental sensor data collected along the Rideau Canal. The dashboard displays near real-time aggregated telemetry such as ice thickness, surface temperature, external temperature, snow accumulation, and safety indicators for monitoring winter canal conditions.

The application is designed to consume processed sensor data and present it through a clean, user-friendly web interface suitable for operational monitoring or public-facing informational use.

### Dashboard Features
  - Near real-time sensor data visualization
  - Aggregate metrics per sensor/location
  - Historical trend charts (time-windowed data)
  - Safety status indicators based on ice thickness thresholds
  - REST API for data access
  - Cloud-ready deployment (Azure App Service)

### Technologies Used
  - Node.js – runtime environment
  - Express.js – backend web framework
  - JavaScript / HTML / CSS – frontend
  - Azure Cosmos DB (SQL API) – data storage (read-only consumption)
  - Azure App Service – hosting
  - Azure IoT Hub + Stream Analytics – upstream data pipeline (out of scope for this repo)
  - Charting library (e.g., Chart.js) – data visualization

## Prerequisites
Ensure the following are installed before running the project locally:
  - Node.js v18+
  - npm v9+
  - Azure Cosmos DB account (if querying live data)
  - Azure App Service (for deployment)
  - Git

## Installation
### Clone repo 
- git clone https://github.com/chui0005/rideau-canal-sensor-dashboard.git
- cd rideau-canal-sensor-dashboard

### Install dependencies:
  - npm install

### Start the application locally:
  - npm start

### Open a browser and navigate to:
- http://localhost:3000



## Configuration
Create a .env file (for local development):
```
PORT=3000
COSMOS_ENDPOINT=https://<your-cosmos-account>.documents.azure.com:443/
COSMOS_KEY=<your-primary-key>
COSMOS_DATABASE=rideaucanaldb
COSMOS_CONTAINER=rideaucanaldata
```


## API Endpoints
  - **'/api/latest'** : Get latest readings for all locations
  - **'/api/history/:location'**:  Get historical data for a specific location
  - **'/api/status'**: Get overall system status
  - **'/api/all'**:  Get all data (for debugging)


## Deployment to Azure App Service

1) Create an Azure App Service:
  - Runtime stack: Node 18 LTS
  - OS: Linux
2) Set application settings (Environment Variables):
  - Add all values from .env
  - Mark secrets as hidden

3) Deploy using one of the following:
  - GitHub Actions
  - Azure CLI
  - Zip deployment


## Dashboard Features
### Real-Time Updates
  - Periodic fetch from backend API
  - Reflects latest aggregated sensor windows

### Charts and Visualizations
  - Line charts for temperature and ice thickness
  - Time-window based historical trends
  - Clear unit labeling (°C, cm)

### Safety Status Indicators
  - Visual indicators based on ice thickness thresholds


## AI Tools Used
- **Tool:** ChatGPT
- **Purpose and extent:** 
  - Make changes to server code to pull in data from cosmos.
  - Change CSS
  - Create API Documentation
  
## Troubleshooting

## Common issues and fixes