const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const progressBarInner = document.getElementById('progress-bar-inner');
let filesArray = [];

uploadArea.addEventListener('click', () => {
    fileInput.click();
});

uploadArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (event) => {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(event.dataTransfer.files);
});

fileInput.addEventListener('change', (event) => {
    handleFiles(event.target.files);
});

function handleFiles(files) {
    for (const file of files) {
        if (file.name.endsWith('.srt')) {
            filesArray.push(file);
            const li = document.createElement('li');
            li.textContent = file.name;
            const removeBtn = document.createElement('span');
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.className = 'remove-btn';
            removeBtn.addEventListener('click', () => {
                filesArray = filesArray.filter(f => f !== file);
                li.remove();
            });
            li.appendChild(removeBtn);
            fileList.appendChild(li);
        } else {
            alert('Only .srt files are allowed!');
        }
    }
}

// Helper functions for SRT processing (moved/adapted from LAP.js or new)
function pad(num, size = 2) {
    let s = String(num);
    while (s.length < size) s = `0${s}`;
    return s;
}

function formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = milliseconds % 1000;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(ms, 3)}`;
}

function timeToMs(h, m, s, msStr) {
    return parseInt(h, 10) * 3600000 +
           parseInt(m, 10) * 60000 +
           parseInt(s, 10) * 1000 +
           parseInt(msStr, 10);
}

function parseSrt(srtContent) {
    const cues = [];
    // Normalize line endings (to \n) and remove Byte Order Mark (BOM) if present
    const normalizedContent = srtContent.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '');
    // Split into blocks based on blank lines
    const blocks = normalizedContent.trim().split(/\n\s*\n/);

    for (const block of blocks) {
        const lines = block.trim().split('\n');
        if (lines.length === 0) continue;

        let lineIndex = 0;
        // Optional: Skip cue number if present (e.g., "1")
        if (/^\d+$/.test(lines[lineIndex])) {
            lineIndex++;
        }

        if (lineIndex >= lines.length) continue; // Not enough lines for a timecode

        const timecodeLine = lines[lineIndex];
        // Regex to match "HH:MM:SS,mmm --> HH:MM:SS,mmm" or "H:MM:SS.mmm --> H:MM:SS.mmm"
        // Allows 1 or 2 digits for hours, and comma or dot for milliseconds separator
        const timeMatch = timecodeLine.match(
            /(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})/
        );

        if (timeMatch) {
            lineIndex++; // Move to text lines
            const start = timeToMs(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
            const end = timeToMs(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
            const text = lines.slice(lineIndex).join('\n').trim();

            // Add cue if text is present.
            // The modification logic will handle cases where end <= start.
            if (text) {
                cues.push({ type: 'cue', data: { start, end, text } });
            }
        }
    }
    return cues;
}


document.getElementById('export-btn').addEventListener('click', async () => {
    // Call the client-side processing function directly
    LAP();
});

// Client-side SRT processing function (replaces server-side logic)
async function LAP() {
    const secondsValue = document.getElementById('seconds-select').value;
    const secondsToAdjust = parseFloat(secondsValue);

    if (isNaN(secondsToAdjust)) {
        alert('Invalid value for seconds. Please enter a number.');
        progressBarInner.style.width = '0';
        return;
    }

    if (filesArray.length === 0) {
        alert('No .srt files selected.');
        progressBarInner.style.width = '0';
        return;
    }

    // Ensure JSZip is available (it should be loaded via a <script> tag in HTML)
    if (typeof JSZip === 'undefined') {
        alert('JSZip library is not loaded. Please ensure it is included in the page.');
        console.error('JSZip not found. Make sure to include it, e.g., <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>');
        progressBarInner.style.width = '0';
        return;
    }
    const zip = new JSZip();

    progressBarInner.style.width = '10%'; // Initial progress

    try {
        let filesProcessedCount = 0;
        const totalFiles = filesArray.length;

        for (const file of filesArray) {
            const content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsText(file); // Read file content as text
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });

            console.log(`Processing file: ${file.name}`);
            // console.log(`Original content (first 100 chars): ${content.substring(0, 100)}...`);

            const parsedCues = parseSrt(content); // Use client-side SRT parser
            // console.log(`Parsed cues (first 2): ${JSON.stringify(parsedCues.slice(0,2))}...`);

            // Modify the subtitles (logic from original LAP.js)
            const modifiedCues = parsedCues.map((cue, index, arr) => {
                if (cue.type === 'cue' && cue.data) { // Ensure it's a cue object
                    const originalEnd = cue.data.end;
                    let newEnd = originalEnd + secondsToAdjust * 1000;

                    // Check for overlap with the next cue's start time
                    if (index < arr.length - 1 && arr[index + 1].type === 'cue' && arr[index + 1].data) {
                        const nextCueStart = arr[index + 1].data.start;
                        if (newEnd > nextCueStart) {
                            newEnd = nextCueStart; // Adjust end time to avoid overlap
                        }
                    }
                    
                    // Ensure end time is not before start time after adjustment
                    if (newEnd < cue.data.start) {
                        cue.data.end = cue.data.start + 1; // Set to minimal duration (e.g., 1ms more than start)
                    } else {
                        cue.data.end = newEnd;
                    }
                }
                return cue;
            });

            // Format the modified subtitles back to SRT string
            let modifiedSrtContent = '';
            let cueNumber = 1;
            for (const cue of modifiedCues) {
                if (cue.type === 'cue' && cue.data) {
                     // Final check: ensure start is not greater than or equal to end
                    if (cue.data.start >= cue.data.end) {
                         cue.data.end = cue.data.start + 1; // Ensure minimum 1ms duration
                    }
                    const startFormatted = formatTime(cue.data.start);
                    const endFormatted = formatTime(cue.data.end);
                    modifiedSrtContent += `${cueNumber}\n${startFormatted} --> ${endFormatted}\n${cue.data.text}\n\n`;
                    cueNumber++;
                }
            }
            
            // console.log(`Modified content (first 100 chars): ${modifiedSrtContent.substring(0, 100)}...`);
            zip.file(file.name, modifiedSrtContent); // Add modified file to zip

            filesProcessedCount++;
            // Update progress: 10% (initial) + 80% (for processing files) = up to 90% here
            progressBarInner.style.width = `${10 + (filesProcessedCount / totalFiles) * 80}%`;
        }

        // Generate zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        progressBarInner.style.width = '100%'; // All processing complete

        // Trigger download
        const downloadUrl = window.URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = 'modified_srt_files.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a); // Clean up the anchor element
        window.URL.revokeObjectURL(downloadUrl); // Release the object URL

        setTimeout(() => {
            progressBarInner.style.width = '0'; // Reset progress bar after a delay
        }, 1000);

    } catch (error) {
        console.error('Error during SRT processing:', error);
        progressBarInner.style.width = '0'; // Reset progress bar on error
        alert('An error occurred while processing the files. Please check the console for details.');
    }
}

// Sidebar and Search Functionality (Keep as is)
window.addEventListener('DOMContentLoaded', function () {
    fetch('/sidebar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar-container').innerHTML = data;
            const sidebar = document.getElementById('sidebar');
            const sidebarOverlay = document.getElementById('sidebarOverlay');
            const menuButton = document.getElementById('menuButton');

            if (!sidebar || !sidebarOverlay || !menuButton) {
                console.error('Sidebar elements not found.');
                return;
            }

            menuButton.addEventListener('click', function () {
                sidebar.classList.toggle('open');
                sidebarOverlay.classList.toggle('open');
            });

            sidebarOverlay.addEventListener('click', function () {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('open');
            });
        })
        .catch(error => {
            console.error('Failed to load sidebar:', error);
        });
});

function handleSearch(event) {
    event.preventDefault();
    const searchTerm = document.getElementById('searchInput').value.trim();
    const baseUrl = '/index.html'; 

    if (searchTerm) {
        window.location.href = `${baseUrl}?search=${encodeURIComponent(searchTerm)}`;
    } else {
        window.location.href = baseUrl;
    }
}

window.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');

    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        if (searchTerm) {
            document.getElementById('searchInput').value = searchTerm;
            filterSections(searchTerm.toLowerCase());
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) { // Ensure searchInput exists before adding listener
            searchInput.addEventListener('input', function(e) {
                filterSections(e.target.value.toLowerCase());
            });
        } else {
            console.warn('#searchInput element not found on this page for search initialization.');
        }
    }

    function filterSections(term) {
        const sections = document.querySelectorAll('section:not(.tools-section)');
        const cards = document.querySelectorAll('.card');

        sections.forEach(section => {
            section.classList.toggle('hidden-section', term !== '');
        });

        cards.forEach(card => {
            const titleElement = card.querySelector('.card-title');
            const descriptionElement = card.querySelector('.card-description');
            if (titleElement && descriptionElement) {
                const title = titleElement.textContent.toLowerCase();
                const description = descriptionElement.textContent.toLowerCase();
                card.style.display = (title.includes(term) || description.includes(term)) 
                    ? 'flex' 
                    : 'none';
            }
        });

        const toolsSection = document.querySelector('.tools-section');
        if (toolsSection) {
            toolsSection.style.display = 'block';
        }
    }
});