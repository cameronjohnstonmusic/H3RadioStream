const fs = require('fs');
const path = require('path');
const ytpl = require('ytpl');
const ytdl = require('ytdl-core');
const maxApi = require('max-api');

function generateHtmlWithVideo(videoId) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Full-Screen YouTube Video</title>
    <style>
        html, body {
            margin: 0;
            height: 100%;
            background-color: black;
        }
        .video-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <div class="video-container">
        <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1" frameborder="0"
            allow="autoplay; fullscreen">
        </iframe>
    </div>
</body>
</html>
`;

    // Define the file path
    const filePath = path.join(__dirname, 'video.html');

    // Write the HTML content to a file
    fs.writeFile(filePath, htmlContent, (err) => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('HTML file created successfully:', filePath);
        }
    });
}

async function getVideoInfo(videoUrl) {
    try {
        const videoInfo = await ytdl.getInfo(videoUrl);
        const videoId = videoInfo.videoDetails.videoId;
        const videoTitle = videoInfo.videoDetails.title;
        const uploadDate = videoInfo.videoDetails.uploadDate;
        const videoLength = videoInfo.videoDetails.lengthSeconds;

        // Generate the HTML file with the video ID
        generateHtmlWithVideo(videoId);

        // Output video details via maxApi
        maxApi.outlet({
            title: videoTitle,
            uploadDate: uploadDate,
            videoUrl: videoUrl,
            videoLength: videoLength
        });
    } catch (error) {
        console.error('Error fetching video info:', error);
    }
}

function selectRandomVideo(videoUrls) {
    const selectedVideo = videoUrls[Math.floor(Math.random() * videoUrls.length)];
    const videoUrl = selectedVideo.url;
    getVideoInfo(videoUrl);
}

// Function to get video URLs from a playlist
async function getVideoUrlsFromPlaylist(playlistUrl) {
    try {
        const playlistId = extractPlaylistId(playlistUrl);

        if (!playlistId) {
            throw new Error('Invalid playlist URL');
        }

        const playlist = await ytpl(playlistId, { limit: Infinity });

        const videoUrls = playlist.items.map(item => ({
            title: item.title,
            url: `https://www.youtube.com/watch?v=${item.id}`,
        }));

        return videoUrls;
    } catch (error) {
        console.error('Error fetching playlist:', error);
        throw error;
    }
}

// Function to extract the playlist ID from a YouTube playlist URL
function extractPlaylistId(url) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("list");
}

// Example usage
let playlistUrl;
let videoUrl;
let playlistInfo;

maxApi.addHandler('open', (playlistUrlParam) => {
    playlistUrl = playlistUrlParam;
    getVideoUrlsFromPlaylist(playlistUrl)
        .then(videoUrls => {
            playlistInfo = videoUrls;
            selectRandomVideo(videoUrls);
        })
        .catch(error => {
            console.error('Error:', error);
        });
});
