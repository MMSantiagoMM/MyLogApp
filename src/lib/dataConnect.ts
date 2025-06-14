// src/lib/dataConnect.ts
'use server'; // Can be used in Server Components/Actions if needed, but queries are often client-side too

const DATA_CONNECT_ENDPOINT = process.env.NEXT_PUBLIC_DATA_CONNECT_ENDPOINT;

if (!DATA_CONNECT_ENDPOINT || DATA_CONNECT_ENDPOINT.includes("YOUR_CONNECTOR_ID")) {
  console.warn(
    `Firebase Data Connect endpoint is not configured or uses a placeholder. 
     Please set NEXT_PUBLIC_DATA_CONNECT_ENDPOINT in your .env file with your actual connector ID.
     Current value: ${DATA_CONNECT_ENDPOINT}`
  );
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
    throw new Error("Firebase Data Connect endpoint is not properly configured. See server logs for details.");
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
      console.error('GraphQL query failed:', result.errors || response.statusText);
      const errorMessages = result.errors?.map(e => e.message).join(', ') || response.statusText;
      throw new Error(`GraphQL request failed: ${errorMessages}`);
    }

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      const errorMessages = result.errors.map(e => e.message).join(', ');
      throw new Error(`GraphQL query returned errors: ${errorMessages}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error executing GraphQL query:', error);
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

// Example of how you might call these (conceptual, for use in components):
/*
async function fetchVideosFromDataConnect() {
  try {
    const response = await executeGraphQLQuery<{ videos: VideoData[] }>(GET_VIDEOS_QUERY);
    return response?.videos || [];
  } catch (error) {
    console.error("Failed to fetch videos:", error);
    return [];
  }
}

async function fetchHtmlSnippetCode(snippetId: string) {
  try {
    const response = await executeGraphQLQuery<{ htmlSnippet: HTMLSnippetData }>(
      GET_HTML_SNIPPET_QUERY,
      { id: snippetId }
    );
    return response?.htmlSnippet;
  } catch (error) {
    console.error(`Failed to fetch HTML snippet ${snippetId}:`, error);
    return null;
  }
}
*/
