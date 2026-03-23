// /functions/api/pave.js
// Cloudflare Pages Function — proxies requests to the JobTread Pave API
// This runs server-side on Cloudflare's edge, so there are no CORS issues.

export async function onRequestPost(context) {
  const PAVE_ENDPOINT = 'https://api.jobtread.com/pave';
  const GRANT_KEY = '22TKjmk2KitJn9Jk3F2PsCzpUSd2kjT6aY';

  try {
    // Read the incoming request body (the raw query from the browser)
    const bodyText = await context.request.text();
    const rawQuery = JSON.parse(bodyText);

    // Wrap in the Pave envelope with grantKey per JobTread's spec:
    // { query: { $: { grantKey: "..." }, ...theActualQuery } }
    const pavePayload = {
      query: {
        $: {
          grantKey: GRANT_KEY
        },
        ...rawQuery
      }
    };

    // Forward the request to JobTread's Pave API
    const jtResponse = await fetch(PAVE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pavePayload)
    });

    // Get the response from JobTread
    const jtData = await jtResponse.text();

    // Return it to the browser with CORS headers
    return new Response(jtData, {
      status: jtResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
