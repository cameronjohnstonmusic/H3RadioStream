const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const maxApi = require('max-api');

// Function to extract the playlist ID from the URL
function extractPlaylistId(playlistUrl) {
    const url = new URL(playlistUrl);
    const playlistId = url.searchParams.get('list');
    return playlistId;
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

// Function to get video information and generate URLs for 1080p and combined audio/video
async function getVideoInfo(url) {
    try {
        const info = await ytdl.getInfo(url);

        // Find 1080p video format
        const videoFormat = ytdl.chooseFormat(info.formats, {
            quality: '137', // 1080p video quality
            filter: format => format.hasVideo && format.container === 'mp4'
        });

        // Find video format with embedded audio
        const combinedFormat = ytdl.chooseFormat(info.formats, {
            filter: format => format.hasVideo && format.hasAudio && format.container === 'mp4'
        });

        if (videoFormat) {
            maxApi.outlet('video_url', videoFormat.url);
            console.log('1080p Video URL:', videoFormat.url);
        } else {
            console.log('No 1080p video format found.');
        }

        if (combinedFormat) {
            maxApi.outlet('audio_url', combinedFormat.url);
            console.log('Video with Embedded Audio URL:', combinedFormat.url);
        } else {
            console.log('No combined audio/video format found.');
        }
    } catch (error) {
        console.error('Error fetching video info:', error);
    }
}

// Function to select a random video from the playlist
function selectRandomVideo(videoUrls) {
    const selectedVideo = videoUrls[Math.floor(Math.random() * videoUrls.length)];
    videoUrl = selectedVideo.url;
    getVideoInfo(videoUrl);
}

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

maxApi.addHandler("bang", () => {
    if (playlistInfo) {
        selectRandomVideo(playlistInfo);
    } else {
        console.log('No playlist info available.');
    }
});
