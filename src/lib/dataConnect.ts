
"use server";

import type { Video as DataConnectVideo } from '@/lib/data';

const DATA_CONNECT_ENDPOINT = process.env.NEXT_PUBLIC_DATA_CONNECT_ENDPOINT;

if (!DATA_CONNECT_ENDPOINT || DATA_CONNECT_ENDPOINT.includes("YOUR_CONNECTOR_ID")) {
    console.warn(
      "[DataConnect] The Data Connect endpoint is not configured. " +
      "Please set NEXT_PUBLIC_DATA_CONNECT_ENDPOINT in your .env file."
    );
}

export const GET_VIDEOS_QUERY = `
  query GetVideos {
    videos {
      id
      title
      url
      description
      createdAt
    }
  }
`;

export async function executeGraphQLQuery<T>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  if (!DATA_CONNECT_ENDPOINT || DATA_CONNECT_ENDPOINT.includes("YOUR_CONNECTOR_ID")) {
    const configError = new Error(
      "Firebase Data Connect is not configured. Please check your NEXT_PUBLIC_DATA_CONNECT_ENDPOINT environment variable."
    );
    console.error("[DataConnect] " + configError.message);
    throw configError;
  }

  try {
    const response = await fetch(DATA_CONNECT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[DataConnect] GraphQL request failed with status ${response.status}:`, errorBody);
        throw new Error(`The server responded with status ${response.status}. Check the server logs for more details.`);
    }

    const jsonResponse = await response.json();
    if (jsonResponse.errors) {
        console.error('[DataConnect] GraphQL Errors:', jsonResponse.errors);
        throw new Error(`GraphQL query failed: ${jsonResponse.errors.map((e: any) => e.message).join(', ')}`);
    }

    return jsonResponse.data;
  } catch (error: any) {
    console.error('[DataConnect] Failed to execute GraphQL query:', error);
    // Enhance the generic "Failed to fetch" error with a more helpful message
    if (error.message.includes("Failed to fetch")) {
        throw new Error(
            "A network error occurred (Failed to fetch). This is often a CORS configuration issue. " +
            "Please ensure that the domain your app is running on (like localhost) is added to the list of allowed origins " +
            "for your HTTP Cloud Function or service associated with your Data Connect endpoint. " +
            "Check your Google Cloud project's settings."
        );
    }
    throw error;
  }
}
