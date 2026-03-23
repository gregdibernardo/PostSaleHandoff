// /functions/api/pave.js
// Cloudflare Pages Function — proxies requests to the JobTread Query API
// Browser sends { jobNumber }, worker builds the full query and sends to JobTread.

export async function onRequestPost(context) {
  // Hardcoded grant key — lives server-side only, never sent to browser
  const GRANT_KEY = '22TKjmk2KitJn9Jk3F2PsCzpUSd2kjT6aY';

  try {
    const { jobNumber } = await context.request.json();

    if (!jobNumber) {
      return new Response(JSON.stringify({ error: 'jobNumber is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Sanitize input
    const cleanJobNumber = String(jobNumber).replace(/[^a-zA-Z0-9-]/g, '');

    // Build the EXACT Pave query Greg had built externally — as a YAML-like string
    // DO NOT MODIFY THIS QUERY — only the job number injection changes
    const query = `
organization:
  $:
    id: 22Nark457drX
  id: {}

  jobs:
    $:
      where:
        and:
          - - number
            - ${cleanJobNumber}
      size: 1

    nodes:
      id: {}
      number: {}
      name: {}

      documents:
        $:
          where:
            and:
              - - type
                - customerOrder
              - - name
                - Contract
              - - status
                - approved
          size: 1

        nodes:
          id: {}
          toName: {}
          toAddress: {}
          toPhoneNumber: {}
          toEmailAddress: {}
          jobLocationAddress: {}
          description: {}

          costItems:
            $:
              sortBy:
                - field:
                    - position
                  order: asc
              size: 100

            nodes:
              id: {}
              name: {}
              description: {}
              quantity: {}
              unitPrice: {}
              position: {}

            nextPage: {}

        nextPage: {}
`;

    // Send to JobTread
    const jtResponse = await fetch('https://api.jobtread.com/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Grant-Key': GRANT_KEY
      },
      body: JSON.stringify({ query })
    });

    const jtData = await jtResponse.text();

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
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
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
