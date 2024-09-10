import axios from 'axios';
import { KJUR, KEYUTIL } from 'jsrsasign';

// Hard-coded credentials (this should ideally be handled securely)
const SERVICE_ACCOUNT = {
    "type": "service_account",
    "project_id": "dm-app-2024",
    "private_key_id": "f04ed2a23692f656d8c596899ec889606e9b5265",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCnUcRPxbjH4BAF\nU8Pxr4A0vgjhqUnRKKIW1e3vp6LFCc/ke6P95YkIq66YUxYe/Dp6FNFm+PBbVtu3\nZuEOxCh1lfli1fRuRkRMeIYdFlX3jZBzz6JLb8LIGJhihn0r0fUsr/0kcPQbb2D1\nmI9Fg91R5l4UYNol1zGg7qyFVOrIC9SHJJ0zaI+hwBZDFgSmzMbDTdL6xrXrDfNL\nAa1CXyapQirWoND4nSAWgHoYUyLHKZLjeJUhewqXyfaQ0h5gA2QcX0uiC0eZNeQC\nIi+F+sH8lnPSHeU68k9neQnfTuFyeSZx1Ji0IOQUmqiwBAeYLZdfRVTc+REVbeee\nMrhcjejJAgMBAAECggEAAjReGUz6H8wQefl+Ee+liUxdspd37QUTiah875TuXJlB\n/3kvkndVRGN6s/AYUQUywgwHLEuoYxO0Zmi5G2gzPkVhGU/HXjKX0MgfwD9cl5vq\nZNQ+B69ryhYk39t0x8CG8fVJqRLB7KCdju7ZKGnR3zPhVnRmO2xn735lkIYrZ8JW\nqQYBKyDAjVvTOCt+M8hHAfp6EazuB3sB/A8QZsvMsu+tIobvMc7dggQcKUJx2/mN\nM93Yvrc1lvtyDK2Ogq5y0jXHOcqX+7GI/ndOY8KwMVZE1sa2CMr3xqqnhLbSYTpy\nc9b/GEyRNh3e4877S9y6nd/zQKg1YHp7C++uqmUMdwKBgQDmC2T25Aixp5X7PKE/\ngX9WX4SHrn+7GA0ILUKxRF6TzEOzPZZtYoG+twYp4UBo3s+U5qnpltx6Nnx6yAFl\nJNzr/SgpIF98UUmB4pKkrzYWCK7LA0VHfPduMvOgRepWic8atcDSvIVlDW1sv5vr\niAMHjzLIpVAG7+fQvdFhGuwkxwKBgQC6Mp7VQsxSKOUBYdp/GQFPHAuwWSyIj/2q\n6UG9CMOAtXPY7V17h0QNECM/WuoTKxVOpqs1h18tc4ZlXVByAhelI1YifGNf39uT\nyAOBCSUJoQ20D3YYxm29ltIkj6gcA9el9g1FNmkX82/v/X1Gpw+W5bHch0YCYguk\nBRMLCpLV7wKBgQCxKDk6wOXJGowwDMMJCwsrUyfW7ZVEWgM/NsvThBlprLa+REGi\nP2g3nO9MNUHLATvPKcvULe/g1jEKxRf98mOIAU96TIn8TQVU102jMaNvWIRzpzMl\nGKHb5bUkynLq7fnmUe4K3E/GQI7yXqUOv5HFsoujZVu52+skH+os4/TTZQKBgFDa\nLlJYoTSEAX0qKqDKEOFzQjgfYNEkBXiztRIKviojoNxvpgo/4HLzsPqP1djg+m2e\nvfWOhOvNoGxfqtD2y6GvyHVNIjG9mTGAxtS/Tc/ymWq41AVKFNkgprutjcgsevXb\n9EM7r0LxOIgzwLRvUrupniQusV3TiU59zZkbzEsNAoGADecskXvPuUR/QHqzDXf9\nbKtGDyfn5XoQmMd+W8JkcpvfXQOda9TnH9P8vNh1z1bKH4/nGfVZhKrxY174HVNt\nmrkuL17roJcn6eziW0puxa0A7dZ7jmT56dblOGzyeyeFvecEAoIRWIk31v+VQrXj\nSG9s8y1d15sx2z0nBA4mv3c=\n-----END PRIVATE KEY-----\n",
    "client_email": "dm-app-2024@appspot.gserviceaccount.com",
    "client_id": "118238785753465397762",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/dm-app-2024%40appspot.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  }
  ;

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
