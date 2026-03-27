import axios from 'axios';

async function testHeadful() {
    const API_URL = 'http://localhost:5000/api/tools';
    // Using the specific URL the user provided
    const targetUrl = 'https://saludvida24.online/8cubzg3sbv/?tok=zpd5anrh2d&q24wi6x6=s68s1tbd&xid=mbw5jw34&utm_source=FB';

    console.log(`\nLaunching Headful Crawler for ${targetUrl}...`);
    console.log('Use the opened browser window to interact if necessary!');

    try {
        const mapResult = await axios.post(`${API_URL}/map`, {
            url: targetUrl,
            headful: true
        }, { timeout: 120000 }); // 2 minutes timeout for manual interaction
        console.log('Funnel Map:', JSON.stringify(mapResult.data, null, 2));
    } catch (error: any) {
        console.error('Headful test failed:', error.response?.data || error.message);
    }
}

testHeadful();
