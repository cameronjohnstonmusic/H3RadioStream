const fs = require('fs');
const ytdlDiscord = require('ytdl-core-discord');
const maxApi = require('max-api');

// Function to download the YouTube video
async function downloadVideo(url, outputPath) {
    try {
        const videoStream = await ytdlDiscord(url, {
            quality: 'highestvideo',
        });

        let startTime = Date.now();
        let downloaded = 0;
        let totalSize = 0;

        // Listen for response event to get the total file size, if available
        videoStream.on('response', (res) => {
            const contentLength = res.headers['content-length'];
            if (contentLength) {
                totalSize = parseInt(contentLength, 10);
                console.log(`Total size: ${totalSize} bytes`);
            } else {
                console.log('Content-Length header is missing. Progress reporting may be inaccurate.');
            }
        });

        // Listen for progress in download
        videoStream.on('data', (chunk) => {
            downloaded += chunk.length;
        });

        // Log progress every 5 seconds
        const intervalId = setInterval(() => {
            if (totalSize > 0) {
                const percent = (downloaded / totalSize) * 100;
                const downloadedMB = (downloaded / 1024 / 1024).toFixed(2);
                const totalMB = (totalSize / 1024 / 1024).toFixed(2);
                const elapsed = (Date.now() - startTime) / 1000;
                console.log(`Progress: ${percent.toFixed(2)}% (${downloadedMB} MB of ${totalMB} MB) - Elapsed: ${elapsed.toFixed(2)}s`);
            } else {
                const downloadedMB = (downloaded / 1024 / 1024).toFixed(2);
                const elapsed = (Date.now() - startTime) / 1000;
                console.log(`Downloaded: ${downloadedMB} MB - Elapsed: ${elapsed.toFixed(2)}s`);
            }
        }, 5000); // 5 seconds

        // Pipe the stream to a file
        const writeStream = fs.createWriteStream(outputPath);
        videoStream.pipe(writeStream);

        writeStream.on('finish', () => {
            clearInterval(intervalId); // Stop logging once download is complete
            console.log(`Downloaded video to ${outputPath}`);
            maxApi.outlet('download_complete', outputPath);
        });

        writeStream.on('error', (error) => {
            clearInterval(intervalId); // Stop logging on error
            console.error('Error during video stream:', error);
            maxApi.outlet('error', `Stream Error: ${error.message}`);
        });
    } catch (error) {
        console.error('General Error:', error);
        maxApi.outlet('error', `General Error: ${error.message}`);
    }
}

// Max API handler to start the download
maxApi.addHandler('download', (url, outputPath) => {
    try {
        console.log(`Starting download from ${url}...`);
        downloadVideo(url, outputPath);
    } catch (error) {
        console.error('Error in download handler:', error);
        maxApi.outlet('error', `Handler Error: ${error.message}`);
    }
});

// Example usage: replace 'videoUrl' and 'outputPath' with your own values
const videoUrl = 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID'; // Replace with your video URL
const outputPath = './downloaded_video.mp4'; // Replace with your desired output file path

// Uncomment to test the download manually
// downloadVideo(videoUrl, outputPath);
