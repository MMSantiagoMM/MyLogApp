
// src/lib/dataConnect.ts

const DATA_CONNECT_ENDPOINT = process.env.NEXT_PUBLIC_DATA_CONNECT_ENDPOINT;

if (!DATA_CONNECT_ENDPOINT) {
  console.error(
    "[dataConnect.ts] CRITICAL ERROR: Firebase Data Connect endpoint (NEXT_PUBLIC_DATA_CONNECT_ENDPOINT) is NOT SET. " +
    "Please set this variable in your .env file (e.g., https://your-project-id.dataconnect.firebasehosting.com/api/your-connector-id). " +
    "You MUST restart your Next.js development server after modifying the .env file."
  );
} else if (DATA_CONNECT_ENDPOINT.includes("YOUR_CONNECTOR_ID") || DATA_CONNECT_ENDPOINT.includes("your-connector-id")) {
  console.warn(
    "[dataConnect.ts] WARNING: Firebase Data Connect endpoint (NEXT_PUBLIC_DATA_CONNECT_ENDPOINT) appears to use a placeholder 'YOUR_CONNECTOR_ID'. " +
    `Current value: "${DATA_CONNECT_ENDPOINT}". Please replace it with your actual connector ID. ` +
    "You MUST restart your Next.js development server after modifying the .env file."
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
    const errorMessage = "[dataConnect.ts] executeGraphQLQuery: Firebase Data Connect endpoint is not properly configured. See server logs/console for details. Cannot make GraphQL requests.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

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

    const result = await response.json() as GraphQLResponse<T>;

    if (!response.ok) {
      console.error('[dataConnect.ts] GraphQL query failed:', result.errors || response.statusText, 'Status:', response.status);
      const errorMessages = result.errors?.map(e => e.message).join(', ') || response.statusText;
      throw new Error(`[dataConnect.ts] GraphQL request failed: ${errorMessages}`);
    }

    if (result.errors) {
      console.error('[dataConnect.ts] GraphQL errors:', result.errors);
      const errorMessages = result.errors.map(e => e.message).join(', ');
      throw new Error(`[dataConnect.ts] GraphQL query returned errors: ${errorMessages}`);
    }

    return result.data;
  } catch (error) {
    console.error('[dataConnect.ts] Error executing GraphQL query:', error);
    throw error; // Re-throw to be caught by the caller
  }
}

// Query to fetch a list of videos
export const GET_VIDEOS_QUERY = `
  query GetVideos {
    videos { # Assuming 'videos' is the query field for a list of Video types from your schema
      id
      name
      youtubeUrl
      videoId
      createdAt # Or addedDate, depending on your schema
      updatedAt
    }
  }
`;

// Query to fetch an HTMLSnippet by ID (e.g., for the HTML Presenter)
export const GET_HTML_SNIPPET_QUERY = `
  query GetHTMLSnippet($id: ID!) {
    htmlSnippet(id: $id) { # Assuming 'htmlSnippet' is the query field from your schema
      id
      title
      htmlContent # Field containing the HTML code
      createdAt
      updatedAt
    }
  }
`;

// Query to fetch an Exercise by ID (e.g., for the Exercises page)
export const GET_EXERCISE_QUERY = `
  query GetExercise($id: ID!) {
    exercise(id: $id) { # Assuming 'exercise' is the query field from your schema
      id
      title
      description
      htmlContent # Field for exercise instructions or problem statement in HTML
      # starterCode # If you have a separate field for starter Java code
      createdAt
      updatedAt
    }
  }
`;
