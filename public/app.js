/**
 * Rideau Canal Dashboard - Frontend Application
 * Handles data fetching, UI updates, and chart rendering
 */

// Configuration
const API_BASE_URL = window.location.origin;
const REFRESH_INTERVAL = 30000; // 30 seconds

// Global state
let iceChart = null;
let tempChart = null;

/**
 * Initialize the dashboard
 */
async function initDashboard() {
    console.log('🚀 Initializing Rideau Canal Dashboard...');

    // Initial data fetch
    await updateDashboard();

    // Set up auto-refresh
    setInterval(updateDashboard, REFRESH_INTERVAL);

    console.log('✅ Dashboard initialized successfully');
}

/**
 * Update all dashboard data
 */
async function updateDashboard() {
    try {
        // Fetch latest data for all locations
        const latestResponse = await fetch(`${API_BASE_URL}/api/latest`);
        const latestData = await latestResponse.json();

        if (latestData.success) {
            updateLocationCards(latestData.data);
            updateLastUpdateTime();
        }

        // Fetch status
        const statusResponse = await fetch(`${API_BASE_URL}/api/status`);
        const statusData = await statusResponse.json();

        if (statusData.success) {
            updateOverallStatus(statusData.overallStatus);
        }

        // Update charts with historical data
        await updateCharts();

    } catch (error) {
        console.error('Error updating dashboard:', error);
        showError('Failed to fetch latest data. Retrying...');
    }
}

/**
 * Update location cards with latest data
 */
function formatNumber(value, decimals = 1) {
    return typeof value === 'number'
        ? value.toFixed(decimals)
        : 'N/A';
}

function updateLocationCards(locations) {
    locations.forEach(location => {
        const locationKey = getLocationKey(location.location);

        // Find elements for this location
        const iceEl = document.getElementById(`ice-${locationKey}`);
        const tempEl = document.getElementById(`temp-${locationKey}`);
        const snowEl = document.getElementById(`snow-${locationKey}`);
        const statusBadge = document.getElementById(`status-${locationKey}`);

        // Only update if all elements for the card exist
        if (iceEl && tempEl && snowEl && statusBadge) {
            // Use the actual field names from Cosmos
            iceEl.textContent = formatNumber(location.avgIceThicknessCm);
            tempEl.textContent = formatNumber(location.avgSurfaceTemperatureC);
            snowEl.textContent = formatNumber(location.maxSnowAccumulationCm);

            // Safety status (may be missing — default to 'unknown')
            const safetyStatus = location.safetyStatus ?? 'unknown';
            statusBadge.textContent = safetyStatus;
            statusBadge.className = `safety-badge ${safetyStatus.toLowerCase()}`;
        }
    });
}



/**
 * Update overall status badge
 */
function updateOverallStatus(status) {
    const statusBadge = document.getElementById('overallStatus');
    statusBadge.className = `status-badge ${status.toLowerCase()}`;
    statusBadge.innerHTML = `<span class="status-text">Canal Status: ${status}</span>`;
}

/**
 * Update last update timestamp
 */
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-CA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

/**
 * Update charts with historical data
 */
/**
 * Update charts with historical data
 */
async function updateCharts() {
    try {
        // Canonical location configuration
        const LOCATIONS = [
            {
                apiLocation: "dowslake",
                domKey: "dows",
                name: "Dow's Lake",
                color: "rgb(75, 192, 192)"
            },
            {
                apiLocation: "fifthave",
                domKey: "fifth",
                name: "Fifth Avenue",
                color: "rgb(255, 99, 132)"
            },
            {
                apiLocation: "nac",
                domKey: "nac",
                name: "NAC",
                color: "rgb(54, 162, 235)"
            }
        ];

        // Fetch historical data for all locations (using API location values)
        const historicalData = await Promise.all(
            LOCATIONS.map(async (loc) => {
                const response = await fetch(
                    `${API_BASE_URL}/api/history/${encodeURIComponent(loc.apiLocation)}?limit=12`
                );
                const json = await response.json();

                return {
                    config: loc,
                    data: Array.isArray(json.data) ? json.data : []
                };
            })
        );

        // Pick the first location that has data to build labels
        const sourceForLabels = historicalData.find(h => h.data.length > 0);

        if (!sourceForLabels) {
            console.warn('No historical data available for charts yet.');
            return;
        }

        const labels = sourceForLabels.data.map(d =>
            new Date(d.timestamp).toLocaleTimeString('en-CA', {
                hour: '2-digit',
                minute: '2-digit'
            })
        );

        // Build datasets
        const iceDatasets = historicalData.map(({ config, data }) => ({
            label: config.name,
            data: data.map(d => d.avgIceThicknessCm),
            borderColor: config.color,
            backgroundColor: `${config.color}33`,
            tension: 0.4,
            fill: false
        }));

        const tempDatasets = historicalData.map(({ config, data }) => ({
            label: config.name,
            data: data.map(d => d.avgSurfaceTemperatureC),
            borderColor: config.color,
            backgroundColor: `${config.color}33`,
            tension: 0.4,
            fill: false
        }));

        // --- Ice Thickness Chart ---
        if (iceChart) {
            iceChart.data.labels = labels;
            iceChart.data.datasets = iceDatasets;
            iceChart.update();
        } else {
            const ctx = document
                .getElementById('iceThicknessChart')
                .getContext('2d');

            iceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: iceDatasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { position: 'top' }
                    },
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Ice Thickness (cm)'
                            }
                        }
                    }
                }
            });
        }

        // --- Temperature Chart ---
        if (tempChart) {
            tempChart.data.labels = labels;
            tempChart.data.datasets = tempDatasets;
            tempChart.update();
        } else {
            const ctx = document
                .getElementById('temperatureChart')
                .getContext('2d');

            tempChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: tempDatasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { position: 'top' }
                    },
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Surface Temperature (°C)'
                            }
                        }
                    }
                }
            });
        }

    } catch (error) {
        console.error('Error updating charts:', error);
    }
}


/**
 * Convert location name to key for DOM IDs
 */
function getLocationKey(location) {
    // Handles both pretty names and direct keys from the database
    const lowerLocation = location.toLowerCase();
    const keyMap = {
        "dow's lake": "dows",
        "fifth avenue": "fifth",
        "fifthave": "fifth", // Handle "fifthave" from the database
        "nac": "nac",
        "dowslake": "dows" // Handle "dowslake" from the database
    };
    return keyMap[lowerLocation] || lowerLocation.replace(/[^a-z\s]/g, '').replace(/\s+/g, '');
}

/**
 * Show error message (you can enhance this with a toast notification)
 */
function showError(message) {
    console.error(message);
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initDashboard);