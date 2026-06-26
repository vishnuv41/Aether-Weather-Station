import axios from "axios";

/** Plain axios instance — base URL is set per-call since it changes with connection mode. */
export const http = axios.create({ timeout: 8000 });
