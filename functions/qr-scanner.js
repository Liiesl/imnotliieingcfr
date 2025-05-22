// Path: functions/qr-scanner.js

export async function onRequest(context) {
  const { request } = context;

  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const fileUrl = url.searchParams.get('fileurl');

      if (!fileUrl) {
        return new Response(JSON.stringify({ error: 'No fileurl provided for GET request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const apiUrl = new URL('https://api.qrserver.com/v1/read-qr-code/');
      apiUrl.searchParams.append('fileurl', fileUrl);

      const apiResponse = await fetch(apiUrl.toString());
      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error("API Error (GET):", apiResponse.status, errorText);
        return new Response(JSON.stringify({ error: `Failed to scan QR code from URL: ${errorText}` }), {
          status: apiResponse.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const data = await apiResponse.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });

    } else if (request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const fileData = body.file; // Base64-encoded file data
      const fileUrlParam = body.fileurl; // URL of the QR code image (can also be sent in POST body)

      if (fileUrlParam) { // Prioritize fileurl if sent in POST body
        const apiUrl = new URL('https://api.qrserver.com/v1/read-qr-code/');
        apiUrl.searchParams.append('fileurl', fileUrlParam);
        
        const apiResponse = await fetch(apiUrl.toString()); // api.qrserver.com read-qr-code can take fileurl as GET param
         if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error("API Error (POST with fileurl):", apiResponse.status, errorText);
          return new Response(JSON.stringify({ error: `Failed to scan QR code from URL (POST): ${errorText}` }), {
            status: apiResponse.status,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const data = await apiResponse.json();
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      if (!fileData) {
        return new Response(JSON.stringify({ error: 'No file data or fileurl provided in POST request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Handle base64 file data
      const parts = fileData.split(';base64,');
      if (parts.length !== 2) {
        return new Response(JSON.stringify({ error: 'Invalid base64 file data format' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
      }
      const mimeType = parts[0].split(':')[1];
      const base64EncodedData = parts[1];
      
      // Decode base64 to Uint8Array
      const binaryString = atob(base64EncodedData);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });

      const formData = new FormData();
      formData.append('file', blob, 'qr-code-image'); // filename can be generic

      const apiResponse = await fetch('https://api.qrserver.com/v1/read-qr-code/', {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error("API Error (POST with file data):", apiResponse.status, errorText);
        return new Response(JSON.stringify({ error: `Failed to scan QR code from file data: ${errorText}` }), {
          status: apiResponse.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const data = await apiResponse.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: `Method ${request.method} Not Allowed` }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error("Server Error:", error);
    return new Response(JSON.stringify({ error: 'Failed to process QR code request: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}