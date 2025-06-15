
// src/lib/dataConnect.ts

const DATA_CONNECT_ENDPOINT = process.env.NEXT_PUBLIC_DATA_CONNECT_ENDPOINT;

if (!DATA_CONNECT_ENDPOINT) {
  console.error(
    "[dataConnect.ts] CRITICAL ERROR: Firebase Data Connect endpoint (NEXT_PUBLIC_DATA_CONNECT_ENDPOINT) is NOT SET in environment variables. " +
    "Please set this variable in your .env file (e.g., https://YOUR_PROJECT_ID.dataconnect.firebasehosting.com/api/YOUR_CONNECTOR_ID). " +
    "You MUST restart your Next.js development server after modifying the .env file."
  );
} else if (DATA_CONNECT_ENDPOINT.includes("YOUR_CONNECTOR_ID") || DATA_CONNECT_ENDPOINT.includes("your-connector-id")) {
  console.warn(
    `[dataConnect.ts] WARNING: Firebase Data Connect endpoint (NEXT_PUBLIC_DATA_CONNECT_ENDPOINT) appears to use a placeholder 'YOUR_CONNECTOR_ID'. Current value: "${DATA_CONNECT_ENDPOINT}". Please replace it with your actual connector ID. You MUST restart your Next.js development server after modifying the .env file.`
  );
} else {
  console.log("[dataConnect.ts] Firebase Data Connect endpoint configured:", DATA_CONNECT_ENDPOINT);
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; locations?: Array<{ line: number; column: number }>; path?: string[] }>;
}

export async function executeGraphQLQuery<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>['data']> {
  if (!DATA_CONNECT_ENDPOINT || DATA_CONNECT_ENDPOINT.includes("YOUR_CONNECTOR_ID") || DATA_CONNECT_ENDPOINT.includes("your-connector-id")) {
    const errorMessage = "[dataConnect.ts] executeGraphQLQuery: Firebase Data Connect endpoint is not properly configured. NEXT_PUBLIC_DATA_CONNECT_ENDPOINT is missing, invalid, or contains 'YOUR_CONNECTOR_ID'. Please check your .env file and restart the server. Cannot make GraphQL requests.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  console.log(`[dataConnect.ts] Executing GraphQL query to ${DATA_CONNECT_ENDPOINT}:`, { query: query.substring(0,100)+"...", variables }); // Log truncated query

  try {
    const response = await fetch(DATA_CONNECT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization header if your Data Connect endpoint requires it (e.g., Firebase Auth ID token)
        // 'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    console.log("[dataConnect.ts] GraphQL response status:", response.status, response.statusText);

    const resultText = await response.text(); 
    let result: GraphQLResponse<T>;
    try {
        result = JSON.parse(resultText);
    } catch (e: any) {
        console.error("[dataConnect.ts] Failed to parse GraphQL JSON response. Raw text:", resultText, "Parse error:", e.message);
        throw new Error(`[dataConnect.ts] Failed to parse GraphQL JSON response. Server sent: ${resultText.substring(0, 200)}...`);
    }

    if (!response.ok) {
      console.error('[dataConnect.ts] GraphQL query failed (HTTP not ok):', result.errors || response.statusText, 'Status:', response.status, 'Full result:', JSON.stringify(result, null, 2));
      const errorMessages = result.errors?.map(e => e.message).join(', ') || response.statusText;
      throw new Error(`[dataConnect.ts] GraphQL request failed with HTTP status ${response.status}: ${errorMessages}`);
    }

    if (result.errors) {
      console.error('[dataConnect.ts] GraphQL query returned errors:', result.errors);
      const errorMessages = result.errors.map(e => e.message).join(', ');
      throw new Error(`[dataConnect.ts] GraphQL query returned errors: ${errorMessages}`);
    }

    return result.data;
  } catch (error: any) {
    console.error('[dataConnect.ts] Error executing GraphQL query (fetch failed or other error):', error);
    let detailedErrorMessage = `[dataConnect.ts] An unexpected error occurred while trying to execute the GraphQL query: ${error.message}`;
    
    if (error.message && (error.message.toLowerCase().includes('failed to fetch') || error.message.toLowerCase().includes('networkerror'))) {
        detailedErrorMessage = `[dataConnect.ts] "Failed to fetch" from endpoint: ${DATA_CONNECT_ENDPOINT}. Possible causes:
1. Incorrect NEXT_PUBLIC_DATA_CONNECT_ENDPOINT URL in .env (ensure it includes your Connector ID and is reachable).
2. CORS (Cross-Origin Resource Sharing) issues: The Data Connect endpoint might not be configured to allow requests from your Next.js app's origin (e.g., http://localhost:9002). Check your Data Connect service's CORS settings.
3. Network connectivity problems (e.g., no internet, firewall blocking the request).
4. The Data Connect service/server might be down or not responding.
Original error: ${error.message}`;
    }
    
    throw new Error(detailedErrorMessage);
  }
}

// Query to fetch a list of videos. Based on schema: Video { url, title, description, createdAt }
export const GET_VIDEOS_QUERY = `
  query GetVideos {
    videos { # Assuming 'videos' is the query field for a list of Video types
      id # Data Connect usually adds an 'id' if not explicitly defined as primary key in schema
      url
      title
      description
      createdAt
    }
  }
`;

// Query to fetch an HTMLSnippet by ID. Based on schema: HTMLSnippet { code, description, createdAt }
export const GET_HTML_SNIPPET_QUERY = `
  query GetHTMLSnippet($id: ID!) {
    htmlSnippet(id: $id) { # Adjust 'htmlSnippet' and 'id' field name if your connector's query field is different
      id
      code
      description
      createdAt
    }
  }
`;

// Query to fetch an Exercise by ID. Based on schema: Exercise { description, code, createdAt }
export const GET_EXERCISE_QUERY = `
  query GetExercise($id: ID!) {
    exercise(id: $id) { # Adjust 'exercise' and 'id' field name if your connector's query field is different
      id
      description
      code
      createdAt
    }
  }
`;
