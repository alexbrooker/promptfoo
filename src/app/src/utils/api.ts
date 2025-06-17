import { supabase } from '@app/lib/supabase';
import useApiConfig from '@app/stores/apiConfig';

export async function callApi(path: string, options: RequestInit = {}): Promise<Response> {
  const { apiBaseUrl } = useApiConfig.getState();
  return fetch(`${apiBaseUrl}/api${path}`, options);
}

export async function callAuthenticatedApi(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const { apiBaseUrl } = useApiConfig.getState();

  // Get the current session token
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('User not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(`${apiBaseUrl}/api${path}`, {
    ...options,
    headers,
  });
}

export async function fetchUserEmail(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email || null;
  } catch (error) {
    console.error('Error fetching user email:', error);
    return null;
  }
}

export async function updateEvalAuthor(evalId: string, author: string) {
  const response = await callApi(`/eval/${evalId}/author`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ author }),
  });

  if (!response.ok) {
    throw new Error('Failed to update eval author');
  }

  return response.json();
}
