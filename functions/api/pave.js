// /functions/api/pave.js
// Cloudflare Pages Function — proxies requests to the JobTread Pave API
// Browser sends { jobNumber }, worker builds the full Pave query with grantKey.

export async function onRequestPost(context) {
  // Grant key — lives server-side only, never sent to browser
  const GRANT_KEY = '22TKjmk2KitJn9Jk3F2PsCzpUSd2kjT6aY';
  const ORG_ID = '22Nark457drX';

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

    // Build the Pave query — grantKey at top level, query structure alongside it
    // This is Greg's exact query — only the job number is injected
    const paveBody = {
      grantKey: GRANT_KEY,
      organization: {
        $: { id: ORG_ID },
        id: {},
        jobs: {
          $: {
            where: {
              and: [
                ["number", cleanJobNumber]
              ]
            },
            size: 1
          },
          nodes: {
            id: {},
            number: {},
            name: {},
            documents: {
              $: {
                where: {
                  and: [
                    ["type", "customerOrder"],
                    ["name", "Contract"],
                    ["status", "approved"]
                  ]
                },
                size: 1
              },
              nodes: {
                id: {},
                toName: {},
                toAddress: {},
                toPhoneNumber: {},
                toEmailAddress: {},
                jobLocationAddress: {},
                description: {},
                costItems: {
                  $: {
                    sortBy: [
                      { field: ["position"], order: "asc" }
                    ],
                    size: 100
                  },
                  nodes: {
                    id: {},
                    name: {},
                    description: {},
                    quantity: {},
                    unitPrice: {},
                    position: {}
                  },
                  nextPage: {}
                }
              },
              nextPage: {}
            }
          },
          nextPage: {}
        }
      }
    };

    // Send to JobTread Pave API
    const jtResponse = await fetch('https://api.jobtread.com/pave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paveBody)
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
