/**
 * Only reachable from the server flask-app is the compose service name
 */
export const API_URL = process.env.API_URL ?? "http://flask-app:8000";
