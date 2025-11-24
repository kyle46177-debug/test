
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,x-sandbox-secret',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'X-Proxy-Version': 'v4-gemini-pro',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const requiredSecret = process.env.SANDBOX_SECRET;
  const providedSecret = event.headers['x-sandbox-secret'];
  if (requiredSecret && requiredSecret !== providedSecret) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing GEMINI_API_KEY' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  // Models to try in order - prioritize gemini-pro
  const modelVariants = ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
  let lastError = null;

  for (const model of modelVariants) {
    const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    console.log(`Trying model: ${model} at ${upstreamUrl.replace(apiKey, 'HIDDEN')}`);

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (upstreamResponse.ok) {
        const responseBody = await upstreamResponse.text();
        return {
          statusCode: upstreamResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: responseBody,
        };
      }

      lastError = {
        status: upstreamResponse.status,
        body: await upstreamResponse.text(),
        model: model
      };

      console.log(`Model ${model} failed with ${upstreamResponse.status}: ${lastError.body}`);

      // 404 means model not found, try next. 403 means permission denied.
      if (upstreamResponse.status !== 404 && upstreamResponse.status !== 403) {
         // break; 
      }
    } catch (error) {
      console.error(`Fetch failed for ${model}:`, error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: `Upstream request failed (v4) for ${model}`, details: error.message }),
      };
    }
  }

  if (lastError) {
    return {
      statusCode: lastError.status,
      headers: corsHeaders,
      body: JSON.stringify({
        error: `All models failed. Last error from ${lastError.model}: ${lastError.body}` 
      }),
    };
  }

  return {
    statusCode: 500,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'No Gemini endpoint succeeded (v4).' }),
  };
};
