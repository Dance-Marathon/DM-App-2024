import axios from 'axios';
import { KJUR, KEYUTIL } from 'jsrsasign';
import service from './service.js';

// Hard-coded credentials (this should ideally be handled securely)
const SERVICE_ACCOUNT = service;

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

// Function to create and sign JWT
const createSignedJWT = (header, claimSet, privateKey) => {
  const sHeader = JSON.stringify(header);
  const sPayload = JSON.stringify(claimSet);
  
  const key = KEYUTIL.getKey(privateKey);

  const signedJWT = KJUR.jws.JWS.sign('RS256', sHeader, sPayload, key);

  return signedJWT;
};

// Function to get access token from Google
const getAccessToken = async () => {
  const url = 'https://oauth2.googleapis.com/token';

  const jwtHeader = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const jwtClaimSet = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: SCOPE,
    aud: SERVICE_ACCOUNT.token_uri,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
    iat: Math.floor(Date.now() / 1000),
  };

  const signedJWT = createSignedJWT(jwtHeader, jwtClaimSet, SERVICE_ACCOUNT.private_key);

  const params = new URLSearchParams();
  params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  params.append('assertion', signedJWT);

  const response = await axios.post(url, params);

  return response.data.access_token;
};

export default getAccessToken;
