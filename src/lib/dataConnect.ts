
// src/lib/dataConnect.ts

const DATA_CONNECT_ENDPOINT = process.env.NEXT_PUBLIC_DATA_CONNECT_ENDPOINT;

if (!DATA_CONNECT_ENDPOINT) {
  console.error(
    "[dataConnect.ts] CRITICAL ERROR: Firebase Data Connect endpoint (NEXT_PUBLIC_DATA_CONNECT_ENDPOINT) is NOT SET in environment variables. " +
    "Please set this variable in your .env file (e.g., https://YOUR_PROJECT_ID.dataconnect.firebasehosting.com/api/YOUR_CONNECTOR_ID). " +
    "You MUST restart your Next.js development server after modifying the .env file."
  );
} else if (DATA_CONNECT_ENDPOINT.includes("YOUR_CONNECTOR_ID")) {
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
  if (!DATA_CONNECT_ENDPOINT || DATA_CONNECT_ENDPOINT.includes("YOUR_CONNECTOR_ID")) {
    const errorMessage = "[dataConnect.ts] executeGraphQLQuery: Firebase Data Connect endpoint is not properly configured. NEXT_PUBLIC_DATA_CONNECT_ENDPOINT is missing or contains 'YOUR_CONNECTOR_ID'. Please check your .env file and restart the server.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  console.log(`[dataConnect.ts] Executing GraphQL query to ${DATA_CONNECT_ENDPOINT}:`, { query: query.substring(0,100)+"...", variables });

  try {
    const response = await fetch(DATA_CONNECT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const resultText = await response.text();
    let result: GraphQLResponse<T>;
    try {
        result = JSON.parse(resultText);
    } catch (e: any) {
        console.error("[dataConnect.ts] Failed to parse GraphQL JSON response. Raw text:", resultText, "Parse error:", e.message);
        throw new Error(`Failed to parse GraphQL response. Server sent: ${resultText.substring(0, 200)}...`);
    }

    if (!response.ok) {
      const errorMessages = result.errors?.map(e => e.message).join(', ') || `HTTP status ${response.status}`;
      console.error('[dataConnect.ts] GraphQL request failed:', errorMessages, 'Full result:', JSON.stringify(result, null, 2));
      throw new Error(`GraphQL request failed: ${errorMessages}`);
    }

    if (result.errors) {
      const errorMessages = result.errors.map(e => e.message).join(', ');
      console.error('[dataConnect.ts] GraphQL query returned errors:', errorMessages);
      throw new Error(`GraphQL query returned errors: ${errorMessages}`);
    }

    return result.data;
  } catch (error: any) {
    console.error('[dataConnect.ts] Error during executeGraphQLQuery:', error);

    let detailedErrorMessage = `An unexpected error occurred: ${error.message}`;

    // This block specifically creates a more helpful message for the common "Failed to fetch" error.
    if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'your web app origin';
        detailedErrorMessage = `Network request failed. This is often a CORS (Cross-Origin Resource Sharing) issue.

Possible Causes & Solutions:
1.  **CORS Configuration:** Your Data Connect service must be configured to allow requests from your web app's origin ('${origin}').
    -> **Action:** Check the CORS settings for your Data Connect service in the Google Cloud / Firebase console. You may need to add this origin to the list of allowed domains.

2.  **Incorrect Endpoint URL:** The URL might be wrong.
    -> **Verify:** The current endpoint is '${DATA_CONNECT_ENDPOINT}'. Is this correct and publicly accessible?

3.  **Service Not Running:** The Data Connect service might be down or have an error.
    -> **Action:** Check the status and logs of your service in the Firebase or Google Cloud console.

Original Error: ${error.message}`;
    }
    
    console.error(`[dataConnect.ts] Detailed Error: ${detailedErrorMessage.replace(/\s+/g, ' ')}`);
    throw new Error(detailedErrorMessage);
  }
}

// Query to fetch a list of videos. Based on schema: Video { url, title, description, createdAt }
export const GET_VIDEOS_QUERY = `
  query GetVideos {
    videos {
      id
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
    htmlSnippet(id: $id) {
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
    exercise(id: $id) {
      id
      description
      code
      createdAt
    }
  }
`;
