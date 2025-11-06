export interface PrivacySettings {
  hide_phone_number: boolean;
  hide_email_id: boolean;
}

export const fetchPrivacySettings = async (authToken: string, userId: string): Promise<PrivacySettings> => {
  const response = await fetch('https://db.subspace.money/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      query: `
        query Query($user_id: uuid) {
          __typename
          whatsub_privacy_settings(where: {user_id: {_eq: $user_id}}) {
            __typename
            hide_phone_number
            hide_email_id
          }
        }
      `,
      variables: {
        user_id: userId
      }
    })
  });

  const data = await response.json();

  if (data.errors) {
    throw new Error('Failed to load privacy settings. Please try again.');
  }

  if (data.data?.whatsub_privacy_settings?.[0]) {
    return data.data.whatsub_privacy_settings[0];
  }

  // Return default values if no settings found
  return {
    hide_phone_number: false,
    hide_email_id: false
  };
};

export const updatePrivacySettings = async (
  authToken: string,
  userId: string,
  hidePhoneNumber: boolean,
  hideEmailId: boolean
): Promise<boolean> => {
  const response = await fetch('https://db.subspace.money/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      query: `
        mutation UpdatePrivacySettings($user_id: uuid!, $hide_phone_number: Boolean, $hide_email_id: Boolean) {
          __typename
          insert_whatsub_privacy_settings(
            objects: {
              user_id: $user_id, 
              hide_phone_number: $hide_phone_number, 
              hide_email_id: $hide_email_id
            },
            on_conflict: {
              constraint: whatsub_privacy_settings_user_id_key,
              update_columns: [hide_phone_number, hide_email_id]
            }
          ) {
            __typename
            affected_rows
          }
        }
      `,
      variables: {
        user_id: userId,
        hide_phone_number: hidePhoneNumber,
        hide_email_id: hideEmailId
      }
    })
  });

  const data = await response.json();

  if (data.errors) {
    throw new Error('Failed to update privacy settings');
  }

  return data.data?.insert_whatsub_privacy_settings?.affected_rows > 0;
};
