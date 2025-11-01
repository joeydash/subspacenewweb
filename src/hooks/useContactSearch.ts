import { useState, useCallback } from 'react';
import { useAuth } from '../../services/auth';
import { createGraphQLClient } from '../../services/graphql/client';
import { Contact } from '../../types/contact';
import { useDebounce } from '../useDebounce';

const SEARCH_CONTACTS = `
  query SearchContacts($clientId: uuid!, $search: String!) {
    vocallabs_prospects(
      where: {
        _and: [
          { client_id: { _eq: $clientId } },
          {
            _or: [
              { name: { _ilike: $search } },
              { phone: { _ilike: $search } }
            ]
          }
        ]
      }
      limit: 5
      order_by: { created_at: desc }
    ) {
      id
      name
      phone
      prospect_group {
        id
        name
      }
    }
  }
`;

export function useContactSearch() {
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { user, authToken } = useAuth();

	const searchContacts = useCallback(async (searchTerm: string) => {
		if (!user?.id || !authToken || !searchTerm.trim()) {
			setContacts([]);
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const client = createGraphQLClient(authToken);
			const { vocallabs_prospects } = await client.request(SEARCH_CONTACTS, {
				clientId: user.id,
				search: `%${searchTerm}%`,
			});
			setContacts(vocallabs_prospects);
		} catch (err) {
			setError('Failed to search contacts');
			console.error('Error searching contacts:', err);
		} finally {
			setLoading(false);
		}
	}, [user?.id, authToken]);

	const debouncedSearch = useDebounce(searchContacts, 300);

	return {
		contacts,
		loading,
		error,
		searchContacts: debouncedSearch,
	};
}