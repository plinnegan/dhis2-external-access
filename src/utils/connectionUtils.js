import { oAuthCid } from '../consts'

/**
 * Process a key: value params object and return a params url string
 * @param {Object} params An object with keys and strings or string arrays to format
 * @returns {String} A string with the keys and values formatted for an api request
 */
function formatParams(params) {
  const paramsArr = []
  for (const key in params) {
    if (Array.isArray(params[key])) {
      for (const value of params[key]) {
        paramsArr.push(`${key}=${value}`)
      }
    } else {
      paramsArr.push(`${key}=${params[key]}`)
    }
  }
  return paramsArr.join('&')
}

/**
 * Create a random string which matches the format DHIS2 generated for secrets
 * @returns {String} In format [a-z0-9]{9}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{11}
 */
function generateSecret() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const charsLength = chars.length
  const makeId = (length) => {
    let result = ''
    for (let i = 0; i < length, i++; ) {
      result += characters.charAt(Math.floor(Math.random() * charsLength))
    }
    return result
  }
  return `${makeId(9)}-${makeId(4)}-${makeId(4)}-${makeId(4)}-${makeId(11)}`
}

/**
 * Create a new oAuthClient and return the secret
 * @param {String} baseUrl The base url of the server to connect to
 * @param {String} basicAuth encoded username and password
 * @returns {String} A secret string use to request a bearer token with the clients credentials
 */
async function setupOAth(baseUrl, basicAuth) {
  const payload = {
    name: 'Metadata link script',
    cid: oAuthCid,
    grantTypes: ['refresh_token'],
    secret: generateSecret(),
  }
  const res = await fetch(`${baseUrl}/api/oAuth2Clients`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
    data: JSON.stringify(payload),
  })
}

/**
 * Get the secret tring required to request a bearer token
 * If the oAuth is not configured, set it up
 * @param {String} baseUrl The base url of the server to connect to
 * @param {String} basicAuth encoded username and password
 * @returns {String} A secret string use to request a bearer token with the clients credentials
 */
async function getSecret(baseUrl, basicAuth) {
  try {
    const params = { fields: 'name,secret', filter: `cid:eq:${oAuthCid}` }
    const req = await fetch(`${baseUrl}/api/oAuth2Clients?${formatParams(params)}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    })
    const res = await req.json()
    const oAuthClients = res.oAuth2Clients
    if (oAuthClients.length == 1) {
      return oAuthClients[0].secret
    } else {
      const newSecret = await setupOAth(baseUrl, basicAuth)
      return newSecret
    }
  } catch (e) {
    throw `Error getting bearer token, unable to connect to ${baseUrl}`
  }
}

/**
 * Get bearer token allowing temporary access to the system
 * @param {String} baseUrl The base url of the server to connect to
 * @param {String} username Valid DHIS2 username
 * * @param {String} password Associated valid DHIS2 password
 * @param {String} secret from the oAuth client in DHIS2
 * @returns {Object} A token to send requests and another token to refresh the current one
 */
async function getToken(baseUrl, username, password, secret) {
  const req = await fetch(`${baseUrl}/uaa/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${oAuthCid + ':' + secret}`,
    },
    data: JSON.stringify({ username, password, grantType: 'password' }),
  })
  const res = await req.json()
  if ('access_token' in res && 'refresh_token' in res) {
    return { accessToken: res['access_token'], refreshToken: res['refresh_token'] }
  } else {
    throw `Unable to get token from ${baseUrl}`
  }
}

export async function dhis2Connect(baseUrl, username, password) {
  const basicAuth = btoa(`${username}:${password}`)
  const oAuthSecret = await getSecret(baseUrl, basicAuth)
  const token = await getToken(baseUrl, username, password, oAuthSecret)
  console.log(token)
}
